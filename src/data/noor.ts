import type { Lang, L10n } from "@/lib/i18n";
import {
  allLessons,
  DEFAULT_GRADE,
  DEFAULT_SUBJECT,
  findLesson,
  getNextLesson,
  grades,
  isGradeId,
  isSubjectId,
  lessonExists,
  subjects,
  type GradeId,
  type LessonLookup,
  type SubjectId,
} from "./mockCurriculum";
import { normalise } from "./tutor";

/**
 * Noor, the platform-wide assistant: page awareness, local small talk / navigation / suggestions,
 * and the strict whitelist of "go to" actions. Pure (no React, no I/O) so the server can reuse the
 * catalog and the tests can exercise every branch.
 *
 * Safety: Noor never navigates by itself and never follows arbitrary URLs. A reply can only carry
 * actions of the kinds below, each validated against the real curriculum, and the student has to
 * click the button.
 */

export type NoorPage = "home" | "dashboard" | "lesson" | "auth" | "admin" | "other";

export function pageFromPath(pathname: string): NoorPage {
  if (pathname === "/" || pathname === "") return "home";
  const seg = pathname.split("/")[1];
  return seg === "dashboard" || seg === "lesson" || seg === "auth" || seg === "admin"
    ? seg
    : "other";
}

export interface PlatformContext {
  page: NoorPage;
  lang: Lang;
  signedIn: boolean;
  grade?: GradeId | undefined;
  subject?: SubjectId | undefined;
  lessonId?: string | undefined;
}

export interface PlatformStats {
  xp: number;
  level: number;
  streak: number;
  /** Lessons with mastery >= 85. */
  mastered: number;
  /** Lessons with any saved progress. */
  started: number;
}

/** The only shape of progress Noor needs, so this module never imports the progress store. */
export interface ProgressLike {
  lessons: Record<string, { step: number; mastery: number }>;
}

export type NoorAction =
  | { kind: "home" }
  | { kind: "dashboard"; grade?: GradeId | undefined; subject?: SubjectId | undefined }
  | { kind: "lesson"; id: string }
  | { kind: "auth"; mode: "signin" | "signup" };

export interface NoorReply {
  text: string;
  actions: NoorAction[];
}

/* --------------------------------- actions --------------------------------- */

const MAX_ACTIONS = 3;
const TAG_RE = /\[\[go:([A-Za-z0-9:_-]{1,80})\]\]/g;

function sameAction(a: NoorAction, b: NoorAction) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function parseTagBody(body: string): NoorAction | null {
  const [kind, a, b, extra] = body.split(":");
  if (extra !== undefined) return null;
  switch (kind) {
    case "home":
      return a === undefined ? { kind: "home" } : null;
    case "signin":
    case "signup":
      return a === undefined ? { kind: "auth", mode: kind } : null;
    case "lesson":
      return a !== undefined && b === undefined && lessonExists(a)
        ? { kind: "lesson", id: a }
        : null;
    case "dashboard": {
      if (a !== undefined && !isGradeId(a)) return null;
      if (b !== undefined && !isSubjectId(b)) return null;
      return {
        kind: "dashboard",
        ...(a !== undefined && isGradeId(a) ? { grade: a } : {}),
        ...(b !== undefined && isSubjectId(b) ? { subject: b } : {}),
      };
    }
    default:
      return null;
  }
}

/**
 * Pulls `[[go:…]]` tags out of an AI reply. Unknown or malformed tags are dropped silently, ids are
 * checked against the real curriculum, and at most three distinct actions survive. The returned
 * text never contains a tag.
 */
export function parseActionTags(text: string): NoorReply {
  const actions: NoorAction[] = [];
  const clean = text
    .replace(TAG_RE, (_m, body: string) => {
      const action = parseTagBody(body);
      if (action && actions.length < MAX_ACTIONS && !actions.some((x) => sameAction(x, action))) {
        actions.push(action);
      }
      return "";
    })
    .replace(/\[\[go:[^\]]*\]\]?/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { text: clean, actions };
}

const gradeById = (id: GradeId) => grades.find((g) => g.id === id)!;
const subjectById = (id: SubjectId) => subjects.find((s) => s.id === id)!;

