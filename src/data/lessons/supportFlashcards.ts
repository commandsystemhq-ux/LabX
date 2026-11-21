import type { Flashcard, FlashcardState, FlashcardsData, FlashcardRating } from "./supportTypes";
import { SUPPORT_LESSON_ID } from "./supportTypes";

/**
 * Smart flashcards for the "Support in living organisms" lesson.
 * Covers key numbers, comparisons, materials, cavities, ligaments, and Achilles tendon.
 * Includes visual cards from supportFigures.ts.
 */

const t = (ar: string, en: string) => ({ ar, en });

export const supportFlashcards: FlashcardsData = {
  lessonId: SUPPORT_LESSON_ID,
  cards: [
    // Block 1: Plant cell and tissues
    {
      id: "fc-1-1",
      blockId: 1,
      front: t("ما هو النسيج البسيط؟", "What is a simple tissue?"),
      back: t(
        "نسيج من نوع واحد من الخلايا المتشابهة",
        "A tissue made of one type of identical cells",
      ),
      hint: t("نوع واحد من الخلايا", "One type of cells"),
    },
    {
      id: "fc-1-2",
      blockId: 1,
      front: t("ما هو النسيج المركب؟", "What is a complex tissue?"),
      back: t(
        "نسيج من أكثر من نوع من الخلايا المتخصصة",
        "A tissue made of more than one type of specialised cells",
      ),
      hint: t("أكثر من نوع", "More than one type"),
    },
    {
      id: "fc-1-3",
      blockId: 1,
      front: t("ما هي الأنسجة البسيطة الثلاثة؟", "What are the three simple tissues?"),
      back: t("البارانشيمي، الكولنشيمي، الإسكرلنشيمي", "Parenchyma, Collenchyma, Sclerenchyma"),
      hint: t("بارا-كولا-إسكرلا", "Paren-Collen-Scleren"),
    },
    {
      id: "fc-1-4",
      blockId: 1,
      front: t(
        "ما الفرق بين الكولنشيمي والإسكرلنشيمي؟",
        "What is the difference between collenchyma and sclerenchyma?",
      ),
      back: t(
        "الكولنشيمي: حي، تغليظ بالسيليلوز. الإسكرلنشيمي: غير حي، تغليظ باللجنين",
        "Collenchyma: living, cellulose thickening. Sclerenchyma: non-living, lignin thickening",
      ),
      hint: t("حي vs غير حي", "Living vs non-living"),
    },
    {
      id: "fc-1-5",
      blockId: 1,
      front: t("ما هي وظيفة الخشب؟", "What is the function of xylem?"),
      back: t(
        "نقل الماء والأملاح المعدنية من الجذر للأوراق",
        "Transport water and minerals from roots to leaves",
      ),
      hint: t("ماء وأملاح", "Water and minerals"),
    },
    {
      id: "fc-1-6",
      blockId: 1,
      front: t("ما هي وظيفة اللحاء؟", "What is the function of phloem?"),
      back: t(
        "نقل المواد العضوية من الأوراق لباقي النبات",
        "Transport organic materials from leaves to the rest of the plant",
      ),
      hint: t("مواد عضوية", "Organic materials"),
    },

    // Block 2: Deposited materials
    {
      id: "fc-2-1",
      blockId: 2,
      front: t("ما هي المواد المترسبة الأربعة؟", "What are the four deposited materials?"),
      back: t("السيليلوز، اللجنين، الكيوتين، السيوبرين", "Cellulose, Lignin, Cutin, Suberin"),
      hint: t("سيل-لجن-كيوت-سيوب", "Cell-Lign-Cut-Sub"),
    },
    {
      id: "fc-2-2",
      blockId: 2,
      front: t("أين يترسب الكيوتين؟", "Where is cutin deposited?"),
      back: t("في الطبقة الكيوتينية على سطح الأوراق", "In the cuticle layer on leaf surfaces"),
      hint: t("سطح الورقة", "Leaf surface"),
    },
    {
      id: "fc-2-3",
      blockId: 2,
      front: t("ما وظيفة السيوبرين؟", "What is the function of suberin?"),
      back: t("عزل الماء في الطبقة الفلينية", "Water insulation in the cork layer"),
      hint: t("عزل الماء", "Water insulation"),
    },
    {
      id: "fc-2-4",
      blockId: 2,
      front: t(
        "ما الفرق بين الساق العشبية والخشبية؟",
        "What is the difference between herbaceous and woody stems?",
      ),
      back: t(
        "العشبية: أنسجة رقيقة. الخشبية: تغليظ باللجنين",
        "Herbaceous: thin tissues. Woody: lignin thickening",
      ),
      hint: t("رقيق vs مغلظ", "Thin vs thickened"),
    },

    // Block 3: Skeleton overview
    {
      id: "fc-3-1",
      blockId: 3,
      front: t(
        "كم عدد عظام الهيكل العظمي في الإنسان البالغ؟",
        "How many bones in the adult human skeleton?",
      ),
      back: t("206 عظمة", "206 bones"),
      hint: t("عدد ثابت", "Fixed number"),
    },
    {
      id: "fc-3-2",
      blockId: 3,
      front: t("كم عدد عظام الطفل عند الولادة؟", "How many bones in a newborn child?"),
      back: t("270–300 عظمة", "270–300 bones"),
      hint: t("أكثر من البالغ", "More than adult"),
    },
    {
      id: "fc-3-3",
      blockId: 3,
      front: t("ما هي التجاويف الستة؟", "What are the six cavities?"),
      back: t(
        "الجمجمة، الحبل الشوكي، الصدر، البطن، الحوض، المفاصل",
        "Cranial, Spinal, Thoracic, Abdominal, Pelvic, Joint cavities",
      ),
      hint: t("جمجمة-حبل-صدر-بطن-حوض-مفاصل", "Cranial-Spinal-Thorax-Abdomen-Pelvis-Joints"),
    },

    // Block 4: Axial vs Appendicular
    {
      id: "fc-4-1",
      blockId: 4,
      front: t("كم عدد عظام الهيكل المحوري؟", "How many bones in the axial skeleton?"),
      back: t("80 عظمة", "80 bones"),
      hint: t("العمود والجمجمة والقفص", "Spine, skull, thorax"),
    },
    {
      id: "fc-4-2",
      blockId: 4,
      front: t("كم عدد عظام الهيكل الطرفي؟", "How many bones in the appendicular skeleton?"),
      back: t("126 عظمة", "126 bones"),
      hint: t("الأطراف والأحزمة", "Limbs and girdles"),
    },

    // Block 5: Vertebral column
    {
      id: "fc-5-1",
      blockId: 5,
      front: t("كم عدد فقرات العمود الفقري؟", "How many vertebrae in the vertebral column?"),
      back: t("33 فقرة", "33 vertebrae"),
      hint: t("عدد الفقرات", "Vertebrae count"),
    },
    {
      id: "fc-5-2",
      blockId: 5,
      front: t("كم عدد عظام العمود الفقري؟", "How many bones in the vertebral column?"),
      back: t("26 عظمة", "26 bones"),
      hint: t("بعد الالتحام", "After fusion"),
    },
    {
      id: "fc-5-3",
      blockId: 5,
      front: t("ما هي مجموعات الفقرات الخمس؟", "What are the five vertebral groups?"),
      back: t(
        "عنقية (7)، صدرية (12)، قطنية (5)، عجزية (5)، عصعصية (4)",
        "Cervical (7), Thoracic (12), Lumbar (5), Sacral (5), Coccygeal (4)",
      ),
      hint: t("عنق-صدر-قطن-عجز-عصعص", "Cerv-Thor-Lumb-Sacr-Cocc"),
    },
    {
      id: "fc-5-4",
      blockId: 5,
      front: t("كم عدد انحناءات العمود الفقري؟", "How many spinal curvatures?"),
      back: t("4 انحناءات", "4 curvatures"),
      hint: t("انحناءات", "Curvatures"),
    },

    // Block 6: Typical vertebra
    {
      id: "fc-6-1",
      blockId: 6,
      front: t("كم عدد نتوءات الفقرة النموذجية؟", "How many processes in a typical vertebra?"),
      back: t("7 نتوءات", "7 processes"),
      hint: t("2 مستعرضة + 4 مفصلية + 1 شوكية", "2 transverse + 4 articular + 1 spinous"),
    },
    {
      id: "fc-6-2",
      blockId: 6,
      front: t("ما هي أجزاء الفقرة النموذجية؟", "What are the parts of a typical vertebra?"),
      back: t(
        "جسم، قوس، 7 نتوءات (2 مستعرضة، 4 مفصلية، 1 شوكية)",
        "Body, arch, 7 processes (2 transverse, 4 articular, 1 spinous)",
      ),
      hint: t("جسم وقوس ونتوءات", "Body, arch, processes"),
    },

    // Block 7: Skull
    {
      id: "fc-7-1",
      blockId: 7,
      front: t("كم عدد عظام الجمجمة؟", "How many bones in the skull?"),
      back: t("29 عظمة", "29 bones"),
      hint: t("8+14+6+1", "8+14+6+1"),
    },
    {
      id: "fc-7-2",
      blockId: 7,
      front: t("كم عدد عظام المخ؟", "How many cranial bones?"),
      back: t("8 عظام", "8 bones"),
      hint: t("عظام المخ", "Cranial bones"),
    },
    {
      id: "fc-7-3",
      blockId: 7,
      front: t("كم عدد عظام الوجه؟", "How many facial bones?"),
      back: t("14 عظمة", "14 bones"),
      hint: t("عظام الوجه", "Facial bones"),
    },
    {
      id: "fc-7-4",
      blockId: 7,
      front: t("كم عدد العظام السمعية؟", "How many auditory bones?"),
      back: t("6 عظام", "6 bones"),
      hint: t("3 في كل أذن", "3 in each ear"),
    },
    {
      id: "fc-7-5",
      blockId: 7,
      front: t("ما هي العظمة اللامية؟", "What is the hyoid bone?"),
      back: t("عظمة واحدة لا تتصل بأي عظمة أخرى", "A single bone not connected to any other bone"),
      hint: t("عظمة منفردة", "Isolated bone"),
    },

    // Block 8: Thoracic cage
    {
      id: "fc-8-1",
      blockId: 8,
      front: t("كم عدد أزواج الضلوع؟", "How many pairs of ribs?"),
      back: t("12 زوج", "12 pairs"),
      hint: t("أزواج الضلوع", "Rib pairs"),
    },
    {
      id: "fc-8-2",
      blockId: 8,
      front: t(
        "كم عدد عظام القفص الصدري مع الفقرات؟",
        "How many bones in the thoracic cage with vertebrae?",
      ),
      back: t("37 عظمة", "37 bones"),
      hint: t("25 + 12 فقرة", "25 + 12 vertebrae"),
    },
    {
      id: "fc-8-3",
      blockId: 8,
      front: t("كم ضلع متصل بعظمة القص؟", "How many ribs attach to the sternum?"),
      back: t("22 ضلع (11 زوج)", "22 ribs (11 pairs)"),
      hint: t("العشرة أزواج الأولى", "First 10 pairs"),
    },
    {
      id: "fc-8-4",
      blockId: 8,
      front: t("ما هي الضلوع العائمة؟", "What are the floating ribs?"),
      back: t(
        "الزوجان 11 و12، قصيران لا يتصلان بالقص، يتصلان بالفقرتين 18 و19",
        "Pairs 11 and 12, short, do not attach to sternum, attach to vertebrae 18 and 19",
      ),
      hint: t("آخر زوجين", "Last two pairs"),
    },

    // Block 9: Pectoral girdle and upper limbs
    {
      id: "fc-9-1",
      blockId: 9,
      front: t("كم عدد عظام الحزام الصدري؟", "How many bones in the pectoral girdle?"),
      back: t("4 عظام", "4 bones"),
      hint: t("2 لوح كتف + 2 ترقوة", "2 scapulae + 2 clavicles"),
    },
    {
      id: "fc-9-2",
      blockId: 9,
      front: t("كم عدد عظام الطرفين العلويين؟", "How many bones in the upper limbs?"),
      back: t("60 عظمة", "60 bones"),
      hint: t("30×2", "30×2"),
    },
    {
      id: "fc-9-3",
      blockId: 9,
      front: t("ما الفرق بين الكعبرة والزند؟", "What is the difference between radius and ulna?"),
      back: t("الكعبرة: جهة الإبهام. الزند: جهة الخنصر", "Radius: thumb side. Ulna: pinky side"),
      hint: t("إبهام vs خنصر", "Thumb vs pinky"),
    },

    // Block 10: Pelvic girdle and lower limbs
    {
      id: "fc-10-1",
      blockId: 10,
      front: t("كم عدد عظام الحزام الحوضي؟", "How many bones in the pelvic girdle?"),
      back: t("2 عظمة", "2 bones"),
      hint: t("عظمتا الحوض", "Two hip bones"),
    },
    {
      id: "fc-10-2",
      blockId: 10,
      front: t("كم عدد عظام الطرفين السفليين؟", "How many bones in the lower limbs?"),
      back: t("60 عظمة", "60 bones"),
      hint: t("30×2", "30×2"),
    },
    {
      id: "fc-10-3",
      blockId: 10,
      front: t("ما هو الارتفاق العاني؟", "What is the pubic symphysis?"),
      back: t("مفصل ليفي بين عظمتا الحوض", "A fibrous joint between the two hip bones"),
      hint: t("اتصال الحوض", "Pelvic connection"),
    },

    // Block 11: Cartilages
    {
      id: "fc-11-1",
      blockId: 11,
      front: t("ما هي أنواع الغضاريف الثلاثة؟", "What are the three types of cartilage?"),
      back: t("غضروف زجاجي، مرن، ليفي", "Hyaline, elastic, fibrous cartilage"),
      hint: t("زجاجي-مرن-ليفي", "Hyaline-Elastic-Fibrous"),
    },

    // Block 12: Joints
    {
      id: "fc-12-1",
      blockId: 12,
      front: t("ما هي أنواع المفاصل الثلاثة؟", "What are the three types of joints?"),
      back: t("ليفية، غضروفية، زلالية", "Fibrous, cartilaginous, synovial"),
      hint: t("ليفية-غضروفية-زلالية", "Fibrous-Cartilaginous-Synovial"),
    },
    {
      id: "fc-12-2",
      blockId: 12,
      front: t(
        "ما الفرق بين المفاصل الزلالية المحدودة والواسعة؟",
        "What is the difference between limited and wide synovial joints?",
      ),
      back: t(
        "المحدودة: حركة في محور واحد. الواسعة: حركة في أكثر من محور",
        "Limited: movement in one axis. Wide: movement in multiple axes",
      ),
      hint: t("محدود vs واسع", "Limited vs wide"),
    },

    // Block 13: Knee ligaments
    {
      id: "fc-13-1",
      blockId: 13,
      front: t("كم عدد أربطة الركبة؟", "How many knee ligaments?"),
      back: t("4 أربطة", "4 ligaments"),
      hint: t("2 صليبي + 2 جانبي", "2 cruciate + 2 collateral"),
    },
    {
      id: "fc-13-2",
      blockId: 13,
      front: t("ما هي أربطة الركبة الأربعة؟", "What are the four knee ligaments?"),
      back: t(
        "الرباط الصليبي الأمامي، الصليبي الخلفي، الجانبي الداخلي، الجانبي الخارجي",
        "Anterior cruciate, posterior cruciate, medial collateral, lateral collateral",
      ),
      hint: t("صليبي أمامي-خلفي، جانبي داخلي-خارجي", "Cruciate ant-post, collateral med-lat"),
    },

    // Block 14: Achilles tendon
    {
      id: "fc-14-1",
      blockId: 14,
      front: t("ما هو وتر أخيل؟", "What is the Achilles tendon?"),
      back: t(
        "أقوى وأطول وتر في الجسم، يربط عضلة الساق بعظمة الكعب",
        "The strongest and longest tendon, connects calf muscle to heel bone",
      ),
      hint: t("أقوى وتر", "Strongest tendon"),
    },
    {
      id: "fc-14-2",
      blockId: 14,
      front: t("ما هي أسباب تمزق وتر أخيل؟", "What are the causes of Achilles tendon tear?"),
      back: t(
        "إجهاد مفاجئ، ضغط متكرر، ضعف تدريجي",
        "Sudden stress, repeated pressure, gradual weakening",
      ),
      hint: t("إجهاد-ضغط-ضعف", "Stress-pressure-weakness"),
    },
    {
      id: "fc-14-3",
      blockId: 14,
      front: t("ما هي أعراض تمزق وتر أخيل؟", "What are the symptoms of Achilles tendon tear?"),
      back: t("ألم حاد، صوت فرقعة، صعوبة المشي", "Sharp pain, popping sound, difficulty walking"),
      hint: t("ألم-صوت-مشي", "Pain-sound-walking"),
    },
    {
      id: "fc-14-4",
      blockId: 14,
      front: t("ما هو علاج تمزق وتر أخيل؟", "What is the treatment for Achilles tendon tear?"),
      back: t("جراحة أو تثبيت بالجبس", "Surgery or cast immobilization"),
      hint: t("جراحة أو جبس", "Surgery or cast"),
    },

    // Visual cards (figures without labels)
    {
      id: "fc-vis-1",
      blockId: 1,
      front: t("سمّي أجزاء الخلية النباتية", "Name the parts of the plant cell"),
      back: t(
        "جدار خلوي، غشاء بلازمي، سيتوبلازم، نواة، فجوة، بلاستيدات خضراء، ميتوكوندريا",
        "Cell wall, plasma membrane, cytoplasm, nucleus, vacuole, chloroplasts, mitochondria",
      ),
      visual: { figure: "cell-plant", hideLabels: true },
      hint: t("انظر الرسمة", "Look at the figure"),
    },
    {
      id: "fc-vis-2",
      blockId: 5,
      front: t("سمّي مجموعات الفقرات", "Name the vertebral groups"),
      back: t(
        "عنقية (7)، صدرية (12)، قطنية (5)، عجزية (5)، عصعصية (4)",
        "Cervical (7), Thoracic (12), Lumbar (5), Sacral (5), Coccygeal (4)",
      ),
      visual: { figure: "spine", hideLabels: true },
      hint: t("انظر الرسمة", "Look at the figure"),
    },
    {
      id: "fc-vis-3",
      blockId: 7,
      front: t("سمّي عظام الجمجمة", "Name the skull bones"),
      back: t(
        "8 مخية + 14 وجهية + 6 سمعية + 1 لامية",
        "8 cranial + 14 facial + 6 auditory + 1 hyoid",
      ),
      visual: { figure: "skull", hideLabels: true },
      hint: t("انظر الرسمة", "Look at the figure"),
    },
    {
      id: "fc-vis-4",
      blockId: 8,
      front: t("سمّي أجزاء القفص الصدري", "Name the parts of the thoracic cage"),
      back: t(
        "12 زوج ضلوع، عظمة القص، الفقرات الصدرية",
        "12 pairs of ribs, sternum, thoracic vertebrae",
      ),
      visual: { figure: "thorax", hideLabels: true },
      hint: t("انظر الرسمة", "Look at the figure"),
    },
    {
      id: "fc-vis-5",
      blockId: 13,
      front: t("سمّي أربطة الركبة", "Name the knee ligaments"),
      back: t(
        "الرباط الصليبي الأمامي، الصليبي الخلفي، الجانبي الداخلي، الجانبي الخارجي",
        "Anterior cruciate, posterior cruciate, medial collateral, lateral collateral",
      ),
      visual: { figure: "knee", hideLabels: true },
      hint: t("انظر الرسمة", "Look at the figure"),
    },
    {
      id: "fc-vis-6",
      blockId: 14,
      front: t("أين يقع وتر أخيل؟", "Where is the Achilles tendon?"),
      back: t(
        "خلف الكاحل، يربط عضلة الساق بعظمة الكعب",
        "Behind the ankle, connects calf muscle to heel bone",
      ),
      visual: { figure: "achilles", hideLabels: true },
      hint: t("انظر الرسمة", "Look at the figure"),
    },
  ],
};

