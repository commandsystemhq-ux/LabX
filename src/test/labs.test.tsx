import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FlashcardsLab } from "@/components/lesson/board/FlashcardsLab";
import { MindMapLab } from "@/components/lesson/board/MindMapLab";
import { NoorProvider } from "@/components/noor/NoorProvider";
import {
  addFlashcardPack,
  addMindMapPack,
  generateBlockFlashcards,
  generateBlockMindMap,
} from "@/data/lessons/noorStudio";
import { getFigure } from "@/data/lessons/supportFigures";
import { supportFlashcards } from "@/data/lessons/supportFlashcards";
import { EMPTY_RADAR } from "@/data/lessons/supportRadar";
import { LanguageProvider } from "@/lib/i18n";
import { studioStore } from "@/lib/use-noor-studio";

const wrap = (ui: ReactNode) => (
  <LanguageProvider>
    <NoorProvider>{ui}</NoorProvider>
  </LanguageProvider>
);

beforeEach(() => {
  window.localStorage.clear();
  studioStore.reset();
});
afterEach(() => cleanup());

describe("FlashcardsLab: every card shows something on its front", () => {
  it("shows a visible question or a sized, light-on-dark figure on all 51 cards", async () => {
    render(wrap(<FlashcardsLab onGoToBlock={() => {}} onClose={() => {}} />));
    const total = supportFlashcards.cards.length;
    expect(total).toBe(51);
    const next = screen.getByRole("button", { name: "التالية" });
    const seen: string[] = [];
    for (let i = 0; i < total; i++) {
      const counter = screen.getByText(`${i + 1} / ${total}`);
      expect(counter.parentElement).toHaveAttribute("dir", "ltr");
      const front = document.querySelector('[aria-hidden="false"] .glass') as HTMLElement;
      expect(front, `card ${i + 1}`).toBeTruthy();
      const svg = front.querySelector("svg[role='img']");
      if (svg) {
        // The figure must get real room (the old bug: it collapsed to 0×0) and use light strokes.
        expect(svg.getAttribute("class"), `card ${i + 1}`).toContain("h-full");
        expect(svg.getAttribute("class")).toContain("w-full");
        expect(svg.getAttribute("viewBox")).toMatch(/^0 0 \d+ \d+$/);
        expect(svg.querySelectorAll("path,rect,ellipse").length).toBeGreaterThan(3);
        expect(svg.innerHTML).toMatch(/#E2E8F0|#e2e8f0/i);
        expect(svg.innerHTML).toMatch(/#38BDF8/i);
        // No answer names on the front: numbers only.
        const names = getFigure("cell-plant").callouts.map((c) => c.name.ar);
        for (const n of names) expect(svg.textContent ?? "").not.toContain(n);
      }
      expect((front.textContent ?? "").trim().length, `card ${i + 1} is empty`).toBeGreaterThan(0);
      seen.push(svg ? "figure" : "text");
      await act(async () => {
        fireEvent.click(next);
      });
    }
    expect(seen.slice(0, 45).every((s) => s === "text")).toBe(true);
    expect(seen.slice(45)).toEqual(Array(6).fill("figure"));
  });

  it("flips without mirroring: front hides on the back face, 'Explain with Noor' is on the back", async () => {
    render(wrap(<FlashcardsLab onGoToBlock={() => {}} onClose={() => {}} />));
    const faces = () =>
      [...document.querySelectorAll<HTMLElement>("div.absolute.inset-0")].filter(
        (e) => e.style.backfaceVisibility === "hidden",
      );
    expect(faces()).toHaveLength(2);
    for (const f of faces()) {
      expect(f.style.transformStyle).toBe("preserve-3d");
      expect(f.style.backfaceVisibility).toBe("hidden");
    }
    expect(faces()[0]!.style.transform).toBe("rotateY(0deg)");
    expect(faces()[1]!.style.transform).toBe("rotateY(-180deg)");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /عرض الإجابة/ }));
    });
    expect(faces()[0]!.style.transform).toBe("rotateY(180deg)");
    expect(faces()[1]!.style.transform).toBe("rotateY(0deg)");
    expect(screen.getByRole("button", { name: /اشرح لي يا نور/ })).toBeInTheDocument();
  });

  it("lists Noor's packs under «✨ إبداعات نور لك», lets the student rate, and deletes with confirmation", async () => {
    const pack = generateBlockFlashcards([5], "ar", 1);
    studioStore.mutate(null, (s) => addFlashcardPack(s, pack));
    render(
      wrap(<FlashcardsLab onGoToBlock={() => {}} onClose={() => {}} initialPackId={pack.id} />),
    );
    expect(screen.getByText(`1 / ${pack.cards.length}`)).toBeInTheDocument();
    expect(screen.getByText(pack.cards[0]!.front.ar)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /عدّل مع نور/ })).toBeInTheDocument();

    const del = screen.getByRole("button", { name: /حذف الرزمة/ });
    await act(async () => {
      fireEvent.click(del);
    });
    expect(studioStore.get(null).flashcardPacks).toHaveLength(1);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /تأكيد الحذف/ }));
    });
    expect(studioStore.get(null).flashcardPacks).toHaveLength(0);
  });

  it("shows how to ask Noor when there are no creations yet", async () => {
    render(wrap(<FlashcardsLab onGoToBlock={() => {}} onClose={() => {}} />));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /إبداعات نور لك/ }));
    });
    expect(screen.getByText(/ولّد بطاقات لنقط ضعفي/)).toBeInTheDocument();
  });
});

