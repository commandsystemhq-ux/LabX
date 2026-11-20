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

const STORAGE_KEY = "labx.lang";

/** UI chrome strings (content strings live next to their data in src/data). */
export const ui = {
  brand: { ar: "لاب إكس", en: "LabX" },
  brandTagline: {
    ar: "النظام التعليمي التفاعلي للمدارس",
    en: "Interactive Learning System for Schools",
  },
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
  controlMode: { ar: "وضع التحكم", en: "Control mode" },
  modeGuided: { ar: "مساعدة خطوة بخطوة", en: "Step-by-step help" },
  modeFree: { ar: "وضع حر", en: "Free mode" },
  errorMode: { ar: "وضع الأخطاء الواقعية", en: "Real-world error mode" },
  errorModeHint: {
    ar: "جرّب أخطاء التركيب والخلط وشوف نتايجها الحقيقية.",
    en: "Try wiring and mixing mistakes and see their real consequences.",
  },
  noFault: { ar: "تشغيل سليم", en: "Healthy setup" },
  hazards: { ar: "تحذيرات السلامة", en: "Safety warnings" },
  noHazards: { ar: "كل شيء آمن ✅", en: "All clear ✅" },
  warning: { ar: "تحذير", en: "Warning" },
  critical: { ar: "خطر شديد", en: "Critical" },
  cause: { ar: "السبب", en: "Cause" },
  consequence: { ar: "النتيجة الواقعية", en: "Real-world result" },
  fix: { ar: "الحل", en: "Fix" },
  calcTitle: { ar: "الحسابات الحية", en: "Live calculations" },
  guidedTitle: { ar: "اكتشاف موجّه", en: "Guided discovery" },
  guidedStep: { ar: "الخطوة", en: "Step" },
  nextGuided: { ar: "الخطوة التالية", en: "Next step" },
  skipStep: { ar: "تخطي", en: "Skip" },
  stepDone: { ar: "تمام! ✅", en: "Done! ✅" },
  showHint: { ar: "تلميح", en: "Hint" },
  tutorHint: { ar: "ساعدني في الخطوة", en: "Help with this step" },
  tutorHazard: { ar: "إيه الخطر هنا؟", en: "What's the danger here?" },
  timeline: { ar: "الخط الزمني", en: "Timeline" },
  equilibrium: { ar: "الاتزان", en: "Equilibrium" },
  compareTitle: { ar: "قارن بالمحاكاة", en: "Compare with the simulation" },
  before: { ar: "قبل", en: "Before" },
  yourClaim: { ar: "اللي اخترته يعني", en: "Your answer implies" },
  actual: { ar: "الفعلي", en: "Actual" },
  backToQuiz: { ar: "ارجع للاختبار", en: "Back to quiz" },
  nextLesson: { ar: "الدرس التالي", en: "Next lesson" },
  progressSaved: { ar: "التقدم محفوظ على هذا الجهاز", en: "Progress saved on this device" },
  progressSavedAccount: {
    ar: "التقدم محفوظ في حسابك",
    en: "Progress saved to your account",
  },
  progressGuest: {
    ar: "سجّل دخول عشان تقدمك يتحفظ",
    en: "Sign in so your progress is kept",
  },
  compareClose: { ar: "قريب من الفعلي", en: "Close to actual" },
  compareChosen: { ar: "اخترت", en: "You chose" },
  compareCorrect: { ar: "الإجابة الصحيحة", en: "Correct answer" },
  compareOff: { ar: "الفرق عن الفعلي", en: "Off by" },
  compareNoClaim: {
    ar: "الخيار اللي اخترته مالوش قيمة رقمية، قارن بين قبل والفعلي.",
    en: "Your choice has no numeric value, so compare before vs. actual.",
  },
  compareNegative: {
    ar: "القيمة سالبة: الاتجاه معكوس (الأعمدة تعرض الحجم فقط).",
    en: "Negative value: the direction is reversed (bars show magnitude only).",
  },
  wrongAlert: { ar: "إجابة غير صحيحة", en: "Incorrect answer" },
  signIn: { ar: "تسجيل الدخول", en: "Sign in" },
  signUp: { ar: "إنشاء حساب", en: "Create account" },
  signOut: { ar: "تسجيل الخروج", en: "Sign out" },
  account: { ar: "حسابي", en: "My account" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  password: { ar: "كلمة المرور", en: "Password" },
  displayName: { ar: "الاسم", en: "Name" },
  haveAccount: { ar: "عندك حساب؟ سجّل دخول", en: "Have an account? Sign in" },
  noAccount: { ar: "مالكش حساب؟ أنشئ حساب", en: "New here? Create an account" },
  authWelcome: { ar: "أهلاً بك في LabX", en: "Welcome to LabX" },
  authSubtitle: {
    ar: "سجّل دخول عشان تقدمك ونقاطك يتحفظوا على كل أجهزتك.",
    en: "Sign in to keep your progress and XP on every device.",
  },
  authSignedInAs: { ar: "مسجّل الدخول باسم", en: "Signed in as" },
  authCheckEmail: {
    ar: "بعتنالك رسالة تأكيد على بريدك. افتحها وبعدين سجّل دخول.",
    en: "We sent a confirmation email. Open it, then sign in.",
  },
  authNotConfigured: {
    ar: "تسجيل الدخول غير مفعّل حالياً. تقدر تتصفح كضيف.",
    en: "Sign-in isn't enabled right now. You can browse as a guest.",
  },
  authLoading: { ar: "جاري التحميل…", en: "Loading…" },
  authErrEmail: { ar: "اكتب بريد إلكتروني صحيح.", en: "Enter a valid email address." },
  authErrPassword: {
    ar: "كلمة المرور لازم تكون من 8 إلى 72 حرفاً.",
    en: "Password must be 8–72 characters.",
  },
  authErrName: { ar: "اكتب اسمك (حتى 50 حرفاً).", en: "Enter your name (up to 50 characters)." },
  authErrInvalid: {
    ar: "البريد أو كلمة المرور غير صحيحة.",
    en: "Incorrect email or password.",
  },
  authErrExists: {
    ar: "فيه حساب بنفس البريد. جرّب تسجيل الدخول.",
    en: "An account with this email exists. Try signing in.",
  },
  authErrUnconfirmed: {
    ar: "أكّد بريدك الإلكتروني أولاً من الرسالة المرسلة لك.",
    en: "Confirm your email first using the message we sent.",
  },
  authErrRate: {
    ar: "محاولات كتير. استنى شوية وحاول تاني.",
    en: "Too many attempts. Wait a moment and try again.",
  },
  authErrNetwork: {
    ar: "مشكلة في الاتصال. اتأكد من الإنترنت وحاول تاني.",
    en: "Connection problem. Check your internet and try again.",
  },
  authErrGeneric: {
    ar: "حصلت مشكلة. حاول تاني بعد قليل.",
    en: "Something went wrong. Please try again shortly.",
  },
  authErrNotConfigured: {
    ar: "تسجيل الدخول غير مفعّل حالياً.",
    en: "Sign-in isn't enabled right now.",
  },
  welcomeBack: { ar: "أهلاً يا", en: "Welcome back," },
  guestWelcome: { ar: "أهلاً بك في LabX", en: "Welcome to LabX" },
  guestNotice: {
    ar: "أنت بتتصفح كضيف: التقدم والنقاط مش هيتحفظوا بعد ما تقفل الصفحة.",
    en: "You're browsing as a guest: progress and XP won't be kept after you close the page.",
  },
  syncSyncing: { ar: "جاري تحميل تقدمك…", en: "Loading your progress…" },
  syncError: {
    ar: "تعذّر مزامنة تقدمك مع حسابك.",
    en: "Couldn't sync your progress with your account.",
  },
  syncRetry: { ar: "إعادة المحاولة", en: "Retry" },
  weeklyEstimate: {
    ar: "تقدير حسب الدروس اللي اشتغلت عليها",
    en: "Estimated from lessons you worked on",
  },
  energyDiagram: { ar: "مخطط الطاقة", en: "Energy diagram" },
  withoutCatalyst: { ar: "بدون حفاز", en: "No catalyst" },
  withCatalyst: { ar: "مع الحفاز", en: "With catalyst" },
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
