import type { SimulationDef, TutorIntent } from "@/data/simulations";
import type { TutorContext } from "@/data/tutor";
import { MAX_QUESTION, type AskTutorInput, type AskTutorResult } from "./ai-config";
import { askAiTutorFn } from "./ai-tutor.functions";

const CLIENT_TIMEOUT_MS = 25_000;
/** After the platform reports "AI disabled" don't ask again for a while (saves a round trip). */
const DISABLED_BACKOFF_MS = 5 * 60_000;
const RATE_BACKOFF_MS = 60_000;

let blockedUntil = 0;

type Ask = (opts: { data: AskTutorInput }) => Promise<AskTutorResult>;

export interface AiReplyParams {
  sim: SimulationDef;
  ctx: TutorContext;
  question: string;
  intent: TutorIntent;
  accessToken: string | null;
  /** Injected in tests. */
  ask?: Ask;
  now?: () => number;
}

/**
 * Asks the server-side AI tutor. Resolves to the reply text, or null whenever the caller should
 * answer locally instead (signed out, AI off, rate limited, timeout, network or provider error).
 * Never throws and never shows an error to the student.
 */
export async function requestAiReply(p: AiReplyParams): Promise<string | null> {
  const now = p.now ?? Date.now;
  if (!p.accessToken || now() < blockedUntil) return null;

  const { ctx } = p;
  const guidedTask = ctx.step === 2 && ctx.guided && !ctx.guided.done ? ctx.guided.step.task : null;
  const data: AskTutorInput = {
    accessToken: p.accessToken,
    question: p.question.slice(0, MAX_QUESTION),
    intent: p.intent,
    lang: ctx.lang,
    simId: p.sim.id,
    step: ctx.step,
    mode: ctx.mode,
    view: ctx.view,
    scene: p.sim.context(ctx.values, ctx.lang).slice(0, 600),
    hazards: ctx.hazards
      .slice(0, 3)
      .map((h) => `${h.title[ctx.lang]}: ${h.cause[ctx.lang]}`.slice(0, 240)),
    errorMode: ctx.errorMode,
    ...(guidedTask ? { task: guidedTask[ctx.lang].slice(0, 300) } : {}),
  };

  const ask = p.ask ?? (askAiTutorFn as unknown as Ask);
  try {
    const result = await Promise.race([
      ask({ data }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), CLIENT_TIMEOUT_MS)),
    ]);
    if (!result) return null;
    if (result.ok) return result.text;
    if (result.reason === "disabled") blockedUntil = now() + DISABLED_BACKOFF_MS;
    if (result.reason === "rate") blockedUntil = now() + RATE_BACKOFF_MS;
    return null;
  } catch {
    return null;
  }
}

/** Test helper: forget any "disabled / rate limited" backoff. */
export function resetAiBackoff() {
  blockedUntil = 0;
}
