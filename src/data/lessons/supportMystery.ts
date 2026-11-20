import type { L10n } from "@/lib/i18n";

/**
 * «مسرح الجريمة العلمية»: an athlete limps off the pitch. The student examines the leg and knee in
 * 3D, then names the injured structures, the symptoms, the causes and the treatment. Every answer
 * comes from the textbook (sections 13 and 14).
 */

export const MYSTERY_STORY: L10n = {
  ar: "لاعب كورة اتصاب في الملعب: ألم حاد وتورم ورا الكعب ومش قادر يمشي، ومعاه التواء في الركبة. افحص الساق والركبة على المجسم وحدد المصاب.",
  en: "A footballer is hurt on the pitch: sharp pain and swelling behind the heel, he cannot walk, and his knee is twisted. Examine the leg and the knee in 3D and find what is injured.",
};

export interface MysteryOption {
  id: string;
  text: L10n;
  correct: boolean;
  /** What Noor says when this option is chosen wrongly (or why it is right). */
  why: L10n;
}

export interface MysteryStep {
  id: string;
  title: L10n;
  prompt: L10n;
  kind: "single" | "multi";
  /** `pick` steps can also be answered by tapping the part in the 3D scene (option ids = pick groups). */
  pick?: boolean;
  options: MysteryOption[];
}

const o = (
  id: string,
  ar: string,
  en: string,
  correct: boolean,
  whyAr: string,
  whyEn: string,
): MysteryOption => ({
  id,
  text: { ar, en },
  correct,
  why: { ar: whyAr, en: whyEn },
});

