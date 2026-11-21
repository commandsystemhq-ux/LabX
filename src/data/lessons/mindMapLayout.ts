import type { Lang } from "@/lib/i18n";
import type { MindMapNode } from "./supportTypes";

/**
 * Pure geometry + quiz logic of the interactive mind map (no React). The Lab only renders what this
 * module computes: horizontal tidy-tree layout, curved edges, camera maths, search, and the
 * «blank grid» recall mode (options, answer matching, grading).
 */

/* --------------------------------- layout --------------------------------- */

export const MM = {
  ROOT_PAD: 28,
  GAP_X: 76,
  GAP_Y: 14,
  MIN_W: 124,
  MAX_W: 250,
  CHAR_W: 9,
  LINE_H: 20,
  PAD_Y: 20,
  BADGE_H: 16,
  MAX_LINES: 3,
  BLANK_W: 210,
  BLANK_H: 58,
  TOGGLE_R: 11,
} as const;

export interface Size {
  w: number;
  h: number;
}

/** Width/height of a node from its label (wraps to at most three lines). */
export function measureNode(node: MindMapNode, lang: Lang): Size {
  const label = node.title[lang];
  const w = Math.min(MM.MAX_W, Math.max(MM.MIN_W, Math.ceil(label.length * MM.CHAR_W) + 40));
  const perLine = Math.max(6, Math.floor((w - 32) / MM.CHAR_W));
  const lines = Math.min(MM.MAX_LINES, Math.max(1, Math.ceil(label.length / perLine)));
  const badge = node.badge?.[lang] ? MM.BADGE_H : 0;
  return { w, h: lines * MM.LINE_H + badge + MM.PAD_Y };
}

export interface PlacedNode {
  id: string;
  node: MindMapNode;
  depth: number;
  parentId: string | null;
  /** Top-left corner. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** The node has children in the data (so it gets a toggle button). */
  hasChildren: boolean;
  expanded: boolean;
}

export interface MindMapLayout {
  nodes: PlacedNode[];
  byId: ReadonlyMap<string, PlacedNode>;
  width: number;
  height: number;
  rtl: boolean;
}

export interface LayoutOptions {
  lang?: Lang;
  /** Root on the right, branches growing to the left (Arabic). Defaults to `lang === "ar"`. */
  rtl?: boolean;
  measure?: (node: MindMapNode, depth: number) => Size;
}

interface Slot {
  node: MindMapNode;
  depth: number;
  size: Size;
  kids: Slot[];
  span: number;
  cy: number;
}

/**
 * Horizontal tidy tree. Every visible node gets a rectangle; siblings never share vertical space and
 * columns are aligned per depth, so no two rectangles can overlap.
 */
