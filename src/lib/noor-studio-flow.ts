import {
  addFlashcardPack,
  addMindMapPack,
  blocksForIntent,
  buildLocalStudio,
  compactPack,
  editFlashcardPack,
  editMindMapPack,
  packFromAiOutput,
  updateFlashcardPack,
  updateMindMapPack,
  type FlashcardPack,
  type MindMapPack,
  type NoorStudioState,
  type StudioBuild,
  type StudioFocus,
  type StudioIntent,
  type StudioKind,
  type StudioLang,
} from "@/data/lessons/noorStudio";
import type { RadarState } from "@/data/lessons/supportRadar";
import type { NoorAction } from "@/data/noor";
import type { StudioOutput } from "./ai-config";
import { requestAiStudio, type AiStudioParams } from "./ai-tutor-client";

/**
 * One Noor Studio request from the chat, end to end: understand → (AI | local) → validate → save in
 * the student's own slot → a reply with an «open it» action. Guests and any AI failure fall back to
 * the local generator, so the student always gets a result and never a provider error.
 */

export interface StudioStore {
  get(userId: string | null): NoorStudioState;
  mutate(userId: string | null, fn: (s: NoorStudioState) => NoorStudioState): boolean;
}

export interface StudioFlowParams {
  intent: StudioIntent;
  /** The pack «عدّل دي» refers to (open in a Lab / last created). */
  target: StudioFocus | null;
  userId: string | null;
  lang: StudioLang;
  accessToken: string | null;
  radar: RadarState;
  store: StudioStore;
  now?: () => number;
  /** Injected in tests. */
  ai?: (p: AiStudioParams) => Promise<StudioOutput | null>;
}

export interface StudioFlowResult {
  text: string;
  actions: NoorAction[];
  focus: StudioFocus | null;
  /** Something was created or changed. */
  done: boolean;
}

const KIND_NOUN: Record<StudioKind, { ar: string; en: string }> = {
  mindmap: { ar: "خريطة", en: "map" },
  flashcards: { ar: "رزمة بطاقات", en: "flashcards pack" },
};

export const studioHelpText = (lang: StudioLang): string =>
  lang === "ar"
    ? "مش متأكد فهمت التعديل المطلوب 🤔 جرّب مثلًا: «خليها أبسط بالعامية» أو «اختصر الإجابات» أو «زوّد بطاقات» أو «سميها …»."
    : "I'm not sure what to change 🤔 Try: “make it simpler”, “shorten the answers”, “add more cards” or “rename it to …”.";

function pickPack(
  kind: StudioKind,
  target: StudioFocus | null,
  state: NoorStudioState,
): FlashcardPack | MindMapPack | null {
  const list = kind === "mindmap" ? state.mindMapPacks : state.flashcardPacks;
  const byId = target && target.kind === kind ? list.find((p) => p.id === target.packId) : null;
  return byId ?? list[list.length - 1] ?? null;
}

function savedWhere(lang: StudioLang, guest: boolean): string {
  if (lang === "ar") {
    return guest ? "اتحفظت على الجهاز ده (سجّل دخول عشان تتربط بحسابك)" : "اتحفظت في حسابك";
  }
  return guest
    ? "Saved on this device (sign in to tie it to your account)"
    : "Saved to your account";
}

function createdText(build: StudioBuild, lang: StudioLang, guest: boolean): string {
  const where = savedWhere(lang, guest);
  if (build.mindMap) {
    const m = build.mindMap;
    const blank = m.kind === "blank";
    return lang === "ar"
      ? `## ✨ ${blank ? "شبكة التسميع" : "الخريطة"} جاهزة\nعملت لك **${m.title.ar}** — ${m.nodes.length} عقدة.\n${blank ? "املا الخانات الفاضية بنفسك وبعدين اضغط «صحّح الخريطة يا نور» 🧩" : "مليانة بالأرقام والتفاصيل من الكتاب 🧠"}\n${where}، وتلاقيها في «✨ إبداعات نور لك».`
      : `## ✨ Your ${blank ? "recall grid" : "mind map"} is ready\nI made **${m.title.en}** — ${m.nodes.length} nodes.\n${blank ? "Fill the empty slots yourself, then press “Check the map, Noor” 🧩" : "Full of numbers and details from the book 🧠"}\n${where} — find it under “✨ Noor's creations for you”.`;
  }
  const f = build.flashcards!;
  return lang === "ar"
    ? `## ✨ البطاقات جاهزة\nجهّزت لك **${f.title.ar}** — ${f.cards.length} بطاقة.\n${where}، وتلاقيها في «✨ إبداعات نور لك».`
    : `## ✨ Your flashcards are ready\nI made **${f.title.en}** — ${f.cards.length} cards.\n${where} — find them under “✨ Noor's creations for you”.`;
}

