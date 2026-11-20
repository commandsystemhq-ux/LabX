import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Bot, ChevronDown, MapPin, Send, Settings2, Sparkles } from "lucide-react";
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
import { requestAiReply, type FallbackReason } from "@/lib/ai-tutor-client";
import { useAuth } from "@/lib/auth";
import { ui, useLang, type L10n, type UiKey } from "@/lib/i18n";
import { studentStats } from "@/lib/progress";
import { useProgress } from "@/lib/use-progress";
import { useNoorControl, useNoorLesson, useNoorOpen } from "./NoorProvider";

interface Message {
  id: number;
  role: "noor" | "student";
  text: string;
  /** Produced by the server-side AI (vs. the built-in local answers). */
  ai?: boolean;
  /** Validated "go to" buttons; the student has to click, Noor never navigates by itself. */
  actions?: NoorAction[];
  /** Shown to the admin only: why the AI wasn't used. */
  note?: "error" | "disabled";
}

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

  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(1);
  const timer = useRef<number | undefined>(undefined);
  const runRef = useRef(0);

  // Latest state, read when a (possibly delayed) reply is produced.
  const live = useRef({ lang, lesson, platform, stats, progress, isAdmin: false });
  live.current = { lang, lesson, platform, stats, progress, isAdmin: user?.isAdmin === true };

  useEffect(() => {
    const greeting: Message = { id: 0, role: "noor", text: noorGreeting(lang) };
    // Keep the conversation when the language flips; only the greeting is re-localised.
    setMessages((m) => (m.length === 0 ? [greeting] : [greeting, ...m.slice(1)]));
  }, [lang]);

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
    setMessages((m) => [...m, { id: idRef.current++, role: "student", text }]);
    setTyping(true);
    const run = ++runRef.current;
    const started = Date.now();

    void (async () => {
      const snap = live.current;
      const platformIntent = hint?.platform ?? (hint?.lesson ? null : detectPlatformIntent(text));
      let reply: { text: string; actions: NoorAction[] };
      let ai = false;
      let note: Message["note"];

      if (platformIntent) {
        reply = buildPlatformReply(platformIntent, text, snap.platform, snap.stats, snap.progress);
      } else {
        const lessonIntent = hint?.lesson ?? detectIntent(text);
        const why: { reason: FallbackReason | null } = { reason: null };
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
          onFallback: (r) => void (why.reason = r),
        });

        if (aiText) {
          reply = parseActionTags(aiText);
          ai = true;
        } else {
          reply = snap.lesson
            ? {
                text: buildTutorReply(snap.lesson.sim, lessonIntent, snap.lesson.ctx),
                actions: [],
              }
            : buildPlatformReply("unknown", text, snap.platform, snap.stats, snap.progress);
          if (snap.isAdmin) {
            note =
              why.reason === "disabled" ? "disabled" : why.reason === "error" ? "error" : undefined;
          }
        }
      }
      if (run !== runRef.current) return;

      const deliver = () => {
        if (run !== runRef.current) return;
        setMessages((m) => [
          ...m,
          {
            id: idRef.current++,
            role: "noor",
            text: reply.text,
            ai,
            ...(reply.actions.length ? { actions: reply.actions } : {}),
            ...(note ? { note } : {}),
          },
        ]);
        setTyping(false);
      };
      timer.current = window.setTimeout(
        deliver,
        ai ? 0 : Math.max(0, 600 - (Date.now() - started)),
      );
    })();
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

        <div className="border-b border-border px-4 py-2.5">
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

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                "flex flex-col gap-1.5 " + (m.role === "student" ? "items-end" : "items-start")
              }
            >
              <p
                className={
                  "max-w-[85%] whitespace-pre-line break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed " +
                  (m.role === "student"
                    ? "rounded-ee-md bg-subject text-primary-foreground"
                    : "rounded-es-md border border-border bg-background/60")
                }
              >
                {m.text}
                {m.ai && (
                  <span className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Sparkles className="size-3 text-subject" />
                    {t("aiPowered")}
                  </span>
                )}
              </p>
              {m.actions && (
                <div className="flex max-w-[92%] flex-wrap gap-1.5">
                  {m.actions.map((a, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => go(a)}
                      className="rounded-full border border-subject/40 bg-subject/10 px-3 py-1.5 text-xs font-semibold text-subject transition hover:bg-subject/20"
                    >
                      {actionLabel(a, lang)}
                    </button>
                  ))}
                </div>
              )}
              {m.note && (
                <p className="flex max-w-[85%] items-start gap-1.5 rounded-xl border border-warning/40 bg-warning/10 px-2.5 py-1.5 text-[11px]">
                  <Settings2 className="mt-0.5 size-3 shrink-0 text-warning" />
                  {t(m.note === "error" ? "noorAdminAiError" : "noorAdminAiOff")}
                </p>
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

        <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none">
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

        <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-3">
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
