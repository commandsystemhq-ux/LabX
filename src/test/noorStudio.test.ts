import { describe, it, expect } from "vitest";
import {
  loadStudioState,
  saveStudioState,
  generateWeaknessFlashcards,
  generateBlockFlashcards,
  generateBlockMindMap,
  addFlashcardPack,
  removeFlashcardPack,
  addMindMapPack,
  removeMindMapPack,
  NoorStudioStateSchema,
  FlashcardItemSchema,
  MindMapItemSchema,
  EMPTY_STUDIO,
} from "@/data/lessons/noorStudio";
import type { RadarState } from "@/data/lessons/supportRadar";

describe("noorStudio", () => {
  const mockStorage = (): Storage => {
    const store: Record<string, string> = {};
    return {
      length: 0,
      clear: () => {},
      key: () => null,
      removeItem: () => {},
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
    };
  };

  describe("loadStudioState", () => {
    it("returns empty state for missing storage", () => {
      const state = loadStudioState("user1", null);
      expect(state).toEqual(EMPTY_STUDIO);
    });

    it("returns empty state for invalid JSON", () => {
      const storage = mockStorage();
      storage.setItem("labx.noor-studio.user1.v1", "not json");
      const state = loadStudioState("user1", storage);
      expect(state).toEqual(EMPTY_STUDIO);
    });

    it("returns empty state for invalid schema", () => {
      const storage = mockStorage();
      storage.setItem("labx.noor-studio.user1.v1", JSON.stringify({ v: 2 }));
      const state = loadStudioState("user1", storage);
      expect(state).toEqual(EMPTY_STUDIO);
    });

    it("loads valid state", () => {
      const storage = mockStorage();
      const valid = {
        v: 1,
        flashcardPacks: [],
        mindMapPacks: [],
      };
      storage.setItem("labx.noor-studio.user1.v1", JSON.stringify(valid));
      const state = loadStudioState("user1", storage);
      expect(state.v).toBe(1);
    });
  });

  describe("saveStudioState", () => {
    it("saves state to storage", () => {
      const storage = mockStorage();
      saveStudioState("user1", storage, EMPTY_STUDIO);
      const saved = storage.getItem("labx.noor-studio.user1.v1");
      expect(saved).toBeTruthy();
      expect(JSON.parse(saved!)).toEqual(EMPTY_STUDIO);
    });
  });

  describe("generateWeaknessFlashcards", () => {
    it("generates flashcards for weak blocks", () => {
      const radar: RadarState = {
        v: 1,
        blocks: {
          "5": { hits: 0, misses: 10 },
          "6": { hits: 0, misses: 10 },
        },
        items: {},
      };
      const pack = generateWeaknessFlashcards(radar, "ar");
      expect(pack.cards.length).toBeGreaterThan(0);
      expect(pack.title.ar).toContain("نقاط");
    });

    it("returns empty pack for no weak blocks", () => {
      const radar: RadarState = { v: 1, blocks: {}, items: {} };
      const pack = generateWeaknessFlashcards(radar, "ar");
      expect(pack.cards.length).toBe(0);
    });
  });

  describe("generateBlockFlashcards", () => {
    it("generates flashcards for specified blocks", () => {
      const pack = generateBlockFlashcards([1, 2], "ar");
      expect(pack.cards.length).toBeGreaterThan(0);
      expect(pack.title.ar).toContain("الجزئيات");
    });

    it("ignores invalid block ids", () => {
      const pack = generateBlockFlashcards([999], "ar");
      expect(pack.cards.length).toBe(0);
    });
  });

  describe("generateBlockMindMap", () => {
    it("generates mind map for specified blocks", () => {
      const pack = generateBlockMindMap([1, 2], "ar");
      expect(pack.nodes.length).toBeGreaterThan(0);
      expect(pack.title.ar).toContain("خريطة");
    });
  });

  describe("state operations", () => {
    it("adds flashcard pack", () => {
      const pack = generateBlockFlashcards([1], "ar");
      const newState = addFlashcardPack(EMPTY_STUDIO, pack);
      expect(newState.flashcardPacks.length).toBe(1);
      expect(newState.flashcardPacks[0]).toEqual(pack);
    });

    it("removes flashcard pack", () => {
      const pack = generateBlockFlashcards([1], "ar");
      const withPack = addFlashcardPack(EMPTY_STUDIO, pack);
      const withoutPack = removeFlashcardPack(withPack, pack.id);
      expect(withoutPack.flashcardPacks.length).toBe(0);
    });

    it("adds mind map pack", () => {
      const pack = generateBlockMindMap([1], "ar");
      const newState = addMindMapPack(EMPTY_STUDIO, pack);
      expect(newState.mindMapPacks.length).toBe(1);
    });

    it("removes mind map pack", () => {
      const pack = generateBlockMindMap([1], "ar");
      const withPack = addMindMapPack(EMPTY_STUDIO, pack);
      const withoutPack = removeMindMapPack(withPack, pack.id);
      expect(withoutPack.mindMapPacks.length).toBe(0);
    });
  });

  describe("schemas", () => {
    it("validates flashcard item", () => {
      const valid = {
        id: "test-1",
        blockId: 1,
        front: { ar: "سؤال", en: "Question" },
        back: { ar: "إجابة", en: "Answer" },
      };
      expect(FlashcardItemSchema.parse(valid)).toEqual(valid);
    });

    it("rejects invalid flashcard id", () => {
      const invalid = {
        id: "invalid!id",
        blockId: 1,
        front: { ar: "سؤال", en: "Question" },
        back: { ar: "إجابة", en: "Answer" },
      };
      expect(() => FlashcardItemSchema.parse(invalid)).toThrow();
    });

    it("validates mind map item", () => {
      const valid = {
        id: "node-1",
        title: { ar: "عنوان", en: "Title" },
        blockId: 1,
      };
      expect(MindMapItemSchema.parse(valid)).toEqual(valid);
    });

    it("validates full studio state", () => {
      const result = NoorStudioStateSchema.safeParse(EMPTY_STUDIO);
      expect(result.success).toBe(true);
    });
  });
});
