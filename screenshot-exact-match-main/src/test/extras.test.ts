import { describe, expect, it } from "vitest";
import {
  activationEnergy,
  defaultLayers,
  equilibriumProgress,
  extras,
  hazardLevel,
} from "@/data/simExtras";
import { buildComparison, demoValues } from "@/data/quizCompare";
import { defaultsOf, simulations, type SimValues } from "@/data/simulations";
import { initialQuiz, quizReducer } from "@/components/lesson/useQuiz";

const ids = ["ohm", "reaction-rate", "diffusion"] as const;
const withValues = (id: (typeof ids)[number], patch: Partial<SimValues>): SimValues => ({
  ...defaultsOf(simulations[id]),
  ...patch,
});

describe("Hazards", () => {
  it("default scenes are safe", () => {
    for (const id of ids) {
      expect(extras[id].hazards(defaultsOf(simulations[id]))).toEqual([]);
    }
  });

  it("every hazard explains cause, real consequence and fix in both languages", () => {
    const risky = [
      withValues("ohm", { voltage: 24, resistance: 2, temperature: 140, fault: 1 }),
      withValues("reaction-rate", { temperature: 99, concentration: 2, catalyst: 10, fault: 2 }),
      withValues("diffusion", { temperature: 55, fault: 1 }),
    ];
    ids.forEach((id, i) => {
      const hazards = extras[id].hazards(risky[i]!);
      expect(hazards.length).toBeGreaterThan(0);
      for (const h of hazards) {
        for (const field of [h.title, h.cause, h.consequence, h.fix]) {
          expect(field.ar.length).toBeGreaterThan(0);
          expect(field.en.length).toBeGreaterThan(0);
        }
      }
    });
  });

  it("returns the most severe hazard first", () => {
    const hazards = extras.ohm.hazards(withValues("ohm", { voltage: 24, resistance: 2 }));
    expect(hazards[0]?.level).toBe(2);
    expect(hazardLevel(hazards)).toBe(2);
    expect(hazards.map((h) => h.level)).toEqual(
      [...hazards.map((h) => h.level)].sort((a, b) => b - a),
    );
  });

  it("physics: overcurrent warns at 3A and trips the fuse at 5A", () => {
    // 3.6A, 43W
    expect(hazardLevel(extras.ohm.hazards(withValues("ohm", { voltage: 18, resistance: 5 })))).toBe(
      1,
    );
    // 6A
    expect(hazardLevel(extras.ohm.hazards(withValues("ohm", { voltage: 24, resistance: 4 })))).toBe(
      2,
    );
  });

  it("physics: a short circuit is critical, the wiring tip is the fix", () => {
    const [top] = extras.ohm.hazards(withValues("ohm", { fault: 1 }));
    expect(top?.level).toBe(2);
    expect(top?.fix.en.toLowerCase()).toContain("series");
  });

  it("physics: hot wires soften then melt their insulation", () => {
    const level = (temperature: number) =>
      hazardLevel(extras.ohm.hazards(withValues("ohm", { temperature })));
    expect([level(100), level(110), level(135)]).toEqual([0, 1, 2]);
  });

  it("chemistry: runaway reaction and sealed-vessel pressure", () => {
    const rate = (patch: Partial<SimValues>) =>
      hazardLevel(extras["reaction-rate"].hazards(withValues("reaction-rate", patch)));
    expect(rate({ temperature: 75, concentration: 1.5, fault: 1 })).toBe(2);
    expect(rate({ temperature: 60, concentration: 1, fault: 2 })).toBeGreaterThanOrEqual(1);
    expect(rate({ temperature: 25 })).toBe(0);
  });

  it("biology: membrane proteins denature at 50°C and above", () => {
    const [top] = extras.diffusion.hazards(withValues("diffusion", { temperature: 52 }));
    expect(top?.id).toBe("denature");
    expect(top?.level).toBe(2);
    expect(extras.diffusion.hazards(withValues("diffusion", { temperature: 37 }))).toEqual([]);
  });
});

describe("Faults", () => {
  it("every fault id is unique, non-zero and described", () => {
    for (const id of ids) {
      const faults = extras[id].faults;
      expect(new Set(faults.map((f) => f.id)).size).toBe(faults.length);
      for (const f of faults) {
        expect(f.id).toBeGreaterThan(0);
        expect(f.description.ar && f.description.en).toBeTruthy();
      }
    }
  });
});

