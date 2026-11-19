import { describe, expect, it } from "vitest";
import { computeDiffusion, computeOhm, computeRate, defaultsOf, simulations } from "@/data/simulations";
import { findLesson, STUDENT_PRICE_EGP } from "@/data/mockCurriculum";

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
