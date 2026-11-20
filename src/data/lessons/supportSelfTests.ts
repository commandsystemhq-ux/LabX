import type { SelfTest } from "./supportTypes";

const L = (ar: string, en: string) => ({ ar, en });
const o = (ar: string, en: string) => ({ text: L(ar, en) });

export const selfTests: SelfTest[] = [
  {
    n: 1,
    title: L(
      "اختبر نفسك (1): الأنسجة النباتية ومواد الدعامة",
      "Test yourself (1): Plant tissues and support materials",
    ),
    covers: L(
      "البارانشيمي والكولنشيمي والإسكرلنشيمي، والسيليلوز واللجنين والكيوتين.",
      "Parenchyma, collenchyma, sclerenchyma; cellulose, lignin and cutin.",
    ),
    blocks: [1, 2],
    questions: [
      {
        id: "t1-q1",
        block: 1,
        prompt: L(
          "الجزء النابض في الرسم هو النسيج الكولنشيمي. بأي مادة تتغلظ جدر خلاياه تغليظاً غير منتظم؟",
          "The pulsing part in the drawing is collenchyma. Which material unevenly thickens its cell walls?",
        ),
        options: [
          o("اللجنين", "Lignin"),
          o("السيليلوز", "Cellulose"),
          o("الكيوتين", "Cutin"),
          o("السيوبرين", "Suberin"),
        ],
        correct: 1,
        explain: L(
          "النسيج الكولنشيمي نسيج حي خلاياه ذات جدر مغلظة تغليظاً غير منتظم بمادة السيليلوز.",
          "Collenchyma is a living tissue whose cell walls are unevenly thickened with cellulose.",
        ),
        visual: { figure: "stem-section", mark: "collenchyma" },
      },
      {
        id: "t1-q2",
        block: 1,
        prompt: L(
          "الجزء النابض في الرسم هو النسيج الإسكرلنشيمي. ما مادة تغليظ جدره، وهل خلاياه حية؟",
          "The pulsing part in the drawing is sclerenchyma. What thickens its walls, and are its cells living?",
        ),
        options: [
          o("اللجنين - خلاياه غير حية", "Lignin - non-living cells"),
          o("اللجنين - خلاياه حية", "Lignin - living cells"),
          o("السيليلوز - خلاياه غير حية", "Cellulose - non-living cells"),
          o("السيليلوز - خلاياه حية", "Cellulose - living cells"),
        ],
        correct: 0,
        explain: L(
          "النسيج الإسكرلنشيمي نسيج غير حي خلاياه ذات جدر مغلظة بمادة اللجنين.",
          "Sclerenchyma is a non-living tissue whose cell walls are thickened with lignin.",
        ),
        visual: { figure: "tissues", mark: "sclerenchyma" },
      },
      {
        id: "t1-q3",
        block: 2,
        prompt: L(
          "الطبقة النابضة هي بشرة الساق من الخارج. ما المادة التي تترسب على جدرها وتجعلها غير منفذة للماء؟",
          "The pulsing layer is the outer epidermis of the stem. Which material is deposited on its walls and makes it impermeable to water?",
        ),
        options: [o("الكيوتين", "Cutin"), o("السيليلوز", "Cellulose"), o("اللجنين", "Lignin")],
        correct: 0,
        explain: L(
          "يترسب الكيوتين (مادة غير منفذة للماء) على جدر خلايا البشرة من الخارج فيمنع نفاذ الماء منها.",
          "Cutin, a water-impermeable material, is deposited on the outside of the epidermal cell walls and prevents water loss.",
        ),
        visual: { figure: "stem-section", mark: "cutin" },
      },
      {
        id: "t1-q4",
        block: 2,
        prompt: L(
          "أي المواد التالية منفذة للماء؟",
          "Which of the following materials is permeable to water?",
        ),
        options: [
          o("السيليلوز", "Cellulose"),
          o("اللجنين", "Lignin"),
          o("الكيوتين", "Cutin"),
          o("السيوبرين", "Suberin"),
        ],
        correct: 0,
        explain: L(
          "السيليلوز منفذ للماء، أما اللجنين والكيوتين والسيوبرين فغير منفذة للماء.",
          "Cellulose is permeable to water, while lignin, cutin and suberin are not.",
        ),
      },
      {
        id: "t1-q5",
        block: 1,
        prompt: L(
          "النسيج النابض في الرسم خلاياه حية ذات جدر رقيقة مرنة. ما اسمه، وما الذي يوجد بين خلاياه؟",
          "The pulsing tissue has living cells with thin flexible walls. What is it, and what lies between its cells?",
        ),
        options: [
          o("بارانشيمي - مسافات بينية", "Parenchyma - intercellular spaces"),
          o("كولنشيمي - مسافات بينية", "Collenchyma - intercellular spaces"),
          o("إسكرلنشيمي - مسافات بينية", "Sclerenchyma - intercellular spaces"),
          o("بارانشيمي - جدر من اللجنين", "Parenchyma - lignin walls"),
        ],
        correct: 0,
        explain: L(
          "النسيج البارانشيمي نسيج حي خلاياه ذات جدر سيليلوزية رقيقة ومرنة بينها مسافات بينية.",
          "Parenchyma is a living tissue with thin, flexible cellulose walls and intercellular spaces between its cells.",
        ),
        visual: { figure: "tissues", mark: "parenchyma" },
      },
      {
        id: "t1-q6",
        block: 2,
        prompt: L(
          "أي النسيجين التاليين يدعمه اللجنين، وخلاياه غير حية؟",
          "Which tissue is supported by lignin and has non-living cells?",
        ),
        options: [
          o("الكولنشيمي", "Collenchyma"),
          o("البارانشيمي", "Parenchyma"),
          o("الإسكرلنشيمي", "Sclerenchyma"),
        ],
        correct: 2,
        explain: L(
          "اللجنين يكسب جدار الخلية القوة والصلابة، ويدعم النسيج الإسكرلنشيمي (خلايا غير حية) وأوعية وقصيبات الخشب.",
          "Lignin gives the cell wall strength and rigidity; it supports sclerenchyma (non-living cells) and xylem vessels and tracheids.",
        ),
      },
    ],
  },
  {
    n: 2,
    title: L("اختبر نفسك (2): الفقرات والضلوع", "Test yourself (2): Vertebrae and ribs"),
    covers: L(
      "الفقرة الصدرية واتصال الضلع بها، والفقرة العنقية الأولى، وضلوع القفص الصدري.",
      "The thoracic vertebra and rib attachment, the first cervical vertebra, and the ribs of the thoracic cage.",
    ),
    blocks: [5, 6, 8],
    questions: [
      {
        id: "t2-q1",
        block: 8,
        prompt: L(
          "الجزء النابض في الرسم هو النتوء المستعرض. الضلع يتصل من الخلف بأي جزأين من الفقرة؟",
          "The pulsing part is the transverse process. A rib attaches from behind to which two parts of the vertebra?",
        ),
        options: [
          o("جسم الفقرة ونتوئها المستعرض", "The vertebral body and its transverse process"),
          o("النتوء الشوكي والحلقة الشوكية", "The spinous process and the neural ring"),
          o("النتوءان المفصليان العلوي والسفلي", "The superior and inferior articular processes"),
          o("القناة العصبية وجسم الفقرة", "The neural canal and the vertebral body"),
        ],
        correct: 0,
        explain: L(
          "الضلع عظمة مقوسة تنحني إلى أسفل وتتصل من الخلف بجسم الفقرة العظمية ونتوئها المستعرض.",
          "A rib is a curved bone that bends downward and attaches from behind to the vertebral body and its transverse process.",
        ),
        visual: { figure: "vertebra", mark: "transverse" },
      },
      {
        id: "t2-q2",
        block: 6,
        prompt: L(
          "الجزء النابض في الرسم هو الفقرة العنقية الأولى. ما الذي يميزها عن بقية الفقرات؟",
          "The pulsing part is the first cervical vertebra. What distinguishes it from the other vertebrae?",
        ),
        options: [
          o("ليس بها نتوء شوكي بارز", "It has no prominent spinous process"),
          o("بها نتوء شوكي طويل جداً", "It has a very long spinous process"),
          o("ملتحمة مع الفقرة العجزية", "It is fused with the sacral vertebrae"),
          o("ليس بها قناة عصبية", "It has no neural canal"),
        ],
        correct: 0,
        explain: L(
          "لا يوجد نتوء شوكي بارز في الفقرة العنقية الأولى لتسهيل حركة الرأس.",
          "There is no prominent spinous process in the first cervical vertebra, which makes head movement easier.",
        ),
        visual: { figure: "spine", mark: "cervical" },
      },
      {
        id: "t2-q3",
        block: 5,
        prompt: L(
          "بأي جزء من الهيكل المحوري يتصل الطرف العلوي للعمود الفقري؟",
          "Which part of the axial skeleton does the upper end of the vertebral column join?",
        ),
        options: [
          o("بالجمجمة", "The skull"),
          o("بعظمة القص", "The sternum"),
          o("بعظام الحوض", "The pelvic bones"),
        ],
        correct: 0,
        explain: L(
          "يتصل الطرف العلوي للعمود الفقري بالجمجمة، ويتصل به من أسفل الطرفان السفليان بواسطة عظام الحوض.",
          "The upper end of the vertebral column joins the skull, and the lower limbs join it from below through the pelvic bones.",
        ),
      },
      {
        id: "t2-q4",
        block: 8,
        prompt: L(
          "الضلع الحادي عشر يتصل بالفقرة رقم 18. ما رقم الفقرة التالية لها، وإلى أي مجموعة تنتمي؟",
          "The 11th rib joins vertebra no. 18. What is the number of the next vertebra and which group does it belong to?",
        ),
        options: [
          o("رقم 19 - آخر فقرة صدرية", "No. 19 - the last thoracic vertebra"),
          o("رقم 19 - أول فقرة قطنية", "No. 19 - the first lumbar vertebra"),
          o("رقم 20 - آخر فقرة صدرية", "No. 20 - the last thoracic vertebra"),
          o("رقم 20 - أول فقرة قطنية", "No. 20 - the first lumbar vertebra"),
        ],
        correct: 0,
        explain: L(
          "الزوجان الحادي عشر والثاني عشر (الضلوع العائمة) يتصلان بالفقرتين رقمي 18 و19، والفقرات الصدرية ترتيبها من 8 إلى 19، والقطنية تبدأ من 20.",
          "The 11th and 12th pairs (floating ribs) join vertebrae 18 and 19; the thoracic vertebrae are numbered 8 to 19 and the lumbar start at 20.",
        ),
        visual: { figure: "thorax", mark: "floating-ribs" },
      },
      {
        id: "t2-q5",
        block: 8,
        prompt: L(
          "الضلوع النابضة في الرسم قصيرة ولا تتصل بعظمة القص. ماذا تسمى؟",
          "The pulsing ribs are short and do not reach the sternum. What are they called?",
        ),
        options: [
          o("الضلوع العائمة", "Floating ribs"),
          o("الضلوع الحقيقية", "True ribs"),
          o("الغضاريف الضلعية", "Costal cartilages"),
        ],
        correct: 0,
        explain: L(
          "الزوجان الأخيران (الحادي عشر والثاني عشر) قصيران لا يتصلان بالقص لذا تسمى الضلوع العائمة.",
          "The last two pairs (11th and 12th) are short and do not join the sternum, so they are called floating ribs.",
        ),
        visual: { figure: "thorax", mark: "floating-ribs" },
      },
      {
        id: "t2-q6",
        block: 6,
        prompt: L(
          "الجزء النابض في الرسم هو الحلقة الشوكية (الحلقة العصبية). ما وظيفتها؟",
          "The pulsing part is the neural ring. What is its function?",
        ),
        options: [
          o(
            "تحيط بالقناة العصبية التي يمتد فيها الحبل الشوكي لحمايته",
            "It surrounds the neural canal in which the spinal cord runs, protecting it",
          ),
          o("يتصل بها الضلع من الخلف", "The rib attaches to it from behind"),
          o("تمفصل الفقرة مع الفقرة التي تعلوها", "It articulates the vertebra with the one above"),
        ],
        correct: 0,
        explain: L(
          "الحلقة الشوكية حلقة عظمية تتصل بجسم الفقرة من الخلف وتحيط بالقناة العصبية التي يمتد داخلها الحبل الشوكي لحمايته.",
          "The neural ring is a bony ring attached to the back of the body; it surrounds the neural canal containing the spinal cord to protect it.",
        ),
        visual: { figure: "vertebra", mark: "neural-ring" },
      },
    ],
  },
  {
    n: 3,
    title: L(
      "اختبر نفسك (3): الحزام الصدري والساعد",
      "Test yourself (3): The pectoral girdle and the forearm",
    ),
    covers: L(
      "الترقوة ولوح الكتف، والكعبرة والزند في الوضع التشريحي، وحركة الكعبرة.",
      "Clavicle and scapula, radius and ulna in the anatomical position, and the movement of the radius.",
    ),
    blocks: [9],
    questions: [
      {
        id: "t3-q1",
        block: 9,
        prompt: L(
          "العظمة النابضة في الرسم باطنية رفيعة، تتصل من الأمام بعظمة القص. ما اسمها؟",
          "The pulsing bone is ventral and thin, and joins the sternum in front. What is it?",
        ),
        options: [o("الترقوة", "Clavicle"), o("لوح الكتف", "Scapula"), o("العضد", "Humerus")],
        correct: 0,
        explain: L(
          "الترقوة عظمة باطنية رفيعة تتصل من الأمام بعظمة القص ومن الجانب بعظمة لوح الكتف.",
          "The clavicle is a thin ventral bone joined in front to the sternum and at the side to the scapula.",
        ),
        visual: { figure: "pectoral", mark: "clavicle" },
      },
      {
        id: "t3-q2",
        block: 9,
        prompt: L(
          "العظمة النابضة في الرسم ظهرية مثلثية الشكل. ما اسمها؟",
          "The pulsing bone is dorsal and triangular. What is it?",
        ),
        options: [o("الترقوة", "Clavicle"), o("لوح الكتف", "Scapula"), o("الزند", "Ulna")],
        correct: 1,
        explain: L(
          "لوح الكتف عظمة ظهرية مثلثية الشكل طرفها الداخلي عريض والخارجي مدبب به نتوء تتصل به الترقوة.",
          "The scapula is a dorsal, triangular bone with a broad inner end and a pointed outer end carrying a process joined to the clavicle.",
        ),
        visual: { figure: "pectoral", mark: "scapula" },
      },
      {
        id: "t3-q3",
        block: 9,
        prompt: L(
          "في الوضع التشريحي، العظمة النابضة في الساعد توجد جهة الخارج. ما اسمها وفي جهة أي إصبع هي؟",
          "In the anatomical position, the pulsing forearm bone lies on the outer side. What is it and beside which finger?",
        ),
        options: [
          o("الكعبرة - جهة الإبهام", "Radius - the thumb side"),
          o("الكعبرة - جهة الخنصر", "Radius - the little-finger side"),
          o("الزند - جهة الإبهام", "Ulna - the thumb side"),
          o("الزند - جهة الخنصر", "Ulna - the little-finger side"),
        ],
        correct: 0,
        explain: L(
          "في الوضع التشريحي توجد عظمة الكعبرة جهة الخارج في نفس جهة إصبع الإبهام.",
          "In the anatomical position the radius lies on the outer side, the same side as the thumb.",
        ),
        visual: { figure: "pectoral", mark: "radius" },
      },
      {
        id: "t3-q4",
        block: 9,
        prompt: L(
          "العظمة النابضة في الساعد توجد جهة الداخل. ما اسمها وفي جهة أي إصبع توجد؟",
          "The pulsing forearm bone lies on the inner side. What is it and beside which finger?",
        ),
        options: [
          o("الزند - جهة الخنصر", "Ulna - the little-finger side"),
          o("الزند - جهة الإبهام", "Ulna - the thumb side"),
          o("الكعبرة - جهة الخنصر", "Radius - the little-finger side"),
        ],
        correct: 0,
        explain: L(
          "توجد عظمة الزند جهة الداخل في نفس جهة إصبع الخنصر.",
          "The ulna lies on the inner side, the same side as the little finger.",
        ),
        visual: { figure: "pectoral", mark: "ulna" },
      },
      {
        id: "t3-q5",
        block: 9,
        prompt: L(
          "عظام رسغ اليد النابضة يتصل طرفها العلوي بأي عظمة من الساعد؟",
          "The upper end of the pulsing wrist bones joins which forearm bone?",
        ),
        options: [
          o("الكعبرة فقط، ولا يتصل بالزند", "The radius only, not the ulna"),
          o("الزند فقط، ولا يتصل بالكعبرة", "The ulna only, not the radius"),
          o("الكعبرة والزند معاً", "Both the radius and the ulna"),
        ],
        correct: 0,
        explain: L(
          "رسغ اليد يتكون من 8 عظام في صفين يتصل طرفها العلوي بالطرف السفلي للكعبرة (لا يتصل بعظمة الزند).",
          "The wrist has 8 bones in two rows; their upper end joins the lower end of the radius (not the ulna).",
        ),
        visual: { figure: "pectoral", mark: "wrist" },
      },
      {
        id: "t3-q6",
        block: 9,
        prompt: L(
          "تتحرك الكعبرة النابضة حركة نصف دائرية حول عظمة ثابتة. ما العظمة الثابتة، وما شكل العظمتين بعد الحركة؟",
          "The pulsing radius makes a half-circle movement around a fixed bone. Which bone is fixed, and what shape do the two bones form after the movement?",
        ),
        options: [
          o("الزند - تتقاطعان على شكل حرف X", "The ulna - they cross in an X shape"),
          o("الزند - تبقيان متوازيتين", "The ulna - they stay parallel"),
          o("العضد - تتقاطعان على شكل حرف X", "The humerus - they cross in an X shape"),
          o("الكعبرة - تتقاطعان على شكل حرف X", "The radius - they cross in an X shape"),
        ],
        correct: 0,
        explain: L(
          "تتحرك الكعبرة حركة نصف دائرية (جهة الداخل فقط) حول عظمة الزند الثابتة فتظهر متقاطعة معها على شكل حرف X.",
          "The radius moves in a half circle (inward only) around the fixed ulna, so it appears crossed with it in an X shape.",
        ),
        visual: { figure: "pectoral", mark: "radius" },
      },
    ],
  },
  {
    n: 4,
    title: L(
      "اختبر نفسك (4): العضد والحوض واليد والقدم",
      "Test yourself (4): The humerus, pelvis, hand and foot",
    ),
    covers: L(
      "اتصالات العضد، وعدد عظام الحوض، والفرق بين رسغ اليد ورسغ القدم.",
      "What the humerus joins, the number of pelvic bones, and wrist versus ankle bones.",
    ),
    blocks: [9, 10],
    questions: [
      {
        id: "t4-q1",
        block: 9,
        prompt: L(
          "رأس عظمة العضد يستقر في التجويف النابض في الرسم. ما اسم التجويف، وما المفصل الذي يكوّنه؟",
          "The head of the humerus rests in the pulsing cavity. What is the cavity and which joint does it form?",
        ),
        options: [
          o("التجويف الأروح - المفصل الكتفي", "Glenoid cavity - the shoulder joint"),
          o("التجويف الحقي - المفصل الكتفي", "Acetabulum - the shoulder joint"),
          o("التجويف الأروح - مفصل الكوع", "Glenoid cavity - the elbow joint"),
          o("التجويف الحقي - مفصل الفخذ", "Acetabulum - the hip joint"),
        ],
        correct: 0,
        explain: L(
          "التجويف الأروح عند الطرف الخارجي للوح الكتف يستقر فيه رأس العضد مكوناً المفصل الكتفي.",
          "The glenoid cavity at the outer end of the scapula holds the head of the humerus, forming the shoulder joint.",
        ),
        visual: { figure: "pectoral", mark: "glenoid" },
      },
      {
        id: "t4-q2",
        block: 9,
        prompt: L(
          "المفصل النابض هو مفصل الكوع. كم عظمة تكوّنه؟",
          "The pulsing joint is the elbow. How many bones form it?",
        ),
        options: [
          o("عظمتان", "Two bones"),
          o("3 عظام (العضد + الكعبرة + الزند)", "Three bones (humerus + radius + ulna)"),
          o("4 عظام", "Four bones"),
        ],
        correct: 1,
        explain: L(
          "عدد العظام المكونة لمفصل الكوع = 3 عظام (العضد + الكعبرة + الزند).",
          "The elbow joint is formed by 3 bones (humerus + radius + ulna).",
        ),
        visual: { figure: "pectoral", mark: "elbow-joint" },
      },
      {
        id: "t4-q3",
        block: 9,
        prompt: L(
          "النتوء السفلي لعظمة العضد يستقر في تجويف بالطرف العلوي لأي عظمة؟",
          "The lower projection of the humerus rests in a cavity at the upper end of which bone?",
        ),
        options: [o("الزند", "Ulna"), o("الكعبرة", "Radius"), o("لوح الكتف", "Scapula")],
        correct: 0,
        explain: L(
          "الزند يحتوي طرفها العلوي على تجويف يستقر فيه النتوء السفلي للعضد.",
          "The upper end of the ulna contains a cavity in which the lower projection of the humerus rests.",
        ),
        visual: { figure: "pectoral", mark: "ulna" },
      },
      {
        id: "t4-q4",
        block: 10,
        prompt: L("كم عدد عظام الحوض؟", "How many bones does the pelvis have?"),
        options: [o("عظمتان", "2"), o("3 عظام", "3"), o("4 عظام", "4"), o("6 عظام", "6")],
        correct: 2,
        explain: L(
          "عدد عظام الحوض = 4 عظام (عظمتي الحزام الحوضي + عظمة العجز + عظمة العصعص).",
          "The pelvis has 4 bones (the 2 bones of the pelvic girdle + the sacrum + the coccyx).",
        ),
        visual: { figure: "pelvic" },
      },
      {
        id: "t4-q5",
        block: 9,
        prompt: L(
          "عظام رسغ اليد النابضة في الرسم كم عددها؟",
          "How many bones does the pulsing wrist of the hand have?",
        ),
        options: [o("7 عظام", "7"), o("8 عظام", "8"), o("5 عظام", "5"), o("14 عظمة", "14")],
        correct: 1,
        explain: L(
          "رسغ اليد يتكون من 8 عظام في صفين، بينما رسغ القدم يتكون من 7 عظام.",
          "The wrist has 8 bones in two rows, while the ankle has 7 bones.",
        ),
        visual: { figure: "pectoral", mark: "wrist" },
      },
      {
        id: "t4-q6",
        block: 10,
        prompt: L(
          "عظام رسغ القدم النابضة في الرسم كم عددها، وما أكبرها؟",
          "How many bones does the pulsing ankle have and which is the largest?",
        ),
        options: [
          o("7 عظام - العظمة الخلفية التي تكوّن كعب القدم", "7 - the back bone that forms the heel"),
          o("8 عظام - العظمة الخلفية التي تكوّن كعب القدم", "8 - the back bone that forms the heel"),
          o("7 عظام - عظمة الرضفة", "7 - the patella"),
        ],
        correct: 0,
        explain: L(
          "رسغ القدم يتكون من 7 عظام غير منتظمة الشكل أكبرها العظمة الخلفية التي تكوّن كعب القدم.",
          "The ankle has 7 irregular bones; the largest is the back one, which forms the heel.",
        ),
        visual: { figure: "pelvic", mark: "tarsals" },
      },
    ],
  },
  {
    n: 5,
    title: L("اختبر نفسك (5): المفاصل", "Test yourself (5): Joints"),
    covers: L(
      "المفاصل الليفية وتغيرها مع العمر، ومفصل الفخذ، ومدى حركة مفصلي الفخذ والركبة.",
      "Fibrous joints and age, the hip joint, and the range of motion of the hip and knee.",
    ),
    blocks: [12, 10],
    questions: [
      {
        id: "t5-q1",
        block: 12,
        prompt: L(
          "في المفاصل الليفية بين عظام الجمجمة، أي رسم يعبر عن تغير النسيج الليفي والنسيج العظمي مع التقدم في العمر (من 0 إلى 80 سنة)؟",
          "In the fibrous joints between skull bones, which graph shows fibrous and bony tissue changing with age (0 to 80 years)?",
        ),
        options: [
          {
            text: L("رسم (أ)", "Graph A"),
            plot: { fibrous: [80, 80, 80, 80, 80], bony: [20, 20, 20, 20, 20] },
          },
          {
            text: L("رسم (ب)", "Graph B"),
            plot: { fibrous: [95, 75, 50, 25, 5], bony: [5, 25, 50, 75, 95] },
          },
          {
            text: L("رسم (جـ)", "Graph C"),
            plot: { fibrous: [5, 25, 50, 75, 95], bony: [95, 75, 50, 25, 5] },
          },
          {
            text: L("رسم (د)", "Graph D"),
            plot: { fibrous: [10, 30, 50, 70, 90], bony: [5, 25, 45, 65, 85] },
          },
        ],
        correct: 1,
        explain: L(
          "في المفاصل الليفية تلتحم العظام بأنسجة ليفية تتحول مع تقدم العمر إلى أنسجة عظمية، فيقل النسيج الليفي ويزداد النسيج العظمي.",
          "In fibrous joints bones are fused by fibrous tissue that turns into bony tissue with age, so fibrous tissue decreases and bony tissue increases.",
        ),
        visual: { figure: "joints", mark: "fibrous-joint" },
      },
      {
        id: "t5-q2",
        block: 10,
        prompt: L(
          "المفصل النابض هو مفصل الفخذ. كم عظمة تكوّنه؟",
          "The pulsing joint is the hip joint. How many bones form it?",
        ),
        options: [
          o("عظمتان (إحدى عظمتي الحزام الحوضي + الفخذ)", "Two (one hip bone + the femur)"),
          o("3 عظام", "Three"),
          o("4 عظام", "Four"),
        ],
        correct: 0,
        explain: L(
          "عدد العظام المكونة لمفصل الفخذ = عظمتين (إحدى عظمتي الحزام الحوضي + عظمة الفخذ).",
          "The hip joint is formed by 2 bones (one of the two bones of the pelvic girdle + the femur).",
        ),
        visual: { figure: "pelvic", mark: "acetabulum" },
      },
      {
        id: "t5-q3",
        block: 12,
        prompt: L(
          "مفصل الفخذ يسمح بحركة العظام في اتجاهات مختلفة. إلى أي نوع من المفاصل ينتمي؟",
          "The hip joint allows bones to move in different directions. Which type of joint is it?",
        ),
        options: [
          o("زلالي واسع الحركة", "Synovial, wide-range"),
          o("زلالي محدود الحركة", "Synovial, limited-range"),
          o("غضروفي", "Cartilaginous"),
          o("ليفي", "Fibrous"),
        ],
        correct: 0,
        explain: L(
          "المفاصل الواسعة الحركة تسمح بحركة العظام في اتجاهات مختلفة، مثل مفصل الكتف ومفصل الفخذ، وهي من المفاصل الزلالية.",
          "Wide-range synovial joints allow movement in different directions, such as the shoulder and hip joints.",
        ),
        visual: { figure: "joints", mark: "synovial-joint" },
      },
      {
        id: "t5-q4",
        block: 12,
        prompt: L(
          "المفصل الظاهر في الرسم هو مفصل الركبة. ما مدى حركته؟",
          "The joint shown in the drawing is the knee joint. What is its range of motion?",
        ),
        options: [
          o("زلالي محدود الحركة: في اتجاه واحد فقط", "Synovial, limited-range: one direction only"),
          o("زلالي واسع الحركة: في اتجاهات مختلفة", "Synovial, wide-range: different directions"),
          o("لا يسمح بالحركة", "Allows no movement"),
        ],
        correct: 0,
        explain: L(
          "المفاصل محدودة الحركة تسمح بحركة إحدى العظام في اتجاه واحد فقط، مثل مفصل الكوع ومفصل الركبة.",
          "Limited-range joints allow one bone to move in one direction only, such as the elbow and knee joints.",
        ),
        visual: { figure: "knee" },
      },
      {
        id: "t5-q5",
        block: 12,
        prompt: L(
          "عظمة الفخذ النابضة لها مفصلان في طرفيها: مفصل الفخذ ومفصل الركبة. أي العبارات صحيحة؟",
          "The pulsing femur has a joint at each end: the hip and the knee. Which statement is correct?",
        ),
        options: [
          o(
            "الفخذ واسع الحركة والركبة محدود الحركة في اتجاه واحد",
            "The hip is wide-range and the knee is limited-range in one direction",
          ),
          o("كلاهما واسع الحركة", "Both are wide-range"),
          o(
            "الفخذ محدود الحركة والركبة واسع الحركة",
            "The hip is limited-range and the knee is wide-range",
          ),
        ],
        correct: 0,
        explain: L(
          "مفصل الفخذ من المفاصل الزلالية واسعة الحركة، ومفصل الركبة من المفاصل الزلالية محدودة الحركة (اتجاه واحد).",
          "The hip is a wide-range synovial joint; the knee is a limited-range synovial joint (one direction).",
        ),
        visual: { figure: "pelvic", mark: "femur" },
      },
      {
        id: "t5-q6",
        block: 12,
        prompt: L(
          "المفاصل التي توجد بين عظام الجمجمة من أي نوع، وهل تسمح بالحركة؟",
          "What type are the joints between skull bones, and do they allow movement?",
        ),
        options: [
          o("ليفية - معظمها لا يسمح بالحركة", "Fibrous - most allow no movement"),
          o("غضروفية - تسمح بحركة محدودة جداً", "Cartilaginous - very limited movement"),
          o("زلالية - تسمح بسهولة الحركة", "Synovial - move easily"),
        ],
        correct: 0,
        explain: L(
          "عظام الجمجمة ترتبط ببعضها من خلال أطرافها المسننة بأنسجة ليفية في مفاصل ليفية، ومعظمها لا يسمح بالحركة.",
          "Skull bones are joined along their serrated edges by fibrous tissue in fibrous joints, most of which allow no movement.",
        ),
      },
    ],
  },
  {
    n: 6,
    title: L("اختبر نفسك (6): الأربطة والأوتار", "Test yourself (6): Ligaments and tendons"),
    covers: L(
      "أربطة الركبة، ووتر أخيل وعظمة الكعب والعضلة التوأمية والقصبة.",
      "Knee ligaments, the Achilles tendon, the heel bone, the gastrocnemius and the tibia.",
    ),
    blocks: [13, 14],
    questions: [
      {
        id: "t6-q1",
        block: 13,
        prompt: L(
          "الرباط الصليبي الأمامي النابض في الرسم أحد الأربطة التي تربط الفخذ بالقصبة. كم عدد هذه الأربطة؟",
          "The pulsing anterior cruciate ligament is one of the ligaments tying the femur to the tibia. How many are there?",
        ),
        options: [
          o("رباط واحد", "One"),
          o("رباطان", "Two"),
          o("ثلاثة أربطة", "Three"),
          o("أربعة أربطة", "Four"),
        ],
        correct: 2,
        explain: L(
          "ترتبط عظمة الفخذ بعظمة القصبة بثلاثة أربطة: الوسطي، والصليبي الأمامي، والصليبي الخلفي. والأربطة تربط العظام ببعضها.",
          "The femur is tied to the tibia by three ligaments: the medial, the anterior cruciate and the posterior cruciate. Ligaments tie bone to bone.",
        ),
        visual: { figure: "knee", mark: "acl" },
      },
      {
        id: "t6-q2",
        block: 13,
        prompt: L(
          "الرباط النابض في الرسم هو الرباط الجانبي. أي عظمتين يربط؟",
          "The pulsing ligament is the lateral ligament. Which two bones does it tie?",
        ),
        options: [
          o("الفخذ والشظية", "Femur and fibula"),
          o("الفخذ والقصبة", "Femur and tibia"),
          o("القصبة والشظية", "Tibia and fibula"),
        ],
        correct: 0,
        explain: L(
          "ترتبط عظمة الفخذ بعظمة الشظية بالرباط الجانبي فقط.",
          "The femur is tied to the fibula by the lateral ligament only.",
        ),
        visual: { figure: "knee", mark: "lateral-ligament" },
      },
      {
        id: "t6-q3",
        block: 14,
        prompt: L(
          "التركيب النابض في الرسم هو وتر أخيل. ماذا يصل ببعضه؟",
          "The pulsing structure is the Achilles tendon. What does it connect?",
        ),
        options: [
          o("العضلة التوأمية بعظمة الكعب", "The gastrocnemius muscle to the heel bone"),
          o("عظمة الفخذ بعظمة القصبة", "The femur to the tibia"),
          o("القصبة بالشظية", "The tibia to the fibula"),
        ],
        correct: 0,
        explain: L(
          "الأوتار تربط العضلات بالعظام، ووتر أخيل يصل العضلة التوأمية (عضلة بطن الساق) بعظمة الكعب مما يساعد على حركة كعب القدم.",
          "Tendons tie muscles to bones; the Achilles tendon joins the gastrocnemius (calf muscle) to the heel bone and helps move the heel.",
        ),
        visual: { figure: "achilles", mark: "achilles-tendon" },
      },
      {
        id: "t6-q4",
        block: 14,
        prompt: L(
          "العظمة النابضة في الرسم هي التي يتصل بها وتر أخيل. ما اسمها؟",
          "The pulsing bone is the one the Achilles tendon attaches to. What is it?",
        ),
        options: [
          o("عظمة الكعب", "The heel bone (calcaneus)"),
          o("القصبة", "Tibia"),
          o("الشظية", "Fibula"),
        ],
        correct: 0,
        explain: L(
          "يصل وتر أخيل العضلة التوأمية بعظمة الكعب، وهي أكبر عظام رسغ القدم وتكوّن كعب القدم.",
          "The Achilles tendon joins the gastrocnemius to the heel bone, the largest ankle bone, which forms the heel of the foot.",
        ),
        visual: { figure: "achilles", mark: "calcaneus" },
      },
      {
        id: "t6-q5",
        block: 14,
        prompt: L(
          "العضلة النابضة في الرسم هي عضلة بطن الساق. ما اسمها؟",
          "The pulsing muscle is the calf muscle. What is it called?",
        ),
        options: [
          o("العضلة التوأمية", "Gastrocnemius"),
          o("وتر أخيل", "Achilles tendon"),
          o("الرباط الجانبي", "Lateral ligament"),
        ],
        correct: 0,
        explain: L(
          "وتر أخيل يصل العضلة التوأمية (عضلة بطن الساق) بعظمة الكعب.",
          "The Achilles tendon joins the gastrocnemius (calf muscle) to the heel bone.",
        ),
        visual: { figure: "achilles", mark: "gastrocnemius" },
      },
      {
        id: "t6-q6",
        block: 14,
        prompt: L(
          "العظمة النابضة في الرسم هي العظمة الداخلية للساق. ما اسمها؟",
          "The pulsing bone is the inner bone of the shank. What is it?",
        ),
        options: [o("القصبة", "Tibia"), o("الشظية", "Fibula"), o("الفخذ", "Femur")],
        correct: 0,
        explain: L(
          "الساق تتكون من عظمتين: القصبة وهي العظمة الداخلية، والشظية وهي العظمة الخارجية.",
          "The shank has two bones: the tibia, the inner bone, and the fibula, the outer bone.",
        ),
        visual: { figure: "achilles", mark: "tibia" },
      },
    ],
  },
];