export const MYSTERY_STEPS: MysteryStep[] = [
  {
    id: "tendon",
    title: { ar: "1) أين الإصابة خلف الكعب؟", en: "1) What is hurt behind the heel?" },
    prompt: {
      ar: "اضغط على التركيب المصاب خلف الكعب (أو اخترته من القايمة).",
      en: "Tap the injured structure behind the heel (or choose it from the list).",
    },
    kind: "single",
    pick: true,
    options: [
      o(
        "calcaneal-tendon",
        "وتر أخيل",
        "Achilles tendon",
        true,
        "وتر أخيل يصل العضلة التوأمية بعظمة الكعب، وهو اللي بيتمزق في الحالة دي.",
        "The Achilles tendon joins the gastrocnemius to the heel bone, and it is what tears here.",
      ),
      o(
        "calcaneus",
        "عظمة الكعب",
        "Heel bone (calcaneus)",
        false,
        "عظمة الكعب هي نقطة اتصال الوتر، مش هي اللي اتمزقت؛ التمزق في الوتر نفسه.",
        "The heel bone is where the tendon attaches; the tear is in the tendon itself.",
      ),
      o(
        "tibia",
        "عظمة القصبة",
        "Tibia",
        false,
        "القصبة عظمة الساق الداخلية ومش متصلة بوتر أخيل.",
        "The tibia is the inner bone of the shank and is not where the Achilles tendon attaches.",
      ),
    ],
  },
  {
    id: "muscle",
    title: { ar: "2) أي عضلة يخدمها هذا الوتر؟", en: "2) Which muscle does this tendon serve?" },
    prompt: {
      ar: "وتر أخيل بيربط عظمة الكعب بعضلة بطن الساق. اختار العضلة.",
      en: "The Achilles tendon joins the heel bone to the calf muscle. Choose the muscle.",
    },
    kind: "single",
    pick: true,
    options: [
      o(
        "gastrocnemius",
        "العضلة التوأمية",
        "Gastrocnemius",
        true,
        "العضلة التوأمية هي عضلة بطن الساق اللي يصلها وتر أخيل بعظمة الكعب.",
        "The gastrocnemius is the calf muscle that the Achilles tendon joins to the heel bone.",
      ),
      o(
        "soleus",
        "العضلة النعلية",
        "Soleus",
        false,
        "الكتاب بيذكر العضلة التوأمية بالاسم كعضلة وتر أخيل.",
        "The textbook names the gastrocnemius as the muscle of the Achilles tendon.",
      ),
    ],
  },
  {
    id: "knee",
    title: { ar: "3) التواء الركبة", en: "3) The twisted knee" },
    prompt: {
      ar: "الالتواء ممكن يمزق رباطاً في مفصل الركبة. أي رباط ذكره الكتاب كمثال للتمزق؟",
      en: "A twist can tear a ligament of the knee. Which ligament does the book give as the example?",
    },
    kind: "single",
    pick: true,
    options: [
      o(
        "acl",
        "الرباط الصليبي الأمامي",
        "Anterior cruciate ligament",
        true,
        "الكتاب بيقول: عند التواء بعض المفاصل قد يتمزق الرباط الصليبي في الركبة.",
        "The book says a twisted joint may tear the cruciate ligament in the knee.",
      ),
      o(
        "pcl",
        "الرباط الصليبي الخلفي",
        "Posterior cruciate ligament",
        true,
        "الرباط الصليبي (الأمامي أو الخلفي) هو المثال الذي ذكره الكتاب للتمزق.",
        "The cruciate ligament (anterior or posterior) is the book's example of a tear.",
      ),
      o(
        "medial-ligament",
        "الرباط الوسطي",
        "Medial ligament",
        false,
        "الكتاب بيذكر الرباط الصليبي كمثال للتمزق عند الالتواء، مش الوسطي.",
        "The book gives the cruciate ligament as the tear example, not the medial one.",
      ),
      o(
        "lateral-ligament",
        "الرباط الجانبي",
        "Lateral ligament",
        false,
        "الكتاب بيذكر الرباط الصليبي كمثال للتمزق عند الالتواء، مش الجانبي.",
        "The book gives the cruciate ligament as the tear example, not the lateral one.",
      ),
    ],
  },
  {
    id: "symptoms",
    title: { ar: "4) الأعراض", en: "4) Symptoms" },
    prompt: {
      ar: "اختار الأعراض الثلاثة لتمزق وتر أخيل.",
      en: "Choose the three symptoms of an Achilles tendon tear.",
    },
    kind: "multi",
    options: [
      o(
        "walk",
        "عدم القدرة على المشي",
        "Cannot walk",
        true,
        "ده أول أعراض التمزق في الكتاب.",
        "The first symptom in the book.",
      ),
      o(
        "swelling",
        "تورم في منطقة الإصابة",
        "Swelling at the injury",
        true,
        "ده عرض تاني في الكتاب.",
        "Another symptom in the book.",
      ),
      o(
        "pain",
        "آلام حادة",
        "Severe pain",
        true,
        "ده العرض التالت في الكتاب.",
        "The third symptom in the book.",
      ),
      o(
        "fever",
        "ارتفاع شديد في الحرارة",
        "High fever",
        false,
        "مش من أعراض التمزق في الكتاب.",
        "Not a symptom of the tear in the book.",
      ),
      o(
        "numb",
        "فقدان الإحساس بالقدم كلها",
        "Whole foot numb",
        false,
        "مش من أعراض التمزق في الكتاب.",
        "Not a symptom of the tear in the book.",
      ),
    ],
  },
  {
    id: "causes",
    title: { ar: "5) الأسباب", en: "5) Causes" },
    prompt: {
      ar: "إيه اللي ممكن يكون سبّب التمزق؟ اختار الأسباب الصحيحة.",
      en: "What could have caused the tear? Choose the correct causes.",
    },
    kind: "multi",
    options: [
      o(
        "effort",
        "بذل مجهود عنيف",
        "Violent effort",
        true,
        "سبب أول في الكتاب.",
        "A cause in the book.",
      ),
      o(
        "sudden",
        "تقلص العضلة التوأمية بشكل مفاجئ",
        "Sudden contraction of the gastrocnemius",
        true,
        "سبب تاني في الكتاب.",
        "A cause in the book.",
      ),
      o(
        "stiff",
        "انعدام المرونة في العضلة التوأمية",
        "No flexibility in the gastrocnemius",
        true,
        "سبب تالت في الكتاب.",
        "A cause in the book.",
      ),
      o(
        "fracture",
        "كسر في عظمة الفخذ",
        "A broken femur",
        false,
        "مش من أسباب تمزق الوتر في الكتاب.",
        "Not a cause of the tendon tear in the book.",
      ),
    ],
  },
  {
    id: "treatment",
    title: { ar: "6) العلاج", en: "6) Treatment" },
    prompt: {
      ar: "الفحص أظهر أن الوتر اتقطع بالكامل. إيه العلاج المناسب؟",
      en: "The examination shows the tendon is completely torn. What is the right treatment?",
    },
    kind: "single",
    options: [
      o(
        "surgery",
        "تدخل جراحي (بجانب الأدوية والجبيرة)",
        "Surgery (besides drugs and a splint)",
        true,
        "التدخل الجراحي بيكون لو تمزق الوتر كاملاً.",
        "Surgery is used when the tendon is completely torn.",
      ),
      o(
        "drugs-only",
        "أدوية مضادة للالتهاب ومسكنة فقط",
        "Only anti-inflammatory and pain-killing drugs",
        false,
        "الأدوية والجبيرة علاج، لكن التمزق الكامل محتاج تدخل جراحي.",
        "Drugs and a splint help, but a complete tear needs surgery.",
      ),
      o(
        "rest",
        "راحة فقط من غير علاج",
        "Rest only, no treatment",
        false,
        "الكتاب بيحدد الأدوية والجبيرة والجراحة عند التمزق الكامل.",
        "The book lists drugs, a splint, and surgery for a complete tear.",
      ),
    ],
  },
];

export interface MysteryAnswers {
  [stepId: string]: string[];
}

export interface MysteryStepResult {
  id: string;
  ok: boolean;
  /** 0–1 */
  score: number;
  /** Explanations of the options the student chose wrongly or missed. */
  feedback: L10n[];
}

export interface MysteryResult {
  steps: MysteryStepResult[];
  solved: boolean;
  /** 0–100 */
  score: number;
}

export function evaluateMystery(answers: MysteryAnswers): MysteryResult {
  const steps = MYSTERY_STEPS.map<MysteryStepResult>((step) => {
    const chosen = new Set(answers[step.id] ?? []);
    const right = step.options.filter((x) => x.correct);
    const feedback: L10n[] = [];
    let score = 0;
    if (step.kind === "single") {
      const pick = step.options.find((x) => chosen.has(x.id));
      score = pick?.correct ? 1 : 0;
      if (pick && !pick.correct) feedback.push(pick.why);
    } else {
      const hits = right.filter((x) => chosen.has(x.id)).length;
      const wrong = step.options.filter((x) => !x.correct && chosen.has(x.id));
      score = Math.max(0, (hits - wrong.length) / right.length);
      for (const w of wrong) feedback.push(w.why);
      for (const r of right) if (!chosen.has(r.id)) feedback.push(r.why);
    }
    return { id: step.id, ok: score === 1, score, feedback };
  });
  const score = Math.round((100 * steps.reduce((s, x) => s + x.score, 0)) / steps.length);
  return { steps, solved: steps.every((s) => s.ok), score };
}
