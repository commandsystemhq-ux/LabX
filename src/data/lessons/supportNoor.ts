import type { Lang, L10n } from "@/lib/i18n";
import { MAX_LESSON_TEXT, MAX_STUDENT_WORK } from "@/lib/ai-config";
import { normalise } from "../tutor";
import { supportBlocks, verbatimText } from "./supportLesson";
import type { FeynmanDef, Keyword } from "./supportTypes";

/**
 * Noor for the support lesson: it carries the verbatim text of the block on screen, what the
 * student drew / chose / got wrong, and answers curriculum questions locally (guests) by quoting
 * the textbook. Registered users get the same context sent to the server-side AI.
 */

export type SupportPhase = "hook" | "board" | "lab" | "quiz" | "feynman" | "test" | "tools";

export interface SupportMistake {
  block: number;
  kind:
    "deposit" | "pick" | "numeric" | "label" | "match" | "mcq" | "compare" | "graph" | "mystery";
  /** What the student picked / typed and what was right, already in short plain text. */
  picked: L10n;
  correct: L10n;
  /** The correction (restates the textbook fact). */
  explain: L10n;
}

export interface SupportNoorContext {
  lessonId: string;
  block: number;
  phase: SupportPhase;
  view: "3d" | "2d";
  /** Last things the student did (newest last), shown to Noor as the "student work". */
  actions: L10n[];
  mistakes: SupportMistake[];
}

const PHASE_NAME: Record<SupportPhase, L10n> = {
  hook: { ar: "سؤال قبل الشرح", en: "Question before the explanation" },
  board: { ar: "السبورة الحية", en: "Live board" },
  lab: { ar: "الشغل العملي", en: "Hands-on lab" },
  quiz: { ar: "العودة للسؤال والأسئلة الفورية", en: "Back to the question + quick quiz" },
  feynman: { ar: "اشرح لي كأني صاحبك", en: "Explain it to a friend" },
  test: { ar: "اختبر نفسك", en: "Self-test" },
  tools: { ar: "أدوات الدرس", en: "Lesson tools" },
};

export function phaseName(p: SupportPhase): L10n {
  return PHASE_NAME[p];
}

/** One line telling Noor (and the "you are here" box) what is on screen. */
export function supportScene(ctx: SupportNoorContext, lang: Lang): string {
  const b = supportBlocks.find((x) => x.n === ctx.block);
  const title = b ? b.title[lang] : "";
  const view = ctx.view === "3d" ? "3D" : lang === "ar" ? "2D شكل الامتحان" : "2D exam figure";
  return lang === "ar"
    ? `الجزئية ${ctx.block}: ${title} — ${PHASE_NAME[ctx.phase].ar} (${view})`
    : `Block ${ctx.block}: ${title} — ${PHASE_NAME[ctx.phase].en} (${view})`;
}

/** The full textbook text of the block on screen (verbatim), capped for the AI. */
export function supportLessonText(ctx: SupportNoorContext): string {
  const b = supportBlocks.find((x) => x.n === ctx.block);
  return b ? verbatimText(b).slice(0, MAX_LESSON_TEXT) : "";
}

/** What the student did and got wrong, as compact text for the AI prompt and the local replies. */
export function supportStudentWork(ctx: SupportNoorContext, lang: Lang): string {
  const lines: string[] = [];
  for (const a of ctx.actions.slice(-6)) lines.push(`- ${a[lang]}`);
  for (const m of ctx.mistakes.slice(-4)) {
    lines.push(
      lang === "ar"
        ? `- غلطة (${m.kind}) في الجزئية ${m.block}: اختار «${m.picked.ar}» والصح «${m.correct.ar}»`
        : `- Mistake (${m.kind}) in block ${m.block}: chose “${m.picked.en}”, correct “${m.correct.en}”`,
    );
  }
  return lines.join("\n").slice(0, MAX_STUDENT_WORK);
}

/* ------------------------------- local answers ------------------------------- */

interface Faq {
  re: RegExp;
  block: number;
  answer: L10n;
}