export function layoutMindMapTree(
  root: MindMapNode,
  expanded: ReadonlySet<string>,
  opts: LayoutOptions = {},
): MindMapLayout {
  const lang = opts.lang ?? "ar";
  const rtl = opts.rtl ?? lang === "ar";
  const measure = opts.measure ?? ((n: MindMapNode) => measureNode(n, lang));

  const build = (node: MindMapNode, depth: number): Slot => {
    const open = expanded.has(node.id) && (node.children?.length ?? 0) > 0;
    const kids = open ? (node.children ?? []).map((c) => build(c, depth + 1)) : [];
    const size = measure(node, depth);
    const kidsTotal =
      kids.reduce((s, k) => s + k.span, 0) + Math.max(0, kids.length - 1) * MM.GAP_Y;
    return { node, depth, size, kids, span: Math.max(size.h, kidsTotal), cy: 0 };
  };
  const tree = build(root, 0);

  const colW: number[] = [];
  const scan = (s: Slot) => {
    colW[s.depth] = Math.max(colW[s.depth] ?? 0, s.size.w);
    s.kids.forEach(scan);
  };
  scan(tree);
  const colX: number[] = [];
  colW.forEach((w, d) => {
    colX[d] = d === 0 ? MM.ROOT_PAD : (colX[d - 1] ?? 0) + (colW[d - 1] ?? 0) + MM.GAP_X;
  });
  const last = colW.length - 1;
  const width = (colX[last] ?? 0) + (colW[last] ?? 0) + MM.ROOT_PAD;
  const height = tree.span + MM.ROOT_PAD * 2;

  const place = (s: Slot, top: number) => {
    if (s.kids.length === 0) {
      s.cy = top + s.span / 2;
      return;
    }
    const total = s.kids.reduce((a, k) => a + k.span, 0) + (s.kids.length - 1) * MM.GAP_Y;
    let y = top + (s.span - total) / 2;
    for (const k of s.kids) {
      place(k, y);
      y += k.span + MM.GAP_Y;
    }
    const mid = ((s.kids[0]?.cy ?? 0) + (s.kids[s.kids.length - 1]?.cy ?? 0)) / 2;
    s.cy = Math.min(top + s.span - s.size.h / 2, Math.max(top + s.size.h / 2, mid));
  };
  place(tree, MM.ROOT_PAD);

  const nodes: PlacedNode[] = [];
  const emit = (s: Slot, parentId: string | null) => {
    const left = colX[s.depth] ?? 0;
    nodes.push({
      id: s.node.id,
      node: s.node,
      depth: s.depth,
      parentId,
      x: rtl ? width - left - s.size.w : left,
      y: s.cy - s.size.h / 2,
      w: s.size.w,
      h: s.size.h,
      hasChildren: (s.node.children?.length ?? 0) > 0,
      expanded: s.kids.length > 0,
    });
    s.kids.forEach((k) => emit(k, s.node.id));
  };
  emit(tree, null);

  return { nodes, byId: new Map(nodes.map((n) => [n.id, n])), width, height, rtl };
}

