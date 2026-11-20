import type { L10n } from "@/lib/i18n";
import type { AnatomyFile } from "./adr3d-model";

/**
 * Bilingual names for the parts of the BodyParts3D models (their node ids are English, kebab-case).
 * Common parts have a curated Arabic name; everything else falls back to the English name with an
 * Arabic category word, so every clickable part always shows a readable name in both languages.
 */

const AR: Record<string, string> = {
  // heart
  "right-atrium": "الأذين الأيمن",
  "left-atrium": "الأذين الأيسر",
  "ventricular-wall": "جدار البطينين",
  "right-ventricle": "البطين الأيمن",
  "left-ventricle": "البطين الأيسر",
  "ascending-aorta": "الشريان الأورطي الصاعد",
  "aortic-arch": "قوس الأورطي",
  "pulmonary-trunk": "الجذع الرئوي",
  "superior-vena-cava": "الوريد الأجوف العلوي",
  "left-coronary": "الشريان التاجي الأيسر",
  "right-coronary": "الشريان التاجي الأيمن",
  // adrenals + kidneys
  "right-adrenal-gland": "الغدة الكظرية اليمنى",
  "left-adrenal-gland": "الغدة الكظرية اليسرى",
  "right-kidney": "الكلية اليمنى",
  "left-kidney": "الكلية اليسرى",
  aorta: "الشريان الأورطي",
  "middle-suprarenal-arteries": "الشرايين الكظرية الوسطى",
  "inferior-suprarenal-arteries": "الشرايين الكظرية السفلية",
  "renal-arteries": "الشرايين الكلوية",
  "right-suprarenal-vein": "الوريد الكظري الأيمن",
  "left-suprarenal-vein": "الوريد الكظري الأيسر",
  "inferior-vena-cava": "الوريد الأجوف السفلي",
  "renal-veins": "الأوردة الكلوية",
  // vessels
  "carotid-arteries": "الشرايين السباتية",
  "vertebral-arteries": "الشرايين الفقرية",
  "jugular-veins": "الأوردة الوداجية",
  "thoracic-aorta": "الأورطي الصدري",
  "abdominal-aorta": "الأورطي البطني",
  "brachiocephalic-trunk": "الجذع العضدي الرأسي",
  "pulmonary-arteries": "الشرايين الرئوية",
  "pulmonary-veins": "الأوردة الرئوية",
  "subclavian-arteries": "الشرايين تحت الترقوة",
  "axillary-arteries": "الشرايين الإبطية",
  "brachial-arteries": "الشرايين العضدية",
  "radial-arteries": "الشرايين الكعبرية",
  "ulnar-arteries": "الشرايين الزندية",
  "celiac-trunk": "الجذع البطني",
  "hepatic-artery": "الشريان الكبدي",
  "splenic-artery": "الشريان الطحالي",
  "portal-vein": "الوريد البابي",
  "femoral-arteries": "الشرايين الفخذية",
  "femoral-veins": "الأوردة الفخذية",
  "common-iliac-arteries": "الشرايين الحرقفية المشتركة",
  "great-saphenous-veins": "الوريد الصافن الكبير",
  // brain
  "left-frontal": "الفص الجبهي الأيسر",
  "right-frontal": "الفص الجبهي الأيمن",
  "left-parietal": "الفص الجداري الأيسر",
  "right-parietal": "الفص الجداري الأيمن",
  "left-temporal": "الفص الصدغي الأيسر",
  "right-temporal": "الفص الصدغي الأيمن",
  "left-occipital": "الفص القذالي الأيسر",
  "right-occipital": "الفص القذالي الأيمن",
  "left-hippocampus": "الحصين الأيسر",
  "right-hippocampus": "الحصين الأيمن",
  midbrain: "المخ المتوسط",
  pons: "الجسر",
  medulla: "النخاع المستطيل",
  cerebellum: "المخيخ",
  "third-ventricle": "البطين الثالث",
  "fourth-ventricle": "البطين الرابع",
  // spinal cord
  "spinal-cord": "الحبل الشوكي",
  "medulla-oblongata": "النخاع المستطيل",
  "brachial-plexus": "الضفيرة العضدية",
  "cauda-equina": "ذنب الفرس",
  sacrum: "العجز",
  // muscles
  trapezius: "العضلة شبه المنحرفة",
  "latissimus-dorsi": "العضلة الظهرية العريضة",
  "pectoralis-major": "العضلة الصدرية الكبرى",
  deltoid: "العضلة الدالية",
  "biceps-brachii": "العضلة ذات الرأسين العضدية",
  "triceps-brachii": "العضلة ثلاثية الرؤوس العضدية",
  brachialis: "العضلة العضدية",
  "rectus-femoris": "العضلة المستقيمة الفخذية",
  "biceps-femoris": "العضلة ذات الرأسين الفخذية",
  gastrocnemius: "العضلة التوأمية",
  masseter: "العضلة الماضغة",
  sternocleidomastoid: "العضلة القترائية الترقوية الخشائية",
  "gluteus-maximus": "العضلة الألوية الكبرى",
  diaphragm: "الحجاب الحاجز",
  "rectus-abdominis": "العضلة المستقيمة البطنية",
  sartorius: "العضلة الخياطية",
};

const CATEGORY: Record<AnatomyFile["id"], L10n> = {
  muscles: { ar: "عضلة", en: "Muscle" },
  skeleton: { ar: "عظم", en: "Bone" },
  vessels: { ar: "وعاء دموي", en: "Blood vessel" },
  "spinal-cord": { ar: "جهاز عصبي", en: "Nervous system" },
  heart: { ar: "القلب", en: "Heart" },
  brain: { ar: "المخ", en: "Brain" },
  adrenals: { ar: "الغدد والكلى", en: "Glands & kidneys" },
};

export const titleCase = (id: string) =>
  id
    .replace(/-/g, " ")
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b([CTLS]\d)\b/g, (m) => m.toUpperCase());

/** Name of one part (a GLB node id) in both languages. */
export function partName(file: AnatomyFile["id"], id: string): L10n {
  const en = titleCase(id);
  const ar = AR[id];
  if (ar) return { ar, en };
  if (/^nerve-[ct]\d+$/.test(id))
    return { ar: `العصب ${id.slice(6).toUpperCase()}`, en: `Nerve ${id.slice(6).toUpperCase()}` };
  if (/^vertebra-/.test(id))
    return {
      ar: `الفقرة ${id.slice(9).toUpperCase()}`,
      en: `Vertebra ${id.slice(9).toUpperCase()}`,
    };
  return { ar: `${CATEGORY[file].ar}: ${en}`, en };
}

export const categoryName = (file: AnatomyFile["id"]): L10n => CATEGORY[file];
