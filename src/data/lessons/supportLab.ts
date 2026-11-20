import type { L10n } from "@/lib/i18n";

/**
 * Pure models behind the hands-on labs of the support lesson: part groups of the BodyParts3D
 * skeleton/muscles, the material-deposit lab, and the two "reverse graph" curves.
 */

/* ------------------------------ 3D part groups ------------------------------ */

export type ModelFile = "skeleton" | "muscles";

export interface PickGroup {
  id: string;
  name: L10n;
  /** GLB file whose node names are matched (markers have none: they are drawn as overlays). */
  file: ModelFile;
  /** Matches a GLB node name. Markers never match. */
  test: (node: string) => boolean;
  /** An overlay annotation (ligament, cavity…) rather than a real mesh of the atlas. */
  marker?: boolean;
}

const has =
  (...parts: string[]) =>
  (n: string) =>
    parts.some((p) => n.includes(p));
const exact =
  (...names: string[]) =>
  (n: string) =>
    names.includes(n);
const side = (n: string) => n.replace(/^(right|left)-/, "");
const sideIn =
  (...names: string[]) =>
  (n: string) =>
    names.includes(side(n));
const none = () => false;

const CARPALS = [
  "scaphoid",
  "lunate",
  "triquetral",
  "pisiform",
  "trapezium",
  "trapezoid",
  "capitate",
  "hamate",
];
const TARSALS = [
  "talus",
  "calcaneus",
  "navicular",
  "cuboid",
  "medial-cuneiform",
  "intermediate-cuneiform",
  "lateral-cuneiform",
];

export const CRANIAL_NODES = [
  "frontal-bone",
  "right-parietal-bone",
  "left-parietal-bone",
  "occipital-bone",
  "right-temporal-bone",
  "left-temporal-bone",
  "sphenoid-bone",
  "ethmoid-bone",
];

