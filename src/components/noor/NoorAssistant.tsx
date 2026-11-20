import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bookmark,
  Bot,
  ChevronDown,
  FolderOpen,
  MapPin,
  MessageSquarePlus,
  Send,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { extras, hazardLevel } from "@/data/simExtras";
import { findLesson, isGradeId, isSubjectId, lessonExists } from "@/data/mockCurriculum";
import {
  actionLabel,
  buildPlatformReply,
  describePage,
  detectPlatformIntent,
  noorGreeting,
  noorPlatformPrompts,
  pageFromPath,
  parseActionTags,
  type NoorAction,
  type PlatformContext,
  type PlatformIntent,
  type PlatformStats,
} from "@/data/noor";
import type { TutorIntent } from "@/data/simulations";
import { buildTutorReply, detectIntent, MAX_QUESTION_LENGTH } from "@/data/tutor";
import { requestAiReply } from "@/lib/ai-tutor-client";
import { useAuth } from "@/lib/auth";
import { ui, useLang, type L10n, type UiKey } from "@/lib/i18n";
import { chatContext, type SavedChat } from "@/lib/noor-chat";
import { studentStats } from "@/lib/progress";
import { useNoorChat, useSavedChats, type SaveResult } from "@/lib/use-noor-chat";
import { useProgress } from "@/lib/use-progress";
import { NoorMarkdown } from "./NoorMarkdown";
import { useNoorControl, useNoorLesson, useNoorOpen } from "./NoorProvider";
import { NoorSavedChats } from "./NoorSavedChats";

const SAVE_NOTE_KEYS: Record<SaveResult | "already", UiKey> = {
  ok: "noorSavedOk",
  already: "noorSavedAlready",
  limit: "noorSavedLimit",
  error: "noorSaveError",
  empty: "noorSaveError",
};

const lessonPrompts: { intent: TutorIntent; label: L10n }[] = [
  { intent: "colloquial", label: { ar: "اشرحلي بالعامية", en: "Explain it simply" } },
  { intent: "why", label: { ar: "ليه القراءة اتغيرت؟", en: "Why did the reading change?" } },
  { intent: "hint", label: ui.tutorHint },
  { intent: "hazard", label: ui.tutorHazard },
  { intent: "example", label: { ar: "إديني مثال من الحياة", en: "Real-life example" } },
  { intent: "mistake", label: { ar: "إيه الغلطة الشائعة؟", en: "Common mistake?" } },
];

function Chip({
  children,
  tone = "neutral",
}: {
  children: string;
  tone?: "neutral" | "warning" | "danger";
}) {
  return (
    <span
      className={
        "rounded-full border px-2 py-0.5 text-[10px] font-semibold " +
        (tone === "danger"
          ? "border-destructive/60 bg-destructive/15 text-destructive"
          : tone === "warning"
            ? "border-warning/60 bg-warning/15 text-warning"
            : "border-border bg-background/60 text-muted-foreground")
      }
    >
      {children}
    </span>
  );
}

/**
 * Noor: the platform-wide assistant. Mounted once at the root so it is available on every page and
 * keeps the conversation while the student navigates. Inside a lesson it receives the live
 * simulation from `useNoorLesson`; elsewhere it works from the current page.
 */
