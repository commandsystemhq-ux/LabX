import {
  BookOpen,
  Target,
  Swords,
  Search,
  NotebookPen,
  ClipboardCheck,
  Brain,
  Layers,
  Palette,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useNoorControl,
  useStudioOpen,
  useStudioWorkspace,
  type StudioWorkspaceRequest,
} from "@/components/noor/NoorProvider";
import { StudioWorkspace } from "@/components/noor/StudioWorkspace";
import type { LessonLookup } from "@/data/mockCurriculum";
import {
  allQuestions,
  allTasks,
  blockTitle,
  getBlock,
  selfTests,
  supportBlocks,
  TOTAL_UNITS,
} from "@/data/lessons/supportLesson";
import { parseDuelParams, type DuelSource } from "@/data/lessons/supportDuel";
import {
  type FeynmanReview,
  type SupportMistake,
  type SupportNoorContext,
  type SupportPhase,
} from "@/data/lessons/supportNoor";
import {
  loadNotebook,
  newEntryId,
  removeEntry,
  saveNotebook,
  upsertEntry,
  type NotebookEntry,
} from "@/data/lessons/supportNotebook";
import {
  loadSupportProgress,
  saveSupportProgress,
  unitsDone,
  withBlock,
  withHook,
  withTest,
  EMPTY_PROGRESS,
  type SupportProgress,
} from "@/data/lessons/supportProgress";
import {
  EMPTY_RADAR,
  loadRadar,
  recordRadar,
  saveRadar,
  type RadarState,
  type RescueKind,
} from "@/data/lessons/supportRadar";
import { useLang, type L10n } from "@/lib/i18n";
import { progressStore } from "@/lib/progress";
import { BlockView, type Phase } from "./BlockView";
import type { TaskEvent } from "./DrawingLab";
import { FlashcardsLab } from "./FlashcardsLab";
import { MindMapLab } from "./MindMapLab";
import { MysteryCase } from "./MysteryCase";
import { Notebook } from "./Notebook";
import { PracticalDuel } from "./PracticalDuel";
import type { StageMode } from "./sceneState";
import { SelfTests } from "./SelfTests";
import { S } from "./strings";
import { WeaknessRadar } from "./WeaknessRadar";

type Page = "block" | "tests" | "radar" | "duel" | "mystery" | "mindmap" | "flashcards" | "studio";

const MAX_MISTAKES = 12;
const MAX_ACTIONS = 10;
const store = () => (typeof window === "undefined" ? null : safeStorage());

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const NOOR_PHASE: Record<Phase, SupportPhase> = {
  hook: "hook",
  board: "board",
  lab: "lab",
  quiz: "quiz",
};

export interface SupportBoardProps {
  lookup: LessonLookup;
  /** Raw `?duel=` / `?vs=` values from the route (validated here). */
  duel?: unknown;
  vs?: unknown;
}

/**
 * The live board for «الدعامة في الكائنات الحية»: 14 micro-blocks, the six self-tests, and the
 * tools around them (notebook, weakness radar, duel, crime-scene case). All the student's work is
 * mirrored to Noor so it can correct what they drew, picked or typed.
 */
