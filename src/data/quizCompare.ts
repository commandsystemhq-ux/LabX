import type { L10n } from "@/lib/i18n";
import { defaultsOf, type QuizQuestion, type SimulationDef } from "./simulations";

/** Before / claimed / actual numbers shown when a student asks to "see the mistake". */
export interface Comparison {
  key: string;
  label: L10n;
  symbol: string;
  unit: string;
  digits: number;
  before: number;
  /** What the chosen (wrong) option implicitly claims; null when the option makes no numeric claim. */
  claimed: number | null;
  actual: number;
  /** claimed − actual (null without a numeric claim). */
  gap: number | null;
  /** |gap| relative to |actual|, in percent (null without a claim or when actual is ~0). */
  gapPct: number | null;
  chosen: L10n | null;
  correct: L10n;
}

/** Within this relative error a wrong numeric claim is flagged as "close to actual". */
export const CLOSE_PCT = 10;

/** Simulation values used for the "after" state of a question's demo. */
export function demoValues(sim: SimulationDef, q: QuizQuestion) {
  return { ...defaultsOf(sim), ...q.demo };
}

export function buildComparison(
  sim: SimulationDef,
  q: QuizQuestion,
  chosen: number | null,
): Comparison | null {
  const before = sim.readouts(defaultsOf(sim));
  const after = sim.readouts(demoValues(sim, q));
  const key = q.focus ?? before[0]?.key;
  const b = before.find((r) => r.key === key);
  const a = after.find((r) => r.key === key);
  const correct = q.options[q.correct];
  if (!b || !a || !correct) return null;
  if (!Number.isFinite(b.value) || !Number.isFinite(a.value)) return null;

  const rawClaim = chosen !== null ? q.claims?.[chosen] : undefined;
  const claim = typeof rawClaim === "number" && Number.isFinite(rawClaim) ? rawClaim : undefined;
  const gap = claim !== undefined ? claim - a.value : null;
  const gapPct =
    gap !== null && Math.abs(a.value) > 1e-9 ? (Math.abs(gap) / Math.abs(a.value)) * 100 : null;
  return {
    key: a.key,
    label: a.label,
    symbol: a.symbol,
    unit: a.unit,
    digits: a.digits,
    before: b.value,
    claimed: claim ?? null,
    actual: a.value,
    gap,
    gapPct,
    chosen: chosen !== null ? (q.options[chosen] ?? null) : null,
    correct,
  };
}
