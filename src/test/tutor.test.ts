import { describe, expect, it } from "vitest";
import { extras } from "@/data/simExtras";
import { defaultsOf, simulations, type SimValues } from "@/data/simulations";
import { buildTutorReply, detectIntent, type TutorContext } from "@/data/tutor";

const ohm = simulations.ohm;

function ctx(patch: Partial<TutorContext> = {}, values: Partial<SimValues> = {}): TutorContext {
  const v = { ...defaultsOf(ohm), ...values };
  return {
    lang: "en",
    values: v,
    change: null,
    step: 3,
    mode: "free",
    view: "macro",
    hazards: extras.ohm.hazards(v),
    errorMode: false,
    guided: null,
    ...patch,
  };
}

describe("detectIntent", () => {
  it.each([
    ["ليه القراءة اتغيرت؟", "why"],
    ["why did it change", "why"],
    ["هل في خطر؟", "hazard"],
    ["will the fuse blow?", "hazard"],
    ["ساعدني مش فاهم", "hint"],
    ["give me a hint", "hint"],
    ["اشرحلي بالعامية", "colloquial"],
    ["إديني مثال من الحياة", "example"],
    ["إيه الغلطة الشائعة", "mistake"],
    ["hello", "free"],
  ])("%s → %s", (text, intent) => {
    expect(detectIntent(text)).toBe(intent);
  });
});

describe("buildTutorReply is aware of the scene", () => {
  it("quotes the live values", () => {
    const reply = buildTutorReply(ohm, "free", ctx({}, { voltage: 18, resistance: 6 }));
    expect(reply).toContain("3.00A");
  });

  it("explains the active hazard with its real-world result and fix", () => {
    const hazardous = ctx({}, { voltage: 24, resistance: 3 });
    const reply = buildTutorReply(ohm, "hazard", hazardous);
    expect(reply).toContain("Real-world result");
    expect(reply).toContain("Fix");
    expect(
      buildTutorReply(ohm, "why", { ...hazardous, change: { key: "voltage", from: 12, to: 24 } }),
    ).toContain("Real-world result");
  });

  it("says the scene is safe and suggests what to try when there is no hazard", () => {
    const reply = buildTutorReply(ohm, "hazard", ctx());
    expect(reply).toContain("safe");
    expect(reply).toContain("Error Mode");
  });

  it("hints follow the current step and guided task", () => {
    const step = extras.ohm.guided[0]!;
    const guided = { index: 0, total: 3, step, done: false };
    const task = buildTutorReply(ohm, "hint", ctx({ step: 2, mode: "guided", guided }));
    expect(task).toContain(step.task.en);
    const done = buildTutorReply(
      ohm,
      "hint",
      ctx({ step: 2, mode: "guided", guided: { ...guided, done: true } }),
    );
    expect(done).toContain("Next step");
    expect(buildTutorReply(ohm, "hint", ctx({ step: 1 }))).toContain("story");
    expect(buildTutorReply(ohm, "hint", ctx({ step: 4 }))).toContain("See the mistake");
  });

  it("answers in Arabic when asked in Arabic", () => {
    const reply = buildTutorReply(ohm, "hazard", ctx({ lang: "ar" }, { fault: 1 }));
    expect(reply).toMatch(/[\u0600-\u06FF]/);
    expect(reply).toContain("قصر دائرة");
  });

  it("never echoes markup as HTML-capable structure (plain text only)", () => {
    const reply = buildTutorReply(ohm, detectIntent("<img src=x onerror=alert(1)>"), ctx());
    expect(typeof reply).toBe("string");
    expect(reply).not.toContain("<img");
  });
});

describe("local replies use the student's prediction and quiz mistake", () => {
  it("ties a 'why' answer to the prediction once the student is past step 1", () => {
    const withPrediction = buildTutorReply(ohm, "why", ctx({ prediction: "current falls" }));
    expect(withPrediction).toContain("Your prediction was: “current falls”");
    expect(buildTutorReply(ohm, "why", ctx({ prediction: "x", step: 1 }))).not.toContain(
      "Your prediction",
    );
    expect(buildTutorReply(ohm, "why", ctx())).not.toContain("Your prediction");
    expect(buildTutorReply(ohm, "hint", ctx({ prediction: "x" }))).not.toContain("prediction was");
  });

  it("mentions the wrong pick and the right answer for 'mistake'", () => {
    const reply = buildTutorReply(
      ohm,
      "mistake",
      ctx({ quizMistake: { question: "Q1", chosen: "doubles", correct: "halves" } }),
    );
    expect(reply).toContain("“Q1” you picked “doubles”");
    expect(reply).toContain("“halves”");
    expect(
      buildTutorReply(
        ohm,
        "mistake",
        ctx({ lang: "ar", quizMistake: { question: "س", chosen: "أ", correct: "ب" } }),
      ),
    ).toContain("اخترت «أ» والإجابة الصح «ب»");
  });
});