export const PICK_GROUPS: Record<string, PickGroup> = {
  "cranial-bones": {
    id: "cranial-bones",
    name: { ar: "عظام الجزء المخي (8)", en: "Cranial bones (8)" },
    file: "skeleton",
    test: exact(...CRANIAL_NODES),
  },
  "facial-bones": {
    id: "facial-bones",
    name: { ar: "عظام الجزء الوجهي (14)", en: "Facial bones (14)" },
    file: "skeleton",
    test: (n) =>
      sideIn("nasal-bone", "lacrimal-bone", "zygomatic-bone", "maxilla", "palatine-bone")(n) ||
      sideIn("inferior-nasal-concha")(n) ||
      n === "vomer" ||
      n === "mandible",
  },
  "occipital-bone": {
    id: "occipital-bone",
    name: { ar: "العظم المؤخري", en: "Occipital bone" },
    file: "skeleton",
    test: exact("occipital-bone"),
  },
  mandible: {
    id: "mandible",
    name: { ar: "الفك السفلي", en: "Mandible" },
    file: "skeleton",
    test: exact("mandible"),
  },
  maxilla: {
    id: "maxilla",
    name: { ar: "الفك العلوي", en: "Maxilla" },
    file: "skeleton",
    test: sideIn("maxilla"),
  },
  hyoid: {
    id: "hyoid",
    name: { ar: "العظم اللامي", en: "Hyoid bone" },
    file: "skeleton",
    test: exact("hyoid-bone"),
  },
  atlas: {
    id: "atlas",
    name: { ar: "الفقرة العنقية الأولى (الأطلس)", en: "First cervical vertebra (atlas)" },
    file: "skeleton",
    test: exact("atlas-c1"),
  },
  axis: {
    id: "axis",
    name: { ar: "الفقرة العنقية الثانية", en: "Second cervical vertebra (axis)" },
    file: "skeleton",
    test: exact("axis-c2"),
  },
  "cervical-c4": {
    id: "cervical-c4",
    name: { ar: "الفقرة رقم 4 (منصّفة العنق)", en: "Vertebra no. 4 (middle of the neck)" },
    file: "skeleton",
    test: exact("fourth-cervical-vertebra-c4"),
  },
  "cervical-vertebrae": {
    id: "cervical-vertebrae",
    name: { ar: "الفقرات العنقية (7)", en: "Cervical vertebrae (7)" },
    file: "skeleton",
    test: (n) => /cervical-vertebra-c\d$|^atlas-c1$|^axis-c2$/.test(n),
  },
  "thoracic-vertebrae": {
    id: "thoracic-vertebrae",
    name: { ar: "الفقرات الصدرية (12)", en: "Thoracic vertebrae (12)" },
    file: "skeleton",
    test: (n) => /thoracic-vertebra-t\d+$/.test(n),
  },
  "thoracic-t10": {
    id: "thoracic-t10",
    name: { ar: "الفقرة الصدرية العاشرة (رقم 17)", en: "10th thoracic vertebra (no. 17)" },
    file: "skeleton",
    test: exact("tenth-thoracic-vertebra-t10"),
  },
  "lumbar-vertebrae": {
    id: "lumbar-vertebrae",
    name: { ar: "الفقرات القطنية (5)", en: "Lumbar vertebrae (5)" },
    file: "skeleton",
    test: (n) => /lumbar-vertebra-l\d$/.test(n),
  },
  "lumbar-l3": {
    id: "lumbar-l3",
    name: { ar: "فقرة قطنية نموذجية", en: "A typical lumbar vertebra" },
    file: "skeleton",
    test: exact("third-lumbar-vertebra-l3"),
  },
  sacrum: {
    id: "sacrum",
    name: { ar: "العجز (5 فقرات ملتحمة)", en: "Sacrum (5 fused vertebrae)" },
    file: "skeleton",
    test: exact("sacrum"),
  },
  "floating-ribs": {
    id: "floating-ribs",
    name: { ar: "الضلوع العائمة (11 و12)", en: "Floating ribs (11 and 12)" },
    file: "skeleton",
    test: sideIn("eleventh-rib", "twelfth-rib"),
  },
  "true-ribs": {
    id: "true-ribs",
    name: { ar: "العشرة أزواج الأولى من الضلوع", en: "First ten pairs of ribs" },
    file: "skeleton",
    test: (n) =>
      /^(right|left)-(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)-rib$/.test(
        n,
      ),
  },
  "rib-11": {
    id: "rib-11",
    name: { ar: "الضلع الحادي عشر", en: "11th rib" },
    file: "skeleton",
    test: sideIn("eleventh-rib"),
  },
  sternum: {
    id: "sternum",
    name: { ar: "عظمة القص", en: "Sternum" },
    file: "skeleton",
    test: exact("manubrium-of-sternum", "body-of-sternum", "xiphoid-process"),
  },
  "costal-cartilages": {
    id: "costal-cartilages",
    name: { ar: "الغضاريف الضلعية", en: "Costal cartilages" },
    file: "skeleton",
    test: has("costal-cartilage"),
  },
  discs: {
    id: "discs",
    name: { ar: "الأقراص بين الفقرات", en: "Intervertebral discs" },
    file: "skeleton",
    test: has("intervertebral-disc"),
  },
  clavicle: {
    id: "clavicle",
    name: { ar: "الترقوة", en: "Clavicle" },
    file: "skeleton",
    test: sideIn("clavicle"),
  },
  scapula: {
    id: "scapula",
    name: { ar: "لوح الكتف", en: "Scapula" },
    file: "skeleton",
    test: sideIn("scapula"),
  },
  humerus: {
    id: "humerus",
    name: { ar: "العضد", en: "Humerus" },
    file: "skeleton",
    test: sideIn("humerus"),
  },
  radius: {
    id: "radius",
    name: { ar: "الكعبرة", en: "Radius" },
    file: "skeleton",
    test: sideIn("radius"),
  },
  ulna: { id: "ulna", name: { ar: "الزند", en: "Ulna" }, file: "skeleton", test: sideIn("ulna") },
  carpals: {
    id: "carpals",
    name: { ar: "رسغ اليد (8)", en: "Wrist bones (8)" },
    file: "skeleton",
    test: sideIn(...CARPALS),
  },
  metacarpals: {
    id: "metacarpals",
    name: { ar: "راحة اليد (5)", en: "Hand palm (5)" },
    file: "skeleton",
    test: (n) => /metacarpal-bone$/.test(n),
  },
  "hand-phalanges": {
    id: "hand-phalanges",
    name: { ar: "سلاميات اليد", en: "Hand phalanges" },
    file: "skeleton",
    test: (n) => /(thumb|index-finger|middle-finger|ring-finger|little-finger).*phalanx$/.test(n),
  },
  "hip-bone": {
    id: "hip-bone",
    name: { ar: "عظمة الحوض (الحزام الحوضي)", en: "Hip bone (pelvic girdle)" },
    file: "skeleton",
    test: sideIn("hip-bone"),
  },
  femur: {
    id: "femur",
    name: { ar: "الفخذ", en: "Femur" },
    file: "skeleton",
    test: sideIn("femur"),
  },
  patella: {
    id: "patella",
    name: { ar: "الرضفة", en: "Patella" },
    file: "skeleton",
    test: sideIn("patella"),
  },
  tibia: {
    id: "tibia",
    name: { ar: "القصبة", en: "Tibia" },
    file: "skeleton",
    test: sideIn("tibia"),
  },
  fibula: {
    id: "fibula",
    name: { ar: "الشظية", en: "Fibula" },
    file: "skeleton",
    test: sideIn("fibula"),
  },
  tarsals: {
    id: "tarsals",
    name: { ar: "رسغ القدم (7)", en: "Ankle bones (7)" },
    file: "skeleton",
    test: sideIn(...TARSALS),
  },
  calcaneus: {
    id: "calcaneus",
    name: { ar: "عظمة الكعب", en: "Calcaneus (heel bone)" },
    file: "skeleton",
    test: sideIn("calcaneus"),
  },
  metatarsals: {
    id: "metatarsals",
    name: { ar: "مشط القدم (5)", en: "Foot metatarsals (5)" },
    file: "skeleton",
    test: (n) => /metatarsal-bone$/.test(n),
  },
  "foot-phalanges": {
    id: "foot-phalanges",
    name: { ar: "سلاميات القدم", en: "Toe phalanges" },
    file: "skeleton",
    test: (n) => /(big-toe|second-toe|third-toe|fourth-toe|little-toe).*phalanx$/.test(n),
  },
  gastrocnemius: {
    id: "gastrocnemius",
    name: { ar: "العضلة التوأمية", en: "Gastrocnemius (calf muscle)" },
    file: "muscles",
    test: exact("gastrocnemius"),
  },
  soleus: {
    id: "soleus",
    name: { ar: "العضلة النعلية", en: "Soleus" },
    file: "muscles",
    test: exact("soleus"),
  },
  "calcaneal-tendon": {
    id: "calcaneal-tendon",
    name: { ar: "وتر أخيل", en: "Achilles tendon" },
    file: "muscles",
    test: exact("calcaneal-tendon"),
  },
  /* overlay annotations (not part of the atlas files) */
  acl: {
    id: "acl",
    name: { ar: "الرباط الصليبي الأمامي", en: "Anterior cruciate ligament" },
    file: "skeleton",
    test: none,
    marker: true,
  },
  pcl: {
    id: "pcl",
    name: { ar: "الرباط الصليبي الخلفي", en: "Posterior cruciate ligament" },
    file: "skeleton",
    test: none,
    marker: true,
  },
  "medial-ligament": {
    id: "medial-ligament",
    name: { ar: "الرباط الوسطي", en: "Medial ligament" },
    file: "skeleton",
    test: none,
    marker: true,
  },
  "lateral-ligament": {
    id: "lateral-ligament",
    name: { ar: "الرباط الجانبي", en: "Lateral ligament" },
    file: "skeleton",
    test: none,
    marker: true,
  },
  "foramen-magnum": {
    id: "foramen-magnum",
    name: { ar: "الثقب الكبير", en: "Foramen magnum" },
    file: "skeleton",
    test: none,
    marker: true,
  },
  glenoid: {
    id: "glenoid",
    name: { ar: "التجويف الأروح", en: "Glenoid cavity" },
    file: "skeleton",
    test: none,
    marker: true,
  },
  acetabulum: {
    id: "acetabulum",
    name: { ar: "التجويف الحقي", en: "Acetabulum" },
    file: "skeleton",
    test: none,
    marker: true,
  },
  "pubic-symphysis": {
    id: "pubic-symphysis",
    name: { ar: "الارتفاق العاني", en: "Pubic symphysis" },
    file: "skeleton",
    test: none,
    marker: true,
  },
};

