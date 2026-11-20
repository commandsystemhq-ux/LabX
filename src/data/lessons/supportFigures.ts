import type { L10n } from "@/lib/i18n";
import type { FigureId } from "./supportTypes";
import { vertebraSize } from "./supportLab";

/**
 * The 2D «ministry exam» blueprint of every scene: schematic line drawings with numbered callouts.
 * The same callouts drive the labelling lab, the quiz drawings and the Blueprint toggle.
 * Coordinates are in each figure's own viewBox (W × H). Labels sit in two columns (x = 62 / 458)
 * or inside the drawing (`in`).
 */

export type Tone =
  | "none"
  | "ink"
  | "soft"
  | "wall"
  | "cyto"
  | "vac"
  | "nuc"
  | "green"
  | "mito"
  | "bone"
  | "cart"
  | "musc"
  | "lig"
  | "tend"
  | "cutin"
  | "xyl"
  | "phl";

export type Shape =
  | {
      t: "path";
      d: string;
      tone?: Tone;
      sw?: number;
      dash?: boolean;
      open?: boolean;
      part?: string;
    }
  | {
      t: "ellipse";
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      tone?: Tone;
      sw?: number;
      rot?: number;
      dash?: boolean;
      part?: string;
    }
  | {
      t: "rect";
      x: number;
      y: number;
      w: number;
      h: number;
      rx?: number;
      tone?: Tone;
      sw?: number;
      part?: string;
    }
  | { t: "text"; x: number; y: number; s: string; size?: number }
  /** The shapes plus their mirror image about the vertical axis x = 260. */
  | { t: "mirror"; shapes: Shape[] };

export interface Callout {
  id: string;
  /** Callouts sharing a group are the same label (e.g. the two transverse processes). */
  group: string;
  name: L10n;
  /** The point on the drawing the leader line touches. */
  ax: number;
  ay: number;
  /** `l` / `r`: label column at height `ly`; `in`: label drawn at (tx, ly) inside the drawing. */
  side: "l" | "r" | "in";
  ly: number;
  tx?: number;
}

export interface Figure {
  id: FigureId;
  title: L10n;
  w: number;
  h: number;
  shapes: Shape[];
  callouts: Callout[];
}

const c = (
  id: string,
  ar: string,
  en: string,
  ax: number,
  ay: number,
  side: Callout["side"],
  ly: number,
  extra: { group?: string; tx?: number } = {},
): Callout => ({
  id,
  group: extra.group ?? id,
  name: { ar, en },
  ax,
  ay,
  side,
  ly,
  ...(extra.tx !== undefined ? { tx: extra.tx } : {}),
});

const ell = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  tone: Tone,
  sw = 1.5,
  rot = 0,
  part?: string,
): Shape => ({ t: "ellipse", cx, cy, rx, ry, tone, sw, rot, ...(part ? { part } : {}) });
const line = (d: string, sw = 3, tone: Tone = "bone", part?: string): Shape => ({
  t: "path",
  d,
  tone,
  sw,
  open: true,
  ...(part ? { part } : {}),
});

/* -------------------------------- plant cell -------------------------------- */

const cellPlant: Figure = {
  id: "cell-plant",
  title: { ar: "الخلية النباتية", en: "Plant cell" },
  w: 520,
  h: 300,
  shapes: [
    { t: "rect", x: 130, y: 30, w: 260, h: 240, rx: 16, tone: "wall", sw: 5 },
    { t: "rect", x: 141, y: 41, w: 238, h: 218, rx: 12, tone: "cyto", sw: 1.5 },
    ell(270, 150, 66, 76, "vac"),
    ell(185, 92, 31, 31, "nuc", 1.2),
    { t: "ellipse", cx: 185, cy: 92, rx: 25, ry: 25, tone: "nuc", sw: 1, dash: true },
    ell(180, 88, 8, 8, "soft", 1),
    line("M152 178 q10 -12 20 0 t20 0 t20 0 M152 194 q10 -12 20 0 t20 0 t20 0", 2, "ink"),
    ell(352, 78, 15, 8, "green", 1.2, -20),
    ell(350, 218, 15, 8, "green", 1.2, 20),
    ell(165, 232, 15, 8, "green", 1.2, 10),
    ell(357, 150, 13, 7, "mito", 1.2),
    ell(160, 140, 12, 7, "mito", 1.2, 30),
  ],
  callouts: [
    c("cell-wall", "جدار خلوي", "Cell wall", 131, 70, "l", 35),
    c("plasma-membrane", "غشاء بلازمي", "Plasma membrane", 141, 112, "l", 80),
    c("nuclear-membrane", "غشاء نووي", "Nuclear membrane", 156, 92, "l", 125),
    c("nucleus", "النواة", "Nucleus", 188, 100, "l", 165),
    c("er", "شبكة إندوبلازمية", "Endoplasmic reticulum", 165, 180, "l", 215),
    c("cytoplasm", "سيتوبلازم", "Cytoplasm", 322, 58, "r", 50),
    c("vacuole", "فجوة عصارية", "Central vacuole", 290, 120, "r", 110),
    c("mitochondria", "ميتوكندريا", "Mitochondrion", 360, 150, "r", 165),
    c("chloroplast", "بلاستيدة خضراء", "Chloroplast", 350, 218, "r", 220),
  ],
};

