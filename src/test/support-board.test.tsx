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
import { SupportBoard } from "@/components/lesson/board/SupportBoard";
import { NoorAssistant } from "@/components/noor/NoorAssistant";
import { NoorProvider, useNoorSupport } from "@/components/noor/NoorProvider";
import { getBlock } from "@/data/lessons/supportLesson";
import { SUPPORT_LESSON_ID } from "@/data/lessons/supportTypes";
import { findLesson } from "@/data/mockCurriculum";
import { LanguageProvider } from "@/lib/i18n";
import { progressStore } from "@/lib/progress";
import { studioStore } from "@/lib/use-noor-studio";

function Probe() {
  const s = useNoorSupport()?.ctx;
  return (
    <output data-testid="noor-support">
      {JSON.stringify({
        block: s?.block,
        phase: s?.phase,
        mistakes: s?.mistakes.length,
        actions: s?.actions.length,
      })}
    </output>
  );
}
const ctx = () =>
  JSON.parse(screen.getByTestId("noor-support").textContent ?? "{}") as {
    block?: number;
    phase?: string;
    mistakes?: number;
    actions?: number;
  };

async function mount(search: { duel?: string; vs?: string } = {}) {
  const lookup = findLesson(SUPPORT_LESSON_ID);
  const root = createRootRoute({
    component: () => (
      <LanguageProvider>
        <NoorProvider>
          <Outlet />
          <NoorAssistant />
          <Probe />
        </NoorProvider>
      </LanguageProvider>
    ),
  });
  const lessonRoute = createRoute({
    getParentRoute: () => root,
    path: "/lesson",
    component: () => (
      <div data-subject="biology">
        <SupportBoard lookup={lookup} {...search} />
      </div>
    ),
  });
  const router = createRouter({
    routeTree: root.addChildren([lessonRoute]),
    history: createMemoryHistory({ initialEntries: ["/lesson"] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

beforeEach(() => {
  window.localStorage.clear();
  progressStore.reset();
  studioStore.reset();
  // jsdom has no WebGL: the stage must fall back to the 2D exam figure and keep working.
  vi.stubGlobal("requestAnimationFrame", () => 0);
  vi.stubGlobal("cancelAnimationFrame", () => {});
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("live board lesson", () => {
  it("walks hook → board → lab → back to the question for a block", async () => {
    await mount();
    const b1 = getBlock(1)!;
    expect(
      screen.getByText(new RegExp(b1.hookQuestion.question.ar.slice(0, 20))),
    ).toBeInTheDocument();
    expect(ctx()).toMatchObject({ block: 1, phase: "hook" });

    // The answer is locked in before the explanation.
    fireEvent.click(screen.getByRole("button", { name: b1.hookQuestion.options[0]!.ar }));
    fireEvent.click(await screen.findByRole("button", { name: /يلا للسبورة/ }));
    expect(ctx().phase).toBe("board");
    expect(await screen.findByRole("tab", { name: /تبسيط/ })).toBeInTheDocument();

    // Blueprint toggle: the same scene as the 2D exam figure, with and without its data.
    fireEvent.click(screen.getByRole("button", { name: "2D شكل الامتحان" }));
    expect(
      screen.getByRole("img", {
        name: b1.labConfig.views[0]!.label.ar === "" ? "" : /الخلية النباتية/,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("جدار خلوي").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /إخفاء البيانات/ }));
    expect(screen.queryByText("جدار خلوي")).not.toBeInTheDocument();

    // The textbook tab shows the report word for word.
    fireEvent.click(screen.getByRole("tab", { name: /نص الكتاب/ }));
    expect(screen.getByText(/يحتاج الكائن الحي إلى وسيلة يطلق عليها الدعامة/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /للشغل العملي/ }));
    expect(ctx().phase).toBe("lab");
    fireEvent.click(screen.getByRole("button", { name: /نرجع للسؤال ✅/ }));
    expect(ctx().phase).toBe("quiz");
    expect(screen.getByText(b1.hookQuestion.reveal.ar)).toBeInTheDocument();
  });

  it("runs the exam trap and reveals the textbook truth", async () => {
    await mount();
    const b1 = getBlock(1)!;
    fireEvent.click(screen.getByRole("button", { name: b1.hookQuestion.options[0]!.ar }));
    fireEvent.click(await screen.findByRole("button", { name: /يلا للسبورة/ }));
    fireEvent.click(await screen.findByRole("tab", { name: /مصيدة الامتحان/ }));
    for (const p of b1.examTrap.probes) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(p.label.ar.slice(0, 12)) }));
      await act(async () => {
        await new Promise((r) => setTimeout(r, 520));
      });
    }
    expect(screen.getByText(b1.examTrap.truth.ar)).toBeInTheDocument();
  });

  it("tells Noor about a wrong numeric answer so it can correct it", async () => {
    await mount();
    const b3 = getBlock(3)!;
    fireEvent.click(screen.getByRole("button", { name: /^3$/ }));
    fireEvent.click(await screen.findByRole("button", { name: b3.hookQuestion.options[0]!.ar }));
    fireEvent.click(await screen.findByRole("button", { name: /يلا للسبورة/ }));
    fireEvent.click(await screen.findByRole("button", { name: /للشغل العملي/ }));
    const numeric = b3.labConfig.tasks.find((t) => t.kind === "numeric")!;
    const box = screen.getAllByRole("textbox", { name: "اكتب الرقم" })[0]!;
    fireEvent.change(box, { target: { value: "1" } });
    const row = box.closest("form")!;
    fireEvent.click(within(row).getByRole("button", { name: "تحقق" }));
    expect(numeric.kind).toBe("numeric");
    expect(ctx().mistakes).toBe(1);
    expect(ctx().actions).toBeGreaterThan(0);
  });

  it("answers a curriculum question locally from the block text", async () => {
    await mount();
    fireEvent.click(screen.getByRole("button", { name: /^8$/ }));
    fireEvent.click(
      await screen.findByRole("button", { name: getBlock(8)!.hookQuestion.options[0]!.ar }),
    );
    const input = screen.getByPlaceholderText(/اسأل نور/);
    fireEvent.change(input, { target: { value: "الضلع العائم بيتصل بالقص؟" } });
    fireEvent.submit(input.closest("form")!);
    expect(
      await screen.findByText(/لا يتصلان بالقص/, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  it("opens the notebook and keeps a note (saved in localStorage)", async () => {
    await mount();
    fireEvent.click(screen.getByRole("button", { name: /كراسة المعمل/ }));
    fireEvent.change(screen.getByLabelText("عنوان الملاحظة"), { target: { value: "ملاحظتي" } });
    fireEvent.click(screen.getByRole("button", { name: /أضف ملاحظة/ }));
    expect(await screen.findByText("ملاحظتي")).toBeInTheDocument();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 650));
    });
    expect(window.localStorage.getItem("labx.notebook.v1")).toContain("ملاحظتي");
  });

  it("shows the weakness radar, the tests list and the duel menu", async () => {
    await mount();
    fireEvent.click(screen.getByRole("button", { name: "اختبر نفسك" }));
    expect(screen.getByText(/اختبر نفسك \(6\)/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "طبيب نقط الضعف" }));
    expect(screen.getByText(/لسه مفيش بيانات/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "تحدي 1 ضد 1" }));
    expect(screen.getByRole("button", { name: /ابدأ تحدي جديد/ })).toBeInTheDocument();
  });

  it("opens straight into the duel from a shared link and shows the challenger's score", async () => {
    await mount({ duel: "abcd1234", vs: "1100-30000" });
    expect(screen.getByRole("button", { name: /انضم لتحدي صاحبك/ })).toBeInTheDocument();
    expect(screen.getByText(/1100/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /انضم لتحدي صاحبك/ }));
    expect(await screen.findByText(/1\/8|1 \/ 8/)).toBeInTheDocument();
  });
});

