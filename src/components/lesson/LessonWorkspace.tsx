import { Minimize2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getNextLesson, type LessonLookup } from "@/data/mockCurriculum";
import { buildComparison, demoValues } from "@/data/quizCompare";
import { extras, lessonLayers } from "@/data/simExtras";
import {
  defaultsOf,
  lessonDefaults,
  simulations,
  type QuizQuestion,
  type SimKey,
  type SimValues,
  type ValueChange,
} from "@/data/simulations";
import { buildIdleHint, type ControlMode, type TutorContext } from "@/data/tutor";
import { useNoorControl, useNoorOpen } from "@/components/noor/NoorProvider";
import { useLang } from "@/lib/i18n";
import { progressStore } from "@/lib/progress";
import { useProgress } from "@/lib/use-progress";
import { ControlPanel } from "./ControlPanel";
import { GuidedDiscovery } from "./GuidedDiscovery";
import { IdleHintCard } from "./IdleHintCard";
import { LessonHeader } from "./LessonHeader";
import { QuizView } from "./QuizView";
import type { StageView } from "./scenes";
import { SimulationStage, type DemoInfo } from "./SimulationStage";
import type { StageLayers } from "./StageToolbar";
import { StepGuide } from "./StepGuide";
import { useGuided } from "./useGuided";
import { useIdleHint } from "./useIdleHint";
import { useQuiz } from "./useQuiz";