export function actionLabel(action: NoorAction, lang: Lang): string {
  const ar = lang === "ar";
  switch (action.kind) {
    case "home":
      return ar ? "الصفحة الرئيسية" : "Home";
    case "auth":
      return action.mode === "signin"
        ? ar
          ? "تسجيل الدخول"
          : "Sign in"
        : ar
          ? "إنشاء حساب"
          : "Create account";
    case "lesson": {
      const { lesson, subject } = findLesson(action.id);
      return `${subject.emoji} ${lesson.title[lang]}`;
    }
    case "dashboard": {
      const parts = [ar ? "لوحة المنهج" : "Dashboard"];
      if (action.subject) parts.push(subjectById(action.subject).name[lang]);
      if (action.grade) parts.push(gradeById(action.grade).short[lang]);
      return parts.join(" · ");
    }
  }
}

/* ------------------------------ page + catalog ----------------------------- */

/** One-line description of where the student is, in the active language. */
export function describePage(pc: PlatformContext): string {
  const ar = pc.lang === "ar";
  switch (pc.page) {
    case "home":
      return ar ? "الصفحة الرئيسية" : "Home page";
    case "auth":
      return ar ? "صفحة الحساب" : "Account page";
    case "admin":
      return ar ? "لوحة إدارة نور" : "Noor administration";
    case "dashboard": {
      const g = gradeById(pc.grade ?? DEFAULT_GRADE).short[pc.lang];
      const s = subjectById(pc.subject ?? DEFAULT_SUBJECT).name[pc.lang];
      return ar ? `لوحة المنهج • ${g} • ${s}` : `Dashboard • ${g} • ${s}`;
    }
    case "lesson": {
      const { lesson } = findLesson(pc.lessonId);
      return ar ? `درس: ${lesson.title.ar}` : `Lesson: ${lesson.title.en}`;
    }
    default:
      return "LabX";
  }
}

/** `id | English title / Arabic title` lines for one grade: the only ids the AI may link to. */
export function lessonCatalog(grade: GradeId): string[] {
  return allLessons()
    .filter((x) => x.grade.id === grade)
    .map((x) => `${x.lesson.id} | ${x.subject.id}: ${x.lesson.title.en} / ${x.lesson.title.ar}`);
}

/** Next lesson to study: something already started and unmastered, else something untouched. */
export function recommendLesson(
  progress: ProgressLike,
  grade: GradeId = DEFAULT_GRADE,
  subject?: SubjectId,
): LessonLookup {
  const pool = allLessons().filter(
    (x) => x.grade.id === grade && (!subject || x.subject.id === subject),
  );
  const inProgress = pool.find((x) => {
    const p = progress.lessons[x.lesson.id];
    return p !== undefined && p.mastery < 85;
  });
  if (inProgress) return inProgress;
  const preferred = subject ?? DEFAULT_SUBJECT;
  return (
    pool.find((x) => x.subject.id === preferred && !progress.lessons[x.lesson.id]) ??
    pool.find((x) => !progress.lessons[x.lesson.id]) ??
    pool[0]!
  );
}

/* -------------------------------- intents --------------------------------- */

export type PlatformIntent =
  | "signin"
  | "navigate"
  | "recommend"
  | "progress"
  | "thanks"
  | "identity"
  | "smalltalk"
  | "greet"
  | "help"
  | "unknown";

