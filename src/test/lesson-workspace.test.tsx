import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LessonWorkspace } from "@/components/lesson/LessonWorkspace";
import { findLesson } from "@/data/mockCurriculum";
import { NoorAssistant } from "@/components/noor/NoorAssistant";
import { NoorProvider, useNoorLesson } from "@/components/noor/NoorProvider";
import { LanguageProvider } from "@/lib/i18n";
import { progressStore } from "@/lib/progress";

/** Exposes what the lesson page tells Noor, so tests can assert on the live context. */
function NoorCtxProbe() {
  const ctx = useNoorLesson()?.ctx;
  return (
    <output data-testid="noor-ctx">
      {JSON.stringify({
        step: ctx?.step,
        prediction: ctx?.prediction ?? null,
        quizMistake: ctx?.quizMistake ?? null,
        errorMode: ctx?.errorMode,
        hazards: ctx?.hazards.length,
      })}
    </output>
  );
}
const noorCtx = () =>
  JSON.parse(screen.getByTestId("noor-ctx").textContent ?? "{}") as {
    step: number;
    prediction: string | null;
    quizMistake: { question: string; chosen: string; correct: string } | null;
    errorMode: boolean;
    hazards: number;
  };

async function mountLesson(id: string) {
  const lookup = findLesson(id);
  const rootRoute = createRootRoute({
    component: () => (
      <LanguageProvider>
        <NoorProvider>
          <div data-subject={lookup.subject.id}>
            <LessonWorkspace lookup={lookup} />
          </div>
          <NoorAssistant />
          <NoorCtxProbe />
        </NoorProvider>
      </LanguageProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

beforeEach(() => {
  // The animation clock re-renders every frame; freeze it so tests stay fast and deterministic.
  vi.stubGlobal("requestAnimationFrame", () => 0);
  vi.stubGlobal("cancelAnimationFrame", () => {});
  window.localStorage.clear();
  progressStore.reset();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const click = (el: HTMLElement) =>
  act(async () => {
    fireEvent.click(el);
  });

describe("LessonWorkspace (all three subjects)", () => {
  it.each([
    ["g12-physics-u1-l2", "Ohm"],
    ["g12-chemistry-u1-l1", "reaction"],
    ["g12-biology-u2-l2", "diffusion"],
  ])("%s mounts with story, 4-step stepper and the AI tutor", async (id) => {
    await mountLesson(id);
    expect(screen.getAllByRole("button", { name: /يلا نفهم اللي بيحصل/ }).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(3);
    expect(screen.getAllByRole("button", { name: "نور" }).length).toBeGreaterThan(0);
  });

  it("guided discovery gates the next step until the goal is reached", async () => {
    await mountLesson("g12-physics-u1-l2");
    await click(screen.getByRole("button", { name: /يلا نفهم اللي بيحصل/ }));
    const next = screen.getByRole("button", { name: "الخطوة التالية" });
    expect(next).toBeDisabled();
    const thumb = document.querySelector<HTMLElement>("#var-voltage [role=slider]")!;
    await act(async () => {
      thumb.focus();
      fireEvent.keyDown(thumb, { key: "End" });
    });
    expect(screen.getByRole("button", { name: "الخطوة التالية" })).toBeEnabled();
  });

  it("error mode injects a fault and announces the real-world consequence", async () => {
    await mountLesson("g12-physics-u1-l2");
    await click(screen.getByRole("button", { name: /تجربة حرة/ }));
    expect(screen.queryByRole("alert")).toBeNull();
    await click(screen.getByRole("switch", { name: "وضع الأخطاء الواقعية" }));
    await click(screen.getByRole("radio", { name: /قصر دائرة/ }));
    const alert = screen.getByRole("alert");
    expect(within(alert).getByText(/النتيجة الواقعية/)).toBeInTheDocument();
    expect(alert).toHaveTextContent("الفيوز");
  });

  it("a wrong quiz answer shows the comparison, the simulation demo, and returns to the same question", async () => {
    await mountLesson("g12-physics-u1-l2");
    await click(screen.getByRole("button", { name: /اختبار الفهم/ }));
    await click(screen.getByRole("button", { name: /تتضاعف/ }));
    expect(screen.getByText("قارن بالمحاكاة")).toBeInTheDocument();
    await click(screen.getByRole("button", { name: /شاهد الخطأ عملياً في المحاكاة/ }));
    expect(screen.getByText("وضع العرض العملي")).toBeInTheDocument();
    expect(screen.getByText("R = 20.0 Ω")).toBeInTheDocument();
    await click(screen.getByRole("button", { name: "ارجع للاختبار" }));
    expect(screen.getByText(/سؤال 1 من 3/)).toBeInTheDocument();
  });

  it("finishing the quiz saves mastery and awards XP once", async () => {
    await mountLesson("g12-physics-u1-l2");
    await click(screen.getByRole("button", { name: /اختبار الفهم/ }));
    await click(screen.getByRole("button", { name: /تقل للنصف/ }));
    await click(screen.getByRole("button", { name: "التالي" }));
    await click(screen.getByRole("button", { name: /يقل لأن المقاومة زادت/ }));
    await click(screen.getByRole("button", { name: "التالي" }));
    await click(screen.getByRole("button", { name: /التيار يرتفع جداً/ }));
    await click(screen.getByRole("button", { name: "التالي" }));
    expect(screen.getByText("خلصت الاختبار!")).toBeInTheDocument();
    const saved = progressStore.getSnapshot();
    expect(saved.lessons["g12-physics-u1-l2"]).toMatchObject({
      bestScore: 3,
      mastery: 100,
      step: 4,
    });
    expect(saved.xp).toBe(75);
    expect(screen.getByText("+75 XP")).toBeInTheDocument();
  });
});

describe("Interaction loop wired to Noor", () => {
  it("step 1 asks for a written prediction, keeps it and shows it again while experimenting", async () => {
    await mountLesson("g12-physics-u1-l2");
    expect(screen.getByText("ليه ده مهم؟")).toBeInTheDocument();
    const box = screen.getByLabelText("اكتب توقعك قبل ما تجرّب");
    expect(box).toHaveAttribute("maxlength", "200");
    expect(noorCtx().prediction).toBeNull();

    await act(async () => {
      fireEvent.change(box, { target: { value: "  التيار هيقل لأن المقاومة بتزيد  " } });
    });
    // Typing alone does not push to Noor; leaving the field / the step does.
    expect(noorCtx().prediction).toBeNull();
    await click(screen.getByRole("button", { name: /يلا نفهم اللي بيحصل/ }));
    expect(noorCtx()).toMatchObject({ step: 2, prediction: "التيار هيقل لأن المقاومة بتزيد" });

    await click(screen.getByRole("button", { name: /تجربة حرة/ }));
    expect(screen.getByText("التيار هيقل لأن المقاومة بتزيد")).toBeInTheDocument();
    expect(noorCtx().step).toBe(3);
  });

  it("a blank prediction is not sent to Noor", async () => {
    await mountLesson("g12-physics-u1-l2");
    const box = screen.getByLabelText("اكتب توقعك قبل ما تجرّب");
    await act(async () => {
      fireEvent.change(box, { target: { value: "   " } });
      fireEvent.blur(box);
    });
    expect(noorCtx().prediction).toBeNull();
  });

  it("free lab extremes reach Noor as error mode and live hazards", async () => {
    await mountLesson("g12-physics-u1-l2");
    await click(screen.getByRole("button", { name: /تجربة حرة/ }));
    await click(screen.getByRole("switch", { name: "وضع الأخطاء الواقعية" }));
    await click(screen.getByRole("radio", { name: /قصر دائرة/ }));
    expect(noorCtx()).toMatchObject({ step: 3, errorMode: true });
    expect(noorCtx().hazards).toBeGreaterThan(0);
  });

  it("a wrong quiz answer gives Noor the question, the pick and the right answer", async () => {
    await mountLesson("g12-physics-u1-l2");
    await click(screen.getByRole("button", { name: /اختبار الفهم/ }));
    expect(noorCtx().quizMistake).toBeNull();
    await click(screen.getByRole("button", { name: /تتضاعف/ }));
    const mistake = noorCtx().quizMistake;
    expect(mistake?.chosen).toMatch(/تتضاعف/);
    expect(mistake?.correct).toBeTruthy();
    expect(mistake?.question).toBeTruthy();

    // It stays available while the student studies the live demo.
    await click(screen.getByRole("button", { name: /شاهد الخطأ عملياً في المحاكاة/ }));
    expect(noorCtx()).toMatchObject({ step: 3 });
    expect(noorCtx().quizMistake?.chosen).toMatch(/تتضاعف/);
  });
});

describe("Biology journey: the adrenaline & heart lesson", () => {
  it("runs the 4-step loop with live physiology and shows failures, not just text", async () => {
    await mountLesson("g12-biology-u4-l1");
    expect(screen.getByText(/كن أنت: ليه قلبك بيدق/)).toBeInTheDocument();
    expect(screen.getByLabelText("اكتب توقعك قبل ما تجرّب")).toBeInTheDocument();

    await click(screen.getByRole("button", { name: /تجربة حرة/ }));
    // Live graph + readouts follow the sliders.
    expect(screen.getAllByText("معدل النبض").length).toBeGreaterThan(0);
    expect(screen.getAllByText("استجابة المخ").length).toBeGreaterThan(0);
    expect(noorCtx()).toMatchObject({ step: 3, errorMode: false, hazards: 0 });

    await click(screen.getByRole("switch", { name: "وضع الأخطاء الواقعية" }));
    await click(screen.getByRole("radio", { name: /تضيّق شريان المخ/ }));
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("شريان المخ ضيّق");
    expect(noorCtx()).toMatchObject({ errorMode: true });
    expect(noorCtx().hazards).toBeGreaterThan(0);
  });

  it("a wrong quiz answer opens the live demo and tells Noor what went wrong", async () => {
    await mountLesson("g12-biology-u4-l1");
    await click(screen.getByRole("button", { name: /اختبار الفهم/ }));
    await click(screen.getByRole("button", { name: /أقل من الطبيعي/ }));
    expect(noorCtx().quizMistake?.chosen).toMatch(/أقل من الطبيعي/);
    await click(screen.getByRole("button", { name: /شاهد الخطأ عملياً في المحاكاة/ }));
    expect(screen.getByText("وضع العرض العملي")).toBeInTheDocument();
    expect(noorCtx().step).toBe(3);
  });
});
