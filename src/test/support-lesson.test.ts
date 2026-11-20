// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findLesson, lessonExists } from "@/data/mockCurriculum";
import { FIGURES, calloutsOf, labelGroups } from "@/data/lessons/supportFigures";
import {
  allQuestions,
  allTasks,
  getBlock,
  selfTests,
  supportBlocks,
  SUPPORT_LESSON_ID,
  TOTAL_UNITS,
  verbatimText,
} from "@/data/lessons/supportLesson";
import { PICK_GROUPS, groupNodes, pickGroup } from "@/data/lessons/supportLab";
import { supportSections } from "@/data/lessons/supportVerbatim";

const ROOT = path.resolve(__dirname, "../..");

function glbNodeNames(file: string): string[] {
  const b = readFileSync(path.join(ROOT, "public/models/anatomy", file));
  const len = b.readUInt32LE(12);
  const json = JSON.parse(b.subarray(20, 20 + len).toString("utf8")) as {
    nodes: { name?: string }[];
  };
  return json.nodes.map((n) => n.name ?? "");
}

const nonEmpty = (l: { ar: string; en: string }) =>
  l.ar.trim().length > 0 && l.en.trim().length > 0;

describe("textbook verbatim (docs/lesson1.txt)", () => {
  const docPath = path.join(ROOT, "docs/lesson1.txt");

  it.skipIf(!existsSync(docPath))(
    "keeps every line of the report, in order, letter for letter",
    () => {
      const lines = readFileSync(docPath, "utf8")
        .replace(/\r\n/g, "\n")
        .split("\n")
        .filter((l) => l.trim());
      const body = lines.slice(1);
      const rebuilt: string[] = [];
      for (const s of supportSections) {
        rebuilt.push(`${s.n}. ${s.title}`);
        for (const [, text] of s.lines) rebuilt.push(text);
      }
      const expected = body.map((l) => l.trim().replace(/^\* /, ""));
      expect(rebuilt).toEqual(expected);
    },
  );

  it("has the 14 sections as 14 sequential micro-blocks", () => {
    expect(supportSections).toHaveLength(14);
    expect(supportBlocks.map((b) => b.n)).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
    for (const b of supportBlocks) {
      expect(b.title.ar).toBe(supportSections[b.n - 1]!.title);
      expect(b.textbookVerbatim.length).toBeGreaterThan(5);
    }
  });

  it("keeps the numbers the exam asks for", () => {
    const all = supportBlocks.map(verbatimText).join("\n");
    for (const needle of [
      "206",
      "270 : 300",
      "80 عظمة",
      "126 عظمة",
      "33 فقرة",
      "26 عظمة",
      "37 عظمة",
      "22 عظمة",
      "30 عظمة",
      "6 تجاويف",
      "6 عظام",
      "7 نتوءات",
      "18 ، 19",
      "الكيوتين",
      "السيوبرين",
      "رباط صليبي أمامي",
      "رباط صليبي خلفي",
      "رباط وسطي",
      "رباط جانبي",
      "عدم القدرة على المشي",
      "التدخل الجراحي",
    ]) {
      expect(all, needle).toContain(needle);
    }
  });
});

describe("block content", () => {
  it.each(supportBlocks.map((b) => [b.n, b] as const))("block %i has all seven parts", (_n, b) => {
    expect(nonEmpty(b.title)).toBe(true);
    // 1. hook
    expect(b.hookQuestion.options.length).toBeGreaterThanOrEqual(3);
    expect(b.hookQuestion.options[b.hookQuestion.correct]).toBeDefined();
    expect(nonEmpty(b.hookQuestion.question) && nonEmpty(b.hookQuestion.reveal)).toBe(true);
    b.hookQuestion.options.forEach((o) => expect(nonEmpty(o)).toBe(true));
    // 2. simple explanation
    expect(b.simpleExplanation.paragraphs.length).toBeGreaterThanOrEqual(2);
    expect(b.simpleExplanation.terms.length).toBeGreaterThanOrEqual(4);
    expect(nonEmpty(b.simpleExplanation.imagine)).toBe(true);
    // 4. exam trap
    expect(b.examTrap.probes.length).toBeGreaterThanOrEqual(2);
    expect(b.examTrap.probes.some((p) => p.verdict === "bad")).toBe(true);
    expect(b.examTrap.probes.some((p) => p.verdict === "ok")).toBe(true);
    for (const p of b.examTrap.probes) {
      expect(nonEmpty(p.label) && nonEmpty(p.result)).toBe(true);
      for (const h of p.highlight ?? []) expect(pickGroup(h), h).toBeDefined();
    }
    // 5. lab
    expect(b.labConfig.views.length).toBeGreaterThan(0);
    expect(b.labConfig.tasks.length).toBeGreaterThan(0);
    // 6. feynman
    expect(b.feynmanCheck.keywords.length).toBeGreaterThanOrEqual(4);
    for (const k of b.feynmanCheck.keywords) expect(k.match.length).toBeGreaterThanOrEqual(2);
    // 7. micro quiz
    expect(b.microQuiz.length).toBeGreaterThanOrEqual(2);
  });

  it("uses only known figures, callouts, groups and answers", () => {
    for (const { block, task } of allTasks()) {
      expect(nonEmpty("why" in task ? task.why : { ar: "x", en: "x" }), task.id).toBe(true);
      if (task.kind === "label") {
        const groups = labelGroups(task.figure);
        for (const p of task.parts) expect(groups, `${block.n}/${task.id}/${p}`).toContain(p);
      }
      if (task.kind === "pick") {
        expect(task.options).toContain(task.answer);
        for (const o of task.options) expect(pickGroup(o), o).toBeDefined();
        for (const o of task.options.filter((x) => x !== task.answer)) {
          expect(task.wrongWhy?.[o], `${task.id} wrongWhy ${o}`).toBeDefined();
        }
      }
      if (task.kind === "match") {
        const ids = task.options.map((o) => o.id);
        for (const it of task.items) expect(ids).toContain(it.answer);
      }
      if (task.kind === "numeric") expect(Number.isFinite(task.answer)).toBe(true);
    }
    expect(new Set(allTasks().map((x) => x.task.id)).size).toBe(allTasks().length);
  });

  it("has exactly one deposit lab and it is in block 2", () => {
    const deposits = allTasks().filter((x) => x.task.kind === "deposit");
    expect(deposits).toHaveLength(1);
    expect(deposits[0]!.block.n).toBe(2);
  });

  it("covers the required labs in the right blocks", () => {
    const kinds = (n: number) => getBlock(n)!.labConfig.tools.map((t) => t.kind);
    expect(kinds(5)).toContain("graph");
    expect(kinds(9)).toContain("radius");
    expect(kinds(10)).toContain("pelvis");
    expect(kinds(14)).toContain("achilles-tear");
    for (const id of [
      "herb-woody",
      "materials",
      "pectoral-pelvic",
      "limbs",
      "joints",
      "ligament-tendon",
    ]) {
      expect(
        supportBlocks.some((b) =>
          b.labConfig.tools.some((t) => t.kind === "compare" && t.id === id),
        ),
        id,
      ).toBe(true);
    }
  });
});