export function LessonWorkspace({ lookup }: { lookup: LessonLookup }) {
  const { t, l, lang } = useLang();
  const sim = simulations[lookup.lesson.simulationId];
  const sx = extras[sim.id];
  const lessonId = lookup.lesson.id;
  const nextLesson = useMemo(() => getNextLesson(lessonId), [lessonId]);
  const savedStep = useProgress().lessons[lessonId]?.step ?? 1;
  const preset = lookup.lesson.preset;
  // Lesson-specific starting scene. The quiz demos/comparison stay anchored to the model defaults.
  const lessonBase = useMemo(() => lessonDefaults(sim, preset), [sim, preset]);

  const [values, setValues] = useState<SimValues>(() => lessonBase);
  const [step, setStepState] = useState(1);
  const [reachedStep, setReachedStep] = useState(1);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState<StageView>(preset?.view ?? "macro");
  const [layers, setLayers] = useState<StageLayers>(() => lessonLayers(sim.id, preset));
  const [resetKey, setResetKey] = useState(0);
  const [demo, setDemo] = useState<DemoInfo | null>(null);
  // Noor lives at the app root; this page only tells it what is on screen.
  const tutorOpen = useNoorOpen();
  const { setOpen: setTutorOpen, setLesson: setNoorLesson } = useNoorControl();
  const [board, setBoard] = useState(false);
  const [lastChange, setLastChange] = useState<ValueChange | null>(null);
  const [mode, setMode] = useState<ControlMode>("guided");
  const [errorMode, setErrorMode] = useState(false);
  const [xpGained, setXpGained] = useState(0);

  const quiz = useQuiz();
  const guided = useGuided(sx.guided, values);
  const hazards = useMemo(() => sx.hazards(values), [sx, values]);

  const {
    current: guidedCurrent,
    index: guidedIndex,
    total: guidedTotal,
    done: guidedDone,
  } = guided;
  const tutorGuided = useMemo<TutorContext["guided"]>(
    () =>
      guidedCurrent
        ? { index: guidedIndex, total: guidedTotal, step: guidedCurrent, done: guidedDone }
        : null,
    [guidedCurrent, guidedIndex, guidedTotal, guidedDone],
  );
  const tutorCtx = useMemo<TutorContext>(
    () => ({
      lang,
      values,
      change: lastChange,
      step,
      mode,
      view,
      hazards,
      errorMode,
      guided: tutorGuided,
    }),
    [lang, values, lastChange, step, mode, view, hazards, errorMode, tutorGuided],
  );

  useEffect(() => {
    setNoorLesson({ lessonId, sim, ctx: tutorCtx, hidden: board });
  }, [setNoorLesson, lessonId, sim, tutorCtx, board]);
  useEffect(() => () => setNoorLesson(null), [setNoorLesson]);

  // A fresh object whenever the student does something; the idle timer restarts on each one.
  const quizState = quiz.state;
  const idleActivity = useMemo(
    () => ({
      values,
      step,
      mode,
      view,
      layers,
      errorMode,
      demo,
      quizState,
      guidedIndex,
      guidedDone,
    }),
    [values, step, mode, view, layers, errorMode, demo, quizState, guidedIndex, guidedDone],
  );
  const idle = useIdleHint({
    // Never interrupts the free lab (step 3), an open tutor, board mode or a finished quiz.
    enabled: step !== 3 && !board && !tutorOpen && !(step === 4 && quiz.state.done),
    activity: idleActivity,
  });
  const idleText = idle.visible ? buildIdleHint(sim, tutorCtx) : null;

  const dragStart = useRef<{ key: SimKey; from: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const quizSaved = useRef(false);

  const applyGuidedStart = (index: number) => {
    const s = sx.guided[index];
    if (!s) return;
    setValues({ ...lessonBase, ...s.start });
    setLastChange(null);
    dragStart.current = null;
  };

  const goStep = (s: number) => {
    if (s === 2 && step !== 2 && mode === "guided" && !guided.finished) {
      applyGuidedStart(guided.index);
    }
    // Free exploration after the guided walkthrough.
    if (s === 3 && step <= 2) setMode("free");
    setStepState(s);
    setReachedStep((m) => Math.max(m, s));
    if (s !== 3) setDemo(null);
    progressStore.recordStep(lessonId, s);
  };

  const onChange = (key: SimKey, value: number) => {
    setValues((prev) => {
      if (!dragStart.current || dragStart.current.key !== key) {
        dragStart.current = { key, from: prev[key] };
      }
      return { ...prev, [key]: value };
    });
  };

  const onCommit = (key: SimKey, value: number) => {
    const from = dragStart.current?.key === key ? dragStart.current.from : value;
    dragStart.current = null;
    if (from !== value) setLastChange({ key, from, to: value });
  };

  const onFault = (id: number) => {
    setValues((v) => ({ ...v, fault: id }));
    setPlaying(true);
  };

  const onErrorMode = (enabled: boolean) => {
    setErrorMode(enabled);
    if (!enabled) setValues((v) => (v.fault === 0 ? v : { ...v, fault: 0 }));
  };

  const reset = () => {
    setValues(lessonBase);
    setResetKey((k) => k + 1);
    setDemo(null);
    setLastChange(null);
    setPlaying(true);
  };

  const onGuidedNext = () => {
    const nextIndex = guided.index + 1;
    guided.advance();
    if (nextIndex < sx.guided.length) applyGuidedStart(nextIndex);
  };

  const seeMistake = (q: QuizQuestion, chosen: number) => {
    const base = defaultsOf(sim);
    const after = demoValues(sim, q);
    const changed = (Object.keys(q.demo) as SimKey[]).find(
      (k) => k !== "fault" && after[k] !== base[k],
    );
    setLastChange(changed ? { key: changed, from: base[changed], to: after[changed] } : null);
    setValues(after);
    setResetKey((k) => k + 1);
    if (after.fault !== 0) setErrorMode(true);
    if (q.demoView) setView(q.demoView);
    setPlaying(true);
    goStep(3);
    setDemo({ note: l(q.demoNote), comparison: buildComparison(sim, q, chosen) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Save the quiz result once per completion (guarded for StrictMode double effects).
  useEffect(() => {
    if (!quiz.state.done) {
      quizSaved.current = false;
      return;
    }
    if (quizSaved.current) return;
    quizSaved.current = true;
    setXpGained(progressStore.recordQuiz(lessonId, quiz.state.score, sim.quiz.length).xpGained);
  }, [quiz.state.done, quiz.state.score, lessonId, sim.quiz.length]);

  // Board mode: try native fullscreen, always fall back to a fixed overlay.
  const enterBoard = () => {
    setBoard(true);
    setTutorOpen(false);
    if (step === 1 || step === 4) goStep(3);
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
      hazards={hazards}
      demo={demo}
      onDismissDemo={() => setDemo(null)}
      onBackToQuiz={() => goStep(4)}
      board={board}
      onStartExplain={() => goStep(2)}
    />
  );

  const guidedActive = step === 2 && mode === "guided";

  return (
    <div className="flex flex-col gap-4">
      <LessonHeader
        lookup={lookup}
        step={step}
        maxStep={Math.max(reachedStep, savedStep)}
        onStep={goStep}
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
              {step === 4 ? (
                <QuizView
                  sim={sim}
                  lookup={lookup}
                  quiz={quiz}
                  onSeeMistake={seeMistake}
                  xpGained={xpGained}
                  nextLesson={nextLesson}
                />
              ) : (
                stage
              )}
              {guidedActive ? (
                <GuidedDiscovery
                  sim={sim}
                  guided={guided}
                  onNext={onGuidedNext}
                  onGoLab={() => goStep(3)}
                />
              ) : (
                <StepGuide sim={sim} step={step} onStep={goStep} />
              )}
            </div>
            {/* Control & live graph panel (35%) — on the right in Arabic */}
            <div className="min-w-0 lg:order-first">
              <ControlPanel
                sim={sim}
                values={values}
                onChange={onChange}
                onCommit={onCommit}
                mode={mode}
                onMode={setMode}
                errorMode={errorMode}
                onErrorMode={onErrorMode}
                onFault={onFault}
                focusKey={guidedActive && !guided.finished ? (guided.current?.focus ?? null) : null}
              />
            </div>
          </>
        )}
      </div>

      {!board && idleText && (
        <IdleHintCard
          text={idleText}
          onAskTutor={() => setTutorOpen(true)}
          onSnooze={idle.snooze}
          onDismiss={idle.dismiss}
        />
      )}
    </div>
  );
}
