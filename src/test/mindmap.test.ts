import { describe, expect, it } from "vitest";
import {
  MM,
  ancestorIds,
  answerMatches,
  blankMinDepth,
  blankOptions,
  branchIds,
  centerOn,
  edgePath,
  fitView,
  flattenTree,
  gradeBlankMap,
  isBlankDepth,
  layoutMindMapTree,
  loadBest,
  masteryLevel,
  normalizeText,
  sanitizeBest,
  saveBest,
  searchNodes,
  visibleBlanks,
  zoomAt,
  type MindMapLayout,
} from "@/data/lessons/mindMapLayout";
import { supportBlocks } from "@/data/lessons/supportLesson";
import { collectBlockIds, findNode, supportMindMap } from "@/data/lessons/supportMindMap";
import type { MindMapNode } from "@/data/lessons/supportTypes";

const blockNumbers = supportBlocks.map((b) => b.n);

const overlaps = (layout: MindMapLayout) => {
  const out: string[] = [];
  for (let i = 0; i < layout.nodes.length; i++) {
    for (let j = i + 1; j < layout.nodes.length; j++) {
      const a = layout.nodes[i]!;
      const b = layout.nodes[j]!;
      if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
        out.push(`${a.id}×${b.id}`);
      }
    }
  }
  return out;
};

describe("supportMindMap data", () => {
  it("has valid blockId references", () => {
    const valid = new Set(blockNumbers);
    for (const { node } of flattenTree(supportMindMap.root)) {
      if (node.blockId) expect(valid.has(node.blockId), `${node.id} → ${node.blockId}`).toBe(true);
    }
  });

  it("finds nodes and collects block ids", () => {
    expect(findNode(supportMindMap.root, "spine")?.title.en).toBe("Vertebral column");
    expect(findNode(supportMindMap.root, "nope")).toBeNull();
    expect(collectBlockIds(findNode(supportMindMap.root, "spine")!)).toEqual(
      expect.arrayContaining([5, 6]),
    );
  });

  it("covers all 14 blocks", () => {
    const ids = collectBlockIds(supportMindMap.root);
    for (let i = 1; i <= 14; i++) expect(ids, `Block ${i}`).toContain(i);
  });
});

describe("layoutMindMapTree", () => {
  const all = new Set(branchIds(supportMindMap.root));

  it.each([
    ["ltr", false],
    ["rtl", true],
  ] as const)("never overlaps two visible nodes (%s, fully expanded)", (_n, rtl) => {
    const layout = layoutMindMapTree(supportMindMap.root, all, { lang: "ar", rtl });
    expect(layout.nodes.length).toBe(flattenTree(supportMindMap.root).length);
    expect(overlaps(layout)).toEqual([]);
  });

  it("never overlaps in the default first-levels view or in English", () => {
    const first = new Set(["root", "plant", "human"]);
    expect(overlaps(layoutMindMapTree(supportMindMap.root, first, { lang: "en" }))).toEqual([]);
    expect(overlaps(layoutMindMapTree(supportMindMap.root, first, { lang: "ar" }))).toEqual([]);
  });

  it("grows left→right in LTR and right→left in RTL, one column per depth", () => {
    const open = new Set(["root", "plant", "human"]);
    const ltr = layoutMindMapTree(supportMindMap.root, open, { lang: "en" });
    const rtl = layoutMindMapTree(supportMindMap.root, open, { lang: "ar" });
    expect(ltr.rtl).toBe(false);
    expect(rtl.rtl).toBe(true);
    const root = (l: MindMapLayout) => l.byId.get("root")!;
    const plant = (l: MindMapLayout) => l.byId.get("plant")!;
    expect(plant(ltr).x).toBeGreaterThan(root(ltr).x + root(ltr).w);
    expect(plant(rtl).x + plant(rtl).w).toBeLessThan(root(rtl).x);
    for (const l of [ltr, rtl]) {
      for (const n of l.nodes) {
        expect(n.x).toBeGreaterThanOrEqual(0);
        expect(n.x + n.w).toBeLessThanOrEqual(l.width);
        expect(n.y).toBeGreaterThanOrEqual(0);
        expect(n.y + n.h).toBeLessThanOrEqual(l.height);
      }
    }
  });

  it("only places the children of expanded nodes", () => {
    const collapsed = layoutMindMapTree(supportMindMap.root, new Set(), { lang: "en" });
    expect(collapsed.nodes.map((n) => n.id)).toEqual(["root"]);
    expect(collapsed.byId.get("root")?.hasChildren).toBe(true);
    expect(collapsed.byId.get("root")?.expanded).toBe(false);
    const one = layoutMindMapTree(supportMindMap.root, new Set(["root"]), { lang: "en" });
    expect(one.nodes.map((n) => n.id)).toEqual(["root", "plant", "human"]);
  });

  it("centres a parent between its first and last child", () => {
    const l = layoutMindMapTree(supportMindMap.root, new Set(["root", "plant", "human"]), {
      lang: "en",
    });
    const mid = (id: string) => l.byId.get(id)!.y + l.byId.get(id)!.h / 2;
    expect(mid("root")).toBeCloseTo((mid("plant") + mid("human")) / 2, 5);
  });

  it("draws a smooth cubic Bezier from the side facing the children", () => {
    const l = layoutMindMapTree(supportMindMap.root, new Set(["root"]), { lang: "en" });
    const d = edgePath(l.byId.get("root")!, l.byId.get("plant")!, false);
    expect(d).toMatch(/^M [\d.]+ [\d.]+ C [\d.]+ [\d.]+, [\d.]+ [\d.]+, [\d.]+ [\d.]+$/);
    const r = layoutMindMapTree(supportMindMap.root, new Set(["root"]), { lang: "ar" });
    const root = r.byId.get("root")!;
    expect(edgePath(root, r.byId.get("plant")!, true).startsWith(`M ${root.x} `)).toBe(true);
  });

  it("gives long titles more room, never more than the maximum width", () => {
    const long: MindMapNode = {
      id: "x",
      title: { ar: "ا".repeat(200), en: "w".repeat(200) },
    };
    const l = layoutMindMapTree(long, new Set(), { lang: "en" });
    expect(l.nodes[0]!.w).toBe(MM.MAX_W);
    expect(l.nodes[0]!.h).toBeGreaterThan(MM.PAD_Y + MM.LINE_H);
  });
});

