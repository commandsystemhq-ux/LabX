# LabX — ARCHITECTURE

منصة علوم تفاعلية (أحياء / فيزياء / كيمياء). React 19 · TanStack Start/Router · Tailwind v4 · Recharts · Supabase (Auth + جدول `user_progress`). المنهج mock (محتوى فقط)، أما التقدم والـ XP والـ streak فحقيقية: للمسجَّل في Supabase، وللضيف في الذاكرة فقط.

## 1. الهيكل الفعلي

```
src/routes/            الصفحات (file-based) — index (/)، auth (تسجيل/حساب)، admin (إدارة الـ AI، للأدمن فقط)، dashboard، lesson، __root (الـ shell + 404 + AuthProvider)
src/components/
  landing/ layout/     الصفحة الرئيسية، Navbar، Footer
  dashboard/           TopBar (XP/streak)، UnitCard (الدروس والإتقان)، ProgressRing، WeeklyActivity
  lesson/              مساحة الدرس بالكامل (انظر §4)
    scenes/            مشاهد SVG لكل محاكاة × منظور (macro/molecular) — مكان Three.js مستقبلاً
  noor/                NoorProvider (سياق: open + بيانات الدرس الحية) و NoorAssistant (الواجهة العامة، تُركَّب مرة واحدة في __root) و NoorMarkdown (عرض Markdown خفيف آمن كعناصر React بلا HTML) و NoorSavedChats (قائمة المحادثات المحفوظة: فتح/حذف بتأكيد من نقرتين)
  brand/ common/ ui/   Logo، تبديل اللغة، أيقونات المواد، مكتبة shadcn الجاهزة (لا تُعدَّل)
src/data/
  mockCurriculum.ts    شجرة الصف ← المادة ← الوحدة ← الدرس + دوال البحث (findLesson, getNextLesson)
  simulations.ts       نماذج رياضية نقية (computeOhm/Rate/Diffusion)، المتغيرات، القصة، الشرح، الأسئلة
  simExtras.ts         الأعطال (faults 1–3 لكل محاكاة)، التحذيرات (hazards)، الخطوات الموجّهة، الحسابات، الطبقات (field/microscope/equilibrium + fieldInfo/microscopeInfo/leChatelier/lessonLayers)
  tutor.ts             كشف النية + بناء ردود المعلم من سياق الشاشة + buildIdleHint
  noor.ts              «نور» (المساعد العام): فهم الصفحة، نوايا المنصة (تحية/تنقّل/اقتراح/تقدم/دخول)، ردود محلية، وقائمة بيضاء لأزرار التنقل (parseActionTags) + lessonCatalog للـ AI
  quizCompare.ts       أرقام "قبل / اللي اخترته يعني / الفعلي" للإجابة الخاطئة
src/lib/
  i18n.tsx             LanguageProvider (ar/en + RTL) وكل نصوص الواجهة `ui`
  progress.ts          حالة التقدم + التحقق + دمج (mergeProgress) + repositories (memory للضيف، localStorage احتياطي بدون Supabase) + store (attachRepository)
  progress-remote.ts   repository على Supabase (hydrate/upsert مؤجّل/flush) — جدول user_progress بـ RLS
  supabase.ts          عميل المتصفح من VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY فقط (يرفض مفاتيح service/secret)
  auth.tsx, auth-utils.ts   AuthProvider/useAuth (جلسة + مزامنة التقدم)، تحقق المدخلات، ترجمة أخطاء Supabase، safeRedirect
  use-progress.ts      hooks (useProgress/useMastery/useStudentStats) — use-is-client.ts للـ hydration
  ai-config.ts         (مشترك) schemas zod + أنواع إعدادات الـ AI؛ لا أسرار ولا I/O
  ai-tutor.functions.ts  server functions الوحيدة (askAiTutorFn/adminGet/adminSave) — تستورد ai/*.server.ts ديناميكياً داخل الـ handler
  ai-tutor-client.ts   requestAiReply: يرجع نصاً أو null (= ردّ محلي) ولا يرمي أبداً؛ يرسل آخر الرسائل + تلخيصاً للأقدم
  noor-chat.ts, use-noor-chat.ts   ذاكرة محادثة نور: localStorage (مفتاح لكل حساب + ضيف) + صف `noor_conversations` للمسجَّل (RLS)، sanitize لكل ما يُقرأ، chatContext (آخر 8 رسائل + ملخص ≤1000 حرف)؛ «حفظ المحادثة» يدوي فقط (useSavedChats): عنوان تلقائي من أول سؤال، حتى 30 محادثة، صف `noor_saved_chats` للمسجَّل (RLS للمالك، بلا update) و localStorage للزائر وكاحتياط إن تعذّر الجدول
  ai/*.server.ts       سيرفر فقط: crypto (AES-GCM)، sigv4 (توقيع AWS SigV4)، student-context (ملف الطالب لنور: اسم معقَّم + تقدّم نفس المستخدم فقط من user_progress، يُحقن كبلوك `<student_profile>` بيانات في الـ system prompt)، providers (Bedrock: API key أو IAM، Azure: max_completion_tokens مع fallback)، service (منطق + حارس admin + rate limit)، store (Supabase بمفتاح service-role)
supabase/schema.sql    جدول user_progress + noor_conversations + noor_saved_chats (RLS للمالك فقط) + ai_settings/ai_usage (بدون policies؛ service-role فقط) + سياسات RLS (يُشغَّل يدوياً في Supabase)
.env.example           أسماء المتغيرات فقط (لا قيم حقيقية)
  error-capture.ts, error-page.ts   حماية SSR (تُستخدم من server.ts/start.ts)
src/server.ts, start.ts   مدخل السيرفر ووسيط الأخطاء/CSRF
src/styles.css         التصميم (ألوان المواد عبر data-subject، glass، animations)
src/test/              vitest: النماذج، extras، progress، tutor، LessonWorkspace، routing
public/                الشعار والأيقونات و og-image
vite.config.ts         plugins صريحة (tanstackStart, nitro للـ build فقط, react, tailwind)
```

