import { describe, expect, it } from "vitest";
import { allLessons } from "@/data/mockCurriculum";
import { buildComparison, CLOSE_PCT } from "@/data/quizCompare";
import { extras, hazardLevel } from "@/data/simExtras";
import { lessonDefaults, simulations } from "@/data/simulations";

const withPreset = allLessons().filter((x) => x.lesson.preset);

describe("per-lesson simulation presets", () => {
  it("some lessons customise their simulation", () => {
    expect(withPreset.length).toBeGreaterThan(0);
  });

  it.each(withPreset.map((x) => [x.lesson.id, x] as const))(
    "%s starts safe, in range, with guided steps still incomplete",
    (_id, { lesson }) => {
      const sim = simulations[lesson.simulationId];
      const start = lessonDefaults(sim, lesson.preset);
      for (const v of sim.variables) {
        expect(start[v.key]).toBeGreaterThanOrEqual(v.min);
        expect(start[v.key]).toBeLessThanOrEqual(v.max);
      }
      expect(start.fault).toBe(0);
      expect(hazardLevel(extras[sim.id].hazards(start))).toBe(0);
      for (const step of extras[sim.id].guided) {
        const from = { ...start, ...step.start };
        expect(step.done(from)).toBe(false);
        expect(hazardLevel(extras[sim.id].hazards(from))).toBe(0);
      }
    },
  );

  it("clamps out-of-range values and ignores fault / non-finite input", () => {
    const sim = simulations.ohm;
    const v = lessonDefaults(sim, {
      values: { voltage: 9999, resistance: -5, fault: 3, temperature: Number.NaN },
    });
    expect(v.voltage).toBe(24);
    expect(v.resistance).toBe(2);
    expect(v.fault).toBe(0);
    expect(v.temperature).toBe(25);
  });

  it("returns plain defaults without a preset", () => {
    expect(lessonDefaults(simulations.ohm).voltage).toBe(12);
  });
});

describe("quiz comparison accuracy details", () => {
  it("reports the gap between the wrong claim and the actual value", () => {
    const sim = simulations.ohm;
    const cmp = buildComparison(sim, sim.quiz[0]!, 0)!;
    expect(cmp.gap).toBeCloseTo(1.8, 5);
    expect(cmp.gapPct).toBeCloseTo(300, 3);
    expect(cmp.gapPct!).toBeGreaterThan(CLOSE_PCT);
  });

  it("has no gap for choices without a numeric claim", () => {
    const sim = simulations["reaction-rate"];
    const cmp = buildComparison(sim, sim.quiz[1]!, 0)!;
    expect(cmp.gap).toBeNull();
    expect(cmp.gapPct).toBeNull();
  });
});
