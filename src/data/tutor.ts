import type { Lang } from "@/lib/i18n";
import type { GuidedStep, Hazard } from "./simExtras";
import type { SimValues, SimulationDef, TutorIntent, ValueChange } from "./simulations";

/**
 * Context-aware tutor. Replies are built locally from what is on screen right now
 * (values, step, mode, view, faults, hazards, active guided task). A real LLM can replace
 * `buildTutorReply` later, but must be called server-side with this same context object.
 */

export type ControlMode = "guided" | "free";

export interface TutorContext {
  lang: Lang;
  values: SimValues;
  change: ValueChange | null;
  step: number;
  mode: ControlMode;
  view: "macro" | "molecular";
  hazards: Hazard[];
  errorMode: boolean;
  guided: { index: number; total: number; step: GuidedStep; done: boolean } | null;
}

export const MAX_QUESTION_LENGTH = 300;

/** Light Arabic normalisation so keyword matching survives hamza / ya / ta-marbuta variants. */
export function normalise(text: string) {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

const rules: [TutorIntent, RegExp][] = [
  [
    "hazard",
    /خطر|احترق|ينفجر|انفجار|شرار|فيوز|حريق|امان|danger|hazard|unsafe|burn|explod|fuse|spark|safe|fire/,
  ],
  [
    "hint",
    /ساعد|تلميح|مش فاهم|اعمل ايه|اعمل ايه|اعمل اي|الخطوه|hint|help|stuck|next step|what (do|should) i/,
  ],
  ["why", /ليه|ليش|لماذا|اتغير|why|changed/],
  ["example", /مثال|حياتي|حياه|example|real.?life/],
  ["mistake", /غلط|خطا|mistake|wrong|misconception/],
  ["colloquial", /اشرح|بالعاميه|بسط|explain|simpl/],
];

export function detectIntent(text: string): TutorIntent {
  const q = normalise(text);
  for (const [intent, re] of rules) if (re.test(q)) return intent;
  return "free";
}

const safeTips: Record<SimulationDef["id"], { ar: string; en: string }> = {
  ohm: {
    ar: "جرّب ترفع الجهد فوق 20V مع مقاومة صغيرة، أو فعّل وضع الأخطاء الواقعية وجرّب قصر الدائرة.",
    en: "Try pushing voltage above 20V with a small resistor, or enable Error Mode and try the short circuit.",
  },
  "reaction-rate": {
    ar: "جرّب ترفع الحرارة فوق 70°C مع تركيز عالي، أو فعّل وضع الأخطاء الواقعية وجرّب الخلط دفعة واحدة.",
    en: "Try going above 70°C with high concentration, or enable Error Mode and try mixing everything at once.",
  },
  diffusion: {
    ar: "جرّب ترفع الحرارة فوق 50°C، أو فعّل وضع الأخطاء الواقعية وجرّب الغشاء التالف.",
    en: "Try going above 50°C, or enable Error Mode and try the damaged membrane.",
  },
};

function hazardLine(h: Hazard, lang: Lang) {
  const ar = lang === "ar";
  const icon = h.level === 2 ? "🚨" : "⚠️";
  return ar
    ? `${icon} ${h.title.ar}: ${h.cause.ar}.\nالنتيجة الواقعية: ${h.consequence.ar}\n✅ الحل: ${h.fix.ar}`
    : `${icon} ${h.title.en}: ${h.cause.en}.\nReal-world result: ${h.consequence.en}\n✅ Fix: ${h.fix.en}`;
}

function hazardReply(sim: SimulationDef, ctx: TutorContext) {
  const { hazards, lang } = ctx;
  const ar = lang === "ar";
  const [top, ...rest] = hazards;
  if (!top) {
    return `${ar ? "✅ المشهد الحالي آمن، مفيش خطر دلوقتي." : "✅ The current scene is safe — no hazard right now."}\n${safeTips[sim.id][lang]}`;
  }
  const extra = rest.length
    ? ar
      ? `\n\n(وفيه ${rest.length} تحذير إضافي في اللوحة.)`
      : `\n\n(${rest.length} more warning(s) are listed in the panel.)`
    : "";
  return hazardLine(top, lang) + extra;
}

function hintReply(ctx: TutorContext) {
  const ar = ctx.lang === "ar";
  if (ctx.step === 1) {
    return ar
      ? "اقرا القصة واكتب توقعك في دماغك، وبعدين اضغط «يلا نفهم اللي بيحصل» عشان نبدأ."
      : "Read the story, make a prediction in your head, then press “Let's see what's happening”.";
  }
  if (ctx.step === 2 && ctx.guided) {
    const { step, index, total, done } = ctx.guided;
    if (done) {
      return ar
        ? `برافو! خلصت الخطوة ${index + 1} من ${total}. اضغط «الخطوة التالية» وكمّل.`
        : `Well done! Step ${index + 1} of ${total} is complete. Press “Next step” to continue.`;
    }
    return ar
      ? `الخطوة ${index + 1} من ${total}: ${step.task.ar}\n💡 ${step.hint.ar}`
      : `Step ${index + 1} of ${total}: ${step.task.en}\n💡 ${step.hint.en}`;
  }
  if (ctx.step === 2) {
    return ar
      ? "إنت في الوضع الحر. غيّر متغير واحد بس كل مرة وراقب الرسم البياني، أو فعّل «مساعدة خطوة بخطوة» لو عايز توجيه."
      : "You're in free mode. Change one variable at a time and watch the graph, or switch on guided help for step-by-step directions.";
  }
  if (ctx.step === 3) {
    return ar
      ? "جرّب تحرك متغير واحد كل مرة، وبدّل بين المنظور الكلي والجزيئي. ولو عايز تشوف الأخطاء الحقيقية فعّل «وضع الأخطاء الواقعية»."
      : "Move one variable at a time and switch between macro and molecular views. Enable Real-World Error Mode to see real failures.";
  }
  return ar
    ? "فكّر في العلاقة بين المتغيرات اللي جربتها. لو غلطت اضغط «شاهد الخطأ عملياً» وهتشوف السبب في المحاكاة."
    : "Think about the relationships you tested. If you miss, press “See the mistake live” to find out why in the simulation.";
}

/**
 * Short nudge shown after a minute of inactivity: the scene as it is right now plus one concrete
 * next move for the open step. Null in the free lab (step 3), where nobody should be interrupted.
 */
export function buildIdleHint(sim: SimulationDef, ctx: TutorContext): string | null {
  if (ctx.step === 3) return null;
  const ar = ctx.lang === "ar";
  const scene = sim.context(ctx.values, ctx.lang).slice(0, 160);
  const top = ctx.hazards[0];

  let tip: string;
  if (top) {
    tip = ar ? `⚠️ ${top.title.ar}. الحل: ${top.fix.ar}` : `⚠️ ${top.title.en}. Fix: ${top.fix.en}`;
  } else if (ctx.step === 1) {
    tip = ar
      ? "فكّر في إجابة سؤال القصة، وبعدين اضغط «يلا نفهم اللي بيحصل»."
      : "Think about the story's question, then press “Let's see what's happening”.";
  } else if (ctx.step === 2 && ctx.guided) {
    const { step, index, total, done } = ctx.guided;
    tip = done
      ? ar
        ? `خلصت الخطوة ${index + 1} من ${total}. اضغط «الخطوة التالية».`
        : `Step ${index + 1} of ${total} is done. Press “Next step”.`
      : ar
        ? `${step.task.ar} 💡 ${step.hint.ar}`
        : `${step.task.en} 💡 ${step.hint.en}`;
  } else if (ctx.step === 2) {
    tip = ar
      ? "غيّر متغيراً واحداً وراقب القراءات والرسم البياني."
      : "Change one variable and watch the readouts and the graph.";
  } else {
    tip = ar
      ? "فكّر في العلاقة بين المتغيرات اللي جرّبتها. لو غلطت، «شاهد الخطأ عملياً» بيوضح السبب."
      : "Think about how the variables you tried relate. If you miss, “See the mistake live” shows why.";
  }
  return top ? `${scene}\n${tip}` : `${scene}\n💡 ${tip}`;
}

export function buildTutorReply(sim: SimulationDef, intent: TutorIntent, ctx: TutorContext) {
  if (intent === "hint") return hintReply(ctx);
  if (intent === "hazard") return hazardReply(sim, ctx);

  const base = sim.tutor(intent, ctx.values, ctx.lang, ctx.change);
  const top = ctx.hazards[0];
  if (top && (intent === "why" || intent === "free" || intent === "colloquial")) {
    return `${base}\n\n${hazardLine(top, ctx.lang)}`;
  }
  return base;
}