const platformRules: [Exclude<PlatformIntent, "unknown">, RegExp][] = [
  [
    "signin",
    /تسجيل (ال)?دخول|سجل دخول|سجلني|انشاء حساب|اعمل حساب|حساب جديد|sign ?in|log ?in|sign ?up|create (an )?account|register/,
  ],
  [
    "navigate",
    /خدني|وديني|افتح|روح (ل|ع|علي|الي)|اذهب|open |go to|take me|next lesson|الدرس التالي|الدرس الجاي/,
  ],
  [
    "recommend",
    /اقترح|رشح|اذاكر ايه|ابدا منين|ابدا ب?ايه|اتعلم ايه|what should i (study|learn)|recommend|suggest|where (do|should) i start/,
  ],
  ["progress", /تقدمي|مستواي|نقاطي|\bxp\b|streak|my progress|my level|how am i doing/],
  ["thanks", /شكرا|متشكر|تسلم|يسلمو|thanks|thank you/],
  ["identity", /انت مين|انتي مين|مين انت|من انت|اسمك|who are you|your name|what are you/],
  ["smalltalk", /عامل ايه|عامله ايه|اخبارك|ازيك|كيف حالك|how are you|how's it going/],
  [
    "greet",
    /(^|\s)(السلام عليكم|سلام|اهلا|مرحبا|هاي|صباح الخير|مساء الخير|hello|hi|hey)(\s|$|[!.,؟?])/,
  ],
  ["help", /تقدر تعمل|بتعمل ايه|بتعرف تعمل|what can you do|what do you do|how do i use/],
];

/** Null means "not a platform request": lesson questions and general science go to the tutor path. */
export function detectPlatformIntent(text: string): PlatformIntent | null {
  const q = normalise(text);
  for (const [intent, re] of platformRules) {
    if (!re.test(q)) continue;
    // "open the circuit" is physics, not navigation: only treat it as a request to go somewhere
    // when the sentence names a real destination.
    if (intent === "navigate" && !hasDestination(text)) continue;
    return intent;
  }
  return null;
}

const SUBJECT_RE: [SubjectId, RegExp][] = [
  ["biology", /احياء|بيولوجي|biolog/],
  ["physics", /فيزياء|فيزيا|physic/],
  ["chemistry", /كيمياء|كيميا|chemi/],
];
const GRADE_RE: [GradeId, RegExp][] = [
  ["g10", /اولي|الاول|(^|\D)10(\D|$)|first|grade 10/],
  ["g11", /تاني|ثاني|(^|\D)11(\D|$)|second|grade 11/],
  ["g12", /تالت|ثالث|(^|\D)12(\D|$)|third|grade 12/],
];

export function subjectFromText(text: string): SubjectId | undefined {
  const q = normalise(text);
  return SUBJECT_RE.find(([, re]) => re.test(q))?.[0];
}

export function gradeFromText(text: string): GradeId | undefined {
  const q = normalise(text);
  return GRADE_RE.find(([, re]) => re.test(q))?.[0];
}

const STOP = new Set([
  "افتح",
  "درس",
  "الدرس",
  "خدني",
  "وديني",
  "روح",
  "عايز",
  "عاوز",
  "اشوف",
  "الي",
  "علي",
  "open",
  "lesson",
  "the",
  "take",
  "show",
  "for",
  "about",
]);

const words = (s: string) =>
  normalise(s)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 3 && !STOP.has(w));

/** Best lesson whose title shares meaningful words with the text, or null when nothing fits. */
export function findLessonByText(text: string, preferGrade?: GradeId): LessonLookup | null {
  const tokens = words(text);
  if (tokens.length === 0) return null;
  const grade = preferGrade ?? DEFAULT_GRADE;

  let best: { score: number; item: LessonLookup } | null = null;
  for (const item of allLessons()) {
    const hay = `${normalise(item.lesson.title.ar)} ${normalise(item.lesson.title.en)}`;
    const hits = tokens.filter((w) => hay.includes(w));
    const strong = hits.some((w) => w.length >= 4);
    if (hits.length < 2 && !(hits.length === 1 && strong && tokens.length === 1)) continue;
    const score = hits.length + (item.grade.id === grade ? 0.5 : 0);
    if (!best || score > best.score) best = { score, item };
  }
  return best?.item ?? null;
}

const HOME_RE = /الرئيسيه|home|main page|landing/;
const DASHBOARD_RE = /لوحه|dashboard|المنهج|curriculum|المواد|subjects/;
const NEXT_RE = /next lesson|الدرس التالي|الدرس الجاي/;

function hasDestination(text: string) {
  const q = normalise(text);
  return (
    NEXT_RE.test(q) ||
    HOME_RE.test(q) ||
    DASHBOARD_RE.test(q) ||
    subjectFromText(text) !== undefined ||
    findLessonByText(text) !== null
  );
}

/* --------------------------------- replies --------------------------------- */

