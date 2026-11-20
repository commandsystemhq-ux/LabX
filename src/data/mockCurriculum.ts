import type { L10n } from "@/lib/i18n";
import type { SimKey } from "./simulations";

/**
 * Mock curriculum for LabX (Egyptian secondary stage, Ministry-aligned topics).
 * Replace with API data later — components only depend on these types.
 */

export type GradeId = "g10" | "g11" | "g12";
export type SubjectId = "biology" | "physics" | "chemistry";
export type SimulationId = "ohm" | "reaction-rate" | "diffusion" | "adrenaline";

export interface Grade {
  id: GradeId;
  name: L10n;
  short: L10n;
}

export interface Subject {
  id: SubjectId;
  name: L10n;
  emoji: string;
  tagline: L10n;
  previewTitle: L10n;
  simulationId: SimulationId;
}

/** Per-lesson starting setup for the shared subject simulation (free lab / guided / reset). */
export interface SimPreset {
  /** Overrides of the simulation's default variable values (clamped to each variable's range). */
  values?: Partial<Record<SimKey, number>>;
  /** Stage perspective the lesson opens with. */
  view?: "macro" | "molecular";
  /** Extra stage layers switched on when the lesson opens (unknown ids are ignored). */
  layers?: string[];
}

export interface Lesson {
  id: string;
  title: L10n;
  minutes: number;
  xp: number;
  simulationId: SimulationId;
  preset?: SimPreset;
}

export interface Unit {
  id: string;
  title: L10n;
  lessons: Lesson[];
}

export const grades: Grade[] = [
  {
    id: "g10",
    name: { ar: "الصف الأول الثانوي", en: "Grade 10 (1st Secondary)" },
    short: { ar: "أولى ثانوي", en: "Grade 10" },
  },
  {
    id: "g11",
    name: { ar: "الصف الثاني الثانوي", en: "Grade 11 (2nd Secondary)" },
    short: { ar: "تانية ثانوي", en: "Grade 11" },
  },
  {
    id: "g12",
    name: { ar: "الصف الثالث الثانوي", en: "Grade 12 (3rd Secondary)" },
    short: { ar: "تالتة ثانوي", en: "Grade 12" },
  },
];

export const subjects: Subject[] = [
  {
    id: "biology",
    name: { ar: "الأحياء", en: "Biology" },
    emoji: "🧬",
    tagline: {
      ar: "ادخل جوه الخلية وشوف الانتشار بعينك",
      en: "Step inside the cell and watch diffusion happen",
    },
    previewTitle: { ar: "الانتشار عبر الغشاء", en: "Diffusion across a membrane" },
    simulationId: "diffusion",
  },
  {
    id: "physics",
    name: { ar: "الفيزياء", en: "Physics" },
    emoji: "⚡",
    tagline: {
      ar: "تحكم في الجهد والمقاومة وشوف الإلكترونات بتجري",
      en: "Control voltage and resistance, watch electrons flow",
    },
    previewTitle: { ar: "قانون أوم", en: "Ohm's law" },
    simulationId: "ohm",
  },
  {
    id: "chemistry",
    name: { ar: "الكيمياء", en: "Chemistry" },
    emoji: "⚛️",
    tagline: {
      ar: "سخّن التفاعل وشوف التصادمات بتزيد",
      en: "Heat a reaction and watch collisions multiply",
    },
    previewTitle: { ar: "سرعة التفاعل الكيميائي", en: "Reaction rate" },
    simulationId: "reaction-rate",
  },
];

const SIM: Record<SubjectId, SimulationId> = {
  biology: "diffusion",
  physics: "ohm",
  chemistry: "reaction-rate",
};

type LessonSeed = [
  ar: string,
  en: string,
  minutes: number,
  preset?: SimPreset,
  /** Overrides the subject's default simulation (e.g. the biology "Be you" journey). */
  sim?: SimulationId,
];
type UnitSeed = { title: L10n; lessons: LessonSeed[] };

