import { z } from "zod";
import type { StudioOutput } from "@/lib/ai-config";
import { collectBlockIds, supportMindMap } from "./supportMindMap";
import { supportFlashcards } from "./supportFlashcards";
import { getBlock } from "./supportLesson";
import { ancestorIds, flattenTree, normalizeText, stemTokens } from "./mindMapLayout";
import { weakBlocks, type RadarState } from "./supportRadar";
import type { MindMapNode } from "./supportTypes";

/**
 * Noor Studio: custom mind maps (filled or blank-recall) and flashcard packs created by Noor for one
 * student. Everything here is pure: local generators (guest / fallback), request understanding,
 * edits, validation and a per-account localStorage format that is sanitised on every read.
 */

const MAX_TITLE = 100;
const MAX_ITEMS = 100;
const MAX_TEXT = 500;
const MAX_PACKS = 20;
const MAX_DEPTH = 5;
const ID_RE = /^[a-z0-9_-]{1,40}$/;
const NODE_ID_RE = /^[A-Za-z0-9_-]{1,40}$/;

/* -------------------------------- Schemas -------------------------------- */

const text = (max: number) =>
  z.object({ ar: z.string().trim().max(max), en: z.string().trim().max(max) });

export const FlashcardItemSchema = z.object({
  id: z.string().regex(ID_RE),
  blockId: z.number().int().min(1).max(14),
  front: text(MAX_TEXT),
  back: text(MAX_TEXT),
  hint: text(MAX_TEXT).optional(),
});

export const MindMapItemSchema = z.object({
  id: z.string().regex(NODE_ID_RE),
  title: text(MAX_TITLE),
  badge: text(50).optional(),
  summary: text(MAX_TEXT).optional(),
  blockId: z.number().int().min(1).max(14).optional(),
  supports3D: z.boolean().optional(),
  /** Id of the parent node; absent on the single root. */
  parent: z.string().regex(NODE_ID_RE).optional(),
});

const PackBase = {
  id: z.string().regex(ID_RE),
  title: text(MAX_TITLE),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative().optional(),
  origin: z.enum(["ai", "local"]).optional(),
};

export const FlashcardPackSchema = z.object({
  ...PackBase,
  cards: z.array(FlashcardItemSchema).max(MAX_ITEMS),
});

export const MindMapPackSchema = z.object({
  ...PackBase,
  kind: z.enum(["filled", "blank"]).default("filled"),
  nodes: z.array(MindMapItemSchema).max(MAX_ITEMS),
});

export const NoorStudioStateSchema = z.object({
  v: z.literal(1),
  flashcardPacks: z.array(FlashcardPackSchema).max(MAX_PACKS),
  mindMapPacks: z.array(MindMapPackSchema).max(MAX_PACKS),
});

export type FlashcardItem = z.infer<typeof FlashcardItemSchema>;
export type MindMapItem = z.infer<typeof MindMapItemSchema>;
export type FlashcardPack = z.infer<typeof FlashcardPackSchema>;
export type MindMapPack = z.infer<typeof MindMapPackSchema>;
export type NoorStudioState = z.infer<typeof NoorStudioStateSchema>;
export type StudioKind = "mindmap" | "flashcards";
export type StudioLang = "ar" | "en";
type Bi = { ar: string; en: string };

/** The pack the student is looking at / Noor just made: «عدّل دي» means this one. */
export interface StudioFocus {
  kind: StudioKind;
  packId: string;
}

export const EMPTY_STUDIO: NoorStudioState = { v: 1, flashcardPacks: [], mindMapPacks: [] };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/* ------------------------------ ids + helpers ------------------------------ */

let idSeq = 0;
export function newStudioId(prefix: "fc" | "mm", now: number = Date.now()): string {
  idSeq = (idSeq + 1) % 1296;
  return `${prefix}-${Math.floor(now).toString(36)}${idSeq.toString(36)}`;
}

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);
const bi = (ar: string, en: string): Bi => ({ ar, en });
const asciiDigits = (s: string) =>
  s.replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));

/** A bilingual value where one language may be missing: the other fills in so nothing renders blank. */
function fillBoth(v: Bi, max: number): Bi {
  const ar = v.ar.trim() || v.en.trim();
  const en = v.en.trim() || v.ar.trim();
  return { ar: clip(ar, max), en: clip(en, max) };
}

/* -------------------------------- Storage -------------------------------- */

export const studioKey = (userId: string | null) =>
  `labx.noor-studio.${encodeURIComponent(userId || "guest")}.v1`;

function sanitizeFlashcardPack(raw: unknown): FlashcardPack | null {
  if (!isRecord(raw)) return null;
  const cardsRaw = Array.isArray(raw["cards"]) ? (raw["cards"] as unknown[]) : [];
  const seen = new Set<string>();
  const cards: FlashcardItem[] = [];
  for (const c of cardsRaw.slice(0, MAX_ITEMS)) {
    const r = FlashcardItemSchema.safeParse(c);
    if (!r.success || seen.has(r.data.id)) continue;
    if (!(r.data.front.ar || r.data.front.en) || !(r.data.back.ar || r.data.back.en)) continue;
    seen.add(r.data.id);
    cards.push({
      ...r.data,
      front: fillBoth(r.data.front, MAX_TEXT),
      back: fillBoth(r.data.back, MAX_TEXT),
    });
  }
  const head = FlashcardPackSchema.safeParse({ ...raw, cards: [] });
  if (!head.success || cards.length === 0) return null;
  return { ...head.data, title: fillBoth(head.data.title, MAX_TITLE), cards };
}

