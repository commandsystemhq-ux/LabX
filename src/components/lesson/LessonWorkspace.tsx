import { Minimize2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LessonLookup } from "@/data/mockCurriculum";
import {
  defaultsOf,
  simulations,
  type QuizQuestion,
  type SimKey,
  type SimValues,
  type ValueChange,
} from "@/data/simulations";
import { useLang } from "@/lib/i18n";
import { AITutorDrawer } from "./AITutorDrawer";
import { ControlPanel } from "./ControlPanel";
import { LessonHeader } from "./LessonHeader";
import { QuizView } from "./QuizView";
import type { StageView } from "./scenes";
import { SimulationStage } from "./SimulationStage";
import type { StageLayers } from "./StageToolbar";
import { StepGuide } from "./StepGuide";

export function LessonWorkspace({ lookup }: { lookup: LessonLookup }) {
  const { t, l } = useLang();
  const sim = simulations[lookup.lesson.simulationId];

  const [values, setValues] = useState<SimValues>(() => defaultsOf(sim));
  const [step, setStepState] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState<StageView>("macro");
  const [layers, setLayers] = useState<StageLayers>({ labels: true, flow: true });
  const [resetKey, setResetKey] = useState(0);
  const [demoNote, setDemoNote] = useState<string | null>(null);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [board, setBoard] = useState(false);
  const [lastChange, setLastChange] = useState<ValueChange | null>(null);

  const dragStart = useRef<{ key: SimKey; from: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const setStep = useCallback((s: number) => {
    setStepState(s);
    setMaxStep((m) => Math.max(m, s));
    if (s !== 3) setDemoNote(null);
  }, []);

  const onChange = (key: SimKey, value: number) => {
    setValues((prev) => {
      if (!dragStart.current || dragStart.current.key !== key)
        dragStart.current = { key, from: prev[key] };
      return { ...prev, [key]: value };
    });
  };

  const onCommit = (key: SimKey, value: number) => {
    const from = dragStart.current?.key === key ? dragStart.current.from : value;
    dragStart.current = null;
    if (from !== value) setLastChange({ key, from, to: value });
  };

  const reset = () => {
    setValues(defaultsOf(sim));
    setResetKey((k) => k + 1);
    setDemoNote(null);
    setLastChange(null);
    setPlaying(true);
  };

  const seeMistake = (q: QuizQuestion) => {
    const keys = Object.keys(q.demo) as SimKey[];
    const changed = keys.find((k) => q.demo[k] !== undefined && q.demo[k] !== values[k]);
    if (changed)
      setLastChange({
        key: changed,
        from: values[changed],
        to: q.demo[changed] ?? values[changed],
      });
    setValues({ ...values, ...q.demo });
    if (q.demoView) setView(q.demoView);
    setPlaying(true);
    setStep(3);
    setDemoNote(l(q.demoNote));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Board mode: try native fullscreen, always fall back to a fixed overlay.
  const enterBoard = () => {
    setBoard(true);
    setTutorOpen(false);
    if (step === 1 || step === 4) setStep(3);
    const el = boardRef.current;
    if (el?.requestFullscreen) el.requestFullscreen().catch(() => {});
  };
  const exitBoard = () => {
    setBoard(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };

  useEffect(() => {
    const onFs = () => {
      if (!document.fullscreenElement) setBoard(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBoard(false);
    };
    document.addEventListener("fullscreenchange", onFs);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const stage = (
    <SimulationStage
      sim={sim}
      values={values}
      step={step}
      playing={playing}
      onPlayingChange={setPlaying}
      speed={speed}
      onSpeed={setSpeed}
      view={view}
      onView={setView}
      layers={layers}
      onLayers={setLayers}
      resetKey={resetKey}
      onReset={reset}
      demoNote={demoNote}
      onDismissDemo={() => setDemoNote(null)}
      board={board}
      onStartExplain={() => setStep(2)}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <LessonHeader
        lookup={lookup}
        step={step}
        maxStep={maxStep}
        onStep={setStep}
        onBoard={enterBoard}
      />

      <div
        ref={boardRef}
        className={
          board
            ? "fixed inset-0 z-[60] flex flex-col gap-3 bg-background p-3 sm:p-4"
            : "grid gap-4 lg:grid-cols-[minmax(0,35fr)_minmax(0,65fr)]"
        }
      >
        {board ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-lg font-bold">
                {lookup.subject.emoji} {l(lookup.lesson.title)}
              </p>
              <button
                type="button"
                onClick={exitBoard}
                className="glass flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold hover:text-subject"
              >
                <Minimize2 className="size-4" /> {t("exitBoard")}
              </button>
            </div>
            <div className="min-h-0 flex-1">{stage}</div>
          </>
        ) : (
          <>
            {/* Stage column (65%) — first on mobile */}
            <div className="flex min-w-0 flex-col gap-4">
              {step === 4 ? <QuizView sim={sim} onSeeMistake={seeMistake} /> : stage}
              <StepGuide sim={sim} step={step} onStep={setStep} />
            </div>
            {/* Control & live graph panel (35%) — on the right in Arabic */}
            <div className="min-w-0 lg:order-first">
              <ControlPanel sim={sim} values={values} onChange={onChange} onCommit={onCommit} />
            </div>
          </>
        )}
      </div>

      {!board && (
        <AITutorDrawer
          open={tutorOpen}
          onOpenChange={setTutorOpen}
          sim={sim}
          values={values}
          lastChange={lastChange}
        />
      )}
    </div>
  );
}
