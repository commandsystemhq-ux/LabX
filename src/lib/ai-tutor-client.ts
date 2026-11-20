import type { GradeId, SubjectId } from "@/data/mockCurriculum";
import type { NoorPage } from "@/data/noor";
import type { SimulationDef } from "@/data/simulations";
import type { TutorContext } from "@/data/tutor";
import {
  MAX_HISTORY_TURNS,
  MAX_LESSON_TEXT,
  MAX_QUESTION,
  MAX_STUDENT_WORK,
  MAX_SUMMARY_CHARS,
  MAX_TURN_CHARS,
  type AskTutorInput,
  type AskTutorResult,
  type TUTOR_INTENTS,
} from "./ai-config";
import { askAiTutorFn } from "./ai-tutor.functions";
import type { Lang } from "./i18n";

const CLIENT_TIMEOUT_MS = 25_000;
/** After the platform reports "AI disabled" don't ask again for a while (saves a round trip). */
const DISABLED_BACKOFF_MS = 5 * 60_000;
const RATE_BACKOFF_MS = 60_000;

let blocked: { until: number; reason: FallbackReason } | null = null;

type Ask = (opts: { data: AskTutorInput }) => Promise<AskTutorResult>;

/** Why the caller has to answer locally. "auth" = signed out, "offline" = timeout / network. */
export type FallbackReason = "disabled" | "auth" | "rate" | "error" | "offline";

export interface AiReplyParams {
  question: string;
  intent: (typeof TUTOR_INTENTS)[number];
  lang: Lang;
  accessToken: string | null;
  page: {
    page: NoorPage;
    grade?: GradeId | undefined;
    subject?: SubjectId | undefined;
    /** One line describing the page (used when there is no simulation). */
    scene: string;
  };
  /** Present only inside a lesson. */
  lesson?: { sim: SimulationDef; ctx: TutorContext } | null | undefined;
  /** Present only inside the live-board lesson (no simulation): the block text and the student's work. */
  support?:
    | {
        scene: string;
        block: number;
        phase: NonNullable<AskTutorInput["supportPhase"]>;
        lessonText: string;
        studentWork: string;
      }
    | null
    | undefined;
  /** Earlier turns of this chat (before `question`), so Noor remembers the conversation. */
  history?: { role: "student" | "noor"; text: string }[] | undefined;
  /** Digest of the turns older than `history`. */
  summary?: string | undefined;
  /** Called with the reason whenever no AI text is returned. */
  onFallback?: ((reason: FallbackReason) => void) | undefined;
  /** Injected in tests. */
  ask?: Ask;
  now?: () => number;
}

/**
 * Asks the server-side AI. Resolves to the reply text, or null whenever the caller should answer
 * locally instead (signed out, AI off, rate limited, timeout, network or provider error).
 * Never throws and never shows an error to the student.
 */
export async function requestAiReply(p: AiReplyParams): Promise<string | null> {
  const now = p.now ?? Date.now;
  const fallback = (reason: FallbackReason) => {
    p.onFallback?.(reason);
    return null;
  };
  if (!p.accessToken) return fallback("auth");
  if (blocked && now() < blocked.until) return fallback(blocked.reason);

  const { lesson } = p;
  const ctx = lesson?.ctx;
  const guidedTask =
    ctx?.step === 2 && ctx.guided && !ctx.guided.done ? ctx.guided.step.task : null;
  const data: AskTutorInput = {
    accessToken: p.accessToken,
    question: p.question.slice(0, MAX_QUESTION),
    ...(p.history?.length
      ? {
          history: p.history
            .slice(-MAX_HISTORY_TURNS)
            .map((m) => ({ role: m.role, text: m.text.slice(0, MAX_TURN_CHARS) })),
        }
      : {}),
    ...(p.summary ? { summary: p.summary.slice(0, MAX_SUMMARY_CHARS) } : {}),
    intent: p.intent,
    lang: p.lang,
    page: p.page.page,
    ...(p.page.grade ? { grade: p.page.grade } : {}),
    ...(p.page.subject ? { subject: p.page.subject } : {}),
    scene: (lesson && ctx
      ? lesson.sim.context(ctx.values, p.lang)
      : (p.support?.scene ?? p.page.scene)
    ).slice(0, 600),
    ...(p.support
      ? {
          lessonText: p.support.lessonText.slice(0, MAX_LESSON_TEXT),
          supportBlock: p.support.block,
          supportPhase: p.support.phase,
          ...(p.support.studentWork
            ? { studentWork: p.support.studentWork.slice(0, MAX_STUDENT_WORK) }
            : {}),
        }
      : {}),
    hazards: (ctx?.hazards ?? [])
      .slice(0, 3)
      .map((h) => `${h.title[p.lang]}: ${h.cause[p.lang]}`.slice(0, 240)),
    errorMode: ctx?.errorMode ?? false,
    ...(lesson && ctx
      ? { simId: lesson.sim.id, step: ctx.step, mode: ctx.mode, view: ctx.view }
      : {}),
    ...(guidedTask ? { task: guidedTask[p.lang].slice(0, 300) } : {}),
    ...(ctx?.prediction ? { prediction: ctx.prediction.slice(0, 200) } : {}),
    ...(ctx?.quizMistake
      ? {
          quizMistake:
            `${ctx.quizMistake.question} | picked: ${ctx.quizMistake.chosen} | correct: ${ctx.quizMistake.correct}`.slice(
              0,
              500,
            ),
        }
      : {}),
  };

  const ask = p.ask ?? (askAiTutorFn as unknown as Ask);
  try {
    const result = await Promise.race([
      ask({ data }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), CLIENT_TIMEOUT_MS)),
    ]);
    if (!result) return fallback("offline");
    if (result.ok) return result.text;
    if (result.reason === "disabled") {
      blocked = { until: now() + DISABLED_BACKOFF_MS, reason: "disabled" };
    }
    if (result.reason === "rate") blocked = { until: now() + RATE_BACKOFF_MS, reason: "rate" };
    return fallback(result.reason);
  } catch {
    return fallback("offline");
  }
}

/** Test helper: forget any "disabled / rate limited" backoff. */
export function resetAiBackoff() {
  blocked = null;
}
