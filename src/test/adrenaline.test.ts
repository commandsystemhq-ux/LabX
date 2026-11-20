import { describe, expect, it } from "vitest";
import { extras, hazardLevel } from "@/data/simExtras";
import { allLessons, findLesson, journeys, lessonExists } from "@/data/mockCurriculum";
import { lessonCatalog } from "@/data/noor";
import { buildComparison, demoValues } from "@/data/quizCompare";
import { computeAdrenaline, defaultsOf, lessonDefaults, simulations } from "@/data/simulations";
import { buildTutorReply, type TutorContext } from "@/data/tutor";
import { askTutorInput } from "@/lib/ai-config";

const sim = simulations.adrenaline;
const base = defaultsOf(sim);
const model = (patch: Partial<typeof base>) => {
  const v = { ...base, ...patch };
  return computeAdrenaline(v.adrenaline, v.oxygen, v.glucose, v.fault);
};

describe("Adrenaline & heart model", () => {
  it("rests at a normal pulse with a fully working brain", () => {
    const rest = model({});
    expect(rest.hr).toBeGreaterThan(65);
    expect(rest.hr).toBeLessThan(80);
    expect(rest.output).toBeGreaterThan(4.5);
    expect(rest.brain).toBe(100);
    expect(extras.adrenaline.hazards(base)).toEqual([]);
  });

  it("adrenaline raises the pulse, but a very fast heart fills badly and the brain suffers", () => {
    expect(model({ adrenaline: 50 }).hr).toBeGreaterThan(model({ adrenaline: 10 }).hr);
    const wild = model({ adrenaline: 100 });
    expect(wild.hr).toBeGreaterThan(150);
    expect(wild.strokeVolume).toBeLessThan(model({ adrenaline: 60 }).strokeVolume);
    expect(wild.brain).toBeLessThan(model({ adrenaline: 60 }).brain);
  });

  it("brain response needs both oxygen and glucose", () => {
    expect(model({ glucose: 40 }).brain).toBeLessThan(40);
    expect(model({ glucose: 66 }).brain).toBeLessThan(100);
    expect(model({ oxygen: 70 }).brain).toBeLessThan(model({ oxygen: 98 }).brain);
    expect(model({ glucose: 300 }).brain).toBeLessThan(100);
  });

  it("faults: a surge adds adrenaline, a narrowed artery starves the brain, a beta blocker mutes the heart", () => {
    expect(model({ fault: 1 }).surged).toBe(55);
    expect(model({ fault: 2 }).brain).toBeLessThan(60);
    expect(model({ fault: 2 }).output).toBeCloseTo(model({}).output, 5);
    const blocked = model({ adrenaline: 90, fault: 3 });
    expect(blocked.hr).toBeLessThan(model({ adrenaline: 90 }).hr - 30);
  });

  it("raises visual hazards at the extremes, in both severities", () => {
    const level = (patch: Partial<typeof base>) =>
      hazardLevel(extras.adrenaline.hazards({ ...base, ...patch }));
    expect(level({ adrenaline: 85 })).toBeGreaterThanOrEqual(1);
    expect(level({ adrenaline: 100 })).toBe(2);
    expect(level({ glucose: 60 })).toBe(1);
    expect(level({ glucose: 40 })).toBe(2);
    expect(level({ oxygen: 85 })).toBe(1);
    expect(level({ oxygen: 72 })).toBe(2);
    expect(level({ fault: 2 })).toBe(2);
  });

  it("states the live values for Noor in the scene description", () => {
    const text = sim.context({ ...base, adrenaline: 80, glucose: 40 }, "en");
    expect(text).toContain("Adrenaline = 80%");
    expect(text).toContain("Glucose = 40 mg/dL");
    expect(text).toMatch(/HR = \d+ bpm/);
    expect(text).toMatch(/Brain response = \d+%/);
  });

  it("every quiz demo makes the compared readout move the way the answer says", () => {
    for (const q of sim.quiz) {
      const cmp = buildComparison(sim, q, 0);
      expect(cmp).not.toBeNull();
      expect(cmp!.actual).not.toBe(cmp!.before);
      const shown = demoValues(sim, q);
      expect(shown.fault === 0 || extras.adrenaline.faults.some((f) => f.id === shown.fault)).toBe(
        true,
      );
    }
  });

  it("local tutor replies use the live physiology", () => {
    const ctx: TutorContext = {
      lang: "en",
      values: { ...base, adrenaline: 80 },
      change: null,
      step: 3,
      mode: "free",
      view: "macro",
      hazards: [],
      errorMode: false,
      guided: null,
    };
    expect(buildTutorReply(sim, "colloquial", ctx)).toContain("Picture your heart");
    expect(buildTutorReply(sim, "free", ctx)).toMatch(/\d+ bpm/);
  });
});

describe("The adrenaline journey in the curriculum", () => {
  it("is listed, points at a real biology lesson that runs the adrenaline simulation", () => {
    expect(journeys.length).toBeGreaterThan(0);
    for (const j of journeys) {
      expect(lessonExists(j.lessonId), j.id).toBe(true);
      const { lesson, subject } = findLesson(j.lessonId);
      expect(subject.id).toBe(j.subject);
      expect(lesson.simulationId).toBe("adrenaline");
      expect(j.title.ar && j.title.en && j.tagline.ar && j.tagline.en).toBeTruthy();
    }
  });

  it("its lessons start from safe presets and Noor can suggest them", () => {
    const own = allLessons().filter((x) => x.lesson.simulationId === "adrenaline");
    expect(own.length).toBeGreaterThanOrEqual(2);
    for (const { lesson } of own) {
      const start = lessonDefaults(sim, lesson.preset);
      expect(extras.adrenaline.hazards(start), lesson.id).toEqual([]);
    }
    const catalog = lessonCatalog("g12").join("\n");
    expect(catalog).toContain("g12-biology-u4-l1");
  });

  it("the AI request accepts the new simulation id", () => {
    const ok = askTutorInput.safeParse({
      accessToken: "t".repeat(24),
      question: "ليه النبض زاد؟",
      intent: "why",
      lang: "ar",
      page: "lesson",
      simId: "adrenaline",
      scene: "x",
      hazards: [],
      errorMode: false,
    });
    expect(ok.success).toBe(true);
  });
});