/**
 * Repairs a flat node list into exactly one rooted tree: unique ids, one root, dangling/cyclic
 * parents re-attached to the root or dropped, depth ≤ 5. Output order is depth-first reading order.
 */
export function sanitizeMindMapItems(items: readonly MindMapItem[]): MindMapItem[] {
  const seen = new Set<string>();
  const list = items.filter((i) => !seen.has(i.id) && seen.add(i.id));
  const first = list[0];
  if (!first) return [];
  const ids = new Set(list.map((i) => i.id));
  const root = list.find((i) => !i.parent || !ids.has(i.parent) || i.parent === i.id) ?? first;
  const kids = new Map<string, MindMapItem[]>();
  for (const i of list) {
    if (i.id === root.id) continue;
    const p = i.parent && ids.has(i.parent) && i.parent !== i.id ? i.parent : root.id;
    kids.set(p, [...(kids.get(p) ?? []), { ...i, parent: p }]);
  }
  const out: MindMapItem[] = [];
  const visited = new Set<string>();
  const walk = (item: MindMapItem, depth: number) => {
    if (visited.has(item.id) || depth > MAX_DEPTH || out.length >= MAX_ITEMS) return;
    visited.add(item.id);
    out.push(item);
    for (const k of kids.get(item.id) ?? []) walk(k, depth + 1);
  };
  const rootItem: MindMapItem = { ...root };
  delete rootItem.parent;
  walk(rootItem, 0);
  return out.map((i) => ({
    ...i,
    title: fillBoth(i.title, MAX_TITLE),
    ...(i.badge ? { badge: fillBoth(i.badge, 50) } : {}),
    ...(i.summary ? { summary: fillBoth(i.summary, MAX_TEXT) } : {}),
  }));
}

function sanitizeMindMapPack(raw: unknown): MindMapPack | null {
  if (!isRecord(raw)) return null;
  const nodesRaw = Array.isArray(raw["nodes"]) ? (raw["nodes"] as unknown[]) : [];
  const parsed: MindMapItem[] = [];
  for (const n of nodesRaw.slice(0, MAX_ITEMS)) {
    const r = MindMapItemSchema.safeParse(n);
    if (r.success && (r.data.title.ar || r.data.title.en)) parsed.push(r.data);
  }
  const nodes = sanitizeMindMapItems(parsed);
  const head = MindMapPackSchema.safeParse({ ...raw, nodes: [] });
  if (!head.success || nodes.length === 0) return null;
  return { ...head.data, title: fillBoth(head.data.title, MAX_TITLE), nodes };
}

/** Anything read from storage is untrusted: bad packs are dropped one by one, good ones are repaired. */
export function sanitizeStudioState(raw: unknown): NoorStudioState {
  if (!isRecord(raw) || raw["v"] !== 1) return EMPTY_STUDIO;
  const pick = <T extends { id: string }>(src: unknown, fn: (x: unknown) => T | null): T[] => {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const x of (Array.isArray(src) ? (src as unknown[]) : []).slice(0, MAX_PACKS)) {
      const p = fn(x);
      if (p && !seen.has(p.id)) {
        seen.add(p.id);
        out.push(p);
      }
    }
    return out;
  };
  return {
    v: 1,
    flashcardPacks: pick(raw["flashcardPacks"], sanitizeFlashcardPack),
    mindMapPacks: pick(raw["mindMapPacks"], sanitizeMindMapPack),
  };
}

export function loadStudioState(
  userId: string | null,
  storage: Pick<Storage, "getItem"> | null,
): NoorStudioState {
  try {
    const raw = storage?.getItem(studioKey(userId));
    return raw ? sanitizeStudioState(JSON.parse(raw) as unknown) : EMPTY_STUDIO;
  } catch {
    return EMPTY_STUDIO;
  }
}