function build(grade: GradeId, subject: SubjectId, units: UnitSeed[]): Unit[] {
  return units.map((u, ui) => ({
    id: `${grade}-${subject}-u${ui + 1}`,
    title: u.title,
    lessons: u.lessons.map(([ar, en, minutes, preset, sim], li) => ({
      id: `${grade}-${subject}-u${ui + 1}-l${li + 1}`,
      title: { ar, en },
      minutes,
      xp: minutes * 5,
      simulationId: sim ?? SIM[subject],
      ...(preset ? { preset } : {}),
    })),
  }));
}

export const curriculum: Record<GradeId, Record<SubjectId, Unit[]>> = {
  g10: {
    biology: build("g10", "biology", [
      {
        title: { ar: "الأساس الكيميائي للحياة", en: "Chemical Basis of Life" },
        lessons: [
          ["الماء وأهميته للكائن الحي", "Water and living organisms", 18],
          ["الكربوهيدرات والدهون", "Carbohydrates and lipids", 22],
        ],
      },
      {
        title: { ar: "الخلية: وحدة البناء", en: "The Cell: Unit of Life" },
        lessons: [
          [
            "الغشاء البلازمي والنقل عبره",
            "Plasma membrane transport",
            25,
            { values: { gradient: 80 } },
          ],
          ["الانتشار والأسموزية", "Diffusion and osmosis", 20],
        ],
      },
      {
        title: { ar: "المجهر وبنية الغشاء", en: "Microscopy & Membrane Structure" },
        lessons: [
          [
            "المجهر الضوئي وتكبير الخلية",
            "Light microscope and cell magnification",
            18,
            { values: { gradient: 40 }, layers: ["microscope"] },
          ],
          [
            "طبقات الغشاء البلازمي (النموذج الفسيفسائي)",
            "Plasma membrane layers (fluid mosaic model)",
            22,
            { values: { permeability: 50 }, view: "molecular", layers: ["anatomy", "microscope"] },
          ],
        ],
      },
    ]),
    physics: build("g10", "physics", [
      {
        title: { ar: "القياس الفيزيائي", en: "Physical Measurement" },
        lessons: [
          ["الكميات الفيزيائية ووحداتها", "Physical quantities and units", 15],
          ["أخطاء القياس", "Measurement errors", 18],
        ],
      },
      {
        title: { ar: "الكهربية في حياتنا", en: "Electricity Around Us" },
        lessons: [
          ["الدائرة الكهربية البسيطة", "The simple circuit", 20],
          ["شدة التيار وفرق الجهد", "Current and potential difference", 24],
        ],
      },
      {
        title: { ar: "القدرة والطاقة الكهربية", en: "Electric Power & Energy" },
        lessons: [
          [
            "القدرة الكهربية P = V × I",
            "Electric power P = V × I",
            20,
            { values: { voltage: 12, resistance: 12 } },
          ],
          [
            "الطاقة الكهربية وفاتورة الكهرباء",
            "Electrical energy and your bill",
            18,
            { values: { voltage: 18, resistance: 20 } },
          ],
        ],
      },
    ]),
    chemistry: build("g10", "chemistry", [
      {
        title: { ar: "المادة وتركيبها", en: "Matter and Its Structure" },
        lessons: [
          ["تركيب الذرة", "Atomic structure", 20],
          ["الجدول الدوري", "The periodic table", 22],
        ],
      },
      {
        title: { ar: "التفاعلات الكيميائية", en: "Chemical Reactions" },
        lessons: [
          ["أنواع التفاعلات", "Types of reactions", 18],
          ["العوامل المؤثرة على سرعة التفاعل", "Factors affecting reaction rate", 24],
        ],
      },
      {
        title: { ar: "الطاقة والتصادم", en: "Energy & Collisions" },
        lessons: [
          [
            "التفاعلات الطاردة والماصة للحرارة",
            "Exothermic and endothermic reactions",
            20,
            { values: { temperature: 35 }, layers: ["energy"] },
          ],
          [
            "نظرية التصادم",
            "Collision theory",
            22,
            { values: { concentration: 1.4 }, view: "molecular" },
          ],
        ],
      },
    ]),
  },
  g11: {
    biology: build("g11", "biology", [
      {
        title: { ar: "التغذية والهضم", en: "Nutrition and Digestion" },
        lessons: [
          ["الإنزيمات وعملها", "Enzymes in action", 22],
          ["الامتصاص في الأمعاء", "Absorption in the intestine", 20],
        ],
      },
      {
        title: { ar: "النقل في الكائنات الحية", en: "Transport in Organisms" },
        lessons: [
          ["النقل في النبات", "Transport in plants", 24],
          [
            "الانتشار عبر الأغشية",
            "Diffusion across membranes",
            20,
            { values: { permeability: 80 }, view: "molecular" },
          ],
        ],
      },
      {
        title: { ar: "التبادل عبر الأسطح", en: "Exchange Across Surfaces" },
        lessons: [
          [
            "التبادل الغازي في الحويصلات الهوائية",
            "Gas exchange in the alveoli",
            24,
            {
              values: { gradient: 70, permeability: 85 },
              view: "molecular",
              layers: ["anatomy", "timeline"],
            },
          ],
          [
            "الأسموزية في خلايا النبات",
            "Osmosis in plant cells",
            20,
            { values: { gradient: 60, permeability: 40 }, layers: ["timeline"] },
          ],
        ],
      },
    ]),
    physics: build("g11", "physics", [
      {
        title: { ar: "الموجات", en: "Waves" },
        lessons: [
          ["الحركة الموجية", "Wave motion", 20],
          ["الصوت", "Sound", 18],
        ],
      },
      {
        title: { ar: "الحرارة والمادة", en: "Heat and Matter" },
        lessons: [
          ["قوانين الغازات", "Gas laws", 25],
          [
            "المقاومة ودرجة الحرارة",
            "Resistance and temperature",
            22,
            { values: { temperature: 60 }, view: "molecular" },
          ],
        ],
      },
      {
        title: { ar: "الكهربية والأمان", en: "Electricity & Safety" },
        lessons: [
          [
            "الفيوز والحماية من القصر",
            "Fuses and short-circuit protection",
            22,
            { values: { voltage: 20, resistance: 8 }, layers: ["hidden"] },
          ],
          [
            "سخونة الأسلاك والفقد في الطاقة",
            "Wire heating and energy loss",
            20,
            { values: { temperature: 80, resistance: 15 }, view: "molecular" },
          ],
        ],
      },
    ]),
    chemistry: build("g11", "chemistry", [
      {
        title: { ar: "المحاليل والأحماض", en: "Solutions and Acids" },
        lessons: [
          ["أنواع المحاليل", "Types of solutions", 18],
          ["الأحماض والقواعد", "Acids and bases", 22],
        ],
      },
      {
        title: { ar: "الكيمياء الحرارية", en: "Thermochemistry" },
        lessons: [
          ["المحتوى الحراري", "Enthalpy", 20],
          ["طاقة التنشيط والعوامل الحفازة", "Activation energy and catalysts", 24],
        ],
      },
      {
        title: { ar: "العوامل الحفازة في الصناعة والحياة", en: "Catalysts in Industry & Life" },
        lessons: [
          [
            "الحفاز في الصناعة (عملية هابر)",
            "Industrial catalysts (Haber process)",
            24,
            { values: { temperature: 45, catalyst: 4 }, layers: ["energy"] },
          ],
          [
            "الإنزيمات كعوامل حفازة حيوية",
            "Enzymes as biological catalysts",
            20,
            { values: { temperature: 37, catalyst: 6 }, view: "molecular" },
          ],
        ],
      },
    ]),
  },
  g12: {
    biology: build("g12", "biology", [
      {
        title: { ar: "الدعامة والحركة", en: "Support and Movement" },
        lessons: [
          ["الهيكل العظمي", "The skeleton", 20],
          ["الانقباض العضلي", "Muscle contraction", 24],
        ],
      },
      {
        title: { ar: "التنظيم الهرموني", en: "Hormonal Coordination" },
        lessons: [
          ["الغدد الصماء", "Endocrine glands", 22],
          ["النقل الخلوي والانتشار", "Cellular transport and diffusion", 20],
        ],
      },
      {
        title: { ar: "الخلية تحت الضغط", en: "Cells Under Stress" },
        lessons: [
          [
            "الانتشار المُيسَّر وقنوات الأغشية",
            "Facilitated diffusion and channel proteins",
            22,
            {
              values: { permeability: 35, gradient: 70 },
              view: "molecular",
              layers: ["anatomy", "microscope"],
            },
          ],
          [
            "تأثير الحرارة على الغشاء الخلوي",
            "Heat effects on the cell membrane",
            20,
            { values: { temperature: 40 }, layers: ["timeline", "microscope"] },
          ],
        ],
      },
      {
        title: {
          ar: "كن أنت: رحلة الأدرينالين والقلب",
          en: "Be You: The Adrenaline & Heart Journey",
        },
        lessons: [
          [
            "رحلة الأدرينالين والقلب",
            "The adrenaline and heart journey",
            25,
            { values: { adrenaline: 10 }, layers: ["signals"] },
            "adrenaline",
          ],
          [
            "الأكسجين والجلوكوز ووقود المخ",
            "Oxygen, glucose and brain fuel",
            22,
            {
              values: { oxygen: 92, glucose: 75 },
              view: "molecular",
              layers: ["signals"],
            },
            "adrenaline",
          ],
        ],
      },
    ]),
    physics: build("g12", "physics", [
      {
        title: { ar: "التيار الكهربي وقانون أوم", en: "Electric Current & Ohm's Law" },
        lessons: [
          ["شدة التيار وفرق الجهد", "Current and potential difference", 20],
          ["قانون أوم", "Ohm's law", 25],
          [
            "المقاومة الكهربية ودرجة الحرارة",
            "Resistance and temperature",
            22,
            { values: { temperature: 60 }, view: "molecular" },
          ],
        ],
      },
      {
        title: { ar: "التأثير المغناطيسي للتيار", en: "Magnetic Effect of Current" },
        lessons: [
          ["المجال المغناطيسي لسلك مستقيم", "Field around a straight wire", 24],
          ["المحرك الكهربي", "The electric motor", 26],
        ],
      },
      {
        title: { ar: "المجال الكهربي وحركة الإلكترونات", en: "Electric Field & Electron Motion" },
        lessons: [
          [
            "المجال الكهربي داخل الموصل",
            "The electric field inside a conductor",
            24,
            {
              values: { voltage: 16, resistance: 20 },
              view: "molecular",
              layers: ["field", "hidden"],
            },
          ],
          [
            "سرعة الانجراف والقوة على الإلكترون",
            "Drift velocity and the force on an electron",
            26,
            { values: { voltage: 20, resistance: 25 }, view: "molecular", layers: ["field"] },
          ],
        ],
      },
    ]),
    chemistry: build("g12", "chemistry", [
      {
        title: { ar: "الاتزان الكيميائي", en: "Chemical Equilibrium" },
        lessons: [
          ["سرعة التفاعل الكيميائي", "Reaction rate", 22],
          [
            "العوامل المؤثرة على سرعة التفاعل",
            "Factors affecting reaction rate",
            24,
            { values: { concentration: 1.5 } },
          ],
        ],
      },
      {
        title: { ar: "الكيمياء الكهربية", en: "Electrochemistry" },
        lessons: [
          ["الخلايا الجلفانية", "Galvanic cells", 25],
          ["التحليل الكهربي", "Electrolysis", 24],
        ],
      },
      {
        title: { ar: "قاعدة لوشاتيليه", en: "Le Chatelier's Principle" },
        lessons: [
          [
            "لوشاتيليه: أثر التركيز",
            "Le Chatelier: effect of concentration",
            24,
            { values: { concentration: 1.6 }, layers: ["equilibrium"] },
          ],
          [
            "لوشاتيليه: أثر الحرارة والحفاز",
            "Le Chatelier: effect of temperature and catalyst",
            26,
            {
              values: { temperature: 45, catalyst: 3 },
              view: "molecular",
              layers: ["equilibrium", "energy"],
            },
          ],
        ],
      },
    ]),
  },
};

