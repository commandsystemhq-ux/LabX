import type { L10n } from "@/lib/i18n";

/**
 * Mock curriculum for LabX (Egyptian secondary stage, Ministry-aligned topics).
 * Replace with API data later — components only depend on these types.
 */

export type GradeId = "g10" | "g11" | "g12";
export type SubjectId = "biology" | "physics" | "chemistry";
export type SimulationId = "ohm" | "reaction-rate" | "diffusion";

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

export interface Lesson {
  id: string;
  title: L10n;
  minutes: number;
  /** 0–100 */
  mastery: number;
  xp: number;
  simulationId: SimulationId;
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

type LessonSeed = [ar: string, en: string, minutes: number, mastery: number];
type UnitSeed = { title: L10n; lessons: LessonSeed[] };

function build(grade: GradeId, subject: SubjectId, units: UnitSeed[]): Unit[] {
  return units.map((u, ui) => ({
    id: `${grade}-${subject}-u${ui + 1}`,
    title: u.title,
    lessons: u.lessons.map(([ar, en, minutes, mastery], li) => ({
      id: `${grade}-${subject}-u${ui + 1}-l${li + 1}`,
      title: { ar, en },
      minutes,
      mastery,
      xp: minutes * 5,
      simulationId: SIM[subject],
    })),
  }));
}

export const curriculum: Record<GradeId, Record<SubjectId, Unit[]>> = {
  g10: {
    biology: build("g10", "biology", [
      {
        title: { ar: "الأساس الكيميائي للحياة", en: "Chemical Basis of Life" },
        lessons: [
          ["الماء وأهميته للكائن الحي", "Water and living organisms", 18, 88],
          ["الكربوهيدرات والدهون", "Carbohydrates and lipids", 22, 61],
        ],
      },
      {
        title: { ar: "الخلية: وحدة البناء", en: "The Cell: Unit of Life" },
        lessons: [
          ["الغشاء البلازمي والنقل عبره", "Plasma membrane transport", 25, 34],
          ["الانتشار والأسموزية", "Diffusion and osmosis", 20, 0],
        ],
      },
    ]),
    physics: build("g10", "physics", [
      {
        title: { ar: "القياس الفيزيائي", en: "Physical Measurement" },
        lessons: [
          ["الكميات الفيزيائية ووحداتها", "Physical quantities and units", 15, 92],
          ["أخطاء القياس", "Measurement errors", 18, 70],
        ],
      },
      {
        title: { ar: "الكهربية في حياتنا", en: "Electricity Around Us" },
        lessons: [
          ["الدائرة الكهربية البسيطة", "The simple circuit", 20, 40],
          ["شدة التيار وفرق الجهد", "Current and potential difference", 24, 8],
        ],
      },
    ]),
    chemistry: build("g10", "chemistry", [
      {
        title: { ar: "المادة وتركيبها", en: "Matter and Its Structure" },
        lessons: [
          ["تركيب الذرة", "Atomic structure", 20, 80],
          ["الجدول الدوري", "The periodic table", 22, 55],
        ],
      },
      {
        title: { ar: "التفاعلات الكيميائية", en: "Chemical Reactions" },
        lessons: [
          ["أنواع التفاعلات", "Types of reactions", 18, 25],
          ["العوامل المؤثرة على سرعة التفاعل", "Factors affecting reaction rate", 24, 0],
        ],
      },
    ]),
  },
  g11: {
    biology: build("g11", "biology", [
      {
        title: { ar: "التغذية والهضم", en: "Nutrition and Digestion" },
        lessons: [
          ["الإنزيمات وعملها", "Enzymes in action", 22, 65],
          ["الامتصاص في الأمعاء", "Absorption in the intestine", 20, 30],
        ],
      },
      {
        title: { ar: "النقل في الكائنات الحية", en: "Transport in Organisms" },
        lessons: [
          ["النقل في النبات", "Transport in plants", 24, 45],
          ["الانتشار عبر الأغشية", "Diffusion across membranes", 20, 5],
        ],
      },
    ]),
    physics: build("g11", "physics", [
      {
        title: { ar: "الموجات", en: "Waves" },
        lessons: [
          ["الحركة الموجية", "Wave motion", 20, 75],
          ["الصوت", "Sound", 18, 50],
        ],
      },
      {
        title: { ar: "الحرارة والمادة", en: "Heat and Matter" },
        lessons: [
          ["قوانين الغازات", "Gas laws", 25, 20],
          ["المقاومة ودرجة الحرارة", "Resistance and temperature", 22, 0],
        ],
      },
    ]),
    chemistry: build("g11", "chemistry", [
      {
        title: { ar: "المحاليل والأحماض", en: "Solutions and Acids" },
        lessons: [
          ["أنواع المحاليل", "Types of solutions", 18, 70],
          ["الأحماض والقواعد", "Acids and bases", 22, 45],
        ],
      },
      {
        title: { ar: "الكيمياء الحرارية", en: "Thermochemistry" },
        lessons: [
          ["المحتوى الحراري", "Enthalpy", 20, 30],
          ["طاقة التنشيط والعوامل الحفازة", "Activation energy and catalysts", 24, 0],
        ],
      },
    ]),
  },
  g12: {
    biology: build("g12", "biology", [
      {
        title: { ar: "الدعامة والحركة", en: "Support and Movement" },
        lessons: [
          ["الهيكل العظمي", "The skeleton", 20, 88],
          ["الانقباض العضلي", "Muscle contraction", 24, 62],
        ],
      },
      {
        title: { ar: "التنظيم الهرموني", en: "Hormonal Coordination" },
        lessons: [
          ["الغدد الصماء", "Endocrine glands", 22, 40],
          ["النقل الخلوي والانتشار", "Cellular transport and diffusion", 20, 12],
        ],
      },
    ]),
    physics: build("g12", "physics", [
      {
        title: { ar: "التيار الكهربي وقانون أوم", en: "Electric Current & Ohm's Law" },
        lessons: [
          ["شدة التيار وفرق الجهد", "Current and potential difference", 20, 92],
          ["قانون أوم", "Ohm's law", 25, 48],
          ["المقاومة الكهربية ودرجة الحرارة", "Resistance and temperature", 22, 15],
        ],
      },
      {
        title: { ar: "التأثير المغناطيسي للتيار", en: "Magnetic Effect of Current" },
        lessons: [
          ["المجال المغناطيسي لسلك مستقيم", "Field around a straight wire", 24, 0],
          ["المحرك الكهربي", "The electric motor", 26, 0],
        ],
      },
    ]),
    chemistry: build("g12", "chemistry", [
      {
        title: { ar: "الاتزان الكيميائي", en: "Chemical Equilibrium" },
        lessons: [
          ["سرعة التفاعل الكيميائي", "Reaction rate", 22, 58],
          ["العوامل المؤثرة على سرعة التفاعل", "Factors affecting reaction rate", 24, 22],
        ],
      },
      {
        title: { ar: "الكيمياء الكهربية", en: "Electrochemistry" },
        lessons: [
          ["الخلايا الجلفانية", "Galvanic cells", 25, 10],
          ["التحليل الكهربي", "Electrolysis", 24, 0],
        ],
      },
    ]),
  },
};

export const DEFAULT_GRADE: GradeId = "g12";
export const DEFAULT_SUBJECT: SubjectId = "physics";
export const DEFAULT_LESSON_ID = "g12-physics-u1-l2";

export const student = {
  name: { ar: "يوسف", en: "Youssef" } satisfies L10n,
  xp: 2480,
  level: 12,
  streak: 7,
  weekly: [
    { day: { ar: "سبت", en: "Sat" }, minutes: 25 },
    { day: { ar: "أحد", en: "Sun" }, minutes: 40 },
    { day: { ar: "اتنين", en: "Mon" }, minutes: 18 },
    { day: { ar: "تلات", en: "Tue" }, minutes: 52 },
    { day: { ar: "أربع", en: "Wed" }, minutes: 34 },
    { day: { ar: "خميس", en: "Thu" }, minutes: 46 },
    { day: { ar: "جمعة", en: "Fri" }, minutes: 30 },
  ],
};

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

export function subjectMastery(units: Unit[]) {
  const all = units.flatMap((u) => u.lessons);
  if (all.length === 0) return 0;
  return Math.round(all.reduce((s, l) => s + l.mastery, 0) / all.length);
}

export function countLessons(subject: SubjectId) {
  return grades.reduce(
    (n, g) => n + curriculum[g.id][subject].reduce((m, u) => m + u.lessons.length, 0),
    0,
  );
}