const cellAnimal: Figure = {
  id: "cell-animal",
  title: { ar: "الخلية الحيوانية", en: "Animal cell" },
  w: 520,
  h: 300,
  shapes: [
    ell(260, 150, 126, 108, "cyto", 2.5),
    ell(240, 140, 36, 36, "nuc", 1.2),
    { t: "ellipse", cx: 240, cy: 140, rx: 30, ry: 30, tone: "nuc", sw: 1, dash: true },
    ell(236, 136, 9, 9, "soft", 1),
    line("M170 200 q10 -12 20 0 t20 0 t20 0 M170 216 q10 -12 20 0 t20 0 t20 0", 2, "ink"),
    ell(325, 110, 12, 12, "vac", 1.2),
    ell(332, 190, 9, 9, "vac", 1.2),
    ell(190, 100, 14, 7, "mito", 1.2, -25),
    ell(318, 150, 14, 7, "mito", 1.2, 20),
  ],
  callouts: [
    c("plasma-membrane", "غشاء بلازمي", "Plasma membrane", 136, 150, "l", 50),
    c("nuclear-membrane", "غشاء نووي", "Nuclear membrane", 212, 150, "l", 105),
    c("nucleus", "النواة", "Nucleus", 244, 146, "l", 160),
    c("er", "شبكة إندوبلازمية", "Endoplasmic reticulum", 190, 204, "l", 215),
    c("cytoplasm", "سيتوبلازم", "Cytoplasm", 300, 66, "r", 55),
    c("mitochondria", "ميتوكندريا", "Mitochondrion", 322, 152, "r", 110),
    c("vacuole", "فجوة", "Vacuole", 332, 190, "r", 170),
  ],
};

/* ---------------------------------- tissues --------------------------------- */

function parenchymaCells(): Shape[] {
  const out: Shape[] = [{ t: "rect", x: 10, y: 10, w: 160, h: 130, rx: 8, tone: "none", sw: 1 }];
  for (const [x, y] of [
    [45, 40],
    [95, 40],
    [145, 40],
    [70, 82],
    [120, 82],
    [45, 122],
    [95, 122],
  ] as const) {
    out.push(ell(x, y, 20, 18, "cyto", 1));
    out.push(ell(x, y, 5, 5, "nuc", 1));
  }
  return out;
}

function collenchymaCells(): Shape[] {
  const out: Shape[] = [{ t: "rect", x: 180, y: 10, w: 160, h: 130, rx: 8, tone: "none", sw: 1 }];
  for (const [x, y] of [
    [215, 40],
    [260, 40],
    [305, 40],
    [237, 82],
    [282, 82],
    [215, 122],
    [260, 122],
    [305, 122],
  ] as const) {
    out.push({ t: "rect", x: x - 19, y: y - 17, w: 38, h: 34, rx: 6, tone: "cyto", sw: 1 });
    for (const [dx, dy] of [
      [-19, -17],
      [19, -17],
      [-19, 17],
      [19, 17],
    ] as const) {
      out.push(ell(x + dx, y + dy, 4.5, 4.5, "wall", 1));
    }
  }
  return out;
}

function sclerenchymaCells(): Shape[] {
  const out: Shape[] = [{ t: "rect", x: 350, y: 10, w: 160, h: 130, rx: 8, tone: "none", sw: 1 }];
  for (const [x, y] of [
    [385, 40],
    [430, 40],
    [475, 40],
    [407, 82],
    [452, 82],
    [385, 122],
    [430, 122],
    [475, 122],
  ] as const) {
    out.push({ t: "rect", x: x - 19, y: y - 17, w: 38, h: 34, rx: 5, tone: "wall", sw: 6 });
    out.push(ell(x, y, 4, 4, "none", 0.8));
  }
  return out;
}

const tissues: Figure = {
  id: "tissues",
  title: { ar: "الأنسجة النباتية البسيطة والمركبة", en: "Simple and complex plant tissues" },
  w: 520,
  h: 300,
  shapes: [
    ...parenchymaCells(),
    ...collenchymaCells(),
    ...sclerenchymaCells(),
    { t: "rect", x: 10, y: 155, w: 240, h: 135, rx: 8, tone: "none", sw: 1 },
    { t: "rect", x: 40, y: 165, w: 36, h: 100, rx: 4, tone: "xyl", sw: 5 },
    ell(58, 185, 4, 2.5, "none", 0.8),
    ell(58, 215, 4, 2.5, "none", 0.8),
    ell(58, 245, 4, 2.5, "none", 0.8),
    { t: "path", d: "M110 165 L132 165 L124 262 L118 262 Z", tone: "xyl", sw: 3 },
    ell(121, 195, 4, 2.5, "none", 0.8),
    ell(121, 230, 4, 2.5, "none", 0.8),
    { t: "path", d: "M165 168 L187 168 L180 262 L172 262 Z", tone: "xyl", sw: 3 },
    { t: "rect", x: 265, y: 155, w: 245, h: 135, rx: 8, tone: "none", sw: 1 },
    { t: "rect", x: 305, y: 165, w: 40, h: 28, rx: 3, tone: "phl", sw: 1.5 },
    { t: "rect", x: 305, y: 193, w: 40, h: 28, rx: 3, tone: "phl", sw: 1.5 },
    { t: "rect", x: 305, y: 221, w: 40, h: 28, rx: 3, tone: "phl", sw: 1.5 },
    line("M305 193 H345 M305 221 H345", 2.5, "ink"),
    { t: "rect", x: 355, y: 168, w: 14, h: 80, rx: 5, tone: "cyto", sw: 1.5 },
    ell(362, 190, 3.5, 3.5, "nuc", 1),
    ell(362, 228, 3.5, 3.5, "nuc", 1),
  ],
  callouts: [
    c("parenchyma", "النسيج البارانشيمي", "Parenchyma", 95, 40, "in", 133, { tx: 90 }),
    c("intercellular-space", "مسافات بينية", "Intercellular space", 70, 61, "in", 12, { tx: 100 }),
    c("collenchyma", "النسيج الكولنشيمي", "Collenchyma", 260, 40, "in", 133, { tx: 260 }),
    c("sclerenchyma", "النسيج الإسكرلنشيمي", "Sclerenchyma", 430, 40, "in", 133, { tx: 430 }),
    c("xylem", "نسيج الخشب", "Xylem", 120, 270, "in", 285, { tx: 130 }),
    c("vessel", "وعاء", "Vessel", 58, 175, "in", 298, { tx: 58 }),
    c("pit", "النقر", "Pit", 58, 215, "in", 298, { tx: 112 }),
    c("tracheid", "قصيبة", "Tracheid", 176, 200, "in", 298, { tx: 190 }),
    c("phloem", "نسيج اللحاء", "Phloem", 380, 270, "in", 285, { tx: 385 }),
    c("sieve-tube", "أنبوبة غربالية", "Sieve tube", 325, 207, "in", 298, { tx: 320 }),
    c("companion-cell", "خلية مرافقة", "Companion cell", 362, 208, "in", 298, { tx: 420 }),
  ],
};

