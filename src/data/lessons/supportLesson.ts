import type { L10n } from "@/lib/i18n";
import { blocksA } from "./supportBlocksA";
import { blocksB } from "./supportBlocksB";
import { selfTests } from "./supportSelfTests";
import type {
  LabConfig,
  LabTask,
  SupportBlock,
  SupportBlockContent,
  SupportQuestion,
} from "./supportTypes";
import { supportSections, supportReportTitle } from "./supportVerbatim";

export { SUPPORT_LESSON_ID } from "./supportTypes";
export { supportReportTitle };
export { selfTests };

/**
 * The lesson database: the 14 textbook sections of docs/lesson1.txt turned into micro-blocks
 * (hook → live board → hands-on lab → return to the hook + new questions + explain-it-to-a-friend),
 * plus the six «اختبر نفسك» tests. The textbook text itself is generated, line for line, in
 * supportVerbatim.ts; authored content lives in supportBlocksA/B.ts and supportSelfTests.ts.
 */

/** Scene views and tools of each block's lab (the authors only write the tasks). */
const LAB_SETUP: Record<number, Omit<LabConfig, "tasks">> = {
  1: {
    views: [
      { focus: "cell-plant", figure: "cell-plant", label: { ar: "خلية نباتية", en: "Plant cell" } },
      {
        focus: "cell-animal",
        figure: "cell-animal",
        label: { ar: "خلية حيوانية", en: "Animal cell" },
      },
      { focus: "tissues", figure: "tissues", label: { ar: "الأنسجة الخمسة", en: "The 5 tissues" } },
    ],
    tools: [],
  },
  2: {
    views: [
      {
        focus: "stem",
        figure: "stem-section",
        label: { ar: "قطاع عرضي في الساق", en: "Stem cross-section" },
      },
    ],
    tools: [
      { kind: "deposit" },
      { kind: "compare", id: "materials" },
      { kind: "compare", id: "herb-woody" },
    ],
  },
  3: {
    views: [{ focus: "full", figure: "skeleton-front", label: { ar: "الهيكل", en: "Skeleton" } }],
    tools: [],
  },
  4: {
    views: [
      { focus: "full", figure: "skeleton-front", label: { ar: "منظر أمامي", en: "Front view" } },
      { focus: "full", figure: "skeleton-back", label: { ar: "منظر خلفي", en: "Back view" } },
    ],
    tools: [],
  },
  5: {
    views: [
      { focus: "spine", figure: "spine", label: { ar: "العمود الفقري", en: "Vertebral column" } },
    ],
    tools: [{ kind: "graph", id: "vertebrae" }],
  },
  6: {
    views: [
      {
        focus: "vertebra",
        figure: "vertebra",
        label: { ar: "الفقرة النموذجية", en: "Typical vertebra" },
      },
    ],
    tools: [],
  },
  7: {
    views: [{ focus: "skull", figure: "skull", label: { ar: "الجمجمة", en: "Skull" } }],
    tools: [{ kind: "graph", id: "skull-age" }],
  },
  8: {
    views: [
      { focus: "thorax", figure: "thorax", label: { ar: "القفص الصدري", en: "Thoracic cage" } },
    ],
    tools: [],
  },
  9: {
    views: [
      {
        focus: "pectoral",
        figure: "pectoral",
        label: { ar: "الحزام الصدري والطرف العلوي", en: "Pectoral girdle and upper limb" },
      },
    ],
    tools: [{ kind: "radius" }, { kind: "compare", id: "limbs" }],
  },
  10: {
    views: [
      {
        focus: "pelvic",
        figure: "pelvic",
        label: { ar: "الحزام الحوضي والطرف السفلي", en: "Pelvic girdle and lower limb" },
      },
    ],
    tools: [
      { kind: "pelvis" },
      { kind: "compare", id: "pectoral-pelvic" },
      { kind: "compare", id: "limbs" },
    ],
  },
  11: {
    views: [
      {
        focus: "cartilage",
        figure: "thorax",
        label: { ar: "الغضاريف", en: "Cartilages" },
      },
    ],
    tools: [],
  },
  12: {
    views: [{ focus: "joints", figure: "joints", label: { ar: "المفاصل", en: "Joints" } }],
    tools: [
      { kind: "compare", id: "joints" },
      { kind: "graph", id: "skull-age" },
    ],
  },
  13: {
    views: [{ focus: "knee", figure: "knee", label: { ar: "مفصل الركبة", en: "Knee joint" } }],
    tools: [{ kind: "compare", id: "ligament-tendon" }],
  },
  14: {
    views: [
      { focus: "achilles", figure: "achilles", label: { ar: "وتر أخيل", en: "Achilles tendon" } },
    ],
    tools: [{ kind: "achilles-tear" }, { kind: "compare", id: "ligament-tendon" }],
  },
};

function assemble(content: SupportBlockContent): SupportBlock {
  const section = supportSections.find((s) => s.n === content.n);
  const setup = LAB_SETUP[content.n];
  if (!section || !setup) throw new Error(`Support block ${content.n} has no textbook section`);
  const { tasks, ...rest } = content;
  return {
    ...rest,
    id: `b${content.n}`,
    title: { ar: section.title, en: content.titleEn },
    section: section.n,
    textbookVerbatim: section.lines,
    labConfig: { ...setup, tasks },
  };
}

export const supportBlocks: readonly SupportBlock[] = [...blocksA, ...blocksB]
  .slice()
  .sort((a, b) => a.n - b.n)
  .map(assemble);

export function getBlock(n: number): SupportBlock | undefined {
  return supportBlocks.find((b) => b.n === n);
}

/** The textbook text of a block as plain paragraphs (used by Noor and search). */
export function verbatimText(block: SupportBlock): string {
  return block.textbookVerbatim.map(([, text]) => text).join("\n");
}

/** Every graded item of the lesson: one per block (the hook + micro-quiz) and one per test. */
export const TOTAL_UNITS = supportBlocks.length + selfTests.length;

export function allQuestions(): SupportQuestion[] {
  return [...supportBlocks.flatMap((b) => b.microQuiz), ...selfTests.flatMap((t) => t.questions)];
}

export function allTasks(): { block: SupportBlock; task: LabTask }[] {
  return supportBlocks.flatMap((block) => block.labConfig.tasks.map((task) => ({ block, task })));
}

export function blockTitle(n: number): L10n {
  return getBlock(n)?.title ?? { ar: `الجزئية ${n}`, en: `Block ${n}` };
}
