import type { SupportBlockContent } from "./supportTypes";

/** Blocks 8–14 of the support lesson (thoracic cage → tendons). Source: docs/lesson1.txt sections 8–14. */

const l = (ar: string, en: string) => ({ ar, en });
const o = (ar: string, en: string) => ({ text: l(ar, en) });

export const blocksB: SupportBlockContent[] = [
  /* ------------------------------------ 8 ----------------------------------- */
  {
    n: 8,
    emoji: "🫁",
    titleEn: "Thoracic Cage",
    hookQuestion: {
      question: l(
        "في صدرك 12 زوج ضلوع. لو عملت خط من كل ضلع لعظمة القص في النص، كام زوج هيوصل فعلاً؟",
        "You have 12 pairs of ribs. If you drew a line from each rib to the sternum, how many pairs would really reach it?",
      ),
      options: [
        l("12 زوج، كلهم", "All 12 pairs"),
        l("10 أزواج بس", "Only 10 pairs"),
        l("6 أزواج بس", "Only 6 pairs"),
      ],
      correct: 1,
      reveal: l(
        "العشرة أزواج الأولى بس بتوصل لعظمة القص. الزوجين الأخيرين قصيرين وعائمين ومتعلقين بالفقرتين 18 و19.",
        "Only the first ten pairs reach the sternum. The last two pairs are short, floating, and attach to vertebrae 18 and 19.",
      ),
    },
    simpleExplanation: {
      paragraphs: [
        l(
          "القفص الصدري علبة شكلها تقريباً مخروطي. من ورا بتتصل بالفقرات الصدرية (12 فقرة)، ومن قدام بعظمة القص.",
          "The thoracic cage is a roughly cone-shaped box. At the back it joins the 12 thoracic vertebrae; at the front it joins the sternum.",
        ),
        l(
          "بيتكون من اثني عشر زوج ضلوع. العشرة أزواج الأولى بتوصل بين الفقرات الصدرية وعظمة القص.",
          "It is made of twelve pairs of ribs. The first ten pairs link the thoracic vertebrae to the sternum.",
        ),
        l(
          "الزوج الحادي عشر والثاني عشر قصيرين ومش بيتصلوا بالقص، عشان كده اسمهم «الضلوع العائمة». هما بيتصلوا بالفقرتين رقمي 18 و19.",
          "The 11th and 12th pairs are short and do not reach the sternum, so they are called floating ribs. They attach to vertebrae 18 and 19.",
        ),
        l(
          "وظيفة القفص كله: حماية القلب والرئتين.",
          "The job of the whole cage: protecting the heart and lungs.",
        ),
      ],
      imagine: l(
        "تخيل سلة مخروطية: ضهرها ممسوك في العمود الفقري وقدامها في عظمة القص، وآخر ضلعتين زي أطراف حرة مربوطة من ورا بس (تشبيه).",
        "Imagine a cone-shaped basket: its back held on the spine and its front on the sternum, with the last two ribs like free ends tied only at the back (an analogy).",
      ),
      examples: [
        l(
          "الضلع عظمة مقوسة بتنحني لتحت، وبتتصل من ورا بجسم الفقرة ونتوئها المستعرض.",
          "A rib is a curved bone bending downward, joined at the back to a vertebra's body and transverse process.",
        ),
        l(
          "عظمة القص عظمة أمامية مفلطحة ومدببة من أسفل، وجزؤها السفلي غضروفي.",
          "The sternum is a flat front bone, pointed at the bottom, with a cartilaginous lower part.",
        ),
      ],
      terms: [
        { ar: "القفص الصدري", en: "Thoracic cage" },
        { ar: "عظمة القص", en: "Sternum" },
        { ar: "الضلوع العائمة", en: "Floating ribs" },
        { ar: "الفقرات الصدرية", en: "Thoracic vertebrae" },
        { ar: "الضلع", en: "Rib" },
      ],
    },
    examTrap: {
      claim: l(
        "«كل الضلوع بتتصل بعظمة القص، حتى الضلع العائم».",
        "“Every rib attaches to the sternum, even the floating ribs.”",
      ),
      truth: l(
        "الزوجان الحادي عشر والثاني عشر قصيران ولا يتصلان بالقص، ويتصلان بالفقرتين رقمي 18 و19 للعمود الفقري.",
        "The 11th and 12th pairs are short and do not attach to the sternum; they attach to vertebrae 18 and 19 of the vertebral column.",
      ),
      probes: [
        {
          id: "b8-p1",
          label: l("ضلع من العشرة الأولى", "A rib of the first ten"),
          result: l(
            "بيوصل بين الفقرة الصدرية وعظمة القص.",
            "It links a thoracic vertebra to the sternum.",
          ),
          verdict: "ok",
          highlight: ["true-ribs", "sternum"],
        },
        {
          id: "b8-p2",
          label: l("جرّب توصّل الضلع العائم بالقص", "Try joining a floating rib to the sternum"),
          result: l(
            "مستحيل: قصير ولا يتصل بالقص، عشان كده اتسمى عائم.",
            "Impossible: it is short and does not reach the sternum, hence “floating”.",
          ),
          verdict: "bad",
          highlight: ["floating-ribs", "sternum"],
        },
        {
          id: "b8-p3",
          label: l("الضلع العائم متعلق بإيه؟", "What holds a floating rib?"),
          result: l(
            "بيتصل بالفقرتين رقمي 18 و19 للعمود الفقري.",
            "It attaches to vertebrae no. 18 and 19 of the vertebral column.",
          ),
          verdict: "info",
          highlight: ["floating-ribs"],
        },
      ],
    },
    tasks: [
      {
        kind: "pick",
        id: "b8-t1",
        prompt: l(
          "اضغط على الضلوع اللي مش بتتصل بعظمة القص.",
          "Tap the ribs that do NOT attach to the sternum.",
        ),
        options: ["floating-ribs", "true-ribs", "costal-cartilages", "sternum"],
        answer: "floating-ribs",
        why: l(
          "الزوجان الحادي عشر والثاني عشر قصيران لا يتصلان بالقص ويسميان الضلوع العائمة.",
          "The 11th and 12th pairs are short, do not attach to the sternum, and are called floating ribs.",
        ),
        wrongWhy: {
          "true-ribs": l(
            "دول العشرة أزواج الأولى، وهما اللي بيتصلوا بعظمة القص.",
            "These are the first ten pairs, and they DO attach to the sternum.",
          ),
          "costal-cartilages": l(
            "الغضاريف مش هي الضلوع العائمة. السؤال عن الضلع اللي قصير ومش بيوصل للقص.",
            "Cartilages are not the floating ribs. The question asks about the short ribs that do not reach the sternum.",
          ),
          sternum: l(
            "عظمة القص هي اللي بتتصل بيها العشرة أزواج الأولى، مش ضلع عائم.",
            "The sternum is where the first ten pairs attach; it is not a floating rib.",
          ),
        },
      },
      {
        kind: "numeric",
        id: "b8-t2",
        prompt: l(
          "مجموع عظام القفص الصدري متصلاً بالفقرات الصدرية = كام عظمة؟",
          "How many bones in total make up the thoracic cage with the thoracic vertebrae?",
        ),
        answer: 37,
        unit: l("عظمة", "bones"),
        why: l(
          "37 = 24 ضلع + 1 عظمة قص + 12 فقرة صدرية.",
          "37 = 24 ribs + 1 sternum + 12 thoracic vertebrae.",
        ),
      },
      {
        kind: "numeric",
        id: "b8-t3",
        prompt: l(
          "عدد العظام المتصلة بعظمة القص = كام؟",
          "How many bones are attached to the sternum?",
        ),
        answer: 22,
        unit: l("عظمة", "bones"),
        why: l(
          "22 = 20 ضلع (العشرة أزواج الأولى) + 2 عظمة ترقوة.",
          "22 = 20 ribs (the first ten pairs) + 2 clavicles.",
        ),
      },
      {
        kind: "label",
        id: "b8-t4",
        figure: "thorax",
        title: l("سمّي أجزاء القفص الصدري", "Name the parts of the thoracic cage"),
        parts: ["sternum", "true-ribs", "floating-ribs", "thoracic-vertebrae"],
      },
    ],
    feynmanCheck: {
      prompt: l(
        "اشرح لي كأني صاحبك: القفص الصدري بيتكون من إيه، وإيه حكاية الضلوع العائمة؟",
        "Explain to me like I'm your friend: what is the thoracic cage made of, and what are floating ribs?",
      ),
      keywords: [
        { id: "sternum", label: l("عظمة القص", "Sternum"), match: ["القص", "sternum"] },
        {
          id: "vertebrae",
          label: l("الفقرات الصدرية (12)", "12 thoracic vertebrae"),
          match: ["الفقرات الصدرية", "فقرات صدرية", "thoracic vertebrae", "vertebrae"],
        },
        {
          id: "pairs",
          label: l("12 زوج ضلوع", "12 pairs of ribs"),
          match: ["اثني عشر", "12 زوج", "١٢", "twelve", "12 pairs"],
        },
        {
          id: "ten",
          label: l("العشرة أزواج الأولى تصل للقص", "First ten pairs reach the sternum"),
          match: ["عشرة", "10 ", "ten"],
        },
        {
          id: "floating",
          label: l("الضلوع العائمة قصيرة ولا تتصل بالقص", "Floating ribs: short, not on sternum"),
          match: ["عائم", "floating", "قصير", "short"],
        },
        {
          id: "protect",
          label: l("حماية القلب والرئتين", "Protects heart and lungs"),
          match: ["القلب", "الرئت", "heart", "lung"],
        },
      ],
      model: l(
        "القفص الصدري علبة مخروطية: ورا الفقرات الصدرية الـ12 وقدام عظمة القص، وفيه 12 زوج ضلوع. العشرة الأولى بتوصل للقص، والزوجين الأخيرين قصيرين وعائمين بيتصلوا بالفقرتين 18 و19. وظيفته حماية القلب والرئتين.",
        "The thoracic cage is a cone-shaped box: 12 thoracic vertebrae behind, the sternum in front, and 12 pairs of ribs. The first ten pairs reach the sternum; the last two are short floating ribs attached to vertebrae 18 and 19. It protects the heart and lungs.",
      ),
    },
    microQuiz: [
      {
        id: "b8-q1",
        block: 8,
        prompt: l(
          "الضلعين الحادي عشر والثاني عشر بيتصلوا بإيه؟",
          "What do the 11th and 12th ribs attach to?",
        ),
        options: [
          o("بعظمة القص من قدام", "The sternum at the front"),
          o("بالفقرتين رقمي 18 و19 للعمود الفقري", "Vertebrae no. 18 and 19 of the column"),
          o("بالترقوة", "The clavicle"),
          o("بعضهم ببعض بس", "Only to each other"),
        ],
        correct: 1,
        explain: l(
          "الضلوع العائمة قصيرة ولا تتصل بالقص، وتتصل بالفقرتين رقمي 18 و19.",
          "Floating ribs are short, do not attach to the sternum, and attach to vertebrae 18 and 19.",
        ),
        visual: { figure: "thorax", mark: "floating-ribs" },
      },
      {
        id: "b8-q2",
        block: 8,
        prompt: l("إيه وظيفة القفص الصدري؟", "What is the function of the thoracic cage?"),
        options: [
          o("حماية المخ والحبل الشوكي", "Protecting the brain and spinal cord"),
          o("حماية القلب والرئتين", "Protecting the heart and lungs"),
          o("حماية المعدة والكبد", "Protecting the stomach and liver"),
          o(
            "ربط الطرفين السفليين بالهيكل المحوري",
            "Joining the lower limbs to the axial skeleton",
          ),
        ],
        correct: 1,
        explain: l(
          "وظيفة القفص الصدري حماية القلب والرئتين.",
          "The function of the thoracic cage is to protect the heart and lungs.",
        ),
      },
      {
        id: "b8-q3",
        block: 8,
        prompt: l(
          "العظام المتصلة بعظمة القص = 22 عظمة. هي إيه؟",
          "The bones attached to the sternum total 22. Which are they?",
        ),
        options: [
          o("24 ضلع", "24 ribs"),
          o("20 ضلع + 2 ترقوة", "20 ribs + 2 clavicles"),
          o("12 ضلع + 10 فقرات", "12 ribs + 10 vertebrae"),
          o("22 ضلع", "22 ribs"),
        ],
        correct: 1,
        explain: l(
          "22 عظمة = 20 ضلع (العشرة أزواج الأولى) + 2 عظمة ترقوة.",
          "22 bones = 20 ribs (first ten pairs) + 2 clavicles.",
        ),
      },
    ],
  },

  /* ------------------------------------ 9 ----------------------------------- */
  {
    n: 9,
    emoji: "💪",
    titleEn: "Appendicular Skeleton: Pectoral Girdle and Upper Limbs",
    hookQuestion: {
      question: l(
        "لما بتقلب إيدك من الكف لضهر الكف، إيه اللي بيحصل جوه الساعد؟",
        "When you turn your hand from palm to back, what happens inside the forearm?",
      ),
      options: [
        l("الزند هو اللي بيلف حوالين الكعبرة", "The ulna turns around the radius"),
        l(
          "الكعبرة بتتحرك نصف دائرة حوالين الزند الثابت",
          "The radius moves in a half circle around the fixed ulna",
        ),
        l("العظمتين ثابتين والرسغ هو اللي بيلف", "Both bones stay still and the wrist turns"),
      ],
      correct: 1,
      reveal: l(
        "الكعبرة هي اللي بتتحرك نصف دائرة حوالين الزند الثابت، فتتقاطع معاه على شكل X.",
        "The radius moves in a half circle around the fixed ulna, so it crosses it forming an X.",
      ),
    },
    simpleExplanation: {
      paragraphs: [
        l(
          "الحزام الصدري نصفين متماثلين، وكل نصف عظمتين: الترقوة ولوح الكتف. الترقوة عظمة باطنية رفيعة بتتصل بعظمة القص من قدام وبلوح الكتف من الجنب.",
          "The pectoral girdle has two symmetrical halves, each made of two bones: clavicle and scapula. The thin ventral clavicle joins the sternum in front and the scapula at the side.",
        ),
        l(
          "عند الطرف الخارجي للوح الكتف في التجويف الأروح، وفيه بيستقر رأس العضد ويكوّن المفصل الكتفي.",
          "At the outer end of the scapula is the glenoid cavity, where the head of the humerus sits to form the shoulder joint.",
        ),
        l(
          "الطرف العلوي: عضد، وساعد من عظمتين (الزند والكعبرة)، وعظام اليد: رسغ 8 عظام، راحة 5، وأصابع.",
          "The upper limb: humerus, a forearm of two bones (ulna and radius), and hand bones: 8 wrist bones, 5 palm bones, and the digits.",
        ),
        l("الرسغ بيتصل بالكعبرة، مش بالزند.", "The wrist meets the radius, not the ulna."),
      ],
      imagine: l(
        "تخيل إيدك ماسكة مفتاح عربية وبتلفه: الزند زي محور ثابت، والكعبرة بتلف حواليه نص لفة (تشبيه).",
        "Imagine turning a car key: the ulna is like a fixed axle and the radius swings half a turn around it (an analogy).",
      ),
      examples: [
        l(
          "في الوضع التشريحي الكعبرة من ناحية الإبهام (برّه) والزند من ناحية الخنصر (جوّه).",
          "In the anatomical position the radius is on the thumb side (outside) and the ulna on the little-finger side (inside).",
        ),
        l(
          "كل إصبع 3 سلاميات إلا الإبهام سلاميتين بس.",
          "Each finger has 3 phalanges except the thumb, which has only 2.",
        ),
      ],
      terms: [
        { ar: "الحزام الصدري", en: "Pectoral girdle" },
        { ar: "الترقوة", en: "Clavicle" },
        { ar: "لوح الكتف", en: "Scapula" },
        { ar: "التجويف الأروح", en: "Glenoid cavity" },
        { ar: "الكعبرة", en: "Radius" },
        { ar: "الزند", en: "Ulna" },
        { ar: "رسغ اليد", en: "Wrist" },
      ],
    },
    examTrap: {
      claim: l("«عظام الرسغ بتتصل بالزند».", "“The wrist bones attach to the ulna.”"),
      truth: l(
        "عظام رسغ اليد الثمانية يتصل طرفها العلوي بالطرف السفلي للكعبرة ولا يتصل بعظمة الزند.",
        "The 8 wrist bones meet the lower end of the radius and do NOT attach to the ulna.",
      ),
      probes: [
        {
          id: "b9-p1",
          label: l("وصّل الرسغ بالزند", "Join the wrist to the ulna"),
          result: l(
            "مفيش اتصال: الرسغ لا يتصل بعظمة الزند.",
            "No connection: the wrist does not attach to the ulna.",
          ),
          verdict: "bad",
          highlight: ["carpals", "ulna"],
        },
        {
          id: "b9-p2",
          label: l("وصّل الرسغ بالكعبرة", "Join the wrist to the radius"),
          result: l(
            "أيوه: الـ8 عظام يتصل طرفها العلوي بالطرف السفلي للكعبرة.",
            "Yes: the 8 bones meet the lower end of the radius.",
          ),
          verdict: "ok",
          highlight: ["carpals", "radius"],
        },
        {
          id: "b9-p3",
          label: l("لفّ الساعد", "Rotate the forearm"),
          result: l(
            "الكعبرة بتتحرك نصف دائرة حوالين الزند الثابت فتظهر متقاطعة معاه على شكل X.",
            "The radius swings in a half circle around the fixed ulna and appears crossing it as an X.",
          ),
          verdict: "info",
          highlight: ["radius", "ulna"],
        },
      ],
    },
    tasks: [
      {
        kind: "label",
        id: "b9-t1",
        figure: "pectoral",
        title: l(
          "سمّي أجزاء الحزام الصدري والطرف العلوي",
          "Name the pectoral girdle and upper limb parts",
        ),
        parts: ["clavicle", "scapula", "glenoid", "radius", "ulna", "wrist"],
      },
      {
        kind: "numeric",
        id: "b9-t2",
        prompt: l(
          "مجموع عظام الطرف العلوي الواحد = كام عظمة؟",
          "How many bones make one upper limb?",
        ),
        answer: 30,
        unit: l("عظمة", "bones"),
        why: l(
          "30 = 1 عضد + 2 الساعد + (8 رسغ + 5 راحة + 14 سلامية).",
          "30 = 1 humerus + 2 forearm + (8 wrist + 5 palm + 14 phalanges).",
        ),
      },
      {
        kind: "numeric",
        id: "b9-t3",
        prompt: l("مجموع عظام الحزام الصدري = كام؟", "How many bones make up the pectoral girdle?"),
        answer: 4,
        unit: l("عظام", "bones"),
        why: l("4 عظام = 2 لوح كتف + 2 ترقوة.", "4 bones = 2 scapulae + 2 clavicles."),
      },
      {
        kind: "numeric",
        id: "b9-t4",
        prompt: l("كام عظمة بتكوّن مفصل الكوع؟", "How many bones form the elbow joint?"),
        answer: 3,
        unit: l("عظام", "bones"),
        why: l("3 عظام: العضد + الكعبرة + الزند.", "3 bones: humerus + radius + ulna."),
      },
      {
        kind: "pick",
        id: "b9-t5",
        prompt: l(
          "في الوضع التشريحي، أي عظمة من الساعد جهة الخارج في نفس جهة الإبهام؟",
          "In the anatomical position, which forearm bone is on the outside, on the thumb side?",
        ),
        options: ["radius", "ulna", "humerus", "clavicle"],
        answer: "radius",
        why: l(
          "الكعبرة جهة الخارج في نفس جهة الإبهام، والزند جهة الداخل مع الخنصر.",
          "The radius is on the outside, on the thumb side; the ulna is inside, on the little-finger side.",
        ),
        wrongWhy: {
          ulna: l(
            "الزند جهة الداخل في نفس جهة الخنصر، مش الإبهام.",
            "The ulna is on the inside, on the little-finger side, not the thumb side.",
          ),
          humerus: l(
            "العضد في الذراع فوق الكوع، مش من عظمتي الساعد.",
            "The humerus is the arm bone above the elbow, not a forearm bone.",
          ),
          clavicle: l(
            "الترقوة من الحزام الصدري عند الكتف، مش في الساعد.",
            "The clavicle belongs to the pectoral girdle at the shoulder, not the forearm.",
          ),
        },
      },
    ],
    feynmanCheck: {
      prompt: l(
        "اشرح لي كأني صاحبك: الحزام الصدري والطرف العلوي بيتكونوا من إيه، والرسغ بيتصل بأنهي عظمة؟",
        "Explain to me like I'm your friend: what makes up the pectoral girdle and upper limb, and which bone does the wrist meet?",
      ),
      keywords: [
        {
          id: "clavicle",
          label: l("الترقوة", "Clavicle"),
          match: ["الترقوة", "ترقوة", "clavicle"],
        },
        { id: "scapula", label: l("لوح الكتف", "Scapula"), match: ["لوح الكتف", "scapula"] },
        {
          id: "glenoid",
          label: l("التجويف الأروح", "Glenoid cavity"),
          match: ["الأروح", "اروح", "glenoid"],
        },
        { id: "radius", label: l("الكعبرة", "Radius"), match: ["الكعبرة", "كعبرة", "radius"] },
        { id: "ulna", label: l("الزند", "Ulna"), match: ["الزند", "زند", "ulna"] },
        {
          id: "wrist8",
          label: l("الرسغ 8 عظام يتصل بالكعبرة", "8 wrist bones meet the radius"),
          match: ["رسغ", "wrist", "carpal"],
        },
        {
          id: "x",
          label: l("الكعبرة تتحرك نصف دائرة وتشكل X", "Radius half-circle forms an X"),
          match: ["نصف دائر", "half", "X", "إكس"],
        },
      ],
      model: l(
        "الحزام الصدري عظمتين في كل نص: الترقوة ولوح الكتف، وفي لوح الكتف التجويف الأروح بيستقر فيه رأس العضد. الساعد فيه الكعبرة والزند، والرسغ (8 عظام) بيتصل بالكعبرة مش بالزند. والكعبرة بتتحرك نصف دائرة حوالين الزند الثابت فتعمل X.",
        "Each half of the pectoral girdle has two bones: clavicle and scapula; the scapula's glenoid cavity holds the head of the humerus. The forearm has the radius and ulna; the 8 wrist bones meet the radius, not the ulna. The radius swings in a half circle around the fixed ulna, forming an X.",
      ),
    },
    microQuiz: [
      {
        id: "b9-q1",
        block: 9,
        prompt: l("كام سلامية في إصبع الإبهام؟", "How many phalanges does the thumb have?"),
        options: [
          o("سلاميتين", "Two"),
          o("3 سلاميات", "Three"),
          o("سلامية واحدة", "One"),
          o("4 سلاميات", "Four"),
        ],
        correct: 0,
        explain: l(
          "كل إصبع 3 سلاميات رفيعة ما عدا الإبهام فسلاميتين فقط، والمجموع 14 سلامية.",
          "Each digit has 3 slender phalanges except the thumb with only two; the total is 14.",
        ),
      },
      {
        id: "b9-q2",
        block: 9,
        prompt: l("كام عظمة بتكوّن مفصل الكتف؟", "How many bones form the shoulder joint?"),
        options: [
          o("عظمتين: لوح الكتف والعضد", "Two: scapula and humerus"),
          o("3 عظام: الترقوة ولوح الكتف والعضد", "Three: clavicle, scapula and humerus"),
          o("عظمتين: الترقوة والعضد", "Two: clavicle and humerus"),
          o("4 عظام", "Four"),
        ],
        correct: 0,
        explain: l(
          "مفصل الكتف = لوح الكتف + العضد (رأس العضد في التجويف الأروح). أما الكوع فـ3 عظام.",
          "Shoulder joint = scapula + humerus (head of humerus in the glenoid cavity). The elbow has 3 bones.",
        ),
        visual: { figure: "pectoral", mark: "shoulder-joint" },
      },
      {
        id: "b9-q3",
        block: 9,
        prompt: l(
          "أي عظمة أصغر حجماً وبتتحرك حركة نصف دائرية حوالين عظمة ثابتة؟",
          "Which smaller bone moves in a half circle around a fixed bone?",
        ),
        options: [
          o("الزند", "Ulna"),
          o("الكعبرة", "Radius"),
          o("العضد", "Humerus"),
          o("لوح الكتف", "Scapula"),
        ],
        correct: 1,
        explain: l(
          "الكعبرة أصغر من الزند وتتحرك حركة نصف دائرية حول عظمة الزند الثابتة.",
          "The radius is smaller than the ulna and moves in a half circle around the fixed ulna.",
        ),
      },
    ],
  },

  /* ----------------------------------- 10 ----------------------------------- */
  {
    n: 10,
    emoji: "🦵",
    titleEn: "Pelvic Girdle and Lower Limbs",
    hookQuestion: {
      question: l(
        "كل نص من الحزام الحوضي بيتكوّن من كام عظمة اتلحموا في عظمة واحدة؟",
        "Each half of the pelvic girdle is made of how many bones fused into one bone?",
      ),
      options: [l("2 عظمتين", "2 bones"), l("3 عظام", "3 bones"), l("4 عظام", "4 bones")],
      correct: 1,
      reveal: l(
        "3 عظام (الحرقفة والورك والعانة) بتلتحم في عظمة واحدة، فالحزام الحوضي عظمتين. أما الحوض فـ4 عظام بالعجز والعصعص.",
        "3 bones (ilium, ischium, pubis) fuse into one, so the pelvic girdle has 2 bones. The pelvis has 4, adding the sacrum and coccyx.",
      ),
    },
    simpleExplanation: {
      paragraphs: [
        l(
          "الحزام الحوضي نصفين متماثلين بيتقابلوا من قدام عند الارتفاق العاني. كل نص: الحرقفة الظهرية + العانة + الورك.",
          "The pelvic girdle has two symmetrical halves meeting at the pubic symphysis in front. Each half: dorsal ilium + pubis + ischium.",
        ),
        l(
          "عظام كل نص بتلتحم مع بعض في عظمة واحدة، فالحزام الحوضي عظمتين. وعند التقاء الثلاثة فيه التجويف الحقي اللي بيستقر فيه رأس الفخذ.",
          "The bones of each half fuse into one bone, so the girdle has two bones. Where the three meet is the acetabulum, which holds the femoral head.",
        ),
        l(
          "الطرف السفلي: فخذ، رضفة قدام الركبة، ساق من قصبة (داخلية) وشظية (خارجية)، وقدم: رسغ 7 عظام، مشط 5، وأصابع.",
          "The lower limb: femur, patella in front of the knee, a shank of tibia (inner) and fibula (outer), and the foot: 7 ankle bones, 5 metatarsals, and toes.",
        ),
      ],
      imagine: l(
        "تخيل حوض واسع عليه كرة الفخذ داخله في تجويف عميق زي الكرة في الكوب (تشبيه).",
        "Imagine a wide bowl with the femur's ball sitting in a deep socket like a ball in a cup (an analogy).",
      ),
      examples: [
        l(
          "تجويف الحوض في الأنثى أوسع منه في الذكر ليلائم الحمل والولادة.",
          "The pelvic cavity is wider in females than males to suit pregnancy and childbirth.",
        ),
        l(
          "الحزام الصدري بيوصل الطرفين العلويين بالقص عن طريق الترقوة، والحوضي بيوصل السفليين بالفقرات العجزية عن طريق الحرقفة.",
          "The pectoral girdle links the upper limbs to the sternum via the clavicle; the pelvic girdle links the lower limbs to the sacral vertebrae via the ilium.",
        ),
      ],
      terms: [
        { ar: "الحزام الحوضي", en: "Pelvic girdle" },
        { ar: "الارتفاق العاني", en: "Pubic symphysis" },
        { ar: "التجويف الحقي", en: "Acetabulum" },
        { ar: "الفخذ", en: "Femur" },
        { ar: "الرضفة", en: "Patella" },
        { ar: "القصبة", en: "Tibia" },
        { ar: "الشظية", en: "Fibula" },
      ],
    },
    examTrap: {
      claim: l(
        "«الحزام الحوضي هو الحوض، يعني 4 عظام».",
        "“The pelvic girdle is the pelvis, so it has 4 bones.”",
      ),
      truth: l(
        "الحزام الحوضي = عظمتين (كل عظمة من 3 ملتحمة). عدد عظام الحوض = 4 (عظمتي الحزام + العجز + العصعص).",
        "The pelvic girdle = 2 bones (each of 3 fused). The pelvis = 4 bones (the 2 girdle bones + sacrum + coccyx).",
      ),
      probes: [
        {
          id: "b10-p1",
          label: l("عدّ عظام الحزام الحوضي", "Count the pelvic girdle bones"),
          result: l(
            "عظمتين، كل واحدة من 3 ملتحمة: الحرقفة + الورك + العانة.",
            "Two bones, each of 3 fused: ilium + ischium + pubis.",
          ),
          verdict: "ok",
          highlight: ["hip-bone"],
        },
        {
          id: "b10-p2",
          label: l("قول «الحزام الحوضي = 4 عظام»", "Say “pelvic girdle = 4 bones”"),
          result: l(
            "غلط: كده خلطت الحزام بالحوض. الحزام عظمتين بس.",
            "Wrong: you mixed up the girdle with the pelvis. The girdle has only 2.",
          ),
          verdict: "bad",
          highlight: ["hip-bone"],
        },
        {
          id: "b10-p3",
          label: l("ضيف العجز والعصعص", "Add the sacrum and coccyx"),
          result: l(
            "عظمتي الحزام + العجز + العصعص = عظام الحوض = 4.",
            "2 girdle bones + sacrum + coccyx = pelvis = 4 bones.",
          ),
          verdict: "info",
          highlight: ["hip-bone", "sacrum"],
        },
      ],
    },
    tasks: [
      {
        kind: "label",
        id: "b10-t1",
        figure: "pelvic",
        title: l("سمّي أجزاء الحزام الحوضي", "Name the pelvic girdle parts"),
        parts: ["ilium", "pubis", "ischium", "acetabulum", "pubic-symphysis"],
      },
      {
        kind: "numeric",
        id: "b10-t2",
        prompt: l("عدد عظام الحوض = كام؟", "How many bones make up the pelvis?"),
        answer: 4,
        unit: l("عظام", "bones"),
        why: l(
          "4 عظام = عظمتي الحزام الحوضي + العجز + العصعص.",
          "4 bones = the 2 pelvic girdle bones + sacrum + coccyx.",
        ),
      },
      {
        kind: "numeric",
        id: "b10-t3",
        prompt: l(
          "عدد التجاويف الموجودة بالهيكل الطرفي = كام؟",
          "How many cavities are in the appendicular skeleton?",
        ),
        answer: 6,
        unit: l("تجاويف", "cavities"),
        why: l(
          "6 = 2 تجويف أروح + 2 تجويف حقي + 2 تجويف بعظمتي الزند.",
          "6 = 2 glenoid + 2 acetabulum + 2 in the two ulnae.",
        ),
      },
      {
        kind: "numeric",
        id: "b10-t4",
        prompt: l(
          "كام عظمة بتربط الهيكل الطرفي بالهيكل المحوري؟",
          "How many bones link the appendicular skeleton to the axial skeleton?",
        ),
        answer: 6,
        unit: l("عظام", "bones"),
        why: l(
          "6 عظام = 4 من الحزام الصدري (2 ترقوة + 2 لوح كتف) + 2 الحزام الحوضي.",
          "6 bones = 4 from the pectoral girdle (2 clavicles + 2 scapulae) + 2 from the pelvic girdle.",
        ),
      },
      {
        kind: "numeric",
        id: "b10-t5",
        prompt: l(
          "مجموع عظام الطرف السفلي الواحد = كام عظمة؟",
          "How many bones make one lower limb?",
        ),
        answer: 30,
        unit: l("عظمة", "bones"),
        why: l(
          "30 = فخذ + رضفة + شظية + قصبة + (7 رسغ القدم + 5 مشط + 14 سلامية).",
          "30 = femur + patella + fibula + tibia + (7 ankle + 5 metatarsals + 14 phalanges).",
        ),
      },
      {
        kind: "match",
        id: "b10-t6",
        title: l("الحزام الصدري ولا الحوضي؟", "Pectoral or pelvic girdle?"),
        items: [
          {
            id: "i1",
            prompt: l("يتصل بالطرفين العلويين", "Joins the upper limbs"),
            answer: "pectoral",
          },
          {
            id: "i2",
            prompt: l("يتصل بالطرفين السفليين", "Joins the lower limbs"),
            answer: "pelvic",
          },
          {
            id: "i3",
            prompt: l(
              "يصل بالهيكل المحوري عن طريق اتصال الترقوة بالقص",
              "Reaches the axial skeleton via clavicle–sternum",
            ),
            answer: "pectoral",
          },
          {
            id: "i4",
            prompt: l(
              "يصل بالهيكل المحوري عن طريق اتصال الحرقفة بالفقرات العجزية",
              "Reaches the axial skeleton via ilium–sacral vertebrae",
            ),
            answer: "pelvic",
          },
        ],
        options: [
          { id: "pectoral", label: l("الحزام الصدري", "Pectoral girdle") },
          { id: "pelvic", label: l("الحزام الحوضي", "Pelvic girdle") },
        ],
        why: l(
          "الصدري يصل الطرفين العلويين بالقص عبر الترقوة، والحوضي يصل الطرفين السفليين بالفقرات العجزية عبر الحرقفة.",
          "The pectoral girdle joins the upper limbs via clavicle to sternum; the pelvic girdle joins the lower limbs via ilium to the sacral vertebrae.",
        ),
      },
    ],
    feynmanCheck: {
      prompt: l(
        "اشرح لي كأني صاحبك: الفرق بين الحزام الحوضي والحوض، وإيه التجويف الحقي؟",
        "Explain to me like I'm your friend: the difference between the pelvic girdle and the pelvis, and what is the acetabulum?",
      ),
      keywords: [
        {
          id: "two",
          label: l("الحزام الحوضي عظمتين", "Girdle = 2 bones"),
          match: ["عظمتين", "اتنين", "two", "2 bones"],
        },
        {
          id: "fused",
          label: l("كل عظمة من 3 ملتحمة", "Each of 3 fused bones"),
          match: ["ملتحم", "التحم", "fused", "تلتحم"],
        },
        {
          id: "three",
          label: l("الحرقفة والورك والعانة", "Ilium, ischium, pubis"),
          match: ["الحرقفة", "الورك", "العانة", "ilium", "ischium", "pubis"],
        },
        {
          id: "four",
          label: l("الحوض 4 عظام", "Pelvis = 4 bones"),
          match: ["4", "أربع", "اربع", "four"],
        },
        {
          id: "sacrum",
          label: l("العجز والعصعص", "Sacrum and coccyx"),
          match: ["العجز", "العصعص", "sacrum", "coccyx"],
        },
        {
          id: "acetabulum",
          label: l("التجويف الحقي لرأس الفخذ", "Acetabulum holds femur head"),
          match: ["الحقي", "acetabulum", "رأس الفخذ", "head of the femur"],
        },
      ],
      model: l(
        "الحزام الحوضي عظمتين بس، كل واحدة من 3 عظام ملتحمة: الحرقفة والورك والعانة. أما الحوض فـ4 عظام: عظمتين الحزام + العجز + العصعص. وعند التقاء الثلاثة في التجويف الحقي بيستقر رأس الفخذ.",
        "The pelvic girdle has only 2 bones, each of 3 fused bones: ilium, ischium, pubis. The pelvis has 4: the 2 girdle bones + sacrum + coccyx. Where the three meet, the acetabulum holds the head of the femur.",
      ),
    },
    microQuiz: [
      {
        id: "b10-q1",
        block: 10,
        prompt: l(
          "أقل عظمة تأثيراً على حركة الجزء السفلي من الطرف السفلي هي:",
          "The bone with the least effect on movement of the lower part of the lower limb is:",
        ),
        options: [
          o("القصبة", "Tibia"),
          o("الشظية", "Fibula"),
          o("الفخذ", "Femur"),
          o("الرضفة", "Patella"),
        ],
        correct: 1,
        explain: l(
          "أقل العظام تأثيراً على حركة الجزء السفلي للطرف السفلي هي عظمة الشظية.",
          "The fibula is the bone with the least effect on movement of the lower part of the lower limb.",
        ),
        visual: { figure: "pelvic", mark: "fibula" },
      },
      {
        id: "b10-q2",
        block: 10,
        prompt: l("كام عظمة بتكوّن مفصل الفخذ؟", "How many bones form the hip joint?"),
        options: [
          o("عظمتين: إحدى عظمتي الحزام الحوضي + الفخذ", "Two: one pelvic girdle bone + femur"),
          o("3 عظام: الحرقفة والورك والعانة", "Three: ilium, ischium, pubis"),
          o("3 عظام: الفخذ والرضفة والقصبة", "Three: femur, patella, tibia"),
          o("عظمة واحدة", "One"),
        ],
        correct: 0,
        explain: l(
          "مفصل الفخذ = إحدى عظمتي الحزام الحوضي + عظمة الفخذ. أما الركبة فـ3 عظام: الفخذ + الرضفة + القصبة.",
          "Hip joint = one pelvic girdle bone + the femur. The knee has 3: femur + patella + tibia.",
        ),
      },
      {
        id: "b10-q3",
        block: 10,
        prompt: l(
          "في المنظر الخلفي للساق، أي عظمة بتظهر كاملة؟",
          "In the back view of the shank, which bone appears complete?",
        ),
        options: [
          o("القصبة", "Tibia"),
          o("الشظية", "Fibula"),
          o("الرضفة", "Patella"),
          o("الفخذ", "Femur"),
        ],
        correct: 1,
        explain: l(
          "في المنظر الخلفي تظهر الشظية كاملة تغطي جزءاً من أعلى القصبة، وفي الأمامي تظهر القصبة كاملة.",
          "In the back view the fibula appears complete, covering part of the top of the tibia; in the front view the tibia is complete.",
        ),
      },
    ],
  },

  /* ----------------------------------- 11 ----------------------------------- */
  {
    n: 11,
    emoji: "🧈",
    titleEn: "Cartilages",
    hookQuestion: {
      question: l(
        "الغضروف مفيهوش أوعية دموية. طب بياخد الأكل والأكسجين منين؟",
        "Cartilage has no blood vessels. So where does it get food and oxygen?",
      ),
      options: [
        l("من أوعية دموية رفيعة جداً جواه", "From very thin blood vessels inside it"),
        l("من خلايا العظام بالانتشار", "From bone cells by diffusion"),
        l("من الهواء مباشرة", "Directly from the air"),
      ],
      correct: 1,
      reveal: l(
        "الغضروف مفيهوش أوعية دموية، فبياخد الغذاء والأكسجين من خلايا العظام بالانتشار.",
        "Cartilage has no blood vessels, so it gets food and oxygen from bone cells by diffusion.",
      ),
    },
    simpleExplanation: {
      paragraphs: [
        l(
          "الغضروف نوع من الأنسجة الضامة. بيتكون من خلايا غضروفية ومفيهوش أوعية دموية.",
          "Cartilage is a type of connective tissue made of cartilage cells and has no blood vessels.",
        ),
        l(
          "عشان كده بياخد الغذاء والأكسجين من خلايا العظام بالانتشار، يعني الجزيئات بتتحرك من مكان تركيزها عالي لمكان تركيزها واطي.",
          "So it gets food and oxygen from bone cells by diffusion: molecules move from high concentration to low concentration.",
        ),
        l(
          "بنلاقيه في الأذن الخارجية والأنف وجدار القصبة الهوائية، وغالباً عند أطراف العظام وخصوصاً المفاصل، وبين فقرات العمود الفقري، عشان يحمي العظام من التآكل من الاحتكاك.",
          "It is found in the outer ear, nose and trachea wall, and mostly at bone ends especially joints and between vertebrae, protecting bones from wear by constant friction.",
        ),
      ],
      imagine: l(
        "تخيل وسادة ملساء بين سطحين خشنين: بتمنع الاحتكاك والتآكل (تشبيه).",
        "Imagine a smooth cushion between two rough surfaces, stopping friction and wear (an analogy).",
      ),
      examples: [
        l("غضروف الأذن الخارجية والأنف.", "The cartilage of the outer ear and the nose."),
        l(
          "الغضاريف بين فقرات العمود الفقري وعند المفاصل.",
          "The cartilage between the vertebrae and at joints.",
        ),
      ],
      terms: [
        { ar: "الغضروف", en: "Cartilage" },
        { ar: "النسيج الضام", en: "Connective tissue" },
        { ar: "الانتشار", en: "Diffusion" },
        { ar: "المادة البينية", en: "Intercellular material" },
        { ar: "نسيج ضام هيكلي", en: "Skeletal connective tissue" },
      ],
    },
    examTrap: {
      claim: l("«الغضروف فيه أوعية دموية بتغذيه».", "“Cartilage has blood vessels that feed it.”"),
      truth: l(
        "الغضروف لا يحتوي على أوعية دموية، لذلك يحصل على الغذاء والأكسجين من خلايا العظام بالانتشار.",
        "Cartilage contains no blood vessels, so it gets food and oxygen from bone cells by diffusion.",
      ),
      probes: [
        {
          id: "b11-p1",
          label: l("دوّر على أوعية دموية في الغضروف", "Look for blood vessels in cartilage"),
          result: l(
            "مفيش أوعية دموية خالص في الغضروف.",
            "There are no blood vessels in cartilage at all.",
          ),
          verdict: "bad",
          highlight: ["costal-cartilages"],
        },
        {
          id: "b11-p2",
          label: l("الغذاء بيوصل إزاي؟", "How does food arrive?"),
          result: l("بالانتشار من خلايا العظام.", "By diffusion from the bone cells."),
          verdict: "ok",
          highlight: ["costal-cartilages", "discs"],
        },
        {
          id: "b11-p3",
          label: l("يعني إيه انتشار؟", "What is diffusion?"),
          result: l(
            "حركة الجزيئات أو الأيونات من منطقة تركيز مرتفع لمنطقة تركيز منخفض.",
            "Movement of molecules or ions from a high-concentration area to a low-concentration area.",
          ),
          verdict: "info",
        },
      ],
    },
    tasks: [
      {
        kind: "match",
        id: "b11-t1",
        title: l("نوع النسيج الضام", "Type of connective tissue"),
        items: [
          { id: "i1", prompt: l("العظام", "Bones"), answer: "skeletal" },
          { id: "i2", prompt: l("الغضاريف", "Cartilages"), answer: "skeletal" },
          { id: "i3", prompt: l("أدمة الجلد", "Dermis of the skin"), answer: "proper" },
          { id: "i4", prompt: l("الدم والليمف", "Blood and lymph"), answer: "vascular" },
        ],
        options: [
          { id: "skeletal", label: l("نسيج ضام هيكلي", "Skeletal connective") },
          { id: "proper", label: l("نسيج ضام أصيل", "Proper connective") },
          { id: "vascular", label: l("نسيج ضام وعائي", "Vascular connective") },
        ],
        why: l(
          "الضام الهيكلي يشمل العظام والغضاريف، والأصيل كما في أدمة الجلد، والوعائي يشمل الدم والليمف.",
          "Skeletal connective tissue includes bones and cartilages; proper as in the dermis; vascular includes blood and lymph.",
        ),
      },
      {
        kind: "pick",
        id: "b11-t2",
        prompt: l(
          "اضغط على الغضروف اللي عند أطراف العظام ومفيهوش أوعية دموية.",
          "Tap the cartilage found at bone ends, with no blood vessels.",
        ),
        options: ["costal-cartilages", "true-ribs", "clavicle", "femur"],
        answer: "costal-cartilages",
        why: l(
          "الغضاريف غالباً عند أطراف العظام، ولا تحتوي على أوعية دموية وتأخذ غذاءها بالانتشار.",
          "Cartilages are mostly found at bone ends; they have no blood vessels and get food by diffusion.",
        ),
        wrongWhy: {
          "true-ribs": l(
            "الضلوع عظام مش غضاريف. الغضروف هو اللي عند أطرافها.",
            "Ribs are bones, not cartilage. Cartilage is what lies at bone ends.",
          ),
          clavicle: l(
            "الترقوة عظمة، والعظام تغذي الغضروف بالانتشار.",
            "The clavicle is a bone; bone cells feed cartilage by diffusion.",
          ),
          femur: l("الفخذ عظمة، مش غضروف.", "The femur is a bone, not cartilage."),
        },
      },
      {
        kind: "pick",
        id: "b11-t3",
        prompt: l(
          "إيه اللي بين فقرات العمود الفقري وبيحمي العظام من التآكل؟",
          "What lies between the vertebrae and protects bones from wear?",
        ),
        options: ["discs", "lumbar-vertebrae", "sacrum", "hip-bone"],
        answer: "discs",
        why: l(
          "الغضاريف توجد بين فقرات العمود الفقري لحماية العظام من التآكل نتيجة الاحتكاك المستمر.",
          "Cartilages lie between the vertebrae to protect bones from wear caused by constant friction.",
        ),
        wrongWhy: {
          "lumbar-vertebrae": l(
            "الفقرات عظام، والغضروف هو اللي بينها.",
            "Vertebrae are bones; the cartilage is what lies between them.",
          ),
          sacrum: l(
            "العجز عظمة، مش الغضروف اللي بين الفقرات.",
            "The sacrum is a bone, not the cartilage between vertebrae.",
          ),
          "hip-bone": l("عظمة الحوض عظمة، مش غضروف.", "The hip bone is a bone, not cartilage."),
        },
      },
    ],
    feynmanCheck: {
      prompt: l(
        "اشرح لي كأني صاحبك: الغضروف إيه، وبياخد غذاءه إزاي ومكانه فين؟",
        "Explain to me like I'm your friend: what is cartilage, how does it get its food, and where is it?",
      ),
      keywords: [
        {
          id: "ct",
          label: l("نسيج ضام", "Connective tissue"),
          match: ["نسيج ضام", "الضام", "connective"],
        },
        {
          id: "novessels",
          label: l("مفيهوش أوعية دموية", "No blood vessels"),
          match: ["مفيهوش", "بدون أوعية", "لا يحتوي", "no blood", "without blood"],
        },
        {
          id: "diffusion",
          label: l("الغذاء بالانتشار", "Food by diffusion"),
          match: ["انتشار", "diffusion"],
        },
        {
          id: "bonecells",
          label: l("من خلايا العظام", "From bone cells"),
          match: ["خلايا العظام", "العظام", "bone cells"],
        },
        {
          id: "where",
          label: l("الأذن والأنف والقصبة الهوائية", "Ear, nose, trachea"),
          match: ["الأذن", "الانف", "الأنف", "القصبة", "ear", "nose", "trachea"],
        },
        {
          id: "joints",
          label: l("عند المفاصل وبين الفقرات", "At joints and between vertebrae"),
          match: ["المفاصل", "الفقرات", "joint", "vertebra"],
        },
      ],
      model: l(
        "الغضروف نسيج ضام من خلايا غضروفية ومفيهوش أوعية دموية، فبياخد الغذاء والأكسجين من خلايا العظام بالانتشار. موجود في الأذن الخارجية والأنف والقصبة الهوائية، وعند أطراف العظام والمفاصل وبين فقرات العمود الفقري عشان يحمي العظام من التآكل.",
        "Cartilage is a connective tissue of cartilage cells with no blood vessels, so it gets food and oxygen from bone cells by diffusion. It is in the outer ear, nose and trachea, and at bone ends, joints and between vertebrae to protect bones from wear.",
      ),
    },
    microQuiz: [
      {
        id: "b11-q1",
        block: 11,
        prompt: l(
          "أي من دول من الأنسجة الضامة الوعائية؟",
          "Which of these is a vascular connective tissue?",
        ),
        options: [
          o("الغضاريف", "Cartilages"),
          o("الدم والليمف", "Blood and lymph"),
          o("أدمة الجلد", "Dermis of the skin"),
          o("العظام", "Bones"),
        ],
        correct: 1,
        explain: l(
          "النسيج الضام الوعائي يشمل الدم والليمف، أما العظام والغضاريف فضام هيكلي وأدمة الجلد ضام أصيل.",
          "Vascular connective tissue includes blood and lymph; bones and cartilages are skeletal and the dermis is proper.",
        ),
      },
      {
        id: "b11-q2",
        block: 11,
        prompt: l(
          "إيه اللي بيحدد نوع النسيج الضام؟",
          "What decides the type of connective tissue?",
        ),
        options: [
          o("عدد الأوعية الدموية", "Number of blood vessels"),
          o("نوع المادة البينية بين الخلايا", "The type of intercellular material"),
          o("حجم الخلايا فقط", "Only the size of the cells"),
          o("مكانه في الجسم فقط", "Only its position in the body"),
        ],
        correct: 1,
        explain: l(
          "الأنسجة الضامة خلاياها متباعدة ومغموسة في مادة بينية سائلة أو شبه صلبة أو صلبة، وتقسم تبعاً لنوعها.",
          "Connective tissues have spaced cells in an intercellular material (liquid, semi-solid or solid) and are classified by its type.",
        ),
      },
      {
        id: "b11-q3",
        block: 11,
        prompt: l("أي مكان من دول فيه غضروف؟", "Which of these places contains cartilage?"),
        options: [
          o("جدار القصبة الهوائية", "The wall of the trachea"),
          o("أدمة الجلد", "The dermis of the skin"),
          o("الدم", "The blood"),
          o("الليمف", "The lymph"),
        ],
        correct: 0,
        explain: l(
          "الغضاريف توجد في الأذن الخارجية والأنف وجدار القصبة الهوائية، وعند أطراف العظام.",
          "Cartilages are found in the outer ear, nose and trachea wall, and at bone ends.",
        ),
      },
    ],
  },

  /* ----------------------------------- 12 ----------------------------------- */
  {
    n: 12,
    emoji: "🔩",
    titleEn: "Joints and Their Three Types",
    hookQuestion: {
      question: l(
        "إيه اللي بيحدد نوع المفصل في الكتاب؟",
        "In the textbook, what decides the type of a joint?",
      ),
      options: [
        l("حجم العظام اللي بتتقابل", "The size of the meeting bones"),
        l("طبيعة النسيج اللي بين العظام", "The nature of the tissue between the bones"),
        l("عدد العضلات حوالين المفصل", "The number of muscles around the joint"),
      ],
      correct: 1,
      reveal: l(
        "المفاصل بتتصنف حسب طبيعة النسيج اللي بين العظام: ليفي، غضروفي، أو زلالي.",
        "Joints are classified by the tissue between the bones: fibrous, cartilaginous, or synovial.",
      ),
    },
    simpleExplanation: {
      paragraphs: [
        l(
          "المفاصل ليفية وغضروفية وزلالية. المفصل الليفي بتلتحم عظامه بنسيج ليفي بيتحول مع العمر لنسيج عظمي، ومعظمه ما بيسمحش بالحركة. مثاله الجمجمة بأطرافها المسننة.",
          "Joints are fibrous, cartilaginous or synovial. In fibrous joints bones fuse by fibrous tissue that turns into bony tissue with age; most allow no movement, e.g. the skull's serrated edges.",
        ),
        l(
          "المفصل الغضروفي بيربط نهايات عظام متجاورة ومعظمه بيسمح بحركة محدودة جداً، زي اللي بين أجسام الفقرات.",
          "A cartilaginous joint links the ends of neighbouring bones and mostly allows very limited movement, e.g. between vertebral bodies.",
        ),
        l(
          "المفصل الزلالي هو معظم مفاصل الجسم: مرن، وسطح العظام مغطى بغضروف أملس وفيه سائل زلالي. منه محدود الحركة (الكوع والركبة) وواسع الحركة (الكتف والفخذ).",
          "Synovial joints are most body joints: flexible, bone surfaces covered with smooth cartilage and synovial fluid. Limited (elbow, knee) or wide-range (shoulder, hip).",
        ),
      ],
      imagine: l(
        "تخيل باب مثبت بمسامير (ليفي)، وباب بيتحرك شوية على مفصلة (غضروفي)، وكرة تلف في كوب مدهون بزيت (زلالي) (تشبيه).",
        "Imagine a nailed-shut door (fibrous), a door that wobbles a little (cartilaginous), and a ball turning in an oiled cup (synovial) (an analogy).",
      ),
      examples: [
        l("مفاصل عظام الجمجمة.", "The joints between skull bones."),
        l("مفاصل أجسام الفقرات.", "The joints between vertebral bodies."),
        l(
          "الكوع والركبة محدودة الحركة؛ الكتف والفخذ واسعة.",
          "Elbow and knee are limited; shoulder and hip are wide-ranging.",
        ),
      ],
      terms: [
        { ar: "المفاصل الليفية", en: "Fibrous joints" },
        { ar: "المفاصل الغضروفية", en: "Cartilaginous joints" },
        { ar: "المفاصل الزلالية", en: "Synovial joints" },
        { ar: "السائل الزلالي", en: "Synovial fluid" },
        { ar: "مفاصل واسعة الحركة", en: "Wide-range joints" },
      ],
    },
    examTrap: {
      claim: l("«كل المفاصل بتسمح بالحركة».", "“All joints allow movement.”"),
      truth: l(
        "المفاصل الليفية معظمها لا يسمح بالحركة (مثل مفاصل الجمجمة)، وأنسجتها الليفية تتحول مع تقدم العمر إلى أنسجة عظمية.",
        "Fibrous joints mostly allow no movement (like skull joints), and their fibrous tissue turns into bony tissue with age.",
      ),
      probes: [
        {
          id: "b12-p1",
          label: l("مفاصل الجمجمة", "Skull joints"),
          result: l(
            "ليفية بأطراف مسننة، معظمها لا يسمح بالحركة.",
            "Fibrous with serrated edges; mostly no movement.",
          ),
          verdict: "bad",
          highlight: ["cranial-bones"],
        },
        {
          id: "b12-p2",
          label: l("بين أجسام الفقرات", "Between vertebral bodies"),
          result: l(
            "غضروفي: معظمها بيسمح بحركة محدودة جداً.",
            "Cartilaginous: mostly very limited movement.",
          ),
          verdict: "info",
          highlight: ["discs"],
        },
        {
          id: "b12-p3",
          label: l("مفصل الكتف", "Shoulder joint"),
          result: l(
            "زلالي واسع الحركة: بيتحرك في اتجاهات مختلفة.",
            "Synovial, wide-range: moves in different directions.",
          ),
          verdict: "ok",
          highlight: ["scapula", "humerus"],
        },
        {
          id: "b12-p4",
          label: l("مع تقدم العمر", "With age"),
          result: l(
            "النسيج الليفي بيتحول لنسيج عظمي.",
            "The fibrous tissue turns into bony tissue.",
          ),
          verdict: "info",
          highlight: ["cranial-bones"],
        },
      ],
    },
    tasks: [
      {
        kind: "label",
        id: "b12-t1",
        figure: "joints",
        title: l("سمّي أنواع المفاصل", "Name the joint types"),
        parts: ["fibrous-joint", "cartilaginous-joint", "synovial-joint"],
      },
      {
        kind: "match",
        id: "b12-t2",
        title: l("نوع المفصل", "Joint type"),
        items: [
          { id: "i1", prompt: l("بين عظام الجمجمة", "Between skull bones"), answer: "fibrous" },
          {
            id: "i2",
            prompt: l("بين أجسام الفقرات", "Between vertebral bodies"),
            answer: "cartilaginous",
          },
          {
            id: "i3",
            prompt: l("معظمه لا يسمح بالحركة", "Mostly allows no movement"),
            answer: "fibrous",
          },
          {
            id: "i4",
            prompt: l("حركة محدودة جداً", "Very limited movement"),
            answer: "cartilaginous",
          },
          {
            id: "i5",
            prompt: l("معظم مفاصل الجسم وفيه سائل زلالي", "Most body joints, with synovial fluid"),
            answer: "synovial",
          },
        ],
        options: [
          { id: "fibrous", label: l("ليفي", "Fibrous") },
          { id: "cartilaginous", label: l("غضروفي", "Cartilaginous") },
          { id: "synovial", label: l("زلالي", "Synovial") },
        ],
        why: l(
          "الليفي: الجمجمة ومعظمه لا يتحرك. الغضروفي: بين أجسام الفقرات وحركة محدودة جداً. الزلالي: معظم مفاصل الجسم.",
          "Fibrous: skull, mostly immovable. Cartilaginous: between vertebral bodies, very limited. Synovial: most body joints.",
        ),
      },
      {
        kind: "match",
        id: "b12-t3",
        title: l("المفاصل الزلالية: محدودة ولا واسعة؟", "Synovial joints: limited or wide-range?"),
        items: [
          { id: "i1", prompt: l("مفصل الكوع", "Elbow joint"), answer: "limited" },
          { id: "i2", prompt: l("مفصل الركبة", "Knee joint"), answer: "limited" },
          { id: "i3", prompt: l("مفصل الكتف", "Shoulder joint"), answer: "wide" },
          { id: "i4", prompt: l("مفصل الفخذ", "Hip joint"), answer: "wide" },
        ],
        options: [
          { id: "limited", label: l("محدود الحركة (اتجاه واحد)", "Limited (one direction)") },
          {
            id: "wide",
            label: l("واسع الحركة (اتجاهات مختلفة)", "Wide-range (many directions)"),
          },
        ],
        why: l(
          "الكوع والركبة محدودا الحركة في اتجاه واحد، والكتف والفخذ واسعا الحركة في اتجاهات مختلفة.",
          "Elbow and knee are limited to one direction; shoulder and hip move in different directions.",
        ),
      },
    ],
    feynmanCheck: {
      prompt: l(
        "اشرح لي كأني صاحبك: أنواع المفاصل التلاتة وأمثلة عليها.",
        "Explain to me like I'm your friend: the three joint types with an example of each.",
      ),
      keywords: [
        {
          id: "fibrous",
          label: l("ليفي: الجمجمة لا يتحرك", "Fibrous: skull, no movement"),
          match: ["ليفي", "الليفية", "fibrous", "الجمجمة", "skull"],
        },
        {
          id: "age",
          label: l("الليفي يتحول لعظمي مع العمر", "Fibrous becomes bony with age"),
          match: ["العمر", "عظمي", "age", "bony"],
        },
        {
          id: "cart",
          label: l("غضروفي: بين الفقرات حركة محدودة جداً", "Cartilaginous: vertebrae, very limited"),
          match: ["غضروفي", "الغضروفية", "cartilaginous", "الفقرات", "vertebra"],
        },
        {
          id: "syn",
          label: l("زلالي: معظم المفاصل", "Synovial: most joints"),
          match: ["زلالي", "الزلالية", "synovial"],
        },
        {
          id: "fluid",
          label: l("سائل زلالي وغضروف أملس", "Synovial fluid and smooth cartilage"),
          match: ["سائل", "fluid", "أملس", "smooth"],
        },
        {
          id: "limited",
          label: l("الكوع والركبة محدودة", "Elbow and knee limited"),
          match: ["الكوع", "الركبة", "elbow", "knee", "محدود"],
        },
        {
          id: "wide",
          label: l("الكتف والفخذ واسعة", "Shoulder and hip wide"),
          match: ["الكتف", "الفخذ", "shoulder", "hip", "واسع"],
        },
      ],
      model: l(
        "المفاصل تلات أنواع حسب النسيج اللي بين العظام. الليفي زي الجمجمة معظمه ما بيتحركش وبيتحول لعظمي مع العمر. الغضروفي زي اللي بين الفقرات حركته محدودة جداً. والزلالي معظم مفاصل الجسم بسائل زلالي وغضروف أملس: الكوع والركبة محدودة الحركة والكتف والفخذ واسعة.",
        "There are three joint types by the tissue between the bones. Fibrous (skull) mostly does not move and turns bony with age. Cartilaginous (between vertebrae) allows very limited movement. Synovial is most body joints, with synovial fluid and smooth cartilage: elbow and knee are limited, shoulder and hip wide-ranging.",
      ),
    },
    microQuiz: [
      {
        id: "b12-q1",
        block: 12,
        prompt: l(
          "إيه فايدة السائل الزلالي في المفصل؟",
          "What is the benefit of synovial fluid in a joint?",
        ),
        options: [
          o("بيلحم العظام ببعضها", "It fuses the bones together"),
          o(
            "بيسهل انزلاق الغضاريف اللي تكسو أطراف العظام",
            "It helps the cartilage covering bone ends slide",
          ),
          o("بيغذي العضلات", "It feeds the muscles"),
          o("بيحدد الحركة في اتجاه واحد", "It restricts movement to one direction"),
        ],
        correct: 1,
        explain: l(
          "السائل الزلالي يسهل انزلاق الغضاريف التي تكسو أطراف العظام. أما تحديد الحركة فمن شغل الأربطة.",
          "Synovial fluid helps the cartilages covering the bone ends slide. Limiting movement is the job of ligaments.",
        ),
      },
      {
        id: "b12-q2",
        block: 12,
        prompt: l("أي مفصل من دول واسع الحركة؟", "Which of these is a wide-range joint?"),
        options: [
          o("الكوع", "Elbow"),
          o("الركبة", "Knee"),
          o("الفخذ", "Hip"),
          o("مفاصل الجمجمة", "Skull joints"),
        ],
        correct: 2,
        explain: l(
          "واسعة الحركة: مفصل الكتف ومفصل الفخذ. أما الكوع والركبة فمحدودا الحركة.",
          "Wide-range: shoulder and hip. The elbow and knee are limited.",
        ),
      },
      {
        id: "b12-q3",
        block: 12,
        prompt: l(
          "إيه اللي بيحصل للنسيج الليفي في المفاصل الليفية مع تقدم العمر؟",
          "What happens to the fibrous tissue of fibrous joints with age?",
        ),
        options: [
          o("بيتحول لنسيج غضروفي", "It turns into cartilaginous tissue"),
          o("بيتحول لنسيج عظمي", "It turns into bony tissue"),
          o("بيفضل زي ما هو", "It stays as it is"),
          o("بيتحول لسائل زلالي", "It turns into synovial fluid"),
        ],
        correct: 1,
        explain: l(
          "الأنسجة الليفية تتحول مع تقدم العمر إلى أنسجة عظمية.",
          "Fibrous tissues turn into bony tissue with age.",
        ),
      },
    ],
  },

  /* ----------------------------------- 13 ----------------------------------- */
  {
    n: 13,
    emoji: "🧵",
    titleEn: "Ligaments",
    hookQuestion: {
      question: l(
        "كام رباط بيمسك عظمة الفخذ بعظمة القصبة في الركبة؟",
        "How many ligaments hold the femur to the tibia in the knee?",
      ),
      options: [
        l("رباط واحد", "One ligament"),
        l("3 أربطة", "Three ligaments"),
        l("4 أربطة", "Four ligaments"),
      ],
      correct: 1,
      reveal: l(
        "3 أربطة: الوسطي والصليبي الأمامي والصليبي الخلفي. أما الشظية فمربوطة بالفخذ بالرباط الجانبي فقط.",
        "Three: medial, anterior cruciate and posterior cruciate. The fibula is tied to the femur by the lateral ligament only.",
      ),
    },
    simpleExplanation: {
      paragraphs: [
        l(
          "الأربطة حزم منفصلة من نسيج ضام ليفي، أطرافها مثبتة على عظمتي المفصل.",
          "Ligaments are separate bundles of fibrous connective tissue with their ends fixed to the two bones of a joint.",
        ),
        l(
          "أليافها قوية جداً ومعاها مرونة بسيطة تزيد طولها شوية عشان ما تتقطعش لو المفصل اتعرض لضغط خارجي.",
          "Their fibres are very strong with a little flexibility that lets them lengthen slightly so they don't break under external pressure.",
        ),
        l(
          "وظيفتها: ربط العظام ببعضها عند المفاصل وتحديد حركة العظام في الاتجاهات المختلفة.",
          "Their job: tie bones together at joints and limit bone movement in different directions.",
        ),
        l(
          "في الركبة 4 أربطة: صليبي أمامي وصليبي خلفي ووسطي وجانبي.",
          "The knee has 4 ligaments: anterior cruciate, posterior cruciate, medial and lateral.",
        ),
      ],
      imagine: l(
        "تخيل حبال مطاطة قوية مربوطة بين عظمتين: بتسمح بحركة بس بتمنع المفصل يتفكك (تشبيه).",
        "Imagine strong stretchy ropes tied between two bones: they allow some movement but stop the joint falling apart (an analogy).",
      ),
      examples: [
        l(
          "عند التواء الركبة ممكن يتمزق الرباط الصليبي.",
          "When the knee is twisted the cruciate ligament may tear.",
        ),
        l(
          "الفخذ مربوط بالقصبة بـ3 أربطة وبالشظية بالرباط الجانبي فقط.",
          "The femur is tied to the tibia by 3 ligaments and to the fibula by the lateral ligament only.",
        ),
      ],
      terms: [
        { ar: "الأربطة", en: "Ligaments" },
        { ar: "رباط صليبي أمامي", en: "Anterior cruciate ligament" },
        { ar: "رباط صليبي خلفي", en: "Posterior cruciate ligament" },
        { ar: "رباط وسطي", en: "Medial ligament" },
        { ar: "رباط جانبي", en: "Lateral ligament" },
      ],
    },
    examTrap: {
      claim: l(
        "«الفخذ مربوط بالقصبة والشظية بنفس الأربطة، والرباط ممكن يوصل عضلة بعظمة».",
        "“The femur is tied to both tibia and fibula by the same ligaments, and a ligament can join muscle to bone.”",
      ),
      truth: l(
        "الفخذ يرتبط بالقصبة بثلاثة أربطة (الوسطي - الصليبي الأمامي - الصليبي الخلفي) وبالشظية بالرباط الجانبي فقط. والأربطة تربط العظام ببعضها.",
        "The femur is tied to the tibia by three ligaments (medial, anterior cruciate, posterior cruciate) and to the fibula by the lateral ligament only. Ligaments join bone to bone.",
      ),
      probes: [
        {
          id: "b13-p1",
          label: l("عدّ أربطة الفخذ–القصبة", "Count femur–tibia ligaments"),
          result: l(
            "3 أربطة: الوسطي + الصليبي الأمامي + الصليبي الخلفي.",
            "3 ligaments: medial + anterior cruciate + posterior cruciate.",
          ),
          verdict: "bad",
          highlight: ["femur", "tibia", "acl", "pcl", "medial-ligament"],
        },
        {
          id: "b13-p2",
          label: l("عدّ أربطة الفخذ–الشظية", "Count femur–fibula ligaments"),
          result: l("الرباط الجانبي فقط.", "The lateral ligament only."),
          verdict: "ok",
          highlight: ["femur", "fibula", "lateral-ligament"],
        },
        {
          id: "b13-p3",
          label: l("رباط ولا وتر؟", "Ligament or tendon?"),
          result: l(
            "الرباط يربط عظمة بعظمة. الوتر يربط عضلة بعظمة.",
            "A ligament ties bone to bone. A tendon ties muscle to bone.",
          ),
          verdict: "info",
        },
      ],
    },
    tasks: [
      {
        kind: "label",
        id: "b13-t1",
        figure: "knee",
        title: l("سمّي أربطة الركبة", "Name the knee ligaments"),
        parts: ["acl", "pcl", "medial-ligament", "lateral-ligament", "patella", "fibula"],
      },
      {
        kind: "match",
        id: "b13-t2",
        title: l("الرباط بيربط إيه بإيه؟", "What does each ligament tie?"),
        items: [
          { id: "i1", prompt: l("الرباط الوسطي", "Medial ligament"), answer: "tibia" },
          {
            id: "i2",
            prompt: l("الرباط الصليبي الأمامي", "Anterior cruciate ligament"),
            answer: "tibia",
          },
          {
            id: "i3",
            prompt: l("الرباط الصليبي الخلفي", "Posterior cruciate ligament"),
            answer: "tibia",
          },
          { id: "i4", prompt: l("الرباط الجانبي", "Lateral ligament"), answer: "fibula" },
        ],
        options: [
          { id: "tibia", label: l("الفخذ بالقصبة", "Femur to tibia") },
          { id: "fibula", label: l("الفخذ بالشظية", "Femur to fibula") },
        ],
        why: l(
          "الفخذ والقصبة بثلاثة أربطة (الوسطي والصليبيان)، والفخذ والشظية بالرباط الجانبي فقط.",
          "Femur–tibia: three ligaments (medial and the two cruciate); femur–fibula: the lateral ligament only.",
        ),
      },
      {
        kind: "pick",
        id: "b13-t3",
        prompt: l(
          "أي رباط هو الوحيد اللي بيربط الفخذ بالشظية؟",
          "Which ligament is the only one tying the femur to the fibula?",
        ),
        options: ["lateral-ligament", "medial-ligament", "acl", "pcl"],
        answer: "lateral-ligament",
        why: l(
          "الفخذ يرتبط بالشظية بالرباط الجانبي فقط.",
          "The femur is tied to the fibula by the lateral ligament only.",
        ),
        wrongWhy: {
          "medial-ligament": l(
            "الرباط الوسطي من الأربطة التلاتة اللي بتربط الفخذ بالقصبة.",
            "The medial ligament is one of the three that tie the femur to the tibia.",
          ),
          acl: l(
            "الصليبي الأمامي يربط الفخذ بالقصبة، مش بالشظية.",
            "The anterior cruciate ligament ties the femur to the tibia, not the fibula.",
          ),
          pcl: l(
            "الصليبي الخلفي يربط الفخذ بالقصبة، مش بالشظية.",
            "The posterior cruciate ligament ties the femur to the tibia, not the fibula.",
          ),
        },
      },
      {
        kind: "numeric",
        id: "b13-t4",
        prompt: l(
          "كام رباط بيربط عظمة الفخذ بعظمة القصبة؟",
          "How many ligaments tie the femur to the tibia?",
        ),
        answer: 3,
        unit: l("أربطة", "ligaments"),
        why: l(
          "ثلاثة: الوسطي والصليبي الأمامي والصليبي الخلفي.",
          "Three: medial, anterior cruciate and posterior cruciate.",
        ),
      },
    ],
    feynmanCheck: {
      prompt: l(
        "اشرح لي كأني صاحبك: الأربطة بتعمل إيه، وإزاي بتربط الركبة؟",
        "Explain to me like I'm your friend: what do ligaments do, and how do they tie the knee?",
      ),
      keywords: [
        {
          id: "bonebone",
          label: l("تربط العظام ببعضها", "Tie bone to bone"),
          match: ["العظام ببعض", "عظمة بعظمة", "bone to bone", "bones together"],
        },
        {
          id: "fibrous",
          label: l("نسيج ضام ليفي", "Fibrous connective tissue"),
          match: ["ضام", "ليفي", "connective", "fibrous"],
        },
        {
          id: "elastic",
          label: l("قوية ومرنة", "Strong and slightly elastic"),
          match: ["مرون", "قوي", "متان", "elastic", "strong"],
        },
        {
          id: "limit",
          label: l("تحدد الحركة", "Limit movement"),
          match: ["تحدد", "limit", "تحديد"],
        },
        {
          id: "three",
          label: l("الفخذ–القصبة 3 أربطة", "Femur–tibia: 3"),
          match: ["ثلاث", "3", "three", "القصبة", "tibia"],
        },
        {
          id: "lateral",
          label: l("الفخذ–الشظية الجانبي فقط", "Femur–fibula: lateral only"),
          match: ["الجانبي", "lateral", "الشظية", "fibula"],
        },
        {
          id: "cruciate",
          label: l("الصليبيان والوسطي", "Cruciates and medial"),
          match: ["صليبي", "cruciate", "وسطي", "medial"],
        },
      ],
      model: l(
        "الأربطة حزم من نسيج ضام ليفي قوي ومرن شوية، بتربط العظام ببعضها عند المفاصل وتحدد حركتها. في الركبة الفخذ مربوط بالقصبة بـ3 أربطة (الوسطي والصليبي الأمامي والصليبي الخلفي) وبالشظية بالرباط الجانبي بس.",
        "Ligaments are strong, slightly elastic bundles of fibrous connective tissue that tie bones together at joints and limit their movement. In the knee the femur is tied to the tibia by 3 ligaments (medial, anterior cruciate, posterior cruciate) and to the fibula by the lateral ligament only.",
      ),
    },
    microQuiz: [
      {
        id: "b13-q1",
        block: 13,
        prompt: l(
          "إيه ميزة المرونة البسيطة في ألياف الأربطة؟",
          "What is the benefit of the slight elasticity in ligament fibres?",
        ),
        options: [
          o(
            "تزيد طولها قليلاً فلا تنقطع عند الضغط الخارجي",
            "They lengthen slightly so they don't break under external pressure",
          ),
          o("تسمح للمفصل بحرية حركة كاملة", "They give the joint completely free movement"),
          o("تربط العضلات بالعظام", "They join muscles to bones"),
          o("تنتج السائل الزلالي", "They produce synovial fluid"),
        ],
        correct: 0,
        explain: l(
          "ألياف الأربطة قوية وفيها مرونة تسمح بزيادة طولها قليلاً حتى لا تنقطع عند تعرض المفصل لضغط خارجي.",
          "Ligament fibres are strong with some elasticity allowing slight lengthening so they don't tear when the joint is under external pressure.",
        ),
      },
      {
        id: "b13-q2",
        block: 13,
        prompt: l(
          "الرباط الجانبي في الركبة بيربط الفخذ بـ:",
          "The lateral ligament of the knee ties the femur to:",
        ),
        options: [
          o("القصبة", "Tibia"),
          o("الشظية", "Fibula"),
          o("الرضفة", "Patella"),
          o("العجز", "Sacrum"),
        ],
        correct: 1,
        explain: l(
          "الفخذ يرتبط بالشظية بالرباط الجانبي فقط، وبالقصبة بثلاثة أربطة.",
          "The femur is tied to the fibula by the lateral ligament only, and to the tibia by three ligaments.",
        ),
        visual: { figure: "knee", mark: "lateral-ligament" },
      },
      {
        id: "b13-q3",
        block: 13,
        prompt: l(
          "أي رباط ممكن يتمزق عند التواء الركبة؟",
          "Which ligament may tear when the knee is twisted?",
        ),
        options: [
          o("الرباط الصليبي", "The cruciate ligament"),
          o("وتر أخيل", "The Achilles tendon"),
          o("رباط الجمجمة", "A skull ligament"),
          o("الارتفاق العاني", "The pubic symphysis"),
        ],
        correct: 0,
        explain: l(
          "قد يحدث تمزق للأربطة عند التواء بعض المفاصل كما في الرباط الصليبي في مفصل الركبة.",
          "Ligaments may tear when some joints are twisted, as with the cruciate ligament in the knee.",
        ),
      },
    ],
  },

  /* ----------------------------------- 14 ----------------------------------- */
  {
    n: 14,
    emoji: "🏃",
    titleEn: "Tendons and Achilles Tendon Rupture",
    hookQuestion: {
      question: l(
        "وتر أخيل بيوصل العضلة التوأمية (عضلة بطن الساق) بإيه؟",
        "The Achilles tendon joins the gastrocnemius (calf muscle) to what?",
      ),
      options: [
        l("عظمة القصبة", "The tibia"),
        l("عظمة الكعب", "The heel bone"),
        l("عظمة الشظية", "The fibula"),
      ],
      correct: 1,
      reveal: l(
        "وتر أخيل يصل العضلة التوأمية بعظمة الكعب، فيساعد على حركة كعب القدم.",
        "The Achilles tendon joins the gastrocnemius to the heel bone, helping the heel move.",
      ),
    },
    simpleExplanation: {
      paragraphs: [
        l(
          "الوتر نسيج ضام قوي. وظيفته يربط العضلات بالعظام عند المفاصل، فتتحرك العظام لما العضلة تنقبض وتنبسط.",
          "A tendon is strong connective tissue. It joins muscles to bones at joints so the bones move when muscles contract and relax.",
        ),
        l(
          "مثاله وتر أخيل: بيوصل العضلة التوأمية بعظمة الكعب، وده بيساعد على حركة كعب القدم.",
          "Example: the Achilles tendon joins the gastrocnemius to the heel bone, helping the heel move.",
        ),
        l(
          "تمزق وتر أخيل أسبابه: مجهود عنيف، تقلص مفاجئ للعضلة التوأمية، وانعدام مرونتها.",
          "Causes of Achilles rupture: violent effort, sudden contraction of the gastrocnemius, and its lack of flexibility.",
        ),
        l(
          "أعراضه التلاتة: عدم القدرة على المشي، تورم في مكان الإصابة، وآلام حادة.",
          "Its three symptoms: inability to walk, swelling at the injury site, and severe pain.",
        ),
      ],
      imagine: l(
        "تخيل حبل سميك بيشد من عضلة الساق لحد الكعب: لو اتشد فجأة وهو متيبس ممكن يتقطع (تشبيه).",
        "Imagine a thick rope pulling from the calf muscle to the heel: yanked suddenly while stiff, it can snap (an analogy).",
      ),
      examples: [
        l(
          "علاج التمزق: أدوية مضادة للالتهابات ومسكنة، وجبيرة طبية.",
          "Treatment: anti-inflammatory and analgesic drugs, and a medical splint.",
        ),
        l("لو التمزق كامل بيلزم تدخل جراحي.", "If the tear is complete, surgery is needed."),
      ],
      terms: [
        { ar: "الأوتار", en: "Tendons" },
        { ar: "وتر أخيل", en: "Achilles tendon" },
        { ar: "العضلة التوأمية", en: "Gastrocnemius" },
        { ar: "عظمة الكعب", en: "Heel bone" },
        { ar: "جبيرة طبية", en: "Medical splint" },
      ],
    },
    examTrap: {
      claim: l(
        "«وتر أخيل بيوصل العضلة بعظمة القصبة، والوتر والرباط زي بعض».",
        "“The Achilles tendon joins the muscle to the tibia, and tendons and ligaments are the same.”",
      ),
      truth: l(
        "وتر أخيل يصل العضلة التوأمية بعظمة الكعب. الأوتار تربط العضلات بالعظام، أما الأربطة فتربط العظام ببعضها.",
        "The Achilles tendon joins the gastrocnemius to the heel bone. Tendons join muscles to bones, while ligaments join bones to bones.",
      ),
      probes: [
        {
          id: "b14-p1",
          label: l("وصّل وتر أخيل بالقصبة", "Join the Achilles tendon to the tibia"),
          result: l(
            "لأ: وتر أخيل ما بيوصلش للقصبة، بيوصل لعظمة الكعب.",
            "No: the Achilles tendon does not reach the tibia; it reaches the heel bone.",
          ),
          verdict: "bad",
          highlight: ["calcaneal-tendon", "tibia"],
        },
        {
          id: "b14-p2",
          label: l("وصّل العضلة التوأمية بالكعب", "Join the gastrocnemius to the heel"),
          result: l(
            "أيوه: وتر أخيل بيربط العضلة التوأمية بعظمة الكعب.",
            "Yes: the Achilles tendon joins the gastrocnemius to the heel bone.",
          ),
          verdict: "ok",
          highlight: ["gastrocnemius", "calcaneal-tendon", "calcaneus"],
        },
        {
          id: "b14-p3",
          label: l("وتر ولا رباط؟", "Tendon or ligament?"),
          result: l(
            "الوتر: عضلة بعظمة. الرباط: عظمة بعظمة.",
            "Tendon: muscle to bone. Ligament: bone to bone.",
          ),
          verdict: "info",
        },
      ],
    },
    tasks: [
      {
        kind: "label",
        id: "b14-t1",
        figure: "achilles",
        title: l("سمّي أجزاء وتر أخيل", "Name the Achilles tendon parts"),
        parts: ["gastrocnemius", "achilles-tendon", "calcaneus"],
      },
      {
        kind: "pick",
        id: "b14-t2",
        prompt: l(
          "وتر أخيل بيوصل العضلة التوأمية بأنهي عظمة؟",
          "Which bone does the Achilles tendon join to the gastrocnemius?",
        ),
        options: ["calcaneus", "tibia", "fibula", "femur"],
        answer: "calcaneus",
        why: l(
          "وتر أخيل يصل العضلة التوأمية بعظمة الكعب مما يساعد على حركة كعب القدم.",
          "The Achilles tendon joins the gastrocnemius to the heel bone, helping the heel move.",
        ),
        wrongWhy: {
          tibia: l(
            "القصبة عظمة الساق الداخلية؛ وتر أخيل بيوصل لعظمة الكعب.",
            "The tibia is the inner shank bone; the Achilles tendon reaches the heel bone.",
          ),
          fibula: l(
            "الشظية عظمة الساق الخارجية؛ وتر أخيل بيوصل لعظمة الكعب.",
            "The fibula is the outer shank bone; the Achilles tendon reaches the heel bone.",
          ),
          femur: l(
            "الفخذ فوق الركبة، بعيد عن وتر أخيل.",
            "The femur is above the knee, far from the Achilles tendon.",
          ),
        },
      },
      {
        kind: "match",
        id: "b14-t3",
        title: l(
          "تمزق وتر أخيل: سبب ولا عرض ولا علاج؟",
          "Achilles rupture: cause, symptom or treatment?",
        ),
        items: [
          { id: "i1", prompt: l("بذل مجهود عنيف", "Violent effort"), answer: "cause" },
          {
            id: "i2",
            prompt: l("تقلص العضلة التوأمية بشكل مفاجئ", "Sudden contraction of the gastrocnemius"),
            answer: "cause",
          },
          {
            id: "i3",
            prompt: l("انعدام المرونة في العضلة التوأمية", "No flexibility in the gastrocnemius"),
            answer: "cause",
          },
          { id: "i4", prompt: l("عدم القدرة على المشي", "Inability to walk"), answer: "symptom" },
          {
            id: "i5",
            prompt: l("تورم في منطقة الإصابة", "Swelling at the injury"),
            answer: "symptom",
          },
          { id: "i6", prompt: l("آلام حادة", "Severe pain"), answer: "symptom" },
          {
            id: "i7",
            prompt: l("أدوية مضادة للالتهابات ومسكنة", "Anti-inflammatory and analgesic drugs"),
            answer: "treatment",
          },
          { id: "i8", prompt: l("جبيرة طبية", "Medical splint"), answer: "treatment" },
          {
            id: "i9",
            prompt: l("جراحة إذا كان التمزق كاملاً", "Surgery if the tear is complete"),
            answer: "treatment",
          },
        ],
        options: [
          { id: "cause", label: l("سبب", "Cause") },
          { id: "symptom", label: l("عرض", "Symptom") },
          { id: "treatment", label: l("علاج", "Treatment") },
        ],
        why: l(
          "الأسباب: مجهود عنيف وتقلص مفاجئ وانعدام مرونة. الأعراض: عدم المشي وتورم وآلام حادة. العلاج: أدوية وجبيرة وجراحة للتمزق الكامل.",
          "Causes: violent effort, sudden contraction, no flexibility. Symptoms: cannot walk, swelling, severe pain. Treatment: drugs, splint, surgery if complete.",
        ),
      },
    ],
    feynmanCheck: {
      prompt: l(
        "اشرح لي كأني صاحبك: الوتر إيه، ووتر أخيل بيوصل إيه بإيه، وإيه حكاية تمزقه؟",
        "Explain to me like I'm your friend: what is a tendon, what does the Achilles tendon join, and what about its rupture?",
      ),
      keywords: [
        {
          id: "musclebone",
          label: l("الوتر يربط العضلة بالعظمة", "Tendon joins muscle to bone"),
          match: ["العضلات بالعظام", "عضلة بعظمة", "muscle to bone", "muscles to bones"],
        },
        {
          id: "gastro",
          label: l("العضلة التوأمية", "Gastrocnemius"),
          match: ["التوأمية", "توأمية", "gastrocnemius", "calf"],
        },
        { id: "heel", label: l("عظمة الكعب", "Heel bone"), match: ["الكعب", "heel", "calcaneus"] },
        {
          id: "causes",
          label: l(
            "أسباب: مجهود عنيف وتقلص مفاجئ وانعدام مرونة",
            "Causes: violent effort, sudden contraction, no flexibility",
          ),
          match: ["مجهود", "مفاجئ", "مرونة", "effort", "sudden", "flexib"],
        },
        {
          id: "symptoms",
          label: l("أعراض: لا مشي وتورم وألم حاد", "Symptoms: no walking, swelling, severe pain"),
          match: ["تورم", "swelling", "ألم", "آلام", "pain", "المشي", "walk"],
        },
        {
          id: "treat",
          label: l("علاج: أدوية وجبيرة وجراحة", "Treatment: drugs, splint, surgery"),
          match: ["جبيرة", "splint", "جراح", "surgery", "أدوية", "drug"],
        },
      ],
      model: l(
        "الوتر نسيج ضام قوي بيربط العضلة بالعظمة. وتر أخيل بيوصل العضلة التوأمية بعظمة الكعب. بيتمزق من مجهود عنيف أو تقلص مفاجئ أو انعدام مرونة، وأعراضه عدم المشي وتورم وآلام حادة، وعلاجه أدوية مضادة للالتهاب ومسكنة وجبيرة، وجراحة لو التمزق كامل.",
        "A tendon is strong connective tissue joining muscle to bone. The Achilles tendon joins the gastrocnemius to the heel bone. It tears from violent effort, sudden contraction or no flexibility; symptoms are inability to walk, swelling and severe pain; treatment is anti-inflammatory/analgesic drugs and a splint, with surgery if the tear is complete.",
      ),
    },
    microQuiz: [
      {
        id: "b14-q1",
        block: 14,
        prompt: l(
          "إيه علاج التمزق الكامل لوتر أخيل؟",
          "What is the treatment for a complete Achilles tendon tear?",
        ),
        options: [
          o("أدوية مسكنة فقط", "Painkillers only"),
          o("جبيرة طبية فقط", "A medical splint only"),
          o("التدخل الجراحي", "Surgery"),
          o("لا يحتاج علاج", "No treatment needed"),
        ],
        correct: 2,
        explain: l(
          "العلاج: أدوية مضادة للالتهابات ومسكنة وجبيرة، والتدخل الجراحي في حالة التمزق الكامل.",
          "Treatment: anti-inflammatory and analgesic drugs and a splint; surgery if the tear is complete.",
        ),
      },
      {
        id: "b14-q2",
        block: 14,
        prompt: l(
          "أي من دول سبب لتمزق وتر أخيل؟",
          "Which of these is a cause of Achilles tendon rupture?",
        ),
        options: [
          o("انعدام المرونة في العضلة التوأمية", "No flexibility in the gastrocnemius"),
          o("زيادة السائل الزلالي", "Too much synovial fluid"),
          o("التحام عظام الجمجمة", "Fusion of skull bones"),
          o("نقص الغضاريف في الأنف", "Lack of cartilage in the nose"),
        ],
        correct: 0,
        explain: l(
          "الأسباب: بذل مجهود عنيف، تقلص العضلة التوأمية بشكل مفاجئ، وانعدام المرونة فيها.",
          "Causes: violent effort, sudden contraction of the gastrocnemius, and its lack of flexibility.",
        ),
        visual: { figure: "achilles", mark: "gastrocnemius" },
      },
      {
        id: "b14-q3",
        block: 14,
        prompt: l("الأوتار بتربط إيه بإيه؟", "What do tendons connect?"),
        options: [
          o("عظمة بعظمة", "Bone to bone"),
          o("عضلة بعظمة", "Muscle to bone"),
          o("غضروف بجلد", "Cartilage to skin"),
          o("عضلة بعضلة", "Muscle to muscle"),
        ],
        correct: 1,
        explain: l(
          "الأوتار تربط العضلات بالعظام عند المفاصل فتسمح بالحركة، أما الأربطة فتربط العظام ببعضها.",
          "Tendons join muscles to bones at joints, allowing movement; ligaments join bones to each other.",
        ),
      },
    ],
  },
];