describe("questions and self tests", () => {
  it("has the six «اختبر نفسك» tests", () => {
    expect(selfTests.map((t) => t.n)).toEqual([1, 2, 3, 4, 5, 6]);
    for (const t of selfTests) expect(t.questions.length).toBeGreaterThanOrEqual(4);
    expect(TOTAL_UNITS).toBe(20);
  });

  it("every question is well formed with unique ids", () => {
    const qs = allQuestions();
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
    for (const q of qs) {
      expect(q.block, q.id).toBeGreaterThanOrEqual(1);
      expect(q.block, q.id).toBeLessThanOrEqual(14);
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(3);
      expect(q.options[q.correct], q.id).toBeDefined();
      expect(nonEmpty(q.prompt) && nonEmpty(q.explain), q.id).toBe(true);
      if (q.visual) {
        expect(FIGURES[q.visual.figure], q.id).toBeDefined();
        if (q.visual.mark)
          expect(calloutsOf(q.visual.figure, q.visual.mark).length, q.id).toBeGreaterThan(0);
      }
    }
  });

  it("test 5 has a chart-answer question whose right plot has fibrous falling and bony rising", () => {
    const q = selfTests[4]!.questions.find((x) => x.options.some((o) => o.plot))!;
    const right = q.options[q.correct]!.plot!;
    expect(right.fibrous[0]!).toBeGreaterThan(right.fibrous[4]!);
    expect(right.bony[0]!).toBeLessThan(right.bony[4]!);
  });
});

describe("lesson wiring", () => {
  it("the curriculum lesson exists and is the support lesson", () => {
    expect(lessonExists(SUPPORT_LESSON_ID)).toBe(true);
    const { lesson } = findLesson(SUPPORT_LESSON_ID);
    expect(lesson.board).toBe("support");
    expect(lesson.title.ar).toContain("الدعامة");
  });
});

describe("BodyParts3D groups", () => {
  const skeleton = glbNodeNames("skeleton.glb");
  const muscles = glbNodeNames("muscles.glb");

  it("every real group resolves to nodes of its file, markers to none", () => {
    for (const g of Object.values(PICK_GROUPS)) {
      const names = g.file === "muscles" ? muscles : skeleton;
      const found = groupNodes(g.id, names);
      if (g.marker) expect(found, g.id).toHaveLength(0);
      else expect(found.length, g.id).toBeGreaterThan(0);
    }
  });

  it("matches the textbook counts on the real atlas", () => {
    expect(groupNodes("cranial-bones", skeleton)).toHaveLength(8);
    expect(groupNodes("facial-bones", skeleton)).toHaveLength(14);
    expect(groupNodes("cervical-vertebrae", skeleton)).toHaveLength(7);
    expect(groupNodes("thoracic-vertebrae", skeleton)).toHaveLength(12);
    expect(groupNodes("lumbar-vertebrae", skeleton)).toHaveLength(5);
    expect(groupNodes("floating-ribs", skeleton)).toHaveLength(4);
    expect(groupNodes("true-ribs", skeleton)).toHaveLength(20);
    expect(groupNodes("carpals", skeleton)).toHaveLength(16);
    expect(groupNodes("tarsals", skeleton)).toHaveLength(14);
    expect(groupNodes("metacarpals", skeleton)).toHaveLength(10);
    expect(groupNodes("metatarsals", skeleton)).toHaveLength(10);
  });
});