/* -------------------------------- Spaced Repetition -------------------------------- */

export const FLASHCARD_KEY = "labx.flashcards.v1";

export const EMPTY_FLASHCARD_STATE: FlashcardState = Object.freeze({
  v: 1,
  ratings: Object.freeze({}),
  nextReview: Object.freeze({}),
});

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const VALID_RATINGS: FlashcardRating[] = ["known", "hard", "forgot"];

function sanitizeRating(v: unknown): FlashcardRating | null {
  if (typeof v === "string" && VALID_RATINGS.includes(v as FlashcardRating)) {
    return v as FlashcardRating;
  }
  return null;
}

function sanitizeTimestamp(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v) && v > 0) {
    return Math.round(v);
  }
  return null;
}

const MAX_CARDS = 500;
const CARD_ID = /^[a-z0-9_-]{1,40}$/;

export function sanitizeFlashcardState(raw: unknown): FlashcardState {
  if (!isRecord(raw) || raw["v"] !== 1) return EMPTY_FLASHCARD_STATE;
  const ratings: Record<string, FlashcardRating> = {};
  const nextReview: Record<string, number> = {};

  if (isRecord(raw["ratings"])) {
    for (const [k, v] of Object.entries(raw["ratings"]).slice(0, MAX_CARDS)) {
      if (k === "__proto__" || !CARD_ID.test(k)) continue;
      const r = sanitizeRating(v);
      if (r) ratings[k] = r;
    }
  }

  if (isRecord(raw["nextReview"])) {
    for (const [k, v] of Object.entries(raw["nextReview"]).slice(0, MAX_CARDS)) {
      if (k === "__proto__" || !CARD_ID.test(k)) continue;
      const t = sanitizeTimestamp(v);
      if (t) nextReview[k] = t;
    }
  }

  return { v: 1, ratings, nextReview };
}

