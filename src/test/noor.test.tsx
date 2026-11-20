import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NoorAssistant } from "@/components/noor/NoorAssistant";
import { NoorProvider } from "@/components/noor/NoorProvider";
import {
  actionLabel,
  buildPlatformReply,
  describePage,
  detectPlatformIntent,
  findLessonByText,
  gradeFromText,
  lessonCatalog,
  pageFromPath,
  parseActionTags,
  recommendLesson,
  subjectFromText,
  type PlatformContext,
  type PlatformStats,
} from "@/data/noor";
import { allLessons, lessonExists } from "@/data/mockCurriculum";
import { LanguageProvider } from "@/lib/i18n";
import { resetAiBackoff } from "@/lib/ai-tutor-client";
import { progressStore } from "@/lib/progress";

const stats: PlatformStats = { xp: 250, level: 2, streak: 3, mastered: 1, started: 2 };
const empty = { lessons: {} };
const pc = (patch: Partial<PlatformContext> = {}): PlatformContext => ({
  page: "home",
  lang: "ar",
  signedIn: false,
  ...patch,
});

describe("Noor intents (Arabic + English)", () => {
  it.each([
    ["السلام عليكم", "greet"],
    ["اهلا", "greet"],
    ["hello", "greet"],
    ["انت عامل ايه", "smalltalk"],
    ["how are you", "smalltalk"],
    ["انت مين", "identity"],
    ["who are you", "identity"],
    ["شكرا", "thanks"],
    ["اقترح لي درس", "recommend"],
    ["what should I study", "recommend"],
    ["تقدمي", "progress"],
    ["عايز اسجل دخول", "signin"],
    ["create an account", "signin"],
    ["افتح درس قانون أوم", "navigate"],
    ["take me to the dashboard", "navigate"],
    ["افتح الرئيسية", "navigate"],
    ["تقدر تعمل ايه", "help"],
  ])("%s → %s", (text, intent) => {
    expect(detectPlatformIntent(text)).toBe(intent);
  });

  it("leaves physics questions to the tutor, even when they contain 'open'", () => {
    for (const q of [
      "what happens if I open the circuit",
      "ليه التيار قل لما زودت المقاومة؟",
      "why did the current drop",
      "افتح الدائرة هيحصل ايه",
    ]) {
      expect(detectPlatformIntent(q), q).toBeNull();
    }
  });

  it("understands subjects, grades and lesson names", () => {
    expect(subjectFromText("عايز كيمياء")).toBe("chemistry");
    expect(subjectFromText("open biology")).toBe("biology");
    expect(gradeFromText("الصف التالت الثانوي")).toBe("g12");
    expect(gradeFromText("اولى ثانوي")).toBe("g10");
    expect(findLessonByText("افتح درس قانون أوم")?.lesson.id).toBe("g12-physics-u1-l2");
    expect(findLessonByText("open the Ohm's law lesson")?.lesson.id).toBe("g12-physics-u1-l2");
    expect(findLessonByText("xyzzy")).toBeNull();
  });
});

describe("Noor replies", () => {
  it("answers greetings and small talk instead of repeating a canned reply", () => {
    const a = buildPlatformReply("greet", "السلام عليكم", pc(), stats, empty);
    const b = buildPlatformReply("smalltalk", "انت عامل ايه", pc(), stats, empty);
    expect(a.text).toContain("وعليكم السلام");
    expect(a.text).toContain("نور");
    expect(b.text).toContain("الحمد لله");
    expect(a.text).not.toBe(b.text);
    expect(buildPlatformReply("greet", "hello", pc({ lang: "en" }), stats, empty).text).toContain(
      "Noor",
    );
  });

  it("knows where the student is", () => {
    expect(describePage(pc({ page: "dashboard", grade: "g12", subject: "physics" }))).toContain(
      "الفيزياء",
    );
    expect(describePage(pc({ page: "lesson", lang: "en", lessonId: "g12-physics-u1-l2" }))).toBe(
      "Lesson: Ohm's law",
    );
    expect(pageFromPath("/")).toBe("home");
    expect(pageFromPath("/lesson")).toBe("lesson");
    expect(pageFromPath("/nope")).toBe("other");
  });

  it("navigates only to real destinations, as buttons", () => {
    const r = buildPlatformReply("navigate", "افتح درس قانون أوم", pc(), stats, empty);
    expect(r.actions).toEqual([{ kind: "lesson", id: "g12-physics-u1-l2" }]);
    const d = buildPlatformReply("navigate", "خدني لمادة الكيمياء", pc(), stats, empty);
    expect(d.actions).toEqual([{ kind: "dashboard", grade: undefined, subject: "chemistry" }]);
    const next = buildPlatformReply(
      "navigate",
      "الدرس التالي",
      pc({ page: "lesson", lessonId: "g12-physics-u1-l1" }),
      stats,
      empty,
    );
    expect(next.actions).toEqual([{ kind: "lesson", id: "g12-physics-u1-l2" }]);
    for (const a of [...r.actions, ...d.actions, ...next.actions]) {
      expect(actionLabel(a, "ar").length).toBeGreaterThan(0);
      expect(actionLabel(a, "en").length).toBeGreaterThan(0);
    }
  });

  it("recommends unfinished work first, then something new, and reports progress", () => {
    const progress = {
      lessons: {
        "g12-physics-u1-l1": { step: 4, mastery: 100 },
        "g12-physics-u1-l2": { step: 3, mastery: 40 },
      },
    };
    expect(recommendLesson(progress, "g12").lesson.id).toBe("g12-physics-u1-l2");
    expect(recommendLesson(empty, "g12", "chemistry").subject.id).toBe("chemistry");
    const p = buildPlatformReply("progress", "تقدمي", pc(), stats, empty);
    expect(p.text).toContain("250");
    expect(p.actions[0]).toEqual({ kind: "auth", mode: "signin" });
    expect(
      buildPlatformReply("signin", "x", pc({ signedIn: true }), stats, empty).actions,
    ).not.toEqual(expect.arrayContaining([{ kind: "auth", mode: "signup" }]));
  });
});

