/**
 * «كراسة المعمل»: the student's notes, drawings and experiments for this lesson, kept in
 * localStorage. Everything read back is untrusted: it is rebuilt field by field with plain
 * strings and clamped numbers, never rendered as HTML.
 */

export const NOTEBOOK_VERSION = 1;
export const NOTEBOOK_KEY = "labx.notebook.v1";
export const MAX_ENTRIES = 150;
export const MAX_TEXT = 1200;
export const MAX_TITLE = 80;
export const MAX_VALUES = 40;

export type NotebookKind = "note" | "drawing" | "experiment";

export interface NotebookDrawing {
  /** `labels`: callout id → label group the student placed; `curve`: sampled values 0–100. */
  type: "labels" | "curve";
  figure?: string;
  placed?: Record<string, string>;
  values?: number[];
}

export interface NotebookEntry {
  id: string;
  at: number;
  block: number;
  kind: NotebookKind;
  title: string;
  text: string;
  drawing?: NotebookDrawing;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Plain text only: no control characters, no angle brackets, bounded length. */
export function cleanText(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return (
    v
      // eslint-disable-next-line no-control-regex -- stripping control characters is the point
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F<>]/g, "")
      .trim()
      .slice(0, max)
  );
}

const ID = /^[a-z0-9_-]{1,40}$/i;
const KEY = /^[a-z0-9_-]{1,40}$/i;

function sanitizeDrawing(raw: unknown): NotebookDrawing | undefined {
  if (!isRecord(raw)) return undefined;
  const type = raw["type"] === "curve" ? "curve" : raw["type"] === "labels" ? "labels" : null;
  if (!type) return undefined;
  const out: NotebookDrawing = { type };
  const figure = cleanText(raw["figure"], 40);
  if (figure && KEY.test(figure)) out.figure = figure;
  if (type === "labels" && isRecord(raw["placed"])) {
    const placed: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw["placed"]).slice(0, 30)) {
      if (k === "__proto__" || !KEY.test(k) || typeof v !== "string" || !KEY.test(v)) continue;
      placed[k] = v;
    }
    out.placed = placed;
  }
  if (type === "curve" && Array.isArray(raw["values"])) {
    out.values = raw["values"]
      .slice(0, MAX_VALUES)
      .map((x) =>
        typeof x === "number" && Number.isFinite(x) ? Math.min(100, Math.max(0, Math.round(x))) : 0,
      );
  }
  return out;
}

export function sanitizeNotebook(raw: unknown): NotebookEntry[] {
  if (!isRecord(raw) || raw["v"] !== NOTEBOOK_VERSION || !Array.isArray(raw["entries"])) return [];
  const out: NotebookEntry[] = [];
  const seen = new Set<string>();
  for (const item of raw["entries"].slice(0, MAX_ENTRIES)) {
    if (!isRecord(item)) continue;
    const id = typeof item["id"] === "string" && ID.test(item["id"]) ? item["id"] : null;
    if (!id || seen.has(id)) continue;
    const block = item["block"];
    const kind = item["kind"];
    if (typeof block !== "number" || !Number.isInteger(block) || block < 1 || block > 14) continue;
    if (kind !== "note" && kind !== "drawing" && kind !== "experiment") continue;
    const at =
      typeof item["at"] === "number" && Number.isFinite(item["at"]) ? Math.max(0, item["at"]) : 0;
    const title = cleanText(item["title"], MAX_TITLE);
    const text = cleanText(item["text"], MAX_TEXT);
    const drawing = sanitizeDrawing(item["drawing"]);
    if (!title && !text && !drawing) continue;
    seen.add(id);
    out.push({ id, at, block, kind, title, text, ...(drawing ? { drawing } : {}) });
  }
  return out;
}

export function newEntryId(now: number, n: number): string {
  return `e${now.toString(36)}${n.toString(36)}`.slice(0, 40);
}

/** Adds (or replaces, when `id` exists) an entry, keeping the newest MAX_ENTRIES. */
export function upsertEntry(
  entries: readonly NotebookEntry[],
  entry: NotebookEntry,
): NotebookEntry[] {
  const clean = sanitizeNotebook({ v: NOTEBOOK_VERSION, entries: [entry] })[0];
  if (!clean) return entries.slice();
  const rest = entries.filter((e) => e.id !== clean.id);
  return [clean, ...rest].sort((a, b) => b.at - a.at).slice(0, MAX_ENTRIES);
}

export function removeEntry(entries: readonly NotebookEntry[], id: string): NotebookEntry[] {
  return entries.filter((e) => e.id !== id);
}

export function loadNotebook(storage: Pick<Storage, "getItem"> | null): NotebookEntry[] {
  try {
    const text = storage?.getItem(NOTEBOOK_KEY);
    return text ? sanitizeNotebook(JSON.parse(text) as unknown) : [];
  } catch {
    return [];
  }
}

export function saveNotebook(
  storage: Pick<Storage, "setItem"> | null,
  entries: readonly NotebookEntry[],
) {
  try {
    storage?.setItem(NOTEBOOK_KEY, JSON.stringify({ v: NOTEBOOK_VERSION, entries }));
    return true;
  } catch {
    return false;
  }
}
