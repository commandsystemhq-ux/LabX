import type { L10n } from "@/lib/i18n";
import type { QuizOption, SupportBlockContent } from "./supportTypes";

/**
 * Blocks 1–7 of the support lesson (textbook sections 1–7). Scientific content comes only from
 * docs/lesson1.txt; everyday pictures are marked as analogies.
 */

const t = (ar: string, en: string): L10n => ({ ar, en });
const o = (ar: string, en: string): QuizOption => ({ text: t(ar, en) });

export const blocksA: SupportBlockContent[] = [
  /* ------------------------------------------------------------------ 1 */
  {
    n: 1,
    emoji: "🌱",
    titleEn: "Introduction and basic concepts of support in plants",
    hookQuestion: {
      question: t(
        "في النبات، أي نسيج من دول خلاياه غير حية وبرضه بيدعم النبات؟",
        "In a plant, which of these tissues is made of non-living cells and still supports the plant?",
      ),
      options: [
        t("البارانشيمي (خلايا كروية رقيقة الجدر)", "Parenchyma (thin-walled round cells)"),
        t("الكولنشيمي (خلايا مغلظة الأركان)", "Collenchyma (cells with thickened corners)"),
        t("الإسكرلنشيمي (خلايا مغلظة الجدر)", "Sclerenchyma (cells with thickened walls)"),
      ],
      correct: 2,
      reveal: t(
        "الإسكرلنشيمي نسيج غير حي جدره مغلظة بمادة اللجنين، والكولنشيمي والبارانشيمي حيين.",
        "Sclerenchyma is a non-living tissue with walls thickened by lignin; collenchyma and parenchyma are living.",
      ),
    },
    simpleExplanation: {
      paragraphs: [
        t(
          "الخلية هي وحدة البناء والوظيفة في أي كائن حي. والخلية النباتية بتتميز عن الحيوانية بجدار خلوي أساسه مادة السيليلوز.",
          "The cell is the unit of structure and function. A plant cell differs from an animal cell by a cell wall made mainly of cellulose.",
        ),
        t(
          "النسيج هو مجموعة خلايا متخصصة في شغلها. لو الخلايا كلها من نوع واحد متشابه يبقى نسيج بسيط، ولو أكتر من نوع يبقى نسيج مركب.",
          "A tissue is a group of cells specialised in one job. One type of identical cells makes a simple tissue; more than one type makes a complex tissue.",
        ),
        t(
          "الأنسجة البسيطة التلاتة: البارانشيمي (حي، جدر سيليلوزية رقيقة مرنة وبينها مسافات بينية)، الكولنشيمي (حي، تغليظ غير منتظم بالسيليلوز)، الإسكرلنشيمي (غير حي، تغليظ باللجنين).",
          "The three simple tissues: parenchyma (living, thin flexible cellulose walls with intercellular spaces), collenchyma (living, irregular cellulose thickening), sclerenchyma (non-living, lignin thickening).",
        ),
        t(
          "والأنسجة المركبة: الخشب (أوعية وقصيبات مغلظة باللجنين ما عدا النقر) بيوصل الماء والأملاح، واللحاء (أنابيب غربالية وخلايا مرافقة) بينقل المواد العضوية.",
          "The complex tissues: xylem (vessels and tracheids thickened with lignin except the pits) conducts water and minerals; phloem (sieve tubes and companion cells) carries organic materials.",
        ),
      ],
      imagine: t(
        "تخيل (تشبيه): الخلية زي الطوبة، والنسيج زي حيطة مبنية من طوب متخصص. حيطة من طوب واحد = نسيج بسيط، وحيطة من أنواع طوب مختلفة = نسيج مركب.",
        "Imagine (an analogy): a cell is a brick and a tissue is a wall. A wall of one kind of brick is a simple tissue; a wall of different kinds is a complex tissue.",
      ),
      examples: [
        t(
          "نسيج الخشب بيوصل الماء والأملاح المعدنية من الجذر للساق ثم للأوراق.",
          "Xylem carries water and minerals from the root to the stem and then to the leaves.",
        ),
        t(
          "نسيج اللحاء بينقل المواد العضوية عالية الطاقة من الأوراق لباقي أجزاء النبات.",
          "Phloem moves energy-rich organic materials from the leaves to the other parts of the plant.",
        ),
      ],
      terms: [
        { ar: "الخلية", en: "Cell" },
        { ar: "الجدار الخلوي", en: "Cell wall" },
        { ar: "السيليلوز", en: "Cellulose" },
        { ar: "نسيج بسيط", en: "Simple tissue" },
        { ar: "نسيج مركب", en: "Complex tissue" },
        { ar: "النسيج البارانشيمي", en: "Parenchyma" },
        { ar: "النسيج الكولنشيمي", en: "Collenchyma" },
        { ar: "النسيج الإسكرلنشيمي", en: "Sclerenchyma" },
        { ar: "اللجنين", en: "Lignin" },
      ],
    },
    examTrap: {
      claim: t(
        "الكولنشيمي والإسكرلنشيمي الاتنين جدرهم مغلظة باللجنين وخلاياهم حية.",
        "Collenchyma and sclerenchyma both have lignin-thickened walls and living cells.",
      ),
      truth: t(
        "الكولنشيمي حي ومغلظ بالسيليلوز تغليظاً غير منتظم، أما الإسكرلنشيمي فغير حي ومغلظ باللجنين.",
        "Collenchyma is living and thickened irregularly with cellulose; sclerenchyma is non-living and thickened with lignin.",
      ),
      probes: [
        {
          id: "b1-p1",
          label: t("افحص الكولنشيمي", "Test collenchyma"),
          result: t(
            "خلايا حية، جدرها مغلظة بالسيليلوز تغليظاً غير منتظم.",
            "Living cells, walls thickened irregularly with cellulose.",
          ),
          verdict: "ok",
        },
        {
          id: "b1-p2",
          label: t("افحص الإسكرلنشيمي", "Test sclerenchyma"),
          result: t(
            "خلايا غير حية، جدرها مغلظة بمركب اللجنين.",
            "Non-living cells, walls thickened with lignin.",
          ),
          verdict: "ok",
        },
        {
          id: "b1-p3",
          label: t("حط لجنين في الكولنشيمي", "Put lignin in collenchyma"),
          result: t(
            "غلط! اللجنين بتاع الإسكرلنشيمي، والكولنشيمي تغليظه بالسيليلوز.",
            "Wrong! Lignin belongs to sclerenchyma; collenchyma is thickened with cellulose.",
          ),
          verdict: "bad",
        },
        {
          id: "b1-p4",
          label: t("افحص الخشب", "Test xylem"),
          result: t(
            "أوعية وقصيبات مغلظة باللجنين ما عدا النقر.",
            "Vessels and tracheids thickened with lignin, except the pits.",
          ),
          verdict: "info",
        },
      ],
    },
    tasks: [
      {
        kind: "label",
        id: "b1-t1",
        figure: "cell-plant",
        title: t("سمّي أجزاء الخلية النباتية", "Name the parts of the plant cell"),
        parts: [
          "cytoplasm",
          "nuclear-membrane",
          "nucleus",
          "er",
          "vacuole",
          "plasma-membrane",
          "cell-wall",
          "chloroplast",
          "mitochondria",
        ],
      },
      {
        kind: "label",
        id: "b1-t2",
        figure: "cell-animal",
        title: t("سمّي أجزاء الخلية الحيوانية", "Name the parts of the animal cell"),
        parts: [
          "plasma-membrane",
          "mitochondria",
          "er",
          "vacuole",
          "nucleus",
          "nuclear-membrane",
          "cytoplasm",
        ],
      },
      {
        kind: "match",
        id: "b1-t3",
        title: t("وصّل كل نسيج بوصفه", "Match each tissue to its description"),
        items: [
          {
            id: "i1",
            prompt: t(
              "نسيج حي، جدره سيليلوزية رقيقة ومرنة وبينها مسافات بينية",
              "Living tissue with thin flexible cellulose walls and intercellular spaces",
            ),
            answer: "parenchyma",
          },
          {
            id: "i2",
            prompt: t(
              "نسيج حي، جدره مغلظة تغليظاً غير منتظم بالسيليلوز",
              "Living tissue with irregular cellulose thickening",
            ),
            answer: "collenchyma",
          },
          {
            id: "i3",
            prompt: t(
              "نسيج غير حي، جدره مغلظة باللجنين",
              "Non-living tissue with lignin-thickened walls",
            ),
            answer: "sclerenchyma",
          },
          {
            id: "i4",
            prompt: t(
              "نسيج مركب من أوعية وقصيبات، يوصل الماء والأملاح",
              "Complex tissue of vessels and tracheids, conducts water and minerals",
            ),
            answer: "xylem",
          },
          {
            id: "i5",
            prompt: t(
              "نسيج مركب من أنابيب غربالية وخلايا مرافقة",
              "Complex tissue of sieve tubes and companion cells",
            ),
            answer: "phloem",
          },
        ],
        options: [
          { id: "parenchyma", label: t("البارانشيمي", "Parenchyma") },
          { id: "collenchyma", label: t("الكولنشيمي", "Collenchyma") },
          { id: "sclerenchyma", label: t("الإسكرلنشيمي", "Sclerenchyma") },
          { id: "xylem", label: t("الخشب", "Xylem") },
          { id: "phloem", label: t("اللحاء", "Phloem") },
        ],
        why: t(
          "البارانشيمي والكولنشيمي حيان، والإسكرلنشيمي غير حي مغلظ باللجنين، والخشب واللحاء نسيجان مركبان.",
          "Parenchyma and collenchyma are living; sclerenchyma is non-living with lignin; xylem and phloem are complex tissues.",
        ),
      },
      {
        kind: "match",
        id: "b1-t4",
        title: t("حي ولا غير حي؟", "Living or non-living?"),
        items: [
          { id: "i1", prompt: t("النسيج البارانشيمي", "Parenchyma"), answer: "alive" },
          { id: "i2", prompt: t("النسيج الكولنشيمي", "Collenchyma"), answer: "alive" },
          { id: "i3", prompt: t("النسيج الإسكرلنشيمي", "Sclerenchyma"), answer: "dead" },
        ],
        options: [
          { id: "alive", label: t("نسيج حي", "Living tissue") },
          { id: "dead", label: t("نسيج غير حي", "Non-living tissue") },
        ],
        why: t(
          "الكتاب بيقول: البارانشيمي والكولنشيمي نسيجان حيان، والإسكرلنشيمي غير حي.",
          "The book: parenchyma and collenchyma are living tissues; sclerenchyma is non-living.",
        ),
      },
    ],
    feynmanCheck: {
      prompt: t(
        "اشرح لي كأني صاحبك: إيه الفرق بين الأنسجة البسيطة التلاتة في النبات؟",
        "Explain to me like I'm your friend: what is the difference between the three simple plant tissues?",
      ),
      keywords: [
        { id: "cellwall", label: t("الجدار الخلوي", "Cell wall"), match: ["جدار", "جدر", "wall"] },
        { id: "cellulose", label: t("السيليلوز", "Cellulose"), match: ["سيليلوز", "cellulose"] },
        { id: "lignin", label: t("اللجنين", "Lignin"), match: ["لجنين", "lignin"] },
        {
          id: "living",
          label: t("حي / غير حي", "Living / non-living"),
          match: ["حية", "غير حي", "ميت", "living", "non-living", "dead"],
        },
        {
          id: "parenchyma",
          label: t("البارانشيمي", "Parenchyma"),
          match: ["بارانشيمي", "parenchyma"],
        },
        {
          id: "collenchyma",
          label: t("الكولنشيمي", "Collenchyma"),
          match: ["كولنشيمي", "collenchyma"],
        },
        {
          id: "sclerenchyma",
          label: t("الإسكرلنشيمي", "Sclerenchyma"),
          match: ["اسكرلنشيمي", "إسكرلنشيمي", "sclerenchyma"],
        },
      ],
      model: t(
        "التلاتة أنسجة بسيطة. البارانشيمي حي وجدره سيليلوزية رقيقة ومرنة وبينها مسافات بينية. الكولنشيمي حي وجدره مغلظة بالسيليلوز بشكل غير منتظم. الإسكرلنشيمي غير حي وجدره مغلظة باللجنين.",
        "All three are simple tissues. Parenchyma is living with thin flexible cellulose walls and intercellular spaces. Collenchyma is living with irregular cellulose thickening. Sclerenchyma is non-living with lignin-thickened walls.",
      ),
    },
    microQuiz: [
      {
        id: "b1-q1",
        block: 1,
        prompt: t("النسيج المركب بيتكون من إيه؟", "What is a complex tissue made of?"),
        options: [
          o("نوع واحد من الخلايا المتماثلة", "One type of identical cells"),
          o(
            "أكتر من نوع من الخلايا المختلفة في الشكل والتركيب والوظيفة",
            "More than one type of cells differing in shape, structure and function",
          ),
          o("خلايا غير حية فقط", "Non-living cells only"),
        ],
        correct: 1,
        explain: t(
          "النسيج المركب يتكون من أكثر من نوع من الخلايا المختلفة في الشكل والتركيب والوظيفة، زي الخشب واللحاء.",
          "A complex tissue has more than one cell type differing in shape, structure and function, like xylem and phloem.",
        ),
      },
      {
        id: "b1-q2",
        block: 1,
        prompt: t(
          "أنهي نسيج بينقل المواد العضوية عالية الطاقة من الأوراق؟",
          "Which tissue carries energy-rich organic materials from the leaves?",
        ),
        options: [o("الخشب", "Xylem"), o("اللحاء", "Phloem"), o("الكولنشيمي", "Collenchyma")],
        correct: 1,
        explain: t(
          "اللحاء (أنابيب غربالية وخلايا مرافقة) بينقل المواد العضوية عالية الطاقة من الأوراق، والخشب بيوصل الماء والأملاح.",
          "Phloem (sieve tubes and companion cells) carries the organic materials; xylem conducts water and minerals.",
        ),
        visual: { figure: "tissues", mark: "sieve-tube" },
      },
      {
        id: "b1-q3",
        block: 1,
        prompt: t(
          "حسب الكتاب، إيه اللي بيميز الخلية النباتية عن الحيوانية؟",
          "According to the book, what distinguishes a plant cell from an animal cell?",
        ),
        options: [
          o("وجود نواة", "Having a nucleus"),
          o("وجود جدار خلوي أساسه السيليلوز", "Having a cell wall made mainly of cellulose"),
          o("وجود غشاء بلازمي", "Having a plasma membrane"),
          o("وجود ميتوكندريا", "Having mitochondria"),
        ],
        correct: 1,
        explain: t(
          "الخلية النباتية تتميز بجدار خلوي يتركب أساساً من السيليلوز، أما النواة والغشاء البلازمي والميتوكندريا فموجودة في الخليتين.",
          "The plant cell is distinguished by a cell wall made mainly of cellulose; nucleus, plasma membrane and mitochondria are in both cells.",
        ),
      },
    ],
  },

  /* ------------------------------------------------------------------ 2 */
  {
    n: 2,
    emoji: "🧪",
    titleEn: "Means of support in plants and the deposited materials",
    hookQuestion: {
      question: t(
        "من بين السيليلوز واللجنين والكيوتين، أنهي مادة بس بتسمح للماء يعدّي من جدار الخلية؟",
        "Among cellulose, lignin and cutin, which one lets water pass through the cell wall?",
      ),
      options: [t("السيليلوز", "Cellulose"), t("اللجنين", "Lignin"), t("الكيوتين", "Cutin")],
      correct: 0,
      reveal: t(
        "السيليلوز هو المنفذ للماء؛ أما اللجنين والكيوتين والسيوبرين فغير منفذة.",
        "Cellulose is permeable; lignin, cutin and suberin are not.",
      ),
    },
    simpleExplanation: {
      paragraphs: [
        t(
          "النبات بيدعم نفسه بترسيب مواد على جدر الخلايا. الكيوتين على جدر خلايا البشرة من برّه، والسيوبرين في خلايا الفلين، والاتنين بيمنعوا فقد الماء.",
          "The plant supports itself by depositing materials on cell walls. Cutin on the outside of epidermal walls and suberin in cork cells both prevent water loss.",
        ),
        t(
          "السيليلوز بيدي القوة والمرونة (زي الكولنشيمي)، واللجنين بيترسب على الجدر من جوه ويدي القوة والصلابة (زي الإسكرلنشيمي والخشب).",
          "Cellulose gives strength and flexibility (as in collenchyma); lignin is deposited on the inside of walls and gives strength and rigidity (as in sclerenchyma and xylem).",
        ),
        t(
          "الساق العشبي غض ومرن وأخضر وفيه نسبة قليلة من الخشب، والساق الخشبي صلب وبني وفيه نسبة كبيرة من الخشب، والجذوع المسنة ليها طبقة فلين برّه.",
          "A herbaceous stem is soft, flexible, green with little xylem; a woody stem is hard, brown with much xylem, and old trunks have an outer cork layer.",
        ),
      ],
      imagine: t(
        "تخيل (تشبيه): السيليلوز زي حبل مرن بيشد ومش بيتكسر، واللجنين زي خرسانة بتصلّب الجدار، والكيوتين زي طبقة ورنيش من برّه بتمنع تسرب الماء.",
        "Imagine (an analogy): cellulose is like a flexible rope, lignin like concrete that stiffens the wall, and cutin like a layer of varnish on the outside that stops water leaking.",
      ),
      examples: [
        t(
          "سيقان الفول والملوخية عشبية: غضة ومرنة وخضراء ونسبة الخشب فيها قليلة.",
          "Faba bean and molokhia stems are herbaceous: soft, flexible, green, with little xylem.",
        ),
        t(
          "أشجار الصنوبر والسنط خشبية: سيقانها صلبة بنية ونسبة الخشب فيها كبيرة.",
          "Pine and acacia trees are woody: hard, brown stems with a large proportion of xylem.",
        ),
      ],
      terms: [
        { ar: "الكيوتين", en: "Cutin" },
        { ar: "السيوبرين", en: "Suberin" },
        { ar: "السيليلوز", en: "Cellulose" },
        { ar: "اللجنين", en: "Lignin" },
        { ar: "البشرة", en: "Epidermis" },
        { ar: "الفلين", en: "Cork" },
        { ar: "نبات عشبي", en: "Herbaceous plant" },
        { ar: "نبات خشبي", en: "Woody plant" },
      ],
    },
    examTrap: {
      claim: t(
        "اللجنين بيدعم النبات يبقى منفذ للماء، والكيوتين ممكن يحل محل اللجنين في التدعيم.",
        "Lignin supports the plant so it must be permeable to water, and cutin can replace lignin.",
      ),
      truth: t(
        "السيليلوز هو المادة المنفذة للماء فقط. اللجنين والكيوتين والسيوبرين غير منفذة، والكيوتين بيترسب من برّه لمنع فقد الماء مش لتدعيم الجدر من جوه.",
        "Only cellulose is permeable. Lignin, cutin and suberin are not, and cutin is deposited on the outside to stop water loss, not to stiffen walls from inside.",
      ),
      probes: [
        {
          id: "b2-p1",
          label: t("جرّب السيليلوز", "Test cellulose"),
          result: t(
            "منفذ للماء، ويدي القوة والمرونة.",
            "Permeable to water; gives strength and flexibility.",
          ),
          verdict: "ok",
        },
        {
          id: "b2-p2",
          label: t("جرّب اللجنين", "Test lignin"),
          result: t(
            "غير منفذ للماء! يعني الافتراض إنه منفذ غلط، وهو بيدي القوة والصلابة.",
            "Not permeable! So the assumption is wrong; it gives strength and rigidity.",
          ),
          verdict: "bad",
        },
        {
          id: "b2-p3",
          label: t("بدّل اللجنين بالكيوتين", "Swap lignin for cutin"),
          result: t(
            "لا يمشي: الكيوتين على البشرة من برّه لمنع فقد الماء، واللجنين من جوه للقوة والصلابة.",
            "It fails: cutin sits outside the epidermis to stop water loss, lignin is inside the walls for strength and rigidity.",
          ),
          verdict: "bad",
        },
        {
          id: "b2-p4",
          label: t("جرّب السيوبرين", "Test suberin"),
          result: t(
            "غير منفذ، موجود في خلايا الفلين غير الحية.",
            "Not permeable; found in non-living cork cells.",
          ),
          verdict: "info",
        },
      ],
    },
    tasks: [
      { kind: "deposit", id: "b2-deposit", title: t("معمل ترسيب المواد", "Material deposit lab") },
      {
        kind: "label",
        id: "b2-t2",
        figure: "stem-section",
        title: t("سمّي المواد المترسبة في القطاع", "Name the deposited materials in the section"),
        parts: ["cutin", "cellulose", "lignin"],
      },
      {
        kind: "match",
        id: "b2-t3",
        title: t("كل مادة بتدعم أنهي نسيج؟", "Which tissue does each material support?"),
        items: [
          { id: "i1", prompt: t("السيليلوز", "Cellulose"), answer: "collenchyma" },
          { id: "i2", prompt: t("اللجنين", "Lignin"), answer: "sclerenchyma" },
          { id: "i3", prompt: t("الكيوتين", "Cutin"), answer: "epidermis" },
          { id: "i4", prompt: t("السيوبرين", "Suberin"), answer: "cork" },
        ],
        options: [
          { id: "collenchyma", label: t("الكولنشيمي (حي)", "Collenchyma (living)") },
          {
            id: "sclerenchyma",
            label: t(
              "الإسكرلنشيمي وأوعية الخشب (غير حي)",
              "Sclerenchyma and xylem vessels (non-living)",
            ),
          },
          {
            id: "epidermis",
            label: t("بشرة الساق والأوراق (حي)", "Epidermis of stem and leaves (living)"),
          },
          { id: "cork", label: t("الفلين (غير حي)", "Cork (non-living)") },
        ],
        why: t(
          "جدول الكتاب: السيليلوز-كولنشيمي، اللجنين-إسكرلنشيمي وخشب، الكيوتين-بشرة، السيوبرين-فلين.",
          "The book's table: cellulose-collenchyma, lignin-sclerenchyma and xylem, cutin-epidermis, suberin-cork.",
        ),
      },
      {
        kind: "match",
        id: "b2-t4",
        title: t("منفذة للماء ولا لأ؟", "Permeable to water or not?"),
        items: [
          { id: "i1", prompt: t("السيليلوز", "Cellulose"), answer: "yes" },
          { id: "i2", prompt: t("اللجنين", "Lignin"), answer: "no" },
          { id: "i3", prompt: t("الكيوتين", "Cutin"), answer: "no" },
          { id: "i4", prompt: t("السيوبرين", "Suberin"), answer: "no" },
        ],
        options: [
          { id: "yes", label: t("منفذة للماء", "Permeable") },
          { id: "no", label: t("غير منفذة للماء", "Not permeable") },
        ],
        why: t(
          "السيليلوز فقط منفذ للماء؛ اللجنين والكيوتين والسيوبرين غير منفذة.",
          "Only cellulose is permeable; lignin, cutin and suberin are not.",
        ),
      },
    ],
    feynmanCheck: {
      prompt: t(
        "اشرح لي كأني صاحبك: النبات بيدعم نفسه إزاي بالمواد اللي بتترسب على الجدر؟",
        "Explain to me like I'm your friend: how does a plant support itself with materials deposited on cell walls?",
      ),
      keywords: [
        { id: "cellulose", label: t("السيليلوز", "Cellulose"), match: ["سيليلوز", "cellulose"] },
        { id: "lignin", label: t("اللجنين", "Lignin"), match: ["لجنين", "lignin"] },
        { id: "cutin", label: t("الكيوتين", "Cutin"), match: ["كيوتين", "cutin"] },
        { id: "suberin", label: t("السيوبرين", "Suberin"), match: ["سيوبرين", "suberin"] },
        {
          id: "perm",
          label: t("نفاذية الماء", "Water permeability"),
          match: ["منفذ", "غير منفذ", "permeable", "impermeable"],
        },
        {
          id: "strength",
          label: t("القوة والصلابة / المرونة", "Strength, rigidity / flexibility"),
          match: ["صلابة", "قوة", "مرونة", "rigid", "strength", "flexib"],
        },
        {
          id: "loss",
          label: t("منع فقد الماء", "Preventing water loss"),
          match: ["فقد الماء", "water loss", "يمنع"],
        },
      ],
      model: t(
        "الكيوتين على البشرة من برّه والسيوبرين في الفلين، الاتنين غير منفذين فبيمنعوا فقد الماء. السيليلوز منفذ للماء وبيدي قوة ومرونة زي الكولنشيمي. واللجنين غير منفذ وبيترسب من جوه ويدي قوة وصلابة للإسكرلنشيمي والخشب.",
        "Cutin on the outside of the epidermis and suberin in cork are impermeable, so they stop water loss. Cellulose is permeable and gives strength and flexibility (collenchyma). Lignin is impermeable, deposited inside, giving strength and rigidity to sclerenchyma and xylem.",
      ),
    },
    microQuiz: [
      {
        id: "b2-q1",
        block: 2,
        prompt: t("السيوبرين بيترسب في أنهي نسيج؟", "Suberin is deposited in which tissue?"),
        options: [o("الفلين", "Cork"), o("الكولنشيمي", "Collenchyma"), o("الخشب", "Xylem")],
        correct: 0,
        explain: t(
          "السيوبرين مادة غير منفذة للماء بتترسب في خلايا الفلين غير الحية وتمنع نفاذ الماء من الأنسجة الداخلية.",
          "Suberin is an impermeable material deposited in non-living cork cells; it stops water leaving the inner tissues.",
        ),
      },
      {
        id: "b2-q2",
        block: 2,
        prompt: t(
          "ساق الفول (نبات عشبي) بتتميز بإيه؟",
          "What characterises the stem of a faba bean (a herbaceous plant)?",
        ),
        options: [
          o("غضة ومرنة وخضراء ونسبة الخشب فيها قليلة", "Soft, flexible, green, with little xylem"),
          o("صلبة وبنية ونسبة الخشب فيها كبيرة", "Hard, brown, with much xylem"),
          o("ليها طبقة فلين خارجية سميكة", "A thick outer cork layer"),
        ],
        correct: 0,
        explain: t(
          "الساق العشبي (الفول والملوخية) غض ومرن وأخضر ونسبة الخشب فيه قليلة؛ الصلب البني الكثير الخشب هو الساق الخشبي.",
          "Herbaceous stems (faba bean, molokhia) are soft, flexible, green with little xylem; hard brown stems rich in xylem are woody.",
        ),
      },
      {
        id: "b2-q3",
        block: 2,
        prompt: t(
          "المادة المؤشر عليها بتترسب على جدر البشرة من الخارج، ودورها إيه؟",
          "The marked material is deposited on the outside of epidermal walls. What does it do?",
        ),
        options: [
          o("تمنع فقد الماء لأنها غير منفذة", "Prevents water loss because it is impermeable"),
          o("تدي مرونة لأنها منفذة للماء", "Gives flexibility because it is permeable"),
          o("تدي صلابة للأوعية الخشبية", "Makes the xylem vessels rigid"),
        ],
        correct: 0,
        explain: t(
          "الكيوتين مادة غير منفذة للماء بتترسب على جدر البشرة من الخارج وتمنع فقد الماء.",
          "Cutin is an impermeable material deposited on the outside of epidermal walls to prevent water loss.",
        ),
        visual: { figure: "stem-section", mark: "cutin" },
      },
    ],
  },

  /* ------------------------------------------------------------------ 3 */
  {
    n: 3,
    emoji: "🦴",
    titleEn: "Support in humans and the skeletal system",
    hookQuestion: {
      question: t(
        "طفل لسه مولود: عدد عظامه أكتر ولا أقل من شخص بالغ؟",
        "A newborn baby: does he have more or fewer bones than an adult?",
      ),
      options: [
        t("أقل، لأنه لسه صغير", "Fewer, because he is small"),
        t("نفس العدد، 206 عظمة", "The same, 206 bones"),
        t("أكتر من البالغ", "More than an adult"),
      ],
      correct: 2,
      reveal: t(
        "الطفل حديث الولادة عنده تقريباً 270 إلى 300 عظمة، وبعض العظام بتلتحم مع النمو لحد ما يوصل 206 عند البالغ.",
        "A newborn has roughly 270–300 bones; some fuse with growth until the adult has 206.",
      ),
    },
    simpleExplanation: {
      paragraphs: [
        t(
          "الجهاز الهيكلي بيدعم الجسم وبيحمي بعض أعضائه وبيساهم في الحركة وبيدي الإنسان شكله المميز.",
          "The skeletal system supports the body, protects some organs, helps movement and gives the human body its characteristic shape.",
        ),
        t(
          "الجهاز الهيكلي مكوّن من 5 حاجات: الهيكل العظمي، الغضاريف، المفاصل (ليفية وغضروفية وزلالية)، الأربطة، والأوتار.",
          "It has five components: the skeleton, cartilages, joints (fibrous, cartilaginous, synovial), ligaments and tendons.",
        ),
        t(
          "الهيكل العظمي للبالغ 206 عظمة، وكل عظمة شكلها وحجمها مناسبين لوظيفتها. وبيتقسم لهيكل محوري (عمود فقري وجمجمة وقفص صدري) وهيكل طرفي (الحزامين والطرفين).",
          "An adult skeleton has 206 bones, each with a shape and size suiting its job. It splits into the axial skeleton (vertebral column, skull, thoracic cage) and the appendicular skeleton (girdles and limbs).",
        ),
        t(
          "الطفل بيتولد بـ 270–300 عظمة، ومع النمو بتلتحم العجزية في عظمة واحدة، والعصعصية في عظمة واحدة، وعظام الجزء المخي للجمجمة.",
          "A baby is born with 270–300 bones; with growth the sacral vertebrae fuse into one bone, the coccygeal into one, and the cranial bones fuse.",
        ),
      ],
      imagine: t(
        "تخيل (تشبيه): الطفل زي فرقة فيها لاعيبة كتير في أول الموسم، ومع الوقت بعضهم بيندمج في خانة واحدة لحد ما الفريق يستقر على 206.",
        "Imagine (an analogy): a newborn is like a squad with many small pieces that, over time, merge into larger ones until the final count is 206.",
      ),
      examples: [
        t(
          "العجز عند البالغ عظمة واحدة، لكن أصله فقرات ملتحمة.",
          "The adult sacrum is one bone that came from fused vertebrae.",
        ),
        t(
          "الهيكل كله بيدّي الشكل المميز للإنسان وبيحمي أعضاء زي المخ.",
          "The skeleton gives the typical human shape and protects organs.",
        ),
      ],
      terms: [
        { ar: "الجهاز الهيكلي", en: "Skeletal system" },
        { ar: "الهيكل العظمي", en: "Skeleton" },
        { ar: "الهيكل المحوري", en: "Axial skeleton" },
        { ar: "الهيكل الطرفي", en: "Appendicular skeleton" },
        { ar: "الغضاريف", en: "Cartilages" },
        { ar: "الأربطة", en: "Ligaments" },
        { ar: "الأوتار", en: "Tendons" },
        { ar: "الالتحام", en: "Fusion" },
      ],
    },
    examTrap: {
      claim: t(
        "الطفل حديث الولادة عنده 206 عظمة زيه زي البالغ.",
        "A newborn has 206 bones, just like an adult.",
      ),
      truth: t(
        "الطفل حديث الولادة عنده تقريباً 270–300 عظمة، وبعض العظام بتلتحم مع النمو ليبقى عدد عظام البالغ 206.",
        "A newborn has roughly 270–300 bones; some fuse with growth so that the adult has 206.",
      ),
      probes: [
        {
          id: "b3-p1",
          label: t("عدّ عظام الطفل", "Count the newborn's bones"),
          result: t("تقريباً من 270 إلى 300 عظمة، مش 206!", "Roughly 270 to 300 bones, not 206!"),
          verdict: "bad",
        },
        {
          id: "b3-p2",
          label: t("عدّ عظام البالغ", "Count the adult's bones"),
          result: t("206 عظمة بعد الالتحام.", "206 bones after fusion."),
          verdict: "ok",
        },
        {
          id: "b3-p3",
          label: t("شوف إيه اللي اتحم", "See what fused"),
          result: t(
            "الفقرات العجزية، الفقرات العصعصية، وعظام الجزء المخي للجمجمة.",
            "The sacral vertebrae, the coccygeal vertebrae and the cranial bones.",
          ),
          verdict: "info",
          highlight: ["sacrum", "cranial-bones"],
        },
      ],
    },
    tasks: [
      {
        kind: "numeric",
        id: "b3-t1",
        prompt: t(
          "كام عظمة في الهيكل العظمي للإنسان البالغ؟",
          "How many bones in an adult human skeleton?",
        ),
        answer: 206,
        unit: t("عظمة", "bones"),
        why: t(
          "يتكون الهيكل العظمي في الإنسان البالغ من 206 عظمة.",
          "The adult human skeleton has 206 bones.",
        ),
      },
      {
        kind: "match",
        id: "b3-t2",
        title: t("محوري ولا طرفي؟", "Axial or appendicular?"),
        items: [
          { id: "i1", prompt: t("العمود الفقري", "Vertebral column"), answer: "axial" },
          { id: "i2", prompt: t("الجمجمة", "Skull"), answer: "axial" },
          { id: "i3", prompt: t("القفص الصدري", "Thoracic cage"), answer: "axial" },
          {
            id: "i4",
            prompt: t("الحزام الصدري والطرفان العلويان", "Pectoral girdle and upper limbs"),
            answer: "appendicular",
          },
          {
            id: "i5",
            prompt: t("الحزام الحوضي والطرفان السفليان", "Pelvic girdle and lower limbs"),
            answer: "appendicular",
          },
        ],
        options: [
          { id: "axial", label: t("الهيكل المحوري", "Axial skeleton") },
          { id: "appendicular", label: t("الهيكل الطرفي", "Appendicular skeleton") },
        ],
        why: t(
          "المحوري: العمود الفقري والجمجمة والقفص الصدري. الطرفي: الحزام الصدري والطرفان العلويان، والحزام الحوضي والطرفان السفليان.",
          "Axial: vertebral column, skull, thoracic cage. Appendicular: pectoral girdle with upper limbs, pelvic girdle with lower limbs.",
        ),
      },
      {
        kind: "pick",
        id: "b3-t3",
        prompt: t(
          "أنهي عظام من دول اتحمت مع النمو حسب الكتاب؟",
          "Which of these bones fuse with growth according to the book?",
        ),
        options: ["sacrum", "clavicle", "femur", "humerus"],
        answer: "sacrum",
        why: t(
          "الكتاب ذكر التحام الفقرات العجزية في عظمة واحدة، والعصعصية، وعظام الجزء المخي للجمجمة.",
          "The book mentions fusion of the sacral vertebrae into one bone, the coccygeal ones, and the cranial bones.",
        ),
        wrongWhy: {
          clavicle: t(
            "الترقوة مش من العظام اللي ذكر الكتاب التحامها؛ اللي بيلتحم العجزية والعصعصية وعظام الجزء المخي.",
            "The clavicle is not among the bones the book says fuse; those are the sacral, coccygeal and cranial bones.",
          ),
          femur: t(
            "الفخذ مش من العظام المذكورة في الالتحام؛ الكتاب ذكر العجزية والعصعصية وعظام الجزء المخي بس.",
            "The femur is not listed; the book names only the sacral, coccygeal and cranial bones.",
          ),
          humerus: t(
            "العضد مش من العظام المذكورة في الالتحام؛ الكتاب ذكر العجزية والعصعصية وعظام الجزء المخي بس.",
            "The humerus is not listed; the book names only the sacral, coccygeal and cranial bones.",
          ),
        },
      },
      {
        kind: "numeric",
        id: "b3-t4",
        prompt: t(
          "الجهاز الهيكلي مكوّن من كام مكوّن (هيكل عظمي، غضاريف، مفاصل…)؟",
          "How many components make up the skeletal system (skeleton, cartilages, joints…)?",
        ),
        answer: 5,
        why: t(
          "المكونات: الهيكل العظمي، الغضاريف، المفاصل، الأربطة، الأوتار = 5.",
          "Components: skeleton, cartilages, joints, ligaments, tendons = 5.",
        ),
      },
    ],
    feynmanCheck: {
      prompt: t(
        "اشرح لي كأني صاحبك: ليه الطفل عنده عظام أكتر من البالغ؟",
        "Explain to me like I'm your friend: why does a baby have more bones than an adult?",
      ),
      keywords: [
        { id: "n206", label: t("206 عظمة", "206 bones"), match: ["206", "٢٠٦"] },
        { id: "n300", label: t("270–300 عظمة", "270–300 bones"), match: ["270", "300"] },
        {
          id: "fusion",
          label: t("الالتحام", "Fusion"),
          match: ["التحام", "تلتحم", "fuse", "fusion"],
        },
        {
          id: "sacral",
          label: t("الفقرات العجزية", "Sacral vertebrae"),
          match: ["عجزي", "sacral", "sacrum"],
        },
        {
          id: "coccyx",
          label: t("الفقرات العصعصية", "Coccygeal vertebrae"),
          match: ["عصعص", "coccyg", "coccyx"],
        },
        {
          id: "cranial",
          label: t("الجزء المخي للجمجمة", "Cranial bones"),
          match: ["جزء المخي", "المخي", "cranial"],
        },
        { id: "growth", label: t("النمو", "Growth"), match: ["نمو", "بلوغ", "growth", "adult"] },
      ],
      model: t(
        "الطفل بيتولد بحوالي 270 لـ 300 عظمة. مع النمو والبلوغ بعض العظام بتلتحم: الفقرات العجزية تبقى عظمة واحدة، والعصعصية عظمة واحدة، وعظام الجزء المخي للجمجمة. فعدد عظام البالغ يبقى 206.",
        "A baby is born with about 270–300 bones. With growth some bones fuse: the sacral vertebrae become one bone, the coccygeal one bone, and the cranial bones fuse. So the adult has 206.",
      ),
    },
    microQuiz: [
      {
        id: "b3-q1",
        block: 3,
        prompt: t(
          "أنهي جزء من دول من الهيكل المحوري؟",
          "Which of these belongs to the axial skeleton?",
        ),
        options: [o("لوح الكتف", "Scapula"), o("الجمجمة", "Skull"), o("الفخذ", "Femur")],
        correct: 1,
        explain: t(
          "الهيكل المحوري: العمود الفقري والجمجمة والقفص الصدري. لوح الكتف والفخذ من الهيكل الطرفي.",
          "The axial skeleton: vertebral column, skull, thoracic cage. Scapula and femur are appendicular.",
        ),
      },
      {
        id: "b3-q2",
        block: 3,
        prompt: t(
          "إيه سبب نقص عدد العظام من الطفل للبالغ؟",
          "Why does the number of bones fall from the child to the adult?",
        ),
        options: [
          o("بعض العظام بتلتحم مع النمو", "Some bones fuse with growth"),
          o("بعض العظام بتختفي مع الوقت", "Some bones disappear with time"),
          o("العظام الصغيرة بتتحول لأربطة", "Small bones turn into ligaments"),
        ],
        correct: 0,
        explain: t(
          "مع النمو والبلوغ تلتحم بعض العظام (العجزية والعصعصية وعظام الجزء المخي) فيبقى العدد 206.",
          "With growth and puberty some bones fuse (sacral, coccygeal, cranial) leaving 206.",
        ),
      },
      {
        id: "b3-q3",
        block: 3,
        prompt: t(
          "أنهي حاجة من دول مش من مكونات الجهاز الهيكلي حسب الكتاب؟",
          "Which of these is not a component of the skeletal system according to the book?",
        ),
        options: [o("الأوتار", "Tendons"), o("الأربطة", "Ligaments"), o("الأوردة", "Veins")],
        correct: 2,
        explain: t(
          "مكونات الجهاز الهيكلي: الهيكل العظمي والغضاريف والمفاصل والأربطة والأوتار.",
          "Components: skeleton, cartilages, joints, ligaments and tendons.",
        ),
      },
    ],
  },

  /* ------------------------------------------------------------------ 4 */
  {
    n: 4,
    emoji: "🔢",
    titleEn: "Numerical distribution of the skeleton (front and back views)",
    hookQuestion: {
      question: t(
        "أنهي هيكل فيه عظام أكتر: المحوري ولا الطرفي؟",
        "Which has more bones: the axial or the appendicular skeleton?",
      ),
      options: [
        t("المحوري", "Axial"),
        t("الطرفي", "Appendicular"),
        t("العدد واحد في الاتنين", "Equal in both"),
      ],
      correct: 1,
      reveal: t(
        "الطرفي 126 عظمة والمحوري 80 عظمة، ومجموعهم 206.",
        "Appendicular has 126 bones and axial 80; together 206.",
      ),
    },
    simpleExplanation: {
      paragraphs: [
        t(
          "الهيكل المحوري = 80 عظمة: الجمجمة وعظامها الملحقة 29 + القفص الصدري 25 + العمود الفقري 26.",
          "Axial = 80 bones: skull with its attached bones 29 + thoracic cage 25 + vertebral column 26.",
        ),
        t(
          "الجمجمة 29 = الجزء المخي 8 + الوجهي 14 + العظيمات السمعية 6 (2×3) + العظم اللامي 1. والقفص الصدري 25 = القص 1 + الضلوع 24.",
          "Skull 29 = cranial 8 + facial 14 + ossicles 6 (2×3) + hyoid 1. Thoracic cage 25 = sternum 1 + ribs 24.",
        ),
        t(
          "الهيكل الطرفي = 126: الحزام الصدري 4 + الطرفان العلويان 60 + الحزام الحوضي 2 + الطرفان السفليان 60.",
          "Appendicular = 126: pectoral girdle 4 + upper limbs 60 + pelvic girdle 2 + lower limbs 60.",
        ),
        t(
          "في رسم الهيكل الأمامي، العظيمات السمعية والعظم اللامي مظللة بالرمادي وتنبيه الكتاب بيقول إنها «للاطلاع فقط».",
          "In the front-view drawing the ossicles and hyoid are shaded grey, and the book's note says they are for information only.",
        ),
      ],
      imagine: t(
        "تخيل (تشبيه): دفتر حسابات بخانتين: خانة المحوري 80 وخانة الطرفي 126، ولما تجمعهم بيطلع الإجمالي 206.",
        "Imagine (an analogy): a ledger with two columns: axial 80 and appendicular 126; the total is 206.",
      ),
      examples: [
        t(
          "الطرف العلوي الواحد: عضد + كعبرة + زند + رسغ 8 + راحة 5 + سلاميات 14 = 30، وللاتنين 60.",
          "One upper limb: humerus + radius + ulna + wrist 8 + palm 5 + phalanges 14 = 30, so 60 for both.",
        ),
        t(
          "الطرف السفلي الواحد: فخذ + رضفة + قصبة + شظية + رسغ 7 + مشط 5 + سلاميات 14 = 30، وللاتنين 60.",
          "One lower limb: femur + patella + tibia + fibula + ankle 7 + metatarsals 5 + phalanges 14 = 30, so 60 for both.",
        ),
      ],
      terms: [
        { ar: "الهيكل المحوري", en: "Axial skeleton" },
        { ar: "الهيكل الطرفي", en: "Appendicular skeleton" },
        { ar: "العظيمات السمعية", en: "Auditory ossicles" },
        { ar: "العظم اللامي", en: "Hyoid bone" },
        { ar: "عظمة القص", en: "Sternum" },
        { ar: "الحزام الصدري", en: "Pectoral girdle" },
        { ar: "الحزام الحوضي", en: "Pelvic girdle" },
      ],
    },
    examTrap: {
      claim: t(
        "الجمجمة 22 عظمة بس (8 مخي + 14 وجهي).",
        "The skull is just 22 bones (8 cranial + 14 facial).",
      ),
      truth: t(
        "الكتاب بيعد الجمجمة وعظامها الملحقة 29 عظمة: 8 + 14 + 6 عظيمات سمعية + العظم اللامي. العظيمات والعظم اللامي مظللة «للاطلاع فقط» في الرسم.",
        "The book counts the skull with attached bones as 29: 8 + 14 + 6 ossicles + hyoid. In the figure the ossicles and hyoid are shaded 'for information only'.",
      ),
      probes: [
        {
          id: "b4-p1",
          label: t("عدّ المخي + الوجهي", "Count cranial + facial"),
          result: t(
            "8 + 14 = 22، لكن ده مش رقم الكتاب للجمجمة وعظامها الملحقة!",
            "8 + 14 = 22, but that is not the book's figure for the skull with its attached bones!",
          ),
          verdict: "bad",
          highlight: ["cranial-bones", "facial-bones"],
        },
        {
          id: "b4-p2",
          label: t("ضيف العظيمات السمعية", "Add the ossicles"),
          result: t(
            "2 × 3 = 6 عظيمات في الأذنين، يعني 28.",
            "2 × 3 = 6 ossicles in both ears, so 28.",
          ),
          verdict: "info",
        },
        {
          id: "b4-p3",
          label: t("ضيف العظم اللامي", "Add the hyoid"),
          result: t("العظم اللامي 1 فيبقى 29 عظمة.", "The hyoid adds 1, giving 29 bones."),
          verdict: "ok",
          highlight: ["hyoid"],
        },
        {
          id: "b4-p4",
          label: t("اجمع المحوري", "Sum the axial"),
          result: t("29 + 25 + 26 = 80 عظمة.", "29 + 25 + 26 = 80 bones."),
          verdict: "ok",
        },
      ],
    },
    tasks: [
      {
        kind: "numeric",
        id: "b4-t1",
        prompt: t(
          "كام عظمة في الهيكل المحوري (جمجمة 29 + قفص صدري 25 + عمود فقري 26)؟",
          "How many bones in the axial skeleton (skull 29 + thoracic cage 25 + vertebral column 26)?",
        ),
        answer: 80,
        unit: t("عظمة", "bones"),
        why: t(
          "29 + 25 + 26 = 80 عظمة في الهيكل المحوري.",
          "29 + 25 + 26 = 80 bones in the axial skeleton.",
        ),
      },
      {
        kind: "numeric",
        id: "b4-t2",
        prompt: t(
          "كام عظمة في الهيكل الطرفي (حزام صدري 4 + طرفان علويان 60 + حزام حوضي 2 + طرفان سفليان 60)؟",
          "How many bones in the appendicular skeleton (pectoral girdle 4 + upper limbs 60 + pelvic girdle 2 + lower limbs 60)?",
        ),
        answer: 126,
        unit: t("عظمة", "bones"),
        why: t(
          "4 + 60 + 2 + 60 = 126 عظمة، و80 + 126 = 206.",
          "4 + 60 + 2 + 60 = 126 bones, and 80 + 126 = 206.",
        ),
      },
      {
        kind: "label",
        id: "b4-t3",
        figure: "skeleton-front",
        title: t("سمّي عظام المنظر الأمامي", "Name the bones of the front view"),
        parts: [
          "skull",
          "clavicle",
          "sternum",
          "ribs",
          "vertebral-column",
          "humerus",
          "radius",
          "ulna",
          "hip-bone",
          "femur",
          "patella",
          "tibia",
          "fibula",
        ],
      },
      {
        kind: "label",
        id: "b4-t4",
        figure: "skeleton-back",
        title: t("سمّي عظام المنظر الخلفي", "Name the bones of the back view"),
        parts: [
          "cranial-part",
          "cervical",
          "scapula",
          "thoracic",
          "lumbar",
          "sacral",
          "coccygeal",
          "pelvic-girdle",
          "calcaneus",
        ],
      },
    ],
    feynmanCheck: {
      prompt: t(
        "اشرح لي كأني صاحبك: إزاي الـ 206 عظمة بيتوزعوا على الهيكل المحوري والطرفي؟",
        "Explain to me like I'm your friend: how are the 206 bones split between the axial and appendicular skeletons?",
      ),
      keywords: [
        { id: "axial", label: t("الهيكل المحوري", "Axial"), match: ["محوري", "axial"] },
        {
          id: "append",
          label: t("الهيكل الطرفي", "Appendicular"),
          match: ["طرفي", "appendicular"],
        },
        { id: "n80", label: t("80", "80"), match: ["80", "ثمانين"] },
        { id: "n126", label: t("126", "126"), match: ["126", "١٢٦"] },
        { id: "skull29", label: t("الجمجمة 29", "Skull 29"), match: ["29", "٢٩"] },
        {
          id: "ossicles",
          label: t("العظيمات السمعية", "Ossicles"),
          match: ["عظيمات", "سمعية", "ossicle", "auditory"],
        },
        { id: "hyoid", label: t("العظم اللامي", "Hyoid"), match: ["لامي", "hyoid"] },
      ],
      model: t(
        "الهيكل المحوري 80 عظمة: الجمجمة وملحقاتها 29 (8 مخي + 14 وجهي + 6 عظيمات سمعية + العظم اللامي) + القفص الصدري 25 + العمود الفقري 26. والطرفي 126، يعني المجموع 206.",
        "Axial is 80: skull with attached bones 29 (8 cranial + 14 facial + 6 ossicles + hyoid) + thoracic cage 25 + vertebral column 26. Appendicular is 126, so the total is 206.",
      ),
    },
    microQuiz: [
      {
        id: "b4-q1",
        block: 4,
        prompt: t(
          "كام عظمة في القفص الصدري ضمن الهيكل المحوري؟",
          "How many bones does the thoracic cage have within the axial skeleton?",
        ),
        options: [o("12", "12"), o("25", "25"), o("37", "37")],
        correct: 1,
        explain: t(
          "القفص الصدري = عظمة القص (1) + الضلوع (24) = 25. أما 37 فهي مع الفقرات الصدرية الـ 12.",
          "Thoracic cage = sternum (1) + ribs (24) = 25. The figure 37 includes the 12 thoracic vertebrae.",
        ),
      },
      {
        id: "b4-q2",
        block: 4,
        prompt: t("الحزام الصدري يتكون من كام عظمة؟", "How many bones form the pectoral girdle?"),
        options: [o("2", "2"), o("4", "4"), o("6", "6")],
        correct: 1,
        explain: t(
          "الحزام الصدري = ترقوتان (2) + لوحا كتف (2) = 4 عظام.",
          "Pectoral girdle = 2 clavicles + 2 scapulae = 4 bones.",
        ),
      },
      {
        id: "b4-q3",
        block: 4,
        prompt: t(
          "الجمجمة بعظامها الملحقة بتتحسب كام عظمة في الهيكل المحوري؟",
          "How many bones is the skull with its attached bones in the axial skeleton?",
        ),
        options: [o("14", "14"), o("22", "22"), o("29", "29")],
        correct: 2,
        explain: t(
          "8 مخي + 14 وجهي + 6 عظيمات سمعية + 1 عظم لامي = 29 عظمة.",
          "8 cranial + 14 facial + 6 ossicles + 1 hyoid = 29 bones.",
        ),
        visual: { figure: "skeleton-front", mark: "skull" },
      },
    ],
  },

  /* ------------------------------------------------------------------ 5 */
  {
    n: 5,
    emoji: "🧬",
    titleEn: "The axial skeleton: the vertebral column and its five groups",
    hookQuestion: {
      question: t(
        "العمود الفقري فيه 33 فقرة. طيب بنعدّه كام عظمة؟",
        "The vertebral column has 33 vertebrae. How many bones is it counted as?",
      ),
      options: [t("33 عظمة", "33 bones"), t("26 عظمة", "26 bones"), t("24 عظمة", "24 bones")],
      correct: 1,
      reveal: t(
        "26 عظمة، لأن الخمس فقرات العجزية بتلتحم في عظمة، والأربع العصعصية في عظمة.",
        "26 bones, because the 5 sacral vertebrae fuse into one bone and the 4 coccygeal ones into one.",
      ),
    },
    simpleExplanation: {
      paragraphs: [
        t(
          "العمود الفقري محور الهيكل: طرفه العلوي متصل بالجمجمة، ويتصل بيه القفص الصدري والطرفان العلويان، ومن تحت الطرفان السفليان بالحوض.",
          "The vertebral column is the axis of the skeleton: its top joins the skull, the thoracic cage and upper limbs attach to it, and below it the lower limbs attach via the hip bones.",
        ),
        t(
          "33 فقرة في 5 مجموعات: عنقية 7 (رقم 1–7)، صدرية 12 (8–19)، قطنية 5 (20–24)، عجزية 5 (25–29 ملتحمة في عظمة)، عصعصية 4 (30–33 ملتحمة في عظمة).",
          "33 vertebrae in 5 groups: cervical 7 (1–7), thoracic 12 (8–19), lumbar 5 (20–24), sacral 5 (25–29, fused into one bone), coccygeal 4 (30–33, fused into one bone).",
        ),
        t(
          "فيه 4 انحناءات: العنقية للأمام، الصدرية للخلف، القطنية للأمام، والعجزية والعصعصية للخلف.",
          "There are four curves: cervical forward, thoracic backward, lumbar forward, sacral and coccygeal backward.",
        ),
        t(
          "الفقرة العنقية الأولى شكلها غير الثانية، وكل واحدة منهم تختلف عن الخمس الباقيين اللي بيتشابهوا. والفقرة المنصفة للعنق رقم 4، وللعمود كله رقم 17.",
          "The 1st cervical vertebra differs from the 2nd and both differ from the other five, which are alike. The middle of the neck is no. 4, of the whole column no. 17.",
        ),
      ],
      imagine: t(
        "تخيل (تشبيه): العمود الفقري زي سلسلة حلقات 33 حلقة، آخر 9 حلقات منها اتلحموا في قطعتين.",
        "Imagine (an analogy): a chain of 33 rings where the last 9 are welded into two pieces.",
      ),
      examples: [
        t(
          "الفقرات القطنية أكبر الفقرات حجماً وبتواجه تجويف البطن.",
          "Lumbar vertebrae are the largest and face the abdominal cavity.",
        ),
        t(
          "العجز بين عظمتي الحرقفة في الحزام الحوضي، والعصعص في نهاية العمود الفقري.",
          "The sacrum lies between the two iliac bones of the pelvic girdle; the coccyx ends the column.",
        ),
      ],
      terms: [
        { ar: "العمود الفقري", en: "Vertebral column" },
        { ar: "الفقرات العنقية", en: "Cervical vertebrae" },
        { ar: "الفقرات الصدرية", en: "Thoracic vertebrae" },
        { ar: "الفقرات القطنية", en: "Lumbar vertebrae" },
        { ar: "الفقرات العجزية", en: "Sacral vertebrae" },
        { ar: "الفقرات العصعصية", en: "Coccygeal vertebrae" },
        { ar: "غير متمفصلة (ملتحمة)", en: "Fused (non-articulated)" },
      ],
    },
    examTrap: {
      claim: t(
        "كل الفقرات العنقية السبعة شكلها واحد.",
        "All seven cervical vertebrae have the same shape.",
      ),
      truth: t(
        "الفقرة العنقية الأولى تختلف عن الثانية، وكل منهما تختلف عن الخمس الباقية اللي بيتشابهوا مع بعض.",
        "The first cervical vertebra differs from the second, and each differs from the other five, which are alike.",
      ),
      probes: [
        {
          id: "b5-p1",
          label: t("قارن الأولى بالتانية", "Compare the 1st with the 2nd"),
          result: t("شكلهم مختلف!", "Their shapes differ!"),
          verdict: "bad",
          highlight: ["atlas", "axis"],
        },
        {
          id: "b5-p2",
          label: t("قارن الأولى بالرابعة", "Compare the 1st with the 4th"),
          result: t(
            "الأولى مختلفة عن بقية الخمسة، فشكلهم مش واحد.",
            "The 1st differs from the other five, so not all are alike.",
          ),
          verdict: "bad",
          highlight: ["atlas", "cervical-c4"],
        },
        {
          id: "b5-p3",
          label: t("قارن الرابعة بالسادسة", "Compare the 4th with the 6th"),
          result: t("الخمس الباقية (3 إلى 7) متشابهة.", "The remaining five (3 to 7) are alike."),
          verdict: "ok",
          highlight: ["cervical-c4"],
        },
      ],
    },
    tasks: [
      {
        kind: "numeric",
        id: "b5-t1",
        prompt: t("كام فقرة في العمود الفقري؟", "How many vertebrae in the vertebral column?"),
        answer: 33,
        unit: t("فقرة", "vertebrae"),
        why: t(
          "7 عنقية + 12 صدرية + 5 قطنية + 5 عجزية + 4 عصعصية = 33 فقرة.",
          "7 cervical + 12 thoracic + 5 lumbar + 5 sacral + 4 coccygeal = 33 vertebrae.",
        ),
      },
      {
        kind: "numeric",
        id: "b5-t2",
        prompt: t("كام عظمة في العمود الفقري؟", "How many bones in the vertebral column?"),
        answer: 26,
        unit: t("عظمة", "bones"),
        why: t(
          "7 + 12 + 5 + 1 (العجزية ملتحمة) + 1 (العصعصية ملتحمة) = 26 عظمة.",
          "7 + 12 + 5 + 1 (fused sacral) + 1 (fused coccygeal) = 26 bones.",
        ),
      },
      {
        kind: "pick",
        id: "b5-t3",
        prompt: t("أنهي فقرة هي المنصفة للعنق؟", "Which vertebra is the middle of the neck?"),
        options: ["cervical-c4", "atlas", "axis", "thoracic-t10"],
        answer: "cervical-c4",
        why: t(
          "الفقرة المنصفة للعنق هي الفقرة رقم 4.",
          "The middle vertebra of the neck is vertebra no. 4.",
        ),
        wrongWhy: {
          atlas: t(
            "دي الفقرة العنقية الأولى (رقم 1) وشكلها مختلف عن الباقي، مش المنصفة.",
            "That is the first cervical vertebra (no. 1), differently shaped, not the middle one.",
          ),
          axis: t(
            "دي الفقرة العنقية الثانية (رقم 2)، المنصفة للعنق هي رقم 4.",
            "That is the second cervical vertebra (no. 2); the middle of the neck is no. 4.",
          ),
          "thoracic-t10": t(
            "دي الصدرية العاشرة (رقم 17) وهي منصفة العمود الفقري كله مش العنق.",
            "That is the 10th thoracic (no. 17), the middle of the whole column, not of the neck.",
          ),
        },
      },
      {
        kind: "match",
        id: "b5-t4",
        title: t("انحناءات العمود الفقري", "The curves of the column"),
        items: [
          { id: "i1", prompt: t("الفقرات العنقية", "Cervical"), answer: "forward" },
          { id: "i2", prompt: t("الفقرات الصدرية", "Thoracic"), answer: "backward" },
          { id: "i3", prompt: t("الفقرات القطنية", "Lumbar"), answer: "forward" },
          { id: "i4", prompt: t("العجزية والعصعصية", "Sacral and coccygeal"), answer: "backward" },
        ],
        options: [
          { id: "forward", label: t("انحناء للأمام", "Curves forward") },
          { id: "backward", label: t("انحناء للخلف", "Curves backward") },
        ],
        why: t(
          "العنقية والقطنية للأمام، والصدرية والعجزية والعصعصية للخلف.",
          "Cervical and lumbar curve forward; thoracic, sacral and coccygeal curve backward.",
        ),
      },
    ],
    feynmanCheck: {
      prompt: t(
        "اشرح لي كأني صاحبك: العمود الفقري فيه كام فقرة وكام عظمة وليه الرقمين مختلفين؟",
        "Explain to me like I'm your friend: how many vertebrae and how many bones does the column have, and why do the two numbers differ?",
      ),
      keywords: [
        { id: "n33", label: t("33 فقرة", "33 vertebrae"), match: ["33", "٣٣"] },
        { id: "n26", label: t("26 عظمة", "26 bones"), match: ["26", "٢٦"] },
        { id: "sacral", label: t("العجزية (5)", "Sacral (5)"), match: ["عجزي", "sacral"] },
        { id: "coccyx", label: t("العصعصية (4)", "Coccygeal (4)"), match: ["عصعص", "coccyg"] },
        { id: "fuse", label: t("الالتحام", "Fusion"), match: ["ملتحم", "التحام", "fuse", "fused"] },
        {
          id: "groups",
          label: t("5 مجموعات", "5 groups"),
          match: ["مجموعات", "groups", "عنقي", "cervical"],
        },
        { id: "curves", label: t("الانحناءات", "Curves"), match: ["انحناء", "curve"] },
      ],
      model: t(
        "العمود الفقري 33 فقرة في 5 مجموعات: 7 عنقية و12 صدرية و5 قطنية و5 عجزية و4 عصعصية. الخمس عجزية بيلتحموا في عظمة، والأربع عصعصية في عظمة، فبنعده 26 عظمة.",
        "The column has 33 vertebrae in 5 groups: 7 cervical, 12 thoracic, 5 lumbar, 5 sacral and 4 coccygeal. The 5 sacral fuse into one bone and the 4 coccygeal into one, so it is counted as 26 bones.",
      ),
    },
    microQuiz: [
      {
        id: "b5-q1",
        block: 5,
        prompt: t(
          "الجزء المؤشر عليه فيه كام فقرة وبيتحسب كام عظمة؟",
          "The marked region has how many vertebrae, and counts as how many bones?",
        ),
        options: [
          o("5 فقرات، عظمة واحدة ملتحمة", "5 vertebrae, one fused bone"),
          o("5 فقرات، 5 عظام", "5 vertebrae, 5 bones"),
          o("4 فقرات، عظمة واحدة", "4 vertebrae, one bone"),
        ],
        correct: 0,
        explain: t(
          "الفقرات العجزية 5 ملتحمة في عظمة واحدة (رقم 25 إلى 29)، والعصعصية 4 في عظمة.",
          "The 5 sacral vertebrae (nos. 25–29) fuse into one bone; the 4 coccygeal vertebrae fuse into one bone.",
        ),
        visual: { figure: "spine", mark: "sacral" },
      },
      {
        id: "b5-q2",
        block: 5,
        prompt: t(
          "أنهي فقرة هي المنصفة للعمود الفقري كله عددياً؟",
          "Which vertebra is the numerical middle of the whole column?",
        ),
        options: [
          o("رقم 4", "No. 4"),
          o("رقم 17 (الصدرية العاشرة)", "No. 17 (10th thoracic)"),
          o("رقم 24", "No. 24"),
        ],
        correct: 1,
        explain: t(
          "المنصفة للعمود عددياً هي رقم 17 (الصدرية العاشرة)، أما رقم 4 فمنصفة العنق.",
          "The numerical middle of the column is no. 17 (10th thoracic); no. 4 is the middle of the neck.",
        ),
      },
      {
        id: "b5-q3",
        block: 5,
        prompt: t("أنهي مجموعتين من دول انحناؤهم للأمام؟", "Which two groups curve forward?"),
        options: [
          o("العنقية والقطنية", "Cervical and lumbar"),
          o("الصدرية والعجزية", "Thoracic and sacral"),
          o("العنقية والعجزية", "Cervical and sacral"),
        ],
        correct: 0,
        explain: t(
          "انحناء العنقية والقطنية للأمام، وانحناء الصدرية والعجزية والعصعصية للخلف.",
          "Cervical and lumbar curve forward; thoracic, sacral and coccygeal curve backward.",
        ),
      },
      {
        id: "b5-q4",
        block: 5,
        prompt: t(
          "حجم الفقرات المتمفصلة بيزيد تدريجياً من الأولى لحد أنهي فقرة؟",
          "The articulated vertebrae grow gradually from the first up to which vertebra?",
        ),
        options: [
          o("آخر صدرية (رقم 19)", "Last thoracic (no. 19)"),
          o("آخر قطنية (رقم 24)", "Last lumbar (no. 24)"),
          o("العجزية الأولى (رقم 25)", "First sacral (no. 25)"),
        ],
        correct: 1,
        explain: t(
          "حجم الفقرات المتمفصلة يزداد من الفقرة رقم 1 وحتى آخر فقرة قطنية (رقم 24)، ثم يقل في الملتحمة.",
          "The articulated vertebrae enlarge from no. 1 to the last lumbar (no. 24); the fused ones then decrease.",
        ),
      },
    ],
  },

  /* ------------------------------------------------------------------ 6 */
  {
    n: 6,
    emoji: "🧩",
    titleEn: "Structure of a typical vertebra and functions of the vertebral column",
    hookQuestion: {
      question: t(
        "الحبل الشوكي بيمتد جوه أنهي جزء من الفقرة؟",
        "Inside which part of the vertebra does the spinal cord run?",
      ),
      options: [
        t("جسم الفقرة السميك", "The thick body"),
        t(
          "القناة العصبية اللي تحيط بيها الحلقة الشوكية",
          "The neural canal enclosed by the neural ring",
        ),
        t("النتوء الشوكي", "The spinous process"),
      ],
      correct: 1,
      reveal: t(
        "الحبل الشوكي بيمتد في القناة العصبية اللي بتحيط بيها الحلقة الشوكية (العصبية) لحمايته.",
        "The spinal cord runs in the neural canal surrounded by the neural ring, which protects it.",
      ),
    },
    simpleExplanation: {
      paragraphs: [
        t(
          "الفقرة النموذجية (قطنية): جسم الفقرة هو الجزء الأمامي السميك، وخلفه الحلقة الشوكية (العصبية) اللي بتحيط بالقناة العصبية اللي فيها الحبل الشوكي.",
          "A typical (lumbar) vertebra: the body is the thick front part; behind it is the neural ring surrounding the neural canal that holds the spinal cord.",
        ),
        t(
          "النتوء الشوكي زائدة خلفية مائلة لأسفل تحملها الحلقة الشوكية، والنتوءان المستعرضان زائدتان تتصلان بالجسم من الجانبين.",
          "The spinous process is a backward process sloping down, carried by the neural ring; the two transverse processes join the body at its sides.",
        ),
        t(
          "الفقرة فيها 7 نتوءات: 3 أزواج (مستعرضان + مفصليان علويان + مفصليان سفليان) + نتوء شوكي مفرد. والفقرات بتتمفصل بالنتوءات المفصلية.",
          "A vertebra has 7 processes: 3 pairs (transverse, superior articular, inferior articular) + one single spinous process. Vertebrae articulate through the articular processes.",
        ),
        t(
          "وظيفة العمود: دعامة رئيسية للجسم، يحمي الحبل الشوكي، ويساعد في حركة الرأس والنصف العلوي من الجسم.",
          "Functions of the column: main support of the body, protects the spinal cord, and helps movement of the head and upper half of the body.",
        ),
      ],
      imagine: t(
        "تخيل (تشبيه): الفقرة زي كرسي بحلقة وراه: جسم الفقرة هو القعدة، والحلقة وراها زي نفق صغير بيعدي فيه الحبل.",
        "Imagine (an analogy): the vertebra as a seat with a ring behind it: the body is the seat and the ring is a small tunnel through which the cord passes.",
      ),
      examples: [
        t(
          "الفقرة السفلية بتتمفصل بنتوءيها المفصليين العلويين مع النتوءين المفصليين السفليين للفقرة اللي فوقها.",
          "The lower vertebra articulates through its superior articular processes with the inferior articular processes of the vertebra above.",
        ),
        t(
          "المخ والحبل الشوكي معاً بيكونوا الجهاز العصبي المركزي.",
          "The brain and spinal cord together form the central nervous system.",
        ),
      ],
      terms: [
        { ar: "جسم الفقرة", en: "Vertebral body" },
        { ar: "النتوء الشوكي", en: "Spinous process" },
        { ar: "النتوءان المستعرضان", en: "Transverse processes" },
        { ar: "نتوء مفصلي علوي / سفلي", en: "Superior / inferior articular process" },
        { ar: "الحلقة الشوكية (العصبية)", en: "Neural ring" },
        { ar: "القناة العصبية", en: "Neural canal" },
        { ar: "الحبل الشوكي", en: "Spinal cord" },
      ],
    },
    examTrap: {
      claim: t(
        "الفقرة العنقية الأولى ليها نتوء شوكي بارز، وعدد نتوءات الفقرة 5.",
        "The first cervical vertebra has a prominent spinous process, and a vertebra has 5 processes.",
      ),
      truth: t(
        "مفيش نتوء شوكي بارز في الفقرة العنقية الأولى لتسهيل حركة الرأس. والفقرة النموذجية فيها 7 نتوءات = 3 أزواج + نتوء شوكي مفرد.",
        "The first cervical vertebra has no prominent spinous process, easing head movement. A typical vertebra has 7 processes = 3 pairs + 1 single spinous process.",
      ),
      probes: [
        {
          id: "b6-p1",
          label: t("افحص الفقرة العنقية الأولى", "Inspect the first cervical vertebra"),
          result: t(
            "مفيش نتوء شوكي بارز، عشان تتحرك الرأس بسهولة.",
            "No prominent spinous process, to ease head movement.",
          ),
          verdict: "bad",
          highlight: ["atlas"],
        },
        {
          id: "b6-p2",
          label: t("عدّ النتوءات المزدوجة", "Count the paired processes"),
          result: t(
            "3 أزواج = مستعرضان + مفصليان علويان + مفصليان سفليان = 6 نتوءات.",
            "3 pairs = transverse + superior articular + inferior articular = 6 processes.",
          ),
          verdict: "ok",
        },
        {
          id: "b6-p3",
          label: t("ضيف النتوء المفرد", "Add the single process"),
          result: t(
            "النتوء الشوكي المفرد +1 فيبقى 7 نتوءات، مش 5.",
            "The single spinous process makes 7 processes, not 5.",
          ),
          verdict: "ok",
        },
      ],
    },
    tasks: [
      {
        kind: "label",
        id: "b6-t1",
        figure: "vertebra",
        title: t("سمّي أجزاء الفقرة النموذجية", "Name the parts of the typical vertebra"),
        parts: [
          "body",
          "spinous",
          "transverse",
          "sup-articular",
          "inf-articular",
          "neural-ring",
          "neural-canal",
        ],
      },
      {
        kind: "numeric",
        id: "b6-t2",
        prompt: t(
          "كام نتوء في الفقرة العظمية النموذجية؟",
          "How many processes in a typical bony vertebra?",
        ),
        answer: 7,
        unit: t("نتوء", "processes"),
        why: t(
          "3 أزواج (مستعرضان، مفصليان علويان، مفصليان سفليان) + نتوء شوكي مفرد = 7 نتوءات.",
          "3 pairs (transverse, superior articular, inferior articular) + 1 spinous = 7 processes.",
        ),
      },
      {
        kind: "pick",
        id: "b6-t3",
        prompt: t(
          "الفقرة النموذجية في الكتاب بتتمثل بفقرة من أنهي منطقة؟",
          "The book's typical vertebra is drawn from which region?",
        ),
        options: ["lumbar-l3", "atlas", "thoracic-t10", "sacrum"],
        answer: "lumbar-l3",
        why: t(
          "الكتاب بيرسم الفقرة العظمية النموذجية على أنها فقرة قطنية.",
          "The book draws the typical bony vertebra as a lumbar vertebra.",
        ),
        wrongWhy: {
          atlas: t(
            "الفقرة العنقية الأولى شكلها مختلف وملهاش نتوء شوكي بارز، فمش هي النموذجية.",
            "The first cervical vertebra is differently shaped with no prominent spinous process, so it is not the typical one.",
          ),
          "thoracic-t10": t(
            "الكتاب سمّى الفقرة النموذجية فقرة قطنية، مش صدرية.",
            "The book calls the typical vertebra a lumbar vertebra, not a thoracic one.",
          ),
          sacrum: t(
            "العجز 5 فقرات ملتحمة في عظمة، فمش فقرة نموذجية.",
            "The sacrum is 5 fused vertebrae in one bone, so it is not a typical vertebra.",
          ),
        },
      },
      {
        kind: "match",
        id: "b6-t4",
        title: t("وصّل الجزء بوصفه", "Match each part to its description"),
        items: [
          { id: "i1", prompt: t("الجزء الأمامي السميك", "The thick front part"), answer: "body" },
          {
            id: "i2",
            prompt: t(
              "حلقة عظمية خلف الجسم تحيط بالقناة العصبية",
              "Bony ring behind the body surrounding the neural canal",
            ),
            answer: "neural-ring",
          },
          {
            id: "i3",
            prompt: t(
              "زائدة خلفية مائلة لأسفل تحملها الحلقة",
              "Backward process sloping down, carried by the ring",
            ),
            answer: "spinous",
          },
          {
            id: "i4",
            prompt: t(
              "زائدتان تتصلان بالجسم من الجانبين",
              "Two processes joined to the body at its sides",
            ),
            answer: "transverse",
          },
        ],
        options: [
          { id: "body", label: t("جسم الفقرة", "Body") },
          { id: "neural-ring", label: t("الحلقة الشوكية", "Neural ring") },
          { id: "spinous", label: t("النتوء الشوكي", "Spinous process") },
          { id: "transverse", label: t("النتوءان المستعرضان", "Transverse processes") },
        ],
        why: t(
          "ده وصف الكتاب لكل جزء من أجزاء الفقرة العظمية النموذجية.",
          "These are the book's descriptions of the parts of a typical bony vertebra.",
        ),
      },
    ],
    feynmanCheck: {
      prompt: t(
        "اشرح لي كأني صاحبك: الفقرة العظمية النموذجية متركبة من إيه وبتحمي إيه؟",
        "Explain to me like I'm your friend: what is a typical vertebra made of and what does it protect?",
      ),
      keywords: [
        { id: "body", label: t("جسم الفقرة", "Body"), match: ["جسم الفقرة", "جسم", "body"] },
        { id: "ring", label: t("الحلقة الشوكية", "Neural ring"), match: ["حلقة", "ring"] },
        { id: "canal", label: t("القناة العصبية", "Neural canal"), match: ["قناة", "canal"] },
        {
          id: "cord",
          label: t("الحبل الشوكي", "Spinal cord"),
          match: ["حبل", "spinal cord", "cord"],
        },
        { id: "spinous", label: t("النتوء الشوكي", "Spinous process"), match: ["شوكي", "spinous"] },
        {
          id: "transverse",
          label: t("النتوءان المستعرضان", "Transverse"),
          match: ["مستعرض", "transverse"],
        },
        {
          id: "articular",
          label: t("النتوءات المفصلية", "Articular processes"),
          match: ["مفصلي", "articular"],
        },
        { id: "seven", label: t("7 نتوءات", "7 processes"), match: ["7", "سبعة", "seven"] },
      ],
      model: t(
        "الفقرة ليها جسم سميك قدام، وخلفه حلقة شوكية بتحيط بالقناة العصبية اللي فيها الحبل الشوكي فتحميه. فيها نتوء شوكي مفرد ونتوءان مستعرضان ونتوءان مفصليان علويان وسفليان، يعني 7 نتوءات، والمفصلية بتتمفصل بيها الفقرات.",
        "A vertebra has a thick body in front and behind it a neural ring around the neural canal holding the spinal cord, protecting it. It has a single spinous process, two transverse, and superior and inferior articular pairs: 7 processes, with the articular ones linking vertebrae.",
      ),
    },
    microQuiz: [
      {
        id: "b6-q1",
        block: 6,
        prompt: t("النتوء الشوكي بتحمله مين؟", "What carries the spinous process?"),
        options: [
          o("جسم الفقرة", "The vertebral body"),
          o("الحلقة الشوكية", "The neural ring"),
          o("النتوءان المستعرضان", "The transverse processes"),
        ],
        correct: 1,
        explain: t(
          "النتوء الشوكي زائدة خلفية مائلة إلى أسفل تحملها الحلقة الشوكية.",
          "The spinous process is a backward process sloping down, carried by the neural ring.",
        ),
      },
      {
        id: "b6-q2",
        block: 6,
        prompt: t(
          "إزاي بتتمفصل الفقرة السفلية مع اللي فوقها؟",
          "How does a lower vertebra articulate with the one above it?",
        ),
        options: [
          o(
            "بنتوءيها المفصليين العلويين مع المفصليين السفليين للي فوقها",
            "Its superior articular processes with the inferior articular processes of the one above",
          ),
          o("بنتوءيها المستعرضين", "Through its transverse processes"),
          o("بجسمها فقط", "Through its body only"),
        ],
        correct: 0,
        explain: t(
          "تتمفصل الفقرة السفلية بنتوءيها المفصليين العلويين مع النتوءين المفصليين السفليين للفقرة العلوية.",
          "The lower vertebra articulates via its superior articular processes with the inferior articular processes of the upper one.",
        ),
      },
      {
        id: "b6-q3",
        block: 6,
        prompt: t("إيه اللي بيمتد جوه الجزء المؤشر عليه؟", "What runs inside the marked part?"),
        options: [
          o("الحبل الشوكي", "The spinal cord"),
          o("المخ", "The brain"),
          o("الغضاريف", "Cartilages"),
        ],
        correct: 0,
        explain: t(
          "القناة العصبية يمتد داخلها الحبل الشوكي لحمايته؛ والمخ والحبل معاً هما الجهاز العصبي المركزي.",
          "The spinal cord runs in the neural canal, protected; brain and cord together form the central nervous system.",
        ),
        visual: { figure: "vertebra", mark: "neural-canal" },
      },
    ],
  },

  /* ------------------------------------------------------------------ 7 */
  {
    n: 7,
    emoji: "💀",
    titleEn: "The skull",
    hookQuestion: {
      question: t(
        "في الجمجمة: الجزء الوجهي ولا الجزء المخي عظامه أكتر؟",
        "In the skull, which part has more bones: facial or cranial?",
      ),
      options: [
        t("المخي أكتر", "Cranial has more"),
        t("الوجهي أكتر", "Facial has more"),
        t("العدد متساوي", "They are equal"),
      ],
      correct: 1,
      reveal: t(
        "الجزء الوجهي 14 عظمة والجزء المخي 8 عظام.",
        "The facial part has 14 bones and the cranial part 8.",
      ),
    },
    simpleExplanation: {
      paragraphs: [
        t(
          "الجمجمة علبة عظمية من جزءين: خلفي (مخي) وأمامي (وجهي).",
          "The skull is a bony box of two parts: posterior (cranial) and anterior (facial).",
        ),
        t(
          "الجزء المخي 8 عظام متصلة عند أطرافها المسننة اتصالاً متيناً، وبتكوّن تجويفاً يستقر فيه المخ لحمايته. وفي قاعه ثقب كبير بيوصل المخ بالحبل الشوكي.",
          "The cranial part has 8 bones firmly joined along serrated edges, forming a cavity for the brain. In its floor is a large hole connecting the brain with the spinal cord.",
        ),
        t(
          "الجزء الوجهي 14 عظمة: عظام الوجه والفكين ومواضع أعضاء الحس (الأذنان والعينان والأنف).",
          "The facial part has 14 bones: face, jaws and the sites of sense organs (ears, eyes, nose).",
        ),
        t(
          "وفيه عظام ملحقة: العظيمات السمعية (المطرقة والسندان والركاب، أصغر 3 عظام في الجسم، في الأذن الوسطى)، والعظم اللامي فوق الحنجرة.",
          "Attached bones: the auditory ossicles (malleus, incus, stapes — the smallest three bones, in the middle ear) and the hyoid above the larynx.",
        ),
      ],
      imagine: t(
        "تخيل (تشبيه): الجزء المخي زي خوذة بتحمي المخ، والجزء الوجهي زي القناع اللي فيه الفكين ومكان العين والأنف.",
        "Imagine (an analogy): the cranial part is like a helmet protecting the brain; the facial part is like a mask carrying the jaws and the places of eyes and nose.",
      ),
      examples: [
        t(
          "العظم اللامي بتتصل بيه عضلات كتير بتأثر على حركة اللسان والبلع.",
          "Many muscles attach to the hyoid and affect tongue movement and swallowing.",
        ),
        t(
          "الرسم بيوضح الجمجمة من الأمام ومن الجنب ومن تحت.",
          "The drawing shows the skull from the front, the side and below.",
        ),
      ],
      terms: [
        { ar: "الجزء المخي", en: "Cranial (cerebral) part" },
        { ar: "الجزء الوجهي", en: "Facial part" },
        { ar: "الفك العلوي", en: "Maxilla" },
        { ar: "الفك السفلي", en: "Mandible" },
        { ar: "الثقب الكبير", en: "Foramen magnum" },
        { ar: "العظيمات السمعية", en: "Auditory ossicles" },
        { ar: "العظم اللامي", en: "Hyoid bone" },
      ],
    },
    examTrap: {
      claim: t(
        "الجزء المخي 14 عظمة والجزء الوجهي 8 عظام.",
        "The cranial part has 14 bones and the facial part has 8.",
      ),
      truth: t(
        "الجزء المخي 8 عظام (علبة للمخ)، والجزء الوجهي 14 عظمة. الرقمين مش بيتبدلوا.",
        "The cranial part has 8 bones (a box for the brain) and the facial part 14. The numbers are not swapped.",
      ),
      probes: [
        {
          id: "b7-p1",
          label: t("عدّ عظام الجزء المخي", "Count the cranial bones"),
          result: t("8 عظام متصلة بأطراف مسننة.", "8 bones joined by serrated edges."),
          verdict: "ok",
          highlight: ["cranial-bones"],
        },
        {
          id: "b7-p2",
          label: t("عدّ عظام الجزء الوجهي", "Count the facial bones"),
          result: t("14 عظمة.", "14 bones."),
          verdict: "ok",
          highlight: ["facial-bones"],
        },
        {
          id: "b7-p3",
          label: t("بدّل الرقمين", "Swap the numbers"),
          result: t(
            "مش مظبوط: المخي 8 والوجهي 14، مش العكس!",
            "Wrong: cranial is 8 and facial is 14, not the reverse!",
          ),
          verdict: "bad",
        },
      ],
    },
    tasks: [
      {
        kind: "label",
        id: "b7-t1",
        figure: "skull",
        title: t("سمّي أجزاء الجمجمة", "Name the parts of the skull"),
        parts: ["cranial-part", "facial-part", "maxilla", "teeth", "mandible", "foramen-magnum"],
      },
      {
        kind: "numeric",
        id: "b7-t2",
        prompt: t("كام عظمة في الجزء المخي؟", "How many bones in the cranial part?"),
        answer: 8,
        unit: t("عظام", "bones"),
        why: t("الجزء المخي يتكون من 8 عظام.", "The cranial part has 8 bones."),
      },
      {
        kind: "numeric",
        id: "b7-t3",
        prompt: t("كام عظمة في الجزء الوجهي؟", "How many bones in the facial part?"),
        answer: 14,
        unit: t("عظمة", "bones"),
        why: t("الجزء الوجهي يتكون من 14 عظمة.", "The facial part has 14 bones."),
      },
      {
        kind: "pick",
        id: "b7-t4",
        prompt: t(
          "الثقب الكبير بيتواجد في قاع أنهي جزء؟",
          "In the floor of which part is the foramen magnum?",
        ),
        options: ["cranial-bones", "facial-bones", "mandible", "maxilla"],
        answer: "cranial-bones",
        why: t(
          "يوجد في قاع الجزء المخي ثقب كبير يتصل من خلاله المخ بالحبل الشوكي.",
          "In the floor of the cranial part is a large hole through which the brain connects with the spinal cord.",
        ),
        wrongWhy: {
          "facial-bones": t(
            "الجزء الوجهي فيه عظام الوجه والفكين ومواضع أعضاء الحس، والثقب الكبير في قاع الجزء المخي.",
            "The facial part holds face, jaws and sense-organ sites; the large hole is in the floor of the cranial part.",
          ),
          mandible: t(
            "الفك السفلي من الجزء الوجهي، والثقب الكبير في قاع الجزء المخي.",
            "The mandible is a facial bone; the large hole is in the floor of the cranial part.",
          ),
          maxilla: t(
            "الفك العلوي من الجزء الوجهي، والثقب الكبير في قاع الجزء المخي.",
            "The maxilla is a facial bone; the large hole is in the floor of the cranial part.",
          ),
        },
      },
    ],
    feynmanCheck: {
      prompt: t(
        "اشرح لي كأني صاحبك: الجمجمة مكونة من إيه وإيه وظيفة كل جزء؟",
        "Explain to me like I'm your friend: what is the skull made of and what does each part do?",
      ),
      keywords: [
        {
          id: "cranial",
          label: t("الجزء المخي", "Cranial part"),
          match: ["مخي", "cranial", "cerebral"],
        },
        { id: "facial", label: t("الجزء الوجهي", "Facial part"), match: ["وجهي", "facial"] },
        { id: "n8", label: t("8 عظام", "8 bones"), match: ["8", "ثماني", "eight"] },
        { id: "n14", label: t("14 عظمة", "14 bones"), match: ["14", "أربع عشر", "fourteen"] },
        { id: "brain", label: t("حماية المخ", "Protects the brain"), match: ["المخ", "brain"] },
        {
          id: "foramen",
          label: t("الثقب الكبير", "Foramen magnum"),
          match: ["ثقب", "foramen"],
        },
        { id: "cord", label: t("الحبل الشوكي", "Spinal cord"), match: ["حبل", "spinal cord"] },
        { id: "serrated", label: t("أطراف مسننة", "Serrated edges"), match: ["مسننة", "serrated"] },
      ],
      model: t(
        "الجمجمة علبة عظمية من جزءين. الجزء المخي 8 عظام متصلة بأطراف مسننة وبتكوّن تجويف يحمي المخ، وفي قاعه ثقب كبير يوصل المخ بالحبل الشوكي. والجزء الوجهي 14 عظمة فيها الوجه والفكين ومواضع الأذنين والعينين والأنف.",
        "The skull is a bony box of two parts. The cranial part has 8 bones joined by serrated edges forming a cavity that protects the brain, with a large hole in its floor linking the brain to the spinal cord. The facial part has 14 bones including face, jaws and the sites of ears, eyes and nose.",
      ),
    },
    microQuiz: [
      {
        id: "b7-q1",
        block: 7,
        prompt: t("العظيمات السمعية موجودة فين؟", "Where are the auditory ossicles?"),
        options: [
          o("في الأذن الوسطى", "In the middle ear"),
          o("أعلى الحنجرة", "Above the larynx"),
          o("في تجويف الأنف", "In the nasal cavity"),
        ],
        correct: 0,
        explain: t(
          "العظيمات السمعية (المطرقة والسندان والركاب) أصغر ثلاث عظام في الجسم وبتوجد في الأذن الوسطى.",
          "The auditory ossicles (malleus, incus, stapes) are the smallest three bones in the body, in the middle ear.",
        ),
      },
      {
        id: "b7-q2",
        block: 7,
        prompt: t("إيه هو العظم اللامي؟", "What is the hyoid bone?"),
        options: [
          o(
            "عظم أعلى الحنجرة تتصل بيه عضلات اللسان والبلع",
            "A bone above the larynx with muscles affecting the tongue and swallowing",
          ),
          o("عظم من عظام الجزء الوجهي", "A bone of the facial part"),
          o("عظم في الأذن الوسطى", "A bone in the middle ear"),
        ],
        correct: 0,
        explain: t(
          "العظم اللامي عظم ملحق بالجمجمة، واقع أعلى الحنجرة وتتصل به عضلات تؤثر على حركة اللسان والبلع.",
          "The hyoid is attached to the skull, lies above the larynx and has muscles affecting tongue movement and swallowing.",
        ),
      },
      {
        id: "b7-q3",
        block: 7,
        prompt: t(
          "الثقب الكبير بيوصل المخ بإيه؟",
          "The foramen magnum connects the brain with what?",
        ),
        options: [
          o("الحبل الشوكي", "The spinal cord"),
          o("الأذن الوسطى", "The middle ear"),
          o("تجويف الأنف", "The nasal cavity"),
        ],
        correct: 0,
        explain: t(
          "في قاع الجزء المخي ثقب كبير يتصل من خلاله المخ بالحبل الشوكي.",
          "In the floor of the cranial part is a large hole connecting the brain with the spinal cord.",
        ),
        visual: { figure: "skull", mark: "foramen-magnum" },
      },
    ],
  },
];