export function saveStudioState(
  userId: string | null,
  storage: Pick<Storage, "setItem"> | null,
  state: NoorStudioState,
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(studioKey(userId), JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------ tree conversion ------------------------------ */

/** Pack nodes (flat) → the `MindMapNode` tree the Lab renders. */
export function packToTree(pack: Pick<MindMapPack, "nodes">): MindMapNode {
  const nodes = sanitizeMindMapItems(pack.nodes);
  const byParent = new Map<string, MindMapItem[]>();
  for (const n of nodes) {
    if (n.parent) byParent.set(n.parent, [...(byParent.get(n.parent) ?? []), n]);
  }
  const build = (n: MindMapItem): MindMapNode => {
    const children = (byParent.get(n.id) ?? []).map(build);
    return {
      id: n.id,
      title: n.title,
      ...(n.badge ? { badge: n.badge } : {}),
      ...(n.summary ? { summary: n.summary } : {}),
      ...(n.blockId ? { blockId: n.blockId } : {}),
      ...(n.supports3D ? { supports3D: true } : {}),
      ...(children.length ? { children } : {}),
    };
  };
  const root = nodes[0];
  return root ? build(root) : { id: "n1", title: bi("خريطة فارغة", "Empty map") };
}

/** Tree → flat storable items with fresh sequential ids (`n1`, `n2`, …). */
export function treeToItems(root: MindMapNode, max: number = MAX_ITEMS): MindMapItem[] {
  const out: MindMapItem[] = [];
  const walk = (n: MindMapNode, parent: string | undefined, depth: number) => {
    if (out.length >= max || depth > MAX_DEPTH) return;
    const id = `n${out.length + 1}`;
    out.push({
      id,
      title: fillBoth(n.title, MAX_TITLE),
      ...(n.badge ? { badge: fillBoth(n.badge, 50) } : {}),
      ...(n.summary ? { summary: fillBoth(n.summary, MAX_TEXT) } : {}),
      ...(n.blockId && n.blockId >= 1 && n.blockId <= 14 ? { blockId: n.blockId } : {}),
      ...(n.supports3D ? { supports3D: true } : {}),
      ...(parent ? { parent } : {}),
    });
    n.children?.forEach((c) => walk(c, id, depth + 1));
  };
  walk(root, undefined, 0);
  return out;
}

/** Copy limited to `maxDepth` levels and `maxNodes` nodes (breadth-first, so no branch is starved). */
export function pruneTree(root: MindMapNode, maxDepth: number, maxNodes: number): MindMapNode {
  const shallow = (n: MindMapNode): MindMapNode => {
    const copy: MindMapNode = { ...n };
    delete copy.children;
    return copy;
  };
  const head = shallow(root);
  let count = 1;
  let level: { src: MindMapNode; dst: MindMapNode }[] = [{ src: root, dst: head }];
  for (let depth = 0; depth < maxDepth && level.length > 0; depth++) {
    const next: typeof level = [];
    for (const { src, dst } of level) {
      for (const c of src.children ?? []) {
        if (count >= maxNodes) break;
        const d = shallow(c);
        count++;
        dst.children = [...(dst.children ?? []), d];
        next.push({ src: c, dst: d });
      }
    }
    level = next;
  }
  return head;
}

const countNodes = (n: MindMapNode): number =>
  1 + (n.children ?? []).reduce((s, c) => s + countNodes(c), 0);

/* ------------------------------ topic resolution ------------------------------ */

export interface TopicMatch {
  node: MindMapNode;
  blocks: number[];
}

/** Query token ↔ title token (exact, or one is a ≥4-char prefix of the other: «نباتية» ~ «نبات»). */
function tokenHit(q: string, n: string): boolean {
  if (q === n) return true;
  return Math.min(q.length, n.length) >= 4 && (q.startsWith(n) || n.startsWith(q));
}

const longTokens = (s: string) =>
  [...new Set(stemTokens(asciiDigits(s)))].filter((t) => t.length >= 3);

/** Best node of the textbook mind map for a free-text request (Arabic or English), or null. */
export function resolveTopic(
  request: string,
  root: MindMapNode = supportMindMap.root,
): TopicMatch | null {
  const q = longTokens(request);
  if (q.length === 0) return null;
  let best: { node: MindMapNode; score: number; extra: number; depth: number } | null = null;
  for (const { node, depth } of flattenTree(root)) {
    const nt = longTokens(`${node.title.ar} ${node.title.en}`);
    const score = q.filter((t) => nt.some((n) => tokenHit(t, n))).length;
    if (score === 0) continue;
    const extra = nt.length - score;
    if (
      !best ||
      score > best.score ||
      (score === best.score && (extra < best.extra || (extra === best.extra && depth < best.depth)))
    ) {
      best = { node, score, extra, depth };
    }
  }
  return best ? { node: best.node, blocks: collectBlockIds(best.node) } : null;
}

/** Block numbers written in the request («جزئية 5 و6», «block 7»). */
export function blocksInRequest(request: string): number[] {
  const t = asciiDigits(normalizeText(request));
  const out = new Set<number>();
  const re = /(?:جزي?ي?[هات]*|قسم|section|block|part)s?\s*((?:\d{1,2}\s*(?:و|and|,|-)?\s*)+)/gu;
  for (const m of t.matchAll(re)) {
    for (const d of (m[1] ?? "").match(/\d{1,2}/g) ?? []) {
      const n = Number(d);
      if (n >= 1 && n <= 14) out.add(n);
    }
  }
  return [...out].slice(0, 14);
}

/** The student's weakest blocks, or (new student) the first untried blocks. */
export function focusBlocks(radar: RadarState, limit = 4): number[] {
  const weak = weakBlocks(radar, limit, 10).map((w) => w.block);
  if (weak.length) return weak;
  const untried: number[] = [];
  for (let n = 1; n <= 14 && untried.length < 3; n++) {
    const t = radar.blocks[String(n)];
    if (!t || t.hits + t.misses === 0) untried.push(n);
  }
  return untried;
}

/** Blocks (≤ 6) a request is about: numbers in the text, else its topic, else the weak/untried ones. */
export function blocksForIntent(
  intent: Pick<StudioIntent, "weak" | "request">,
  radar: RadarState,
): number[] {
  const numbered = blocksInRequest(intent.request);
  if (numbered.length) return numbered.slice(0, 6);
  if (!intent.weak) {
    const topic = resolveTopic(intent.request);
    if (topic?.blocks.length) return topic.blocks.slice(0, 6);
  }
  return focusBlocks(radar, 4);
}
/** Maximal subtrees of the textbook map whose blockId is in `blocks`, under a synthetic root. */
function nodesForBlocks(blocks: readonly number[], title: Bi): MindMapNode {
  const want = new Set(blocks);
  const picked: MindMapNode[] = [];
  const walk = (n: MindMapNode) => {
    if (n.blockId && want.has(n.blockId)) picked.push(n);
    else n.children?.forEach(walk);
  };
  supportMindMap.root.children?.forEach(walk);
  return { id: "topic-root", title, children: picked };
}

/* ------------------------------ local generation ------------------------------ */

type RawCard = Omit<FlashcardItem, "id">;

function cardFromNode(n: MindMapNode): RawCard | null {
  if (!n.summary || !n.blockId) return null;
  return {
    blockId: n.blockId,
    front: bi(`اشرح: ${n.title.ar}`, `Explain: ${n.title.en}`),
    back: fillBoth(n.summary, MAX_TEXT),
    ...(n.badge ? { hint: fillBoth(n.badge, MAX_TEXT) } : {}),
  };
}

function finishCards(raw: readonly RawCard[], packId: string, max = 24): FlashcardItem[] {
  const seen = new Set<string>();
  const out: FlashcardItem[] = [];
  for (const c of raw) {
    const key = normalizeText(c.front.ar);
    if (!c.front.ar || !c.back.ar || seen.has(key) || out.length >= max) continue;
    seen.add(key);
    out.push({ ...c, id: `${packId}-${out.length + 1}` });
  }
  return out;
}

/** Cards for `blocks`: the book's own flashcards first, then node summaries, then hook/quiz questions. */
function cardsForBlocks(
  blocks: readonly number[],
  packId: string,
  extraNodes: readonly MindMapNode[] = [],
  max = 24,
): FlashcardItem[] {
  const want = new Set(blocks);
  const raw: RawCard[] = [];
  for (const c of supportFlashcards.cards) {
    if (!want.has(c.blockId) || c.visual) continue;
    raw.push({
      blockId: c.blockId,
      front: c.front,
      back: c.back,
      ...(c.hint ? { hint: c.hint } : {}),
    });
  }
  for (const n of extraNodes) {
    const c = cardFromNode(n);
    if (c) raw.push(c);
  }
  for (const n of blocks) {
    const b = getBlock(n);
    if (!b) continue;
    raw.push({ blockId: n, front: b.hookQuestion.question, back: b.hookQuestion.reveal });
    const q = b.microQuiz[0];
    if (q) raw.push({ blockId: n, front: q.prompt, back: q.explain });
  }
  return finishCards(raw, packId, max);
}

/** Flashcards for the weakest blocks (empty when nothing is weak). */
export function generateWeaknessFlashcards(
  radar: RadarState,
  _lang: StudioLang = "ar",
  now: number = Date.now(),
): FlashcardPack {
  const blocks = weakBlocks(radar, 5, 25).map((w) => w.block);
  const id = newStudioId("fc", now);
  return {
    id,
    title: bi("بطاقات نقاط الضعف", "Weakness flashcards"),
    createdAt: now,
    origin: "local",
    cards: blocks.length ? cardsForBlocks(blocks, id, [], 20) : [],
  };
}

export function generateBlockFlashcards(
  blockIds: readonly number[],
  _lang: StudioLang = "ar",
  now: number = Date.now(),
): FlashcardPack {
  const blocks = [...new Set(blockIds)].filter((n) => n >= 1 && n <= 14).slice(0, 5);
  const id = newStudioId("fc", now);
  return {
    id,
    title: bi(`بطاقات الجزئيات ${blocks.join("، ")}`, `Flashcards for blocks ${blocks.join(", ")}`),
    createdAt: now,
    origin: "local",
    cards: cardsForBlocks(blocks, id, [], 20),
  };
}

function mindMapPackFromTree(
  tree: MindMapNode,
  title: Bi,
  kind: "filled" | "blank",
  now: number,
): MindMapPack {
  return {
    id: newStudioId("mm", now),
    title: fillBoth(title, MAX_TITLE),
    createdAt: now,
    origin: "local",
    kind,
    nodes: sanitizeMindMapItems(treeToItems(pruneTree(tree, 3, 80))),
  };
}

/**
 * A topic the book only maps in a node or two (e.g. «الأربطة») would make a thin, boring map. Its
 * blocks' key terms are attached under the end of the topic's single-child chain so there is
 * something to read — and, in recall mode, something to fill.
 */
function withKeyTerms(tree: MindMapNode, blocks: readonly number[]): MindMapNode {
  if (countNodes(tree) >= 6) return tree;
  const copy = (n: MindMapNode): MindMapNode => ({
    ...n,
    ...(n.children ? { children: n.children.map(copy) } : {}),
  });
  const root = copy(tree);
  let tail = root;
  while (tail.children?.length === 1) tail = tail.children[0]!;
  const have = new Set(flattenTree(root).map((x) => normalizeText(x.node.title.ar)));
  const terms: MindMapNode[] = [];
  for (const n of blocks) {
    for (const term of getBlock(n)?.simpleExplanation.terms ?? []) {
      const key = normalizeText(term.ar);
      if (have.has(key) || terms.length >= 8) continue;
      have.add(key);
      terms.push({ id: `term-${n}-${terms.length}`, title: bi(term.ar, term.en), blockId: n });
    }
  }
  if (terms.length === 0) return tree;
  tail.children = [...(tail.children ?? []), ...terms];
  return root;
}

/** Mind map of the given blocks (a filled map; pass `"blank"` for the recall grid). */
export function generateBlockMindMap(
  blockIds: readonly number[],
  _lang: StudioLang = "ar",
  now: number = Date.now(),
  kind: "filled" | "blank" = "filled",
): MindMapPack {
  const blocks = [...new Set(blockIds)].filter((n) => n >= 1 && n <= 14).slice(0, 5);
  const rootTitle = bi(`الجزئيات ${blocks.join("، ")}`, `Blocks ${blocks.join(", ")}`);
  let tree = nodesForBlocks(blocks, rootTitle);
  if (!tree.children?.length) {
    tree = {
      id: "topic-root",
      title: rootTitle,
      children: blocks.flatMap((n) => {
        const b = getBlock(n);
        return b ? [{ id: `b${n}`, title: b.title, blockId: n }] : [];
      }),
    };
  }
  return mindMapPackFromTree(
    tree,
    bi(`خريطة الجزئيات ${blocks.join("، ")}`, `Mind map for blocks ${blocks.join(", ")}`),
    kind,
    now,
  );
}

/* ------------------------------ request understanding ------------------------------ */

export interface StudioIntent {
  action: "create" | "edit";
  kind: StudioKind;
  blank: boolean;
  weak: boolean;
  /** The student's own words (trimmed): used as the topic and as the edit instruction. */
  request: string;
}

const CREATE_RE =
  /(?:^|\s)(?:[اتن]?عمل|[اتن]?ولد|[اتن]?انشي|[اتن]?انشا|[اتن]?صنع|[اتن]?سوي|[اتن]?صمم|[اتن]?جهز|هات|اديني|عايز|عاوز|ابي|ابغي|اريد|محتاج|create|make|generate|build|give|need|want|prepare)/u;
const EDIT_RE =
  /(?:^|\s)(?:عدل|غير|بدل|حدث|بسط|ابسط|اختصر|قصر|زود|وسع|ضيف|اضف|احذف|شيل|امسح|سميها|اسمها|حول|خلي(?:ها|هم|ك)?(?=\s|$)|edit|modify|change|update|simpl|short|easier|expand|add|remove|delete|rename|convert|turn)/u;
const THIS_RE = /(?:^|\s)(?:دي|ده|دول|الحاليه|هذه|هذا|it|this|current)(?:\s|$)/u;
const FLASH_RE = /بطاق|كروت|كارت|flash ?cards?|\bcards?\b/u;
const MAP_RE = /خريط|ذهن|mind ?maps?|\bmap\b|\bgrids?\b|شبكه/u;
const BLANK_RE = /فاضي|فارغ|شبكه|تسميع|املا|blank|empty|recall|fill ?in|self ?test/u;
const WEAK_RE = /ضعف|ضعيف|اخطائ|غلطات|weak|mistake/u;

/**
 * Does this chat message ask Noor Studio to make or change something? Null for ordinary questions.
 * `focus` is the pack currently open / last created: «عدّل دي» then means that pack.
 */
export function parseStudioRequest(
  message: string,
  focus: StudioFocus | null = null,
): StudioIntent | null {
  const request = message.trim().slice(0, 300);
  const t = normalizeText(request);
  if (!t) return null;
  const create = CREATE_RE.test(t);
  const edit = EDIT_RE.test(t);
  if (!create && !edit) return null;

  const flash = FLASH_RE.test(t);
  const map = MAP_RE.test(t);
  const action: "create" | "edit" =
    edit && (!create || (focus !== null && THIS_RE.test(t))) ? "edit" : "create";

  let kind: StudioKind | null = null;
  if (flash && map) kind = t.search(FLASH_RE) < t.search(MAP_RE) ? "flashcards" : "mindmap";
  else if (flash) kind = "flashcards";
  else if (map) kind = "mindmap";
  else if (action === "edit" && focus) kind = focus.kind;
  if (!kind) return null;

  return {
    action,
    kind,
    blank: kind === "mindmap" && BLANK_RE.test(t),
    weak: WEAK_RE.test(t),
    request,
  };
}

/* ---------------------------- create (local) ---------------------------- */

export interface StudioBuild {
  kind: StudioKind;
  mindMap?: MindMapPack;
  flashcards?: FlashcardPack;
}

/** Local, always-successful generator: topic → blocks in the text → weak spots → first untried blocks. */
export function buildLocalStudio(
  intent: Pick<StudioIntent, "kind" | "blank" | "weak" | "request">,
  radar: RadarState,
  _lang: StudioLang = "ar",
  now: number = Date.now(),
): StudioBuild {
  const numbered = blocksInRequest(intent.request);
  const topic = intent.weak || numbered.length ? null : resolveTopic(intent.request);
  const blocks = numbered.length
    ? numbered
    : topic?.blocks.length
      ? topic.blocks
      : focusBlocks(radar, 4);

  if (intent.kind === "mindmap") {
    let tree: MindMapNode;
    let title: Bi;
    if (topic) {
      tree = topic.node;
      if (countNodes(tree) < 2) {
        const parentId = ancestorIds(supportMindMap.root, tree.id).at(-1);
        const parent = flattenTree(supportMindMap.root).find((x) => x.node.id === parentId)?.node;
        if (parent) tree = parent;
      }
      tree = withKeyTerms(tree, topic.blocks);
      title = tree.title;
    } else {
      title = intent.weak
        ? bi("نقاط ضعفي", "My weak spots")
        : bi(`الجزئيات ${blocks.join("، ")}`, `Blocks ${blocks.join(", ")}`);
      tree = nodesForBlocks(blocks, title);
      if (!tree.children?.length) tree = supportMindMap.root;
    }
    const prefix = intent.blank ? bi("شبكة تسميع: ", "Recall grid: ") : bi("خريطة: ", "Map: ");
    return {
      kind: "mindmap",
      mindMap: mindMapPackFromTree(
        tree,
        bi(prefix.ar + title.ar, prefix.en + title.en),
        intent.blank ? "blank" : "filled",
        now,
      ),
    };
  }

  const id = newStudioId("fc", now);
  const nodes = topic
    ? flattenTree(topic.node)
        .map((x) => x.node)
        .filter((n) => n.summary)
        .slice(0, 12)
    : [];
  const title = topic
    ? bi(`بطاقات: ${topic.node.title.ar}`, `Flashcards: ${topic.node.title.en}`)
    : intent.weak
      ? bi("بطاقات نقاط ضعفي", "My weak-spot flashcards")
      : bi(`بطاقات الجزئيات ${blocks.join("، ")}`, `Flashcards for blocks ${blocks.join(", ")}`);
  return {
    kind: "flashcards",
    flashcards: {
      id,
      title: fillBoth(title, MAX_TITLE),
      createdAt: now,
      origin: "local",
      cards: cardsForBlocks(blocks, id, nodes, 24),
    },
  };
}

/* ---------------------------- create (AI output) ---------------------------- */

/** Validated model output → a pack with fresh ids. Null when nothing usable remains. */
export function packFromAiOutput(
  out: StudioOutput,
  intent: Pick<StudioIntent, "blank">,
  now: number = Date.now(),
): StudioBuild | null {
  if (out.type === "flashcards") {
    const id = newStudioId("fc", now);
    const cards = finishCards(
      out.cards.map((c) => ({
        blockId: c.blockId ?? 1,
        front: fillBoth(c.front, MAX_TEXT),
        back: fillBoth(c.back, MAX_TEXT),
        ...(c.hint && (c.hint.ar || c.hint.en) ? { hint: fillBoth(c.hint, MAX_TEXT) } : {}),
      })),
      id,
      40,
    );
    if (cards.length === 0) return null;
    return {
      kind: "flashcards",
      flashcards: {
        id,
        title: fillBoth(out.title, MAX_TITLE),
        createdAt: now,
        origin: "ai",
        cards,
      },
    };
  }
  const ids = new Map(out.nodes.map((n, i) => [n.key, `n${i + 1}`] as const));
  const items: MindMapItem[] = out.nodes.map((n, i) => {
    const parent = n.parent ? ids.get(n.parent) : undefined;
    return {
      id: `n${i + 1}`,
      title: fillBoth(n.title, MAX_TITLE),
      ...(n.badge && (n.badge.ar || n.badge.en) ? { badge: fillBoth(n.badge, 50) } : {}),
      ...(n.summary && (n.summary.ar || n.summary.en)
        ? { summary: fillBoth(n.summary, MAX_TEXT) }
        : {}),
      ...(n.blockId ? { blockId: n.blockId } : {}),
      ...(parent ? { parent } : {}),
    };
  });
  const nodes = sanitizeMindMapItems(items);
  if (nodes.length < 2) return null;
  return {
    kind: "mindmap",
    mindMap: {
      id: newStudioId("mm", now),
      title: fillBoth(out.title, MAX_TITLE),
      createdAt: now,
      origin: "ai",
      kind: intent.blank ? "blank" : "filled",
      nodes,
    },
  };
}

/** Compact JSON of a pack for the edit prompt (always ≤ `max` characters). */
export function compactPack(pack: FlashcardPack | MindMapPack, max = 4800): string {
  const rows: unknown[] =
    "cards" in pack
      ? pack.cards.map((c) => ({ q: c.front, a: c.back, b: c.blockId }))
      : pack.nodes.map((n) => ({
          key: n.id,
          parent: n.parent ?? null,
          title: n.title,
          ...(n.summary ? { summary: n.summary } : {}),
          ...(n.blockId ? { b: n.blockId } : {}),
        }));
  let keep = rows.length;
  let json = JSON.stringify({ title: pack.title, items: rows });
  while (json.length > max && keep > 1) {
    keep = Math.floor(keep * 0.8);
    json = JSON.stringify({ title: pack.title, items: rows.slice(0, keep) });
  }
  return json.slice(0, max);
}

/* ------------------------------- local edits ------------------------------- */

export interface EditResult<P> {
  pack: P;
  changed: boolean;
  /** What happened, for Noor's reply (empty when nothing changed). */
  note: Bi;
}

const SIMPLER_RE = /بسط|ابسط|عامي|سهل|simpl|colloquial|easy|easier/u;
const SHORTER_RE = /اختصر|قصر|مختصر|short|brief|concise/u;
const MORE_RE = /زود|وسع|ضيف|اضف|اكتر|اكثر|more|add|expand|extend/u;
const REMOVE_RE = /احذف|شيل|امسح|remove|delete/u;
const RENAME_RE = /(?:سمي(?:ها)?|اسمها|rename(?: it)?(?: to)?|call it)\s+(.{2,60})$/u;
const FILLED_RE = /مليان|ممتلئ|مكتمل|filled|full|answers/u;

function firstSentence(s: string, max = 90): string {
  const cut = (s.split(/[.؟!؛:\n،]/u)[0] ?? s).trim();
  return clip(cut.length >= 8 ? cut : s, max);
}

const joinNotes = (notes: Bi[]): Bi =>
  notes.length
    ? bi(notes.map((n) => n.ar).join("، "), notes.map((n) => n.en).join(", "))
    : bi("", "");

export function editFlashcardPack(
  pack: FlashcardPack,
  instruction: string,
  now: number = Date.now(),
): EditResult<FlashcardPack> {
  const t = normalizeText(instruction);
  let cards = pack.cards;
  let title = pack.title;
  const notes: Bi[] = [];

  const rename = RENAME_RE.exec(instruction.trim());
  if (rename?.[1]) {
    const name = clip(rename[1].trim(), MAX_TITLE);
    title = bi(name, name);
    notes.push(bi("غيّرت الاسم", "renamed it"));
  }
  if (REMOVE_RE.test(t)) {
    const n = Number(/(\d{1,3})/.exec(asciiDigits(t))?.[1]);
    if (n >= 1 && n <= cards.length && cards.length > 1) {
      cards = cards.filter((_, i) => i !== n - 1);
      notes.push(bi(`حذفت البطاقة ${n}`, `removed card ${n}`));
    }
  }
  if (SIMPLER_RE.test(t)) {
    cards = cards.map((c) => {
      const exp = getBlock(c.blockId)?.simpleExplanation;
      const simple = exp?.paragraphs[0];
      if (!exp || !simple) return c;
      return { ...c, back: fillBoth(simple, MAX_TEXT), hint: fillBoth(exp.imagine, MAX_TEXT) };
    });
    notes.push(bi("بسّطت الإجابات بالعامية", "simplified the answers"));
  } else if (SHORTER_RE.test(t)) {
    cards = cards.map((c) => ({
      ...c,
      back: bi(firstSentence(c.back.ar), firstSentence(c.back.en)),
    }));
    notes.push(bi("اختصرت الإجابات", "shortened the answers"));
  }
  if (MORE_RE.test(t) && cards.length < MAX_ITEMS) {
    const topic = resolveTopic(instruction);
    const blocks = topic?.blocks.length ? topic.blocks : [...new Set(cards.map((c) => c.blockId))];
    const have = new Set(cards.map((c) => normalizeText(c.front.ar)));
    const base = cards.length;
    const extras = cardsForBlocks(blocks, pack.id, [], 60)
      .filter((c) => !have.has(normalizeText(c.front.ar)))
      .slice(0, 6)
      .map((c, i) => ({ ...c, id: `${pack.id}-${base + i + 1}` }));
    if (extras.length) {
      cards = [...cards, ...extras];
      notes.push(bi(`زوّدت ${extras.length} بطاقات`, `added ${extras.length} cards`));
    }
  }
  const changed = notes.length > 0;
  return {
    pack: changed ? { ...pack, title, cards, updatedAt: now } : pack,
    changed,
    note: joinNotes(notes),
  };
}

export function editMindMapPack(
  pack: MindMapPack,
  instruction: string,
  now: number = Date.now(),
): EditResult<MindMapPack> {
  const t = normalizeText(instruction);
  let nodes: MindMapItem[] = pack.nodes;
  let title = pack.title;
  let kind = pack.kind;
  const notes: Bi[] = [];
  const query = longTokens(instruction);
  const named = (n: MindMapItem) =>
    longTokens(`${n.title.ar} ${n.title.en}`).some((s) => query.some((w) => tokenHit(w, s)));

  const rename = RENAME_RE.exec(instruction.trim());
  if (rename?.[1]) {
    const name = clip(rename[1].trim(), MAX_TITLE);
    title = bi(name, name);
    notes.push(bi("غيّرت الاسم", "renamed it"));
  }
  if (FILLED_RE.test(t) && kind === "blank") {
    kind = "filled";
    notes.push(bi("رجّعتها خريطة مليانة", "turned it back into a full map"));
  } else if (BLANK_RE.test(t) && kind === "filled") {
    kind = "blank";
    notes.push(bi("حوّلتها لشبكة فاضية للتسميع", "turned it into a blank recall grid"));
  }
  if (SIMPLER_RE.test(t) || SHORTER_RE.test(t)) {
    nodes = nodes.map((n) =>
      n.summary
        ? {
            ...n,
            summary: bi(firstSentence(n.summary.ar, 120), firstSentence(n.summary.en, 120)),
          }
        : n,
    );
    notes.push(bi("اختصرت الملخصات", "shortened the summaries"));
  }
  if (REMOVE_RE.test(t)) {
    const victim = nodes.find((n) => n.parent && named(n));
    if (victim) {
      const drop = new Set([victim.id]);
      for (const n of nodes) if (n.parent && drop.has(n.parent)) drop.add(n.id);
      nodes = nodes.filter((n) => !drop.has(n.id));
      notes.push(bi(`شلت فرع «${victim.title.ar}»`, `removed “${victim.title.en}”`));
    }
  }
  if (MORE_RE.test(t) && nodes.length < MAX_ITEMS) {
    const target = nodes.find(named);
    const targets = target ? [target] : nodes.filter((n) => !nodes.some((m) => m.parent === n.id));
    const source = flattenTree(supportMindMap.root);
    const work = [...nodes];
    let added = 0;
    for (const tg of targets) {
      const src = source.find(
        (x) => normalizeText(x.node.title.ar) === normalizeText(tg.title.ar),
      )?.node;
      const have = new Set(
        work.filter((m) => m.parent === tg.id).map((m) => normalizeText(m.title.ar)),
      );
      for (const c of src?.children ?? []) {
        if (added >= 8 || work.length >= MAX_ITEMS || have.has(normalizeText(c.title.ar))) continue;
        work.push({
          id: `n${work.length + 1}x${added}`,
          title: fillBoth(c.title, MAX_TITLE),
          ...(c.badge ? { badge: fillBoth(c.badge, 50) } : {}),
          ...(c.summary ? { summary: fillBoth(c.summary, MAX_TEXT) } : {}),
          ...(c.blockId ? { blockId: c.blockId } : {}),
          parent: tg.id,
        });
        added++;
      }
    }
    if (added) {
      nodes = work;
      notes.push(bi(`زوّدت ${added} فروع`, `added ${added} branches`));
    }
  }
  const changed = notes.length > 0;
  return {
    pack: changed
      ? { ...pack, title, kind, nodes: sanitizeMindMapItems(nodes), updatedAt: now }
      : pack,
    changed,
    note: joinNotes(notes),
  };
}

/* -------------------------------- state ops -------------------------------- */

export function addFlashcardPack(state: NoorStudioState, pack: FlashcardPack): NoorStudioState {
  return {
    ...state,
    flashcardPacks: [...state.flashcardPacks.filter((p) => p.id !== pack.id), pack].slice(
      -MAX_PACKS,
    ),
  };
}

export function updateFlashcardPack(state: NoorStudioState, pack: FlashcardPack): NoorStudioState {
  return state.flashcardPacks.some((p) => p.id === pack.id)
    ? { ...state, flashcardPacks: state.flashcardPacks.map((p) => (p.id === pack.id ? pack : p)) }
    : state;
}

export function removeFlashcardPack(state: NoorStudioState, packId: string): NoorStudioState {
  return { ...state, flashcardPacks: state.flashcardPacks.filter((p) => p.id !== packId) };
}

export function addMindMapPack(state: NoorStudioState, pack: MindMapPack): NoorStudioState {
  return {
    ...state,
    mindMapPacks: [...state.mindMapPacks.filter((p) => p.id !== pack.id), pack].slice(-MAX_PACKS),
  };
}

export function updateMindMapPack(state: NoorStudioState, pack: MindMapPack): NoorStudioState {
  return state.mindMapPacks.some((p) => p.id === pack.id)
    ? { ...state, mindMapPacks: state.mindMapPacks.map((p) => (p.id === pack.id ? pack : p)) }
    : state;
}

export function removeMindMapPack(state: NoorStudioState, packId: string): NoorStudioState {
  return { ...state, mindMapPacks: state.mindMapPacks.filter((p) => p.id !== packId) };
}

/** Cards in the shape the Flashcards Lab understands (rating keys are the card ids). */
export function packToFlashcards(pack: FlashcardPack) {
  return pack.cards.map((c) => ({
    id: c.id,
    blockId: c.blockId,
    front: c.front,
    back: c.back,
    ...(c.hint ? { hint: c.hint } : {}),
  }));
}
