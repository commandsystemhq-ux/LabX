import { useState } from "react";
import { FIGURES } from "@/data/lessons/supportFigures";
import type { PlotSpec, SupportQuestion } from "@/data/lessons/supportTypes";
import { useLang } from "@/lib/i18n";
import { FigureSvg } from "./FigureSvg";
import { S } from "./strings";

/** A tiny chart used as an answer option: fibrous vs bony tissue against age. */
export function PlotMini({ plot, label }: { plot: PlotSpec; label: string }) {
  const pts = (v: number[]) =>
    v
      .map((y, i) => `${10 + (i * 100) / Math.max(1, v.length - 1)},${70 - (y * 60) / 100}`)
      .join(" ");
  return (
    <svg viewBox="0 0 120 80" className="h-20 w-full" role="img" aria-label={label}>
      <rect x="0" y="0" width="120" height="80" rx="8" fill="#fffdf7" stroke="#cbd5e1" />
      <path d="M10 8V70H112" stroke="#94a3b8" fill="none" />
      <polyline points={pts(plot.fibrous)} fill="none" stroke="#b45309" strokeWidth="2.2" />
      <polyline
        points={pts(plot.bony)}
        fill="none"
        stroke="#0369a1"
        strokeWidth="2.2"
        strokeDasharray="5 3"
      />
    </svg>
  );
}

interface Props {
  q: SupportQuestion;
  /** Called once, right after the student picks. */
  onAnswer: (correct: boolean, chosen: number) => void;
  onNext?: (() => void) | undefined;
  nextLabel?: string | undefined;
  /** "3 / 6" style counter. */
  counter?: string | undefined;
}

export function QuestionCard({ q, onAnswer, onNext, nextLabel, counter }: Props) {
  const { l, t, lang } = useLang();
  const [chosen, setChosen] = useState<number | null>(null);
  const answered = chosen !== null;
  const ok = chosen === q.correct;

  return (
    <div className="rounded-2xl border border-border bg-background/50 p-4">
      <div className="flex items-center justify-between gap-2">
        {counter ? (
          <p className="font-mono text-[11px] uppercase tracking-widest text-subject">{counter}</p>
        ) : (
          <span />
        )}
        {answered && (
          <span className={"text-xs font-bold " + (ok ? "text-bio" : "text-destructive")}>
            {l(ok ? S.correct : S.wrong)}
          </span>
        )}
      </div>
      <h4 className="mt-2 text-base font-bold leading-relaxed">{l(q.prompt)}</h4>
      {q.visual && (
        <div className="mx-auto mt-3 max-w-md">
          <FigureSvg
            figure={FIGURES[q.visual.figure]}
            lang={lang}
            mode="hide"
            marks={q.visual.mark ? [q.visual.mark] : []}
            className="w-full"
          />
        </div>
      )}
      <div
        className={
          "mt-3 grid gap-2 " + (q.options.some((o) => o.plot) ? "grid-cols-2" : "sm:grid-cols-2")
        }
      >
        {q.options.map((o, i) => {
          const isRight = answered && i === q.correct;
          const isWrong = answered && i === chosen && !ok;
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => {
                setChosen(i);
                onAnswer(i === q.correct, i);
              }}
              className={
                "flex flex-col gap-1 rounded-xl border p-3 text-start text-sm font-semibold transition-all " +
                (isRight
                  ? "border-bio bg-bio/15"
                  : isWrong
                    ? "border-destructive bg-destructive/15"
                    : answered
                      ? "border-border opacity-60"
                      : "border-border bg-background/40 hover:-translate-y-0.5 hover:border-subject/60 hover:bg-subject/10")
              }
            >
              {o.plot && <PlotMini plot={o.plot} label={l(o.text)} />}
              <span>{l(o.text)}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div
          role="status"
          className={
            "mt-3 rounded-xl border p-3 text-sm leading-relaxed " +
            (ok ? "border-bio/40 bg-bio/10" : "border-warning/40 bg-warning/10")
          }
        >
          {l(q.explain)}
        </div>
      )}
      {answered && onNext && (
        <button
          type="button"
          onClick={onNext}
          className="mt-3 rounded-full bg-subject px-4 py-2 text-sm font-bold text-primary-foreground hover:brightness-110"
        >
          {nextLabel ?? t("nextLesson")}
        </button>
      )}
    </div>
  );
}