/** Calculate next review time based on rating (Anki-style intervals). */
export function nextReviewTime(rating: FlashcardRating, prevRating?: FlashcardRating): number {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  // Base intervals
  if (rating === "known") {
    // Easy: 4 days, then exponential
    const prevDays = prevRating === "known" ? 4 : 1;
    return now + prevDays * DAY;
  } else if (rating === "hard") {
    // Hard: 1 day
    return now + DAY;
  } else {
    // Forgot: 10 minutes (same session)
    return now + 10 * 60 * 1000;
  }
}

/** Load flashcard state from storage. */
export function loadFlashcardState(storage: Pick<Storage, "getItem"> | null): FlashcardState {
  try {
    const text = storage?.getItem(FLASHCARD_KEY);
    return text ? sanitizeFlashcardState(JSON.parse(text) as unknown) : EMPTY_FLASHCARD_STATE;
  } catch {
    return EMPTY_FLASHCARD_STATE;
  }
}

/** Save flashcard state to storage. */
export function saveFlashcardState(
  storage: Pick<Storage, "setItem"> | null,
  state: FlashcardState,
) {
  try {
    storage?.setItem(FLASHCARD_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

/** Update state after rating a card. */
export function rateCard(
  state: FlashcardState,
  cardId: string,
  rating: FlashcardRating,
): FlashcardState {
  if (!CARD_ID.test(cardId)) return state;

  const ratings = { ...state.ratings, [cardId]: rating };
  const nextReview = {
    ...state.nextReview,
    [cardId]: nextReviewTime(rating, state.ratings[cardId]),
  };

  return { v: 1, ratings, nextReview };
}

/** Get cards due for review (sorted by priority: forgot > hard > known). */
export function getDueCards(
  cards: Flashcard[],
  state: FlashcardState,
  filter: "all" | "hard-forgot" = "all",
): Flashcard[] {
  const now = Date.now();

  const due = cards.filter((card) => {
    const next = state.nextReview[card.id];
    const rating = state.ratings[card.id];

    // Never reviewed = due now
    if (!next) return true;

    // Past review time = due
    if (next <= now) return true;

    // Filter by rating
    if (filter === "hard-forgot") {
      return rating === "hard" || rating === "forgot";
    }

    return false;
  });

  // Sort by priority: forgot > hard > known > unrated
  const priority: Record<FlashcardRating | "unrated", number> = {
    forgot: 0,
    hard: 1,
    known: 2,
    unrated: 3,
  };

  return due.sort((a, b) => {
    const pa = priority[state.ratings[a.id] ?? "unrated"];
    const pb = priority[state.ratings[b.id] ?? "unrated"];
    return pa - pb;
  });
}

/** Calculate mastery percentage. */
export function masteryPercentage(state: FlashcardState, total: number): number {
  if (total === 0) return 0;
  const known = Object.values(state.ratings).filter((r) => r === "known").length;
  return Math.round((100 * known) / total);
}