describe("Guided discovery", () => {
  it("each step starts incomplete, targets a real variable and can be completed", () => {
    for (const id of ids) {
      const sim = simulations[id];
      const keys = sim.variables.map((v) => v.key);
      for (const step of extras[id].guided) {
        const start = { ...defaultsOf(sim), ...step.start };
        expect(step.done(start)).toBe(false);
        expect(keys).toContain(step.focus);
        expect(sim.explain[step.explainIndex]).toBeDefined();
        const variable = sim.variables.find((v) => v.key === step.focus)!;
        const hit = [variable.min, variable.max].some((value) =>
          step.done({ ...start, [step.focus]: value }),
        );
        expect(hit).toBe(true);
      }
    }
  });

  it("the moment a guided goal is reached the scene is still safe", () => {
    for (const id of ids) {
      const sim = simulations[id];
      for (const step of extras[id].guided) {
        const variable = sim.variables.find((v) => v.key === step.focus)!;
        const start = { ...defaultsOf(sim), ...step.start };
        let goal: SimValues | null = null;
        for (let x = variable.min; x <= variable.max + 1e-9 && !goal; x += variable.step) {
          const candidate = { ...start, [step.focus]: x };
          if (step.done(candidate)) goal = candidate;
        }
        expect(goal).not.toBeNull();
        expect(hazardLevel(extras[id].hazards(goal!))).toBe(0);
      }
    }
  });
});
describe("Layers and subject extras", () => {
  it("each subject has its own layers on top of labels and flow", () => {
    expect(Object.keys(defaultLayers("ohm"))).toEqual(["labels", "flow", "hidden"]);
    expect(Object.keys(defaultLayers("diffusion"))).toEqual([
      "labels",
      "flow",
      "anatomy",
      "timeline",
    ]);
    expect(Object.keys(defaultLayers("reaction-rate"))).toEqual(["labels", "flow", "energy"]);
  });

  it("equilibrium progress grows with time and is complete without a gradient", () => {
    const v = withValues("diffusion", {});
    expect(equilibriumProgress(v, 0)).toBe(0);
    expect(equilibriumProgress(v, 10)).toBeGreaterThan(equilibriumProgress(v, 2));
    expect(equilibriumProgress({ ...v, gradient: 0 }, 0)).toBe(1);
    expect(equilibriumProgress({ ...v, permeability: 0 }, 50)).toBe(0);
  });

  it("a catalyst lowers activation energy but never below the floor", () => {
    expect(activationEnergy(0).withCatalyst).toBe(80);
    expect(activationEnergy(5).withCatalyst).toBeLessThan(80);
    expect(activationEnergy(10).withCatalyst).toBeGreaterThanOrEqual(30);
  });

  it("calculation steps are produced in both languages", () => {
    for (const id of ids) {
      const v = defaultsOf(simulations[id]);
      for (const lang of ["ar", "en"] as const) {
        const steps = extras[id].calc(v, lang);
        expect(steps.length).toBeGreaterThan(1);
        for (const s of steps) expect(s.expr).not.toMatch(/NaN|undefined/);
      }
    }
  });
});

describe("Quiz state and visual comparison", () => {
  it("awards a point only for a first-try correct answer", () => {
    let s = quizReducer(initialQuiz, { type: "choose", option: 1, correct: 1 });
    expect(s.score).toBe(1);
    s = quizReducer(initialQuiz, { type: "choose", option: 0, correct: 1 });
    expect(s.missed).toBe(true);
    s = quizReducer(quizReducer(s, { type: "clear" }), { type: "choose", option: 1, correct: 1 });
    expect(s.score).toBe(0);
  });

  it("ignores a second choice until cleared and survives leaving the step", () => {
    const first = quizReducer(initialQuiz, { type: "choose", option: 0, correct: 1 });
    expect(quizReducer(first, { type: "choose", option: 1, correct: 1 })).toBe(first);
    // leaving step 4 does nothing to the reducer state: it lives in the workspace
    expect(quizReducer(first, { type: "clear" }).index).toBe(0);
  });

  it("finishes after the last question and can restart", () => {
    let s = quizReducer(initialQuiz, { type: "next", total: 2 });
    expect(s.index).toBe(1);
    s = quizReducer(s, { type: "next", total: 2 });
    expect(s.done).toBe(true);
    expect(quizReducer(s, { type: "restart" })).toEqual(initialQuiz);
  });

  it("links a wrong answer to before / claimed / actual simulation numbers", () => {
    const sim = simulations.ohm;
    const q = sim.quiz[0]!;
    const cmp = buildComparison(sim, q, 0)!;
    expect(cmp.before).toBeCloseTo(1.2, 5);
    expect(cmp.claimed).toBe(2.4);
    expect(cmp.actual).toBeCloseTo(0.6, 5);
    expect(cmp.chosen?.en).toBe("Doubles");
    expect(cmp.correct.en).toBe("Halves");
    expect(demoValues(sim, q).resistance).toBe(20);
  });

  it("omits the claim for options without a numeric claim", () => {
    const sim = simulations["reaction-rate"];
    const q = sim.quiz[1]!;
    expect(buildComparison(sim, q, 0)?.claimed).toBeNull();
  });

  it("the fault question's actual state is hazardous", () => {
    for (const sim of Object.values(simulations)) {
      const q = sim.quiz.find((x) => (x.demo.fault ?? 0) !== 0)!;
      expect(hazardLevel(extras[sim.id].hazards(demoValues(sim, q)))).toBeGreaterThan(0);
    }
  });
});
