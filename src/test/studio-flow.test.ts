import { describe, expect, it, vi } from "vitest";
import {
  EMPTY_STUDIO,
  addFlashcardPack,
  addMindMapPack,
  generateBlockFlashcards,
  generateBlockMindMap,
  parseStudioRequest,
  type NoorStudioState,
  type StudioIntent,
} from "@/data/lessons/noorStudio";
import { EMPTY_RADAR } from "@/data/lessons/supportRadar";
import type { StudioOutput } from "@/lib/ai-config";
import { requestAiStudio, resetAiBackoff } from "@/lib/ai-tutor-client";
import { runNoorStudio, type StudioStore } from "@/lib/noor-studio-flow";

function fakeStore(initial: Record<string, NoorStudioState> = {}) {
  const slots: Record<string, NoorStudioState> = { ...initial };
  const key = (u: string | null) => u ?? "guest";
  const store: StudioStore = {
    get: (u) => slots[key(u)] ?? EMPTY_STUDIO,
    mutate: (u, fn) => {
      slots[key(u)] = fn(slots[key(u)] ?? EMPTY_STUDIO);
      return true;
    },
  };
  return { store, slots };
}

const intent = (text: string, focus = null as Parameters<typeof parseStudioRequest>[1]) => {
  const i = parseStudioRequest(text, focus);
  if (!i) throw new Error(`not a studio request: ${text}`);
  return i;
};

const base = (store: StudioStore, i: StudioIntent, extra = {}) => ({
  intent: i,
  target: null,
  userId: null,
  lang: "ar" as const,
  accessToken: null,
  radar: EMPTY_RADAR,
  store,
  now: () => 1_700_000_000_000,
  ...extra,
});

describe("Noor Studio flow", () => {
  it("guest: builds locally, saves in the guest slot only, and offers to open it", async () => {
    const { store, slots } = fakeStore();
    const ai = vi.fn(async () => null);
    const r = await runNoorStudio({
      ...base(store, intent("اعملّي خريطة ذهنية للعمود الفقري")),
      ai,
    });
    expect(r.done).toBe(true);
    expect(r.text).toContain("العمود الفقري");
    expect(r.actions).toEqual([
      { kind: "studio", studio: "mindmap", id: slots["guest"]!.mindMapPacks[0]!.id },
    ]);
    expect(r.focus).toEqual({ kind: "mindmap", packId: slots["guest"]!.mindMapPacks[0]!.id });
    expect(Object.keys(slots)).toEqual(["guest"]);
    expect(slots["guest"]!.mindMapPacks[0]!.origin).toBe("local");
  });

  it("signed in: saves into that account, never the guest slot", async () => {
    const { store, slots } = fakeStore();
    await runNoorStudio({
      ...base(store, intent("ولّد بطاقات لنقط ضعفي")),
      userId: "u-1",
      accessToken: "tok",
      ai: async () => null,
    });
    expect(slots["u-1"]!.flashcardPacks).toHaveLength(1);
    expect(slots["guest"]).toBeUndefined();
  });

  it("blank request makes a blank recall grid and says how to use it", async () => {
    const { store, slots } = fakeStore();
    const r = await runNoorStudio({
      ...base(store, intent("اعمل شبكة فاضية عن الأربطة")),
      ai: async () => null,
    });
    expect(slots["guest"]!.mindMapPacks[0]!.kind).toBe("blank");
    expect(r.text).toContain("صحّح الخريطة يا نور");
  });

  it("uses the AI pack when it is valid", async () => {
    const { store, slots } = fakeStore();
    const output: StudioOutput = {
      type: "mindmap",
      title: { ar: "خريطة الذكاء", en: "AI map" },
      nodes: [
        { key: "r", parent: null, title: { ar: "جذر", en: "Root" } },
        { key: "a", parent: "r", title: { ar: "فرع", en: "Branch" } },
      ],
    };
    const ai = vi.fn(async () => output);
    await runNoorStudio({
      ...base(store, intent("اعملي خريطة عن الجمجمة")),
      userId: "u-1",
      accessToken: "tok",
      ai,
    });
    expect(ai).toHaveBeenCalledOnce();
    const pack = slots["u-1"]!.mindMapPacks[0]!;
    expect(pack.origin).toBe("ai");
    expect(pack.title.ar).toBe("خريطة الذكاء");
  });

  it("falls back to the local generator when the AI fails or answers the wrong kind", async () => {
    for (const bad of [
      null,
      {
        type: "flashcards",
        title: { ar: "x", en: "x" },
        cards: [{ front: { ar: "a", en: "a" }, back: { ar: "b", en: "b" } }],
      } satisfies StudioOutput,
    ]) {
      const { store, slots } = fakeStore();
      const r = await runNoorStudio({
        ...base(store, intent("اعملي خريطة عن الجمجمة")),
        userId: "u-1",
        accessToken: "tok",
        ai: async () => bad,
      });
      expect(r.done).toBe(true);
      expect(slots["u-1"]!.mindMapPacks[0]!.origin).toBe("local");
      expect(r.text).not.toMatch(/error|خطأ|provider/i);
    }
  });

  it("edits the pack in focus locally and keeps its id", async () => {
    const pack = generateBlockFlashcards([5, 6], "ar", 1);
    const { store, slots } = fakeStore({ guest: addFlashcardPack(EMPTY_STUDIO, pack) });
    const target = { kind: "flashcards", packId: pack.id } as const;
    const ai = vi.fn(async () => null);
    const r = await runNoorStudio({
      ...base(store, intent("عدّل البطاقات دي وخليها أبسط بالعامية", target), { target }),
      ai,
    });
    expect(r.done).toBe(true);
    expect(ai).not.toHaveBeenCalled();
    expect(slots["guest"]!.flashcardPacks).toHaveLength(1);
    expect(slots["guest"]!.flashcardPacks[0]!.id).toBe(pack.id);
    expect(slots["guest"]!.flashcardPacks[0]!.updatedAt).toBe(1_700_000_000_000);
    expect(r.actions[0]).toEqual({ kind: "studio", studio: "flashcards", id: pack.id });
  });

  it("asks the AI for edits it cannot do locally, and helps when nothing works", async () => {
    const pack = generateBlockMindMap([5], "ar", 1);
    const { store, slots } = fakeStore({ u1: addMindMapPack(EMPTY_STUDIO, pack) });
    const output: StudioOutput = {
      type: "mindmap",
      title: { ar: "معدلة", en: "Edited" },
      nodes: [
        { key: "r", parent: null, title: { ar: "جذر", en: "Root" } },
        { key: "a", parent: "r", title: { ar: "جديد", en: "New" } },
      ],
    };
    const ai = vi.fn(async () => output);
    const target = { kind: "mindmap", packId: pack.id } as const;
    const forced: StudioIntent = {
      action: "edit",
      kind: "mindmap",
      blank: false,
      weak: false,
      request: "غيّر الأسماء للأحسن",
    };
    const done = await runNoorStudio({
      ...base(store, forced, { target }),
      userId: "u1",
      accessToken: "tok",
      ai,
    });
    expect(done.done).toBe(true);
    expect(slots["u1"]!.mindMapPacks[0]!.id).toBe(pack.id);
    expect(slots["u1"]!.mindMapPacks[0]!.title.ar).toBe("معدلة");

    const none = await runNoorStudio({
      ...base(store, forced, { target }),
      userId: "u1",
      accessToken: "tok",
      ai: async () => null,
    });
    expect(none.done).toBe(false);
    expect(none.text).toContain("جرّب");
    expect(none.actions).toEqual([]);
  });

  it("tells the student there is nothing to edit yet, without inventing a pack", async () => {
    const { store, slots } = fakeStore();
    const r = await runNoorStudio({
      ...base(store, intent("عدّل البطاقات دي")),
      ai: async () => null,
    });
    expect(r.done).toBe(false);
    expect(r.actions).toEqual([]);
    expect(slots["guest"]).toBeUndefined();
    expect(r.text).toContain("لسه مفيش");
  });

  it("answers in English when the interface is English", async () => {
    const { store } = fakeStore();
    const r = await runNoorStudio({
      ...base(store, intent("Make me flashcards about ligaments")),
      lang: "en",
      ai: async () => null,
    });
    expect(r.text).toMatch(/flashcards are ready/i);
    expect(r.text).not.toMatch(/[\u0600-\u06FF]/);
  });
});