/** Curated answers to the questions students ask most; each restates the textbook. */
const FAQ: Faq[] = [
  {
    re: /(كيوتين|cutin).*(لجنين|lignin)|(لجنين|lignin).*(كيوتين|cutin)/,
    block: 2,
    answer: {
      ar: "الكيوتين بيترسب على جدر خلايا **البشرة من الخارج** عشان يمنع فقد الماء، لكن اللجنين بيترسب على جدر الإسكرلنشيمي والأوعية الخشبية **من الداخل** عشان يكسبها **القوة والصلابة**. الكيوتين مش بيدّي صلابة كفاية، واللجنين لو اترسب في البشرة الخلية الحية هتموت (خلايا الإسكرلنشيمي غير حية).",
      en: "Cutin is laid on the **outside** of epidermis walls to stop water loss, while lignin is laid on the **inside** of sclerenchyma and xylem walls to give **strength and rigidity**. Cutin is not rigid enough, and lignin in the epidermis would kill the living cell (sclerenchyma cells are dead).",
    },
  },
  {
    re: /(لجنين|lignin).*(ينفذ|منفذ|permeab|water|ماء)|(منفذ|permeab).*(لجنين|lignin)/,
    block: 2,
    answer: {
      ar: "اللجنين **غير منفذ للماء** (زي الكيوتين والسيوبرين). المادة المنفذة للماء من الأربعة هي **السيليلوز** بس.",
      en: "Lignin is **not permeable** to water (like cutin and suberin). Only **cellulose** is permeable.",
    },
  },
  {
    re: /(صليبي|cruciate|وسطي|medial|جانبي|lateral).*(رباط|ligament)|(رباط|ligament).*(صليبي|وسطي|جانبي)|(الفرق|difference).*(رباط|ligament)/,
    block: 13,
    answer: {
      ar: "في الركبة 4 أربطة: **صليبي أمامي، صليبي خلفي، وسطي، جانبي**. الفخذ بيرتبط بالقصبة بـ**ثلاثة** أربطة (الوسطي + الصليبي الأمامي + الصليبي الخلفي)، وبالشظية بالرباط **الجانبي** بس. وتمزق الرباط الصليبي بيحصل عند التواء المفصل.",
      en: "The knee has 4 ligaments: **anterior cruciate, posterior cruciate, medial, lateral**. The femur is tied to the tibia by **three** (medial + anterior cruciate + posterior cruciate) and to the fibula by the **lateral** ligament only. A cruciate ligament can tear when the joint is twisted.",
    },
  },
  {
    re: /(فرق|difference|vs|مقابل).*(رباط|ligament).*(وتر|tendon)|(وتر|tendon).*(رباط|ligament)/,
    block: 14,
    answer: {
      ar: "**الرباط** حزم من نسيج ضام ليفي بيربط **عظمة بعظمة** عند المفصل ويحدد حركتها. **الوتر** نسيج ضام قوي بيربط **العضلة بالعظمة** وبيسمح بالحركة عند انقباض وانبساط العضلة (مثال: وتر أخيل).",
      en: "A **ligament** (bundles of fibrous connective tissue) ties **bone to bone** at a joint and limits its movement. A **tendon** (strong connective tissue) ties **muscle to bone** so the joint moves when the muscle contracts and relaxes (e.g. the Achilles tendon).",
    },
  },
  {
    re: /(ضلع|ضلوع|rib).*(عايم|عائم|float|11|12|قص|stern)|(عائم|float)/,
    block: 8,
    answer: {
      ar: "الزوجان الحادي عشر والثاني عشر قصيران **ولا يتصلان بالقص** فاتسموا «الضلوع العائمة»، وبيتصلوا بالفقرتين رقمي **18 و19**. العشرة أزواج الأولى هي اللي بتوصل بين الفقرات الصدرية وعظمة القص.",
      en: "The 11th and 12th pairs are short and **do not reach the sternum**, so they are the “floating ribs”; they join vertebrae no. **18 and 19**. Only the first ten pairs link the thoracic vertebrae to the sternum.",
    },
  },
  {
    re: /(رسغ|wrist|carpal).*(زند|ulna)|(زند|ulna).*(رسغ|wrist)|(كعبره|radius).*(زند|ulna)/,
    block: 9,
    answer: {
      ar: "عظام رسغ اليد (8) بيتصل طرفها العلوي بالطرف السفلي للكعبرة، **ولا تتصل بعظمة الزند**. والكعبرة بتتحرك حركة نصف دائرية حول الزند الثابت، فتظهر متقاطعة معه على شكل حرف **X**.",
      en: "The 8 wrist bones meet the lower end of the **radius** and **not the ulna**. The radius swings in a half circle around the fixed ulna and appears crossed over it like an **X**.",
    },
  },
  {
    re: /(غضروف|cartilage).*(وعيه|اوعيه|دم|vessel|blood|غذاء|food)/,
    block: 11,
    answer: {
      ar: "الغضاريف **لا تحتوي على أوعية دموية**، فبتاخد الغذاء والأكسجين من خلايا العظام **بالانتشار** (حركة الجزيئات من تركيز مرتفع لتركيز منخفض).",
      en: "Cartilages **have no blood vessels**; they get food and oxygen from bone cells by **diffusion** (movement from high to low concentration).",
    },
  },
  {
    re: /(206|270|300|مولود|طفل|newborn|baby).*(عظم|bone)|(عظم|bone).*(206|270)/,
    block: 3,
    answer: {
      ar: "الهيكل العظمي للبالغ فيه **206** عظمة. الطفل حديث الولادة عنده تقريباً **270 : 300** عظمة، وبعدين بعض العظام بتلتحم: الفقرات العجزية، الفقرات العصعصية، وعظام الجزء المخي للجمجمة.",
      en: "An adult skeleton has **206** bones. A newborn has roughly **270–300**; some bones fuse later: the sacral vertebrae, the coccygeal vertebrae, and the cranial bones of the skull.",
    },
  },
  {
    re: /(80|126|محوري|axial|طرفي|appendicular)/,
    block: 4,
    answer: {
      ar: "الهيكل **المحوري = 80** عظمة (الجمجمة وملحقاتها 29 + القفص الصدري 25 + العمود الفقري 26). الهيكل **الطرفي = 126** (الحزام الصدري 4 + الطرفان العلويان 60 + الحزام الحوضي 2 + الطرفان السفليان 60). المجموع 206.",
      en: "The **axial** skeleton is **80** bones (skull and attached bones 29 + thoracic cage 25 + vertebral column 26). The **appendicular** is **126** (pectoral girdle 4 + upper limbs 60 + pelvic girdle 2 + lower limbs 60). Total 206.",
    },
  },
  {
    re: /(33|26).*(فقر|vertebra)|(فقر|vertebra).*(33|26)|(انحناء|curve)/,
    block: 5,
    answer: {
      ar: "العمود الفقري **33 فقرة في 5 مجموعات** (7 عنقية + 12 صدرية + 5 قطنية + 5 عجزية + 4 عصعصية) لكن عدد عظامه **26** لأن العجزية الخمس بتلتحم في عظمة والعصعصية الأربع في عظمة. وله **4 انحناءات**: العنقية للأمام، الصدرية للخلف، القطنية للأمام، والعجزية والعصعصية للخلف.",
      en: "The vertebral column has **33 vertebrae in 5 groups** (7 cervical + 12 thoracic + 5 lumbar + 5 sacral + 4 coccygeal) but **26 bones**, because the 5 sacral fuse into one and the 4 coccygeal into one. It has **4 curves**: cervical forward, thoracic backward, lumbar forward, sacral and coccygeal backward.",
    },
  },
  {
    re: /(نتوء|نتوءات|process).*(فقر|vertebra|7|سبع)|(فقر|vertebra).*(نتوء|process)/,
    block: 6,
    answer: {
      ar: "الفقرة النموذجية فيها **7 نتوءات**: نتوء شوكي واحد + نتوءان مستعرضان + نتوءان مفصليان علويان + نتوءان مفصليان سفليان (3 أزواج + مفرد). والفقرة العنقية الأولى ملهاش نتوء شوكي بارز عشان تسهّل حركة الرأس.",
      en: "A typical vertebra has **7 processes**: 1 spinous + 2 transverse + 2 superior articular + 2 inferior articular (3 pairs + 1 single). The first cervical vertebra has no prominent spinous process, which eases head movement.",
    },
  },
  {
    re: /(جمجمه|skull|cranium)/,
    block: 7,
    answer: {
      ar: "الجمجمة جزءان: **الجزء المخي (8 عظام)** فيه المخ وفي قاعه **الثقب الكبير** اللي يوصل المخ بالحبل الشوكي، و**الجزء الوجهي (14 عظمة)**. ومعاها عظام ملحقة: العظيمات السمعية (6) والعظم اللامي (1) فتبقى 29.",
      en: "The skull has two parts: the **cranial part (8 bones)** that houses the brain and has the **foramen magnum** at its base, and the **facial part (14 bones)**. Attached bones (6 ear ossicles + the hyoid) bring the total to 29.",
    },
  },
  {
    re: /(حزام حوضي|pelvic girdle|عظام الحوض|pelvis).*(4|عدد|how many|كام)|(عدد|كام|how many).*(حوض|pelvi)/,
    block: 10,
    answer: {
      ar: "الحزام الحوضي **عظمتان** (كل واحدة 3 عظام ملتحمة: الحرقفة + الورك + العانة). أما **عظام الحوض = 4**: عظمتا الحزام الحوضي + العجز + العصعص.",
      en: "The pelvic girdle is **2 bones** (each of 3 fused bones: ilium + ischium + pubis). The **pelvis = 4 bones**: the 2 girdle bones + the sacrum + the coccyx.",
    },
  },
  {
    re: /(مفصل|joint).*(نوع|انواع|types|ليفي|غضروفي|زلالي|fibrous|synovial)|(ليفي|غضروفي|زلالي|synovial|fibrous)/,
    block: 12,
    answer: {
      ar: "المفاصل 3 أنواع: **ليفية** (أنسجة ليفية تتحول مع العمر لعظمية، معظمها لا يتحرك، مثل الجمجمة)، **غضروفية** (حركة محدودة جداً، مثل بين أجسام الفقرات)، و**زلالية** (معظم مفاصل الجسم، فيها سائل زلالي وغضروف أملس؛ محدودة الحركة كالكوع والركبة وواسعة كالكتف والفخذ).",
      en: "There are 3 joint types: **fibrous** (fibrous tissue that turns bony with age, mostly immovable, e.g. the skull), **cartilaginous** (very limited movement, e.g. between vertebral bodies), and **synovial** (most body joints, with synovial fluid and smooth cartilage; limited like the elbow and knee, or wide like the shoulder and hip).",
    },
  },
  {
    re: /(اخيل|achilles)/,
    block: 14,
    answer: {
      ar: "**وتر أخيل** يصل **العضلة التوأمية** (بطن الساق) بـ**عظمة الكعب**. تمزقه بسبب مجهود عنيف أو تقلص مفاجئ أو انعدام مرونة العضلة؛ أعراضه: عدم القدرة على المشي، تورم، آلام حادة؛ علاجه: أدوية مضادة للالتهاب ومسكنة، جبيرة، وجراحة لو التمزق كامل.",
      en: "The **Achilles tendon** joins the **gastrocnemius** (calf) to the **heel bone**. It tears after violent effort, a sudden contraction or no flexibility in the muscle; symptoms: cannot walk, swelling, severe pain; treatment: anti-inflammatory/pain-killing drugs, a splint, and surgery when the tear is complete.",
    },
  },
  {
    re: /(عشبي|herb|خشبي|woody)/,
    block: 2,
    answer: {
      ar: "سيقان النباتات **العشبية** غضة مرنة خضراء وفيها نسبة قليلة من الخشب (الفول والملوخية). سيقان **الخشبية** صلبة بنية وفيها نسبة كبيرة من الخشب، وجذوع الأشجار المسنة عليها طبقة فلين (الصنوبر والسنط).",
      en: "**Herbaceous** stems are soft, flexible and green with little xylem (broad bean, molokhia). **Woody** stems are hard and brown with a lot of xylem, and old trunks have an outer cork layer (pine, acacia).",
    },
  },
];