export function pickGroup(id: string): PickGroup | undefined {
  return Object.prototype.hasOwnProperty.call(PICK_GROUPS, id) ? PICK_GROUPS[id] : undefined;
}

/** Node names of `file` that belong to a group (empty for markers / unknown groups). */
export function groupNodes(id: string, names: readonly string[]): string[] {
  const g = pickGroup(id);
  return g && !g.marker ? names.filter((n) => g.test(n)) : [];
}

/** The group a clicked node belongs to, preferring the most specific one. */
export function groupOfNode(node: string, file: ModelFile): string | null {
  const specific = [
    "rib-11",
    "cervical-c4",
    "thoracic-t10",
    "lumbar-l3",
    "atlas",
    "axis",
    "occipital-bone",
    "mandible",
    "maxilla",
    "hyoid",
    "calcaneus",
    "sacrum",
  ];
  const order = [...specific, ...Object.keys(PICK_GROUPS).filter((k) => !specific.includes(k))];
  for (const id of order) {
    const g = PICK_GROUPS[id];
    if (g && !g.marker && g.file === file && g.test(node)) {
      return id === "rib-11" ? "floating-ribs" : id;
    }
  }
  return null;
}

/* --------------------------------- vertebrae -------------------------------- */

export const VERTEBRAE_COUNT = 33;

