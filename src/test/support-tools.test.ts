// @vitest-environment node
import { describe, expect, it } from "vitest";
import { MUSCLE_NODES, SKELETON_NODES } from "@/data/lessons/anatomyNodes";
import { planFocus, type HumanFocus } from "@/components/lesson/board/boneFocus";
import { COMPARE_IDS, COMPARISONS, gradeCompare } from "@/data/lessons/supportCompare";
import {
  buildDuel,
  compareDuel,
  duelUrl,
  numericChallenge,
  parseDuelParams,
  rng,
  scoreDuel,
  type DuelSource,
} from "@/data/lessons/supportDuel";
import {
  evaluateDeposit,
  MATERIAL_IDS,
  radiusState,
  SAMPLE_IDS,
  SAMPLES,
  scoreSizeCurve,
  scoreSkullCurve,
  skullTissue,
  vertebraNode,
  vertebraRegion,
  vertebraSize,
} from "@/data/lessons/supportLab";
import { allQuestions, allTasks, getBlock, supportBlocks } from "@/data/lessons/supportLesson";
import { evaluateMystery, MYSTERY_STEPS } from "@/data/lessons/supportMystery";
import {
  buildSupportReply,
  feynmanFeedback,
  reviewFeynman,
  searchBook,
  supportLessonText,
  supportStudentWork,
  type SupportNoorContext,
} from "@/data/lessons/supportNoor";
import {
  NOTEBOOK_VERSION,
  sanitizeNotebook,
  upsertEntry,
  type NotebookEntry,
} from "@/data/lessons/supportNotebook";
import { sanitizeSupportProgress, unitsDone, withBlock } from "@/data/lessons/supportProgress";
import {
  buildRescue,
  EMPTY_RADAR,
  RESCUE_MINUTES,
  recordRadar,
  sanitizeRadar,
  weakBlocks,
} from "@/data/lessons/supportRadar";

describe("deposit lab (block 2)", () => {
  it("accepts exactly the textbook material for every tissue", () => {
    for (const s of SAMPLE_IDS) {
      for (const m of MATERIAL_IDS) {
        expect(evaluateDeposit(s, m).ok, `${s}/${m}`).toBe(m === SAMPLES[s].correct);
      }
    }
  });

  it("explains why cutin cannot replace lignin and lignin is not permeable", () => {
    const wrong = evaluateDeposit("sclerenchyma", "cutin");
    expect(wrong.ok).toBe(false);
    expect(wrong.problems.length).toBeGreaterThan(0);
    expect(evaluateDeposit("xylem", "lignin").water).toBeLessThan(50);
    expect(evaluateDeposit("collenchyma", "cellulose").water).toBeGreaterThanOrEqual(50);
    expect(evaluateDeposit("epidermis", "lignin").alive).toBe(false);
    expect(evaluateDeposit("epidermis", "lignin").problems.length).toBeGreaterThan(0);
  });
});