const STOP = new Set(
  [
    "في",
    "من",
    "على",
    "الى",
    "عن",
    "هل",
    "ما",
    "ماذا",
    "هو",
    "هي",
    "ده",
    "دي",
    "ايه",
    "اي",
    "يعني",
    "the",
    "of",
    "and",
    "is",
    "a",
    "in",
    "to",
    "what",
    "are",
    "how",
    "does",
    "do",
    "why",
    "عشان",
    "ليه",
    "كام",
    "لو",
  ].map(normalise),
);

const stem = (w: string) => (w.startsWith("ال") && w.length > 4 ? w.slice(2) : w);

export function tokens(text: string): string[] {
  return normalise(text)
    .split(/[^\p{L}\p{N}]+/u)
    .map(stem)
    .filter((w) => w.length >= 2 && !STOP.has(w));
}

interface Line {
  block: number;
  text: string;
  tokens: Set<string>;
}

let LINES: Line[] | null = null;
let DF: Map<string, number> | null = null;

function index() {
  if (LINES && DF) return { lines: LINES, df: DF };
  const lines: Line[] = [];
  const df = new Map<string, number>();
  for (const b of supportBlocks) {
    for (const [, text] of b.textbookVerbatim) {
      const t = new Set(tokens(text));
      lines.push({ block: b.n, text, tokens: t });
      for (const w of t) df.set(w, (df.get(w) ?? 0) + 1);
    }
  }
  LINES = lines;
  DF = df;
  return { lines, df };
}

