import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LessonWorkspace } from "@/components/lesson/LessonWorkspace";
import { IDLE_MS, SNOOZE_MS, useIdleHint } from "@/components/lesson/useIdleHint";
import { findLesson } from "@/data/mockCurriculum";
import { defaultsOf, simulations } from "@/data/simulations";
import { buildIdleHint, type TutorContext } from "@/data/tutor";
import { extras } from "@/data/simExtras";
import { LanguageProvider } from "@/lib/i18n";
import { progressStore } from "@/lib/progress";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

describe("useIdleHint", () => {
  beforeEach(() => vi.useFakeTimers());

  const setup = (enabled = true) =>
    renderHook((p: { enabled: boolean; activity: object }) => useIdleHint(p), {
      initialProps: { enabled, activity: {} },
    });

  it("appears only after 60 s without activity", async () => {
    const { result } = setup();
    await advance(IDLE_MS - 1);
    expect(result.current.visible).toBe(false);
    await advance(1);
    expect(result.current.visible).toBe(true);
  });

  it("any activity hides it and restarts the clock", async () => {
    const { result, rerender } = setup();
    await advance(IDLE_MS);
    expect(result.current.visible).toBe(true);
    rerender({ enabled: true, activity: {} });
    expect(result.current.visible).toBe(false);
    await advance(IDLE_MS - 1);
    expect(result.current.visible).toBe(false);
    await advance(1);
    expect(result.current.visible).toBe(true);
  });

  it("never shows while disabled (free lab) and starts counting once enabled", async () => {
    const { result, rerender } = setup(false);
    await advance(IDLE_MS * 3);
    expect(result.current.visible).toBe(false);
    rerender({ enabled: true, activity: {} });
    await advance(IDLE_MS);
    expect(result.current.visible).toBe(true);
  });

  it("snooze waits longer; dismiss silences it for good", async () => {
    const { result, rerender } = setup();
    await advance(IDLE_MS);
    act(() => result.current.snooze());
    expect(result.current.visible).toBe(false);
    await advance(IDLE_MS);
    expect(result.current.visible).toBe(false);
    await advance(SNOOZE_MS - IDLE_MS);
    expect(result.current.visible).toBe(true);

    act(() => result.current.dismiss());
    rerender({ enabled: true, activity: {} });
    await advance(IDLE_MS * 5);
    expect(result.current.visible).toBe(false);
  });

  it("stops counting while the tab is hidden and clears its timer on unmount", async () => {
    const { result, unmount } = setup();
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    await advance(IDLE_MS * 2);
    expect(result.current.visible).toBe(false);
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("buildIdleHint", () => {
  const sim = simulations.ohm;
  const base: TutorContext = {
    lang: "en",
    values: defaultsOf(sim),
    change: null,
    step: 2,
    mode: "free",
    view: "macro",
    hazards: [],
    errorMode: false,
    guided: null,
  };

  it("is silent in the free lab", () => {
    expect(buildIdleHint(sim, { ...base, step: 3 })).toBeNull();
  });

  it("describes the scene and the open step in both languages", () => {
    for (const lang of ["ar", "en"] as const) {
      for (const step of [1, 2, 4]) {
        const text = buildIdleHint(sim, { ...base, lang, step })!;
        expect(text).toContain(sim.context(base.values, lang).slice(0, 40));
        expect(text.length).toBeGreaterThan(40);
      }
    }
  });

  it("uses the guided task, and a live hazard takes priority", () => {
    const g = extras.ohm.guided[0]!;
    const guided = { index: 0, total: 3, step: g, done: false };
    expect(buildIdleHint(sim, { ...base, mode: "guided", guided })).toContain(g.task.en);
    expect(
      buildIdleHint(sim, { ...base, mode: "guided", guided: { ...guided, done: true } }),
    ).toMatch(/Next step/);
    const hazards = extras.ohm.hazards({ ...defaultsOf(sim), fault: 1 });
    const text = buildIdleHint(sim, { ...base, hazards })!;
    expect(text).toContain(hazards[0]!.fix.en);
  });
});

describe("LessonWorkspace idle hint", () => {
  async function mount() {
    const lookup = findLesson("g12-physics-u1-l2");
    const root = createRootRoute({
      component: () => (
        <LanguageProvider>
          <div data-subject="physics">
            <LessonWorkspace lookup={lookup} />
          </div>
        </LanguageProvider>
      ),
    });
    const router = createRouter({
      routeTree: root,
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
  }

  const click = (el: HTMLElement) =>
    act(async () => {
      fireEvent.click(el);
    });

  // A slider move is an interaction: it re-arms the idle timer, now on the fake clock.
  const nudge = () =>
    act(async () => {
      const thumb = document.querySelector<HTMLElement>("#var-voltage [role=slider]")!;
      thumb.focus();
      fireEvent.keyDown(thumb, { key: "End" });
    });

  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", () => 0);
    vi.stubGlobal("cancelAnimationFrame", () => {});
    window.localStorage.clear();
    progressStore.reset();
  });

  it("nudges after 60 s on the guided step, and can be snoozed or dismissed", async () => {
    await mount();
    await click(screen.getByRole("button", { name: /يلا نفهم اللي بيحصل/ }));
    vi.useFakeTimers();
    await nudge();
    await advance(IDLE_MS - 1);
    expect(screen.queryByText("تلميح سريع")).toBeNull();
    await advance(1);
    expect(screen.getByText("تلميح سريع").closest("[role=status]")).toBeInTheDocument();
    await click(screen.getByRole("button", { name: "ذكّرني بعد شوية" }));
    expect(screen.queryByText("تلميح سريع")).toBeNull();
    await advance(SNOOZE_MS);
    expect(screen.getByText("تلميح سريع")).toBeInTheDocument();
    await click(screen.getByRole("button", { name: "إخفاء التلميحات في الدرس ده" }));
    await advance(IDLE_MS * 3);
    expect(screen.queryByText("تلميح سريع")).toBeNull();
  });

  it("never interrupts the free lab (step 3)", async () => {
    await mount();
    await click(screen.getByRole("button", { name: /تجربة حرة/ }));
    vi.useFakeTimers();
    await nudge();
    await advance(IDLE_MS * 3);
    expect(screen.queryByText("تلميح سريع")).toBeNull();
  });
});
