import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { FIGURES } from "@/data/lessons/supportFigures";
import type { SceneView } from "@/data/lessons/supportTypes";
import { useLang } from "@/lib/i18n";
import { detectWebGL } from "../scenes/AdrenalineStage";
import { isHumanFocus, isPlantFocus } from "./boneFocus";
import { FigureSvg } from "./FigureSvg";
import type { SceneState, StageMode } from "./sceneState";
import { S } from "./strings";

// Each engine is its own chunk, only fetched in a browser with WebGL and only when shown.
const BoneCanvas = lazy(() => import("./BoneCanvas"));
const PlantCanvas = lazy(() => import("./PlantCanvas"));

class Boundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch() {
    /* WebGL / model failure: the 2D exam figure keeps the lesson usable. */
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

interface Props {
  views: SceneView[];
  viewIndex: number;
  onView: (i: number) => void;
  mode: StageMode;
  onMode: (m: StageMode) => void;
  /** 2D / plant labels on (false hides the data for practice). */
  labels: boolean;
  onLabels: (on: boolean) => void;
  scene: SceneState;
  selected: string | null;
  onSelect: (group: string | null) => void;
  /** A part (or marker) was tapped in 3D. */
  onPick: (group: string) => void;
}

/**
 * The stage: one scene shown either as the live 3D model or as the ministry-style 2D figure. The
 * Blueprint toggle swaps them instantly while keeping the same part highlighted.
 */
export function Scene({
  views,
  viewIndex,
  onView,
  mode,
  onMode,
  labels,
  onLabels,
  scene,
  selected,
  onSelect,
  onPick,
}: Props) {
  const { l, lang } = useLang();
  const ar = lang === "ar";
  const view = views[Math.min(viewIndex, views.length - 1)]!;
  const [webgl, setWebgl] = useState<boolean | null>(null);
  useEffect(() => setWebgl(detectWebGL()), []);

  const figure = (
    <div className="flex h-full flex-col justify-center rounded-2xl bg-[#fffdf7] p-2">
      <FigureSvg
        figure={FIGURES[view.figure]}
        lang={lang}
        mode={labels ? "show" : "hide"}
        marks={scene.highlight}
        className={"mx-auto w-full " + (FIGURES[view.figure].h > 400 ? "max-h-140" : "max-h-105")}
      />
      <p className="mt-1 text-center text-[11px] text-slate-500">{l(FIGURES[view.figure].title)}</p>
    </div>
  );

  const want3d = mode === "3d";
  const placeholder = (msg: string) => (
    <div
      role="status"
      className="flex h-full min-h-80 items-center justify-center rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground"
    >
      {msg}
    </div>
  );

  let body: ReactNode;
  if (!want3d) body = figure;
  else if (webgl === null) body = placeholder(l(S.loading3d));
  else if (!webgl)
    body = (
      <div className="h-full">
        <p className="mb-2 rounded-xl border border-warning/40 bg-warning/10 p-2 text-xs">
          {l(S.noWebgl)}
        </p>
        {figure}
      </div>
    );
  else {
    body = (
      <Boundary
        fallback={
          <div className="h-full">
            <p className="mb-2 rounded-xl border border-warning/40 bg-warning/10 p-2 text-xs">
              {l(S.noWebgl)}
            </p>
            {figure}
          </div>
        }
      >
        <Suspense fallback={placeholder(l(S.loading3d))}>
          {isPlantFocus(view.focus) ? (
            <PlantCanvas
              key={view.focus}
              focus={view.focus}
              scene={scene}
              ar={ar}
              labels={labels}
            />
          ) : isHumanFocus(view.focus) ? (
            <BoneCanvas
              key={view.focus}
              focus={view.focus}
              scene={scene}
              selected={selected}
              ar={ar}
              onPick={onPick}
              onSelect={onSelect}
            />
          ) : null}
        </Suspense>
      </Boundary>
    );
  }

  return (
    <section aria-label={l(S.title)} className="glass flex flex-col gap-2 rounded-3xl p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border border-border bg-background/50 p-0.5" role="group">
          {(["3d", "2d"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => onMode(m)}
              className={
                "rounded-full px-3 py-1.5 text-xs font-bold transition " +
                (mode === m
                  ? "bg-subject text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {l(m === "3d" ? S.blueprint3d : S.blueprint2d)}
            </button>
          ))}
        </div>
        {(mode === "2d" || isPlantFocus(view.focus)) && (
          <button
            type="button"
            aria-pressed={!labels}
            onClick={() => onLabels(!labels)}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent"
          >
            {l(labels ? S.hideLabels : S.showLabels)}
          </button>
        )}
        {views.length > 1 && (
          <div className="ms-auto flex flex-wrap gap-1" role="group">
            {views.map((v, i) => (
              <button
                key={i}
                type="button"
                aria-pressed={i === viewIndex}
                onClick={() => onView(i)}
                className={
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold " +
                  (i === viewIndex
                    ? "border-subject bg-subject/20"
                    : "border-border hover:bg-accent")
                }
              >
                {l(v.label)}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="h-[min(56vh,520px)] min-h-80">{body}</div>
    </section>
  );
}