describe("action tags from the AI (untrusted)", () => {
  it("keeps valid ones, validates ids against the curriculum, strips every tag", () => {
    const r = parseActionTags(
      "جرّب ده\n[[go:lesson:g12-physics-u1-l2]]\n[[go:dashboard:g12:physics]] [[go:home]] [[go:signin]]",
    );
    expect(r.text).toBe("جرّب ده");
    expect(r.actions).toHaveLength(3); // capped
    expect(r.actions[0]).toEqual({ kind: "lesson", id: "g12-physics-u1-l2" });
    expect(r.actions[1]).toEqual({ kind: "dashboard", grade: "g12", subject: "physics" });
  });

  it("drops invented lessons, bad grades, external urls and duplicates", () => {
    const r = parseActionTags(
      "x [[go:lesson:made-up-id]] [[go:dashboard:g99]] [[go:https://evil.com]] [[go:lesson:g12-physics-u1-l2:extra]] [[go:home]][[go:home]] [[go:javascript:alert(1)]]",
    );
    expect(r.actions).toEqual([{ kind: "home" }]);
    expect(r.text).toBe("x");
    expect(r.text).not.toContain("[[");
  });

  it("only offers lessons that exist, and the AI catalog lists one grade", () => {
    const lines = lessonCatalog("g12");
    expect(lines.length).toBeGreaterThan(10);
    for (const line of lines) expect(lessonExists(line.split(" | ")[0]!)).toBe(true);
    expect(lines.some((l) => l.startsWith("g10-"))).toBe(false);
    expect(allLessons().length).toBeGreaterThan(lines.length);
  });
});

describe("Noor assistant UI", () => {
  async function mount(path: string) {
    const root = createRootRoute({
      component: () => (
        <LanguageProvider>
          <NoorProvider>
            <Outlet />
            <NoorAssistant />
          </NoorProvider>
        </LanguageProvider>
      ),
    });
    const page = (p: string) =>
      createRoute({ getParentRoute: () => root, path: p, component: () => <h1>{p}</h1> });
    const router = createRouter({
      routeTree: root.addChildren([
        page("/"),
        createRoute({
          getParentRoute: () => root,
          path: "/dashboard",
          validateSearch: (s: Record<string, unknown>) => ({
            grade: typeof s["grade"] === "string" ? s["grade"] : undefined,
            subject: typeof s["subject"] === "string" ? s["subject"] : undefined,
          }),
          component: () => <h1>dashboard</h1>,
        }),
        createRoute({
          getParentRoute: () => root,
          path: "/lesson",
          validateSearch: (s: Record<string, unknown>) => ({
            id: typeof s["id"] === "string" ? s["id"] : undefined,
          }),
          component: () => <h1>lesson</h1>,
        }),
      ]),
      history: createMemoryHistory({ initialEntries: [path] }),
    });
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
    return router;
  }

  beforeEach(() => {
    resetAiBackoff();
    window.localStorage.clear();
    progressStore.reset();
  });
  afterEach(() => cleanup());

  const say = async (text: string) => {
    const box = screen.getByPlaceholderText("اسأل نور أي حاجة...");
    await act(async () => {
      fireEvent.change(box, { target: { value: text } });
    });
    await act(async () => {
      fireEvent.submit(box.closest("form")!);
    });
  };

  it("is available outside a lesson, named Noor, and knows the page", async () => {
    await mount("/");
    expect(screen.getAllByRole("button", { name: "نور" }).length).toBeGreaterThan(0);
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "نور" })[0]!);
    });
    const dialog = screen.getByLabelText("نور");
    expect(within(dialog).getByText(/الصفحة الرئيسية/)).toBeInTheDocument();
    expect(within(dialog).getByText(/أنا نور/)).toBeInTheDocument();
  });

  it("answers a greeting and small talk differently (guest, no AI call)", async () => {
    await mount("/");
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "نور" })[0]!);
    });
    vi.useFakeTimers();
    await say("السلام عليكم");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    await say("انت عامل ايه");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    vi.useRealTimers();
    expect(screen.getByText(/وعليكم السلام/)).toBeInTheDocument();
    expect(screen.getByText(/الحمد لله تمام/)).toBeInTheDocument();
  });

  it("opens a lesson only when the student clicks the validated button", async () => {
    const router = await mount("/");
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "نور" })[0]!);
    });
    vi.useFakeTimers();
    await say("افتح درس قانون أوم");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    vi.useRealTimers();
    expect(router.state.location.pathname).toBe("/"); // nothing happened by itself
    const button = screen.getByRole("button", { name: /قانون أوم/ });
    await act(async () => {
      fireEvent.click(button);
    });
    await vi.waitFor(() => expect(router.state.location.pathname).toBe("/lesson"));
    expect(router.state.location.search).toMatchObject({ id: "g12-physics-u1-l2" });
  });
});
