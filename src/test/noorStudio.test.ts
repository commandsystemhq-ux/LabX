import { beforeEach, describe, expect, it } from "vitest";
import {
  EMPTY_STUDIO,
  FlashcardItemSchema,
  FlashcardPackSchema,
  MindMapItemSchema,
  MindMapPackSchema,
  NoorStudioStateSchema,
  addFlashcardPack,
  addMindMapPack,
  blocksForIntent,
  blocksInRequest,
  buildLocalStudio,
  compactPack,
  editFlashcardPack,
  editMindMapPack,
  generateBlockFlashcards,
  generateBlockMindMap,
  generateWeaknessFlashcards,
  loadStudioState,
  newStudioId,
  packFromAiOutput,
  packToFlashcards,
  packToTree,
  parseStudioRequest,
  removeFlashcardPack,
  removeMindMapPack,
  resolveTopic,
  sanitizeMindMapItems,
  sanitizeStudioState,
  saveStudioState,
  studioKey,
  treeToItems,
  updateFlashcardPack,
  updateMindMapPack,
  type FlashcardPack,
  type MindMapItem,
  type MindMapPack,
} from "@/data/lessons/noorStudio";
import {
  blankMinDepth,
  flattenTree,
  layoutMindMapTree,
  visibleBlanks,
} from "@/data/lessons/mindMapLayout";
import { EMPTY_RADAR, type RadarState } from "@/data/lessons/supportRadar";
import { studioStore } from "@/lib/use-noor-studio";

const memory = () => {
  const mem: Record<string, string> = {};
  return {
    mem,
    storage: {
      getItem: (k: string) => mem[k] ?? null,
      setItem: (k: string, v: string) => {
        mem[k] = v;
      },
    },
  };
};

const weakRadar: RadarState = {
  v: 1,
  blocks: { "5": { hits: 0, misses: 10 }, "6": { hits: 1, misses: 9 } },
  items: {},
};

const item = (id: string, parent?: string, extra: Partial<MindMapItem> = {}): MindMapItem => ({
  id,
  title: { ar: `عقدة ${id}`, en: `Node ${id}` },
  ...(parent ? { parent } : {}),
  ...extra,
});

const mapPack = (over: Partial<MindMapPack> = {}): MindMapPack => ({
  id: "mm-test1",
  title: { ar: "خريطة", en: "Map" },
  createdAt: 1,
  kind: "filled",
  nodes: [item("n1"), item("n2", "n1"), item("n3", "n1")],
  ...over,
});

