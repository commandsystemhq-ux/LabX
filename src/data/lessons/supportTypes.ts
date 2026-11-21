import type { L10n } from "@/lib/i18n";
import type { VerbatimLine } from "./supportVerbatim";

/**
 * Types of the "Support in living organisms" lesson (g12-biology-u1-l1): 14 micro-blocks (one per
 * textbook section) + 6 "اختبر نفسك" tests. Pure data — no React.
 */

export const SUPPORT_LESSON_ID = "g12-biology-u1-l1";

/** Which 3D scene a view uses. Plant scenes are procedural; the human scenes use BodyParts3D GLBs. */
export type Focus3D =
  | "cell-plant"
  | "cell-animal"
  | "tissues"
  | "stem"
  | "full"
  | "spine"
  | "vertebra"
  | "skull"
  | "thorax"
  | "pectoral"
  | "pelvic"
  | "cartilage"
  | "joints"
  | "knee"
  | "achilles";

/** The 2D "ministry exam" blueprint of a scene (see supportFigures.ts for the callout ids). */
export type FigureId =
  | "cell-plant"
  | "cell-animal"
  | "tissues"
  | "stem-section"
  | "skeleton-front"
  | "skeleton-back"
  | "spine"
  | "vertebra"
  | "skull"
  | "thorax"
  | "pectoral"
  | "pelvic"
  | "joints"
  | "knee"
  | "achilles";

export interface SceneView {
  focus: Focus3D;
  figure: FigureId;
  label: L10n;
}

export type CompareId =
  "herb-woody" | "materials" | "pectoral-pelvic" | "limbs" | "joints" | "ligament-tendon";

export type LabTool =
  | { kind: "deposit" }
  | { kind: "graph"; id: "vertebrae" | "skull-age" }
  | { kind: "compare"; id: CompareId }
  | { kind: "radius" }
  | { kind: "pelvis" }
  | { kind: "achilles-tear" };

/* --------------------------------- quizzes --------------------------------- */

/** Tiny chart used as an answer option (test 5: fibrous / bony tissue vs age, sampled at 5 ages). */
export interface PlotSpec {
  fibrous: number[];
  bony: number[];
}

export interface QuizOption {
  text: L10n;
  plot?: PlotSpec;
}

export interface SupportQuestion {
  id: string;
  /** Block (1–14) this question trains; feeds the Weakness Radar. */
  block: number;
  prompt: L10n;
  options: QuizOption[];
  correct: number;
  /** Shown after answering, right or wrong. Must restate the textbook fact. */
  explain: L10n;
  /** Optional drawing shown with the question; `mark` is a callout id of that figure. */
  visual?: { figure: FigureId; mark?: string };
}

export interface Hook {
  question: L10n;
  options: L10n[];
  correct: number;
  /** Shown when the student comes back to the hook at the end of the block. */
  reveal: L10n;
}

/* -------------------------------- exam trap -------------------------------- */

export interface Probe {
  id: string;
  label: L10n;
  result: L10n;
  verdict: "ok" | "bad" | "info";
  /** Pick-group ids (supportLab PICK_GROUPS) highlighted in the 3D scene while this probe runs. */
  highlight?: string[];
}

export interface ExamTrapDef {
  /** The famous wrong belief, phrased the way students say it. */
  claim: L10n;
  /** The textbook truth that breaks it. */
  truth: L10n;
  /** 2–4 buttons; each reveals a result in a few seconds so the whole experiment fits in 15 s. */
  probes: Probe[];
}

/* --------------------------------- feynman --------------------------------- */

export interface Keyword {
  id: string;
  label: L10n;
  /** Any of these (Arabic or English words / stems) counts as covering the keyword. */
  match: string[];
}

export interface FeynmanDef {
  prompt: L10n;
  keywords: Keyword[];
  /** An ideal short answer in friendly colloquial language (shown after the check). */
  model: L10n;
}

/* ---------------------------------- labs ---------------------------------- */

export interface LabelTask {
  kind: "label";
  id: string;
  figure: FigureId;
  title: L10n;
  /** Callout ids of the figure the student must name (the rest stay labelled). */
  parts: string[];
}