/* ------------------------------ stem cross-section --------------------------- */

function stemRing(): Shape[] {
  const out: Shape[] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    out.push(
      ell(260 + 112 * Math.cos(a), 150 + 112 * Math.sin(a), 8, 8, "cyto", 1.4),
      ell(260 + 112 * Math.cos(a), 150 + 112 * Math.sin(a), 11, 11, "wall", 0.6),
    );
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const x = 260 + 66 * Math.cos(a);
    const y = 150 + 66 * Math.sin(a);
    const ox = 260 + 90 * Math.cos(a);
    const oy = 150 + 90 * Math.sin(a);
    out.push(
      ell(ox, oy, 8, 6, "wall", 3, (a * 180) / Math.PI),
      ell(x, y, 9, 9, "xyl", 2.2),
      ell(x + 14 * Math.cos(a), y + 14 * Math.sin(a), 6, 6, "phl", 1.2),
    );
  }
  return out;
}

const stemSection: Figure = {
  id: "stem-section",
  title: {
    ar: "قطاع عرضي في ساق نبات حديث ذو فلقتين",
    en: "Cross-section of a young dicot stem",
  },
  w: 520,
  h: 300,
  shapes: [
    ell(260, 150, 134, 134, "cutin", 6),
    ell(260, 150, 128, 128, "cyto", 2),
    ell(260, 150, 30, 30, "soft", 1),
    ...stemRing(),
  ],
  callouts: [
    c("cutin", "الكيوتين", "Cutin", 135, 130, "l", 40),
    c("epidermis", "البشرة", "Epidermis", 142, 175, "l", 100),
    c("cellulose", "السيليلوز", "Cellulose", 150, 150, "l", 160),
    c("collenchyma", "كولنشيمي", "Collenchyma", 172, 228, "l", 220),
    c("lignin", "اللجنين", "Lignin", 330, 81, "r", 55),
    c("sclerenchyma", "إسكرلنشيمي", "Sclerenchyma", 350, 112, "r", 110),
    c("xylem", "الخشب", "Xylem", 319, 150, "r", 165),
    c("phloem", "اللحاء", "Phloem", 332, 164, "r", 220),
  ],
};

/* ----------------------------------- skeleton -------------------------------- */

function ribs(): Shape[] {
  const out: Shape[] = [];
  for (let i = 0; i < 12; i++) {
    const y0 = 120 + i * 10;
    const w = 28 + 8 * Math.min(i, 11 - i);
    const start = i < 10 ? 266 : 286;
    out.push(line(`M${start} ${y0} Q${start + w} ${y0 - 8} ${start + w + 6} ${y0 + 16}`, 2.2));
  }
  return out;
}