describe("storage: validation + sanitize on read", () => {
  it("returns an empty state for missing storage, bad JSON and wrong version", () => {
    expect(loadStudioState("u1", null)).toEqual(EMPTY_STUDIO);
    const { storage, mem } = memory();
    mem[studioKey("u1")] = "not json";
    expect(loadStudioState("u1", storage)).toEqual(EMPTY_STUDIO);
    mem[studioKey("u1")] = JSON.stringify({ v: 2, flashcardPacks: [], mindMapPacks: [] });
    expect(loadStudioState("u1", storage)).toEqual(EMPTY_STUDIO);
    expect(sanitizeStudioState(null)).toEqual(EMPTY_STUDIO);
    expect(sanitizeStudioState([])).toEqual(EMPTY_STUDIO);
  });

  it("round-trips a valid state", () => {
    const { storage } = memory();
    const state = addMindMapPack(
      addFlashcardPack(EMPTY_STUDIO, generateBlockFlashcards([5])),
      mapPack(),
    );
    expect(saveStudioState("u1", storage, state)).toBe(true);
    expect(loadStudioState("u1", storage)).toEqual(state);
    expect(NoorStudioStateSchema.safeParse(state).success).toBe(true);
  });

  it("reports a failed write instead of throwing", () => {
    const full = {
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(saveStudioState("u1", full, EMPTY_STUDIO)).toBe(false);
    expect(saveStudioState("u1", null, EMPTY_STUDIO)).toBe(false);
  });

  it("isolates every account (and the guest) in its own slot", () => {
    const { storage } = memory();
    saveStudioState("alice", storage, addMindMapPack(EMPTY_STUDIO, mapPack({ id: "mm-alice" })));
    saveStudioState(null, storage, addMindMapPack(EMPTY_STUDIO, mapPack({ id: "mm-guest" })));
    expect(loadStudioState("alice", storage).mindMapPacks.map((p) => p.id)).toEqual(["mm-alice"]);
    expect(loadStudioState(null, storage).mindMapPacks.map((p) => p.id)).toEqual(["mm-guest"]);
    expect(loadStudioState("bob", storage)).toEqual(EMPTY_STUDIO);
    expect(studioKey("a/b?c")).not.toContain("/");
    expect(studioKey("")).toBe(studioKey(null));
  });

  it("drops only the broken packs and repairs the rest", () => {
    const good = generateBlockFlashcards([5]);
    const raw = {
      v: 1,
      flashcardPacks: [
        good,
        { ...good, id: "BAD ID!" },
        { ...good, id: "fc-empty", cards: [] },
        { id: "fc-x", title: 1 },
        null,
        "str",
        { ...good, cards: [{ ...good.cards[0], id: "has space" }, ...good.cards.slice(0, 2)] },
      ],
      mindMapPacks: [
        mapPack({ id: "mm-ok" }),
        { ...mapPack({ id: "mm-nonodes" }), nodes: [] },
        { ...mapPack({ id: "mm-nodes-bad" }), nodes: [{ id: "x y" }, 5] },
      ],
    };
    const s = sanitizeStudioState(raw);
    expect(s.flashcardPacks.map((p) => p.id)).toEqual([good.id]);
    expect(s.mindMapPacks.map((p) => p.id)).toEqual(["mm-ok"]);
    expect(NoorStudioStateSchema.safeParse(s).success).toBe(true);
  });

  it("caps packs and strips unknown or oversized fields", () => {
    const many = Array.from({ length: 40 }, (_, i) => mapPack({ id: `mm-${i}` }));
    expect(
      sanitizeStudioState({ v: 1, flashcardPacks: [], mindMapPacks: many }).mindMapPacks,
    ).toHaveLength(20);
    const evil = {
      ...mapPack(),
      nodes: [{ ...item("n1"), title: { ar: "x".repeat(500), en: "y" }, evil: "<script>" }],
    };
    expect(
      sanitizeStudioState({ v: 1, flashcardPacks: [], mindMapPacks: [evil] }).mindMapPacks,
    ).toEqual([]);
  });

  it("keeps the same data when two keys are written (no cross-account leak through the store)", () => {
    studioStore.reset();
    window.localStorage.clear();
    studioStore.mutate("alice", (s) => addMindMapPack(s, mapPack({ id: "mm-a" })));
    studioStore.mutate(null, (s) => addFlashcardPack(s, generateBlockFlashcards([1])));
    expect(studioStore.get("alice").mindMapPacks).toHaveLength(1);
    expect(studioStore.get("alice").flashcardPacks).toHaveLength(0);
    expect(studioStore.get(null).mindMapPacks).toHaveLength(0);
    expect(studioStore.get(null).flashcardPacks).toHaveLength(1);
    studioStore.reset();
    // Re-read from localStorage, as after a reload.
    expect(studioStore.get("alice").mindMapPacks.map((p) => p.id)).toEqual(["mm-a"]);
    expect(studioStore.get("bob")).toEqual(EMPTY_STUDIO);
  });
});

describe("mind map items", () => {
  it("repairs trees: duplicate ids, dangling parents, several roots, cycles, depth", () => {
    const fixed = sanitizeMindMapItems([
      item("a"),
      item("a", "a"),
      item("b", "ghost"),
      item("c", "d"),
      item("d", "c"),
      item("e", "b"),
    ]);
    expect(fixed.map((i) => i.id)).toEqual(["a", "b", "e"]);
    expect(fixed.find((i) => i.id === "a")?.parent).toBeUndefined();
    expect(fixed.find((i) => i.id === "b")?.parent).toBe("a");
    expect(sanitizeMindMapItems([])).toEqual([]);

    const chain = Array.from({ length: 12 }, (_, i) => item(`c${i}`, i ? `c${i - 1}` : undefined));
    expect(sanitizeMindMapItems(chain).length).toBeLessThanOrEqual(6);
  });

  it("fills a missing language from the other one", () => {
    const [n] = sanitizeMindMapItems([{ id: "x", title: { ar: "", en: "Only English" } }]);
    expect(n?.title.ar).toBe("Only English");
  });

  it("converts tree ⇄ flat items without losing structure", () => {
    const tree = resolveTopic("العمود الفقري")!.node;
    const items = treeToItems(tree);
    expect(items[0]?.parent).toBeUndefined();
    expect(items.every((i) => MindMapItemSchema.safeParse(i).success)).toBe(true);
    const back = packToTree({ nodes: items });
    expect(flattenTree(back).map((x) => x.node.title.ar)).toEqual(
      flattenTree(tree).map((x) => x.node.title.ar),
    );
  });

  it("produces trees the layout can place without overlap", () => {
    const pack = buildLocalStudio(
      { kind: "mindmap", blank: false, weak: false, request: "خريطة عن الجمجمة" },
      EMPTY_RADAR,
      "ar",
    ).mindMap!;
    const tree = packToTree(pack);
    const all = new Set(flattenTree(tree).map((x) => x.node.id));
    const l = layoutMindMapTree(tree, all, { lang: "ar" });
    for (let i = 0; i < l.nodes.length; i++)
      for (let j = i + 1; j < l.nodes.length; j++) {
        const a = l.nodes[i]!;
        const b = l.nodes[j]!;
        expect(a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y).toBe(
          false,
        );
      }
  });
});

describe("understanding the student's message", () => {
  it.each([
    ["اعملّي خريطة ذهنية للعمود الفقري", "create", "mindmap", false],
    ["اعمل شبكة فاضية عن الأربطة", "create", "mindmap", true],
    ["ولّد بطاقات لنقط ضعفي", "create", "flashcards", false],
    ["ممكن تعملي بطاقات عن الأوتار", "create", "flashcards", false],
    ["Make me a mind map of the skull", "create", "mindmap", false],
    ["Generate a blank grid about joints", "create", "mindmap", true],
    ["i need flashcards for ligaments", "create", "flashcards", false],
  ] as const)("«%s» → %s %s (blank=%s)", (text, action, kind, blank) => {
    expect(parseStudioRequest(text)).toMatchObject({ action, kind, blank });
  });

  it("recognises «weak spots» requests", () => {
    expect(parseStudioRequest("ولّد بطاقات لنقط ضعفي")?.weak).toBe(true);
    expect(parseStudioRequest("اعملي خريطة عن الجمجمة")?.weak).toBe(false);
  });

  it("edits the pack in focus when the message names no kind", () => {
    const focus = { kind: "flashcards", packId: "fc-1" } as const;
    expect(parseStudioRequest("عدّل البطاقات دي وخليها أبسط بالعامية")).toMatchObject({
      action: "edit",
      kind: "flashcards",
    });
    expect(parseStudioRequest("خليها أبسط بالعامية", focus)).toMatchObject({
      action: "edit",
      kind: "flashcards",
    });
    expect(parseStudioRequest("خليها أبسط بالعامية", null)).toBeNull();
    expect(
      parseStudioRequest("make it simpler", { kind: "mindmap", packId: "mm-1" }),
    ).toMatchObject({
      action: "edit",
      kind: "mindmap",
    });
    expect(parseStudioRequest("اعمل خريطة جديدة", focus)).toMatchObject({ action: "create" });
  });

  it("ignores ordinary questions", () => {
    for (const q of [
      "إيه هي الخلية النباتية؟",
      "ممكن تشرحلي العمود الفقري",
      "what is a ligament?",
      "ليه غلطت؟",
      "",
      "   ",
    ]) {
      expect(parseStudioRequest(q), q).toBeNull();
    }
  });

  it("resolves the topic to the right node of the textbook map", () => {
    expect(resolveTopic("خريطة ذهنية للعمود الفقري")?.node.id).toBe("spine");
    expect(resolveTopic("شبكة فاضية عن الأربطة")?.node.id).toBe("ligaments");
    expect(resolveTopic("the Achilles tendon")?.node.id).toBe("achilles");
    expect(resolveTopic("الخلية النباتية")?.node.id).toBe("plant-cell");
    expect(resolveTopic("ligaments")?.blocks).toContain(13);
    expect(resolveTopic("qwertyuiop")).toBeNull();
    expect(resolveTopic("")).toBeNull();
  });

  it("reads block numbers, Arabic digits included", () => {
    expect(blocksInRequest("بطاقات جزئية 5 و6")).toEqual([5, 6]);
    expect(blocksInRequest("بطاقات الجزئية ٧")).toEqual([7]);
    expect(blocksInRequest("cards for block 3")).toEqual([3]);
    expect(blocksInRequest("block 99")).toEqual([]);
    expect(blocksInRequest("لا أرقام")).toEqual([]);
  });

  it("picks blocks: numbers, then topic, then weak spots, then untried ones", () => {
    expect(blocksForIntent({ weak: false, request: "جزئية 9" }, EMPTY_RADAR)).toEqual([9]);
    expect(blocksForIntent({ weak: false, request: "خريطة الجمجمة" }, EMPTY_RADAR)).toEqual([7]);
    expect(blocksForIntent({ weak: true, request: "نقط ضعفي" }, weakRadar)).toEqual([5, 6]);
    expect(blocksForIntent({ weak: true, request: "نقط ضعفي" }, EMPTY_RADAR)).toEqual([1, 2, 3]);
  });
});

describe("local generation (guest + fallback)", () => {
  it("makes a filled, textbook-accurate map of the requested topic", () => {
    const b = buildLocalStudio(
      { kind: "mindmap", blank: false, weak: false, request: "اعملي خريطة للعمود الفقري" },
      EMPTY_RADAR,
      "ar",
      1000,
    );
    const pack = b.mindMap!;
    expect(pack.kind).toBe("filled");
    expect(pack.title.ar).toContain("العمود الفقري");
    expect(pack.nodes.length).toBeGreaterThan(3);
    expect(MindMapPackSchema.safeParse(pack).success).toBe(true);
    expect(pack.nodes.some((n) => n.badge)).toBe(true);
  });

  it("makes a blank recall grid on request", () => {
    const pack = buildLocalStudio(
      { kind: "mindmap", blank: true, weak: false, request: "شبكة فاضية عن الأربطة" },
      EMPTY_RADAR,
      "ar",
    ).mindMap!;
    expect(pack.kind).toBe("blank");
    expect(pack.title.ar).toContain("الأربطة");
    // A thin topic is enriched with the block's key terms so the grid has real slots to fill.
    expect(pack.nodes.length).toBeGreaterThanOrEqual(5);
    const tree = packToTree(pack);
    const open = new Set(flattenTree(tree).map((x) => x.node.id));
    const layout = layoutMindMapTree(tree, open, { lang: "ar" });
    expect(visibleBlanks(layout, blankMinDepth(tree)).length).toBeGreaterThanOrEqual(3);
    expect(MindMapPackSchema.safeParse(pack).success).toBe(true);
  });

  it("falls back to the parent when the topic is a single leaf", () => {
    const pack = buildLocalStudio(
      { kind: "mindmap", blank: false, weak: false, request: "map of the femur" },
      EMPTY_RADAR,
      "en",
    ).mindMap!;
    expect(pack.nodes.length).toBeGreaterThanOrEqual(3);
  });

  it("makes weak-spot flashcards from the blocks the student misses", () => {
    const pack = buildLocalStudio(
      { kind: "flashcards", blank: false, weak: true, request: "ولد بطاقات لنقط ضعفي" },
      weakRadar,
      "ar",
    ).flashcards!;
    expect(pack.cards.length).toBeGreaterThan(2);
    expect(new Set(pack.cards.map((c) => c.blockId))).toEqual(new Set([5, 6]));
    expect(FlashcardPackSchema.safeParse(pack).success).toBe(true);
  });

  it("every generated card has a question, an answer and a unique valid id", () => {
    for (const request of ["بطاقات عن الأربطة", "cards about the skull", "بطاقات جزئية 8 و9"]) {
      const pack = buildLocalStudio(
        { kind: "flashcards", blank: false, weak: false, request },
        EMPTY_RADAR,
        "ar",
      ).flashcards!;
      expect(pack.cards.length, request).toBeGreaterThan(0);
      const ids = new Set<string>();
      for (const c of pack.cards) {
        expect(FlashcardItemSchema.safeParse(c).success).toBe(true);
        expect(c.front.ar.length).toBeGreaterThan(0);
        expect(c.front.en.length).toBeGreaterThan(0);
        expect(c.back.ar.length).toBeGreaterThan(0);
        expect(c.back.en.length).toBeGreaterThan(0);
        ids.add(c.id);
      }
      expect(ids.size).toBe(pack.cards.length);
    }
  });

  it("works for a brand-new student with no radar data", () => {
    const pack = buildLocalStudio(
      { kind: "flashcards", blank: false, weak: true, request: "بطاقات لنقط ضعفي" },
      EMPTY_RADAR,
      "ar",
    ).flashcards!;
    expect(pack.cards.length).toBeGreaterThan(0);
  });

  it("legacy generators keep working", () => {
    expect(generateWeaknessFlashcards(weakRadar, "ar").cards.length).toBeGreaterThan(0);
    expect(generateWeaknessFlashcards(EMPTY_RADAR, "ar").cards).toHaveLength(0);
    expect(generateBlockFlashcards([999], "ar").cards).toHaveLength(0);
    expect(generateBlockFlashcards([1, 2], "ar").title.ar).toContain("الجزئيات");
    const m = generateBlockMindMap([1, 2], "ar");
    expect(m.nodes.length).toBeGreaterThan(0);
    expect(generateBlockMindMap([4], "ar", 1, "blank").kind).toBe("blank");
  });

  it("creates unique ids that satisfy the card-id format", () => {
    const ids = new Set(Array.from({ length: 50 }, () => newStudioId("fc", 5)));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id).toMatch(/^fc-[a-z0-9]+$/);
    expect(packToFlashcards(generateBlockFlashcards([1])).every((c) => c.id.length <= 40)).toBe(
      true,
    );
  });
});