/** An immersive "Be you" journey: opens its lesson and shows up in the sidebar. */
export interface Journey {
  id: string;
  title: L10n;
  tagline: L10n;
  emoji: string;
  subject: SubjectId;
  /** The lesson (4-step loop) that runs the journey. */
  lessonId: string;
}

export const journeys: Journey[] = [
  {
    id: "adrenaline-heart",
    title: { ar: "رحلة الأدرينالين والقلب", en: "The adrenaline & heart journey" },
    tagline: {
      ar: "اركب جوه الدم: من القلب والأوعية للمخ",
      en: "Ride inside the blood: heart, vessels and brain",
    },
    emoji: "❤️",
    subject: "biology",
    lessonId: "g12-biology-u4-l1",
  },
];

export const DEFAULT_GRADE: GradeId = "g12";
export const DEFAULT_SUBJECT: SubjectId = "physics";
export const DEFAULT_LESSON_ID = "g12-physics-u1-l2";

export const STUDENT_PRICE_EGP = 99;

export function isGradeId(v: unknown): v is GradeId {
  return v === "g10" || v === "g11" || v === "g12";
}
export function isSubjectId(v: unknown): v is SubjectId {
  return v === "biology" || v === "physics" || v === "chemistry";
}

export function getGrade(id: GradeId) {
  return grades.find((g) => g.id === id) ?? grades[2];
}
export function getSubject(id: SubjectId) {
  return subjects.find((s) => s.id === id) ?? subjects[1];
}

