import { describe, expect, it } from "vitest";
import {
  computeDiffusion,
  computeOhm,
  computeRate,
  defaultsOf,
  simulations,
} from "@/data/simulations";
import {
  allLessons,
  curriculum,
  findLesson,
  getNextLesson,
  grades,
  lessonExists,
  STUDENT_PRICE_EGP,
  subjectMastery,
  subjects,
} from "@/data/mockCurriculum";

describe("Ohm's law model", () => {
  it("gives I = V / R at room temperature (12V, 10Ω → 1.2A)", () => {
    expect(computeOhm(12, 10, 25).current).toBeCloseTo(1.2, 5);
  });

  it("halves the current when resistance doubles", () => {
    expect(computeOhm(12, 20, 25).current).toBeCloseTo(0.6, 5);
  });

  it("lowers the current when the wire heats up", () => {
    expect(computeOhm(12, 10, 125).current).toBeLessThan(computeOhm(12, 10, 25).current);
  });
});

describe("Reaction rate model", () => {
  it("roughly doubles the rate for +10°C", () => {
    const ratio = computeRate(35, 1, 0).rate / computeRate(25, 1, 0).rate;
    expect(ratio).toBeCloseTo(2, 5);
  });
});

describe("Diffusion model", () => {
  it("stops net diffusion at zero gradient", () => {
    expect(computeDiffusion(37, 0, 60).rate).toBe(0);
  });
});

describe("Lesson data", () => {
  it("every quiz's correct option exists", () => {
    for (const sim of Object.values(simulations)) {
      for (const q of sim.quiz) expect(q.options[q.correct]).toBeDefined();
    }
  });

  it("defaults load the sim's own variables", () => {
    expect(defaultsOf(simulations.ohm).voltage).toBe(12);
  });

  it("falls back to the Ohm's law lesson for unknown ids", () => {
    expect(findLesson("nope").lesson.id).toBe("g12-physics-u1-l2");
  });

  it("shows the student plan at 99 EGP/month", () => {
    expect(STUDENT_PRICE_EGP).toBe(99);
  });
});

describe("Fault models (real-world error mode)", () => {
  it("short circuit collapses the resistance and spikes the current", () => {
    const ok = computeOhm(12, 10, 25, 0);
    const shorted = computeOhm(12, 10, 25, 1);
    expect(shorted.rEff).toBeCloseTo(0.5, 5);
    expect(shorted.current).toBeCloseTo(24, 5);
    expect(shorted.current).toBeGreaterThan(ok.current * 10);
  });

  it("a loose joint adds contact resistance and dissipates heat there", () => {
    const loose = computeOhm(12, 10, 25, 2);
    expect(loose.rEff).toBeCloseTo(18, 5);
    expect(loose.contactPower).toBeCloseTo(loose.current ** 2 * 8, 5);
    expect(computeOhm(12, 10, 25, 0).contactPower).toBe(0);
  });

  it("mixing everything at once triples the initial rate", () => {
    expect(computeRate(25, 1, 0, 1).rate).toBeCloseTo(3 * computeRate(25, 1, 0, 0).rate, 5);
  });

  it("denatured or damaged membranes become leaky and lose control", () => {
    expect(computeDiffusion(37, 50, 60).leaky).toBe(false);
    expect(computeDiffusion(55, 50, 60).denatured).toBe(true);
    expect(computeDiffusion(37, 50, 60, 1).leaky).toBe(true);
    expect(computeDiffusion(37, 50, 60, 1).rate).toBeGreaterThan(computeDiffusion(37, 50, 60).rate);
  });

  it("a hypertonic solution raises the effective gradient", () => {
    expect(computeDiffusion(37, 50, 60, 2).rate).toBeGreaterThan(computeDiffusion(37, 50, 60).rate);
  });

  it("zero gradient still has no net diffusion even with a leaky membrane", () => {
    expect(computeDiffusion(37, 0, 60, 1).rate).toBe(0);
  });

  it("defaults start with no fault", () => {
    for (const sim of Object.values(simulations)) expect(defaultsOf(sim).fault).toBe(0);
  });
});

describe("Quiz content", () => {
  it("claims and focus point at real options and readouts", () => {
    for (const sim of Object.values(simulations)) {
      const keys = sim.readouts(defaultsOf(sim)).map((r) => r.key);
      for (const q of sim.quiz) {
        if (q.focus) expect(keys).toContain(q.focus);
        for (const idx of Object.keys(q.claims ?? {})) {
          expect(q.options[Number(idx)]).toBeDefined();
          expect(Number(idx)).not.toBe(q.correct);
        }
      }
    }
  });

  it("every subject quiz has a real-world hazard question", () => {
    for (const sim of Object.values(simulations)) {
      expect(sim.quiz.some((q) => (q.demo.fault ?? 0) !== 0)).toBe(true);
    }
  });
});

describe("Curriculum hierarchy: grade → subject → unit → lesson", () => {
  it("has unique lesson ids and a matching simulation per subject", () => {
    const all = allLessons();
    expect(new Set(all.map((x) => x.lesson.id)).size).toBe(all.length);
    for (const { subject, lesson } of all) {
      expect(simulations[lesson.simulationId].subject).toBe(subject.id);
      expect(lessonExists(lesson.id)).toBe(true);
    }
  });

  it("covers every grade × subject with at least one unit and lesson", () => {
    for (const g of grades) {
      for (const s of subjects) {
        const units = curriculum[g.id][s.id];
        expect(units.length).toBeGreaterThan(0);
        for (const u of units) expect(u.lessons.length).toBeGreaterThan(0);
      }
    }
  });

  it("resolves the next lesson across units and stops at the end of a subject", () => {
    const units = curriculum.g12.physics;
    const first = units[0]!;
    const lastOfUnit1 = first.lessons.at(-1)!;
    expect(getNextLesson(lastOfUnit1.id)?.lesson.id).toBe(units[1]!.lessons[0]!.id);
    const lastLesson = units.at(-1)!.lessons.at(-1)!;
    expect(getNextLesson(lastLesson.id)).toBeNull();
  });

  it("subjectMastery accepts a resolver that overrides seeded mastery", () => {
    const units = curriculum.g10.biology;
    expect(subjectMastery(units, () => 100)).toBe(100);
    expect(subjectMastery([], () => 100)).toBe(0);
  });
});