describe("Noor Studio from the chat", () => {
  const openNoor = async () => {
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "نور" }));
    });
  };
  const say = async (text: string) => {
    const input = screen.getByPlaceholderText(/اسأل نور/);
    fireEvent.change(input, { target: { value: text } });
    await act(async () => {
      fireEvent.submit(input.closest("form")!);
    });
  };

  it("builds a mind map from a message, saves it for the account and opens it in the Mind Map Lab", async () => {
    await mount();
    await openNoor();
    await say("اعملّي خريطة ذهنية للعمود الفقري");
    expect(
      await screen.findByText(/الخريطة جاهزة/, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    // Saved in this (guest) account's own slot.
    expect(window.localStorage.getItem("labx.noor-studio.guest.v1")).toContain("العمود الفقري");
    expect(window.localStorage.getItem("labx.noor-studio.u-1.v1")).toBeNull();

    fireEvent.click(await screen.findByRole("button", { name: /افتح الخريطة/ }));
    expect(await screen.findByRole("heading", { name: /الخريطة الذهنية/ })).toBeInTheDocument();
    const mine = screen.getByRole("button", { name: /خريطة: العمود الفقري/ });
    expect(mine).toHaveAttribute("aria-pressed", "true");
    expect(document.querySelector("[data-node]")).toBeTruthy();
  });

  it("a blank-grid request opens the Lab straight in recall mode", async () => {
    await mount();
    await openNoor();
    await say("اعمل شبكة فاضية عن الأربطة");
    fireEvent.click(await screen.findByRole("button", { name: /افتح الخريطة/ }, { timeout: 3000 }));
    expect(await screen.findByRole("button", { name: /صحّح الخريطة يا نور/ })).toBeInTheDocument();
  });

  it("the Studio bar makes flashcards for weak spots and opens them under «إبداعات نور لك»", async () => {
    await mount();
    await openNoor();
    expect(screen.getByText("🎨 استوديو نور")).toBeInTheDocument();
    for (const name of [
      /ولّد خريطة ذهنية مخصصة/,
      /اعمل شبكة فاضية للتسميع/,
      /ولّد بطاقات لنقط ضعفي/,
      /عدّل الرزمة\/الخريطة الحالية/,
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    // Nothing to edit yet.
    expect(screen.getByRole("button", { name: /عدّل الرزمة\/الخريطة الحالية/ })).toBeDisabled();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /ولّد بطاقات لنقط ضعفي/ }));
    });
    fireEvent.click(
      await screen.findByRole("button", { name: /افتح البطاقات/ }, { timeout: 3000 }),
    );
    expect(await screen.findByRole("heading", { name: /البطاقات الذكية/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /إبداعات نور لك/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // Now the edit button is available and edits the pack that was just made.
    await openNoor();
    expect(screen.getByRole("button", { name: /عدّل الرزمة\/الخريطة الحالية/ })).toBeEnabled();
  });

  it("edits the last pack from chat («خليها أبسط بالعامية») without leaving a provider error", async () => {
    await mount();
    await openNoor();
    await say("اعملي بطاقات عن العمود الفقري");
    await screen.findByRole("button", { name: /افتح البطاقات/ }, { timeout: 3000 });
    const before = window.localStorage.getItem("labx.noor-studio.guest.v1");
    await say("خليها أبسط بالعامية");
    expect(await screen.findByText(/تم التعديل/, undefined, { timeout: 3000 })).toBeInTheDocument();
    const after = window.localStorage.getItem("labx.noor-studio.guest.v1");
    expect(after).not.toBe(before);
    expect(JSON.parse(after!).flashcardPacks).toHaveLength(1);
  });

  it("does not hijack ordinary questions", async () => {
    await mount();
    await openNoor();
    await say("إيه هي الخلية النباتية؟");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 900));
    });
    expect(screen.queryByText(/جاهزة/)).toBeNull();
    expect(window.localStorage.getItem("labx.noor-studio.guest.v1")).toBeNull();
  });
});