describe("reverse graph models", () => {
  it("vertebra size grows 1→24 and shrinks 25→33", () => {
    for (let n = 2; n <= 24; n++)
      expect(vertebraSize(n)).toBeGreaterThanOrEqual(vertebraSize(n - 1));
    for (let n = 26; n <= 33; n++) expect(vertebraSize(n)).toBeLessThanOrEqual(vertebraSize(n - 1));
    expect(vertebraRegion(7)).toBe("cervical");
    expect(vertebraRegion(19)).toBe("thoracic");
    expect(vertebraRegion(24)).toBe("lumbar");
    expect(vertebraRegion(29)).toBe("sacral");
    expect(vertebraRegion(33)).toBe("coccygeal");
    expect(vertebraNode(17)).toBe("tenth-thoracic-vertebra-t10");
    expect(vertebraNode(4)).toBe("fourth-cervical-vertebra-c4");
    expect(SKELETON_NODES).toContain(vertebraNode(33));
  });

  it("grades a drawn curve", () => {
    const good = Array.from({ length: 33 }, (_, i) => vertebraSize(i + 1));
    expect(scoreSizeCurve(good).score).toBe(3);
    const flat = Array(33).fill(50);
    expect(scoreSizeCurve(flat).peakOk).toBe(false);
    const reversed = good.slice().reverse();
    expect(scoreSizeCurve(reversed).score).toBeLessThan(3);
    expect(scoreSizeCurve([1, 2, 3]).score).toBe(0);
  });

  it("skull joints turn from fibrous to bony with age", () => {
    expect(skullTissue(0).fibrous).toBe(100);
    expect(skullTissue(80).bony).toBeGreaterThan(80);
    const key = [0, 20, 40, 60, 80].map((a) => skullTissue(a).fibrous);
    expect(scoreSkullCurve(key).score).toBe(3);
    expect(scoreSkullCurve([10, 30, 50, 70, 90]).score).toBeLessThan(3);
  });

  it("the radius turns at most half a circle about the fixed ulna", () => {
    expect(radiusState(0).crossed).toBe(false);
    expect(radiusState(180).crossed).toBe(true);
    expect(radiusState(500).deg).toBe(180);
    expect(radiusState(180).ulnaDeg).toBe(0);
    expect(radiusState(180).handDeg).toBe(180);
  });
});

describe("comparison arena", () => {
  it("has the six required comparisons with valid cards", () => {
    expect(COMPARE_IDS.sort()).toEqual(
      ["herb-woody", "ligament-tendon", "joints", "limbs", "materials", "pectoral-pelvic"].sort(),
    );
    for (const def of Object.values(COMPARISONS)) {
      expect(def.sides.length).toBeGreaterThanOrEqual(2);
      for (const card of def.cards) {
        expect(card.sides.length).toBeGreaterThan(0);
        for (const s of card.sides) expect(s).toBeLessThan(def.sides.length);
      }
      for (const m of def.meters) expect(m.values).toHaveLength(def.sides.length);
    }
  });

  it("grades sorted cards, including cards that belong to several sides", () => {
    const def = COMPARISONS.materials;
    const perfect = Object.fromEntries(def.cards.map((c) => [c.id, c.sides]));
    expect(gradeCompare(def, perfect)).toMatchObject({
      correct: def.cards.length,
      wrong: [],
      missing: [],
    });
    const lignin = def.cards.find((c) => c.id === "m10")!;
    const half = { ...perfect, [lignin.id]: [1] };
    expect(gradeCompare(def, half).wrong).toEqual(["m10"]);
    expect(gradeCompare(def, {}).missing).toHaveLength(def.cards.length);
  });
});

describe("weakness radar", () => {
  it("tracks misses per block and builds a rescue of at most 10 minutes", () => {
    let r = EMPTY_RADAR;
    for (const [block, id] of [
      [8, "b8-t1"],
      [8, "b8-q1"],
      [9, "b9-t2"],
      [9, "b9-t3"],
      [2, "b2-t1"],
    ] as const) {
      r = recordRadar(r, { block, itemId: id, ok: false });
    }
    r = recordRadar(r, { block: 8, itemId: "b8-q2", ok: true });
    const weak = weakBlocks(r);
    expect(weak.map((w) => w.block)).toContain(8);
    expect(weak[0]!.weakness).toBeGreaterThanOrEqual(weak.at(-1)!.weakness);
    const plan = buildRescue(r, (n) => (getBlock(n)?.labConfig.tasks ?? []).map((t) => t.id));
    expect(plan.minutes).toBeLessThanOrEqual(RESCUE_MINUTES);
    expect(plan.steps.length).toBeGreaterThan(0);
    expect(plan.steps.every((s) => weak.some((w) => w.block === s.block))).toBe(true);
    // answering an item right pays its miss back
    const paid = recordRadar(r, { block: 8, itemId: "b8-t1", ok: true });
    expect(paid.items["b8-t1"]).toBeUndefined();
  });

  it("returns an empty plan when nothing is weak and rejects junk storage", () => {
    expect(buildRescue(EMPTY_RADAR, () => []).steps).toHaveLength(0);
    expect(
      sanitizeRadar({
        v: 1,
        blocks: { "99": { hits: 1, misses: 1 }, "3": { hits: -4, misses: "x" } },
        items: { __proto__: 4, "a b": 2, ok1: 3 },
      }),
    ).toEqual({
      v: 1,
      blocks: { "3": { hits: 0, misses: 0 } },
      items: { ok1: 3 },
    });
    expect(sanitizeRadar("nope")).toBe(EMPTY_RADAR);
  });
});