describe("AI output → pack", () => {
  it("builds a map with fresh ids and re-attaches bad parents to the root", () => {
    const b = packFromAiOutput(
      {
        type: "mindmap",
        title: { ar: "خريطة", en: "Map" },
        nodes: [
          { key: "r", parent: null, title: { ar: "الجذر", en: "Root" } },
          { key: "a", parent: "r", title: { ar: "أ", en: "A" }, blockId: 5 },
          { key: "b", parent: "nowhere", title: { ar: "", en: "B only" } },
        ],
      },
      { blank: true },
      9,
    )!;
    expect(b.mindMap?.kind).toBe("blank");
    expect(b.mindMap?.origin).toBe("ai");
    expect(b.mindMap?.nodes.map((n) => n.parent)).toEqual([undefined, "n1", "n1"]);
    expect(b.mindMap?.nodes[2]?.title.ar).toBe("B only");
    expect(MindMapPackSchema.safeParse(b.mindMap).success).toBe(true);
  });

  it("builds cards and rejects an empty or single-node result", () => {
    const f = packFromAiOutput(
      {
        type: "flashcards",
        title: { ar: "رزمة", en: "Pack" },
        cards: [
          { front: { ar: "س", en: "Q" }, back: { ar: "ج", en: "A" } },
          { front: { ar: "س", en: "Q again" }, back: { ar: "ج", en: "A" } },
        ],
      },
      { blank: false },
    )!;
    expect(f.flashcards?.cards).toHaveLength(1);
    expect(f.flashcards?.cards[0]?.blockId).toBe(1);
    expect(
      packFromAiOutput(
        {
          type: "mindmap",
          title: { ar: "x", en: "x" },
          nodes: [{ key: "a", title: { ar: "a", en: "a" } }],
        },
        { blank: false },
      ),
    ).toBeNull();
  });

  it("keeps the compact edit context inside its limit", () => {
    const pack = buildLocalStudio(
      { kind: "flashcards", blank: false, weak: false, request: "بطاقات جزئية 1 و2 و3" },
      EMPTY_RADAR,
      "ar",
    ).flashcards!;
    expect(compactPack(pack, 800).length).toBeLessThanOrEqual(800);
    expect(JSON.parse(compactPack(pack)).items.length).toBeGreaterThan(0);
  });
});

