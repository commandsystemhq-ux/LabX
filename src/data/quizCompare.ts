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
  chosen: L10n | null;
  correct: L10n;
}

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

  const claim = chosen !== null ? q.claims?.[chosen] : undefined;
  return {
    key: a.key,
    label: a.label,
    symbol: a.symbol,
    unit: a.unit,
    digits: a.digits,
    before: b.value,
    claimed: claim ?? null,
    actual: a.value,
    chosen: chosen !== null ? (q.options[chosen] ?? null) : null,
    correct,
  };
}