export interface BookHit {
  block: number;
  text: string;
  score: number;
}

/** The textbook lines that best match a question (the current block gets a small boost). */
export function searchBook(question: string, currentBlock?: number, limit = 3): BookHit[] {
  const q = tokens(question);
  if (q.length === 0) return [];
  const { lines, df } = index();
  const total = lines.length;
  const hits: BookHit[] = [];
  for (const line of lines) {
    let score = 0;
    let matched = 0;
    for (const w of q) {
      let hit = line.tokens.has(w);
      if (!hit && w.length >= 4)
        hit = [...line.tokens].some((t) => t.length >= 4 && (t.startsWith(w) || w.startsWith(t)));
      if (hit) {
        matched++;
        score += Math.log(1 + total / (1 + (df.get(w) ?? 0)));
      }
    }
    if (matched === 0) continue;
    score *= 0.6 + 0.4 * (matched / q.length);
    if (currentBlock !== undefined && line.block === currentBlock) score *= 1.25;
    hits.push({ block: line.block, text: line.text, score });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

const MIN_SCORE = 2.2;

export type SupportIntent =
  "colloquial" | "why" | "example" | "mistake" | "free" | "hint" | "hazard";

/**
 * A local reply for guests (and for any failure of the server AI): the correction of the last
 * mistake when asked, then a curated answer or the exact textbook lines that match the question.
 */
export function buildSupportReply(
  ctx: SupportNoorContext,
  question: string,
  intent: SupportIntent,
  lang: Lang,
): string {
  const ar = lang === "ar";
  const block = supportBlocks.find((x) => x.n === ctx.block);
  const parts: string[] = [];

  const last = ctx.mistakes[ctx.mistakes.length - 1];
  const wantsMistake =
    intent === "mistake" ||
    intent === "why" ||
    /غلط|خطا|wrong|mistake|ليه/.test(normalise(question));
  if (last && wantsMistake) {
    parts.push(
      ar
        ? `## 📝 تصحيح آخر غلطة\nاخترت «${last.picked.ar}» والصح «${last.correct.ar}».\n${last.explain.ar}`
        : `## 📝 Correcting your last mistake\nYou chose “${last.picked.en}”; the right answer is “${last.correct.en}”.\n${last.explain.en}`,
    );
  }

  if (intent === "hint" && block) {
    parts.push(
      ar
        ? `## 💡 تلميح\nإنت في «${block.title.ar}». افتح «${PHASE_NAME.board.ar}» واقرا النص الحرفي، وبعدين جرّب «مصيدة الامتحان».`
        : `## 💡 Hint\nYou are in “${block.title.en}”. Open the live board, read the textbook text, then try the exam trap.`,
    );
  }

  const q = normalise(question);
  const faq = FAQ.find((f) => f.re.test(q));
  if (faq) {
    parts.push(`## 📘 ${ar ? "من الكتاب" : "From the textbook"}\n${faq.answer[lang]}`);
  } else if (!last || !wantsMistake) {
    const hits = searchBook(question, ctx.block).filter((h) => h.score >= MIN_SCORE);
    if (hits.length) {
      parts.push(
        `## 📘 ${ar ? "نص الكتاب بالحرف" : "The textbook, word for word"}\n` +
          hits.map((h) => `- «${h.text}» (${ar ? "الجزئية" : "block"} ${h.block})`).join("\n"),
      );
    } else if (intent !== "hint") {
      parts.push(
        ar
          ? "ملقيتش إجابة السؤال ده في نص الدرس. جرّب تسأل بكلمة من الكتاب (زي: اللجنين، الضلوع العائمة، وتر أخيل)."
          : "I could not find that in the lesson text. Try asking with a word from the book (e.g. lignin, floating ribs, Achilles tendon).",
      );
    }
  }

  const work = ctx.actions[ctx.actions.length - 1];
  if (work && intent === "free" && parts.length === 0) parts.push(work[lang]);
  return parts.join("\n\n");
}

/* --------------------------------- feynman ---------------------------------- */

export interface FeynmanReview {
  covered: Keyword[];
  missing: Keyword[];
  /** 0–100 */
  score: number;
  tooShort: boolean;
}

export const MIN_FEYNMAN_WORDS = 6;

export function reviewFeynman(answer: string, def: FeynmanDef): FeynmanReview {
  const text = normalise(answer);
  const words = tokens(answer);
  const covered: Keyword[] = [];
  const missing: Keyword[] = [];
  for (const k of def.keywords) {
    const hit = k.match.some((m) => {
      const n = normalise(m);
      return n.length > 0 && text.includes(n);
    });
    (hit ? covered : missing).push(k);
  }
  const score = def.keywords.length ? Math.round((100 * covered.length) / def.keywords.length) : 0;
  return { covered, missing, score, tooShort: words.length < MIN_FEYNMAN_WORDS };
}

/** Noor's written review of a "explain it to a friend" answer. */
export function feynmanFeedback(review: FeynmanReview, def: FeynmanDef, lang: Lang): string {
  const ar = lang === "ar";
  if (review.tooShort) {
    return ar
      ? "اكتب كام جملة بأسلوبك (6 كلمات على الأقل) وأنا أراجعها."
      : "Write a few sentences in your own words (at least 6 words) and I will review them.";
  }
  const missing = review.missing.map((k) => k.label[lang]).join(ar ? "، " : ", ");
  const head = ar
    ? `## 🎙️ مراجعة نور — ${review.score}٪\n`
    : `## 🎙️ Noor's review — ${review.score}%\n`;
  const good = review.covered.length
    ? (ar ? "✅ غطيت: " : "✅ You covered: ") +
      review.covered.map((k) => k.label[lang]).join(ar ? "، " : ", ")
    : "";
  const gap = review.missing.length
    ? (ar
        ? "\n🧩 كلمات علمية ناقصة لو ده سؤال مقالي: "
        : "\n🧩 Scientific keywords missing for an essay answer: ") + missing
    : ar
      ? "\n🏆 إجابتك كاملة علمياً!"
      : "\n🏆 Your answer is scientifically complete!";
  return head + good + gap + (review.missing.length ? `\n\n${def.model[lang]}` : "");
}