export function NoorAssistant() {
  const { t, l, lang } = useLang();
  const open = useNoorOpen();
  const { setOpen } = useNoorControl();
  const lessonCtx = useNoorLesson();
  const { user, getAccessToken } = useAuth();
  const progress = useProgress();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });

  const page = pageFromPath(location.pathname);
  const search = location.search as Record<string, unknown>;
  const lesson = page === "lesson" ? lessonCtx : null;

  const lessonId =
    page === "lesson"
      ? (lesson?.lessonId ?? (typeof search["id"] === "string" ? search["id"] : undefined))
      : undefined;
  const lookup = page === "lesson" ? findLesson(lessonId) : null;
  const gradeParam = search["grade"];
  const subjectParam = search["subject"];
  const grade = lookup?.grade.id ?? (isGradeId(gradeParam) ? gradeParam : undefined);
  const subject = lookup?.subject.id ?? (isSubjectId(subjectParam) ? subjectParam : undefined);

  const platform = useMemo<PlatformContext>(
    () => ({
      page,
      lang,
      signedIn: user !== null,
      grade,
      subject,
      lessonId: lookup?.lesson.id,
    }),
    [page, lang, user, grade, subject, lookup?.lesson.id],
  );

  const stats = useMemo<PlatformStats>(() => {
    const s = studentStats(progress);
    const entries = Object.values(progress.lessons);
    return {
      xp: s.xp,
      level: s.level,
      streak: s.streak,
      mastered: entries.filter((e) => e.mastery >= 85).length,
      started: entries.length,
    };
  }, [progress]);

  const chat = useNoorChat();
  const { messages } = chat;
  const savedChats = useSavedChats();
  const [showSaved, setShowSaved] = useState(false);
  const [saveNote, setSaveNote] = useState<{ ok: boolean; key: UiKey } | null>(null);
  /** Signature of the conversation last saved, so pressing Save twice doesn't duplicate it. */
  const savedSig = useRef<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const runRef = useRef(0);

  // Latest state, read when a (possibly delayed) reply is produced.
  const live = useRef({ lang, lesson, platform, stats, progress });
  live.current = { lang, lesson, platform, stats, progress };

  // A different account (or sign-out) must not receive a reply that was still in flight.
  useEffect(() => {
    runRef.current++;
    window.clearTimeout(timer.current);
    setTyping(false);
    setShowSaved(false);
    setSaveNote(null);
    savedSig.current = null;
  }, [chat.scope]);

  useEffect(() => {
    if (!saveNote) return;
    const id = window.setTimeout(() => setSaveNote(null), 4000);
    return () => window.clearTimeout(id);
  }, [saveNote]);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      runRef.current++; // drop any reply still in flight
    },
    [],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const send = (text: string, hint?: { platform?: PlatformIntent; lesson?: TutorIntent }) => {
    if (typing) return;
    const memory = chatContext(chat.messagesRef.current);
    chat.append({ role: "student", text });
    setTyping(true);
    const run = ++runRef.current;
    const started = Date.now();

    void (async () => {
      const snap = live.current;
      const platformIntent = hint?.platform ?? (hint?.lesson ? null : detectPlatformIntent(text));
      let reply: { text: string; actions: NoorAction[] };
      let aiAnswered = false;

      if (platformIntent) {
        reply = buildPlatformReply(platformIntent, text, snap.platform, snap.stats, snap.progress);
      } else {
        const lessonIntent = hint?.lesson ?? detectIntent(text);
        const accessToken = user ? await getAccessToken() : null;
        const aiText = await requestAiReply({
          question: text,
          intent: snap.lesson ? lessonIntent : "general",
          lang: snap.lang,
          accessToken,
          page: {
            page: snap.platform.page,
            grade: snap.platform.grade,
            subject: snap.platform.subject,
            scene: describePage(snap.platform),
          },
          lesson: snap.lesson ? { sim: snap.lesson.sim, ctx: snap.lesson.ctx } : null,
          history: memory.history,
          summary: memory.summary,
        });

        if (aiText) {
          reply = parseActionTags(aiText);
          aiAnswered = true;
        } else {
          reply = snap.lesson
            ? {
                text: buildTutorReply(snap.lesson.sim, lessonIntent, snap.lesson.ctx),
                actions: [],
              }
            : buildPlatformReply("unknown", text, snap.platform, snap.stats, snap.progress);
        }
      }
      if (run !== runRef.current) return;

      const deliver = () => {
        if (run !== runRef.current) return;
        chat.append({
          role: "noor",
          text: reply.text,
          ...(reply.actions.length ? { actions: reply.actions } : {}),
        });
        setTyping(false);
      };
      timer.current = window.setTimeout(
        deliver,
        aiAnswered ? 0 : Math.max(0, 600 - (Date.now() - started)),
      );
    })();
  };

  /** Starts a fresh conversation: drops any reply still in flight and clears the saved history. */
  const newChat = () => {
    runRef.current++;
    window.clearTimeout(timer.current);
    setTyping(false);
    chat.clear();
    setInput("");
    savedSig.current = null;
    setShowSaved(false);
  };

  /** Manual save of the current conversation into the saved list (never automatic). */
  const saveChat = async () => {
    const current = chat.messagesRef.current;
    if (current.length === 0) return;
    const sig = `${current.length}:${current[current.length - 1]?.text ?? ""}`;
    if (savedSig.current === sig) {
      setSaveNote({ ok: true, key: SAVE_NOTE_KEYS.already });
      return;
    }
    const result = await savedChats.save(current, t("noorUntitled"));
    if (result === "ok") savedSig.current = sig;
    setSaveNote({ ok: result === "ok", key: SAVE_NOTE_KEYS[result] });
  };

  const toggleSaved = () => {
    const next = !showSaved;
    setShowSaved(next);
    if (next) void savedChats.refresh();
  };

  /** Replaces the current conversation with a saved one (dropping any reply still in flight). */
  const openSaved = (saved: SavedChat) => {
    runRef.current++;
    window.clearTimeout(timer.current);
    setTyping(false);
    chat.replace(saved.messages);
    savedSig.current = `${saved.messages.length}:${saved.messages[saved.messages.length - 1]?.text ?? ""}`;
    setShowSaved(false);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = input.trim().slice(0, MAX_QUESTION_LENGTH);
    if (!q) return;
    setInput("");
    send(q);
  };

  const go = (a: NoorAction) => {
    switch (a.kind) {
      case "home":
        void navigate({ to: "/" });
        break;
      case "dashboard":
        void navigate({
          to: "/dashboard",
          search: {
            ...(a.grade ? { grade: a.grade } : {}),
            ...(a.subject ? { subject: a.subject } : {}),
          },
        });
        break;
      case "lesson":
        if (lessonExists(a.id)) void navigate({ to: "/lesson", search: { id: a.id } });
        break;
      case "auth":
        void navigate({ to: "/auth", search: { mode: a.mode } });
        break;
    }
    setOpen(false);
  };

  // Teacher board mode on a lesson page: Noor steps aside.
  if (lesson?.hidden) return null;

  const hazards = lesson?.ctx.hazards ?? [];
  const level = hazardLevel(hazards);
  const activeFault = lesson
    ? extras[lesson.sim.id].faults.find((f) => f.id === lesson.ctx.values.fault)
    : undefined;
  const sceneLine = lesson ? lesson.sim.context(lesson.ctx.values, lang) : describePage(platform);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-4 end-4 z-40 flex animate-pulse-ring items-center gap-2 rounded-full bg-subject px-4 py-3 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:brightness-110"
        >
          <Bot className="size-5" />
          {t("aiTutor")}
        </button>
      )}

      <aside
        aria-label={t("aiTutor")}
        aria-hidden={!open}
        inert={!open}
        className={
          "glass-strong fixed inset-x-2 bottom-2 z-50 flex h-[72dvh] flex-col overflow-hidden rounded-3xl transition-all duration-300 sm:inset-x-auto sm:end-4 sm:bottom-4 sm:h-[min(640px,calc(100dvh-6rem))] sm:w-[400px] " +
          (open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0")
        }
      >
        <header className="flex items-center gap-3 border-b border-border p-4">
          <span className="relative flex size-10 items-center justify-center rounded-2xl bg-gradient-subject text-primary-foreground">
            <Bot className="size-5" />
            <span className="absolute -bottom-0.5 -end-0.5 size-3 rounded-full border-2 border-surface bg-bio" />
          </span>
          <div className="flex-1">
            <p className="font-bold">{t("aiTutor")}</p>
            <p className="text-[11px] text-muted-foreground">
              {t(lesson ? "noorSubtitleLesson" : "noorSubtitlePlatform")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ChevronDown className="size-5" />
          </button>
        </header>

        <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2">
          <button
            type="button"
            onClick={() => void saveChat()}
            disabled={messages.length === 0}
            className="flex items-center gap-1 rounded-xl border border-subject/40 bg-subject/10 px-2 py-1.5 text-[11px] font-semibold text-subject transition hover:bg-subject/20 disabled:pointer-events-none disabled:opacity-40"
          >
            <Bookmark className="size-3.5" />
            {t("noorSaveChat")}
          </button>
          <button
            type="button"
            onClick={newChat}
            disabled={messages.length === 0 && !typing}
            className="flex items-center gap-1 rounded-xl border border-border px-2 py-1.5 text-[11px] font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <MessageSquarePlus className="size-3.5" />
            {t("noorNewChat")}
          </button>
          <button
            type="button"
            onClick={toggleSaved}
            aria-pressed={showSaved}
            className={
              "ms-auto flex items-center gap-1 rounded-xl border px-2 py-1.5 text-[11px] font-semibold transition " +
              (showSaved
                ? "border-subject bg-subject/15 text-subject"
                : "border-border text-muted-foreground hover:bg-accent hover:text-foreground")
            }
          >
            <FolderOpen className="size-3.5" />
            {t("noorSavedChats")}
          </button>
          {saveNote && (
            <p
              role="status"
              className={
                "basis-full text-[11px] " + (saveNote.ok ? "text-bio" : "text-destructive")
              }
            >
              {t(saveNote.key)}
            </p>
          )}
        </div>

        {showSaved && (
          <NoorSavedChats
            chats={savedChats.saved}
            loading={savedChats.loading}
            hasCurrent={messages.length > 0}
            onOpen={openSaved}
            onDelete={savedChats.remove}
            onBack={() => setShowSaved(false)}
          />
        )}

        <div className={"border-b border-border px-4 py-2.5 " + (showSaved ? "hidden" : "")}>
          <div className="flex items-start gap-2 rounded-xl border border-subject/30 bg-subject/10 px-3 py-2 text-xs">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-subject" />
            <span>
              <span className="font-bold text-subject">
                {t(lesson ? "currentScene" : "noorYouAreHere")}:
              </span>{" "}
              {sceneLine}
            </span>
          </div>
          {lesson && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip>{t(`steps${lesson.ctx.step}` as UiKey)}</Chip>
              <Chip>{t(lesson.ctx.mode === "guided" ? "modeGuided" : "modeFree")}</Chip>
              <Chip>{t(lesson.ctx.view)}</Chip>
              {activeFault && <Chip tone="danger">{l(activeFault.label)}</Chip>}
              {level > 0 && hazards[0] && (
                <Chip tone={level === 2 ? "danger" : "warning"}>{l(hazards[0].title)}</Chip>
              )}
              {lesson.ctx.step === 2 &&
                lesson.ctx.mode === "guided" &&
                lesson.ctx.guided &&
                !lesson.ctx.guided.done && (
                  <Chip tone="warning">{l(lesson.ctx.guided.step.title)}</Chip>
                )}
            </div>
          )}
        </div>

        <div
          ref={scrollRef}
          className={"flex-1 space-y-3 overflow-y-auto p-4 " + (showSaved ? "hidden" : "")}
        >
          <div className="flex flex-col items-start gap-1.5">
            <div className="max-w-[85%] rounded-2xl rounded-es-md border border-border bg-background/60 px-3.5 py-2.5 text-sm leading-relaxed">
              <NoorMarkdown text={noorGreeting(lang)} />
            </div>
          </div>
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                "flex flex-col gap-1.5 " + (m.role === "student" ? "items-end" : "items-start")
              }
            >
              {m.role === "student" ? (
                <p className="max-w-[85%] whitespace-pre-line break-words rounded-2xl rounded-ee-md bg-subject px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground">
                  {m.text}
                </p>
              ) : (
                <div className="max-w-[85%] rounded-2xl rounded-es-md border border-border bg-background/60 px-3.5 py-2.5 text-sm leading-relaxed">
                  <NoorMarkdown text={m.text} />
                </div>
              )}
              {m.actions && (
                <div className="flex max-w-[92%] flex-wrap gap-1.5">
                  {m.actions.map((a, j) => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => go(a)}
                      className="rounded-full border border-subject/40 bg-subject/10 px-3 py-1.5 text-xs font-semibold text-subject transition hover:bg-subject/20"
                    >
                      {actionLabel(a, lang)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {typing && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 animate-blink text-subject" />
              {t("typing")}
            </div>
          )}
        </div>

        <div
          className={
            "flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none " + (showSaved ? "hidden" : "")
          }
        >
          {lesson &&
            lessonPrompts.map((p) => (
              <button
                key={p.intent}
                type="button"
                disabled={typing}
                onClick={() => send(l(p.label), { lesson: p.intent })}
                className="shrink-0 rounded-full border border-subject/30 bg-subject/10 px-3 py-1.5 text-xs font-semibold text-subject transition hover:bg-subject/20 disabled:opacity-50"
              >
                {l(p.label)}
              </button>
            ))}
          {noorPlatformPrompts.map((p) => (
            <button
              key={p.intent}
              type="button"
              disabled={typing}
              onClick={() => send(l(p.label), { platform: p.intent })}
              className="shrink-0 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs font-semibold transition hover:bg-accent disabled:opacity-50"
            >
              {l(p.label)}
            </button>
          ))}
        </div>

        <form
          onSubmit={submit}
          className={
            "flex items-center gap-2 border-t border-border p-3 " + (showSaved ? "hidden" : "")
          }
        >
          <input
            value={input}
            maxLength={MAX_QUESTION_LENGTH}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("askPlaceholder")}
            className="h-10 flex-1 rounded-xl border border-input bg-background/60 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-subject"
          />
          <button
            type="submit"
            disabled={!input.trim() || typing}
            aria-label={t("send")}
            className="flex size-10 items-center justify-center rounded-xl bg-subject text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
          >
            <Send className="size-4 rtl:-scale-x-100" />
          </button>
        </form>
      </aside>
    </>
  );
}
