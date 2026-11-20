import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_HISTORY_TURNS, MAX_SUMMARY_CHARS, MAX_TURN_CHARS } from "./ai-config";

/**
 * Noor's conversation memory: persistence (localStorage for guests and as a backup, one RLS-protected
 * `noor_conversations` row per signed-in account) and the compact context sent with each AI request.
 * Everything read back from storage is untrusted and passes through `sanitizeChat`.
 */

export type ChatRole = "student" | "noor";
export interface StoredMessage {
  role: ChatRole;
  text: string;
}
export interface ChatSnapshot {
  updatedAt: number;
  messages: StoredMessage[];
}

export const MAX_STORED_MESSAGES = 60;
const MAX_STORED_TEXT = 4000;
const SAVE_DELAY_MS = 1000;

export function sanitizeChat(raw: unknown): StoredMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: StoredMessage[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const { role, text } = item as { role?: unknown; text?: unknown };
    if ((role !== "student" && role !== "noor") || typeof text !== "string") continue;
    const clean = text.trim().slice(0, MAX_STORED_TEXT);
    if (clean) out.push({ role, text: clean });
  }
  return out.slice(-MAX_STORED_MESSAGES);
}

/** Never a shared key between accounts, and guests have their own. */
export const chatKey = (userId: string | null) => `labx.noor.chat.v1:${userId ?? "guest"}`;

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadLocalChat(userId: string | null, store: Storage | null = storage()) {
  try {
    const raw = store?.getItem(chatKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { updatedAt?: unknown; messages?: unknown } | null;
    const messages = sanitizeChat(parsed?.messages);
    const updatedAt = typeof parsed?.updatedAt === "number" ? parsed.updatedAt : 0;
    return { updatedAt, messages } satisfies ChatSnapshot;
  } catch {
    return null;
  }
}

export function saveLocalChat(
  userId: string | null,
  snapshot: ChatSnapshot,
  store: Storage | null = storage(),
) {
  try {
    if (snapshot.messages.length === 0) store?.removeItem(chatKey(userId));
    else store?.setItem(chatKey(userId), JSON.stringify(snapshot));
  } catch {
    /* storage full / blocked: the in-memory conversation still works */
  }
}

/** The conversation saved on the account, or null (no row, no table yet, offline). */
export async function fetchRemoteChat(
  client: SupabaseClient,
  userId: string,
): Promise<ChatSnapshot | null> {
  try {
    const { data, error } = await client
      .from("noor_conversations")
      .select("messages, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as { messages?: unknown; updated_at?: unknown };
    const at = typeof row.updated_at === "string" ? Date.parse(row.updated_at) : 0;
    return { updatedAt: Number.isFinite(at) ? at : 0, messages: sanitizeChat(row.messages) };
  } catch {
    return null;
  }
}

/** Debounced upserts of the account's conversation; flushed when the page is hidden. */
export function createRemoteChatSaver(client: SupabaseClient, userId: string) {
  let pending: ChatSnapshot | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  const flush = async () => {
    if (timer) clearTimeout(timer);
    timer = null;
    const snap = pending;
    if (!snap) return;
    pending = null;
    try {
      const { error } = await client.from("noor_conversations").upsert({
        user_id: userId,
        messages: snap.messages,
        updated_at: new Date(snap.updatedAt).toISOString(),
      });
      if (error) pending ??= snap; // retried with the next change
    } catch {
      pending ??= snap;
    }
  };

  const onHide = () => {
    if (document.visibilityState === "hidden") void flush();
  };
  const onPageHide = () => void flush();
  if (typeof window !== "undefined") {
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
  }

  return {
    schedule(snapshot: ChatSnapshot) {
      if (disposed) return;
      pending = snapshot;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void flush(), SAVE_DELAY_MS);
    },
    flush,
    dispose() {
      if (disposed) return;
      void flush();
      disposed = true;
      if (typeof window !== "undefined") {
        document.removeEventListener("visibilitychange", onHide);
        window.removeEventListener("pagehide", onPageHide);
      }
    },
  };
}

const oneLine = (s: string, max: number) => {
  const flat = s
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
};

/**
 * What the server gets with a new question: the latest turns verbatim plus a compact digest of
 * everything older (questions kept, answers cut to their first sentence), newest first-priority
 * within the size budget. Deterministic and free: no extra AI call.
 */
export function chatContext(messages: StoredMessage[]): {
  history: StoredMessage[];
  summary?: string;
} {
  const recent = messages.slice(-MAX_HISTORY_TURNS);
  const older = messages.slice(0, messages.length - recent.length);
  const history = recent.map((m) => ({ role: m.role, text: m.text.slice(0, MAX_TURN_CHARS) }));

  const lines: string[] = [];
  let used = 0;
  for (let i = older.length - 1; i >= 0; i--) {
    const m = older[i]!;
    const line =
      m.role === "student"
        ? `Student: ${oneLine(m.text, 110)}`
        : `Noor: ${oneLine(m.text.split(/[.!?؟\n]/)[0] ?? m.text, 90)}`;
    if (used + line.length + 3 > MAX_SUMMARY_CHARS) break;
    lines.unshift(line);
    used += line.length + 3;
  }
  return lines.length ? { history, summary: lines.join(" | ") } : { history };
}

/** The more recently updated snapshot; the account's wins a tie. */
export function pickNewer(local: ChatSnapshot | null, remote: ChatSnapshot | null) {
  if (!local) return remote;
  if (!remote) return local;
  return local.updatedAt > remote.updatedAt ? local : remote;
}

/* ------------------------------------------------------------------------------------------ */
/* Saved conversations: saved by hand with "Save chat", listed, reopened or deleted.          */
/* Signed-in: one `noor_saved_chats` row each (RLS: owner only). Guests: localStorage, which   */
/* is also the fallback when the account table isn't reachable.                               */
/* ------------------------------------------------------------------------------------------ */

export const MAX_SAVED_CHATS = 30;
const MAX_TITLE = 80;
const SHORT_TITLE = 48;
const SAVED_ID_RE = /^[A-Za-z0-9-]{1,64}$/;

export interface SavedChat {
  id: string;
  title: string;
  savedAt: number;
  messages: StoredMessage[];
}

/** Ids created on this device (the account's rows use database uuids). */
export const isLocalSavedId = (id: string) => id.startsWith("l-");
export const newLocalSavedId = () =>
  `l-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** Short automatic title: the student's first question, flattened and cut at a word boundary. */
export function makeChatTitle(messages: StoredMessage[], fallback: string): string {
  const first = (messages.find((m) => m.role === "student") ?? messages[0])?.text ?? "";
  const flat = first
    .replace(/[*_`#>[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!flat) return fallback;
  if (flat.length <= SHORT_TITLE) return flat;
  const cut = flat.slice(0, SHORT_TITLE);
  const space = cut.lastIndexOf(" ");
  return `${(space > SHORT_TITLE / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/** Everything read from storage or the database is untrusted: ids, titles and messages are rebuilt. */
export function sanitizeSaved(raw: unknown): SavedChat[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: SavedChat[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const { id, title, savedAt, messages } = item as Record<string, unknown>;
    if (typeof id !== "string" || !SAVED_ID_RE.test(id) || seen.has(id)) continue;
    const clean = sanitizeChat(messages);
    if (clean.length === 0) continue;
    const name = (typeof title === "string" ? title : "").replace(/\s+/g, " ").trim();
    seen.add(id);
    out.push({
      id,
      title: name.slice(0, MAX_TITLE) || makeChatTitle(clean, "—"),
      savedAt: typeof savedAt === "number" && Number.isFinite(savedAt) ? savedAt : 0,
      messages: clean,
    });
  }
  return out.sort((a, b) => b.savedAt - a.savedAt).slice(0, MAX_SAVED_CHATS);
}

export const savedKey = (userId: string | null) => `labx.noor.saved.v1:${userId ?? "guest"}`;

export function loadLocalSaved(userId: string | null, store: Storage | null = storage()) {
  try {
    const raw = store?.getItem(savedKey(userId));
    return raw ? sanitizeSaved((JSON.parse(raw) as { chats?: unknown } | null)?.chats) : [];
  } catch {
    return [];
  }
}

/** False when the browser refused the write (storage full or blocked). */
export function saveLocalSaved(
  userId: string | null,
  chats: SavedChat[],
  store: Storage | null = storage(),
) {
  try {
    if (!store) return false;
    if (chats.length === 0) store.removeItem(savedKey(userId));
    else store.setItem(savedKey(userId), JSON.stringify({ chats }));
    return true;
  } catch {
    return false;
  }
}

/** The account's saved chats, or null when the table can't be read (not created yet, offline). */
export async function fetchRemoteSaved(
  client: SupabaseClient,
  userId: string,
): Promise<SavedChat[] | null> {
  try {
    const { data, error } = await client
      .from("noor_saved_chats")
      .select("id, title, messages, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(MAX_SAVED_CHATS);
    if (error || !Array.isArray(data)) return null;
    return sanitizeSaved(
      data.map((r: Record<string, unknown>) => ({
        id: r["id"],
        title: r["title"],
        messages: r["messages"],
        savedAt: typeof r["created_at"] === "string" ? Date.parse(r["created_at"]) : 0,
      })),
    );
  } catch {
    return null;
  }
}

/** "limit" = the row-level policy refused (too many saved chats); null = unreachable. */
export async function insertRemoteSaved(
  client: SupabaseClient,
  userId: string,
  title: string,
  messages: StoredMessage[],
): Promise<SavedChat | "limit" | null> {
  try {
    const { data, error } = await client
      .from("noor_saved_chats")
      .insert({ user_id: userId, title, messages })
      .select("id, created_at")
      .single();
    if (error) return error.code === "42501" ? "limit" : null;
    const row = data as { id?: unknown; created_at?: unknown };
    const [saved] = sanitizeSaved([
      {
        id: row.id,
        title,
        messages,
        savedAt: typeof row.created_at === "string" ? Date.parse(row.created_at) : Date.now(),
      },
    ]);
    return saved ?? null;
  } catch {
    return null;
  }
}

export async function deleteRemoteSaved(client: SupabaseClient, userId: string, id: string) {
  try {
    const { error } = await client
      .from("noor_saved_chats")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    return !error;
  } catch {
    return false;
  }
}