## 2. خريطة التعديل السريعة

| المهمة                                   | الملفات                                                                                                                                                                                                     |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| إضافة/تعديل درس أو وحدة                  | `data/mockCurriculum.ts` (+ اختبار السلامة في `test/simulations.test.ts`)                                                                                                                                   |
| محاكاة جديدة                             | `simulations.ts` (النموذج + المحتوى) + `simExtras.ts` + مشهدان في `scenes/` + `scenes/index.ts` + `SimulationId` في `mockCurriculum.ts`                                                                     |
| تغيير معادلة/متغير/سؤال                  | `simulations.ts` فقط (+ `simExtras.ts` إن تأثرت التحذيرات)                                                                                                                                                  |
| عطل أو تحذير واقعي جديد                  | `simExtras.ts` (faults/hazards) + استخدام `fault` في الدالة الحسابية داخل `simulations.ts`                                                                                                                  |
| خطوة موجّهة / حسابات / طبقة               | `simExtras.ts` (guided/calc/layers) + رسم الطبقة في المشهد المعني                                                                                                                                           |
| ردود المعلم أو تلميحاته                  | `data/tutor.ts`؛ الشرائح والسياق المعروض في `components/noor/NoorAssistant.tsx`                                                                                                                             |
| الاختبار والمقارنة البصرية               | `simulations.ts` (quiz/claims) + `quizCompare.ts` + `QuizView.tsx` + `useQuiz.ts`                                                                                                                           |
| التقدم/XP/streak                         | `lib/progress.ts` (+ `use-progress.ts`)؛ العرض في `components/dashboard/*`                                                                                                                                  |
| تسجيل الدخول/الحساب/Supabase             | `routes/auth.tsx`, `lib/auth.tsx`, `lib/auth-utils.ts`, `lib/supabase.ts`, `lib/progress-remote.ts`, `supabase/schema.sql`, `Navbar.tsx`                                                                    |
| مزوّد الـ AI / لوحة الإدارة / مؤقت الخمول | `lib/ai-config.ts`, `lib/ai/*.server.ts`, `lib/ai-tutor.functions.ts`, `routes/admin.tsx`, `components/noor/NoorAssistant.tsx`؛ الخمول: `useIdleHint.ts`, `IdleHintCard.tsx`, `buildIdleHint` في `tutor.ts` |
| إعداد محاكاة خاص بدرس                    | `preset` (`values`/`view`/`layers`) في `mockCurriculum.ts` + `lessonDefaults` في `simulations.ts` + `lessonLayers` في `simExtras.ts` (يُطبَّق في `LessonWorkspace`)                                            |
| لوحة إثراء جديدة على المسرح              | دالة نقية + `LayerDef` في `simExtras.ts`، ومكوّن في `StageInsets.tsx`، وعرضه في `SimulationStage.tsx`                                                                                                        |
| شكل المنصة (stage/toolbar/HUD)           | `SimulationStage.tsx`, `StageToolbar.tsx`, `StageInsets.tsx`, `HazardBanner.tsx`                                                                                                                            |
| لوحة التحكم (sliders/حسابات/وضع الأخطاء) | `ControlPanel.tsx`, `ErrorModePanel.tsx`                                                                                                                                                                    |
| نص واجهة أو ترجمة                        | `lib/i18n.tsx` (`ui`)؛ نصوص المحتوى تبقى في `data/*` بصيغة `{ar,en}`                                                                                                                                        |
| ألوان/animations                         | `styles.css`                                                                                                                                                                                                |
| صفحة جديدة                               | ملف في `routes/` (يُولَّد `routeTree.gen.ts` تلقائياً)                                                                                                                                                          |
| Three.js                                 | الـ TODO في `SimulationStage.tsx`؛ استبدال `scenes/` بنفس الـ props (`SceneProps`)                                                                                                                          |

