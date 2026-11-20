import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildDuel,
  compareDuel,
  duelUrl,
  newSeed,
  scoreDuel,
  type DuelAnswer,
  type DuelParams,
  type DuelResult,
  type DuelSource,
} from "@/data/lessons/supportDuel";
import { useLang } from "@/lib/i18n";
import { S } from "./strings";

const ROUND_SECONDS = 30;

interface Props {
  lessonId: string;
  source: DuelSource;
  /** Seed / challenger result read from the link (`?duel=…&vs=…`). */
  params: DuelParams | null;
  onAnswer: (block: number, itemId: string, ok: boolean) => void;
  /** Keeps the address bar in sync so the link in the browser can be shared too. */
  onSeed?: ((seed: string) => void) | undefined;
}

type Phase = "menu" | "play" | "done";

/**
 * «تحدي 1 ضد 1»: both players open the same link, so they get the same questions (seeded) and race
 * for score and time. The result can be sent back as a link that carries it.
 */
export function PracticalDuel({ lessonId, source, params, onAnswer, onSeed }: Props) {
  const { l, lang } = useLang();
  const [seed, setSeed] = useState<string>(params?.seed ?? "");
  const [phase, setPhase] = useState<Phase>("menu");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<DuelAnswer[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [secs, setSecs] = useState(ROUND_SECONDS);
  const [copied, setCopied] = useState(false);
  const startedAt = useRef(0);
  const advance = useRef<number | undefined>(undefined);

  const challenges = useMemo(() => (seed ? buildDuel(seed, source) : []), [seed, source]);
  const current = challenges[index];
  const result: DuelResult | null = useMemo(
    () => (phase === "done" ? scoreDuel(challenges, answers) : null),
    [phase, challenges, answers],
  );
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  useEffect(() => () => window.clearTimeout(advance.current), []);

  const begin = (s: string) => {
    setSeed(s);
    onSeed?.(s);
    setIndex(0);
    setAnswers([]);
    setPicked(null);
    setSecs(ROUND_SECONDS);
    startedAt.current = Date.now();
    setPhase("play");
  };

  const record = (choice: number) => {
    if (!current || picked !== null) return;
    const ms = Date.now() - startedAt.current;
    setPicked(choice);
    const ok = choice >= 0 && !!current.options[choice]?.correct;
    onAnswer(current.block, `duel-${current.id}`.slice(0, 40), ok);
    setAnswers((a) => [...a, { id: current.id, choice, ms }]);
    window.clearTimeout(advance.current);
    advance.current = window.setTimeout(() => {
      if (index + 1 >= challenges.length) setPhase("done");
      else {
        setIndex((i) => i + 1);
        setPicked(null);
        setSecs(ROUND_SECONDS);
        startedAt.current = Date.now();
      }
    }, 900);
  };

  // Round countdown: running out of time counts as a miss.
  useEffect(() => {
    if (phase !== "play" || picked !== null) return;
    if (secs <= 0) {
      record(-1);
      return;
    }
    const id = window.setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `record` reads the latest state on each tick
  }, [phase, picked, secs]);

  const shareUrl = seed ? duelUrl(origin, lessonId, seed, result ?? undefined) : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the link stays visible in the box to copy by hand */
    }
  };

  const outcome = result && params?.vs ? compareDuel(result, params.vs) : null;

  return (
    <div className="glass rounded-3xl p-4">
      <h3 className="text-lg font-bold">⚔️ {l(S.duel)}</h3>
      {phase === "menu" && (
        <div className="mt-3 space-y-3">
          <p className="text-sm leading-relaxed">
            {lang === "ar"
              ? `${source.questions.length > 0 ? "8" : "0"} أسئلة سريعة على الدرس بنفس الترتيب للاتنين. الأعلى نقاط ثم الأسرع بيكسب.`
              : "8 quick lesson questions, the same for both players. Highest score wins, then the fastest."}
          </p>
          {params?.vs && (
            <p className="rounded-xl border border-warning/40 bg-warning/10 p-2 text-sm">
              {lang === "ar"
                ? `صاحبك جاب ${params.vs.score} نقطة في ${(params.vs.ms / 1000).toFixed(1)} ثانية. هتقدر تغلبه؟`
                : `Your friend scored ${params.vs.score} in ${(params.vs.ms / 1000).toFixed(1)} s. Can you beat it?`}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {params?.seed && (
              <button
                type="button"
                onClick={() => begin(params.seed)}
                className="rounded-full bg-subject px-5 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110"
              >
                {lang === "ar" ? "انضم لتحدي صاحبك" : "Join your friend's duel"}
              </button>
            )}
            <button
              type="button"
              onClick={() => begin(newSeed())}
              className={
                "rounded-full px-5 py-2.5 text-sm font-bold " +
                (params?.seed
                  ? "border border-subject/40 text-subject hover:bg-subject/10"
                  : "bg-subject text-primary-foreground hover:brightness-110")
              }
            >
              {lang === "ar" ? "ابدأ تحدي جديد" : "Start a new duel"}
            </button>
          </div>
        </div>
      )}
      {phase === "play" && current && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs font-mono text-subject">
            <span>
              {index + 1}/{challenges.length}
            </span>
            <span className={secs <= 8 ? "text-destructive" : ""}>⏱ {secs}s</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-subject transition-all duration-1000 ease-linear"
              style={{ width: `${(secs / ROUND_SECONDS) * 100}%` }}
            />
          </div>
          <p className="mt-3 text-base font-bold leading-relaxed">{l(current.prompt)}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {current.options.map((o, i) => {
              const shown = picked !== null;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={shown}
                  onClick={() => record(i)}
                  className={
                    "rounded-xl border p-3 text-start text-sm font-semibold transition " +
                    (shown && o.correct
                      ? "border-bio bg-bio/15"
                      : shown && picked === i
                        ? "border-destructive bg-destructive/15"
                        : "border-border bg-background/50 hover:border-subject/60 hover:bg-subject/10")
                  }
                >
                  {l(o.text)}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {phase === "done" && result && (
        <div className="mt-3 space-y-3">
          <p className="text-3xl font-black text-subject">{result.score}</p>
          <p className="text-sm">
            {result.correct}/{result.total} ✅ · {(result.ms / 1000).toFixed(1)}s
          </p>
          {outcome && (
            <p className="text-lg font-bold" role="status">
              {outcome === "win"
                ? lang === "ar"
                  ? "🏆 كسبت صاحبك!"
                  : "🏆 You beat your friend!"
                : outcome === "lose"
                  ? lang === "ar"
                    ? "😅 صاحبك كسبك المرة دي"
                    : "😅 Your friend won this time"
                  : lang === "ar"
                    ? "🤝 تعادل"
                    : "🤝 A tie"}
            </p>
          )}
          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              {lang === "ar"
                ? "ابعت اللينك ده لصاحبك (فيه نتيجتك):"
                : "Send this link to your friend (it carries your result):"}
            </p>
            <div className="mt-1 flex gap-2">
              <input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-2 font-mono text-[11px]"
                aria-label={lang === "ar" ? "رابط التحدي" : "Duel link"}
              />
              <button
                type="button"
                onClick={() => void copy()}
                className="rounded-full border border-subject/40 px-3 text-xs font-semibold text-subject hover:bg-subject/10"
              >
                {copied
                  ? lang === "ar"
                    ? "اتنسخ ✓"
                    : "Copied ✓"
                  : lang === "ar"
                    ? "انسخ"
                    : "Copy"}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPhase("menu")}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
          >
            {l(S.back)}
          </button>
        </div>
      )}
      {phase === "play" && !current && (
        <p className="mt-3 text-sm text-muted-foreground">
          {lang === "ar" ? "لا توجد أسئلة متاحة." : "No questions available."}
        </p>
      )}
    </div>
  );
}