export async function runNoorStudio(p: StudioFlowParams): Promise<StudioFlowResult> {
  const now = (p.now ?? Date.now)();
  const guest = p.userId === null;
  const { intent, lang } = p;
  const askAi = p.ai ?? requestAiStudio;
  const state = p.store.get(p.userId);
  const open = (kind: StudioKind, id: string): NoorAction[] => [
    { kind: "studio", studio: kind, id },
  ];

  /* ------------------------------ edit ------------------------------ */
  if (intent.action === "edit") {
    const pack = pickPack(intent.kind, p.target, state);
    if (!pack) {
      const noun = KIND_NOUN[intent.kind];
      return {
        text:
          lang === "ar"
            ? `لسه مفيش ${noun.ar} من اللي عملتها ليك عشان أعدّلها. قولي مثلًا «اعملّي ${intent.kind === "mindmap" ? "خريطة ذهنية للعمود الفقري" : "بطاقات لنقط ضعفي"}» وأنا أجهزها لك الأول ✨`
            : `There's no ${noun.en} of yours to edit yet. Say something like “make me ${intent.kind === "mindmap" ? "a mind map of the vertebral column" : "flashcards for my weak spots"}” first ✨`,
        actions: [],
        focus: null,
        done: false,
      };
    }

    let updated: FlashcardPack | MindMapPack | null = null;
    let note = { ar: "", en: "" };
    const local =
      "cards" in pack
        ? editFlashcardPack(pack, intent.request, now)
        : editMindMapPack(pack, intent.request, now);
    if (local.changed) {
      updated = local.pack;
      note = local.note;
    } else {
      const output = await askAi({
        accessToken: p.accessToken,
        action: "edit",
        kind: intent.kind,
        lang,
        request: intent.request,
        blockIds: blocksForIntent({ weak: false, request: intent.request }, p.radar),
        current: compactPack(pack),
      });
      const built = output ? packFromAiOutput(output, { blank: false }, now) : null;
      if (built?.flashcards && "cards" in pack) {
        updated = {
          ...pack,
          title: built.flashcards.title,
          origin: "ai",
          updatedAt: now,
          cards: built.flashcards.cards.map((c, i) => ({ ...c, id: `${pack.id}-${i + 1}` })),
        };
        note = { ar: "عدّلتها زي ما طلبت", en: "edited it as you asked" };
      } else if (built?.mindMap && "nodes" in pack) {
        updated = {
          ...pack,
          title: built.mindMap.title,
          origin: "ai",
          updatedAt: now,
          nodes: built.mindMap.nodes,
        };
        note = { ar: "عدّلتها زي ما طلبت", en: "edited it as you asked" };
      }
    }
    if (!updated) {
      return { text: studioHelpText(lang), actions: [], focus: null, done: false };
    }
    const saved = updated;
    p.store.mutate(p.userId, (s) =>
      "cards" in saved ? updateFlashcardPack(s, saved) : updateMindMapPack(s, saved),
    );
    const title = saved.title[lang];
    return {
      text:
        lang === "ar"
          ? `## ✏️ تم التعديل\nعدّلت **${title}**: ${note.ar}.\nافتحها وشوف النتيجة 👇`
          : `## ✏️ Done\nI updated **${title}**: ${note.en}.\nOpen it to see the result 👇`,
      actions: open(intent.kind, saved.id),
      focus: { kind: intent.kind, packId: saved.id },
      done: true,
    };
  }

  /* ----------------------------- create ----------------------------- */
  let build: StudioBuild | null = null;
  const output = await askAi({
    accessToken: p.accessToken,
    action: "create",
    kind: intent.kind,
    lang,
    request: intent.request,
    blank: intent.blank,
    blockIds: blocksForIntent(intent, p.radar),
  });
  if (output && output.type === (intent.kind === "mindmap" ? "mindmap" : "flashcards")) {
    build = packFromAiOutput(output, { blank: intent.blank }, now);
  }
  build ??= buildLocalStudio(intent, p.radar, lang, now);

  if (build.mindMap) {
    const pack = build.mindMap;
    p.store.mutate(p.userId, (s) => addMindMapPack(s, pack));
    return {
      text: createdText(build, lang, guest),
      actions: open("mindmap", pack.id),
      focus: { kind: "mindmap", packId: pack.id },
      done: true,
    };
  }
  const pack = build.flashcards!;
  if (pack.cards.length === 0) {
    return {
      text:
        lang === "ar"
          ? "ملقيتش بطاقات كفاية للموضوع ده 🤔 جرّب تحدد جزء من الدرس، مثلًا «بطاقات عن الأربطة»."
          : "I couldn't find enough material for that 🤔 Try a topic from the lesson, e.g. “cards about ligaments”.",
      actions: [],
      focus: null,
      done: false,
    };
  }
  p.store.mutate(p.userId, (s) => addFlashcardPack(s, pack));
  return {
    text: createdText(build, lang, guest),
    actions: open("flashcards", pack.id),
    focus: { kind: "flashcards", packId: pack.id },
    done: true,
  };
}