describe("1-vs-1 duel", () => {
  const source: DuelSource = {
    questions: allQuestions(),
    numerics: allTasks()
      .filter((x) => x.task.kind === "numeric")
      .map((x) => {
        const t = x.task as Extract<typeof x.task, { kind: "numeric" }>;
        return { id: t.id, block: x.block.n, prompt: t.prompt, answer: t.answer };
      }),
  };

  it("the same seed gives the same challenges in the same order, another seed does not", () => {
    const a = buildDuel("seed1234", source);
    const b = buildDuel("seed1234", source);
    expect(a).toEqual(b);
    expect(a).toHaveLength(8);
    expect(new Set(a.map((c) => c.id)).size).toBe(8);
    expect(buildDuel("otherseed", source).map((c) => c.id)).not.toEqual(a.map((c) => c.id));
    for (const c of a) expect(c.options.filter((o) => o.correct)).toHaveLength(1);
  });

  it("numeric challenges always contain the answer once with distinct options", () => {
    const ch = numericChallenge("n", 4, { ar: "؟", en: "?" }, 206, rng("x"));
    expect(ch.options).toHaveLength(4);
    expect(new Set(ch.options.map((o) => o.text.en)).size).toBe(4);
    expect(ch.options.filter((o) => o.correct).map((o) => o.text.en)).toEqual(["206"]);
  });

  it("scores by correct answers then speed and compares players", () => {
    const ch = buildDuel("scoreme1", source);
    const all = ch.map((c) => ({
      id: c.id,
      choice: c.options.findIndex((o) => o.correct),
      ms: 2000,
    }));
    const fast = scoreDuel(ch, all);
    const slow = scoreDuel(
      ch,
      all.map((a) => ({ ...a, ms: 25_000 })),
    );
    const none = scoreDuel(
      ch,
      ch.map((c) => ({ id: c.id, choice: -1, ms: 1000 })),
    );
    expect(fast.correct).toBe(8);
    expect(fast.score).toBeGreaterThan(slow.score);
    expect(slow.score).toBe(800);
    expect(none.score).toBe(0);
    expect(compareDuel(fast, slow)).toBe("win");
    expect(compareDuel(slow, fast)).toBe("lose");
    expect(compareDuel(fast, { score: fast.score, ms: fast.ms })).toBe("tie");
  });

  it("share links carry only a valid seed and the result", () => {
    expect(parseDuelParams({ duel: "abcd1234", vs: "1050-45000" })).toEqual({
      seed: "abcd1234",
      vs: { score: 1050, ms: 45000 },
    });
    expect(parseDuelParams({ duel: "<script>", vs: "1" })).toBeNull();
    expect(parseDuelParams({ duel: "abcd1234", vs: "javascript:1" })?.vs).toBeNull();
    expect(
      duelUrl("https://x.test/", "g12-biology-u1-l1", "abcd1234", { score: 900, ms: 30000 }),
    ).toBe("https://x.test/lesson?id=g12-biology-u1-l1&duel=abcd1234&vs=900-30000");
  });
});

describe("crime scene case", () => {
  it("is solved by the textbook answers and not by guessing", () => {
    const right = Object.fromEntries(
      MYSTERY_STEPS.map((s) => [
        s.id,
        s.options
          .filter((o) => o.correct)
          .slice(0, s.kind === "single" ? 1 : 9)
          .map((o) => o.id),
      ]),
    );
    expect(evaluateMystery(right)).toMatchObject({ solved: true, score: 100 });
    const wrong = evaluateMystery({ tendon: ["tibia"], symptoms: ["fever"], treatment: ["rest"] });
    expect(wrong.solved).toBe(false);
    expect(wrong.steps.find((s) => s.id === "tendon")!.feedback.length).toBeGreaterThan(0);
    // exactly the 3 textbook symptoms are right
    const symptoms = MYSTERY_STEPS.find((s) => s.id === "symptoms")!;
    expect(symptoms.options.filter((o) => o.correct)).toHaveLength(3);
  });
});