export type SpineRegion = "cervical" | "thoracic" | "lumbar" | "sacral" | "coccygeal";

/** Vertebra number (1–33) → region, exactly as the textbook table orders them. */
export function vertebraRegion(n: number): SpineRegion {
  if (n <= 7) return "cervical";
  if (n <= 19) return "thoracic";
  if (n <= 24) return "lumbar";
  if (n <= 29) return "sacral";
  return "coccygeal";
}

const CERVICAL_NODES = [
  "atlas-c1",
  "axis-c2",
  "third-cervical-vertebra-c3",
  "fourth-cervical-vertebra-c4",
  "fifth-cervical-vertebra-c5",
  "sixth-cervical-vertebra-c6",
  "seventh-cervical-vertebra-c7",
];
const THORACIC_NODES = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
  "eleventh",
  "twelfth",
].map((w, i) => `${w}-thoracic-vertebra-t${i + 1}`);
const LUMBAR_NODES = ["first", "second", "third", "fourth", "fifth"].map(
  (w, i) => `${w}-lumbar-vertebra-l${i + 1}`,
);

/** GLB node of vertebra `n`. The atlas has no separate coccyx mesh, so 30–33 point at the sacrum. */
export function vertebraNode(n: number): string {
  const i = Math.min(VERTEBRAE_COUNT, Math.max(1, Math.round(n)));
  if (i <= 7) return CERVICAL_NODES[i - 1]!;
  if (i <= 19) return THORACIC_NODES[i - 8]!;
  if (i <= 24) return LUMBAR_NODES[i - 20]!;
  return "sacrum";
}

/** Schematic size (0–100) the textbook describes: grows 1→24, shrinks 25→33. */
export function vertebraSize(n: number): number {
  const i = Math.min(VERTEBRAE_COUNT, Math.max(1, Math.round(n)));
  if (i <= 24) return Math.round(20 + ((i - 1) * 80) / 23);
  return Math.round(95 - ((i - 25) * 80) / 8);
}