describe("MindMapLab", () => {
  const props = { radar: EMPTY_RADAR, onGoToBlock: vi.fn(), onClose: vi.fn() };

  it("draws a horizontal node tree with curved edges and floating controls — no list or accordion", () => {
    const { container } = render(wrap(<MindMapLab {...props} />));
    expect(container.querySelector("[data-node='root']")).toBeTruthy();
    expect(container.querySelector("[data-node='plant']")).toBeTruthy();
    expect(container.querySelector("[data-node='human']")).toBeTruthy();
    expect(container.querySelector("[data-node='spine']")).toBeNull();
    const paths = container.querySelectorAll("svg.overflow-visible path");
    // One curve per parent→child link.
    expect(paths.length).toBe(container.querySelectorAll("[data-node]").length - 1);
    expect(paths.length).toBeGreaterThanOrEqual(2);
    expect(paths[0]!.getAttribute("d")).toMatch(/^M [\d.-]+ [\d.-]+ C /);
    expect(container.querySelector("ul, ol, details")).toBeNull();
    for (const name of [/تكبير/, /تصغير/, /ملاءمة الشاشة/, /توسيع الكل/]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    // Arabic: the root sits on the right of its children.
    const x = (id: string) =>
      Number.parseFloat((container.querySelector(`[data-node='${id}']`) as HTMLElement).style.left);
    expect(x("root")).toBeGreaterThan(x("plant"));
  });

  it("expands/collapses a branch from its round button and all branches at once", async () => {
    const { container } = render(wrap(<MindMapLab {...props} />));
    const plantToggle = screen.getByRole("button", {
      name: /افتح الفروع: النبات|اطوِ الفروع: النبات/,
    });
    expect(plantToggle).toHaveAttribute("aria-expanded", "true");
    expect(container.querySelector("[data-node='plant-cell']")).toBeTruthy();
    await act(async () => {
      fireEvent.click(plantToggle);
    });
    expect(container.querySelector("[data-node='plant-cell']")).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "توسيع الكل" }));
    });
    expect(container.querySelector("[data-node='knee-ligaments']")).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "طي الكل" }));
    });
    expect(container.querySelector("[data-node='plant']")).toBeTruthy();
    expect(container.querySelector("[data-node='plant-cell']")).toBeNull();
  });

  it("search reveals a hidden node and highlights it", async () => {
    const { container } = render(wrap(<MindMapLab {...props} />));
    expect(container.querySelector("[data-node='knee-ligaments']")).toBeNull();
    await act(async () => {
      fireEvent.change(screen.getByRole("textbox", { name: /ابحث/ }), {
        target: { value: "أربطة الركبة" },
      });
    });
    const hit = container.querySelector("[data-node='knee-ligaments']") as HTMLElement;
    expect(hit).toBeTruthy();
    expect(hit.className).toContain("ring-amber");
  });

  it("clicking a node shows its summary card with a link to the board", async () => {
    const onGoToBlock = vi.fn();
    const onClose = vi.fn();
    const { container } = render(
      wrap(<MindMapLab {...props} onGoToBlock={onGoToBlock} onClose={onClose} />),
    );
    await act(async () => {
      fireEvent.click(container.querySelector("[data-node='plant-cell']") as HTMLElement);
    });
    const card = screen.getByRole("heading", { name: "الخلية النباتية" }).parentElement!
      .parentElement!;
    expect(within(card).getByText(/وحدة البناء/)).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(within(card).getByRole("button", { name: /انتقل للجزئية في السبورة/ }));
    });
    expect(onGoToBlock).toHaveBeenCalledWith(1);
    expect(onClose).toHaveBeenCalled();
  });

  it("blank recall mode: empty slots → pick or type → Noor corrects green/red and reports to the radar", async () => {
    const onResult = vi.fn();
    const { container } = render(wrap(<MindMapLab {...props} onResult={onResult} />));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /وضع الاختبار/ }));
    });
    const slots = screen.getAllByRole("button", { name: "[ ؟ — اضغط للملء ]" });
    expect(slots.length).toBeGreaterThan(5);
    // The structure (root + main branches) stays visible, the sub-branches are empty.
    expect(container.querySelector("[data-node='root']")?.textContent).toContain("الدعامة");
    expect(container.querySelector("[data-node='plant-cell']")?.textContent).not.toContain(
      "الخلية النباتية",
    );
    // Correct answer typed by hand.
    await act(async () => {
      fireEvent.click(container.querySelector("[data-node='plant-cell']") as HTMLElement);
    });
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getAllByRole("button").length).toBeGreaterThan(3);
    await act(async () => {
      fireEvent.change(within(dialog).getByRole("textbox"), {
        target: { value: "الخلية النباتية" },
      });
      fireEvent.click(within(dialog).getByRole("button", { name: "تأكيد" }));
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(container.querySelector("[data-node='plant-cell']")?.textContent).toContain(
      "الخلية النباتية",
    );
    // Wrong answer picked from the smart options (any option that is not the right one).
    await act(async () => {
      fireEvent.click(container.querySelector("[data-node='simple-tissues']") as HTMLElement);
    });
    const wrongOption = within(screen.getByRole("dialog"))
      .getAllByRole("button")
      .find(
        (b) =>
          b.textContent &&
          !["الأنسجة البسيطة"].includes(b.textContent) &&
          b.className.includes("rounded-xl") &&
          b.textContent.length > 3 &&
          b.getAttribute("type") === "button" &&
          !b.getAttribute("aria-label"),
      )!;
    expect(wrongOption).toBeTruthy();
    await act(async () => {
      fireEvent.click(wrongOption);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /صحّح الخريطة يا نور/ }));
    });
    expect(container.querySelector("[data-node='plant-cell']")?.className).toContain("emerald");
    const wrong = container.querySelector("[data-node='simple-tissues']") as HTMLElement;
    expect(wrong.className).toContain("red");
    expect(wrong.textContent).toContain("الأنسجة البسيطة");
    expect(screen.getByRole("status").textContent).toMatch(/✅/);
    expect(onResult).toHaveBeenCalledWith(1, "mm-plant-cell", true);
    expect(onResult).toHaveBeenCalledWith(1, "mm-simple-tissues", false);
    // Unanswered slots count as wrong.
    expect(onResult.mock.calls.filter((c) => c[2] === false).length).toBeGreaterThan(5);
    // Tapping a wrong node explains it.
    await act(async () => {
      fireEvent.click(wrong);
    });
    expect(screen.getByText(/الإجابة الصحيحة/)).toBeInTheDocument();
    expect(screen.getByText(/نور بيشرح/)).toBeInTheDocument();
    // Best score is saved.
    expect(window.localStorage.getItem("labx.mindmap.best.v1:guest")).toContain("base");
    // Retry empties the grid again.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /جرّب تاني/ }));
    });
    expect(container.querySelector("[data-node='plant-cell']")?.textContent).toContain(
      "اضغط للملء",
    );
  });

  it("opens a blank pack made by Noor straight in recall mode, and lists Noor's maps", async () => {
    const pack = generateBlockMindMap([5], "ar", 1, "blank");
    studioStore.mutate(null, (s) => addMindMapPack(s, pack));
    const { container } = render(wrap(<MindMapLab {...props} initialPackId={pack.id} />));
    expect(screen.getByRole("button", { name: /صحّح الخريطة يا نور/ })).toBeInTheDocument();
    expect(container.querySelector("[data-node]")).toBeTruthy();
    expect(screen.getByRole("button", { name: new RegExp(pack.title.ar) })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /عدّل مع نور/ })).toBeInTheDocument();
    // Delete asks twice.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^حذف$|حذف/ }));
    });
    expect(studioStore.get(null).mindMapPacks).toHaveLength(1);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /تأكيد الحذف/ }));
    });
    expect(studioStore.get(null).mindMapPacks).toHaveLength(0);
  });

  it("English: LTR layout, English slot text", async () => {
    window.localStorage.setItem("labx.lang", "en");
    const { container } = render(wrap(<MindMapLab {...props} />));
    await act(async () => {});
    const x = (id: string) =>
      Number.parseFloat((container.querySelector(`[data-node='${id}']`) as HTMLElement).style.left);
    expect(document.documentElement.lang).toBe("en");
    expect(x("root")).toBeLessThan(x("plant"));
    expect(screen.getByRole("button", { name: /Test mode/ })).toBeInTheDocument();
  });
});
