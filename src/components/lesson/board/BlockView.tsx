import { useEffect, useMemo, useState } from "react";
import type { FeynmanReview } from "@/data/lessons/supportNoor";
import type { SupportMistake } from "@/data/lessons/supportNoor";
import type { SupportBlock, SupportQuestion } from "@/data/lessons/supportTypes";
import { useLang, type L10n } from "@/lib/i18n";
import { CompareArena } from "./CompareArena";
import { DepositLab, LabelLab, type TaskEvent } from "./DrawingLab";
import { ExamTrap } from "./ExamTrap";
import { FeynmanCheck } from "./FeynmanCheck";
import { GraphLab } from "./GraphLab";
import { AchillesTool, PelvisTool, RadiusTool } from "./LabTools";
import { MatchTaskView, NumericTaskView, PickTaskView, type IncomingPick } from "./LabTasks";
import { QuestionCard } from "./QuestionCard";
import { EMPTY_SCENE, type SceneState, type StageMode } from "./sceneState";
import { Scene } from "./Scene";
import { S } from "./strings";

export type Phase = "hook" | "board" | "lab" | "quiz";

export interface BlockViewProps {
  block: SupportBlock;
  phase: Phase;
  onPhase: (p: Phase) => void;
  /** The option chosen on the hook question (null = not answered yet). */
  hookChoice: number | null;
  onHook: (choice: number) => void;
  mode: StageMode;
  onMode: (m: StageMode) => void;
  labels: boolean;
  onLabels: (on: boolean) => void;
  onTaskEvent: (e: TaskEvent) => void;
  /** An item (question, hook) was answered. */
  onItem: (block: number, itemId: string, ok: boolean, mistake?: SupportMistake) => void;
  onAction: (a: L10n) => void;
  onSaveNote: (title: string, text: string, block: number, kind: "experiment") => void;
  onSaveDrawing: (
    block: number,
    drawing:
      | { type: "labels"; figure: string; placed: Record<string, string> }
      | { type: "curve"; figure: string; values: number[] },
    title: L10n,
  ) => void;
  onAskNoor: (text: string) => void;
  onFeynman: (answer: string, review: FeynmanReview) => void;
  /** All quiz answers of the block are in: `score` of `total` were right. */
  onComplete: (score: number, total: number) => void;
  completed: boolean;
  hasNext: boolean;
  onNextBlock: () => void;
}

const PHASES: { id: Phase; label: L10n }[] = [
  { id: "hook", label: S.phaseHook },
  { id: "board", label: S.phaseBoard },
  { id: "lab", label: S.phaseLab },
  { id: "quiz", label: S.phaseQuiz },
];

