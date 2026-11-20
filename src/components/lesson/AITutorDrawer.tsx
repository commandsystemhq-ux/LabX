import { Bot, ChevronDown, MapPin, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { extras, hazardLevel, type Hazard } from "@/data/simExtras";
import type { SimValues, SimulationDef, TutorIntent, ValueChange } from "@/data/simulations";
import {
  buildTutorReply,
  detectIntent,
  MAX_QUESTION_LENGTH,
  type ControlMode,
  type TutorContext,
} from "@/data/tutor";
import { ui, useLang, type L10n, type UiKey } from "@/lib/i18n";

interface Message {
  id: number;
  role: "tutor" | "student";
  text: string;
}

const prompts: { intent: TutorIntent; label: L10n }[] = [
  { intent: "colloquial", label: { ar: "اشرحلي بالعامية", en: "Explain it simply" } },
  { intent: "why", label: { ar: "ليه القراءة اتغيرت؟", en: "Why did the reading change?" } },
  { intent: "hint", label: ui.tutorHint },
  { intent: "hazard", label: ui.tutorHazard },
  { intent: "example", label: { ar: "إديني مثال من الحياة", en: "Real-life example" } },
  { intent: "mistake", label: { ar: "إيه الغلطة الشائعة؟", en: "Common mistake?" } },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sim: SimulationDef;
  values: SimValues;
  lastChange: ValueChange | null;
  step: number;
  mode: ControlMode;
  view: "macro" | "molecular";
  hazards: Hazard[];
  errorMode: boolean;
  guided: TutorContext["guided"];
}

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

export function AITutorDrawer(props: Props) {
  const { open, onOpenChange, sim, values, step, mode, view, hazards, errorMode, guided } = props;
  const { t, l, lang } = useLang();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(1);
  const timer = useRef<number | undefined>(undefined);

  // Latest scene state, read when the (delayed) reply is produced.
  const live = useRef<TutorContext>(null as unknown as TutorContext);
  live.current = {
    lang,
    values,
    change: props.lastChange,
    step,
    mode,
    view,
    hazards,
    errorMode,
    guided,
  };

  useEffect(() => {
    const greeting: Message = {
      id: 0,
      role: "tutor",
      text:
        lang === "ar"
          ? "أهلاً! أنا المعلم الذكي 👋 شايف كل اللي بيحصل في المحاكاة دلوقتي. اسألني أي حاجة أو اختار سؤال جاهز."
          : "Hi! I'm your AI tutor 👋 I can see everything happening in the simulation. Ask me anything or pick a prompt.",
    };
    // Keep the conversation when the language flips; only the greeting is re-localised.
    setMessages((m) => (m.length === 0 ? [greeting] : [greeting, ...m.slice(1)]));
  }, [lang]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const ask = (text: string, intent: TutorIntent) => {
    if (typing) return;
    setMessages((m) => [...m, { id: idRef.current++, role: "student", text }]);
    setTyping(true);
    timer.current = window.setTimeout(() => {
      setMessages((m) => [
        ...m,
        { id: idRef.current++, role: "tutor", text: buildTutorReply(sim, intent, live.current) },
      ]);
      setTyping(false);
    }, 700);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = input.trim().slice(0, MAX_QUESTION_LENGTH);
    if (!q) return;
    setInput("");
    ask(q, detectIntent(q));
  };

  const level = hazardLevel(hazards);
  const activeFault = extras[sim.id].faults.find((f) => f.id === values.fault);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
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
              {lang === "ar" ? "فاهم المشهد اللي قدامك" : "Context-aware"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
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
              <span className="font-bold text-subject">{t("currentScene")}:</span>{" "}
              {sim.context(values, lang)}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip>{t(`steps${step}` as UiKey)}</Chip>
            <Chip>{t(mode === "guided" ? "modeGuided" : "modeFree")}</Chip>
            <Chip>{t(view)}</Chip>
            {activeFault && <Chip tone="danger">{l(activeFault.label)}</Chip>}
            {level > 0 && hazards[0] && (
              <Chip tone={level === 2 ? "danger" : "warning"}>{l(hazards[0].title)}</Chip>
            )}
            {step === 2 && mode === "guided" && guided && !guided.done && (
              <Chip tone="warning">{l(guided.step.title)}</Chip>
            )}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={"flex " + (m.role === "student" ? "justify-end" : "justify-start")}
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
              </p>
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
          {prompts.map((p) => (
            <button
              key={p.intent}
              type="button"
              disabled={typing}
              onClick={() => ask(l(p.label), p.intent)}
              className="shrink-0 rounded-full border border-subject/30 bg-subject/10 px-3 py-1.5 text-xs font-semibold text-subject transition hover:bg-subject/20 disabled:opacity-50"
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