describe("local edits", () => {
  let cards: FlashcardPack;
  beforeEach(() => {
    cards = generateBlockFlashcards([5, 6], "ar", 1);
  });

  it("simplifies answers with the block's colloquial explanation", () => {
    const r = editFlashcardPack(cards, "عدّل البطاقات وخليها أبسط بالعامية", 50);
    expect(r.changed).toBe(true);
    expect(r.pack.updatedAt).toBe(50);
    expect(r.pack.cards).toHaveLength(cards.cards.length);
    expect(r.pack.cards.map((c) => c.back.ar)).not.toEqual(cards.cards.map((c) => c.back.ar));
    expect(FlashcardPackSchema.safeParse(r.pack).success).toBe(true);
    expect(r.note.ar).toContain("بسّطت");
  });

  it("shortens, renames, adds and removes cards", () => {
    expect(
      editFlashcardPack(cards, "اختصر الإجابات").pack.cards[0]?.back.ar.length,
    ).toBeLessThanOrEqual(cards.cards[0]!.back.ar.length);
    expect(editFlashcardPack(cards, "سميها رزمة العمود").pack.title.ar).toBe("رزمة العمود");
    const more = editFlashcardPack(generateBlockFlashcards([5], "ar", 1), "زوّد بطاقات عن الجمجمة");
    expect(more.pack.cards.length).toBeGreaterThan(
      generateBlockFlashcards([5], "ar", 1).cards.length,
    );
    expect(new Set(more.pack.cards.map((c) => c.id)).size).toBe(more.pack.cards.length);
    const less = editFlashcardPack(cards, "احذف الكارت 1");
    expect(less.pack.cards).toHaveLength(cards.cards.length - 1);
  });

  it("returns the same pack when nothing was understood", () => {
    const r = editFlashcardPack(cards, "حاجة غريبة خالص");
    expect(r.changed).toBe(false);
    expect(r.pack).toBe(cards);
  });

  it("flips a map between filled and blank, both ways", () => {
    const map = buildLocalStudio(
      { kind: "mindmap", blank: false, weak: false, request: "خريطة الجمجمة" },
      EMPTY_RADAR,
      "ar",
    ).mindMap!;
    const blank = editMindMapPack(map, "حولها لشبكة فاضية للتسميع");
    expect(blank.pack.kind).toBe("blank");
    expect(editMindMapPack(blank.pack, "حولها لشبكة فاضية").changed).toBe(false);
    expect(editMindMapPack(blank.pack, "رجعها خريطة مليانة بالإجابات").pack.kind).toBe("filled");
  });

  it("expands a branch from the textbook map and removes a branch", () => {
    const small = mapPack({
      nodes: [
        { id: "n1", title: { ar: "الأربطة", en: "Ligaments" } },
        { id: "n2", title: { ar: "الأوتار", en: "Tendons" }, parent: "n1" },
      ],
    });
    const grown = editMindMapPack(small, "وسّع الأربطة");
    expect(grown.changed).toBe(true);
    expect(grown.pack.nodes.length).toBeGreaterThan(small.nodes.length);
    expect(MindMapPackSchema.safeParse(grown.pack).success).toBe(true);
    const cut = editMindMapPack(grown.pack, "شيل الأوتار");
    expect(cut.pack.nodes.some((n) => n.title.ar === "الأوتار")).toBe(false);
    expect(editMindMapPack(small, "xyz").changed).toBe(false);
  });
});