describe("requestAiStudio (client)", () => {
  const params = { action: "create", kind: "mindmap", lang: "ar", request: "خريطة" } as const;

  it("never throws or asks the server when signed out", async () => {
    resetAiBackoff();
    const ask = vi.fn();
    const reasons: string[] = [];
    expect(
      await requestAiStudio({
        ...params,
        accessToken: null,
        ask,
        onFallback: (r) => reasons.push(r),
      }),
    ).toBeNull();
    expect(ask).not.toHaveBeenCalled();
    expect(reasons).toEqual(["auth"]);
  });

  it("returns the output, trims the request, and backs off after 'disabled'", async () => {
    resetAiBackoff();
    const output: StudioOutput = {
      type: "flashcards",
      title: { ar: "x", en: "x" },
      cards: [{ front: { ar: "a", en: "a" }, back: { ar: "b", en: "b" } }],
    };
    const ask = vi.fn(async () => ({ ok: true as const, output }));
    expect(
      await requestAiStudio({
        ...params,
        accessToken: "t".repeat(30),
        request: "  " + "x".repeat(400),
        ask,
      }),
    ).toEqual(output);
    const sent = (ask.mock.calls[0] as unknown as [{ data: { request: string } }])[0].data;
    expect(sent.request.length).toBe(300);

    const disabled = vi.fn(async () => ({ ok: false as const, reason: "disabled" as const }));
    expect(
      await requestAiStudio({ ...params, accessToken: "t".repeat(30), ask: disabled }),
    ).toBeNull();
    expect(
      await requestAiStudio({ ...params, accessToken: "t".repeat(30), ask: disabled }),
    ).toBeNull();
    expect(disabled).toHaveBeenCalledOnce();
    resetAiBackoff();
  });

  it("turns a thrown error into null", async () => {
    resetAiBackoff();
    const ask = vi.fn(async () => {
      throw new Error("network");
    });
    expect(await requestAiStudio({ ...params, accessToken: "t".repeat(30), ask })).toBeNull();
  });
});
