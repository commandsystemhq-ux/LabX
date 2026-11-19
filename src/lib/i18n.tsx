import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "ar" | "en";
export type Dir = "rtl" | "ltr";
/** A bilingual string. All user-facing copy in mock data uses this shape. */
export type L10n = { ar: string; en: string };

const STORAGE_KEY = "scienceverse.lang";

/** UI chrome strings (content strings live next to their data in src/data). */
export const ui = {
  brand: { ar: "ساينس فيرس", en: "ScienceVerse" },
  brandTagline: { ar: "النظام التعليمي التفاعلي للمدارس", en: "Interactive Learning System for Schools" },
  startFree: { ar: "ابدأ مجاناً", en: "Start free" },
  grade: { ar: "الصف", en: "Grade" },
  dashboard: { ar: "لوحة المنهج", en: "Dashboard" },
  langSwitch: { ar: "EN", en: "ع" },
  langSwitchLabel: { ar: "Switch to English", en: "التبديل إلى العربية" },
  xp: { ar: "نقاط XP", en: "XP" },
  streak: { ar: "أيام متتالية", en: "day streak" },
  units: { ar: "الوحدات", en: "Units" },
  lessons: { ar: "دروس", en: "lessons" },
  minutes: { ar: "دقيقة", en: "min" },
  mastery: { ar: "الإتقان", en: "Mastery" },
  launch: { ar: "ابدأ الدرس", en: "Launch" },
  continue: { ar: "كمّل", en: "Continue" },
  review: { ar: "راجع", en: "Review" },
  mastered: { ar: "متقن", en: "Mastered" },
  inProgress: { ar: "جاري", en: "In progress" },
  notStarted: { ar: "جديد", en: "New" },
  steps1: { ar: "قصة واقعية", en: "Real story" },
  steps2: { ar: "شرح تفاعلي", en: "Interactive explain" },
  steps3: { ar: "تجربة حرة", en: "Free lab" },
  steps4: { ar: "اختبار الفهم", en: "Check understanding" },
  boardMode: { ar: "وضع السبورة للمعلم", en: "Teacher board mode" },
  exitBoard: { ar: "خروج من وضع السبورة", en: "Exit board mode" },
  play: { ar: "تشغيل", en: "Play" },
  pause: { ar: "إيقاف مؤقت", en: "Pause" },
  speed: { ar: "السرعة", en: "Speed" },
  reset: { ar: "إعادة الضبط", en: "Reset" },
  layers: { ar: "الطبقات", en: "Layers" },
  labelsLayer: { ar: "التسميات والقيم", en: "Labels & values" },
  flowLayer: { ar: "اتجاه السريان", en: "Flow vectors" },
  macro: { ar: "المنظور الكلي", en: "Macro" },
  molecular: { ar: "المنظور الجزيئي", en: "Molecular" },
  variables: { ar: "المتغيرات", en: "Variables" },
  liveReadouts: { ar: "القراءات الحية", en: "Live readouts" },
  liveGraph: { ar: "الرسم البياني الحي", en: "Live graph" },
  baseline: { ar: "القيم الافتراضية", en: "Default values" },
  current: { ar: "الحالي", en: "Current" },
  aiTutor: { ar: "المعلم الذكي", en: "AI Tutor" },
  currentScene: { ar: "المشهد الحالي", en: "Current scene" },
  askPlaceholder: { ar: "اسأل المعلم الذكي عن المشهد...", en: "Ask the tutor about this scene..." },
  send: { ar: "إرسال", en: "Send" },
  typing: { ar: "بيكتب...", en: "typing..." },
  next: { ar: "التالي", en: "Next" },
  back: { ar: "السابق", en: "Back" },
  checkAnswer: { ar: "تأكيد الإجابة", en: "Check answer" },
  question: { ar: "سؤال", en: "Question" },
  of: { ar: "من", en: "of" },
  correct: { ar: "إجابة صحيحة! 🎉", en: "Correct! 🎉" },
  wrong: { ar: "مش بالظبط…", en: "Not quite…" },
  seeMistake: { ar: "شاهد الخطأ عملياً في المحاكاة", en: "See the mistake live in the simulation" },
  tryAgain: { ar: "حاول تاني", en: "Try again" },
  quizDone: { ar: "خلصت الاختبار!", en: "Quiz complete!" },
  restartQuiz: { ar: "إعادة الاختبار", en: "Restart quiz" },
  backToDashboard: { ar: "رجوع للوحة المنهج", en: "Back to dashboard" },
  startExplain: { ar: "يلا نفهم اللي بيحصل", en: "Let's see what's happening" },
  goLab: { ar: "انتقل للتجربة الحرة", en: "Go to free lab" },
  goQuiz: { ar: "اختبر فهمك", en: "Test yourself" },
  demoMode: { ar: "وضع العرض العملي", en: "Live demo" },
  hideNote: { ar: "إخفاء", en: "Dismiss" },
  labHint: {
    ar: "حرّك أي متغير من اللوحة ولاحظ المحاكاة والرسم البياني بيتغيروا لحظياً.",
    en: "Drag any variable in the panel and watch the stage and graph react instantly.",
  },
} satisfies Record<string, L10n>;

export type UiKey = keyof typeof ui;

interface LanguageContextValue {
  lang: Lang;
  dir: Dir;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  /** Translate a UI chrome key. */
  t: (key: UiKey) => string;
  /** Pick the active language from a bilingual value. */
  l: (value: L10n) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "ar" || saved === "en") setLangState(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      setLang,
      toggle: () => setLang(lang === "ar" ? "en" : "ar"),
      t: (key) => ui[key][lang],
      l: (v) => v[lang],
    }),
    [lang, setLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider>");
  return ctx;
}
