import { ArrowLeft, ArrowRight, FlaskConical, MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SimulationDef } from "@/data/simulations";
import { useLang } from "@/lib/i18n";

/** Contextual guidance under the stage for steps 2 and 3. */
export function StepGuide({
  sim,
  step,
  onStep,
  prediction,
}: {
  sim: SimulationDef;
  step: number;
  onStep: (s: number) => void;
  /** The student's step-1 guess, shown again so they can compare it with what they see. */
  prediction?: string | null | undefined;
}) {
  const { t, l, dir } = useLang();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  if (step === 2) {
    return (
      <div className="glass animate-fade-up rounded-3xl p-4 sm:p-5">
        <Prediction text={prediction} />
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <ol className="grid flex-1 gap-2 sm:grid-cols-3">
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
          <Button variant="subject" className="shrink-0 rounded-full" onClick={() => onStep(3)}>
            <FlaskConical /> {t("goLab")} <Arrow />
          </Button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="glass animate-fade-up rounded-3xl p-4">
        <Prediction text={prediction} />
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <MonitorPlay className="size-5 shrink-0 text-subject" />
            {t("labHint")}
          </p>
          <Button variant="subject" className="shrink-0 rounded-full" onClick={() => onStep(4)}>
            {t("goQuiz")} <Arrow />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

function Prediction({ text }: { text: string | null | undefined }) {
  const { t } = useLang();
  if (!text) return null;
  return (
    <p className="mb-3 wrap-break-word rounded-2xl border border-subject/30 bg-subject/10 p-3 text-sm">
      <span className="font-bold text-subject">🤔 {t("yourPrediction")}: </span>
      {text}
    </p>
  );
}
