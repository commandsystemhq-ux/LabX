import type { L10n } from "@/lib/i18n";
import type { SupportQuestion } from "./supportTypes";

/**
 * «تحدي 1 ضد 1»: both players open the same link, so the same seed gives the same challenges in
 * the same order with the same shuffled options. Results are compared by score, then time.
 * Pure: no clocks, no storage, no randomness except the injected seed.
 */

export const DUEL_ROUNDS = 8;
export const DUEL_SEED_RE = /^[a-z0-9]{4,12}$/;
const VS_RE = /^(\d{1,4})-(\d{1,7})$/;

export interface DuelOption {
  text: L10n;
  correct: boolean;
}

export interface DuelChallenge {
  id: string;
  block: number;
  kind: "question" | "numeric" | "pick";
  prompt: L10n;
  options: DuelOption[];
}

/** FNV-1a 32-bit, so any text seed becomes a number. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: tiny deterministic PRNG returning floats in [0, 1). */
export function rng(seed: string): () => number {
  let a = hashSeed(seed) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<T>(items: readonly T[], rand: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** A new share-able seed (8 chars of [a-z0-9]). */
export function newSeed(rand: () => number = Math.random): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 8 }, () => alphabet[Math.floor(rand() * alphabet.length)]).join("");
}

export function isValidSeed(seed: unknown): seed is string {
  return typeof seed === "string" && DUEL_SEED_RE.test(seed);
}

export function fromQuestion(q: SupportQuestion): DuelChallenge | null {
  if (q.options.some((o) => o.plot)) return null; // chart answers don't fit a quick duel
  return {
    id: q.id,
    block: q.block,
    kind: "question",
    prompt: q.prompt,
    options: q.options.map((o, i) => ({ text: o.text, correct: i === q.correct })),
  };
}

/** Number questions become 4-option questions with seeded, always distinct distractors. */
export function numericChallenge(
  id: string,
  block: number,
  prompt: L10n,
  answer: number,
  rand: () => number,
): DuelChallenge {
  const pool = new Set<number>();
  const steps = [1, 2, 3, 5, 10, 20].flatMap((d) => [answer + d, answer - d]);
  for (const v of shuffled(steps, rand)) {
    if (v > 0 && v !== answer) pool.add(v);
    if (pool.size === 3) break;
  }
  const options = shuffled([answer, ...pool], rand).map((v) => ({
    text: { ar: String(v), en: String(v) },
    correct: v === answer,
  }));
  return { id, block, kind: "numeric", prompt, options };
}

export interface DuelSource {
  questions: SupportQuestion[];
  numerics: { id: string; block: number; prompt: L10n; answer: number }[];
}

/**
 * The same challenges for the same seed. Mixes lesson questions and number challenges, never
 * repeats one, and shuffles each challenge's options.
 */
export function buildDuel(seed: string, source: DuelSource, rounds = DUEL_ROUNDS): DuelChallenge[] {
  const rand = rng(seed);
  const all: (() => DuelChallenge | null)[] = [
    ...source.questions.map((q) => () => fromQuestion(q)),
    ...source.numerics.map((n) => () => numericChallenge(n.id, n.block, n.prompt, n.answer, rand)),
  ];
  const picked: DuelChallenge[] = [];
  for (const make of shuffled(all, rand)) {
    const ch = make();
    if (ch) picked.push({ ...ch, options: shuffled(ch.options, rand) });
    if (picked.length === rounds) break;
  }
  return picked;
}

export interface DuelAnswer {
  id: string;
  /** Index of the chosen option, or -1 for a timeout. */
  choice: number;
  ms: number;
}

export interface DuelResult {
  correct: number;
  total: number;
  ms: number;
  score: number;
}

const MAX_MS_PER_ROUND = 60_000;
const FAST_MS = 10_000;

/** 100 per correct answer + up to 50 for speed on each; the total time is capped per round. */
export function scoreDuel(
  challenges: readonly DuelChallenge[],
  answers: readonly DuelAnswer[],
): DuelResult {
  let correct = 0;
  let ms = 0;
  let score = 0;
  for (const ch of challenges) {
    const a = answers.find((x) => x.id === ch.id);
    const spent = Math.min(
      MAX_MS_PER_ROUND,
      Math.max(0, a && Number.isFinite(a.ms) ? a.ms : MAX_MS_PER_ROUND),
    );
    ms += spent;
    if (a && ch.options[a.choice]?.correct) {
      correct++;
      score += 100 + Math.round(50 * Math.max(0, 1 - spent / FAST_MS));
    }
  }
  return { correct, total: challenges.length, ms, score };
}

export type DuelOutcome = "win" | "lose" | "tie";

export function compareDuel(
  mine: DuelResult,
  theirs: Pick<DuelResult, "score" | "ms">,
): DuelOutcome {
  if (mine.score !== theirs.score) return mine.score > theirs.score ? "win" : "lose";
  if (mine.ms !== theirs.ms) return mine.ms < theirs.ms ? "win" : "lose";
  return "tie";
}

/* ----------------------------------- links ----------------------------------- */

export interface DuelParams {
  seed: string;
  /** The challenger's result carried in the link. */
  vs: { score: number; ms: number } | null;
}

/** Reads `?duel=` / `?vs=` from the route's search object. Anything malformed is ignored. */
export function parseDuelParams(search: { duel?: unknown; vs?: unknown }): DuelParams | null {
  if (!isValidSeed(search.duel)) return null;
  const m = typeof search.vs === "string" ? VS_RE.exec(search.vs) : null;
  return {
    seed: search.duel,
    vs: m ? { score: Number(m[1]), ms: Number(m[2]) } : null,
  };
}

export function duelSearch(seed: string, result?: Pick<DuelResult, "score" | "ms">) {
  return {
    duel: seed,
    ...(result ? { vs: `${Math.round(result.score)}-${Math.round(result.ms)}` } : {}),
  };
}

export function duelUrl(
  origin: string,
  lessonId: string,
  seed: string,
  result?: Pick<DuelResult, "score" | "ms">,
) {
  const q = new URLSearchParams({ id: lessonId, ...duelSearch(seed, result) });
  return `${origin.replace(/\/$/, "")}/lesson?${q.toString()}`;
}
