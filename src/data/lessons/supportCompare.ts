import type { L10n } from "@/lib/i18n";
import { MATERIALS } from "./supportLab";
import type { CompareId } from "./supportTypes";

/**
 * «حلبة المقارنات الحيّة»: each comparison has 2–4 sides, a pool of property cards to sort onto
 * them (a card may belong to several sides) and live meters that animate beside each side.
 * Every statement is taken from the textbook report.
 */

export interface CompareCard {
  id: string;
  text: L10n;
  /** Indexes of the sides this property belongs to. */
  sides: number[];
}

export interface CompareMeter {
  label: L10n;
  /** One 0–100 value per side. */
  values: number[];
  /** Optional text shown instead of the percentage (e.g. a bone count). */
  texts?: L10n[];
}

export interface CompareDef {
  id: CompareId;
  title: L10n;
  sides: L10n[];
  meters: CompareMeter[];
  cards: CompareCard[];
}

const card = (id: string, ar: string, en: string, sides: number[]): CompareCard => ({
  id,
  text: { ar, en },
  sides,
});

const m = (id: keyof typeof MATERIALS, key: "water" | "flex" | "stiff") => MATERIALS[id][key];

export const COMPARISONS: Record<CompareId, CompareDef> = {
  "herb-woody": {
    id: "herb-woody",
    title: { ar: "النباتات العشبية مقابل الخشبية", en: "Herbaceous vs woody plants" },
    sides: [
      { ar: "النباتات العشبية", en: "Herbaceous plants" },
      { ar: "النباتات الخشبية", en: "Woody plants" },
    ],
    meters: [
      { label: { ar: "مرونة الساق", en: "Stem flexibility" }, values: [90, 20] },
      { label: { ar: "نسبة نسيج الخشب", en: "Share of xylem" }, values: [15, 90] },
      { label: { ar: "صلابة الساق", en: "Stem hardness" }, values: [20, 90] },
    ],
    cards: [
      card("h1", "سيقان غضة مرنة خضراء", "Soft, flexible, green stems", [0]),
      card("h2", "تحتوي على نسبة قليلة من نسيج الخشب", "A small proportion of xylem", [0]),
      card("h3", "مثل الفول والملوخية", "Examples: broad bean and molokhia", [0]),
      card("h4", "سيقان صلبة بنية", "Hard, brown stems", [1]),
      card("h5", "تحتوي على نسبة كبيرة من نسيج الخشب", "A large proportion of xylem", [1]),
      card(
        "h6",
        "جذوع الأشجار المسنة بها طبقة خارجية من الفلين",
        "Old tree trunks have an outer layer of cork",
        [1],
      ),
      card("h7", "مثل أشجار الصنوبر والسنط", "Examples: pine and acacia trees", [1]),
      card("h8", "تحتوي سيقانها على نسيج الخشب", "Their stems contain xylem", [0, 1]),
    ],
  },
  materials: {
    id: "materials",
    title: {
      ar: "المواد المترسبة: السيليلوز، اللجنين، الكيوتين، السيوبرين",
      en: "Deposited materials: cellulose, lignin, cutin, suberin",
    },
    sides: [
      MATERIALS.cellulose.name,
      MATERIALS.lignin.name,
      MATERIALS.cutin.name,
      MATERIALS.suberin.name,
    ],
    meters: [
      {
        label: { ar: "نفاذية الماء", en: "Water permeability" },
        values: [
          m("cellulose", "water"),
          m("lignin", "water"),
          m("cutin", "water"),
          m("suberin", "water"),
        ],
      },
      {
        label: { ar: "المرونة", en: "Flexibility" },
        values: [
          m("cellulose", "flex"),
          m("lignin", "flex"),
          m("cutin", "flex"),
          m("suberin", "flex"),
        ],
      },
      {
        label: { ar: "الصلابة", en: "Rigidity" },
        values: [
          m("cellulose", "stiff"),
          m("lignin", "stiff"),
          m("cutin", "stiff"),
          m("suberin", "stiff"),
        ],
      },
    ],
    cards: [
      card("m1", "يدعم النسيج الكولنشيمي (خلايا حية)", "Supports collenchyma (living cells)", [0]),
      card("m2", "منفذة للماء", "Permeable to water", [0]),
      card("m3", "تكسب جدار الخلية القوة والمرونة", "Gives the wall strength and flexibility", [0]),
      card(
        "m4",
        "يدعم الإسكرلنشيمي وأوعية وقصيبات الخشب (خلايا غير حية)",
        "Supports sclerenchyma and xylem vessels and tracheids (dead cells)",
        [1],
      ),
      card("m5", "تكسب جدار الخلية القوة والصلابة", "Gives the wall strength and rigidity", [1]),
      card(
        "m6",
        "يدعم البارانشيمي الموجود ببشرة الساق والأوراق (خلايا حية)",
        "Supports the parenchyma of the stem and leaf epidermis (living cells)",
        [2],
      ),
      card("m7", "تمنع نفاذ الماء من خلايا البشرة", "Stops water leaving the epidermis cells", [2]),
      card("m8", "يدعم الفلين (خلايا غير حية)", "Supports cork (dead cells)", [3]),
      card(
        "m9",
        "تمنع نفاذ الماء من خلايا الأنسجة الداخلية",
        "Stops water leaving the inner tissues",
        [3],
      ),
      card("m10", "غير منفذة للماء", "Impermeable to water", [1, 2, 3]),
    ],
  },
  "pectoral-pelvic": {
    id: "pectoral-pelvic",
    title: { ar: "الحزام الصدري مقابل الحزام الحوضي", en: "Pectoral vs pelvic girdle" },
    sides: [
      { ar: "الحزام الصدري", en: "Pectoral girdle" },
      { ar: "الحزام الحوضي", en: "Pelvic girdle" },
    ],
    meters: [
      {
        label: { ar: "عدد عظام الحزام", en: "Bones in the girdle" },
        values: [100, 50],
        texts: [
          { ar: "4 عظام", en: "4 bones" },
          { ar: "عظمتان", en: "2 bones" },
        ],
      },
    ],
    cards: [
      card("g1", "يتصل بالطرفين العلويين", "Joins the upper limbs", [0]),
      card("g2", "يتصل بالطرفين السفليين", "Joins the lower limbs", [1]),
      card(
        "g3",
        "يصل الطرفين العلويين بالهيكل المحوري عن طريق اتصال الترقوة بالقص",
        "Links the upper limbs to the axial skeleton through the clavicle–sternum joint",
        [0],
      ),
      card(
        "g4",
        "يصل الطرفين السفليين بالهيكل المحوري عن طريق اتصال الحرقفة بالفقرات العجزية",
        "Links the lower limbs to the axial skeleton through the ilium–sacral vertebrae joint",
        [1],
      ),
      card(
        "g5",
        "يتكون كل نصف من الترقوة ولوح الكتف",
        "Each half has a clavicle and a scapula",
        [0],
      ),
      card(
        "g6",
        "يتكون كل نصف من الحرقفة والعانة والورك",
        "Each half has an ilium, a pubis and an ischium",
        [1],
      ),
      card("g7", "فيه التجويف الأروح", "Has the glenoid cavity", [0]),
      card("g8", "فيه التجويف الحقي", "Has the acetabulum", [1]),
      card(
        "g9",
        "يتصل نصفاه في الناحية الباطنية بالارتفاق العاني",
        "Its halves meet at the pubic symphysis",
        [1],
      ),
      card("g10", "مجموع عظامه 4 عظام", "Total of 4 bones", [0]),
    ],
  },
  limbs: {
    id: "limbs",
    title: { ar: "الطرف العلوي مقابل الطرف السفلي", en: "Upper limb vs lower limb" },
    sides: [
      { ar: "الطرف العلوي", en: "Upper limb" },
      { ar: "الطرف السفلي", en: "Lower limb" },
    ],
    meters: [
      {
        label: { ar: "عظام الرسغ", en: "Wrist / ankle bones" },
        values: [100, 87.5],
        texts: [
          { ar: "8 عظام", en: "8 bones" },
          { ar: "7 عظام", en: "7 bones" },
        ],
      },
      {
        label: { ar: "مجموع عظام الطرف", en: "Bones in one limb" },
        values: [100, 100],
        texts: [
          { ar: "30 عظمة", en: "30 bones" },
          { ar: "30 عظمة", en: "30 bones" },
        ],
      },
    ],
    cards: [
      card("l1", "العضد", "Humerus", [0]),
      card("l2", "الفخذ", "Femur", [1]),
      card("l3", "الساعد: الزند والكعبرة", "Forearm: ulna and radius", [0]),
      card("l4", "الساق: القصبة والشظية", "Shank: tibia and fibula", [1]),
      card("l5", "الرضفة أمام مفصل الركبة", "Patella in front of the knee", [1]),
      card("l6", "رسغ اليد: 8 عظام", "Wrist: 8 bones", [0]),
      card(
        "l7",
        "رسغ القدم: 7 عظام أكبرها عظمة الكعب",
        "Ankle: 7 bones, the largest forms the heel",
        [1],
      ),
      card(
        "l8",
        "رأس العضد يستقر في التجويف الأروح",
        "Humerus head sits in the glenoid cavity",
        [0],
      ),
      card("l9", "رأس الفخذ يستقر في التجويف الحقي", "Femur head sits in the acetabulum", [1]),
      card("l10", "5 عظام في راحة اليد / مشط القدم", "5 hand-palm / foot bones", [0, 1]),
      card("l11", "14 سلامية", "14 phalanges", [0, 1]),
      card("l12", "مجموع عظام الطرف الواحد 30 عظمة", "30 bones in one limb", [0, 1]),
    ],
  },
  joints: {
    id: "joints",
    title: {
      ar: "المفاصل الليفية والغضروفية والزلالية",
      en: "Fibrous, cartilaginous and synovial joints",
    },
    sides: [
      { ar: "مفاصل ليفية", en: "Fibrous" },
      { ar: "مفاصل غضروفية", en: "Cartilaginous" },
      { ar: "مفاصل زلالية", en: "Synovial" },
    ],
    meters: [{ label: { ar: "مدى الحركة", en: "Range of movement" }, values: [4, 20, 92] }],
    cards: [
      card(
        "j1",
        "تلتحم العظام بأنسجة ليفية تتحول مع تقدم العمر إلى أنسجة عظمية",
        "Bones are joined by fibrous tissue that turns into bony tissue with age",
        [0],
      ),
      card("j2", "معظمها لا يسمح بالحركة", "Most allow no movement", [0]),
      card("j3", "مثال: بين عظام الجمجمة", "Example: between the skull bones", [0]),
      card(
        "j4",
        "تربط بين نهايات بعض العظام المتجاورة",
        "Join the ends of some neighbouring bones",
        [1],
      ),
      card("j5", "معظمها يسمح بحركة محدودة جداً", "Most allow very limited movement", [1]),
      card(
        "j6",
        "مثال: بين أجسام فقرات العمود الفقري",
        "Example: between the vertebral bodies",
        [1],
      ),
      card("j7", "تشكل معظم مفاصل الجسم", "Make up most joints of the body", [2]),
      card("j8", "تحتوي على سائل مصلي أو زلالي", "Contain serous (synovial) fluid", [2]),
      card(
        "j9",
        "سطح العظام مغطى بطبقة رقيقة من مادة غضروفية شفافة ملساء",
        "Bone surfaces are covered by a thin smooth transparent cartilage layer",
        [2],
      ),
      card("j10", "محدودة الحركة: الكوع والركبة", "Limited movement: elbow and knee", [2]),
      card("j11", "واسعة الحركة: الكتف والفخذ", "Wide movement: shoulder and hip", [2]),
    ],
  },
  "ligament-tendon": {
    id: "ligament-tendon",
    title: { ar: "الأربطة مقابل الأوتار", en: "Ligaments vs tendons" },
    sides: [
      { ar: "الأربطة", en: "Ligaments" },
      { ar: "الأوتار", en: "Tendons" },
    ],
    meters: [
      {
        label: { ar: "تربط", en: "They connect" },
        values: [100, 100],
        texts: [
          { ar: "عظمة ← عظمة", en: "bone ↔ bone" },
          { ar: "عضلة ← عظمة", en: "muscle ↔ bone" },
        ],
      },
    ],
    cards: [
      card(
        "t1",
        "حزم منفصلة من النسيج الضام الليفي",
        "Separate bundles of fibrous connective tissue",
        [0],
      ),
      card("t2", "نسيج ضام قوي", "Strong connective tissue", [1]),
      card("t3", "تربط العظام ببعضها عند المفاصل", "Tie bones together at joints", [0]),
      card("t4", "تربط العضلات بالعظام عند المفاصل", "Tie muscles to bones at joints", [1]),
      card(
        "t5",
        "تحدد حركة العظام في الاتجاهات المختلفة",
        "Limit the movement of the bones in different directions",
        [0],
      ),
      card(
        "t6",
        "تسمح بالحركة عند انقباض وانبساط العضلات",
        "Allow movement when muscles contract and relax",
        [1],
      ),
      card(
        "t7",
        "فيها مرونة تسمح بزيادة طولها قليلاً حتى لا تنقطع",
        "A little elasticity lets them lengthen so they do not snap",
        [0],
      ),
      card("t8", "مثال: الأربطة الأربعة في الركبة", "Example: the four ligaments of the knee", [0]),
      card("t9", "مثال: وتر أخيل", "Example: the Achilles tendon", [1]),
      card(
        "t10",
        "تتمزق عند التواء المفصل (الرباط الصليبي)",
        "Tear when a joint is twisted (the cruciate ligament)",
        [0],
      ),
      card(
        "t11",
        "يتمزق بعد مجهود عنيف أو تقلص مفاجئ للعضلة التوأمية",
        "Tears after violent effort or a sudden contraction of the gastrocnemius",
        [1],
      ),
    ],
  },
};

export const COMPARE_IDS = Object.keys(COMPARISONS) as CompareId[];

/** A student's sorting: card id → the set of side indexes the card was dropped on. */
export type CompareAssignment = Record<string, number[]>;

export interface CompareGrade {
  correct: number;
  total: number;
  wrong: string[];
  missing: string[];
}

const sameSet = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && [...a].sort().every((x, i) => x === [...b].sort()[i]);

export function gradeCompare(def: CompareDef, assignment: CompareAssignment): CompareGrade {
  const wrong: string[] = [];
  const missing: string[] = [];
  let correct = 0;
  for (const cd of def.cards) {
    const given = (assignment[cd.id] ?? []).filter((s) => s >= 0 && s < def.sides.length);
    if (given.length === 0) missing.push(cd.id);
    else if (sameSet(given, cd.sides)) correct++;
    else wrong.push(cd.id);
  }
  return { correct, total: def.cards.length, wrong, missing };
}