const skeletonFront: Figure = {
  id: "skeleton-front",
  title: { ar: "الهيكل العظمي — منظر أمامي", en: "Human skeleton — front view" },
  w: 520,
  h: 600,
  shapes: [
    ell(260, 42, 30, 36, "bone", 1.6),
    ell(260, 76, 20, 12, "bone", 1.4),
    { t: "rect", x: 254, y: 90, w: 12, h: 215, rx: 4, tone: "soft", sw: 1 },
    { t: "rect", x: 254, y: 114, w: 12, h: 66, rx: 4, tone: "bone", sw: 1.6 },
    {
      t: "mirror",
      shapes: [
        line("M264 108 Q300 100 328 114", 5),
        ...ribs(),
        line("M330 114 L346 206", 8),
        line("M346 210 L352 288", 5),
        line("M350 208 L370 288", 4),
        { t: "rect", x: 350, y: 290, w: 26, h: 14, rx: 3, tone: "bone", sw: 1.4 },
        line("M354 306 L352 334 M362 306 L363 338 M370 306 L373 336 M377 304 L382 330", 2.4),
        line("M352 336 L350 356 M363 340 L363 362 M373 338 L375 358 M382 332 L386 350", 2),
        {
          t: "path",
          d: "M268 300 Q336 288 344 330 Q334 366 292 352 Q272 346 268 324 Z",
          tone: "bone",
          sw: 1.8,
        },
        line("M312 356 L306 446", 9),
        ell(305, 455, 8, 10, "bone", 1.4),
        line("M300 466 L298 548", 6),
        line("M312 466 L316 548", 3),
        ell(303, 556, 14, 8, "bone", 1.4),
        line("M292 566 L290 582 M299 566 L298 584 M306 566 L306 585 M313 566 L314 583", 2.4),
      ],
    },
  ],
  callouts: [
    c("skull", "الجمجمة", "Skull", 278, 40, "r", 35),
    c("clavicle", "الترقوة", "Clavicle", 304, 106, "r", 95),
    c("humerus", "العضد", "Humerus", 338, 160, "r", 155),
    c("radius", "الكعبرة", "Radius", 372, 256, "r", 225),
    c("carpals", "رسغ اليد", "Wrist bones", 366, 297, "r", 280),
    c("metacarpals", "راحة اليد", "Hand palm", 372, 322, "r", 330),
    c("hand-phalanges", "سلاميات اليد", "Hand phalanges", 380, 348, "r", 380),
    c("femur", "الفخذ", "Femur", 310, 400, "r", 430),
    c("patella", "الرضفة", "Patella", 313, 455, "r", 480),
    c("tibia", "القصبة", "Tibia", 316, 520, "r", 530),
    c("sternum", "عظمة القص", "Sternum", 260, 150, "l", 100),
    c("ribs", "الضلوع", "Ribs", 215, 150, "l", 150),
    c("vertebral-column", "العمود الفقري", "Vertebral column", 260, 240, "l", 200),
    c("ulna", "الزند", "Ulna", 160, 250, "l", 250),
    c("hip-bone", "عظام الحوض", "Hip bone", 205, 320, "l", 320),
    c("fibula", "الشظية", "Fibula", 204, 520, "l", 440),
    c("tarsals", "رسغ القدم", "Ankle bones", 217, 556, "l", 500),
    c("metatarsals", "مشط القدم", "Foot metatarsals", 224, 574, "l", 550),
    c("foot-phalanges", "سلاميات القدم", "Toe phalanges", 207, 583, "l", 585),
  ],
};

const skeletonBack: Figure = {
  id: "skeleton-back",
  title: { ar: "الهيكل العظمي — منظر خلفي", en: "Human skeleton — back view" },
  w: 520,
  h: 600,
  shapes: [
    ell(260, 42, 30, 36, "bone", 1.6),
    { t: "rect", x: 254, y: 88, w: 12, h: 38, rx: 3, tone: "bone", sw: 1.4 },
    { t: "rect", x: 254, y: 128, w: 12, h: 76, rx: 3, tone: "bone", sw: 1.4 },
    { t: "rect", x: 253, y: 206, w: 14, h: 52, rx: 3, tone: "bone", sw: 1.4 },
    { t: "path", d: "M246 262 L274 262 L266 304 L254 304 Z", tone: "bone", sw: 1.4 },
    { t: "path", d: "M254 306 L266 306 L260 326 Z", tone: "bone", sw: 1.4 },
    {
      t: "mirror",
      shapes: [
        line("M264 108 Q300 100 328 114", 4),
        { t: "path", d: "M270 112 L322 120 L292 190 Z", tone: "soft", sw: 1.8 },
        line("M330 114 L346 206", 8),
        line("M346 210 L352 288", 5),
        line("M350 208 L370 288", 4),
        { t: "rect", x: 350, y: 290, w: 26, h: 14, rx: 3, tone: "bone", sw: 1.4 },
        line("M354 306 L352 334 M362 306 L363 338 M370 306 L373 336 M377 304 L382 330", 2.4),
        line("M352 336 L350 356 M363 340 L363 362 M373 338 L375 358 M382 332 L386 350", 2),
        {
          t: "path",
          d: "M268 268 Q336 258 344 312 Q334 356 292 350 Q272 340 268 310 Z",
          tone: "bone",
          sw: 1.8,
        },
        line("M312 356 L306 446", 9),
        line("M304 458 L302 548", 5),
        line("M314 458 L318 548", 4),
        ell(308, 560, 11, 10, "bone", 1.6),
        line("M298 574 L296 590 M308 574 L308 592 M318 574 L320 590", 2.4),
      ],
    },
  ],
  callouts: [
    c("cranial-part", "الجزء المخي", "Cranial part", 278, 36, "r", 30),
    c("clavicle", "الترقوة", "Clavicle", 310, 108, "r", 85),
    c("humerus", "العضد", "Humerus", 338, 160, "r", 150),
    c("radius", "الكعبرة", "Radius", 372, 256, "r", 220),
    c("carpals", "رسغ اليد", "Wrist bones", 366, 297, "r", 275),
    c("metacarpals", "راحة اليد", "Hand palm", 372, 322, "r", 325),
    c("hand-phalanges", "سلاميات اليد", "Hand phalanges", 380, 348, "r", 375),
    c("pelvic-girdle", "الحزام الحوضي", "Pelvic girdle", 330, 310, "r", 425),
    c("femur", "الفخذ", "Femur", 310, 400, "r", 475),
    c("tibia", "القصبة", "Tibia", 318, 520, "r", 525),
    c("calcaneus", "عظمة كعب القدم", "Calcaneus (heel bone)", 318, 562, "r", 575),
    c("cervical", "الفقرات العنقية", "Cervical vertebrae", 260, 105, "l", 60),
    c("scapula", "لوح الكتف", "Scapula", 228, 150, "l", 110),
    c("ulna", "الزند", "Ulna", 160, 250, "l", 170),
    c("thoracic", "الفقرات الصدرية", "Thoracic vertebrae", 260, 160, "l", 225),
    c("lumbar", "الفقرات القطنية", "Lumbar vertebrae", 260, 232, "l", 285),
    c("sacral", "الفقرات العجزية", "Sacral vertebrae", 260, 284, "l", 345),
    c("coccygeal", "الفقرات العصعصية", "Coccygeal vertebrae", 260, 316, "l", 405),
    c("fibula", "الشظية", "Fibula", 204, 520, "l", 520),
  ],
};