export interface SizeCurveScore {
  rising: boolean;
  falling: boolean;
  /** Vertebra number of the highest point. */
  peakAt: number;
  peakOk: boolean;
  score: number;
}

/**
 * Grades a student-drawn curve of 33 values: non-decreasing from vertebra 1 to 24, non-increasing
 * from 25 to 33, with the peak at 24 or 25. `tol` forgives hand jitter.
 */
export function scoreSizeCurve(values: readonly number[], tol = 4): SizeCurveScore {
  const v = Array.from({ length: VERTEBRAE_COUNT }, (_, i) => {
    const x = values[i];
    return typeof x === "number" && Number.isFinite(x) ? x : NaN;
  });
  const complete = v.every((x) => !Number.isNaN(x));
  const rising = complete && v.slice(0, 24).every((x, i, a) => i === 0 || x >= a[i - 1]! - tol);
  const falling = complete && v.slice(24).every((x, i, a) => i === 0 || x <= a[i - 1]! + tol);
  let peakAt = 1;
  if (complete) v.forEach((x, i) => (x > v[peakAt - 1]! ? (peakAt = i + 1) : undefined));
  const peakOk = complete && peakAt >= 23 && peakAt <= 25;
  const score = Number(rising) + Number(falling) + Number(peakOk);
  return { rising, falling, peakAt, peakOk, score };
}

/* ------------------------------ skull tissue curve --------------------------- */

export const SKULL_AGES = [0, 20, 40, 60, 80] as const;

/** Schematic % of fibrous vs bony tissue at the skull joints: fibrous turns into bony with age. */
export function skullTissue(age: number): { fibrous: number; bony: number } {
  const a = Math.min(80, Math.max(0, Number.isFinite(age) ? age : 0));
  const bony = Math.round(100 * (1 - Math.exp(-a / 38)));
  return { fibrous: 100 - bony, bony };
}

export interface SkullCurveScore {
  fibrousFalls: boolean;
  bonyRises: boolean;
  startsFibrous: boolean;
  score: number;
}

/** Grades the 5 fibrous-% points (ages 0,20,40,60,80) the student drew. */
export function scoreSkullCurve(fibrous: readonly number[], tol = 3): SkullCurveScore {
  const f = SKULL_AGES.map((_, i) => {
    const x = fibrous[i];
    return typeof x === "number" && Number.isFinite(x) ? Math.min(100, Math.max(0, x)) : NaN;
  });
  const complete = f.every((x) => !Number.isNaN(x));
  const fibrousFalls =
    complete && f.every((x, i) => i === 0 || x <= f[i - 1]! + tol) && f[4]! < f[0]! - 20;
  const bonyRises = fibrousFalls; // bony = 100 − fibrous, so it rises exactly when fibrous falls
  const startsFibrous = complete && f[0]! >= 70;
  return {
    fibrousFalls,
    bonyRises,
    startsFibrous,
    score: Number(fibrousFalls) + Number(bonyRises) + Number(startsFibrous),
  };
}

/* ---------------------------------- radius ---------------------------------- */

/** The radius turns about the fixed ulna through at most a half circle (180°). */
export const RADIUS_MAX_DEG = 180;

export function radiusState(deg: number) {
  const d = Math.min(RADIUS_MAX_DEG, Math.max(0, Number.isFinite(deg) ? deg : 0));
  return {
    deg: d,
    /** The hand is carried by the radius (the wrist bones meet the radius, not the ulna). */
    handDeg: d,
    ulnaDeg: 0,
    crossed: d >= 60,
    /** At 0° the radius is on the thumb side (outside); at 180° it has crossed to the inside. */
    side: d < 90 ? ("outside" as const) : ("inside" as const),
  };
}

/* ------------------------------ material deposit lab ------------------------- */

export type MaterialId = "cellulose" | "lignin" | "cutin" | "suberin";
export type SampleId = "epidermis" | "collenchyma" | "sclerenchyma" | "xylem" | "cork";

