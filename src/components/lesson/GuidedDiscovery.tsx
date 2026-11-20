import {
  ArrowLeft,
  ArrowRight,
  Check,
  FlaskConical,
  Lightbulb,
  SkipForward,
  Target,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SimulationDef } from "@/data/simulations";
import { useLang } from "@/lib/i18n";
import type { GuidedApi } from "./useGuided";

interface Props {
  sim: SimulationDef;
  guided: GuidedApi;
  onNext: () => void;
  onGoLab: () => void;
}

/** Step 2 in "step-by-step help" mode: one verified task at a time. */
export function GuidedDiscovery({ sim, guided, onNext, onGoLab }: Props) {
  const { t, l, dir } = useLang();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;
  const [hintFor, setHintFor] = useState<string | null>(null);
  const { current, index, total, done, finished } = guided;

  const dots = (
    <ol className="flex items-center gap-1.5" aria-label={t("guidedTitle")}>
      {Array.from({ length: total }, (_, i) => (
        <li
          key={i}
          aria-current={i === index ? "step" : undefined}
          className={
            "h-1.5 w-8 rounded-full transition-colors " +
            (i < index || finished ? "bg-subject" : i === index ? "bg-subject/60" : "bg-muted")
          }
        />
      ))}
    </ol>
  );

  if (finished || !current) {
    return (
      <div className="glass animate-fade-up rounded-3xl p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-bold text-subject">
              <Check className="size-4" /> {t("stepDone")} {t("guidedTitle")}
            </p>
            <ol className="mt-3 grid gap-2 sm:grid-cols-3">
              {sim.explain.map((e, i) => (
                <li
                  key={i}
                  className="flex gap-2.5 rounded-2xl border border-border bg-background/40 p-3 text-sm leading-relaxed"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-subject/15 font-mono text-xs font-bold text-subject">
                    {i + 1}
                  </span>
                  {l(e)}
                </li>
              ))}
            </ol>
          </div>
          <Button variant="subject" className="shrink-0 rounded-full" onClick={onGoLab}>
            <FlaskConical /> {t("goLab")} <Arrow />
          </Button>
        </div>
      </div>
    );
  }

  const insight = sim.explain[current.explainIndex];
  const showHint = hintFor === current.id;

  return (
    <div className="glass animate-fade-up rounded-3xl p-4 sm:p-5" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[11px] uppercase tracking-widest text-subject">
          {t("guidedTitle")} · {t("guidedStep")} {index + 1} {t("of")} {total}
        </p>
        {dots}
      </div>

      <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 text-base font-bold sm:text-lg">
            <Target className="size-5 shrink-0 text-subject" />
            {l(current.title)}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{l(current.task)}</p>
          {showHint && !done && (
            <p className="mt-2 flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-2.5 text-xs">
              <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-warning" />
              {l(current.hint)}
            </p>
          )}
          {done && insight && (
            <p className="mt-3 animate-fade-up rounded-2xl border border-bio/40 bg-bio/10 p-3 text-sm leading-relaxed">
              <span className="font-bold text-bio">{t("stepDone")}</span> {l(insight)}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {!done && (
            <Button
              variant="glass"
              size="sm"
              className="rounded-full"
              onClick={() => setHintFor(current.id)}
            >
              <Lightbulb /> {t("showHint")}
            </Button>
          )}
          {!done && (
            <Button variant="glass" size="sm" className="rounded-full" onClick={onNext}>
              <SkipForward className="rtl:-scale-x-100" /> {t("skipStep")}
            </Button>
          )}
          <Button
            variant="subject"
            size="sm"
            className="rounded-full"
            disabled={!done}
            onClick={onNext}
          >
            {t("nextGuided")} <Arrow />
          </Button>
        </div>
      </div>
    </div>
  );
}
