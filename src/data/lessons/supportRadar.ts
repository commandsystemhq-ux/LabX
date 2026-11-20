/**
 * «طبيب نقط الضعف»: tracks, per block and per item, what the student got wrong and turns the
 * weakest blocks into a 10-minute rescue session. Pure and storage-agnostic; the persisted shape
 * is untrusted and always passes through `sanitizeRadar`.
 */

export const RADAR_VERSION = 1;
export const RESCUE_MINUTES = 10;
export const BLOCK_COUNT = 14;

const MAX_ITEMS = 400;
const MAX_COUNT = 10_000;
const ITEM_ID = /^[a-z0-9_-]{1,40}$/i;

export interface BlockTally {
  hits: number;
  misses: number;
}

export interface RadarState {
  v: typeof RADAR_VERSION;
  blocks: Record<string, BlockTally>;
  /** Misses per item id (a quiz question, a lab task, a drawing…). */
  items: Record<string, number>;
}

export const EMPTY_RADAR: RadarState = Object.freeze({
  v: RADAR_VERSION,
  blocks: Object.freeze({}) as Record<string, BlockTally>,
  items: Object.freeze({}) as Record<string, number>,
});

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const count = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(MAX_COUNT, Math.max(0, Math.round(v))) : 0;

export function sanitizeRadar(raw: unknown): RadarState {
  if (!isRecord(raw) || raw["v"] !== RADAR_VERSION) return EMPTY_RADAR;
  const blocks: Record<string, BlockTally> = {};
  if (isRecord(raw["blocks"])) {
    for (const [k, value] of Object.entries(raw["blocks"])) {
      const n = Number(k);
      if (!Number.isInteger(n) || n < 1 || n > BLOCK_COUNT || !isRecord(value)) continue;
      blocks[String(n)] = { hits: count(value["hits"]), misses: count(value["misses"]) };
    }
  }
  const items: Record<string, number> = {};
  if (isRecord(raw["items"])) {
    for (const [k, value] of Object.entries(raw["items"]).slice(0, MAX_ITEMS)) {
      if (k === "__proto__" || !ITEM_ID.test(k)) continue;
      const n = count(value);
      if (n > 0) items[k] = n;
    }
  }
  return { v: RADAR_VERSION, blocks, items };
}

export interface RadarEvent {
  block: number;
  itemId: string;
  ok: boolean;
}

export function recordRadar(state: RadarState, ev: RadarEvent): RadarState {
  if (!Number.isInteger(ev.block) || ev.block < 1 || ev.block > BLOCK_COUNT) return state;
  const key = String(ev.block);
  const tally = state.blocks[key] ?? { hits: 0, misses: 0 };
  const next: BlockTally = {
    hits: Math.min(MAX_COUNT, tally.hits + (ev.ok ? 1 : 0)),
    misses: Math.min(MAX_COUNT, tally.misses + (ev.ok ? 0 : 1)),
  };
  const items = { ...state.items };
  if (ITEM_ID.test(ev.itemId)) {
    if (!ev.ok) {
      if (Object.keys(items).length < MAX_ITEMS || ev.itemId in items) {
        items[ev.itemId] = Math.min(MAX_COUNT, (items[ev.itemId] ?? 0) + 1);
      }
    } else if (items[ev.itemId]) {
      // Getting it right again pays the mistake back, so the radar follows real progress.
      const left = items[ev.itemId]! - 1;
      if (left > 0) items[ev.itemId] = left;
      else delete items[ev.itemId];
    }
  }
  return { ...state, blocks: { ...state.blocks, [key]: next }, items };
}

/** 0 = solid, 100 = needs rescue. Smoothed so one early slip does not dominate a block. */
export function weakness(state: RadarState, block: number): number {
  const t = state.blocks[String(block)];
  if (!t || t.hits + t.misses === 0) return 0;
  return Math.round((100 * t.misses) / (t.hits + t.misses + 1));
}

export interface WeakBlock {
  block: number;
  weakness: number;
  misses: number;
}

export function weakBlocks(state: RadarState, limit = 3, minWeakness = 15): WeakBlock[] {
  return Array.from({ length: BLOCK_COUNT }, (_, i) => i + 1)
    .map((block) => ({
      block,
      weakness: weakness(state, block),
      misses: state.blocks[String(block)]?.misses ?? 0,
    }))
    .filter((w) => w.misses > 0 && w.weakness >= minWeakness)
    .sort((a, b) => b.weakness - a.weakness || b.misses - a.misses || a.block - b.block)
    .slice(0, limit);
}

export type RescueKind = "review" | "trap" | "lab" | "quiz";

export interface RescueStep {
  block: number;
  kind: RescueKind;
  minutes: number;
  /** Item ids (questions / tasks) the student missed in this block, to retry first. */
  itemIds: string[];
}

export interface RescuePlan {
  steps: RescueStep[];
  minutes: number;
  blocks: number[];
}

const PLAN: Record<RescueKind, number> = { review: 1, trap: 1, lab: 2, quiz: 1 };

/**
 * A rescue session of at most 10 minutes for the weakest blocks: for each (worst first) a quick
 * re-read, the exam trap, the lab task it missed and a short quiz, until the time is used.
 * `itemsOf(block)` lists the ids that belong to a block.
 */
export function buildRescue(
  state: RadarState,
  itemsOf: (block: number) => string[],
  budget = RESCUE_MINUTES,
): RescuePlan {
  const steps: RescueStep[] = [];
  let used = 0;
  const kinds: RescueKind[] = ["review", "trap", "lab", "quiz"];
  const weak = weakBlocks(state, 4);
  const perBlock = weak.length === 0 ? 0 : Math.max(1, Math.floor(budget / weak.length));
  for (const w of weak) {
    const missed = itemsOf(w.block).filter((id) => (state.items[id] ?? 0) > 0);
    let spent = 0;
    for (const kind of kinds) {
      const minutes = PLAN[kind];
      if (used + minutes > budget || spent + minutes > Math.max(perBlock, 2)) continue;
      steps.push({
        block: w.block,
        kind,
        minutes,
        itemIds: kind === "lab" || kind === "quiz" ? missed : [],
      });
      used += minutes;
      spent += minutes;
    }
  }
  return { steps, minutes: used, blocks: weak.map((w) => w.block) };
}

/* -------------------------------- persistence -------------------------------- */

export const RADAR_KEY = "labx.radar.v1";

export function loadRadar(storage: Pick<Storage, "getItem"> | null): RadarState {
  try {
    const text = storage?.getItem(RADAR_KEY);
    return text ? sanitizeRadar(JSON.parse(text) as unknown) : EMPTY_RADAR;
  } catch {
    return EMPTY_RADAR;
  }
}

export function saveRadar(storage: Pick<Storage, "setItem"> | null, state: RadarState) {
  try {
    storage?.setItem(RADAR_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode: the radar stays in memory for this session */
  }
}