/* ------------------------------------ spine ---------------------------------- */

const bump = (n: number, centre: number, width: number) => Math.exp(-(((n - centre) / width) ** 2));

/** x of vertebra n in the side view: forward in neck and loin, backward in chest and sacrum. */
export function spineX(n: number): number {
  return (
    300 -
    16 * bump(n, 4, 3.4) +
    18 * bump(n, 13.5, 6.5) -
    18 * bump(n, 22, 3.2) +
    16 * bump(n, 30, 5.5)
  );
}
const spineY = (n: number) => 14 + n * 8.1;

function spineShapes(): Shape[] {
  const out: Shape[] = [];
  for (let n = 1; n <= 24; n++) {
    const w = 10 + vertebraSize(n) * 0.3;
    const tone: Tone = n <= 7 ? "bone" : n <= 19 ? "cart" : "wall";
    out.push({
      t: "rect",
      x: spineX(n) - w / 2,
      y: spineY(n),
      w,
      h: 6.4,
      rx: 2,
      tone,
      sw: 1.2,
    });
  }
  const sx = spineX(27);
  out.push({
    t: "path",
    d: `M${spineX(25) - 20} ${spineY(25)} L${spineX(25) + 20} ${spineY(25)} L${sx + 6} ${spineY(29) + 7} L${sx - 6} ${spineY(29) + 7} Z`,
    tone: "bone",
    sw: 1.6,
  });
  const cx = spineX(31);
  out.push({
    t: "path",
    d: `M${cx - 5} ${spineY(30) + 2} L${cx + 5} ${spineY(30) + 2} L${cx + 2} ${spineY(33) + 6} L${cx - 2} ${spineY(33) + 6} Z`,
    tone: "soft",
    sw: 1.4,
  });

  return out;
}

const spine: Figure = {
  id: "spine",
  title: { ar: "العمود الفقري — مجموعاته الخمس", en: "Vertebral column — the five groups" },
  w: 520,
  h: 300,
  shapes: spineShapes(),
  callouts: [
    c("cervical", "الفقرات العنقية (7)", "Cervical (7)", spineX(4) - 10, spineY(4) + 3, "l", 40),
    c(
      "thoracic",
      "الفقرات الصدرية (12)",
      "Thoracic (12)",
      spineX(13) + 12,
      spineY(13) + 3,
      "r",
      100,
    ),
    c("lumbar", "الفقرات القطنية (5)", "Lumbar (5)", spineX(22) - 18, spineY(22) + 3, "l", 190),
    c("sacral", "الفقرات العجزية (5)", "Sacral (5)", spineX(27) + 10, spineY(27) + 3, "r", 232),
    c(
      "coccygeal",
      "الفقرات العصعصية (4)",
      "Coccygeal (4)",
      spineX(31) + 5,
      spineY(31) + 3,
      "r",
      278,
    ),
  ],
};

/* ---------------------------------- vertebra --------------------------------- */

const vertebra: Figure = {
  id: "vertebra",
  title: { ar: "الفقرة العظمية النموذجية (فقرة قطنية)", en: "Typical bony vertebra (lumbar)" },
  w: 520,
  h: 300,
  shapes: [
    ell(260, 92, 64, 42, "bone", 2.4, 0, "body"),
    ell(260, 172, 52, 44, "bone", 2.4, 0, "neural-ring"),
    ell(260, 172, 30, 25, "none", 1.8, 0, "neural-canal"),
    line("M260 214 L258 276", 14, "bone", "spinous"),
    line("M214 150 L148 138", 11, "bone", "transverse-l"),
    line("M306 150 L372 138", 11, "bone", "transverse-r"),
    ell(226, 128, 9, 14, "cart", 1.6, 20, "sup-articular-l"),
    ell(294, 128, 9, 14, "cart", 1.6, -20, "sup-articular-r"),
    ell(230, 205, 9, 12, "cart", 1.6, -25, "inf-articular-l"),
    ell(290, 205, 9, 12, "cart", 1.6, 25, "inf-articular-r"),
  ],
  callouts: [
    c("body", "جسم الفقرة", "Vertebral body", 285, 80, "r", 40),
    c("transverse-r", "النتوء المستعرض", "Transverse process", 365, 139, "r", 100, {
      group: "transverse",
    }),
    c("sup-articular-r", "نتوء مفصلي علوي", "Superior articular process", 296, 124, "r", 150, {
      group: "sup-articular",
    }),
    c("neural-canal", "القناة العصبية", "Neural canal", 262, 172, "r", 200),
    c("inf-articular-r", "نتوء مفصلي سفلي", "Inferior articular process", 292, 208, "r", 250, {
      group: "inf-articular",
    }),
    c("transverse-l", "النتوء المستعرض", "Transverse process", 155, 140, "l", 60, {
      group: "transverse",
    }),
    c("sup-articular-l", "نتوء مفصلي علوي", "Superior articular process", 224, 124, "l", 110, {
      group: "sup-articular",
    }),
    c("neural-ring", "الحلقة الشوكية (العصبية)", "Neural ring", 214, 186, "l", 165),
    c("inf-articular-l", "نتوء مفصلي سفلي", "Inferior articular process", 228, 208, "l", 215),
    c("spinous", "النتوء الشوكي", "Spinous process", 259, 262, "l", 265),
  ],
};