describe("camera", () => {
  const layout = { width: 1000, height: 500 };
  it("fits the whole map inside the viewport and never magnifies", () => {
    const v = fitView(layout, 500, 400);
    expect(v.k).toBeLessThan(1);
    expect(layout.width * v.k).toBeLessThanOrEqual(500);
    expect(fitView({ width: 100, height: 50 }, 800, 600).k).toBe(1);
    expect(fitView(layout, 0, 0)).toEqual({ x: 0, y: 0, k: 1 });
  });

  it("zooms around a fixed point and clamps", () => {
    const v = { x: 10, y: 20, k: 1 };
    const z = zoomAt(v, 2, 100, 100);
    // The world point under the cursor stays under the cursor.
    expect((100 - v.x) / v.k).toBeCloseTo((100 - z.x) / z.k, 6);
    expect(zoomAt(v, 1000, 0, 0).k).toBeLessThanOrEqual(2.2);
    expect(zoomAt(v, 0.0001, 0, 0).k).toBeGreaterThanOrEqual(0.25);
  });

  it("centres a node in the viewport", () => {
    const l = layoutMindMapTree(supportMindMap.root, new Set(["root"]), { lang: "en" });
    const n = l.byId.get("human")!;
    const v = centerOn(n, 800, 600, 1);
    expect(v.x + (n.x + n.w / 2) * v.k).toBeCloseTo(400, 6);
    expect(v.y + (n.y + n.h / 2) * v.k).toBeCloseTo(300, 6);
  });
});

describe("search + tree helpers", () => {
  it("finds nodes inside collapsed branches, Arabic and English, ignoring hamza/diacritics", () => {
    expect(searchNodes(supportMindMap.root, "الأربطة", "ar")).toContain("ligaments");
    expect(searchNodes(supportMindMap.root, "الاربطه", "ar")).toContain("ligaments");
    expect(searchNodes(supportMindMap.root, "achilles", "en")).toContain("achilles");
    expect(searchNodes(supportMindMap.root, "x", "en")).toEqual([]);
    expect(searchNodes(supportMindMap.root, "zzzzzz", "en")).toEqual([]);
  });

  it("lists ancestors root-first so a search hit can be revealed", () => {
    expect(ancestorIds(supportMindMap.root, "knee-ligaments")).toEqual([
      "root",
      "human",
      "ligaments",
    ]);
    expect(ancestorIds(supportMindMap.root, "root")).toEqual([]);
    expect(ancestorIds(supportMindMap.root, "missing")).toEqual([]);
  });

  it("normalises Arabic spelling variants", () => {
    expect(normalizeText("الأَرْبِطَة")).toBe(normalizeText("الاربطه"));
  });

  it("maps radar tallies to a mastery colour (null = never tried)", () => {
    expect(masteryLevel(undefined, 0)).toBeNull();
    expect(masteryLevel({ hits: 0, misses: 0 }, 0)).toBeNull();
    expect(masteryLevel({ hits: 5, misses: 0 }, 0)).toBe("good");
    expect(masteryLevel({ hits: 3, misses: 1 }, 20)).toBe("mid");
    expect(masteryLevel({ hits: 0, misses: 5 }, 80)).toBe("bad");
  });
});