describe("notebook and progress storage", () => {
  it("sanitizes untrusted notebook data", () => {
    const entries = sanitizeNotebook({
      v: NOTEBOOK_VERSION,
      entries: [
        {
          id: "ok1",
          at: 5,
          block: 2,
          kind: "note",
          title: "<img onerror=x>t",
          text: "a\u0000b<script>",
        },
        { id: "bad id", at: 1, block: 2, kind: "note", title: "x", text: "" },
        { id: "ok2", at: 1, block: 99, kind: "note", title: "x", text: "" },
        {
          id: "ok3",
          at: 1,
          block: 3,
          kind: "drawing",
          title: "",
          text: "",
          drawing: { type: "curve", figure: "vertebrae", values: [1, 200, "x"] },
        },
        { id: "ok1", at: 1, block: 3, kind: "note", title: "dup", text: "" },
      ],
    });
    expect(entries.map((e) => e.id)).toEqual(["ok1", "ok3"]);
    expect(entries[0]!.title).not.toMatch(/[<>]/);
    expect(entries[0]!.text).toBe("abscript"); // control chars and angle brackets are gone; it is only ever rendered as text
    expect(entries[1]!.drawing?.values).toEqual([1, 100, 0]);
    expect(sanitizeNotebook("junk")).toEqual([]);
  });

  it("upserts newest first and caps the list", () => {
    let list: NotebookEntry[] = [];
    for (let i = 0; i < 160; i++) {
      list = upsertEntry(list, {
        id: `e${i}`,
        at: i,
        block: 1,
        kind: "note",
        title: `n${i}`,
        text: "",
      });
    }
    expect(list).toHaveLength(150);
    expect(list[0]!.id).toBe("e159");
  });

  it("keeps lesson progress within range", () => {
    const p = sanitizeSupportProgress({
      v: 1,
      blocks: [1, 1, 99, "x", 3],
      tests: [6, 7],
      hooks: { "2": 1, "30": 1, "3": 99 },
    });
    expect(p).toEqual({ v: 1, blocks: [1, 3], tests: [6], hooks: { "2": 1 } });
    expect(unitsDone(withBlock(p, 5))).toBe(4);
  });
});