/* ------------------------------------ skull ---------------------------------- */

const skull: Figure = {
  id: "skull",
  title: {
    ar: "الجمجمة: منظر أمامي وجانبي وسفلي",
    en: "The skull: front, side and bottom views",
  },
  w: 520,
  h: 300,
  shapes: [
    ell(95, 100, 62, 72, "bone", 2),
    ell(74, 100, 14, 12, "none", 1.6),
    ell(116, 100, 14, 12, "none", 1.6),
    line("M95 112 L90 132 L100 132", 1.6, "ink"),
    { t: "path", d: "M52 152 Q95 142 138 152 L132 180 Q95 192 58 180 Z", tone: "soft", sw: 1.6 },
    line("M66 166 H124", 5, "none"),
    { t: "path", d: "M60 182 Q95 222 130 182 L124 204 Q95 228 66 204 Z", tone: "bone", sw: 1.8 },
    line(
      "M70 166 V176 M80 166 V178 M90 166 V178 M100 166 V178 M110 166 V178 M120 166 V176",
      2,
      "ink",
    ),
    ell(262, 102, 62, 62, "bone", 2),
    {
      t: "path",
      d: "M308 118 Q340 118 336 150 L316 176 Q290 178 284 150 Z",
      tone: "soft",
      sw: 1.6,
    },
    { t: "path", d: "M292 170 Q318 200 300 218 L280 196 Z", tone: "bone", sw: 1.8 },
    ell(302, 100, 12, 11, "none", 1.5),
    line("M210 78 Q262 60 316 86", 1.4, "ink"),
    ell(430, 120, 56, 78, "bone", 2),
    ell(430, 150, 15, 22, "none", 2.4),
    ell(430, 70, 22, 18, "soft", 1.2),
  ],
  callouts: [
    c("cranial-part", "الجزء المخي", "Cranial part", 95, 60, "in", 20, { tx: 95 }),
    c("facial-part", "الجزء الوجهي", "Facial part", 60, 118, "in", 238, { tx: 60 }),
    c("maxilla", "الفك العلوي", "Upper jaw", 95, 152, "in", 256, { tx: 140 }),
    c("teeth", "الأسنان", "Teeth", 112, 172, "in", 276, { tx: 60 }),
    c("mandible", "الفك السفلي", "Lower jaw", 100, 214, "in", 292, { tx: 150 }),
    c("foramen-magnum", "الثقب الكبير", "Foramen magnum", 430, 150, "in", 280, { tx: 430 }),
  ],
};

/* ------------------------------------ thorax --------------------------------- */

function thoraxShapes(): Shape[] {
  const out: Shape[] = [];
  for (let i = 0; i < 12; i++) {
    const y = 40 + i * 17;
    out.push({ t: "rect", x: 140, y, w: 22, h: 12, rx: 3, tone: "bone", sw: 1.4 });
    if (i < 10) {
      const endY = 54 + i * 10;
      out.push(line(`M162 ${y + 6} Q250 ${y - 34 - i * 2} 328 ${endY - 6}`, 3));
      out.push(line(`M328 ${endY - 6} L356 ${endY}`, 3, "cart"));
    } else {
      out.push(line(`M162 ${y + 6} Q230 ${y - 6} 282 ${y + 24}`, 3));
    }
  }
  out.push({ t: "rect", x: 356, y: 40, w: 16, h: 118, rx: 4, tone: "bone", sw: 1.8 });
  out.push({ t: "path", d: "M358 158 L370 158 L364 182 Z", tone: "cart", sw: 1.4 });
  return out;
}

const thorax: Figure = {
  id: "thorax",
  title: { ar: "القفص الصدري", en: "Thoracic cage" },
  w: 520,
  h: 300,
  shapes: thoraxShapes(),
  callouts: [
    c("thoracic-vertebrae", "الفقرات الصدرية (12)", "Thoracic vertebrae (12)", 151, 120, "l", 90),
    c("floating-ribs", "الضلوع العائمة (11، 12)", "Floating ribs (11, 12)", 262, 232, "l", 235),
    c("true-ribs", "العشرة أزواج الأولى", "First ten pairs", 240, 90, "r", 40),
    c("sternum", "عظمة القص", "Sternum", 364, 100, "r", 105),
    c("costal-cartilage", "الجزء الغضروفي", "Cartilage part", 344, 90, "r", 170),
  ],
};

/* ----------------------------------- pectoral -------------------------------- */