describe("blank recall grid", () => {
  const open = new Set(["root", "plant", "human"]);
  const layout = layoutMindMapTree(supportMindMap.root, open, { lang: "ar" });

  it("keeps the root and main branches and blanks everything below", () => {
    expect(isBlankDepth(0)).toBe(false);
    expect(isBlankDepth(1)).toBe(false);
    expect(isBlankDepth(2)).toBe(true);
    const blanks = visibleBlanks(layout);
    expect(blanks.length).toBeGreaterThan(5);
    expect(blanks.map((b) => b.id)).not.toContain("root");
    expect(blanks.map((b) => b.id)).not.toContain("plant");
    expect(blanks.map((b) => b.id)).toContain("plant-cell");
  });

  it("blanks from the first level when the map is too shallow to have a second", () => {
    const shallow: MindMapNode = {
      id: "r",
      title: { ar: "جذر", en: "Root" },
      children: [
        { id: "a", title: { ar: "أ", en: "A" } },
        { id: "b", title: { ar: "ب", en: "B" } },
      ],
    };
    expect(blankMinDepth(shallow)).toBe(1);
    expect(blankMinDepth({ id: "solo", title: { ar: "س", en: "S" } })).toBe(1);
    expect(blankMinDepth(supportMindMap.root)).toBe(2);
    const l = layoutMindMapTree(shallow, new Set(["r"]), { lang: "en" });
    expect(visibleBlanks(l, blankMinDepth(shallow)).map((n) => n.id)).toEqual(["a", "b"]);
    expect(isBlankDepth(1, 1)).toBe(true);
    expect(isBlankDepth(1)).toBe(false);
  });

  it("builds smart, deterministic options that always contain the answer once", () => {
    for (const { node, depth } of flattenTree(supportMindMap.root)) {
      if (depth < 2) continue;
      for (const lang of ["ar", "en"] as const) {
        const opts = blankOptions(supportMindMap.root, node.id, lang, 4);
        expect(
          opts.filter((o) => o === node.title[lang]),
          node.id,
        ).toHaveLength(1);
        expect(new Set(opts.map(normalizeText)).size).toBe(opts.length);
        expect(opts.length).toBeGreaterThanOrEqual(2);
        expect(opts.length).toBeLessThanOrEqual(4);
        expect(blankOptions(supportMindMap.root, node.id, lang, 4)).toEqual(opts);
      }
    }
    // Siblings are the most tempting distractors.
    const opts = blankOptions(supportMindMap.root, "parenchyma", "en", 3);
    expect(opts).toEqual(expect.arrayContaining(["Parenchyma"]));
    expect(opts.filter((o) => ["Collenchyma", "Sclerenchyma"].includes(o)).length).toBe(2);
    expect(blankOptions(supportMindMap.root, "nope", "en")).toEqual([]);
  });

  it("accepts the answer in either language, tolerant of «ال», hamza and one typo", () => {
    const node = findNode(supportMindMap.root, "ligaments")!;
    expect(answerMatches("الأربطة", node)).toBe(true);
    expect(answerMatches("اربطة", node)).toBe(true);
    expect(answerMatches("Ligaments", node)).toBe(true);
    expect(answerMatches("ligamants", node)).toBe(true);
    expect(answerMatches("الأوتار", node)).toBe(false);
    expect(answerMatches("", node)).toBe(false);
    expect(answerMatches("   ", node)).toBe(false);
    const spine = findNode(supportMindMap.root, "spine")!;
    expect(answerMatches("العمود", spine)).toBe(false);
  });

  it("grades right / wrong / empty and reports a percentage", () => {
    const blanks = visibleBlanks(layout).slice(0, 4);
    const [a, b, c] = blanks;
    const grade = gradeBlankMap(blanks, {
      [a!.id]: a!.title.ar,
      [b!.id]: "إجابة غلط تماما",
      // c unanswered, 4th unanswered
    });
    expect(grade.verdicts[a!.id]).toBe("right");
    expect(grade.verdicts[b!.id]).toBe("wrong");
    expect(grade.verdicts[c!.id]).toBe("empty");
    expect(grade.right).toBe(1);
    expect(grade.total).toBe(4);
    expect(grade.pct).toBe(25);
    const all = gradeBlankMap(blanks, Object.fromEntries(blanks.map((n) => [n.id, n.title.en])));
    expect(all.pct).toBe(100);
    expect(gradeBlankMap([], {}).pct).toBe(0);
  });
});

describe("best scores", () => {
  it("sanitises what comes from storage", () => {
    expect(
      sanitizeBest({ base: 120, "pack-1": -5, "bad key!": 50, x: "9", __proto__: 1, ok: 42.4 }),
    ).toEqual({ base: 100, "pack-1": 0, ok: 42 });
    expect(sanitizeBest(null)).toEqual({});
    expect(sanitizeBest([1, 2])).toEqual({});
  });

  it("keeps one slot per account", () => {
    const mem: Record<string, string> = {};
    const st = {
      getItem: (k: string) => mem[k] ?? null,
      setItem: (k: string, v: string) => {
        mem[k] = v;
      },
    };
    saveBest("u1", st, { base: 80 });
    saveBest(null, st, { base: 10 });
    expect(loadBest("u1", st)).toEqual({ base: 80 });
    expect(loadBest(null, st)).toEqual({ base: 10 });
    expect(loadBest("u2", st)).toEqual({});
    expect(loadBest("u1", { getItem: () => "not json" })).toEqual({});
  });
});
