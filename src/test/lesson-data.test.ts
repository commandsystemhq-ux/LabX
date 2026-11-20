import { describe, expect, it } from "vitest";
import { allLessons } from "@/data/mockCurriculum";
import { buildComparison, CLOSE_PCT } from "@/data/quizCompare";
import {
  extras,
  fieldInfo,
  hazardLevel,
  leChatelier,
  lessonLayers,
  microscopeInfo,
} from "@/data/simExtras";
import {
  computeDiffusion,
  computeOhm,
  computeRate,
  defaultsOf,
  lessonDefaults,
  simulations,
  type SimValues,
} from "@/data/simulations";

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

describe("curriculum enrichment", () => {
  it("every preset layer exists for its simulation", () => {
    for (const { lesson } of withPreset) {
      const ids = extras[lesson.simulationId].layers.map((l) => l.id);
      for (const id of lesson.preset?.layers ?? []) expect(ids).toContain(id);
    }
  });

  it("lessonLayers enables preset layers and ignores unknown ids", () => {
    const layers = lessonLayers("ohm", { layers: ["field", "nope"] });
    expect(layers["field"]).toBe(true);
    expect("nope" in layers).toBe(false);
    expect(lessonLayers("ohm")["field"]).toBe(false);
  });

  it("each grade × subject offers at least three units of content", () => {
    for (const grade of ["g10", "g11", "g12"] as const) {
      for (const subject of ["biology", "physics", "chemistry"] as const) {
        const lessons = allLessons().filter(
          (x) => x.grade.id === grade && x.subject.id === subject,
        );
        expect(new Set(lessons.map((x) => x.unit.id)).size).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

describe("real-world faults", () => {
  const ids = ["ohm", "reaction-rate", "diffusion"] as const;

  it("every fault warns in both languages (sealed-vessel pressure needs a fast reaction)", () => {
    for (const id of ids) {
      const sim = simulations[id];
      const stress: Partial<SimValues> =
        id === "reaction-rate" ? { temperature: 60, concentration: 2 } : {};
      for (const fault of extras[id].faults) {
        const values: SimValues = { ...defaultsOf(sim), ...stress, fault: fault.id };
        const hazards = extras[id].hazards(values);
        expect(hazards.length, `${id} fault ${fault.id}`).toBeGreaterThan(0);
        for (const h of hazards) {
          for (const text of [h.title, h.cause, h.consequence, h.fix]) {
            expect(text.ar.length).toBeGreaterThan(0);
            expect(text.en.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("a voltmeter in series chokes the current instead of reading the resistor", () => {
    const healthy = computeOhm(12, 10, 25, 0);
    const faulty = computeOhm(12, 10, 25, 3);
    expect(faulty.rEff).toBeCloseTo(10_010, 5);
    expect(faulty.current).toBeLessThan(healthy.current / 500);
  });

  it("an uncooled exothermic reaction runs hotter and faster (about ×2.8 for +15 °C)", () => {
    const ok = computeRate(25, 1, 0, 0);
    const hot = computeRate(25, 1, 0, 3);
    expect(hot.tEff).toBe(40);
    expect(hot.rate / ok.rate).toBeCloseTo(2 ** 1.5, 5);
    const critical = extras["reaction-rate"].hazards({
      ...defaultsOf(simulations["reaction-rate"]),
      temperature: 75,
      fault: 3,
    });
    expect(hazardLevel(critical)).toBe(2);
  });

  it("blocked channels cut diffusion to a quarter without turning the membrane leaky", () => {
    const ok = computeDiffusion(37, 50, 60, 0);
    const blocked = computeDiffusion(37, 50, 60, 3);
    expect(blocked.blocked).toBe(true);
    expect(blocked.leaky).toBe(false);
    expect(blocked.rate / ok.rate).toBeCloseTo(0.25, 5);
    // Heat damage dominates: a denatured membrane is leaky, never "blocked".
    expect(computeDiffusion(55, 50, 60, 3).blocked).toBe(false);
  });
});

describe("subject enrichment models", () => {
  const base = (id: keyof typeof simulations) => defaultsOf(simulations[id]);

  it("physics: E = V/L, F = eE and drift speed scale with the circuit", () => {
    const a = fieldInfo({ ...base("ohm"), voltage: 12 });
    const b = fieldInfo({ ...base("ohm"), voltage: 24 });
    expect(a.field).toBeCloseTo(24, 5);
    expect(b.force / a.force).toBeCloseTo(2, 5);
    expect(a.force).toBeCloseTo(1.602e-19 * 24, 25);
    expect(a.driftMmPerS).toBeGreaterThan(0);
    expect(fieldInfo({ ...base("ohm"), voltage: 0 }).field).toBe(0);
  });

  it("chemistry: Le Chatelier shifts the right way and the catalyst never shifts it", () => {
    const r = base("reaction-rate");
    expect(leChatelier(r).shift).toBe("none");
    expect(leChatelier({ ...r, concentration: 1.8 }).shift).toBe("forward");
    expect(leChatelier({ ...r, concentration: 0.4 }).shift).toBe("reverse");
    // exothermic: heating favours the reactants, cooling the products
    expect(leChatelier({ ...r, temperature: 60 }).shift).toBe("reverse");
    expect(leChatelier({ ...r, temperature: 5 }).shift).toBe("forward");
    expect(leChatelier({ ...r, catalyst: 10 }).shift).toBe("none");
    expect(leChatelier({ ...r, catalyst: 10 }).reasons.length).toBeGreaterThan(0);
    expect(leChatelier({ ...r, temperature: 60 }).K).toBeLessThan(1);
  });

  it("biology: the membrane is only visible under the electron microscope", () => {
    const v = base("diffusion");
    const light = microscopeInfo(v, "macro");
    const electron = microscopeInfo(v, "molecular");
    expect(light.membraneVisible).toBe(false);
    expect(electron.membraneVisible).toBe(true);
    expect(light.fovUm).toBeGreaterThan(electron.fovUm);
    expect(microscopeInfo({ ...v, permeability: 100 }, "molecular").channels).toBeGreaterThan(
      microscopeInfo({ ...v, permeability: 20 }, "molecular").channels,
    );
    expect(microscopeInfo({ ...v, fault: 3 }, "molecular").channels).toBeLessThan(
      electron.channels,
    );
  });
});