export interface LessonLookup {
  grade: Grade;
  subject: Subject;
  unit: Unit;
  lesson: Lesson;
}

export function findLesson(id: string | undefined): LessonLookup {
  for (const grade of grades) {
    for (const subject of subjects) {
      for (const unit of curriculum[grade.id][subject.id]) {
        const lesson = unit.lessons.find((l) => l.id === id);
        if (lesson) return { grade, subject, unit, lesson };
      }
    }
  }
  if (id !== DEFAULT_LESSON_ID) return findLesson(DEFAULT_LESSON_ID);
  throw new Error("Default lesson missing from curriculum");
}

/** Resolves a lesson's mastery (0–100) from the learner's saved progress. */
export type MasteryResolver = (lesson: Lesson) => number;

export function subjectMastery(units: Unit[], mastery: MasteryResolver) {
  const all = units.flatMap((u) => u.lessons);
  if (all.length === 0) return 0;
  return Math.round(all.reduce((s, l) => s + mastery(l), 0) / all.length);
}

export function unitMastery(unit: Unit, mastery: MasteryResolver) {
  return subjectMastery([unit], mastery);
}

/** Every lesson in curriculum order (grade → subject → unit → lesson). */
export function allLessons(): LessonLookup[] {
  const out: LessonLookup[] = [];
  for (const grade of grades) {
    for (const subject of subjects) {
      for (const unit of curriculum[grade.id][subject.id]) {
        for (const lesson of unit.lessons) out.push({ grade, subject, unit, lesson });
      }
    }
  }
  return out;
}

const lessonIds = new Set(allLessons().map((x) => x.lesson.id));

export function lessonExists(id: string) {
  return lessonIds.has(id);
}

/** Next lesson in the same grade and subject (crossing unit boundaries), if any. */
export function getNextLesson(id: string): LessonLookup | null {
  const current = findLesson(id);
  const flat = curriculum[current.grade.id][current.subject.id].flatMap((unit) =>
    unit.lessons.map((lesson) => ({ ...current, unit, lesson })),
  );
  const index = flat.findIndex((x) => x.lesson.id === current.lesson.id);
  return flat[index + 1] ?? null;
}

export function countLessons(subject: SubjectId) {
  return grades.reduce(
    (n, g) => n + curriculum[g.id][subject].reduce((m, u) => m + u.lessons.length, 0),
    0,
  );
}