describe("Noor for the live board", () => {
  const ctx = (over: Partial<SupportNoorContext> = {}): SupportNoorContext => ({
    lessonId: "g12-biology-u1-l1",
    block: 8,
    phase: "lab",
    view: "3d",
    actions: [],
    mistakes: [],
    ...over,
  });

  it("carries the verbatim block text and the student's work", () => {
    expect(supportLessonText(ctx())).toContain("الضلوع العائمة");
    expect(supportLessonText(ctx()).length).toBeLessThanOrEqual(6000);
    const work = supportStudentWork(
      ctx({
        actions: [{ ar: "رسم", en: "drew" }],
        mistakes: [
          {
            block: 2,
            kind: "deposit",
            picked: { ar: "الكيوتين", en: "Cutin" },
            correct: { ar: "اللجنين", en: "Lignin" },
            explain: { ar: "x", en: "x" },
          },
        ],
      }),
      "ar",
    );
    expect(work).toContain("الكيوتين");
    expect(work).toContain("اللجنين");
  });

  it("answers from the book without a server", () => {
    const rib = buildSupportReply(ctx(), "هل الضلع العائم بيتصل بالقص؟", "free", "ar");
    expect(rib).toContain("لا يتصلان بالقص");
    expect(rib).toContain("18");
    const knee = buildSupportReply(
      ctx({ block: 13 }),
      "إيه الفرق بين الرباط الوسطي والجانبي في الركبة؟",
      "free",
      "ar",
    );
    expect(knee).toContain("ثلاثة");
    const quote = buildSupportReply(ctx({ block: 10 }), "ما هو الارتفاق العاني؟", "free", "ar");
    expect(quote).toContain("الارتفاق العاني");
    expect(searchBook("التجويف الحقي", 10)[0]!.text).toContain("التجويف الحقي");
    expect(buildSupportReply(ctx(), "xyzzy qwerty", "free", "en")).toMatch(/could not find/i);
  });

  it("corrects the last mistake when asked why", () => {
    const reply = buildSupportReply(
      ctx({
        block: 2,
        mistakes: [
          {
            block: 2,
            kind: "deposit",
            picked: { ar: "الكيوتين", en: "Cutin" },
            correct: { ar: "اللجنين", en: "Lignin" },
            explain: { ar: "اللجنين يكسب الجدار الصلابة", en: "Lignin gives rigidity" },
          },
        ],
      }),
      "ليه غلطت؟",
      "why",
      "ar",
    );
    expect(reply).toContain("اللجنين يكسب الجدار الصلابة");
    expect(reply).toContain("الكيوتين");
  });

  it("lists the scientific keywords a spoken answer misses", () => {
    const def = getBlock(2)!.feynmanCheck;
    const weak = reviewFeynman("اللجنين بيخلي الساق قوية وصلبة جدا يا صاحبي", def);
    expect(weak.missing.length).toBeGreaterThan(0);
    expect(weak.score).toBeLessThan(100);
    expect(feynmanFeedback(weak, def, "ar")).toContain("كلمات علمية ناقصة");
    expect(reviewFeynman("ok", def).tooShort).toBe(true);
    const full = reviewFeynman(def.keywords.map((k) => k.match[0]).join(" "), def);
    expect(full.score).toBe(100);
  });
});

describe("3D scene plans on the real BodyParts3D files", () => {
  const input = { skeleton: SKELETON_NODES, muscles: MUSCLE_NODES, jointKind: null } as const;
  const focuses: HumanFocus[] = [
    "full",
    "spine",
    "vertebra",
    "skull",
    "thorax",
    "pectoral",
    "pelvic",
    "cartilage",
    "joints",
    "knee",
    "achilles",
  ];

  it.each(focuses)("%s shows real meshes and frames something", (f) => {
    const plan = planFocus(f, input);
    expect(plan.solid.size).toBeGreaterThan(0);
    expect(plan.frame.length).toBeGreaterThan(0);
    for (const n of plan.solid) expect(SKELETON_NODES).toContain(n);
    expect(plan.dirs.length).toBeGreaterThan(0);
  });

  it("matches the textbook for skull, thorax, arm and Achilles", () => {
    expect(planFocus("skull", input).solid.size).toBe(22);
    const thorax = planFocus("thorax", input);
    expect(thorax.tint.get("right-eleventh-rib")).toBeDefined();
    expect(thorax.tint.get("right-first-rib")).toBeUndefined();
    const arm = planFocus("pectoral", input);
    expect([...arm.solid].every((n) => !n.startsWith("left-"))).toBe(true);
    expect(arm.solid.has("right-radius") && arm.solid.has("right-ulna")).toBe(true);
    const ach = planFocus("achilles", input);
    expect([...ach.muscles].sort()).toEqual(["calcaneal-tendon", "gastrocnemius", "soleus"]);
    expect(planFocus("full", input).solid.size).toBe(SKELETON_NODES.length);
  });

  it("joint kinds isolate their tissue", () => {
    const fib = planFocus("joints", { ...input, jointKind: "fibrous" });
    const cart = planFocus("joints", { ...input, jointKind: "cartilaginous" });
    expect([...fib.solid].every((n) => /bone|maxilla|mandible|vomer|concha/.test(n))).toBe(true);
    expect([...cart.solid].every((n) => n.includes("intervertebral-disc"))).toBe(true);
  });

  it("every lesson block has views that the stage can draw", () => {
    for (const b of supportBlocks) {
      for (const v of b.labConfig.views) expect(v.focus).toBeTruthy();
    }
  });
});
