import { Link } from "@tanstack/react-router";
import { CheckCircle2, Eye, RotateCcw, Trophy, XCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { QuizQuestion, SimulationDef } from "@/data/simulations";
import { useLang } from "@/lib/i18n";

interface Props {
  sim: SimulationDef;
  onSeeMistake: (q: QuizQuestion) => void;
}

export function QuizView({ sim, onSeeMistake }: Props) {
  const { t, l, lang } = useLang();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(false);
  const [done, setDone] = useState(false);

  const q = sim.quiz[index] ?? sim.quiz[0]!;
  const answered = selected !== null;
  const correct = answered && selected === q.correct;

  const choose = (i: number) => {
    if (answered) return;
    setSelected(i);
    if (i === q.correct && !missed) setScore((s) => s + 1);
    if (i !== q.correct) setMissed(true);
  };

  const next = () => {
    if (index + 1 >= sim.quiz.length) {
      setDone(true);
      return;
    }
    setIndex(index + 1);
    setSelected(null);
    setMissed(false);
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setMissed(false);
    setDone(false);
  };

  if (done) {
    return (
      <div className="glass flex min-h-[420px] flex-col items-center justify-center rounded-3xl p-8 text-center lg:h-[min(64vh,640px)]">
        <span className="flex size-16 items-center justify-center rounded-3xl bg-gradient-subject text-primary-foreground glow-subject">
          <Trophy className="size-8" />
        </span>
        <h3 className="mt-5 text-2xl font-bold">{t("quizDone")}</h3>
        <p className="mt-2 font-mono text-4xl font-black text-subject">
          {score}/{sim.quiz.length}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">+{score * 25} XP</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="subject-soft" className="rounded-full" onClick={restart}>
            <RotateCcw /> {t("restartQuiz")}
          </Button>
          <Button asChild variant="subject" className="rounded-full">
            <Link to="/dashboard">{t("backToDashboard")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass relative flex min-h-[420px] flex-col overflow-hidden rounded-3xl p-5 sm:p-8 lg:h-[min(64vh,640px)]">
      <div className="absolute -top-24 size-64 rounded-full bg-subject/15 blur-3xl end-0" />
      <div className="relative flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-widest text-subject">
          {t("question")} {index + 1} {t("of")} {sim.quiz.length}
        </p>
        <div className="flex gap-1.5">
          {sim.quiz.map((_, i) => (
            <span key={i} className={"h-1.5 w-8 rounded-full " + (i <= index ? "bg-subject" : "bg-muted")} />
          ))}
        </div>
      </div>

      <h3 className="relative mt-5 text-xl font-bold leading-relaxed sm:text-2xl">{l(q.prompt)}</h3>

      <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
        {q.options.map((opt, i) => {
          const isSel = selected === i;
          const isRight = answered && i === q.correct && correct;
          const isWrong = isSel && !correct;
          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              disabled={answered}
              className={
                "flex items-center gap-3 rounded-2xl border p-4 text-start text-sm font-semibold transition-all " +
                (isRight
                  ? "border-bio bg-bio/15"
                  : isWrong
                    ? "border-destructive bg-destructive/15"
                    : answered
                      ? "border-border opacity-60"
                      : "border-border bg-background/40 hover:-translate-y-0.5 hover:border-subject/60 hover:bg-subject/10")
              }
            >
              <span
                className={
                  "flex size-8 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold " +
                  (isRight ? "bg-bio text-primary-foreground" : isWrong ? "bg-destructive text-destructive-foreground" : "bg-muted")
                }
              >
                {isRight ? <CheckCircle2 className="size-4" /> : isWrong ? <XCircle className="size-4" /> : lang === "ar" ? "أبجد"[i] : "ABCD"[i]}
              </span>
              {l(opt)}
            </button>
          );
        })}
      </div>

      {answered && correct && (
        <div className="relative mt-6 animate-fade-up rounded-2xl border border-bio/40 bg-bio/10 p-4">
          <p className="font-bold text-bio">{t("correct")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{l(q.explanation)}</p>
          <Button variant="subject" className="mt-4 rounded-full" onClick={next}>
            {t("next")}
          </Button>
        </div>
      )}

      {answered && !correct && (
        <div className="relative mt-6 animate-fade-up rounded-2xl border border-warning/50 bg-warning/10 p-4">
          <p className="font-bold text-warning">{t("wrong")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{l(q.explanation)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                onSeeMistake(q);
              }}
              className="flex animate-pulse-ring items-center gap-2 rounded-full bg-warning px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
            >
              <Eye className="size-4" />
              {t("seeMistake")}
            </button>
            <Button variant="glass" className="rounded-full" onClick={() => setSelected(null)}>
              <RotateCcw /> {t("tryAgain")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