## 3. ملفات حساسة

- `data/simulations.ts` — `SimValues`/`SimKey` مشتركة بين كل المحاكاة والمشاهد والمعلم؛ تغيير مفتاح يكسر الجميع. الدوال النقية لا تقرأ React.
- `data/simExtras.ts` — عتبات التحذيرات يختبرها `test/extras.test.ts` (الخطوات الموجّهة يجب ألا تُطلق تحذيراً).
- `LessonWorkspace.tsx` — المنسّق: حالة القيم، الخطوة، الوضع، الأعطال، الاختبار، الحفظ. ترتيب `goStep` و`seeMistake` مهم.
- `lib/progress.ts` — كل ما يُقرأ من التخزين غير موثوق (`sanitizeProgress`)؛ لا تتخطَّه. الـ XP يُمنح للتحسّن فقط. لا تربط الـ store بـ repository بعيد قبل نجاح `hydrate()` (وإلا قد يُستبدل تقدم الحساب بحالة فارغة).
- `lib/supabase.ts` — مفتاح الـ anon فقط في `VITE_*`؛ أي مفتاح service/secret ممنوع. الحماية الفعلية من RLS في `supabase/schema.sql`.
- `SimulationStage.tsx` — المشهد يُرسم client-only (`useIsClient`) لتجنب hydration mismatch بسبب `Math.sin/cos`.
- `scenes/sceneUtils.ts` — `SceneProps` و`useSimClock`/`useIntegrated`؛ المشاهد تعتمد عليها.
- `routeTree.gen.ts`, `components/ui/*` — مُولَّدة/جاهزة، لا تُعدَّل يدوياً.
- `server.ts`, `start.ts`, `lib/error-*.ts` — حماية SSR/CSRF؛ لا تضف ضغطاً للردود.
- `vite.config.ts` — ترتيب الـ plugins مهم؛ `nitro` يعمل وقت الـ build فقط.

## 4. العلاقات وتدفق البيانات

```
routes/lesson.tsx ──(id)──▶ findLesson ──▶ LessonWorkspace (حالة واحدة)
   values (SimValues) ◀── ControlPanel sliders / ErrorModePanel (fault) / GuidedDiscovery.start
        │
        ├─▶ sim.readouts/graph/activity ─▶ ControlPanel (قراءات، رسم، حسابات)
        ├─▶ extras.hazards(values) ─▶ SimulationStage (HazardBanner + اهتزاز/تنبيه) + ErrorModePanel + المعلم
        └─▶ Scene (macro|molecular) ◀─ useSimClock(t) + layers + hazard
step (1 قصة → 2 شرح موجّه → 3 تجربة حرة → 4 اختبار)
   2 + mode=guided ─▶ useGuided (يتحقق من done(values) ويُثبّته)
   4 ─▶ useQuiz (الحالة في الـ workspace) ─▶ خطأ ─▶ buildComparison + seeMistake ─▶ stage demo ─▶ ارجع للاختبار
Noor (NoorAssistant، في الـ root) ◀─ NoorProvider.lesson (يسجّلها LessonWorkspace) أو سياق الصفحة؛ values, lastChange, step, mode, view, hazards, guided ─▶ مسجَّل؟ requestAiReply ─▶ askAiTutorFn ─▶ service.ask ─▶ ai_settings (مفكوكة التشفير) ─▶ Bedrock|Azure
                  أي فشل/تعطيل/ضيف ─▶ tutor.buildTutorReply(sim.tutor + سياق) بدون رسالة خطأ
idle: useIdleHint(activity) ─▶ بعد 60ث بلا تفاعل (ليس step 3) ─▶ IdleHintCard ◀─ tutor.buildIdleHint (محلي، بدون تكلفة AI)
progress: goStep ─▶ progressStore.recordStep ; اكتمال الاختبار ─▶ recordQuiz ─▶ repository الحالي
          (مسجَّل: Supabase بعد hydrate ودمج عمل الضيف؛ ضيف: ذاكرة فقط؛ بدون Supabase: localStorage احتياطي)
          dashboard/UnitCard/TopBar ◀─ useMastery/useStudentStats (الإتقان = المحفوظ فقط، بدون قيم mock)
auth: AuthProvider (root) ─▶ onAuthStateChange ─▶ userId ─▶ createSupabaseRepository.hydrate ─▶ progressStore.attachRepository
اللغة: LanguageProvider ◀─ localStorage `labx.lang`؛ كل نص = `ui[key][lang]` أو `{ar,en}`
```