function defaultActions(pc: PlatformContext, progress: ProgressLike): NoorAction[] {
  switch (pc.page) {
    case "lesson": {
      const { grade, subject } = findLesson(pc.lessonId);
      const next = pc.lessonId ? getNextLesson(pc.lessonId) : null;
      return [
        { kind: "dashboard", grade: grade.id, subject: subject.id },
        ...(next ? [{ kind: "lesson", id: next.lesson.id } as const] : []),
      ];
    }
    case "dashboard": {
      const rec = recommendLesson(progress, pc.grade, pc.subject);
      return [{ kind: "lesson", id: rec.lesson.id }];
    }
    case "auth":
    case "admin":
      return [{ kind: "dashboard" }];
    default: {
      const rec = recommendLesson(progress, pc.grade, pc.subject);
      return [{ kind: "dashboard" }, { kind: "lesson", id: rec.lesson.id }];
    }
  }
}

function capabilities(ar: boolean) {
  return ar
    ? "أقدر أشرحلك المحاكاة والقراءات، أنبّهك للمخاطر، أقترح عليك درس، وأفتحلك أي صفحة في المنصة."
    : "I can explain the simulations and readings, warn you about hazards, suggest a lesson, and open any page of the platform for you.";
}

function navigationReply(text: string, pc: PlatformContext, progress: ProgressLike): NoorReply {
  const ar = pc.lang === "ar";
  const q = normalise(text);
  const grade = gradeFromText(text);
  const subject = subjectFromText(text);

  if (NEXT_RE.test(q)) {
    const next = pc.lessonId ? getNextLesson(pc.lessonId) : null;
    if (next) {
      return {
        text: ar ? "تمام! ده الدرس التالي 👇" : "Sure! Here is the next lesson 👇",
        actions: [{ kind: "lesson", id: next.lesson.id }],
      };
    }
    return {
      text: ar
        ? "مفيش درس تالي هنا. ممكن ترجع للوحة المنهج وتختار درس تاني 👇"
        : "There's no next lesson here. Head back to the dashboard and pick another 👇",
      actions: [{ kind: "dashboard" }],
    };
  }

  const lesson = findLessonByText(text, grade ?? pc.grade);
  if (lesson) {
    return {
      text: ar ? "لقيت الدرس ده 👇" : "I found this lesson 👇",
      actions: [{ kind: "lesson", id: lesson.lesson.id }],
    };
  }

  if (HOME_RE.test(q)) {
    return {
      text: ar ? "حاضر، دي الصفحة الرئيسية 👇" : "Sure, here is the home page 👇",
      actions: [{ kind: "home" }],
    };
  }

  if (grade || subject || DASHBOARD_RE.test(q)) {
    return {
      text: ar ? "تمام! افتح لوحة المنهج من هنا 👇" : "Sure! Open the dashboard from here 👇",
      actions: [{ kind: "dashboard", grade: grade ?? pc.grade, subject }],
    };
  }

  return {
    text: ar
      ? "تحب أفتحلك إيه؟ قولّي اسم درس أو مادة (أحياء، فيزياء، كيمياء) أو اختار من هنا 👇"
      : "Where would you like to go? Tell me a lesson or subject (biology, physics, chemistry) or pick one 👇",
    actions: defaultActions(pc, progress),
  };
}