describe("pack operations", () => {
  it("adds (no duplicates, max 20), updates and removes packs", () => {
    const a = generateBlockFlashcards([1], "ar", 1);
    let s = addFlashcardPack(EMPTY_STUDIO, a);
    s = addFlashcardPack(s, a);
    expect(s.flashcardPacks).toHaveLength(1);
    const renamed = { ...a, title: { ar: "جديد", en: "New" } };
    s = updateFlashcardPack(s, renamed);
    expect(s.flashcardPacks[0]?.title.ar).toBe("جديد");
    expect(updateFlashcardPack(s, { ...a, id: "fc-other" })).toBe(s);
    expect(removeFlashcardPack(s, a.id).flashcardPacks).toHaveLength(0);

    let m = EMPTY_STUDIO;
    for (let i = 0; i < 25; i++) m = addMindMapPack(m, mapPack({ id: `mm-${i}` }));
    expect(m.mindMapPacks).toHaveLength(20);
    expect(m.mindMapPacks[19]?.id).toBe("mm-24");
    m = updateMindMapPack(m, mapPack({ id: "mm-24", title: { ar: "س", en: "q" } }));
    expect(m.mindMapPacks[19]?.title.en).toBe("q");
    expect(removeMindMapPack(m, "mm-24").mindMapPacks).toHaveLength(19);
  });

  it("validates items", () => {
    expect(
      FlashcardItemSchema.safeParse({
        id: "t-1",
        blockId: 1,
        front: { ar: "س", en: "Q" },
        back: { ar: "ج", en: "A" },
      }).success,
    ).toBe(true);
    expect(
      FlashcardItemSchema.safeParse({
        id: "bad!id",
        blockId: 1,
        front: { ar: "س", en: "Q" },
        back: { ar: "ج", en: "A" },
      }).success,
    ).toBe(false);
    expect(
      FlashcardItemSchema.safeParse({
        id: "t",
        blockId: 15,
        front: { ar: "", en: "" },
        back: { ar: "", en: "" },
      }).success,
    ).toBe(false);
    expect(
      MindMapItemSchema.safeParse({ id: "n1", title: { ar: "ع", en: "T" }, parent: "n 2" }).success,
    ).toBe(false);
  });
});