export interface PickTask {
  kind: "pick";
  id: string;
  prompt: L10n;
  /** Pick-group ids; the student answers by tapping the part in 3D/2D or the option chips. */
  options: string[];
  answer: string;
  why: L10n;
  /** Per wrong option: the correction Noor gives. */
  wrongWhy?: Record<string, L10n>;
}

export interface NumericTask {
  kind: "numeric";
  id: string;
  prompt: L10n;
  answer: number;
  unit?: L10n;
  why: L10n;
}

export interface MatchTask {
  kind: "match";
  id: string;
  title: L10n;
  items: { id: string; prompt: L10n; answer: string }[];
  options: { id: string; label: L10n }[];
  why: L10n;
}

export interface DepositTask {
  kind: "deposit";
  id: string;
  title: L10n;
}

export type LabTask = LabelTask | PickTask | NumericTask | MatchTask | DepositTask;

export interface LabConfig {
  views: SceneView[];
  tasks: LabTask[];
  tools: LabTool[];
}

/* ---------------------------------- blocks --------------------------------- */

export interface SimpleExplanation {
  /** 2–4 short paragraphs in Egyptian colloquial Arabic / simple English. */
  paragraphs: L10n[];
  /** «تخيل…» a vivid everyday picture. */
  imagine: L10n;
  /** Real-life examples. */
  examples: L10n[];
  /** Key terms with their English equivalent. */
  terms: { ar: string; en: string }[];
}

/** What a block author writes. The assembly adds the verbatim textbook text and the Arabic title. */
export interface SupportBlockContent {
  n: number;
  emoji: string;
  titleEn: string;
  hookQuestion: Hook;
  simpleExplanation: SimpleExplanation;
  examTrap: ExamTrapDef;
  /** Hands-on tasks; the scene views and tools are pinned per block in supportLesson.ts. */
  tasks: LabTask[];
  feynmanCheck: FeynmanDef;
  /** Immediate new questions on the same block (after returning to the hook). */
  microQuiz: SupportQuestion[];
}

export interface SupportBlock extends Omit<SupportBlockContent, "tasks"> {
  id: string;
  labConfig: LabConfig;
  title: L10n;
  /** Textbook section number (== n). */
  section: number;
  /** The textbook text of the section, line by line (generated from docs/lesson1.txt). */
  textbookVerbatim: readonly VerbatimLine[];
}

export interface SelfTest {
  n: number;
  title: L10n;
  /** Textbook-side description of what the test covers. */
  covers: L10n;
  /** Blocks it revises. */
  blocks: number[];
  questions: SupportQuestion[];
}

/* -------------------------------- Mind Map -------------------------------- */

export interface MindMapNode {
  id: string;
  title: L10n;
  /** Badge showing count or summary (e.g., "206 عظمة", "5 مجموعات"). */
  badge?: L10n;
  /** Short summary shown in the quick card. */
  summary?: L10n;
  /** Block number this node links to (1–14). */
  blockId?: number;
  /** Whether this node has a direct 3D view. */
  supports3D?: boolean;
  /** Child nodes (branches). */
  children?: MindMapNode[];
}

export interface MindMapData {
  lessonId: string;
  root: MindMapNode;
}

/* -------------------------------- Flashcards ------------------------------- */

export type FlashcardRating = "known" | "hard" | "forgot";

export interface Flashcard {
  id: string;
  /** Block number this card belongs to (1–14). */
  blockId: number;
  /** Front side: question or prompt. */
  front: L10n;
  /** Back side: answer from the textbook. */
  back: L10n;
  /** Optional visual figure (shown on front without labels). */
  visual?: { figure: FigureId; hideLabels?: boolean };
  /** Hint shown on front (optional). */
  hint?: L10n;
}

export interface FlashcardState {
  v: 1;
  /** Card id → rating. */
  ratings: Record<string, FlashcardRating>;
  /** Card id → next review timestamp (ms). */
  nextReview: Record<string, number>;
}

export interface FlashcardsData {
  lessonId: string;
  cards: Flashcard[];
}
