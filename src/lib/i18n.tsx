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
  aiTutor: { ar: "نور", en: "Noor" },
  currentScene: { ar: "المشهد الحالي", en: "Current scene" },
  askPlaceholder: { ar: "اسأل نور أي حاجة...", en: "Ask Noor anything..." },
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
  fieldTitle: { ar: "المجال الكهربي والقوة", en: "Electric field & force" },
  fieldStrength: { ar: "شدة المجال", en: "Field strength" },
  fieldForce: { ar: "القوة على إلكترون", en: "Force on an electron" },
  fieldDrift: { ar: "سرعة الانجراف", en: "Drift speed" },
  fieldDirection: { ar: "اتجاه المجال E", en: "Field direction E" },
  fieldElectron: { ar: "حركة الإلكترونات", en: "Electron motion" },
  fieldNote: {
    ar: "موصل نحاسي طوله 0.5 م ومقطعه 1 مم² على المصدر مباشرة.",
    en: "A 0.5 m copper conductor of 1 mm² cross-section across the supply.",
  },
  scopeTitle: { ar: "الميكروسكوب الافتراضي", en: "Virtual microscope" },
  scopeLight: { ar: "مجهر ضوئي", en: "Light microscope" },
  scopeElectron: { ar: "مجهر إلكتروني", en: "Electron microscope" },
  scopeFov: { ar: "مجال الرؤية", en: "Field of view" },
  scopeOutside: { ar: "خارج الخلية", en: "Outside" },
  scopeInside: { ar: "داخل الخلية", en: "Inside" },
  scopeChannel: { ar: "قناة بروتينية", en: "Channel protein" },
  scopeHidden: {
    ar: "الغشاء (7–10 نانومتر) أرق من حد تحليل المجهر الضوئي (~0.2 ميكرومتر). انتقل للمنظور الجزيئي.",
    en: "The membrane (7–10 nm) is thinner than the light microscope's resolution (~0.2 µm). Switch to the molecular view.",
  },
  scopeVisible: {
    ar: "طبقتان دهنيتان وقنوات بروتينية تعبر الغشاء.",
    en: "Two lipid layers with channel proteins crossing the membrane.",
  },
  leTitle: { ar: "الاتزان ولوشاتيليه", en: "Equilibrium & Le Chatelier" },
  leShiftForward: { ar: "ينتقل نحو النواتج", en: "Shifts toward products" },
  leShiftReverse: { ar: "ينتقل نحو المتفاعلات", en: "Shifts toward reactants" },
  leShiftNone: { ar: "في حالة اتزان", en: "At equilibrium" },
  noorSubtitleLesson: { ar: "فاهم المشهد اللي قدامك", en: "Sees the scene in front of you" },
  noorSubtitlePlatform: { ar: "مساعدك الذكي في LabX", en: "Your smart guide in LabX" },
  noorYouAreHere: { ar: "إنت دلوقتي في", en: "You are on" },
  noorAdminAiError: {
    ar: "للأدمن فقط: فشل الاتصال بمزوّد الـ AI فاستخدمت رداً محلياً. افتح لوحة الإدارة واضغط «اختبار الاتصال» لتعرف السبب.",
    en: "Admin only: the AI provider call failed, so this is a local reply. Open the admin panel and press “Test connection” to see why.",
  },
  noorAdminAiOff: {
    ar: "للأدمن فقط: الـ AI متوقف أو غير مُعدّ من لوحة الإدارة، فده رد محلي.",
    en: "Admin only: the AI is off or not configured in the admin panel, so this is a local reply.",
  },
  adminTest: { ar: "اختبار الاتصال", en: "Test connection" },
  adminTesting: { ar: "جاري الاختبار…", en: "Testing…" },
  adminTestOk: { ar: "المزوّد شغّال ✅", en: "Provider works ✅" },
  adminTestFail: { ar: "فشل الاتصال بالمزوّد", en: "Provider call failed" },
  adminTestNotConfigured: {
    ar: "المزوّد المختار غير مُعدّ بعد (احفظ الإعدادات والمفتاح أولاً).",
    en: "The selected provider isn't configured yet (save its settings and key first).",
  },
  adminTestHint: {
    ar: "بيجرّب طلب صغير فعلي بالإعدادات المحفوظة للمزوّد المختار ويعرض رسالة الخطأ الحقيقية.",
    en: "Sends one tiny real request using the saved settings of the selected provider and shows its actual error.",
  },
  idleHintTitle: { ar: "تلميح سريع", en: "Quick hint" },
  idleAsk: { ar: "اسأل المعلم", en: "Ask the tutor" },
  idleSnooze: { ar: "ذكّرني بعد شوية", en: "Remind me later" },
  idleDismiss: { ar: "إخفاء التلميحات في الدرس ده", en: "Hide hints for this lesson" },
  aiPowered: { ar: "رد مدعوم بالذكاء الاصطناعي", en: "AI-powered reply" },
  adminLink: { ar: "لوحة الإدارة", en: "Admin" },
  adminTitle: { ar: "إدارة نور (المساعد الذكي)", en: "Noor (AI assistant) administration" },
  adminSubtitle: {
    ar: "اختار مزوّد الذكاء الاصطناعي وإعداداته. المفاتيح بتتحفظ مشفّرة على السيرفر ومش بترجع للمتصفح.",
    en: "Choose the AI provider and its settings. Keys are stored encrypted on the server and never sent back to the browser.",
  },
  adminSignInFirst: {
    ar: "سجّل الدخول بحساب الإدارة الأول.",
    en: "Sign in with the admin account first.",
  },
  adminForbidden: {
    ar: "الصفحة دي لحساب الإدارة فقط.",
    en: "This page is for the admin account only.",
  },
  adminLoadError: {
    ar: "تعذّر تحميل الإعدادات.",
    en: "Couldn't load the settings.",
  },
  adminRetry: { ar: "إعادة المحاولة", en: "Retry" },
  adminServerNotReady: {
    ar: "السيرفر مش جاهز: ضيف AI_SETTINGS_ENCRYPTION_KEY و SUPABASE_SERVICE_ROLE_KEY في إعدادات الاستضافة.",
    en: "The server isn't ready: add AI_SETTINGS_ENCRYPTION_KEY and SUPABASE_SERVICE_ROLE_KEY in your hosting settings.",
  },
  adminTutorSwitch: {
    ar: "تفعيل نور (الذكاء الاصطناعي) للمنصة",
    en: "Enable Noor (AI) platform-wide",
  },
  adminTutorSwitchHint: {
    ar: "لو متوقف، الطلاب بياخدوا ردود نور المحلية من غير أي خطأ.",
    en: "When off, students get Noor's built-in local replies with no error.",
  },
  adminProvider: { ar: "المزوّد النشط", en: "Active provider" },
  adminBedrock: { ar: "Amazon Bedrock (Claude)", en: "Amazon Bedrock (Claude)" },
  adminAzure: { ar: "Microsoft Azure OpenAI (GPT)", en: "Microsoft Azure OpenAI (GPT)" },
  adminRegion: { ar: "المنطقة (Region)", en: "Region" },
  adminModelId: { ar: "Model ID", en: "Model ID" },
  adminModelHint: {
    ar: "Model ID مباشر، أو Inference Profile ID (مثل eu.anthropic… / us.anthropic… / global.anthropic…)، أو ARN كامل. انسخه من Bedrock console.",
    en: "A direct Model ID, an Inference Profile ID (e.g. eu.anthropic… / us.anthropic… / global.anthropic…) or a full ARN. Copy it from the Bedrock console.",
  },
  adminApiKey: { ar: "مفتاح API", en: "API key" },
  adminApiKeyKept: { ar: "محفوظ — اتركه فاضي للإبقاء عليه", en: "Saved — leave blank to keep it" },
  adminBedrockKeyHint: {
    ar: "Bedrock API key (من Bedrock console → API keys).",
    en: "A Bedrock API key (Bedrock console → API keys).",
  },
  adminEndpoint: { ar: "Endpoint", en: "Endpoint" },
  adminEndpointHint: {
    ar: "https://اسم-المورد.openai.azure.com",
    en: "https://your-resource.openai.azure.com",
  },
  adminDeployment: { ar: "اسم الـ Deployment (Model ID)", en: "Deployment name (model ID)" },
  adminApiVersion: { ar: "إصدار الـ API", en: "API version" },
  adminAzureRegion: { ar: "المنطقة (اختياري)", en: "Region (optional)" },
  adminSave: { ar: "حفظ الإعدادات", en: "Save settings" },
  adminSaving: { ar: "جاري الحفظ…", en: "Saving…" },
  adminSaved: { ar: "تم الحفظ.", en: "Saved." },
  adminUsage: { ar: "إحصائيات الاستخدام", en: "Usage" },
  adminRequests: { ar: "عدد الطلبات", en: "Requests" },
  adminErrors: { ar: "الأخطاء", en: "Errors" },
  adminLastUsed: { ar: "آخر استخدام", en: "Last used" },
  adminNever: { ar: "لم يُستخدم بعد", en: "Not used yet" },
  adminErrInvalid: {
    ar: "راجع الحقول المعلّمة: قيمة غير صحيحة.",
    en: "Check the highlighted fields: invalid value.",
  },
  adminErrNeedConfig: {
    ar: "كمّل إعدادات المزوّد النشط (بما فيها المفتاح) قبل التفعيل.",
    en: "Complete the active provider's settings (including the key) before enabling.",
  },
  adminErrGeneric: { ar: "تعذّر الحفظ. حاول تاني.", en: "Couldn't save. Please try again." },
  adminAuthMethod: { ar: "طريقة المصادقة", en: "Authentication method" },
  adminAuthApiKey: { ar: "Bedrock API Key (Bearer Token)", en: "Bedrock API Key (Bearer Token)" },
  adminAuthIam: { ar: "AWS IAM Credentials (SigV4)", en: "AWS IAM Credentials (SigV4)" },
  adminAccessKeyId: { ar: "AWS Access Key ID", en: "AWS Access Key ID" },
  adminSecretKey: { ar: "AWS Secret Access Key", en: "AWS Secret Access Key" },
  adminSessionToken: { ar: "Session Token (اختياري)", en: "Session Token (optional)" },
  adminSessionKept: {
    ar: "محفوظ — اتركه فاضي للإبقاء عليه",
    en: "Saved — leave blank to keep it",
  },
  adminClearSession: { ar: "حذف الـ Session Token المحفوظ", en: "Remove the saved Session Token" },
  adminIamHint: {
    ar: "بيتوقّع الطلب بـ AWS SigV4 (خدمة bedrock). المفاتيح مشفّرة ومش بترجع للمتصفح. مفاتيح الطريقة التانية بتتمسح عند الحفظ.",
    en: "Requests are signed with AWS SigV4 (service bedrock). Keys are encrypted and never sent back. The other method's keys are dropped on save.",
  },
  adminIamKeyInApiKey: {
    ar: "ده شكل AWS Access Key ID مش Bedrock API key. اختار طريقة IAM Credentials.",
    en: "This looks like an AWS Access Key ID, not a Bedrock API key. Choose IAM Credentials.",
  },
  adminApiMode: { ar: "مسار الاستدعاء", en: "Invocation path" },
  adminApiModeConverse: { ar: "Converse (موصى به)", en: "Converse (recommended)" },
  adminApiModeInvoke: {
    ar: "InvokeModel (موديلات Anthropic)",
    en: "InvokeModel (Anthropic models)",
  },
  adminModelMismatch: {
    ar: "تنبيه: بادئة الـ Inference Profile أو الـ ARN مش متوافقة مع الـ Region المختارة (eu./us./apac. لازم تطابق منطقتها).",
    en: "Heads-up: the Inference Profile prefix or ARN region doesn't match the selected Region (eu./us./apac. must match its geography).",
  },
  adminGeneration: { ar: "إعدادات التوليد", en: "Generation settings" },
  adminMaxTokens: { ar: "Max Tokens", en: "Max Tokens" },
  adminMaxCompletionTokens: { ar: "Max Completion Tokens", en: "Max Completion Tokens" },
  adminMaxTokensHint: {
    ar: "من 16 إلى 4096. موديلات التفكير (reasoning) محتاجة قيمة أكبر.",
    en: "16 to 4096. Reasoning models need a larger value.",
  },
  adminTemperature: { ar: "Temperature", en: "Temperature" },
  adminTemperatureHintBedrock: {
    ar: "من 0 إلى 1. اتركه فاضي لعدم إرساله (موديلات بترفضه). لو الموديل رفضه بيتجاب تلقائياً من غيره.",
    en: "0 to 1. Leave empty to not send it (some models reject it). If a model rejects it, it is retried without it automatically.",
  },
  adminTemperatureHintAzure: {
    ar: "من 0 إلى 2. اتركه فاضي لعدم إرساله.",
    en: "0 to 2. Leave empty to not send it.",
  },
  adminTimeout: { ar: "مهلة الاتصال (ثانية)", en: "Timeout (seconds)" },
  adminTimeoutHint: { ar: "من 3 إلى 60.", en: "3 to 60." },
  adminInstructions: {
    ar: "تعليمات إضافية لنور (اختياري)",
    en: "Extra instructions for Noor (optional)",
  },
  adminInstructionsHint: {
    ar: "أسلوب أو تركيز إضافي (حتى 1000 حرف). لا تلغي قواعد الأمان الأساسية.",
    en: "Extra tone or focus (up to 1000 characters). Never overrides the core safety rules.",
  },
  adminDirty: {
    ar: "عندك تغييرات غير محفوظة. الاختبار بيتم على الإعدادات المحفوظة فقط — احفظ الأول لو عايز تختبر التغييرات.",
    en: "You have unsaved changes. The test uses the saved settings only — save first to test your changes.",
  },
  adminTestTarget: { ar: "تم اختبار الإعدادات المحفوظة:", en: "Tested saved settings:" },
  adminHintInferenceProfile: {
    ar: "الموديل ده مش بيدعم الاستدعاء المباشر (on-demand) في الـ Region دي. استخدم Inference Profile ID المناسب للـ Region (مثل eu.anthropic… أو us.anthropic… أو global.anthropic…) أو ARN الخاص به في حقل Model ID.",
    en: "This model can't be invoked on-demand directly in this Region. Use the Inference Profile ID that matches the Region (e.g. eu.anthropic… / us.anthropic… / global.anthropic…) or its ARN in the Model ID field.",
  },
  adminHintModelAccess: {
    ar: "الحساب مالوش صلاحية على الموديل: فعّل Model access في Bedrock console للـ Region دي، وتأكد إن صلاحيات IAM تسمح بـ bedrock:InvokeModel.",
    en: "The account isn't allowed to use this model: enable Model access in the Bedrock console for this Region and make sure IAM allows bedrock:InvokeModel.",
  },
  adminHintModelInvalid: {
    ar: "Model ID غير صحيح أو مش متاح في الـ Region دي. راجع كتابته والـ Region.",
    en: "The Model ID is invalid or unavailable in this Region. Check its spelling and the Region.",
  },
  adminHintBadCredentials: {
    ar: "المفتاح أو بيانات AWS غير صالحة أو منتهية. راجعها (وSession Token لو بتستخدم بيانات مؤقتة).",
    en: "The key or AWS credentials are invalid or expired. Re-check them (and the Session Token for temporary credentials).",
  },
  adminHintBadSignature: {
    ar: "التوقيع مرفوض: راجع Secret Access Key والـ Region وتوقيت السيرفر.",
    en: "The signature was rejected: check the Secret Access Key, the Region and the server clock.",
  },
  adminHintDeployment: {
    ar: "الـ Deployment مش موجود: راجع اسمه والـ Endpoint بالظبط في Azure.",
    en: "Deployment not found: check its exact name and the Endpoint in Azure.",
  },
  adminHintBadKey: {
    ar: "مفتاح Azure مرفوض: راجع المفتاح وإنه يخص نفس المورد (Resource).",
    en: "The Azure key was rejected: check the key belongs to this same resource.",
  },
  adminHintTimeout: {
    ar: "انتهت مهلة الاتصال: زوّد مهلة الاتصال أو راجع الـ Region والشبكة.",
    en: "The request timed out: raise the timeout or check the Region and network.",
  },
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
