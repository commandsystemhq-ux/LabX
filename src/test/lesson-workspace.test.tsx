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
import { NoorProvider } from "@/components/noor/NoorProvider";
import { LanguageProvider } from "@/lib/i18n";
import { progressStore } from "@/lib/progress";

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
