import {
  AlertOctagon,
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  Radio,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { extras, hazardLevel, type Hazard } from "@/data/simExtras";
import type { Comparison } from "@/data/quizCompare";
import type { SimValues, SimulationDef } from "@/data/simulations";
import { useLang } from "@/lib/i18n";
import { useIsClient } from "@/lib/use-is-client";
import { ComparisonBars } from "./ComparisonBars";
import { HazardBanner } from "./HazardBanner";
import { scenes, type StageView } from "./scenes";
import { useSimClock } from "./scenes/sceneUtils";
import {
  EnergyDiagram,
  EquilibriumShiftPanel,
  EquilibriumTimeline,
  FieldPanel,
  MicroscopeView,
} from "./StageInsets";
import { StageToolbar, type StageLayers } from "./StageToolbar";

/** Shown after a wrong quiz answer: what to look at in the simulation and the numbers behind it. */
export interface DemoInfo {
  note: string;
  comparison: Comparison | null;
}

interface Props {
  sim: SimulationDef;
  values: SimValues;
  step: number;
  playing: boolean;
  onPlayingChange: (v: boolean) => void;
  speed: number;
  onSpeed: (v: number) => void;
  view: StageView;
  onView: (v: StageView) => void;
  layers: StageLayers;
  onLayers: (l: StageLayers) => void;
  resetKey: number;
  onReset: () => void;
  hazards: Hazard[];
  demo: DemoInfo | null;
  onDismissDemo: () => void;
  onBackToQuiz: () => void;
  board: boolean;
  onStartExplain: () => void;
}

/**
 * The 3D viewport container. Today it renders an animated 2D SVG preview of the
 * simulation; the same props (values, view, layers, clock) drive the future 3D scene.
 */
export function SimulationStage(props: Props) {
  const { sim, values, step, view, layers, board, hazards } = props;
  const { t, l, lang, dir } = useLang();
  const time = useSimClock(props.playing, props.speed, props.resetKey);
  // Scenes use Math.sin/cos, whose last digits differ between Node (SSR) and the browser.
  const clientReady = useIsClient();
  const Scene = scenes[sim.id][view];
  const activity = sim.activity(values);
  const readouts = sim.readouts(values);
  const level = hazardLevel(hazards);
  const sx = extras[sim.id];
  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  const showFormula = step === 2;
  const showTimeline = sim.id === "diffusion" && layers["timeline"];
  const showEnergy = sim.id === "reaction-rate" && layers["energy"];
  const showEquilibrium = sim.id === "reaction-rate" && layers["equilibrium"];
  const showField = sim.id === "ohm" && layers["field"];
  const showScope = sim.id === "diffusion" && layers["microscope"];

  return (
    <div
      className={
        "relative isolate overflow-hidden rounded-3xl border bg-stage-grid " +
        (level === 2
          ? "border-destructive/70"
          : level === 1
            ? "border-warning/60"
            : "border-subject/25") +
        " " +
        (board
          ? "h-full"
          : "aspect-[4/3] min-h-[340px] sm:aspect-[16/10] lg:aspect-auto lg:h-[min(64vh,640px)]") +
        (step === 1 && !board ? " max-sm:min-h-[520px]" : "")
      }
    >
      {/* TODO: Mount Three.js Canvas here
          e.g. <Canvas className="absolute inset-0"><SimulationScene3D sim={sim.id} view={view} values={values} time={time} layers={layers} hazard={level} /></Canvas>
          and remove the SVG preview layer below. */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pb-20 pt-14" dir="ltr">
        <div
          key={view}
          className={"h-full w-full animate-fade-up " + (level === 2 ? "animate-shake" : "")}
        >
          {clientReady && (
            <Scene
              t={time}
              values={values}
              activity={activity}
              labels={layers["labels"] ?? false}
              flow={layers["flow"] ?? false}
              layers={layers}
              hazard={level}
            />
          )}
        </div>
      </div>

      {/* Hazard tint: slow pulse for warnings, hard pulse for critical failures */}
      {level > 0 && (
        <div
          aria-hidden
          className={
            "pointer-events-none absolute inset-0 z-[5] " +
            (level === 2 ? "animate-hazard-critical" : "animate-hazard-warning")
          }
        />
      )}

      {/* Corner brackets */}
      {[
        "top-3 left-3 border-t-2 border-l-2",
        "top-3 right-3 border-t-2 border-r-2",
        "bottom-3 left-3 border-b-2 border-l-2",
        "bottom-3 right-3 border-b-2 border-r-2",
      ].map((c) => (
        <span
          key={c}
          className={`pointer-events-none absolute size-5 rounded-sm border-subject/50 ${c}`}
        />
      ))}

      {/* HUD */}
      <div className="absolute inset-x-4 top-4 z-10 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="glass flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
            <Radio
              className={
                "size-3 " +
                (props.playing ? "animate-blink text-destructive" : "text-muted-foreground")
              }
            />
            {props.playing ? "live" : "paused"}
          </span>
          <span className="glass rounded-full px-2.5 py-1 text-[11px] font-semibold text-subject">
            {t(view)}
          </span>
          {level > 0 && (
            <span
              className={
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold " +
                (level === 2
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-warning text-primary-foreground")
              }
            >
              {level === 2 ? (
                <AlertOctagon className="size-3" />
              ) : (
                <TriangleAlert className="size-3" />
              )}
              {level === 2 ? t("critical") : t("warning")}
            </span>
          )}
        </div>
        <span className="glass hidden rounded-full px-2.5 py-1 font-mono text-[10px] text-muted-foreground sm:inline">
          VIEWPORT · 3D-READY · {sx.effect} · t={time.toFixed(1)}s
        </span>
      </div>

      {/* Board mode: big readouts for the classroom */}
      {board && (
        <div className="absolute end-4 top-16 z-10 flex flex-col gap-2">
          {readouts.map((r) => (
            <div key={r.key} className="glass rounded-2xl px-4 py-2 text-end">
              <p className="text-xs text-muted-foreground">{l(r.label)}</p>
              <p className="font-mono text-3xl font-bold text-subject">
                {Number.isFinite(r.value) ? r.value.toFixed(r.digits) : "∞"}{" "}
                <span className="text-base text-muted-foreground">{r.unit}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Step 1 — story overlay */}
      {step === 1 && !board && (
        <div className="absolute inset-0 z-20 flex overflow-y-auto bg-background/55 p-3 backdrop-blur-[2px] sm:p-4">
          <div className="glass-strong m-auto max-w-lg animate-fade-up rounded-3xl p-5 glow-subject sm:p-6">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-subject">
              <Sparkles className="size-3.5" />
              {lang === "ar" ? "قصة من الواقع" : "Real-world story"}
            </p>
            <h3 className="mt-3 text-xl font-bold sm:text-2xl">{l(sim.story.title)}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {l(sim.story.body)}
            </p>
            <p className="mt-4 rounded-2xl border border-subject/30 bg-subject/10 p-3 text-sm font-semibold">
              🤔 {l(sim.story.question)}
            </p>
            <button
              type="button"
              onClick={props.onStartExplain}
              className="mt-5 w-full rounded-full bg-subject py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
            >
              {t("startExplain")}
            </button>
          </div>
        </div>
      )}

      {/* Top overlay column: quiz demo or hazard banner, then insets (formula, timeline, energy) */}
      <div className="pointer-events-none absolute inset-x-3 top-12 z-20 flex flex-col items-start gap-2 [&>*]:pointer-events-auto">
        {props.demo ? (
          <div className="mx-auto w-full max-w-xl animate-fade-up">
            <div className="flex flex-col gap-3 rounded-2xl border border-warning/50 bg-background/92 p-3 backdrop-blur-md">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 animate-pulse-ring items-center justify-center rounded-full bg-warning/20 text-warning">
                  <Lightbulb className="size-4" />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-warning">{t("demoMode")}</p>
                  <p className="mt-0.5 text-sm">{props.demo.note}</p>
                </div>
                <button
                  type="button"
                  onClick={props.onDismissDemo}
                  aria-label={t("hideNote")}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
              {props.demo.comparison && <ComparisonBars cmp={props.demo.comparison} compact />}
              <button
                type="button"
                onClick={props.onBackToQuiz}
                className="flex items-center justify-center gap-2 rounded-full bg-warning px-4 py-2 text-sm font-bold text-primary-foreground transition hover:brightness-110"
              >
                <BackArrow className="size-4" /> {t("backToQuiz")}
              </button>
            </div>
          </div>
        ) : (
          <>
            {level > 0 && (
              <div className="mx-auto w-full max-w-xl">
                <HazardBanner hazards={hazards} />
              </div>
            )}
            {step !== 1 &&
              (showFormula ||
                showTimeline ||
                showEnergy ||
                showEquilibrium ||
                showField ||
                showScope) && (
                <div
                  className={
                    "flex w-56 max-w-[60%] flex-col gap-2 " + (level > 0 ? "max-sm:hidden" : "")
                  }
                >
                  {showFormula && (
                    <div className="glass-strong animate-fade-up rounded-2xl px-4 py-3" dir="ltr">
                      <p className="font-display text-2xl font-bold text-subject">{sim.formula}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {sim.formulaLive(values)}
                      </p>
                    </div>
                  )}
                  {showTimeline && <EquilibriumTimeline values={values} time={time} />}
                  {showEnergy && <EnergyDiagram catalyst={values.catalyst} />}
                  {showEquilibrium && <EquilibriumShiftPanel values={values} />}
                  {showField && <FieldPanel values={values} />}
                  {showScope && <MicroscopeView values={values} view={view} />}
                </div>
              )}
          </>
        )}
      </div>
      {/* Floating toolbar */}
      <div className="absolute inset-x-3 bottom-3 z-10 flex justify-center">
        <StageToolbar
          playing={props.playing}
          onPlayingChange={props.onPlayingChange}
          speed={props.speed}
          onSpeed={props.onSpeed}
          onReset={props.onReset}
          layerDefs={sx.layers}
          layers={layers}
          onLayers={props.onLayers}
          view={view}
          onView={props.onView}
        />
      </div>
    </div>
  );
}