export function SupportBoard({ lookup, duel, vs }: SupportBoardProps) {
  const { l, lang } = useLang();
  const lessonId = lookup.lesson.id;
  const duelParams = useMemo(() => parseDuelParams({ duel, vs }), [duel, vs]);
  const { setSupport, setOpen, ask, consumeStudioOpen, consumeWorkspace } = useNoorControl();
  const studioOpen = useStudioOpen();
  const workspaceReq = useStudioWorkspace();

  const [page, setPage] = useState<Page>(duelParams ? "duel" : "block");
  /** A Noor Studio creation the chat asked to open (remounts the Lab so it starts on that pack). */
  const [studioView, setStudioView] = useState<{ n: number; packId: string | null }>({
    n: 0,
    packId: null,
  });
  /** Where closing a Lab goes back to (the Studio when the pack was opened from there). */
  const [labBack, setLabBack] = useState<Page>("block");
  /** A command from the chat waiting for the Studio workspace to run it. */
  const [studioReq, setStudioReq] = useState<StudioWorkspaceRequest | null>(null);
  const [active, setActive] = useState(1);
  const [phases, setPhases] = useState<Record<number, Phase>>({});
  const [mode, setMode] = useState<StageMode>("3d");
  const [labels, setLabels] = useState(true);
  const [progress, setProgress] = useState<SupportProgress>(EMPTY_PROGRESS);
  const [radar, setRadar] = useState<RadarState>(EMPTY_RADAR);
  const [notes, setNotes] = useState<NotebookEntry[]>([]);
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState<SupportMistake[]>([]);
  const [actions, setActions] = useState<L10n[]>([]);
  const [loaded, setLoaded] = useState(false);
  const noteCount = useRef(0);

  useEffect(() => {
    if (!studioOpen) return;
    setStudioView({ n: studioOpen.id, packId: studioOpen.packId });
    setLabBack("block");
    setPage(studioOpen.kind === "mindmap" ? "mindmap" : "flashcards");
    consumeStudioOpen(studioOpen.id);
  }, [studioOpen, consumeStudioOpen]);

  useEffect(() => {
    if (!workspaceReq) return;
    setStudioReq(workspaceReq);
    setPage("studio");
    consumeWorkspace(workspaceReq.id);
  }, [workspaceReq, consumeWorkspace]);

  // Everything persisted is read once on the client (the first render must match the server).
  useEffect(() => {
    const st = store();
    setProgress(loadSupportProgress(st));
    setRadar(loadRadar(st));
    setNotes(loadNotebook(st));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveSupportProgress(store(), progress);
  }, [progress, loaded]);
  useEffect(() => {
    if (!loaded) return;
    saveRadar(store(), radar);
  }, [radar, loaded]);
  // Notebook: automatic save shortly after every change, plus the manual button.
  useEffect(() => {
    if (!loaded) return;
    const id = window.setTimeout(() => {
      if (saveNotebook(store(), notes)) setSavedAt(Date.now());
    }, 500);
    return () => window.clearTimeout(id);
  }, [notes, loaded]);

  const block = getBlock(active) ?? supportBlocks[0]!;
  const phase: Phase = phases[active] ?? "hook";
  const hookChoice = progress.hooks[String(active)] ?? null;

  // Progress store: the 4 lesson steps follow the furthest phase reached.
  useEffect(() => {
    if (page !== "block") return;
    progressStore.recordStep(
      lessonId,
      phase === "hook" ? 1 : phase === "board" ? 2 : phase === "lab" ? 3 : 4,
    );
  }, [lessonId, page, phase]);

  /* ---- what Noor sees ---- */
  const pushAction = useCallback((a: L10n) => setActions((x) => [...x, a].slice(-MAX_ACTIONS)), []);
  const pushMistakes = useCallback((ms: SupportMistake[]) => {
    if (ms.length) setMistakes((x) => [...x, ...ms].slice(-MAX_MISTAKES));
  }, []);

  const noorCtx = useMemo<SupportNoorContext>(
    () => ({
      lessonId,
      block: page === "mystery" ? 14 : active,
      phase: page === "tests" ? "test" : page === "block" ? NOOR_PHASE[phase] : "tools",
      view: mode,
      actions,
      mistakes,
    }),
    [lessonId, active, page, phase, mode, actions, mistakes],
  );
  useEffect(() => {
    setSupport({ ctx: noorCtx, hidden: false });
  }, [setSupport, noorCtx]);
  useEffect(() => () => setSupport(null), [setSupport]);

  /* ---- results ---- */
  const record = useCallback((block: number, itemId: string, ok: boolean) => {
    setRadar((r) => recordRadar(r, { block, itemId, ok }));
  }, []);

  const syncProgress = useCallback(
    (p: SupportProgress) => {
      setProgress(p);
      const done = unitsDone(p);
      if (done > 0) progressStore.recordQuiz(lessonId, done, TOTAL_UNITS);
    },
    [lessonId],
  );

  const onTaskEvent = useCallback(
    (e: TaskEvent) => {
      record(e.block, e.taskId, e.ok);
      pushAction(e.action);
      pushMistakes(e.mistakes ?? []);
    },
    [record, pushAction, pushMistakes],
  );

  const onItem = useCallback(
    (b: number, itemId: string, ok: boolean, mistake?: SupportMistake) => {
      record(b, itemId, ok);
      if (mistake) pushMistakes([mistake]);
    },
    [record, pushMistakes],
  );

  const addEntry = useCallback((entry: Omit<NotebookEntry, "id" | "at">) => {
    const now = Date.now();
    noteCount.current += 1;
    setNotes((x) => upsertEntry(x, { ...entry, id: newEntryId(now, noteCount.current), at: now }));
  }, []);

  const setPhase = (p: Phase) => setPhases((x) => ({ ...x, [active]: p }));
  const goBlock = (n: number, p?: Phase) => {
    setActive(n);
    setPage("block");
    if (p) setPhases((x) => ({ ...x, [n]: p }));
  };

  const itemsOf = useCallback((n: number) => {
    const b = getBlock(n);
    if (!b) return [];
    return [`b${n}-hook`, ...b.labConfig.tasks.map((t) => t.id), ...b.microQuiz.map((q) => q.id)];
  }, []);

  const duelSource = useMemo<DuelSource>(
    () => ({
      questions: allQuestions(),
      numerics: allTasks()
        .filter((x) => x.task.kind === "numeric")
        .map((x) => {
          const t = x.task as Extract<typeof x.task, { kind: "numeric" }>;
          return { id: t.id, block: x.block.n, prompt: t.prompt, answer: t.answer };
        }),
    }),
    [],
  );

  const doneBlocks = new Set(progress.blocks);
  const doneTests = new Set(progress.tests);
  const pct = Math.round((100 * unitsDone(progress)) / TOTAL_UNITS);

  if (page === "studio") {
    return (
      <StudioWorkspace
        block={active}
        radar={radar}
        request={studioReq}
        onHandled={(id) => setStudioReq((r) => (r?.id === id ? null : r))}
        onOpenPack={(kind, packId) => {
          setStudioView((v) => ({ n: v.n + 1, packId }));
          setLabBack("studio");
          setPage(kind === "mindmap" ? "mindmap" : "flashcards");
        }}
        onQuizBlock={(n) => goBlock(n, "quiz")}
        onChallenge={() => setPage("duel")}
        onClose={() => setPage("block")}
      />
    );
  }

  const nav: { id: Page; label: L10n; icon: typeof BookOpen }[] = [
    { id: "block", label: S.blocks, icon: BookOpen },
    { id: "tests", label: S.tests, icon: ClipboardCheck },
    { id: "mystery", label: S.mystery, icon: Search },
    { id: "radar", label: S.radar, icon: Target },
    { id: "duel", label: S.duel, icon: Swords },
  ];

  const tools: { id: Page; label: L10n; icon: typeof Brain }[] = [
    { id: "studio", label: { ar: "🎨 استوديو نور", en: "🎨 Noor Studio" }, icon: Palette },
    { id: "mindmap", label: { ar: "الخريطة الذهنية", en: "Mind Map" }, icon: Brain },
    { id: "flashcards", label: { ar: "البطاقات الذكية", en: "Flashcards" }, icon: Layers },
  ];

  return (
    <div className="flex flex-col gap-4">
      <header className="glass rounded-3xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs uppercase tracking-widest text-subject">
              {lookup.subject.emoji} {l(lookup.unit.title)}
            </p>
            <h2 className="truncate text-xl font-black sm:text-2xl">{l(lookup.lesson.title)}</h2>
          </div>
          <button
            type="button"
            onClick={() => setNotebookOpen((o) => !o)}
            aria-expanded={notebookOpen}
            className="flex items-center gap-1.5 rounded-full border border-subject/40 bg-subject/10 px-3 py-2 text-xs font-bold text-subject hover:bg-subject/20"
          >
            <NotebookPen className="size-4" /> {l(S.notebook)} ({notes.length})
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label={l(S.lessonProgress)}
          >
            <div
              className="h-full rounded-full bg-gradient-subject transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {unitsDone(progress)}/{TOTAL_UNITS} {l(S.unitsDone)}
          </span>
        </div>
        <nav className="mt-3 flex flex-wrap gap-1.5" aria-label={l(S.title)}>
          {nav.map((n) => (
            <button
              key={n.id}
              type="button"
              aria-current={page === n.id ? "page" : undefined}
              onClick={() => setPage(n.id)}
              className={
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition " +
                (page === n.id
                  ? "border-subject bg-subject/25"
                  : "border-border bg-background/50 hover:bg-accent")
              }
            >
              <n.icon className="size-3.5" /> {l(n.label)}
            </button>
          ))}
        </nav>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tools.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-current={page === t.id ? "page" : undefined}
              onClick={() => {
                setLabBack("block");
                setPage(t.id);
              }}
              className={
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition " +
                (page === t.id
                  ? "border-subject bg-subject/25"
                  : "border-border bg-background/50 hover:bg-accent")
              }
            >
              <t.icon className="size-3.5" /> {l(t.label)}
            </button>
          ))}
        </div>
      </header>

      {page === "block" && (
        <>
          <ol className="flex flex-wrap gap-1.5" aria-label={l(S.blocks)}>
            {supportBlocks.map((b) => (
              <li key={b.n}>
                <button
                  type="button"
                  onClick={() => goBlock(b.n)}
                  aria-current={b.n === active ? "step" : undefined}
                  title={l(b.title)}
                  className={
                    "flex size-9 items-center justify-center rounded-xl border text-xs font-bold transition " +
                    (b.n === active
                      ? "border-subject bg-subject text-primary-foreground"
                      : doneBlocks.has(b.n)
                        ? "border-bio/60 bg-bio/15"
                        : "border-border bg-background/50 hover:bg-accent")
                  }
                >
                  {doneBlocks.has(b.n) && b.n !== active ? "✓" : b.n}
                </button>
              </li>
            ))}
          </ol>
          <p className="text-sm font-bold">
            {block.emoji} {l(S.block)} {block.n} {l(S.of)} {supportBlocks.length} — {l(block.title)}
          </p>
          <BlockView
            key={block.n}
            block={block}
            phase={phase}
            onPhase={setPhase}
            hookChoice={hookChoice}
            onHook={(choice) => {
              setProgress((p) => withHook(p, block.n, choice));
              const ok = choice === block.hookQuestion.correct;
              record(block.n, `b${block.n}-hook`, ok);
              pushAction({
                ar: `أجاب على سؤال البداية: «${block.hookQuestion.options[choice]?.ar ?? ""}»`,
                en: `Answered the opening question: “${block.hookQuestion.options[choice]?.en ?? ""}”`,
              });
            }}
            mode={mode}
            onMode={setMode}
            labels={labels}
            onLabels={setLabels}
            onTaskEvent={onTaskEvent}
            onItem={onItem}
            onAction={pushAction}
            onSaveNote={(title, text, b, kind) => addEntry({ block: b, kind, title, text })}
            onSaveDrawing={(b, drawing, title) =>
              addEntry({
                block: b,
                kind: "drawing",
                title: title[lang],
                text: "",
                drawing:
                  drawing.type === "labels"
                    ? { type: "labels", figure: drawing.figure, placed: drawing.placed }
                    : { type: "curve", figure: drawing.figure, values: drawing.values },
              })
            }
            onAskNoor={(text) => ask(text)}
            onFeynman={(answer, review: FeynmanReview) => {
              pushAction({
                ar: `شرح بأسلوبه (تغطية ${review.score}٪): «${answer.slice(0, 200)}»`,
                en: `Explained in own words (${review.score}% keywords): “${answer.slice(0, 200)}”`,
              });
              if (review.missing.length) {
                pushAction({
                  ar: `كلمات علمية ناقصة: ${review.missing.map((k) => k.label.ar).join("، ")}`,
                  en: `Missing keywords: ${review.missing.map((k) => k.label.en).join(", ")}`,
                });
              }
            }}
            onComplete={(score, total) => {
              record(block.n, `b${block.n}-quiz`, score * 10 >= total * 7);
              syncProgress(withBlock(progress, block.n));
            }}
            completed={doneBlocks.has(block.n)}
            hasNext={active < supportBlocks.length}
            onNextBlock={() => goBlock(active + 1)}
          />
        </>
      )}

      {page === "tests" && (
        <SelfTests
          doneTests={doneTests}
          onAnswer={(test, qid, b, ok, chosen) => {
            record(b, qid, ok);
            const q = selfTests.find((t) => t.n === test)?.questions.find((x) => x.id === qid);
            if (q && !ok) {
              pushMistakes([
                {
                  block: b,
                  kind: "mcq",
                  picked: q.options[chosen]!.text,
                  correct: q.options[q.correct]!.text,
                  explain: q.explain,
                },
              ]);
            }
          }}
          onFinish={(test, correct, total) => {
            pushAction({
              ar: `خلّص اختبر نفسك (${test}) بنتيجة ${correct}/${total}`,
              en: `Finished self-test ${test}: ${correct}/${total}`,
            });
            if (correct * 10 >= total * 7) syncProgress(withTest(progress, test));
          }}
        />
      )}

      {page === "mystery" && (
        <MysteryCase
          onStep={({ stepId, ok, mistakes: ms }) => {
            const b = stepId === "knee" ? 13 : 14;
            record(b, `mystery-${stepId}`.slice(0, 40), ok);
            pushMistakes(ms);
            pushAction({
              ar: `مسرح الجريمة — خطوة «${stepId}» ${ok ? "صح" : "غلط"}`,
              en: `Crime scene — step “${stepId}” ${ok ? "right" : "wrong"}`,
            });
          }}
          onFinish={(score, solved) =>
            pushAction({
              ar: `أنهى القضية بنتيجة ${score}٪ ${solved ? "(اتحلت)" : ""}`,
              en: `Finished the case with ${score}% ${solved ? "(solved)" : ""}`,
            })
          }
        />
      )}

      {page === "radar" && (
        <WeaknessRadar
          radar={radar}
          titleOf={blockTitle}
          itemsOf={itemsOf}
          onGoto={(n, kind: RescueKind) =>
            goBlock(
              n,
              kind === "review" || kind === "trap" ? "board" : kind === "lab" ? "lab" : "quiz",
            )
          }
        />
      )}

      {page === "duel" && (
        <PracticalDuel
          lessonId={lessonId}
          source={duelSource}
          params={duelParams}
          onAnswer={(b, id, ok) => record(b, id, ok)}
        />
      )}

      {page === "mindmap" && (
        <div className="glass rounded-3xl p-4">
          <MindMapLab
            key={`mm-${studioView.n}`}
            radar={radar}
            initialPackId={studioView.packId}
            onGoToBlock={(n) => goBlock(n, "board")}
            onView3D={(n) => {
              setMode("3d");
              goBlock(n, "board");
            }}
            onResult={(b, itemId, ok) => record(b, itemId, ok)}
            onClose={() => setPage(labBack)}
          />
        </div>
      )}

      {page === "flashcards" && (
        <div className="glass rounded-3xl p-4">
          <FlashcardsLab
            key={`fc-${studioView.n}`}
            initialPackId={studioView.packId}
            onGoToBlock={(n) => goBlock(n, "board")}
            onClose={() => setPage(labBack)}
          />
        </div>
      )}

      {notebookOpen && (
        <Notebook
          entries={notes}
          block={active}
          titleOf={blockTitle}
          savedAt={savedAt}
          onAdd={(title, text, b) => addEntry({ block: b, kind: "note", title, text })}
          onRemove={(id) => setNotes((x) => removeEntry(x, id))}
          onSaveNow={() => {
            if (saveNotebook(store(), notes)) setSavedAt(Date.now());
          }}
          onClose={() => {
            setNotebookOpen(false);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
