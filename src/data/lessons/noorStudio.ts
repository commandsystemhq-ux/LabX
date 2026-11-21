import { z } from "zod";
import { supportBlocks } from "./supportLesson";
import { weakness } from "./supportRadar";
import type { RadarState } from "./supportRadar";
import type { MindMapNode, Flashcard } from "./supportTypes";

/**
 * Noor Studio: Create and edit custom flashcards and mind maps for each student.
 * - Local generation (guest / fallback)
 * - AI generation (signed-in users, server-side)
 * - Sanitized storage per user
 */

const MAX_TITLE = 100;
const MAX_ITEMS = 100;
const MAX_TEXT = 500;
const ID_RE = /^[a-z0-9_-]{1,40}$/;

/* -------------------------------- Schemas -------------------------------- */

export const FlashcardItemSchema = z.object({
  id: z.string().regex(ID_RE),
  blockId: z.number().int().min(1).max(14),
  front: z.object({ ar: z.string().max(MAX_TEXT), en: z.string().max(MAX_TEXT) }),
  back: z.object({ ar: z.string().max(MAX_TEXT), en: z.string().max(MAX_TEXT) }),
  hint: z.object({ ar: z.string().max(MAX_TEXT), en: z.string().max(MAX_TEXT) }).optional(),
});

export const MindMapItemSchema = z.object({
  id: z.string().regex(ID_RE),
  title: z.object({ ar: z.string().max(MAX_TITLE), en: z.string().max(MAX_TITLE) }),
  badge: z.object({ ar: z.string().max(50), en: z.string().max(50) }).optional(),
  summary: z.object({ ar: z.string().max(MAX_TEXT), en: z.string().max(MAX_TEXT) }).optional(),
  blockId: z.number().int().min(1).max(14).optional(),
});

export const FlashcardPackSchema = z.object({
  id: z.string().regex(ID_RE),
  title: z.object({ ar: z.string().max(MAX_TITLE), en: z.string().max(MAX_TITLE) }),
  createdAt: z.number(),
  cards: z.array(FlashcardItemSchema).max(MAX_ITEMS),
});

export const MindMapPackSchema = z.object({
  id: z.string().regex(ID_RE),
  title: z.object({ ar: z.string().max(MAX_TITLE), en: z.string().max(MAX_TITLE) }),
  createdAt: z.number(),
  nodes: z.array(MindMapItemSchema).max(MAX_ITEMS),
});

export const NoorStudioStateSchema = z.object({
  v: z.literal(1),
  flashcardPacks: z.array(FlashcardPackSchema).max(20),
  mindMapPacks: z.array(MindMapPackSchema).max(20),
});

export type FlashcardItem = z.infer<typeof FlashcardItemSchema>;
export type MindMapItem = z.infer<typeof MindMapItemSchema>;
export type FlashcardPack = z.infer<typeof FlashcardPackSchema>;
export type MindMapPack = z.infer<typeof MindMapPackSchema>;
export type NoorStudioState = z.infer<typeof NoorStudioStateSchema>;

export const EMPTY_STUDIO: NoorStudioState = {
  v: 1,
  flashcardPacks: [],
  mindMapPacks: [],
};

/* -------------------------------- Storage -------------------------------- */

const STORAGE_KEY = (userId: string | null) => `labx.noor-studio.${userId ?? "guest"}.v1`;

export function loadStudioState(userId: string | null, storage: Storage | null): NoorStudioState {
  try {
    const text = storage?.getItem(STORAGE_KEY(userId));
    if (!text) return EMPTY_STUDIO;
    const parsed = JSON.parse(text) as unknown;
    const result = NoorStudioStateSchema.safeParse(parsed);
    return result.success ? result.data : EMPTY_STUDIO;
  } catch {
    return EMPTY_STUDIO;
  }
}

