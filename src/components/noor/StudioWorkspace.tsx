import {
  Brain,
  ClipboardCheck,
  Layers,
  Palette,
  Pencil,
  Puzzle,
  Send,
  Sparkles,
  Swords,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { FullscreenButton } from "@/components/common/FullscreenButton";
import {
  resolveStudioIntent,
  type StudioFocus,
  type StudioIntent,
  type StudioKind,
} from "@/data/lessons/noorStudio";
import { supportBlocks } from "@/data/lessons/supportLesson";
import type { RadarState } from "@/data/lessons/supportRadar";
import type { NoorAction } from "@/data/noor";
import { MAX_QUESTION_LENGTH } from "@/data/tutor";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { runNoorStudio, studioHelpText } from "@/lib/noor-studio-flow";
import { studioStore, useNoorStudio } from "@/lib/use-noor-studio";
import { useFullscreen } from "@/lib/use-fullscreen";
import { NoorMarkdown } from "./NoorMarkdown";
import { NoorStudioCard } from "./NoorStudio";
import { useNoorControl, useStudioFocus, type StudioWorkspaceRequest } from "./NoorProvider";

/**
 * «🎨 استوديو نور»: the full workspace where the student works with Noor on custom material —
 * mind maps, blank recall grids, smart flashcards and quick tests — apart from the small chat.
 * Everything it makes is saved in the account's Studio slot and opens in the Mind Map / Flashcards Labs.
 */

export interface StudioWorkspaceProps {
  /** The block on the board (the default scope of the quick actions). */
  block: number;
  radar: RadarState;
  /** A command handed over from the chat; run once, then reported through `onHandled`. */
  request: StudioWorkspaceRequest | null;
  onHandled: (id: number) => void;
  onOpenPack: (kind: StudioKind, packId: string) => void;
  /** «اختبرني»: the micro-quiz of block `n`. */
  onQuizBlock: (n: number) => void;
  /** «تحدّي»: the practical duel. */
  onChallenge: () => void;
  onClose: () => void;
}

interface Entry {
  id: number;
  role: "me" | "noor";
  text: string;
  actions?: NoorAction[];
}

type Scope = "block" | "weak";

const chip =
  "rounded-full border border-subject/30 bg-subject/10 px-3 py-1.5 text-xs font-semibold text-subject transition hover:bg-subject/20 disabled:pointer-events-none disabled:opacity-40";

export function StudioWorkspace({
  block,
  radar,
  request,
  onHandled,
  onOpenPack,
  onQuizBlock,
  onChallenge,
  onClose,
}: StudioWorkspaceProps) {
  const { l, lang } = useLang();
  const ar = lang === "ar";
  const { user, getAccessToken } = useAuth();
  const { state } = useNoorStudio();
  const { setStudioFocus } = useNoorControl();
  const sharedFocus = useStudioFocus();
  const fs = useFullscreen<HTMLElement>();

  const [scope, setScope] = useState<Scope>("block");
  const [blockN, setBlockN] = useState(block);
  const [kind, setKind] = useState<"mindmap" | "blank" | "flashcards">("mindmap");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<Entry[]>([]);
  const [target, setTarget] = useState<StudioFocus | null>(sharedFocus);
  const [editing, setEditing] = useState(false);

  const alive = useRef(true);
  const busyRef = useRef(false);
  const seq = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const live = useRef({ user, getAccessToken, radar, lang, target });
  live.current = { user, getAccessToken, radar, lang, target };

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [log, busy]);

  const push = useCallback((e: Omit<Entry, "id">) => {
    if (!alive.current) return;
    setLog((x) => [...x, { ...e, id: ++seq.current }].slice(-40));
  }, []);

  // The pack «عدّل دي» refers to, only while it still exists.
  const targetPack = useMemo(() => {
    if (!target) return null;
    return target.kind === "mindmap"
      ? (state.mindMapPacks.find((p) => p.id === target.packId) ?? null)
      : (state.flashcardPacks.find((p) => p.id === target.packId) ?? null);
  }, [target, state]);
  const activeTarget = targetPack ? target : null;

  const run = useCallback(
    async (text: string, intent: StudioIntent, on: StudioFocus | null) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      push({ role: "me", text });
      try {
        const snap = live.current;
        const accessToken = snap.user ? await snap.getAccessToken() : null;
        const result = await runNoorStudio({
          intent,
          target: on,
          userId: snap.user?.id ?? null,
          lang: snap.lang,
          accessToken,
          radar: snap.radar,
          store: studioStore,
        });
        if (result.focus && alive.current) {
          setTarget(result.focus);
          setStudioFocus(result.focus);
        }
        push({ role: "noor", text: result.text, actions: result.actions });
      } catch {
        push({
          role: "noor",
          text:
            live.current.lang === "ar"
              ? "حصلت مشكلة بسيطة، جرّب تاني بعد لحظة 🙏"
              : "Something went wrong — please try again in a moment 🙏",
        });
      } finally {
        busyRef.current = false;
        if (alive.current) setBusy(false);
      }
    },
    [push, setStudioFocus],
  );
  const runRef = useRef(run);
  runRef.current = run;

  // A command from the chat («اعملّي خريطة…», «عدّل مع نور»): run it here, once.
  const handled = useRef(0);
  useEffect(() => {
    if (!request || request.id === handled.current) return;
    handled.current = request.id;
    onHandled(request.id);
    if (!request.text.trim()) return;
    const on = request.target ?? live.current.target;
    const intent = resolveStudioIntent(request.text, on, request.target !== null);
    if (intent) void runRef.current(request.text, intent, on);
    else push({ role: "noor", text: studioHelpText(live.current.lang) });
  }, [request, onHandled, push]);

  const where = scope === "block" ? (ar ? `جزئية ${blockN}` : `block ${blockN}`) : null;

  const make = (what: "mindmap" | "blank" | "flashcards") => {
    const text =
      what === "mindmap"
        ? where
          ? ar
            ? `اعملّي خريطة ذهنية لـ${where}`
            : `Make me a mind map of ${where}`
          : ar
            ? "اعملّي خريطة ذهنية لنقط ضعفي"
            : "Make me a mind map of my weak spots"
        : what === "blank"
          ? where
            ? ar
              ? `اعمل شبكة فاضية للتسميع عن ${where}`
              : `Make a blank recall grid about ${where}`
            : ar
              ? "اعمل شبكة فاضية للتسميع على نقط ضعفي"
              : "Make a blank recall grid on my weak spots"
          : where
            ? ar
              ? `ولّد أسئلة وبطاقات ذكية عن ${where}`
              : `Generate smart flashcards about ${where}`
            : ar
              ? "ولّد أسئلة وبطاقات ذكية لنقط ضعفي"
              : "Generate smart flashcards for my weak spots";
    void run(
      text,
      {
        action: "create",
        kind: what === "flashcards" ? "flashcards" : "mindmap",
        blank: what === "blank",
        weak: scope === "weak",
        request: text,
      },
      null,
    );
  };

  const edit = (text: string, extra: Partial<StudioIntent> = {}) => {
    if (!activeTarget) return;
    void run(
      text,
      {
        action: "edit",
        kind: activeTarget.kind,
        blank: false,
        weak: false,
        request: text,
        ...extra,
      },
      activeTarget,
    );
    setEditing(false);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim().slice(0, MAX_QUESTION_LENGTH);
    if (!text || busy) return;
    setInput("");
    // A recognised command wins; otherwise the text is the topic of the kind chosen above.
    const intent: StudioIntent = resolveStudioIntent(text, activeTarget) ?? {
      action: "create",
      kind: kind === "flashcards" ? "flashcards" : "mindmap",
      blank: kind === "blank",
      weak: scope === "weak" && !/\d/.test(text),
      request: text,
    };
    void run(text, intent, activeTarget);
  };

  const creations = useMemo(
    () =>
      [
        ...state.mindMapPacks.map((p) => ({
          studio: "mindmap" as const,
          id: p.id,
          at: p.createdAt,
        })),
        ...state.flashcardPacks.map((p) => ({
          studio: "flashcards" as const,
          id: p.id,
          at: p.createdAt,
        })),
      ].sort((a, b) => b.at - a.at),
    [state],
  );

  const suggestions = ar
    ? ["اعملّي خريطة ذهنية للعمود الفقري", "اعمل شبكة فاضية عن الأربطة", "ولّد بطاقات لنقط ضعفي"]
    : [
        "Make me a mind map of the vertebral column",
        "Make a blank recall grid about ligaments",
        "Generate flashcards for my weak spots",
      ];

  const tile =
    "flex items-start gap-3 rounded-2xl border border-border bg-background/50 p-3 text-start transition hover:border-subject/60 hover:bg-subject/10 disabled:pointer-events-none disabled:opacity-40";

  return (
    <section
      ref={fs.ref}
      aria-label={ar ? "استوديو نور" : "Noor Studio"}
      className={
        "glass flex flex-col gap-3 rounded-3xl " +
        (fs.active ? "" : "min-h-[75dvh] p-4 ") +
        fs.frame
      }
    >
      <header className="flex flex-wrap items-center gap-2">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-subject text-primary-foreground">
          <Palette className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black sm:text-xl">
            {ar ? "🎨 استوديو نور" : "🎨 Noor Studio"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {ar
              ? "مساحة شغلك مع نور: خرائط، شبكات تسميع، بطاقات واختبارات على مقاسك."
              : "Your workspace with Noor: maps, recall grids, flashcards and quick tests made for you."}
          </p>
        </div>
        <FullscreenButton active={fs.active} onToggle={() => void fs.toggle()} />
        <button
          type="button"
          onClick={onClose}
          aria-label={ar ? "إغلاق الاستوديو" : "Close the Studio"}
          className="rounded-full p-2 hover:bg-accent"
        >
          <X className="size-5" />
        </button>
      </header>

      <div
        className={
          "grid gap-3 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] " +
          (fs.active ? "min-h-0 flex-1" : "")
        }
      >
        {/* Controls */}
        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto">
          <div className="rounded-2xl border border-border bg-background/40 p-3">
            <p className="mb-2 text-xs font-bold">{ar ? "شغّل نور على…" : "Work on…"}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                aria-pressed={scope === "block"}
                onClick={() => setScope("block")}
                className={chip + (scope === "block" ? " ring-1 ring-subject" : "")}
              >
                {ar ? "جزئية" : "Block"}
              </button>
              <select
                value={blockN}
                onChange={(e) => {
                  setBlockN(Number(e.target.value));
                  setScope("block");
                }}
                aria-label={ar ? "رقم الجزئية" : "Block number"}
                className="h-8 max-w-44 rounded-xl border border-input bg-background/60 px-2 text-xs outline-none focus:border-subject"
              >
                {supportBlocks.map((b) => (
                  <option key={b.n} value={b.n}>
                    {b.n} · {l(b.title)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-pressed={scope === "weak"}
                onClick={() => setScope("weak")}
                className={chip + (scope === "weak" ? " ring-1 ring-subject" : "")}
              >
                {ar ? "نقط ضعفي" : "My weak spots"}
              </button>
            </div>
          </div>

          <div className="grid gap-2">
            <button
              type="button"
              className={tile}
              disabled={busy}
              onClick={() => onQuizBlock(blockN)}
            >
              <ClipboardCheck className="mt-0.5 size-5 shrink-0 text-subject" />
              <span>
                <span className="block text-sm font-bold">
                  {ar ? "اختبرني في الجزئية" : "Quiz me on the block"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {ar ? `اختبار سريع على الجزئية ${blockN}` : `A quick test on block ${blockN}`}
                </span>
              </span>
            </button>
            <button type="button" className={tile} disabled={busy} onClick={() => make("blank")}>
              <Puzzle className="mt-0.5 size-5 shrink-0 text-subject" />
              <span>
                <span className="block text-sm font-bold">
                  {ar ? "ابنِ شبكة فاضية للتسميع" : "Build a blank recall grid"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {ar
                    ? "املا الخانات بنفسك ونور يصحّحها"
                    : "Fill the slots yourself, Noor checks them"}
                </span>
              </span>
            </button>
            <button
              type="button"
              className={tile}
              disabled={busy}
              onClick={() => make("flashcards")}
            >
              <Layers className="mt-0.5 size-5 shrink-0 text-subject" />
              <span>
                <span className="block text-sm font-bold">
                  {ar ? "ولّد أسئلة ذكية" : "Generate smart questions"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {ar
                    ? "بطاقات سؤال وجواب بالتكرار المتباعد"
                    : "Q&A flashcards with spaced repetition"}
                </span>
              </span>
            </button>
            <button type="button" className={tile} disabled={busy} onClick={() => make("mindmap")}>
              <Brain className="mt-0.5 size-5 shrink-0 text-subject" />
              <span>
                <span className="block text-sm font-bold">
                  {ar ? "اعمل خريطة ذهنية" : "Make a mind map"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {ar
                    ? "كل التفاصيل والأرقام من الكتاب"
                    : "All the details and numbers from the book"}
                </span>
              </span>
            </button>
            <button type="button" className={tile} disabled={busy} onClick={onChallenge}>
              <Swords className="mt-0.5 size-5 shrink-0 text-subject" />
              <span>
                <span className="block text-sm font-bold">
                  {ar ? "تحدّي صاحبك" : "Challenge a friend"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {ar
                    ? "نفس الأسئلة لاتنين وقارن النتيجة"
                    : "Same questions for both, compare scores"}
                </span>
              </span>
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-background/40 p-3">
            <button
              type="button"
              className={chip + " inline-flex items-center gap-1"}
              disabled={busy || !activeTarget}
              aria-pressed={editing}
              title={
                activeTarget
                  ? undefined
                  : ar
                    ? "اعمل خريطة أو بطاقات الأول"
                    : "Make a map or cards first"
              }
              onClick={() => setEditing((e) => !e)}
            >
              <Pencil className="size-3" />
              {ar ? "عدّل الرزمة/الخريطة الحالية" : "Edit the current pack/map"}
            </button>
            {activeTarget && targetPack && (
              <p className="mt-2 truncate text-[11px] text-muted-foreground">
                {l(targetPack.title)}
              </p>
            )}
            {editing && activeTarget && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  className={chip}
                  disabled={busy}
                  onClick={() => edit(ar ? "خليها أبسط بالعامية" : "Make it simpler")}
                >
                  {ar ? "أبسط بالعامية" : "Simpler"}
                </button>
                <button
                  type="button"
                  className={chip}
                  disabled={busy}
                  onClick={() => edit(ar ? "اختصر الإجابات" : "Shorten the answers")}
                >
                  {ar ? "اختصرها" : "Shorter"}
                </button>
                <button
                  type="button"
                  className={chip}
                  disabled={busy}
                  onClick={() =>
                    edit(
                      activeTarget.kind === "mindmap"
                        ? ar
                          ? "زوّد فروع"
                          : "Add more branches"
                        : ar
                          ? "زوّد بطاقات"
                          : "Add more cards",
                    )
                  }
                >
                  {ar ? "زوّد" : "Add more"}
                </button>
                {activeTarget.kind === "mindmap" && (
                  <>
                    <button
                      type="button"
                      className={chip}
                      disabled={busy}
                      onClick={() =>
                        edit(
                          ar ? "حولها لشبكة فاضية للتسميع" : "Turn it into a blank recall grid",
                          { blank: true },
                        )
                      }
                    >
                      {ar ? "حوّلها شبكة فاضية" : "Make it blank"}
                    </button>
                    <button
                      type="button"
                      className={chip}
                      disabled={busy}
                      onClick={() =>
                        edit(
                          ar
                            ? "رجعها خريطة مليانة بالإجابات"
                            : "Turn it back into a full map with answers",
                        )
                      }
                    >
                      {ar ? "رجّعها مليانة" : "Make it full"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Conversation + creations */}
        <div className="flex min-h-0 flex-col gap-3">
          <div
            ref={scrollRef}
            aria-live="polite"
            className={
              "flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border bg-background/30 p-3 " +
              (fs.active ? "min-h-0" : "max-h-[46dvh] min-h-56")
            }
          >
            {log.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {ar
                    ? "اكتب لنور اللي محتاجه، أو اختار إجراء جاهز من جنبك. جرّب:"
                    : "Tell Noor what you need, or pick a ready action beside this. Try:"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button key={s} type="button" className={chip} onClick={() => setInput(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {log.map((m) => (
              <div
                key={m.id}
                className={
                  "flex flex-col gap-1.5 " + (m.role === "me" ? "items-end" : "items-start")
                }
              >
                {m.role === "me" ? (
                  <p className="max-w-[85%] whitespace-pre-line wrap-break-word rounded-2xl rounded-ee-md bg-subject px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground">
                    {m.text}
                  </p>
                ) : (
                  <div className="max-w-[92%] rounded-2xl rounded-es-md border border-border bg-background/60 px-3.5 py-2.5 text-sm leading-relaxed">
                    <NoorMarkdown text={m.text} />
                  </div>
                )}
                {m.actions?.map((a, i) =>
                  a.kind === "studio" ? (
                    <NoorStudioCard
                      key={i}
                      action={a}
                      lang={lang}
                      onOpen={(x) => onOpenPack(x.studio, x.id)}
                    />
                  ) : null,
                )}
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="size-3.5 animate-blink text-subject" />
                {ar ? "نور بتجهّز طلبك…" : "Noor is preparing your request…"}
              </div>
            )}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-1.5" role="group">
              {(
                [
                  ["mindmap", ar ? "🧠 خريطة" : "🧠 Map"],
                  ["blank", ar ? "🧩 شبكة فاضية" : "🧩 Blank grid"],
                  ["flashcards", ar ? "🗂️ بطاقات" : "🗂️ Cards"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kind === k}
                  onClick={() => setKind(k)}
                  className={chip + (kind === k ? " ring-1 ring-subject" : "")}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={input}
                maxLength={MAX_QUESTION_LENGTH}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  ar
                    ? "اطلب من نور: خريطة، شبكة تسميع، بطاقات، تعديل…"
                    : "Ask Noor: a map, a recall grid, cards, an edit…"
                }
                className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-background/60 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-subject"
              />
              <button
                type="submit"
                disabled={!input.trim() || busy}
                aria-label={ar ? "إرسال" : "Send"}
                className="flex size-11 items-center justify-center rounded-xl bg-subject text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
              >
                <Send className="size-4 rtl:-scale-x-100" />
              </button>
            </div>
          </form>

          <div>
            <p className="mb-2 text-xs font-bold">
              {ar ? "✨ إبداعات نور لك" : "✨ Noor's creations for you"} ({creations.length})
            </p>
            {creations.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {ar ? "لسه مفيش حاجة — اطلب أول واحدة!" : "Nothing yet — ask for your first one!"}
              </p>
            ) : (
              <ul className="grid max-h-60 gap-2 overflow-y-auto">
                {creations.map((c) => (
                  <li key={c.id} className="flex flex-col gap-1">
                    <NoorStudioCard
                      action={{ kind: "studio", studio: c.studio, id: c.id }}
                      lang={lang}
                      onOpen={(x) => onOpenPack(x.studio, x.id)}
                    />
                    <button
                      type="button"
                      className="self-start text-[11px] font-semibold text-subject hover:underline"
                      onClick={() => {
                        const f = { kind: c.studio, packId: c.id };
                        setTarget(f);
                        setStudioFocus(f);
                        setEditing(true);
                      }}
                    >
                      ✏️ {ar ? "عدّل دي" : "Edit this"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