export interface MaterialDef {
  id: MaterialId;
  name: L10n;
  /** Textbook permeability to water. */
  permeable: boolean;
  /** 0–100 numbers drawn as bars. */
  water: number;
  flex: number;
  stiff: number;
  /** Does the cell stay alive once its wall is laden with it (textbook table)? */
  alive: boolean;
  gives: L10n;
}

export const MATERIALS: Record<MaterialId, MaterialDef> = {
  cellulose: {
    id: "cellulose",
    name: { ar: "السيليلوز", en: "Cellulose" },
    permeable: true,
    water: 90,
    flex: 80,
    stiff: 45,
    alive: true,
    gives: { ar: "يكسب جدار الخلية القوة والمرونة", en: "gives the wall strength and flexibility" },
  },
  lignin: {
    id: "lignin",
    name: { ar: "اللجنين", en: "Lignin" },
    permeable: false,
    water: 8,
    flex: 12,
    stiff: 95,
    alive: false,
    gives: { ar: "يكسب جدار الخلية القوة والصلابة", en: "gives the wall strength and rigidity" },
  },
  cutin: {
    id: "cutin",
    name: { ar: "الكيوتين", en: "Cutin" },
    permeable: false,
    water: 0,
    flex: 55,
    stiff: 25,
    alive: true,
    gives: {
      ar: "يمنع نفاذ الماء من خلايا البشرة",
      en: "stops water escaping from epidermis cells",
    },
  },
  suberin: {
    id: "suberin",
    name: { ar: "السيوبرين", en: "Suberin" },
    permeable: false,
    water: 2,
    flex: 45,
    stiff: 30,
    alive: false,
    gives: {
      ar: "يمنع نفاذ الماء من خلايا الأنسجة الداخلية",
      en: "stops water escaping from the inner tissues",
    },
  },
};

export const MATERIAL_IDS = Object.keys(MATERIALS) as MaterialId[];

interface SampleNeed {
  /** Water must be at most / at least this (0–100). */
  maxWater?: number;
  minWater?: number;
  minFlex?: number;
  minStiff?: number;
  alive: boolean;
}

export interface SampleDef {
  id: SampleId;
  name: L10n;
  /** The textbook tissue it stands for. */
  tissue: L10n;
  correct: MaterialId;
  need: SampleNeed;
  where: L10n;
}

export const SAMPLES: Record<SampleId, SampleDef> = {
  epidermis: {
    id: "epidermis",
    name: { ar: "بشرة الساق (خلايا حية)", en: "Stem epidermis (living cells)" },
    tissue: {
      ar: "النسيج البارانشيمي — بشرة الساق والأوراق",
      en: "Parenchyma — epidermis of stem and leaves",
    },
    correct: "cutin",
    need: { maxWater: 10, alive: true },
    where: {
      ar: "يترسب على جدر خلايا البشرة من الخارج",
      en: "laid on the outside of the epidermis walls",
    },
  },
  collenchyma: {
    id: "collenchyma",
    name: { ar: "نسيج كولنشيمي (خلايا حية)", en: "Collenchyma (living cells)" },
    tissue: { ar: "النسيج الكولنشيمي", en: "Collenchyma" },
    correct: "cellulose",
    need: { minWater: 50, minFlex: 60, alive: true },
    where: {
      ar: "يترسب في جدر الخلايا أو في أجزاء منها",
      en: "laid in the cell walls or parts of them",
    },
  },
  sclerenchyma: {
    id: "sclerenchyma",
    name: { ar: "نسيج إسكرلنشيمي (خلايا غير حية)", en: "Sclerenchyma (dead cells)" },
    tissue: { ar: "النسيج الإسكرلنشيمي", en: "Sclerenchyma" },
    correct: "lignin",
    need: { minStiff: 90, alive: false },
    where: { ar: "يترسب على جدر الخلايا من الداخل", en: "laid on the inside of the cell walls" },
  },
  xylem: {
    id: "xylem",
    name: { ar: "أوعية وقصيبات الخشب (غير حية)", en: "Xylem vessels and tracheids (dead)" },
    tissue: { ar: "نسيج الخشب", en: "Xylem" },
    correct: "lignin",
    need: { minStiff: 90, maxWater: 10, alive: false },
    where: {
      ar: "تتغلظ به الأوعية الخشبية من الداخل",
      en: "thickens the xylem vessels from the inside",
    },
  },
  cork: {
    id: "cork",
    name: { ar: "الفلين (خلايا غير حية)", en: "Cork (dead cells)" },
    tissue: { ar: "طبقة الخلايا الفلينية", en: "Cork layer" },
    correct: "suberin",
    need: { maxWater: 10, alive: false },
    where: { ar: "طبقة فلينية تحيط بالنبات", en: "a corky layer around the plant" },
  },
};