## 5. قواعد التنفيذ الثابتة

1. **في كل أمر جديد:** اقرأ هذا الملف أولاً، واكتب **خطة من سطرين فقط** قبل لمس أي كود.
2. **فكّر باختصار** في: المتطلبات، الـ Edge Cases (قيم متطرفة، شاشات صغيرة، ضعف الاتصال)، الأمان (لا `dangerouslySetInnerHTML`، لا مفاتيح، تحقق من أي مدخل/تخزين)، والأداء (لا re-render لكل frame خارج الـ stage؛ نظّف الـ timers والـ listeners).
3. **اقرأ فقط** الملفات المرتبطة بالمهمة حسب الخريطة (§2) — لا تفحص المشروع كله.
4. **بعد التعديل:** راجع الكود لإصلاح أي bug أو كسر لميزة قائمة (النماذج، المسار التعليمي، المعلم، الحفظ، RTL/AR-EN، الموبايل).
5. **لا تشغّل** `npm run build` ولا `git push` إلا عند الطلب الصريح. شغّل فقط الاختبار/الـ typecheck الأقل الذي يغطي التغيير.
6. الأرقام والنصوص المعروضة ثنائية اللغة؛ لا تضف نصاً عربياً فقط. Prettier إلزامي (`npx prettier --write` للملفات المعدّلة).

## 6. قيود معروفة

- محاكاة واحدة لكل مادة تُستخدم لكل دروسها؛ التمييز بين الدروس عبر `preset` (قيم بداية + المنظور). أسئلة الاختبار والمقارنة مرتبطة بقيم النموذج الافتراضية لا بالـ preset.
- XP/streak يحسبهما العميل ويخزّنهما في صف المستخدم (RLS يمنع الوصول لغيره لكن لا يمنع المستخدم من تعديل صفه)؛ لا تستخدمهما لأي مكافأة ذات قيمة مالية بدون تحقق من السيرفر.
- الحفظ last-write-wins بين الأجهزة (الدمج يحدث عند تسجيل الدخول فقط).
- نشاط الأسبوع تقدير من وقت آخر تحديث لكل درس (لا يوجد تتبع زمن فعلي).
- «نور» لا تتنقل بنفسها: الردود (المحلية أو من الـ AI) قد تحمل أزرار تنقل فقط، من قائمة بيضاء (`home` / `dashboard` / `lesson` بمعرّف موجود فعلاً / `auth`)، والطالب هو من يضغط. وسوم `[[go:…]]` القادمة من الـ AI تُتحقَّق وتُحذف من النص. أي نوع إجراء جديد يُضاف في `data/noor.ts` مع تحقق.
- فشل المزوّد لا يُعرض للطالب أبداً؛ الأدمن يرى السبب الحقيقي (منقّحاً من المفتاح) من زر «اختبار الاتصال» في `/admin` ومن لوغ السيرفر.
- الـ LLM يُستدعى من السيرفر فقط ولمستخدم مسجَّل فقط (الضيف يأخذ الردود المحلية)؛ Bedrock عبر Bedrock API key (Bearer) أو IAM credentials بتوقيع SigV4 (مسار `/converse` أو `/invoke`، والـ Model ID قد يكون id مباشراً أو Inference Profile أو ARN)؛ إعدادات التوليد (tokens/temperature/timeout/تعليمات نور) تُخزَّن مشفّرة مع كل مزوّد، وTemperature اختيارية (فارغة = لا تُرسل) وBedrock يعيد المحاولة تلقائياً بدونها مرة واحدة إذا رفضها الموديل (deprecated/not supported) ويتذكّر ذلك في الذاكرة؛ الـ rate limit في ذاكرة السيرفر (best-effort عند تعدد النسخ)؛ ذاكرة المحادثة تُمرَّر كبيانات غير موثوقة داخل وسوم `<conversation_*>` (لا كأدوار assistant) حتى لا تُزوَّر؛ زر «محادثة جديدة» يمسح السجل المحلي والبعيد، وجدول `noor_conversations` يُنشأ يدوياً من `supabase/schema.sql` (بدونه تعمل الذاكرة محلياً فقط).