export function saveStudioState(
  userId: string | null,
  storage: Storage | null,
  state: NoorStudioState,
): void {
  try {
    storage?.setItem(STORAGE_KEY(userId), JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

/* -------------------------------- Local Generation -------------------------------- */

/** Generate flashcards for weak blocks from radar. */
export function generateWeaknessFlashcards(radar: RadarState, lang: "ar" | "en"): FlashcardPack {
  const cards: FlashcardItem[] = [];
  const weakBlocks: number[] = [];

  for (let block = 1; block <= 14; block++) {
    if (weakness(radar, block) >= 25) {
      weakBlocks.push(block);
    }
  }

  for (const blockN of weakBlocks.slice(0, 5)) {
    const block = supportBlocks.find((b) => b.n === blockN);
    if (!block) continue;

    // Add hook question as flashcard
    cards.push({
      id: `studio-weak-${blockN}-hook`,
      blockId: blockN,
      front: block.hookQuestion.question,
      back: block.hookQuestion.reveal,
    });

    // Add one micro-quiz question
    if (block.microQuiz[0]) {
      const q = block.microQuiz[0];
      cards.push({
        id: `studio-weak-${blockN}-quiz`,
        blockId: blockN,
        front: q.prompt,
        back: q.explain,
      });
    }
  }

  return {
    id: `pack-weakness-${Date.now()}`,
    title:
      lang === "ar"
        ? { ar: "بطاقات نقاط الضعف", en: "Weakness Flashcards" }
        : { ar: "بطاقات نقاط الضعف", en: "Weakness Flashcards" },
    createdAt: Date.now(),
    cards,
  };
}

/** Generate flashcards for specific blocks. */
export function generateBlockFlashcards(blockIds: number[], lang: "ar" | "en"): FlashcardPack {
  const cards: FlashcardItem[] = [];

  for (const blockN of blockIds.slice(0, 5)) {
    const block = supportBlocks.find((b) => b.n === blockN);
    if (!block) continue;

    cards.push({
      id: `studio-block-${blockN}-hook`,
      blockId: blockN,
      front: block.hookQuestion.question,
      back: block.hookQuestion.reveal,
    });

    if (block.microQuiz[0]) {
      const q = block.microQuiz[0];
      cards.push({
        id: `studio-block-${blockN}-quiz`,
        blockId: blockN,
        front: q.prompt,
        back: q.explain,
      });
    }
  }

  return {
    id: `pack-blocks-${Date.now()}`,
    title:
      lang === "ar"
        ? {
            ar: `بطاقات الجزئيات ${blockIds.join(", ")}`,
            en: `Flashcards for blocks ${blockIds.join(", ")}`,
          }
        : {
            ar: `بطاقات الجزئيات ${blockIds.join(", ")}`,
            en: `Flashcards for blocks ${blockIds.join(", ")}`,
          },
    createdAt: Date.now(),
    cards,
  };
}

/** Generate mind map for specific blocks. */
export function generateBlockMindMap(blockIds: number[], lang: "ar" | "en"): MindMapPack {
  const nodes: MindMapItem[] = [];

  for (const blockN of blockIds.slice(0, 5)) {
    const block = supportBlocks.find((b) => b.n === blockN);
    if (!block) continue;

    nodes.push({
      id: `studio-node-${blockN}`,
      title: block.title,
      badge: { ar: `الجزئية ${blockN}`, en: `Block ${blockN}` },
      summary: {
        ar: block.simpleExplanation.paragraphs[0]?.ar ?? "",
        en: block.simpleExplanation.paragraphs[0]?.en ?? "",
      },
      blockId: blockN,
    });
  }

  return {
    id: `pack-mindmap-${Date.now()}`,
    title:
      lang === "ar"
        ? {
            ar: `خريطة الجزئيات ${blockIds.join(", ")}`,
            en: `Mind map for blocks ${blockIds.join(", ")}`,
          }
        : {
            ar: `خريطة الجزئيات ${blockIds.join(", ")}`,
            en: `Mind map for blocks ${blockIds.join(", ")}`,
          },
    createdAt: Date.now(),
    nodes,
  };
}

/* -------------------------------- State Operations -------------------------------- */

export function addFlashcardPack(state: NoorStudioState, pack: FlashcardPack): NoorStudioState {
  return {
    ...state,
    flashcardPacks: [...state.flashcardPacks.slice(-19), pack],
  };
}

export function removeFlashcardPack(state: NoorStudioState, packId: string): NoorStudioState {
  return {
    ...state,
    flashcardPacks: state.flashcardPacks.filter((p) => p.id !== packId),
  };
}

export function addMindMapPack(state: NoorStudioState, pack: MindMapPack): NoorStudioState {
  return {
    ...state,
    mindMapPacks: [...state.mindMapPacks.slice(-19), pack],
  };
}

export function removeMindMapPack(state: NoorStudioState, packId: string): NoorStudioState {
  return {
    ...state,
    mindMapPacks: state.mindMapPacks.filter((p) => p.id !== packId),
  };
}

/* -------------------------------- AI Request Schema -------------------------------- */

export const GenerateStudioInputSchema = z.object({
  type: z.enum(["flashcards", "mindmap"]),
  request: z.string().max(500),
  blockIds: z.array(z.number().int().min(1).max(14)).optional(),
});

export type GenerateStudioInput = z.infer<typeof GenerateStudioInputSchema>;

export const GenerateStudioOutputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("flashcards"),
    title: z.object({ ar: z.string(), en: z.string() }),
    cards: z.array(FlashcardItemSchema).max(MAX_ITEMS),
  }),
  z.object({
    type: z.literal("mindmap"),
    title: z.object({ ar: z.string(), en: z.string() }),
    nodes: z.array(MindMapItemSchema).max(MAX_ITEMS),
  }),
]);

export type GenerateStudioOutput = z.infer<typeof GenerateStudioOutputSchema>;