export const SAMPLE_IDS = Object.keys(SAMPLES) as SampleId[];

export interface DepositResult {
  ok: boolean;
  water: number;
  flex: number;
  stiff: number;
  alive: boolean;
  /** What goes wrong, in plain language (empty when it is right). */
  problems: L10n[];
  verdict: L10n;
}

export function evaluateDeposit(sampleId: SampleId, materialId: MaterialId): DepositResult {
  const s = SAMPLES[sampleId];
  const m = MATERIALS[materialId];
  const problems: L10n[] = [];
  const { need } = s;
  if (need.maxWater !== undefined && m.water > need.maxWater) {
    problems.push({
      ar: `الماء بيعدّي من الجدار (نفاذية ${m.water}%) فالنبات يفقد ماءه`,
      en: `Water passes through the wall (${m.water}% permeable), so the plant loses water`,
    });
  }
  if (need.minWater !== undefined && m.water < need.minWater) {
    problems.push({
      ar: "الجدار بقى غير منفذ للماء فالخلية الحية مش هتاخد احتياجها",
      en: "The wall is now waterproof, so the living cell cannot take in what it needs",
    });
  }
  if (need.minFlex !== undefined && m.flex < need.minFlex) {
    problems.push({
      ar: "الجدار فقد المرونة فالنبات ميعرفش يتثني من غير ما يتكسر",
      en: "The wall lost its flexibility, so the plant cannot bend without snapping",
    });
  }
  if (need.minStiff !== undefined && m.stiff < need.minStiff) {
    problems.push({
      ar: "الجدار مش صلب كفاية يدعم النبات",
      en: "The wall is not rigid enough to support the plant",
    });
  }
  if (need.alive && !m.alive) {
    problems.push({
      ar: "الخلية هتموت بعد الترسيب، والنسيج ده المفروض خلاياه حية",
      en: "The cell dies after this deposit, but this tissue must stay alive",
    });
  }
  if (!need.alive && m.alive) {
    problems.push({
      ar: "الخلية هتفضل حية، والنسيج ده في الكتاب خلاياه غير حية",
      en: "The cell would stay alive, but the textbook says this tissue is dead",
    });
  }
  const ok = materialId === s.correct;
  if (!ok && problems.length === 0) {
    problems.push({
      ar: `المادة دي خصائصها قريبة، لكن النبات بيرسّب ${MATERIALS[s.correct].name.ar} هنا مش ${m.name.ar}`,
      en: `The properties are close, but the plant lays down ${MATERIALS[s.correct].name.en} here, not ${m.name.en}`,
    });
  }
  return {
    ok,
    water: m.water,
    flex: m.flex,
    stiff: m.stiff,
    alive: m.alive,
    problems: ok ? [] : problems,
    verdict: ok
      ? {
          ar: `✅ ${m.name.ar} هي الصح: ${m.gives.ar}`,
          en: `✅ ${m.name.en} is right: it ${m.gives.en}`,
        }
      : {
          ar: `❌ ${m.name.ar} مش مناسبة هنا`,
          en: `❌ ${m.name.en} does not fit here`,
        },
  };
}

/* ------------------------------ pelvis comparison ---------------------------- */

/** Relative width of the pelvic cavity (drawn only): wider in the female for pregnancy and birth. */
export const PELVIS_WIDTH = { male: 0.78, female: 1 } as const;