/** Cubic Bezier from the side of `parent` that faces its children to the near side of `child`. */
export function edgePath(parent: PlacedNode, child: PlacedNode, rtl: boolean): string {
  const x1 = rtl ? parent.x : parent.x + parent.w;
  const x2 = rtl ? child.x + child.w : child.x;
  const y1 = parent.y + parent.h / 2;
  const y2 = child.y + child.h / 2;
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

/** Centre of the expand/collapse circle of `p` (on the edge facing its children). */
export function togglePoint(p: PlacedNode, rtl: boolean): { x: number; y: number } {
  const off = MM.TOGGLE_R + 6;
  return { x: rtl ? p.x - off : p.x + p.w + off, y: p.y + p.h / 2 };
}

/* ------------------------------ tree helpers ------------------------------ */

/** Ids of every node that has children. */
export function branchIds(root: MindMapNode): string[] {
  const out: string[] = [];
  const walk = (n: MindMapNode) => {
    if (n.children?.length) {
      out.push(n.id);
      n.children.forEach(walk);
    }
  };
  walk(root);
  return out;
}

/** Root → … → parent of `id` (excluding `id`). Empty when `id` is the root or unknown. */
export function ancestorIds(root: MindMapNode, id: string): string[] {
  const path: string[] = [];
  const walk = (n: MindMapNode, trail: string[]): boolean => {
    if (n.id === id) {
      path.push(...trail);
      return true;
    }
    return (n.children ?? []).some((c) => walk(c, [...trail, n.id]));
  };
  walk(root, []);
  return path;
}

export function flattenTree(
  root: MindMapNode,
): { node: MindMapNode; depth: number; parentId: string | null }[] {
  const out: { node: MindMapNode; depth: number; parentId: string | null }[] = [];
  const walk = (n: MindMapNode, depth: number, parentId: string | null) => {
    out.push({ node: n, depth, parentId });
    n.children?.forEach((c) => walk(c, depth + 1, n.id));
  };
  walk(root, 0, null);
  return out;
}

/* --------------------------- text normalisation --------------------------- */

const DIACRITICS = /[\u064B-\u065F\u0670\u0640]/g;

/** Arabic/English-insensitive form used for search and answer matching. */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(DIACRITICS, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PREFIXES = ["وال", "بال", "فال", "كال", "لل", "ال"];
/** Word stem good enough to match «الأربطة» with «بالأربطة» / «للعمود» with «العمود». */
export function stemWord(w: string): string {
  const t = normalizeText(w);
  for (const p of PREFIXES) {
    if (t.startsWith(p) && t.length - p.length >= 2) return t.slice(p.length);
  }
  return t.length > 3 && /s$/.test(t) && /^[a-z]+$/.test(t) ? t.slice(0, -1) : t;
}

export function stemTokens(s: string): string[] {
  return normalizeText(s).split(" ").filter(Boolean).map(stemWord);
}

/* --------------------------------- search --------------------------------- */

/** Nodes (any depth, even inside collapsed branches) whose title/badge contains the query. */
export function searchNodes(root: MindMapNode, query: string, lang: Lang): string[] {
  const q = normalizeText(query);
  if (q.length < 2) return [];
  return flattenTree(root)
    .filter(({ node }) => {
      const hay = normalizeText(`${node.title[lang]} ${node.badge?.[lang] ?? ""}`);
      return hay.includes(q);
    })
    .map(({ node }) => node.id);
}

/* ---------------------------------- camera ---------------------------------- */

export interface View {
  x: number;
  y: number;
  k: number;
}

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 2.2;
export const clampZoom = (k: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k));

/** Scale + offset that centres the whole layout in a `vw × vh` viewport (never magnifies past 1). */
export function fitView(
  layout: Pick<MindMapLayout, "width" | "height">,
  vw: number,
  vh: number,
  pad = 16,
): View {
  if (vw <= 0 || vh <= 0) return { x: 0, y: 0, k: 1 };
  const k = clampZoom(Math.min(1, (vw - pad * 2) / layout.width, (vh - pad * 2) / layout.height));
  return { k, x: (vw - layout.width * k) / 2, y: (vh - layout.height * k) / 2 };
}

/** Camera that puts the centre of `n` in the middle of the viewport. */
export function centerOn(n: PlacedNode, vw: number, vh: number, k: number): View {
  const kk = clampZoom(k);
  return { k: kk, x: vw / 2 - (n.x + n.w / 2) * kk, y: vh / 2 - (n.y + n.h / 2) * kk };
}

/** Zoom by `factor` keeping the point (px, py) of the viewport fixed. */
export function zoomAt(view: View, factor: number, px: number, py: number): View {
  const k = clampZoom(view.k * factor);
  const r = k / view.k;
  return { k, x: px - (px - view.x) * r, y: py - (py - view.y) * r };
}

/* -------------------------------- blank grid -------------------------------- */

/** Nodes from this depth down become empty slots in the recall mode (root + main branches stay). */
export const BLANK_MIN_DEPTH = 2;
/** A shallow tree (root + one level) has nothing deeper to blank, so its first level becomes the slots. */
export function blankMinDepth(root: MindMapNode): number {
  const depth = (n: MindMapNode): number => 1 + Math.max(0, ...(n.children ?? []).map(depth));
  return depth(root) >= 3 ? BLANK_MIN_DEPTH : 1;
}
export const isBlankDepth = (depth: number, min: number = BLANK_MIN_DEPTH) => depth >= min;

/** FNV-1a: deterministic ordering for options (no Math.random in render). */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function editDistanceAtMost1(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (a.length < b.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

const compact = (s: string) => stemTokens(s).join(" ");

/** True when `typed` names `node` (either language, tolerant of «ال», hamza/ta marbuta and one typo). */
export function answerMatches(typed: string, node: MindMapNode): boolean {
  const t = compact(typed);
  if (!t) return false;
  return [node.title.ar, node.title.en].some((title) => {
    const want = compact(title);
    return t === want || (want.length >= 6 && editDistanceAtMost1(t, want));
  });
}

/** Up to `count` choices (one is correct): siblings first, then same level, then the rest. */
export function blankOptions(root: MindMapNode, nodeId: string, lang: Lang, count = 4): string[] {
  const all = flattenTree(root);
  const target = all.find((x) => x.node.id === nodeId);
  if (!target) return [];
  const correct = target.node.title[lang];
  const seen = new Set([
    compact(correct),
    compact(target.node.title.ar),
    compact(target.node.title.en),
  ]);
  const rank = (x: (typeof all)[number]) =>
    x.parentId === target.parentId ? 0 : x.depth === target.depth ? 1 : 2;
  const pool = all
    .filter((x) => x.node.id !== nodeId && x.depth > 0)
    .sort(
      (a, b) =>
        rank(a) - rank(b) ||
        hashString(nodeId + a.node.id) - hashString(nodeId + b.node.id) ||
        a.node.id.localeCompare(b.node.id),
    );
  const picks: string[] = [];
  for (const x of pool) {
    if (picks.length >= count - 1) break;
    const key = compact(x.node.title[lang]);
    if (seen.has(key) || !x.node.title[lang]) continue;
    seen.add(key);
    picks.push(x.node.title[lang]);
  }
  const at = hashString(`pos:${nodeId}`) % (picks.length + 1);
  picks.splice(at, 0, correct);
  return picks;
}

export type BlankVerdict = "right" | "wrong" | "empty";

export interface BlankGrade {
  verdicts: Record<string, BlankVerdict>;
  right: number;
  total: number;
  /** 0–100. */
  pct: number;
}

/** Grades the blank slots currently on screen; an unanswered slot counts as wrong. */
export function gradeBlankMap(
  blanks: readonly MindMapNode[],
  answers: Readonly<Record<string, string>>,
): BlankGrade {
  const verdicts: Record<string, BlankVerdict> = {};
  let right = 0;
  for (const node of blanks) {
    const a = (answers[node.id] ?? "").trim();
    const v: BlankVerdict = !a ? "empty" : answerMatches(a, node) ? "right" : "wrong";
    verdicts[node.id] = v;
    if (v === "right") right++;
  }
  const total = blanks.length;
  return { verdicts, right, total, pct: total === 0 ? 0 : Math.round((100 * right) / total) };
}

/** The blank slots among the placed (visible) nodes. */
export function visibleBlanks(
  layout: Pick<MindMapLayout, "nodes">,
  min: number = BLANK_MIN_DEPTH,
): MindMapNode[] {
  return layout.nodes.filter((n) => isBlankDepth(n.depth, min)).map((n) => n.node);
}

/** Student-friendly colour of the mastery dot: null when the block was never tried. */
export function masteryLevel(
  tally: { hits: number; misses: number } | undefined,
  weak: number,
): "good" | "mid" | "bad" | null {
  if (!tally || tally.hits + tally.misses === 0) return null;
  return weak >= 40 ? "bad" : weak >= 15 ? "mid" : "good";
}

/* ------------------------------ best scores ------------------------------ */

export const bestKey = (userId: string | null) => `labx.mindmap.best.v1:${userId || "guest"}`;
const BEST_ID = /^[A-Za-z0-9_-]{1,40}$/;

/** Best recall-grid score (0–100) per map: «base» or a Noor Studio pack id. Untrusted on read. */
export function sanitizeBest(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>).slice(0, 60)) {
    if (!BEST_ID.test(k) || k === "__proto__") continue;
    if (typeof v === "number" && Number.isFinite(v))
      out[k] = Math.min(100, Math.max(0, Math.round(v)));
  }
  return out;
}

export function loadBest(
  userId: string | null,
  storage: Pick<Storage, "getItem"> | null,
): Record<string, number> {
  try {
    const t = storage?.getItem(bestKey(userId));
    return t ? sanitizeBest(JSON.parse(t) as unknown) : {};
  } catch {
    return {};
  }
}

export function saveBest(
  userId: string | null,
  storage: Pick<Storage, "setItem"> | null,
  best: Record<string, number>,
): void {
  try {
    storage?.setItem(bestKey(userId), JSON.stringify(best));
  } catch {
    /* quota / private mode */
  }
}