const pectoral: Figure = {
  id: "pectoral",
  title: { ar: "الحزام الصدري والطرف العلوي", en: "Pectoral girdle and upper limb" },
  w: 520,
  h: 300,
  shapes: [
    { t: "path", d: "M222 52 L292 40 L252 142 Z", tone: "soft", sw: 2 },
    line("M150 36 Q210 38 276 50", 6),
    ell(290, 66, 10, 12, "cart", 1.8),
    line("M296 74 L310 190", 12),
    ell(310, 194, 12, 8, "cart", 1.6),
    line("M302 202 L304 270", 7),
    line("M318 202 L326 270", 5),
    { t: "rect", x: 300, y: 272, w: 32, h: 14, rx: 3, tone: "bone", sw: 1.4 },
    line("M304 288 L302 306 M312 288 L312 310 M320 288 L322 308 M328 288 L332 304", 2.4),
  ],
  callouts: [
    c("clavicle", "الترقوة", "Clavicle", 190, 38, "l", 40),
    c("scapula", "لوح الكتف", "Scapula", 240, 86, "l", 100),
    c("humerus", "العضد", "Humerus", 303, 132, "l", 160),
    c("ulna", "الزند", "Ulna", 303, 235, "l", 220),
    c("glenoid", "التجويف الأروح", "Glenoid cavity", 288, 62, "r", 30),
    c("shoulder-joint", "المفصل الكتفي", "Shoulder joint", 296, 74, "r", 75),
    c("elbow-joint", "مفصل الكوع", "Elbow joint", 320, 194, "r", 130),
    c("radius", "الكعبرة", "Radius", 324, 236, "r", 185),
    c("wrist", "رسغ اليد", "Wrist bones", 332, 279, "r", 235),
    c("palm", "راحة اليد", "Hand palm", 318, 296, "r", 275),
    c("digits", "أصابع اليد", "Fingers", 330, 306, "l", 285),
  ],
};

/* ------------------------------------ pelvic --------------------------------- */

const pelvic: Figure = {
  id: "pelvic",
  title: { ar: "الحزام الحوضي والطرف السفلي", en: "Pelvic girdle and lower limb" },
  w: 520,
  h: 440,
  shapes: [
    { t: "path", d: "M248 100 L248 160 L272 160 L272 100 Z", tone: "soft", sw: 1.4 },
    {
      t: "mirror",
      shapes: [
        { t: "path", d: "M266 40 Q330 10 372 56 L350 120 Q320 100 266 110 Z", tone: "bone", sw: 2 },
        {
          t: "path",
          d: "M266 150 Q300 168 312 214 L300 240 Q278 208 266 176 Z",
          tone: "bone",
          sw: 2,
        },
        {
          t: "path",
          d: "M312 120 Q344 140 340 190 L312 214 Q298 160 312 120 Z",
          tone: "bone",
          sw: 2,
        },
        ell(318, 150, 18, 18, "none", 2.2),
        line("M326 168 L318 290", 12),
        ell(316, 298, 9, 12, "bone", 1.6),
        line("M310 312 L306 392", 7),
        line("M322 312 L328 392", 4),
        ell(314, 404, 16, 9, "bone", 1.6),
        line("M300 414 L298 430 M308 414 L308 432 M316 414 L318 430 M324 414 L326 428", 2.4),
      ],
    },
  ],
  callouts: [
    c("ilium", "الحرقفة", "Ilium", 340, 62, "r", 40),
    c("acetabulum", "التجويف الحقي", "Acetabulum", 318, 150, "r", 100),
    c("femur", "الفخذ", "Femur", 322, 230, "r", 170),
    c("patella", "الرضفة", "Patella", 316, 298, "r", 230),
    c("tibia", "القصبة", "Tibia", 312, 360, "r", 290),
    c("tarsals", "رسغ القدم", "Ankle bones", 322, 404, "r", 350),
    c("toes", "أصابع القدم", "Toes", 318, 424, "r", 405),
    c("pubic-symphysis", "الارتفاق العاني", "Pubic symphysis", 260, 170, "l", 40),
    c("pubis", "العانة", "Pubis", 280, 165, "l", 100),
    c("ischium", "الورك", "Ischium", 210, 190, "l", 160),
    c("fibula", "الشظية", "Fibula", 198, 360, "l", 290),
    c("metatarsals", "مشط القدم", "Foot metatarsals", 196, 414, "l", 380),
  ],
};

/* ------------------------------------ joints --------------------------------- */