/** Local (no-AI) replies for everything that is about the platform rather than the physics on screen. */
export function buildPlatformReply(
  intent: PlatformIntent,
  text: string,
  pc: PlatformContext,
  stats: PlatformStats,
  progress: ProgressLike,
): NoorReply {
  const ar = pc.lang === "ar";
  const where = describePage(pc);
  const actions = defaultActions(pc, progress);

  switch (intent) {
    case "navigate":
      return navigationReply(text, pc, progress);

    case "recommend": {
      const rec = recommendLesson(progress, pc.grade, pc.subject);
      const started = progress.lessons[rec.lesson.id] !== undefined;
      return {
        text: ar
          ? `${started ? "كمّل" : "ابدأ"} بدرس «${rec.lesson.title.ar}» (${rec.subject.name.ar}) 👇`
          : `${started ? "Continue with" : "Start with"} “${rec.lesson.title.en}” (${rec.subject.name.en}) 👇`,
        actions: [{ kind: "lesson", id: rec.lesson.id }],
      };
    }

    case "progress":
      return {
        text: ar
          ? `مستواك ${stats.level} • ${stats.xp} نقطة XP • ${stats.streak} يوم متتالي • ${stats.mastered} درس متقن من ${stats.started} ابتديتهم.${pc.signedIn ? "" : "\nسجّل دخول عشان تقدمك يتحفظ."}`
          : `Level ${stats.level} • ${stats.xp} XP • ${stats.streak}-day streak • ${stats.mastered} lessons mastered out of ${stats.started} started.${pc.signedIn ? "" : "\nSign in so your progress is kept."}`,
        actions: pc.signedIn ? actions : [{ kind: "auth", mode: "signin" }, ...actions],
      };

    case "signin":
      return pc.signedIn
        ? {
            text: ar
              ? "إنت مسجّل دخول بالفعل ✅ تقدمك بيتحفظ في حسابك."
              : "You're already signed in ✅ Your progress is saved to your account.",
            actions,
          }
        : {
            text: ar
              ? "سجّل دخول أو أنشئ حساب عشان تقدمك ونقاطك يتحفظوا على كل أجهزتك 👇"
              : "Sign in or create an account so your progress and XP are kept on every device 👇",
            actions: [
              { kind: "auth", mode: "signin" },
              { kind: "auth", mode: "signup" },
            ],
          };

    case "thanks":
      return {
        text: ar
          ? "العفو! أنا هنا لو احتجت أي حاجة 😊"
          : "You're welcome! I'm here if you need anything 😊",
        actions: [],
      };

    case "identity":
      return {
        text: ar
          ? `أنا نور 🌟 المساعد الذكي بتاع LabX. ${capabilities(true)}`
          : `I'm Noor 🌟 LabX's AI assistant. ${capabilities(false)}`,
        actions,
      };

    case "smalltalk":
      return {
        text: ar
          ? `الحمد لله تمام، شكراً لسؤالك! 😊 إنت دلوقتي في: ${where}. تحب نعمل إيه؟`
          : `I'm doing great, thanks for asking! 😊 You're on: ${where}. What shall we do?`,
        actions,
      };

    case "greet": {
      const salam = /سلام/.test(normalise(text));
      const hello = ar ? (salam ? "وعليكم السلام ورحمة الله! " : "أهلاً بيك! ") : "Hi there! ";
      return {
        text:
          hello +
          (ar
            ? `أنا نور 👋 مساعدك في LabX. إنت دلوقتي في: ${where}.\n${capabilities(true)}`
            : `I'm Noor 👋 your LabX assistant. You're on: ${where}.\n${capabilities(false)}`),
        actions,
      };
    }

    case "help":
      return {
        text: ar
          ? `${capabilities(true)}\nجرّب تقولّي مثلاً: «افتح درس قانون أوم» أو «اقترح لي درس» أو «تقدمي».`
          : `${capabilities(false)}\nTry: “open the Ohm's law lesson”, “suggest a lesson” or “my progress”.`,
        actions,
      };

    default:
      return {
        text: ar
          ? `مقدرتش أجاوب على ده دلوقتي، بس أقدر أوجّهك. إنت في: ${where}.\n${capabilities(true)}`
          : `I can't answer that right now, but I can point you somewhere. You're on: ${where}.\n${capabilities(false)}`,
        actions,
      };
  }
}

export const noorGreeting = (lang: Lang): string =>
  lang === "ar"
    ? "أهلاً! أنا نور 🌟 مساعدك في LabX. اسألني عن المحاكاة اللي قدامك، أو اطلب مني أفتحلك أي درس أو صفحة."
    : "Hi! I'm Noor 🌟 your LabX assistant. Ask me about the simulation in front of you, or ask me to open any lesson or page.";

export const noorPlatformPrompts: { intent: PlatformIntent; label: L10n }[] = [
  { intent: "navigate", label: { ar: "خدني للوحة المنهج", en: "Take me to the dashboard" } },
  { intent: "recommend", label: { ar: "اقترح لي درس", en: "Suggest a lesson" } },
  { intent: "help", label: { ar: "تقدر تعمل إيه؟", en: "What can you do?" } },
];
