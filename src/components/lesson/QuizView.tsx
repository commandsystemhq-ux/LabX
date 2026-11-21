import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, RotateCcw, Trophy, XCircle } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { LessonLookup } from "@/data/mockCurriculum";
import { buildComparison } from "@/data/quizCompare";
import type { QuizQuestion, SimulationDef } from "@/data/simulations";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { ComparisonBars } from "./ComparisonBars";
import type { QuizApi } from "./useQuiz";

interface Props {
  sim: SimulationDef;
  lookup: LessonLookup;
  quiz: QuizApi;
  onSeeMistake: (q: QuizQuestion, chosen: number) => void;
  xpGained: number;
  nextLesson: LessonLookup | null;
}

export function QuizView({ sim, lookup, quiz, onSeeMistake, xpGained, nextLesson }: Props) {
  const { t, l, lang, dir } = useLang();
  const { user, configured } = useAuth();
  const Forward = dir === "rtl" ? ArrowLeft : ArrowRight;
  const { index, selected, score, done } = quiz.state;

  const q = sim.quiz[index] ?? sim.quiz[0]!;
  const answered = selected !== null;
  const correct = answered && selected === q.correct;
  const comparison = useMemo(
    () => (answered && !correct ? buildComparison(sim, q, selected) : null),
    [sim, q, answered, correct, selected],
  );

  if (done) {
    return (
      <div className="glass flex min-h-105 flex-col items-center justify-center rounded-3xl p-8 text-center lg:min-h-[min(64vh,640px)]">
        <span className="flex size-16 items-center justify-center rounded-3xl bg-gradient-subject text-primary-foreground glow-subject">
          <Trophy className="size-8" />
        </span>
        <h3 className="mt-5 text-2xl font-bold">{t("quizDone")}</h3>
        <p className="mt-2 font-mono text-4xl font-black text-subject">
          {score}/{sim.quiz.length}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">+{xpGained} XP</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t(user ? "progressSavedAccount" : configured ? "progressGuest" : "progressSaved")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="subject-soft" className="rounded-full" onClick={quiz.restart}>
            <RotateCcw /> {t("restartQuiz")}
          </Button>
          {nextLesson && (
            <Button asChild variant="subject" className="rounded-full">
              <Link to="/lesson" search={{ id: nextLesson.lesson.id }}>
                {t("nextLesson")} <Forward />
              </Link>
            </Button>
          )}
          <Button asChild variant={nextLesson ? "glass" : "subject"} className="rounded-full">
            <Link to="/dashboard" search={{ grade: lookup.grade.id, subject: lookup.subject.id }}>
              {t("backToDashboard")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass relative flex min-h-105 flex-col overflow-hidden rounded-3xl p-5 sm:p-8 lg:min-h-[min(64vh,640px)]">
      <div className="absolute -top-24 size-64 rounded-full bg-subject/15 blur-3xl inset-e-0" />
      <div className="relative flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-widest text-subject">
          {t("question")} {index + 1} {t("of")} {sim.quiz.length}
        </p>
        <div className="flex gap-1.5">
          {sim.quiz.map((_, i) => (
            <span
              key={i}
              className={"h-1.5 w-8 rounded-full " + (i <= index ? "bg-subject" : "bg-muted")}
            />
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
              onClick={() => quiz.choose(i, q.correct)}
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
                  (isRight
                    ? "bg-bio text-primary-foreground"
                    : isWrong
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-muted")
                }
              >
                {isRight ? (
                  <CheckCircle2 className="size-4" />
                ) : isWrong ? (
                  <XCircle className="size-4" />
                ) : lang === "ar" ? (
                  "أبجد"[i]
                ) : (
                  "ABCD"[i]
                )}
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
          <Button
            variant="subject"
            className="mt-4 rounded-full"
            onClick={() => quiz.next(sim.quiz.length)}
          >
            {t("next")}
          </Button>
        </div>
      )}

      {answered && !correct && (
        <div
          role="alert"
          className="relative mt-6 animate-fade-up rounded-2xl border border-warning/50 bg-warning/10 p-4"
        >
          <p className="sr-only">{t("wrongAlert")}</p>
          <p className="font-bold text-warning">{t("wrong")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{l(q.explanation)}</p>
          {comparison ? (
            <div className="mt-3">
              <ComparisonBars cmp={comparison} compact />
            </div>
          ) : (
            <p className="mt-2 text-xs">
              <span className="font-semibold text-bio">{t("compareCorrect")}:</span>{" "}
              {l(q.options[q.correct] ?? q.options[0]!)}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (selected !== null) onSeeMistake(q, selected);
                quiz.clear();
              }}
              className="flex animate-pulse-ring items-center gap-2 rounded-full bg-warning px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
            >
              <Eye className="size-4" />
              {t("seeMistake")}
            </button>
            <Button variant="glass" className="rounded-full" onClick={quiz.clear}>
              <RotateCcw /> {t("tryAgain")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