const joints: Figure = {
  id: "joints",
  title: { ar: "أنواع المفاصل", en: "Types of joints" },
  w: 520,
  h: 300,
  shapes: [
    {
      t: "path",
      d: "M20 40 L90 40 L90 90 L70 100 L90 110 L90 150 L20 150 Z",
      tone: "bone",
      sw: 1.8,
    },
    {
      t: "path",
      d: "M170 40 L100 40 L100 90 L120 100 L100 110 L100 150 L170 150 Z",
      tone: "bone",
      sw: 1.8,
    },
    line("M90 90 L70 100 L90 110 M100 90 L120 100 L100 110", 3, "tend"),
    { t: "rect", x: 200, y: 36, w: 110, h: 40, rx: 8, tone: "bone", sw: 1.8 },
    { t: "rect", x: 200, y: 82, w: 110, h: 16, rx: 5, tone: "cart", sw: 1.6 },
    { t: "rect", x: 200, y: 104, w: 110, h: 40, rx: 8, tone: "bone", sw: 1.8 },
    { t: "path", d: "M350 36 H450 V80 Q400 96 350 80 Z", tone: "bone", sw: 1.8 },
    { t: "path", d: "M350 150 H450 V112 Q400 98 350 112 Z", tone: "bone", sw: 1.8 },
    { t: "path", d: "M354 82 Q400 98 446 82", tone: "cart", sw: 3.5, open: true },
    { t: "path", d: "M354 110 Q400 96 446 110", tone: "cart", sw: 3.5, open: true },
    ell(400, 96, 30, 5, "vac", 1),
    line("M342 70 Q330 96 342 124 M458 70 Q470 96 458 124", 2.2, "lig"),
  ],
  callouts: [
    c("fibrous-joint", "مفصل ليفي (الجمجمة)", "Fibrous joint (skull)", 95, 100, "in", 175, {
      tx: 95,
    }),
    c(
      "cartilaginous-joint",
      "مفصل غضروفي (الفقرات)",
      "Cartilaginous joint (vertebrae)",
      255,
      90,
      "in",
      175,
      { tx: 255 },
    ),
    c("synovial-joint", "مفصل زلالي", "Synovial joint", 400, 96, "in", 175, { tx: 400 }),
  ],
};

/* ------------------------------------- knee ---------------------------------- */

const knee: Figure = {
  id: "knee",
  title: { ar: "مفصل الركبة وأربطته", en: "The knee joint and its ligaments" },
  w: 520,
  h: 300,
  shapes: [
    { t: "path", d: "M226 10 L296 10 L308 100 Q262 124 214 100 Z", tone: "bone", sw: 2 },
    { t: "path", d: "M214 130 Q262 148 312 130 L304 156 L226 156 Z", tone: "bone", sw: 2 },
    { t: "path", d: "M226 156 L304 156 L296 290 L236 290 Z", tone: "bone", sw: 2 },
    { t: "path", d: "M330 144 L352 144 L352 290 L332 290 Z", tone: "bone", sw: 2 },
    ell(262, 84, 22, 26, "cart", 2),
    line("M240 108 L286 140", 4.5, "lig"),
    line("M286 108 L240 140", 4.5, "tend"),
    line("M212 104 L216 146", 6, "lig"),
    line("M316 104 L334 150", 6, "lig"),
  ],
  callouts: [
    c("femur", "الفخذ", "Femur", 250, 36, "l", 40),
    c("patella", "الرضفة", "Patella", 242, 84, "l", 90),
    c("medial-ligament", "رباط وسطي", "Medial ligament", 214, 125, "l", 140),
    c("tibia", "القصبة", "Tibia", 244, 230, "l", 215),
    c("lateral-ligament", "رباط جانبي", "Lateral ligament", 325, 128, "r", 90),
    c("acl", "رباط صليبي أمامي", "Anterior cruciate ligament", 248, 116, "r", 140),
    c("pcl", "رباط صليبي خلفي", "Posterior cruciate ligament", 278, 118, "r", 190),
    c("fibula", "الشظية", "Fibula", 342, 220, "r", 245),
  ],
};

/* ----------------------------------- achilles -------------------------------- */

const achilles: Figure = {
  id: "achilles",
  title: { ar: "وتر أخيل والعضلة التوأمية", en: "Achilles tendon and the gastrocnemius" },
  w: 520,
  h: 300,
  shapes: [
    line("M236 10 L240 132", 14),
    line("M270 10 L272 132", 8),
    {
      t: "path",
      d: "M214 70 Q200 140 236 168 Q262 176 292 160 Q306 116 286 70 Q250 50 214 70 Z",
      tone: "musc",
      sw: 2,
    },
    { t: "path", d: "M238 166 L282 160 L266 236 L254 236 Z", tone: "tend", sw: 2 },
    {
      t: "path",
      d: "M240 238 Q260 226 282 238 Q300 262 280 276 Q250 282 238 264 Z",
      tone: "bone",
      sw: 2.4,
    },
    line("M284 270 Q340 276 372 268", 8),
  ],
  callouts: [
    c("tibia", "القصبة", "Tibia", 236, 22, "l", 30),
    c("gastrocnemius", "العضلة التوأمية", "Gastrocnemius", 224, 110, "l", 110),
    c("calcaneus", "عظمة الكعب", "Calcaneus (heel bone)", 244, 256, "l", 235),
    c("fibula", "الشظية", "Fibula", 270, 24, "r", 30),
    c("achilles-tendon", "وتر أخيل", "Achilles tendon", 262, 200, "r", 160),
  ],
};

export const FIGURES: Record<FigureId, Figure> = {
  "cell-plant": cellPlant,
  "cell-animal": cellAnimal,
  tissues,
  "stem-section": stemSection,
  "skeleton-front": skeletonFront,
  "skeleton-back": skeletonBack,
  spine,
  vertebra,
  skull,
  thorax,
  pectoral,
  pelvic,
  joints,
  knee,
  achilles,
};

export function getFigure(id: FigureId): Figure {
  return FIGURES[id];
}

/** Callouts of a figure matching an id or a group. */
export function calloutsOf(figure: FigureId, idOrGroup: string): Callout[] {
  return FIGURES[figure].callouts.filter((x) => x.id === idOrGroup || x.group === idOrGroup);
}

/** Distinct label groups of a figure, in order of appearance. */
export function labelGroups(figure: FigureId): string[] {
  return [...new Set(FIGURES[figure].callouts.map((x) => x.group))];
}
