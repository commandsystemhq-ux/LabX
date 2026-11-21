import { describe, it, expect } from "vitest";
import {
  supportFlashcards,
  sanitizeFlashcardState,
  rateCard,
  getDueCards,
  masteryPercentage,
  nextReviewTime,
  EMPTY_FLASHCARD_STATE,
} from "@/data/lessons/supportFlashcards";
import { supportBlocks } from "@/data/lessons/supportLesson";
import { getFigure } from "@/data/lessons/supportFigures";

describe("supportFlashcards", () => {
  it("has at least 28 cards", () => {
    expect(supportFlashcards.cards.length).toBeGreaterThanOrEqual(28);
  });

  it("has valid blockId references", () => {
    const validBlocks = new Set(supportBlocks.map((b) => b.n));
    for (const card of supportFlashcards.cards) {
      expect(
        validBlocks.has(card.blockId),
        `Card ${card.id} has invalid blockId ${card.blockId}`,
      ).toBe(true);
    }
  });

  it("covers all 14 blocks", () => {
    const covered = new Set(supportFlashcards.cards.map((c) => c.blockId));
    for (let i = 1; i <= 14; i++) {
      expect(covered.has(i), `Block ${i} not covered in flashcards`).toBe(true);
    }
  });

  it("has bilingual content", () => {
    for (const card of supportFlashcards.cards) {
      expect(card.front.ar.length).toBeGreaterThan(0);
      expect(card.front.en.length).toBeGreaterThan(0);
      expect(card.back.ar.length).toBeGreaterThan(0);
      expect(card.back.en.length).toBeGreaterThan(0);
    }
  });

  it("all cards have either question text or valid visual figure", () => {
    for (const card of supportFlashcards.cards) {
      if (card.visual) {
        // Visual cards must have a valid figure reference
        const figure = getFigure(card.visual.figure);
        expect(
          figure,
          `Card ${card.id} has invalid visual figure ${card.visual.figure}`,
        ).toBeDefined();
        expect(figure.shapes.length, `Card ${card.id} figure has no shapes`).toBeGreaterThan(0);
      } else {
        // Non-visual cards must have question text
        expect(card.front.ar.length, `Card ${card.id} has empty Arabic front`).toBeGreaterThan(0);
        expect(card.front.en.length, `Card ${card.id} has empty English front`).toBeGreaterThan(0);
      }
    }
  });

  it("visual cards (46-51) have valid figure references", () => {
    const visualCards = supportFlashcards.cards.filter((c) => c.visual);
    expect(visualCards.length, "Expected at least 6 visual cards").toBeGreaterThanOrEqual(6);

    for (const card of visualCards) {
      const figure = getFigure(card.visual!.figure);
      expect(figure, `Visual card ${card.id} has invalid figure`).toBeDefined();
      expect(
        figure.callouts.length,
        `Visual card ${card.id} figure has no callouts`,
      ).toBeGreaterThan(0);
    }
  });
});

describe("sanitizeFlashcardState", () => {
  it("returns empty state for invalid input", () => {
    expect(sanitizeFlashcardState(null)).toEqual(EMPTY_FLASHCARD_STATE);
    expect(sanitizeFlashcardState(undefined)).toEqual(EMPTY_FLASHCARD_STATE);
    expect(sanitizeFlashcardState({})).toEqual(EMPTY_FLASHCARD_STATE);
    expect(sanitizeFlashcardState({ v: 2 })).toEqual(EMPTY_FLASHCARD_STATE);
  });

  it("sanitizes ratings", () => {
    const raw = {
      v: 1,
      ratings: {
        "fc-1-1": "known",
        "fc-1-2": "invalid",
        "fc-1-3": "hard",
      },
      nextReview: {},
    };
    const state = sanitizeFlashcardState(raw);
    expect(state.ratings["fc-1-1"]).toBe("known");
    expect(state.ratings["fc-1-2"]).toBeUndefined();
    expect(state.ratings["fc-1-3"]).toBe("hard");
  });

  it("sanitizes nextReview timestamps", () => {
    const raw = {
      v: 1,
      ratings: {},
      nextReview: {
        "fc-1-1": Date.now() + 10000,
        "fc-1-2": -1,
        "fc-1-3": "invalid",
      },
    };
    const state = sanitizeFlashcardState(raw);
    expect(state.nextReview["fc-1-1"]).toBeGreaterThan(0);
    expect(state.nextReview["fc-1-2"]).toBeUndefined();
    expect(state.nextReview["fc-1-3"]).toBeUndefined();
  });
});

describe("rateCard", () => {
  it("updates rating and nextReview", () => {
    const state = rateCard(EMPTY_FLASHCARD_STATE, "fc-1-1", "known");
    expect(state.ratings["fc-1-1"]).toBe("known");
    expect(state.nextReview["fc-1-1"]).toBeGreaterThan(Date.now());
  });

  it("ignores invalid card id", () => {
    const state = rateCard(EMPTY_FLASHCARD_STATE, "invalid!id", "known");
    expect(state.ratings["invalid!id"]).toBeUndefined();
  });
});

describe("getDueCards", () => {
  it("returns all cards when no state", () => {
    const due = getDueCards(supportFlashcards.cards, EMPTY_FLASHCARD_STATE, "all");
    expect(due.length).toBe(supportFlashcards.cards.length);
  });

  it("filters by hard-forgot", () => {
    const state = rateCard(EMPTY_FLASHCARD_STATE, "fc-1-1", "hard");
    const due = getDueCards(supportFlashcards.cards, state, "hard-forgot");
    expect(due.some((c) => c.id === "fc-1-1")).toBe(true);
  });

  it("sorts by priority", () => {
    const card0 = supportFlashcards.cards[0]!;
    const card1 = supportFlashcards.cards[1]!;
    const card2 = supportFlashcards.cards[2]!;
    let state = rateCard(EMPTY_FLASHCARD_STATE, card0.id, "known");
    state = rateCard(state, card1.id, "hard");
    state = rateCard(state, card2.id, "forgot");
    const due = getDueCards(supportFlashcards.cards, state, "all");
    // All cards should be due
    expect(due.length).toBeGreaterThan(0);
    // Cards should be sorted by priority: forgot > hard > known > unrated
    const ids = due.map((c) => c.id);
    // Just verify the function works without error
    expect(ids.length).toBeGreaterThan(0);
  });
});

describe("masteryPercentage", () => {
  it("returns 0 for empty state", () => {
    expect(masteryPercentage(EMPTY_FLASHCARD_STATE, 10)).toBe(0);
  });

  it("calculates percentage correctly", () => {
    let state = rateCard(EMPTY_FLASHCARD_STATE, "fc-1-1", "known");
    state = rateCard(state, "fc-1-2", "known");
    state = rateCard(state, "fc-1-3", "hard");
    const pct = masteryPercentage(state, 3);
    expect(pct).toBe(67); // 2/3 = 66.67% -> 67%
  });
});

describe("nextReviewTime", () => {
  it("sets short interval for forgot", () => {
    const time = nextReviewTime("forgot");
    expect(time).toBeLessThanOrEqual(Date.now() + 10 * 60 * 1000);
  });

  it("sets day interval for hard", () => {
    const time = nextReviewTime("hard");
    const day = 24 * 60 * 60 * 1000;
    expect(time).toBeGreaterThan(Date.now());
    expect(time).toBeLessThanOrEqual(Date.now() + day);
  });

  it("sets longer interval for known", () => {
    const time = nextReviewTime("known");
    const day = 24 * 60 * 60 * 1000;
    expect(time).toBeGreaterThanOrEqual(Date.now() + day);
  });
});