/** One micro-block: question first → live board → hands-on lab → back to the question + quiz + explain. */
export function BlockView(p: BlockViewProps) {
  const { block } = p;
  const { l } = useLang();
  const [viewIndex, setViewIndex] = useState(0);
  const [scene, setScene] = useState<SceneState>(EMPTY_SCENE);
  const [selected, setSelected] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<IncomingPick | null>(null);
  const [tab, setTab] = useState<"simple" | "book" | "trap">("simple");

  const patch = (x: Partial<SceneState>) => setScene((s) => ({ ...s, ...x }));
  const hasStage = p.phase !== "hook";

  const onPick = (group: string) => setIncoming((i) => ({ group, seq: (i?.seq ?? 0) + 1 }));

  return (
    <div className="space-y-3">
      <ol className="flex flex-wrap gap-1.5" aria-label="phases">
        {PHASES.map((ph, i) => {
          const reached = PHASES.findIndex((x) => x.id === p.phase) >= i;
          return (
            <li key={ph.id}>
              <button
                type="button"
                disabled={!reached && p.hookChoice === null}
                onClick={() => p.onPhase(ph.id)}
                aria-current={p.phase === ph.id ? "step" : undefined}
                className={
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition " +
                  (p.phase === ph.id
                    ? "border-subject bg-subject/25"
                    : reached
                      ? "border-border bg-background/50 hover:bg-accent"
                      : "border-border opacity-50")
                }
              >
                {l(ph.label)}
              </button>
            </li>
          );
        })}
      </ol>

      {p.phase === "hook" && <HookStep {...p} />}

      {hasStage && (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
          <Scene
            views={block.labConfig.views}
            viewIndex={viewIndex}
            onView={(i) => {
              setViewIndex(i);
              setSelected(null);
            }}
            mode={p.mode}
            onMode={p.onMode}
            labels={p.labels}
            onLabels={p.onLabels}
            scene={scene}
            selected={selected}
            onSelect={setSelected}
            onPick={onPick}
          />
          <div className="min-w-0 space-y-3">
            {p.phase === "board" && (
              <BoardPanel
                {...p}
                tab={tab}
                onTab={setTab}
                onHighlight={(g) => patch({ highlight: g })}
              />
            )}
            {p.phase === "lab" && (
              <LabPanel {...p} scene={scene} onScene={patch} incoming={incoming} />
            )}
            {p.phase === "quiz" && <QuizPanel {...p} />}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- 1 · hook ---------------------------------- */

function HookStep(p: BlockViewProps) {
  const { block } = p;
  const { l } = useLang();
  const h = block.hookQuestion;
  const answered = p.hookChoice !== null;
  return (
    <section className="glass rounded-3xl p-5 sm:p-8">
      <p className="text-sm font-bold text-subject">
        {block.emoji} {l(S.block)} {block.n} — {l(block.title)}
      </p>
      <h3 className="mt-3 text-xl font-bold leading-relaxed sm:text-2xl">🤔 {l(h.question)}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{l(S.hookLock)}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {h.options.map((o, i) => (
          <button
            key={i}
            type="button"
            disabled={answered}
            onClick={() => p.onHook(i)}
            className={
              "rounded-2xl border p-4 text-start text-sm font-semibold transition " +
              (p.hookChoice === i
                ? "border-subject bg-subject/20"
                : answered
                  ? "border-border opacity-60"
                  : "border-border bg-background/40 hover:-translate-y-0.5 hover:border-subject/60 hover:bg-subject/10")
            }
          >
            {l(o)}
          </button>
        ))}
      </div>
      {answered && (
        <button
          type="button"
          onClick={() => p.onPhase("board")}
          className="mt-4 rounded-full bg-subject px-5 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110"
        >
          {l(S.hookGo)}
        </button>
      )}
    </section>
  );
}

/* --------------------------------- 2 · board ---------------------------------- */

function BoardPanel(
  p: BlockViewProps & {
    tab: "simple" | "book" | "trap";
    onTab: (t: "simple" | "book" | "trap") => void;
    onHighlight: (g: string[]) => void;
  },
) {
  const { block } = p;
  const { l } = useLang();
  const tabs = [
    { id: "simple" as const, label: S.tabSimple },
    { id: "book" as const, label: S.tabBook },
    { id: "trap" as const, label: S.tabTrap },
  ];
  const se = block.simpleExplanation;
  return (
    <section className="glass rounded-3xl p-4">
      <div className="flex flex-wrap gap-1.5" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={p.tab === t.id}
            onClick={() => p.onTab(t.id)}
            className={
              "rounded-full border px-3 py-1.5 text-xs font-bold " +
              (p.tab === t.id
                ? t.id === "trap"
                  ? "border-warning bg-warning/20"
                  : "border-subject bg-subject/20"
                : "border-border hover:bg-accent")
            }
          >
            {t.id === "trap" ? "⚠️ " : ""}
            {l(t.label)}
          </button>
        ))}
      </div>
      <div className="mt-3 max-h-[min(60vh,560px)] overflow-y-auto pe-1">
        {p.tab === "simple" && (
          <div className="space-y-3 text-sm leading-relaxed">
            {se.paragraphs.map((x, i) => (
              <p key={i}>{l(x)}</p>
            ))}
            <p className="rounded-xl border border-subject/30 bg-subject/10 p-3">
              <b>💭 {l(S.imagine)}: </b>
              {l(se.imagine)}
            </p>
            <div>
              <p className="font-bold">{l(S.examples)}</p>
              <ul className="mt-1 list-disc space-y-1 ps-5">
                {se.examples.map((x, i) => (
                  <li key={i}>{l(x)}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold">{l(S.terms)}</p>
              <ul className="mt-1 grid gap-1 sm:grid-cols-2">
                {se.terms.map((t, i) => (
                  <li
                    key={i}
                    className="flex justify-between gap-2 rounded-lg bg-background/50 px-2 py-1 text-xs"
                  >
                    <span lang="ar">{t.ar}</span>
                    <span lang="en" dir="ltr" className="font-mono text-muted-foreground">
                      {t.en}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {p.tab === "book" && (
          <div lang="ar" dir="rtl" className="space-y-1.5 text-sm leading-relaxed">
            {block.textbookVerbatim.map(([depth, text, plain], i) => (
              <p
                key={i}
                style={{ paddingInlineStart: `${depth * 14}px` }}
                className={plain ? "font-semibold" : ""}
              >
                {plain ? "" : "• "}
                {text}
              </p>
            ))}
          </div>
        )}
        {p.tab === "trap" && (
          <ExamTrap
            key={block.n}
            trap={block.examTrap}
            onHighlight={p.onHighlight}
            onProbe={(id) => {
              const pr = block.examTrap.probes.find((x) => x.id === id);
              if (pr)
                p.onAction({
                  ar: `جرّب في المصيدة: ${pr.label.ar}`,
                  en: `Ran in the trap: ${pr.label.en}`,
                });
            }}
          />
        )}
      </div>
      <button
        type="button"
        onClick={() => p.onPhase("lab")}
        className="mt-3 rounded-full bg-subject px-5 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110"
      >
        {l(S.toLab)}
      </button>
    </section>
  );
}

/* ----------------------------------- 3 · lab ---------------------------------- */

function LabPanel(
  p: BlockViewProps & {
    scene: SceneState;
    onScene: (x: Partial<SceneState>) => void;
    incoming: IncomingPick | null;
  },
) {
  const { block } = p;
  const { l } = useLang();
  const [status, setStatus] = useState<Record<string, boolean>>({});
  const tasks = block.labConfig.tasks;
  const done = tasks.filter((t) => status[t.id]).length;

  const handle = (e: TaskEvent) => {
    setStatus((s) => ({ ...s, [e.taskId]: e.ok || (s[e.taskId] ?? false) }));
    p.onTaskEvent(e);
  };

  const noteFromCurve = (figure: string, values: number[], title: L10n) =>
    p.onSaveDrawing(block.n, { type: "curve", figure, values }, title);

  return (
    <section className="glass rounded-3xl p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold">🧪 {l(S.tasks)}</h3>
        <span className="font-mono text-xs text-subject">
          {done}/{tasks.length}
        </span>
      </div>
      <div className="mt-3 max-h-[min(64vh,620px)] space-y-4 overflow-y-auto pe-1">
        {tasks.map((task, i) => (
          <div
            key={task.id}
            className={
              "rounded-2xl border p-3 " +
              (status[task.id] ? "border-bio/50 bg-bio/5" : "border-border bg-background/40")
            }
          >
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-subject">
              {status[task.id] ? "✅ " : ""}
              {l(S.taskOf)} {i + 1}
            </p>
            {task.kind === "label" && (
              <LabelLab
                task={task}
                block={block.n}
                onEvent={handle}
                onSaveDrawing={(figure, placed, title) =>
                  p.onSaveDrawing(block.n, { type: "labels", figure, placed }, title)
                }
              />
            )}
            {task.kind === "pick" && (
              <PickTaskView task={task} block={block.n} incoming={p.incoming} onEvent={handle} />
            )}
            {task.kind === "numeric" && (
              <NumericTaskView task={task} block={block.n} onEvent={handle} />
            )}
            {task.kind === "match" && (
              <MatchTaskView task={task} block={block.n} onEvent={handle} />
            )}
            {task.kind === "deposit" && (
              <DepositLab
                taskId={task.id}
                block={block.n}
                onEvent={handle}
                onScene={(d) => p.onScene({ deposit: d })}
                onSaveNote={(title, text) => p.onSaveNote(title, text, block.n, "experiment")}
              />
            )}
          </div>
        ))}
        {block.labConfig.tools.length > 0 && (
          <div>
            <h3 className="font-bold">🧰 {l(S.tools)}</h3>
            <div className="mt-2 space-y-4">
              {block.labConfig.tools.map((tool, i) => (
                <div key={i} className="rounded-2xl border border-border bg-background/40 p-3">
                  {tool.kind === "graph" && (
                    <GraphLab
                      kind={tool.id}
                      block={block.n}
                      onScene={(x) => p.onScene(x)}
                      onEvent={handle}
                      onSaveCurve={noteFromCurve}
                    />
                  )}
                  {tool.kind === "compare" && (
                    <CompareArena id={tool.id} block={block.n} onEvent={handle} />
                  )}
                  {tool.kind === "radius" && <RadiusTool scene={p.scene} onScene={p.onScene} />}
                  {tool.kind === "pelvis" && <PelvisTool scene={p.scene} onScene={p.onScene} />}
                  {tool.kind === "achilles-tear" && (
                    <AchillesTool scene={p.scene} onScene={p.onScene} />
                  )}
                  {tool.kind === "deposit" && (
                    <DepositLab
                      taskId={`b${block.n}-deposit-free`}
                      block={block.n}
                      onEvent={handle}
                      onScene={(d) => p.onScene({ deposit: d })}
                      onSaveNote={(title, text) => p.onSaveNote(title, text, block.n, "experiment")}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {done === tasks.length && <p className="mt-2 text-sm font-bold text-bio">{l(S.labDone)}</p>}
      <button
        type="button"
        onClick={() => p.onPhase("quiz")}
        className="mt-3 rounded-full bg-subject px-5 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110"
      >
        {l(S.toQuiz)}
      </button>
    </section>
  );
}

/* --------------------------- 4 · back to the question --------------------------- */

function QuizPanel(p: BlockViewProps) {
  const { block } = p;
  const { l, lang } = useLang();
  const h = block.hookQuestion;
  const qs: SupportQuestion[] = block.microQuiz;
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(p.completed);
  const hookOk = p.hookChoice === h.correct;
  const total = qs.length + 1;
  const score = useMemo(() => results.filter(Boolean).length + (hookOk ? 1 : 0), [results, hookOk]);

  useEffect(() => {
    setFinished(p.completed);
  }, [p.completed]);

  const q = qs[index];
  return (
    <section className="glass rounded-3xl p-4">
      <div className="rounded-2xl border border-subject/30 bg-subject/5 p-3">
        <p className="text-xs font-bold text-subject">↩ {l(S.backToHook)}</p>
        <p className="mt-1 font-bold">{l(h.question)}</p>
        <ul className="mt-2 space-y-1">
          {h.options.map((o, i) => (
            <li
              key={i}
              className={
                "rounded-lg border px-2.5 py-1.5 text-sm " +
                (i === h.correct
                  ? "border-bio bg-bio/15"
                  : i === p.hookChoice
                    ? "border-destructive bg-destructive/10"
                    : "border-border opacity-70")
              }
            >
              {i === p.hookChoice ? "👉 " : ""}
              {l(o)}
              {i === p.hookChoice && (
                <span className="ms-2 text-[11px] text-muted-foreground">({l(S.yourAnswer)})</span>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm leading-relaxed">
          <b>{hookOk ? "🎉 " : "💡 "}</b>
          {l(h.reveal)}
        </p>
      </div>

      <h3 className="mt-4 font-bold">⚡ {l(S.quizTitle)}</h3>
      <div className="mt-2">
        {q && !finished ? (
          <QuestionCard
            key={q.id}
            q={q}
            counter={`${index + 1} / ${qs.length}`}
            nextLabel={index + 1 >= qs.length ? l(S.finish) : l(S.next)}
            onAnswer={(ok, chosen) => {
              setResults((r) => [...r, ok]);
              p.onItem(
                block.n,
                q.id,
                ok,
                ok
                  ? undefined
                  : {
                      block: block.n,
                      kind: "mcq",
                      picked: q.options[chosen]!.text,
                      correct: q.options[q.correct]!.text,
                      explain: q.explain,
                    },
              );
            }}
            onNext={() => {
              if (index + 1 >= qs.length) {
                setFinished(true);
                const finalScore = score + 0;
                p.onComplete(finalScore, total);
              } else setIndex((i) => i + 1);
            }}
          />
        ) : (
          <p
            className="rounded-xl border border-bio/40 bg-bio/10 p-3 text-sm font-bold"
            role="status"
          >
            🎯 {l(S.finish)} — {p.completed || finished ? `${score}/${total}` : ""}
          </p>
        )}
      </div>

      <div className="mt-4">
        <FeynmanCheck
          def={block.feynmanCheck}
          blockTitle={l(block.title)}
          onAskNoor={p.onAskNoor}
          onReviewed={p.onFeynman}
        />
      </div>

      {(finished || p.completed) && p.hasNext && (
        <button
          type="button"
          onClick={p.onNextBlock}
          className="mt-4 rounded-full bg-subject px-5 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110"
        >
          {l(S.nextBlock)}
        </button>
      )}
      <p className="sr-only">{lang}</p>
    </section>
  );
}
