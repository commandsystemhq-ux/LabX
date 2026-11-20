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
