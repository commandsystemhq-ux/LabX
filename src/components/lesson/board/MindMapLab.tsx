import {
  Box,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  ExternalLink,
  Lightbulb,
  Maximize2,
  Minus,
  Pencil,
  Plus,
  Puzzle,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { FullscreenButton } from "@/components/common/FullscreenButton";
import { useNoorControl } from "@/components/noor/NoorProvider";
import { useFullscreen } from "@/lib/use-fullscreen";
import {
  MM,
  ancestorIds,
  blankOptions,
  blankMinDepth,
  branchIds,
  centerOn,
  edgePath,
  fitView,
  gradeBlankMap,
  isBlankDepth,
  layoutMindMapTree,
  loadBest,
  masteryLevel,
  measureNode,
  saveBest,
  searchNodes,
  togglePoint,
  visibleBlanks,
  zoomAt,
  type BlankGrade,
  type BlankVerdict,
  type PlacedNode,
  type View,
} from "@/data/lessons/mindMapLayout";
import { packToTree, removeMindMapPack } from "@/data/lessons/noorStudio";
import { supportMindMap } from "@/data/lessons/supportMindMap";
import type { RadarState } from "@/data/lessons/supportRadar";
import { weakness } from "@/data/lessons/supportRadar";
import type { MindMapNode } from "@/data/lessons/supportTypes";
import { useLang, type L10n, type Lang } from "@/lib/i18n";
import { useNoorStudio } from "@/lib/use-noor-studio";

export { layoutMindMapTree } from "@/data/lessons/mindMapLayout";

const t = (ar: string, en: string): L10n => ({ ar, en });

const ui = {
  title: t("الخريطة الذهنية", "Mind Map"),
  search: t("ابحث في الخريطة…", "Search the map…"),
  base: t("خريطة الدرس", "Lesson map"),
  mine: t("✨ إبداعات نور لك", "✨ Noor's creations for you"),
  noCreations: t(
    "لسه مفيش خرائط من نور. اطلب منه: «اعملّي خريطة ذهنية للعمود الفقري» أو «اعمل شبكة فاضية عن الأربطة».",
    "No maps from Noor yet. Ask him: “make me a mind map of the vertebral column” or “make a blank grid about ligaments”.",
  ),
  askNoor: t("افتح نور", "Open Noor"),
  editNoor: t("عدّل مع نور", "Edit with Noor"),
  expandNoor: t("وسّع مع نور", "Expand with Noor"),
  del: t("حذف", "Delete"),
  delSure: t("تأكيد الحذف؟", "Delete for good?"),
  blankTag: t("🧩 فاضية", "🧩 blank"),
  mapTag: t("🧠 مليانة", "🧠 filled"),
  goToBlock: t("انتقل للجزئية في السبورة", "Go to the block on the board"),
  view3D: t("اعرض في 3D", "View in 3D"),
  close: t("إغلاق", "Close"),
  testMode: t("🧩 وضع الاختبار (شبكة فاضية)", "🧩 Test mode (blank grid)"),
  exitTest: t("خروج من الاختبار", "Exit test"),
  check: t("صحّح الخريطة يا نور", "Check the map, Noor"),
  retry: t("جرّب تاني", "Try again"),
  slot: t("[ ؟ — اضغط للملء ]", "[ ? — tap to fill ]"),
  filled: t("ملأت", "Filled"),
  of: t("من", "of"),
  score: t("نتيجتك", "Your score"),
  best: t("أفضل نتيجة", "Best"),
  fitBtn: t("ملاءمة الشاشة", "Fit to screen"),
  zoomIn: t("تكبير", "Zoom in"),
  zoomOut: t("تصغير", "Zoom out"),
  expandAll: t("توسيع الكل", "Expand all"),
  collapseAll: t("طي الكل", "Collapse all"),
  expandNode: t("افتح الفروع", "Expand branches"),
  collapseNode: t("اطوِ الفروع", "Collapse branches"),
  pickAnswer: t("اختار الإجابة", "Pick the answer"),
  orType: t("أو اكتبها بنفسك", "or type it yourself"),
  typeHere: t("اكتب الإجابة…", "Type the answer…"),
  confirm: t("تأكيد", "Confirm"),
  clear: t("مسح", "Clear"),
  right: t("صح ✅", "Correct ✅"),
  wrong: t("غلط ❌", "Wrong ❌"),
  rightIs: t("الإجابة الصحيحة", "Correct answer"),
  noorSays: t("نور بيشرح", "Noor explains"),
  explainMore: t("اشرحها لي يا نور", "Explain it, Noor"),
  masteryGood: t("متقن", "Strong"),
  masteryMid: t("محتاج مراجعة", "Needs review"),
  masteryBad: t("نقطة ضعف", "Weak spot"),
  masteryNone: t("لسه ما جرّبتهاش", "Not tried yet"),
  noMatch: t("مفيش نتيجة", "No match"),
  great: t("ممتاز! عندك الخريطة في دماغك 🎉", "Excellent! The map is in your head 🎉"),
  good: t("كويس! راجع الخانات الحمرا وجرّب تاني 💪", "Good! Review the red slots and retry 💪"),
  low: t(
    "ولا يهمك — الأحمر ده اللي هتتعلم منه. اقرأ الشرح وجرّب تاني 🌱",
    "No worries — the red ones are where you learn. Read the notes and retry 🌱",
  ),
};

const WORLD_BG = "#1f2328";
const EDGE = "#8B9CF4";
const EDGE_LEAF = "#6EC9A8";
const MASTERY_DOT = { good: "bg-emerald-400", mid: "bg-amber-400", bad: "bg-red-400" } as const;

export interface MindMapLabProps {
  radar: RadarState;
  onGoToBlock: (block: number) => void;
  onView3D?: (block: number) => void;
  /** One graded blank slot of the recall mode (feeds the weakness radar). */
  onResult?: (block: number, itemId: string, ok: boolean) => void;
  onClose: () => void;
  /** Open this Noor Studio map first (falls back to the lesson map when it no longer exists). */
  initialPackId?: string | null;
}

const defaultExpanded = (root: MindMapNode): Set<string> => {
  const open = new Set<string>();
  if (root.children?.length) open.add(root.id);
  for (const c of root.children ?? []) if (c.children?.length) open.add(c.id);
  return open;
};

const storage = (): Storage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

/* ---------------------------------- nodes ---------------------------------- */

interface NodeViewProps {
  p: PlacedNode;
  lang: Lang;
  testMode: boolean;
  blankMin: number;
  answer: string | undefined;
  verdict: BlankVerdict | undefined;
  selected: boolean;
  matched: boolean;
  focused: boolean;
  level: "good" | "mid" | "bad" | null;
  onClick: (id: string) => void;
}

const NodeView = memo(function NodeView({
  p,
  lang,
  testMode,
  blankMin,
  answer,
  verdict,
  selected,
  matched,
  focused,
  level,
  onClick,
}: NodeViewProps) {
  const blank = testMode && isBlankDepth(p.depth, blankMin);
  const title = p.node.title[lang];
  let tone =
    p.depth === 0
      ? "border-[#6c6c98] bg-[#4b4b6b] text-white"
      : p.hasChildren
        ? "border-[#586070] bg-[#3a3f4a] text-slate-100"
        : "border-[#3f7566] bg-[#2c4a41] text-emerald-50";
  let body: React.ReactNode = (
    <>
      <span className="block text-[13px] font-semibold leading-5">{title}</span>
      {p.node.badge?.[lang] && (
        <span className="block text-[11px] leading-4 opacity-70">{p.node.badge[lang]}</span>
      )}
    </>
  );

  if (blank) {
    if (verdict === "right") {
      tone = "border-emerald-400 bg-emerald-800/60 text-emerald-50";
      body = (
        <span className="flex items-center justify-center gap-1 text-[13px] font-semibold leading-5">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-300" /> {title}
        </span>
      );
    } else if (verdict === "wrong" || verdict === "empty") {
      tone = "border-red-400 bg-red-900/50 text-red-50";
      body = (
        <>
          <span className="block truncate text-[11px] leading-4 text-red-200 line-through">
            {answer || "—"}
          </span>
          <span className="flex items-center justify-center gap-1 text-[13px] font-semibold leading-5">
            <XCircle className="size-4 shrink-0 text-red-300" /> {title}
          </span>
        </>
      );
    } else if (answer) {
      tone = "border-sky-400 bg-[#243b55] text-sky-100";
      body = <span className="block text-[13px] font-semibold leading-5">{answer}</span>;
    } else {
      tone = "border-dashed border-sky-400/70 bg-[#232a35] text-sky-300 hover:bg-[#2a3342]";
      body = <span className="block text-[12px] font-medium leading-5">{ui.slot[lang]}</span>;
    }
  }

  const ring = focused
    ? "ring-2 ring-amber-300"
    : matched
      ? "ring-1 ring-amber-300/70"
      : selected
        ? "ring-2 ring-sky-400"
        : "";

  return (
    <button
      type="button"
      data-node={p.id}
      dir={lang === "ar" ? "rtl" : "ltr"}
      aria-label={blank && !verdict && !answer ? ui.slot[lang] : title}
      onClick={() => onClick(p.id)}
      style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
      className={`absolute flex flex-col items-center justify-center rounded-xl border px-3 text-center transition-colors ${tone} ${ring}`}
    >
      {body}
      {!testMode && level && (
        <span
          aria-hidden
          className={`absolute -top-1 -end-1 size-2.5 rounded-full ring-2 ring-[#1f2328] ${MASTERY_DOT[level]}`}
        />
      )}
    </button>
  );
});

interface WorldProps {
  layout: ReturnType<typeof layoutMindMapTree>;
  lang: Lang;
  testMode: boolean;
  blankMin: number;
  answers: Readonly<Record<string, string>>;
  grade: BlankGrade | null;
  selectedId: string | null;
  matchSet: ReadonlySet<string>;
  focusId: string | null;
  radar: RadarState;
  onNode: (id: string) => void;
  onToggle: (id: string) => void;
}

/** Edges + nodes. Memoised: panning/zooming only moves the wrapper, never re-renders this. */
const World = memo(function World({
  layout,
  lang,
  testMode,
  blankMin,
  answers,
  grade,
  selectedId,
  matchSet,
  focusId,
  radar,
  onNode,
  onToggle,
}: WorldProps) {
  const rtl = layout.rtl;
  return (
    <>
      <svg
        className="pointer-events-none absolute left-0 top-0 overflow-visible"
        width={layout.width}
        height={layout.height}
        aria-hidden
      >
        {layout.nodes.map((n) => {
          const parent = n.parentId ? layout.byId.get(n.parentId) : undefined;
          if (!parent) return null;
          return (
            <path
              key={n.id}
              d={edgePath(parent, n, rtl)}
              fill="none"
              stroke={n.hasChildren ? EDGE : EDGE_LEAF}
              strokeWidth={1.7}
              strokeLinecap="round"
              opacity={0.85}
            />
          );
        })}
      </svg>
      {layout.nodes.map((n) => {
        const tally = n.node.blockId ? radar.blocks[String(n.node.blockId)] : undefined;
        const level = n.node.blockId ? masteryLevel(tally, weakness(radar, n.node.blockId)) : null;
        return (
          <NodeView
            key={n.id}
            p={n}
            lang={lang}
            testMode={testMode}
            blankMin={blankMin}
            answer={answers[n.id]}
            verdict={grade?.verdicts[n.id]}
            selected={selectedId === n.id}
            matched={matchSet.has(n.id)}
            focused={focusId === n.id}
            level={level}
            onClick={onNode}
          />
        );
      })}
      {layout.nodes.map((n) => {
        if (!n.hasChildren) return null;
        const c = togglePoint(n, rtl);
        // Points toward the children while open, back toward the node while closed (NotebookLM).
        const towardChildrenIsLeft = rtl;
        const Icon = n.expanded === towardChildrenIsLeft ? ChevronLeft : ChevronRight;
        const label = (n.expanded ? ui.collapseNode : ui.expandNode)[lang];
        return (
          <button
            key={`t-${n.id}`}
            type="button"
            aria-label={`${label}: ${n.node.title[lang]}`}
            aria-expanded={n.expanded}
            onClick={() => onToggle(n.id)}
            style={{
              left: c.x - MM.TOGGLE_R,
              top: c.y - MM.TOGGLE_R,
              width: MM.TOGGLE_R * 2,
              height: MM.TOGGLE_R * 2,
            }}
            className="absolute flex items-center justify-center rounded-full border border-[#4a5160] bg-[#323843] text-slate-200 transition hover:bg-[#3d4452]"
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </>
  );
});

/* --------------------------------- popover --------------------------------- */

function SlotPopover({
  options,
  current,
  lang,
  left,
  top,
  onPick,
  onClear,
  onClose,
}: {
  options: string[];
  current: string;
  lang: Lang;
  left: number;
  top: number;
  onPick: (text: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState(current);
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      data-mm-ui
      role="dialog"
      aria-label={ui.pickAnswer[lang]}
      dir={lang === "ar" ? "rtl" : "ltr"}
      style={{ left, top, width: 280 }}
      className="absolute z-20 rounded-2xl border border-white/10 bg-[#2b2f36] p-3 shadow-2xl"
    >
      <div className="mb-2 flex items-center gap-2">
        <p className="flex-1 text-xs font-bold text-sky-300">🧩 {ui.pickAnswer[lang]}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label={ui.close[lang]}
          className="rounded-full p-1 text-slate-300 hover:bg-white/10"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="grid gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onPick(o)}
            className={`rounded-xl border px-3 py-2 text-start text-[13px] font-medium transition ${
              o === current
                ? "border-sky-400 bg-sky-500/20 text-sky-100"
                : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
      <form
        className="mt-2.5 flex items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (typed.trim()) onPick(typed.trim().slice(0, 100));
        }}
      >
        <input
          value={typed}
          maxLength={100}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={`${ui.orType[lang]} — ${ui.typeHere[lang]}`}
          aria-label={ui.typeHere[lang]}
          className="h-9 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#1f2328] px-2.5 text-[13px] text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400"
        />
        <button
          type="submit"
          disabled={!typed.trim()}
          className="h-9 rounded-xl bg-sky-500 px-3 text-xs font-bold text-white disabled:opacity-40"
        >
          {ui.confirm[lang]}
        </button>
      </form>
      {current && (
        <button
          type="button"
          onClick={onClear}
          className="mt-2 text-[11px] font-semibold text-slate-400 hover:text-slate-200"
        >
          {ui.clear[lang]}
        </button>
      )}
    </div>
  );
}

/* ----------------------------------- lab ----------------------------------- */

export function MindMapLab({
  radar,
  onGoToBlock,
  onView3D,
  onResult,
  onClose,
  initialPackId = null,
}: MindMapLabProps) {
  const { l, lang } = useLang();
  const rtl = lang === "ar";
  const { ask, setOpen, setStudioFocus } = useNoorControl();
  const { userId, state: studio, mutate } = useNoorStudio();
  const fs = useFullscreen();

  const [sourceId, setSourceId] = useState<string>(initialPackId ?? "base");
  const [tab, setTab] = useState<"base" | "mine">(initialPackId ? "mine" : "base");
  const pack = studio.mindMapPacks.find((p) => p.id === sourceId) ?? null;
  const activeId = pack ? pack.id : "base";
  const tree = useMemo(() => (pack ? packToTree(pack) : supportMindMap.root), [pack]);

  const [expanded, setExpanded] = useState<Set<string>>(() => defaultExpanded(tree));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(pack?.kind === "blank");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [grade, setGrade] = useState<BlankGrade | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [best, setBest] = useState<Record<string, number>>({});
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [matchIdx, setMatchIdx] = useState(0);
  const [focusId, setFocusId] = useState<string | null>(null);

  // Camera
  const boxRef = useRef<HTMLDivElement>(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const pending = useRef<"fit" | { center: string } | null>("fit");
  const [tick, setTick] = useState(0);
  const requestCamera = useCallback((what: "fit" | { center: string }) => {
    pending.current = what;
    setTick((n) => n + 1);
  }, []);

  const blankMin = useMemo(() => blankMinDepth(tree), [tree]);
  const measure = useCallback(
    (n: MindMapNode, depth: number) => {
      const base = measureNode(n, lang);
      return testMode && isBlankDepth(depth, blankMin)
        ? { w: Math.max(base.w, MM.BLANK_W), h: Math.max(base.h, MM.BLANK_H) }
        : base;
    },
    [lang, testMode, blankMin],
  );
  const layout = useMemo(
    () => layoutMindMapTree(tree, expanded, { lang, rtl, measure }),
    [tree, expanded, lang, rtl, measure],
  );

  // A different map (or the pack was edited by Noor): start from its default view.
  const prevTree = useRef(tree);
  useEffect(() => {
    if (prevTree.current === tree) return;
    prevTree.current = tree;
    setExpanded(defaultExpanded(tree));
    setSelectedId(null);
    setSlotId(null);
    setAnswers({});
    setGrade(null);
    setQuery("");
    setFocusId(null);
    setTestMode(pack?.kind === "blank");
    requestCamera("fit");
  }, [tree, pack?.kind, requestCamera]);

  useEffect(() => {
    setBest(loadBest(userId, storage()));
  }, [userId]);

  useEffect(() => {
    if (pack) setStudioFocus({ kind: "mindmap", packId: pack.id });
  }, [pack, setStudioFocus]);

  useEffect(() => {
    if (!confirmDel) return;
    const id = window.setTimeout(() => setConfirmDel(null), 4000);
    return () => window.clearTimeout(id);
  }, [confirmDel]);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const read = () =>
      setVp((prev) =>
        prev.w === el.clientWidth && prev.h === el.clientHeight
          ? prev
          : { w: el.clientWidth, h: el.clientHeight },
      );
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const what = pending.current;
    if (!what || vp.w <= 0) return;
    if (what === "fit") {
      setView(fitView(layout, vp.w, vp.h));
    } else {
      const n = layout.byId.get(what.center);
      if (!n) return;
      setView((v) => centerOn(n, vp.w, vp.h, Math.max(v.k, 0.9)));
    }
    pending.current = null;
  }, [layout, vp, tick]);

  useEffect(() => {
    requestCamera("fit");
  }, [lang, testMode, requestCamera]);

  // Wheel needs a non-passive listener to stop the page from scrolling while zooming.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const f = Math.min(1.25, Math.max(0.8, Math.exp(-e.deltaY * 0.0015)));
      setView((v) => zoomAt(v, f, e.clientX - r.left, e.clientY - r.top));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  /* ---- pan / pinch ---- */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(
    null,
  );
  const pinch = useRef<{ d: number; k: number } | null>(null);
  const didDrag = useRef(false);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-mm-ui]")) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      drag.current = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y, moved: false };
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      if (a && b) pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, k: view.k };
      drag.current = null;
    }
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const pt = pointers.current.get(e.pointerId);
    if (!pt) return;
    pt.x = e.clientX;
    pt.y = e.clientY;
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const box = boxRef.current;
      if (!a || !b || !box) return;
      const r = box.getBoundingClientRect();
      const target = pinch.current.k * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.d);
      const mx = (a.x + b.x) / 2 - r.left;
      const my = (a.y + b.y) / 2 - r.top;
      didDrag.current = true;
      setView((v) => zoomAt(v, target / v.k, mx, my));
      return;
    }
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < 5) return;
      d.moved = true;
      didDrag.current = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already gone */
      }
    }
    setView((v) => ({ ...v, x: d.ox + dx, y: d.oy + dy }));
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) {
      drag.current = null;
      window.setTimeout(() => {
        didDrag.current = false;
      }, 0);
    } else if (pointers.current.size === 1) {
      const rest = [...pointers.current.values()][0];
      if (rest) drag.current = { sx: rest.x, sy: rest.y, ox: view.x, oy: view.y, moved: true };
    }
  };

  const zoomBy = (f: number) => setView((v) => zoomAt(v, f, vp.w / 2, vp.h / 2));
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const step = 48;
    if (e.key === "+" || e.key === "=") zoomBy(1.2);
    else if (e.key === "-") zoomBy(1 / 1.2);
    else if (e.key === "0") requestCamera("fit");
    else if (e.key === "ArrowLeft") setView((v) => ({ ...v, x: v.x + step }));
    else if (e.key === "ArrowRight") setView((v) => ({ ...v, x: v.x - step }));
    else if (e.key === "ArrowUp") setView((v) => ({ ...v, y: v.y + step }));
    else if (e.key === "ArrowDown") setView((v) => ({ ...v, y: v.y - step }));
    else return;
    e.preventDefault();
  };

  /* ---- tree interactions ---- */
  const allBranches = useMemo(() => branchIds(tree), [tree]);
  const allOpen = allBranches.every((id) => expanded.has(id));
  const toggleAll = () => {
    setExpanded(allOpen ? new Set([tree.id]) : new Set(allBranches));
    requestCamera("fit");
  };
  const onToggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const matches = useMemo(
    () => (testMode ? [] : searchNodes(tree, query, lang)),
    [tree, query, lang, testMode],
  );
  const matchKey = matches.join("|");
  const goToMatch = useCallback(
    (i: number) => {
      const id = matches[i];
      if (!id) return;
      setMatchIdx(i);
      setFocusId(id);
      setExpanded((prev) => {
        const next = new Set(prev);
        for (const a of ancestorIds(tree, id)) next.add(a);
        return next;
      });
      requestCamera({ center: id });
    },
    [matches, tree, requestCamera],
  );
  useEffect(() => {
    if (matchKey) goToMatch(0);
    else setFocusId(null);
    // Only a new result set jumps to its first match.
  }, [matchKey]);
  const matchSet = useMemo(() => new Set(matches), [matches]);

  const nodeById = useMemo(() => {
    const m = new Map<string, MindMapNode>();
    const walk = (n: MindMapNode) => {
      m.set(n.id, n);
      n.children?.forEach(walk);
    };
    walk(tree);
    return m;
  }, [tree]);

  const onNode = useCallback(
    (id: string) => {
      if (didDrag.current) return;
      const p = layout.byId.get(id);
      if (!p) return;
      if (testMode) {
        if (grade) setSelectedId(id);
        else if (isBlankDepth(p.depth, blankMin)) setSlotId(id);
        return;
      }
      setSelectedId(id);
    },
    [layout, testMode, grade, blankMin],
  );

  /* ---- recall mode ---- */
  const blanks = useMemo(
    () => (testMode ? visibleBlanks(layout, blankMin) : []),
    [testMode, layout, blankMin],
  );
  const answered = blanks.filter((n) => (answers[n.id] ?? "").trim()).length;
  const slotNode = slotId ? (nodeById.get(slotId) ?? null) : null;
  const slotOptions = useMemo(
    () => (slotId ? blankOptions(tree, slotId, lang, 4) : []),
    [tree, slotId, lang],
  );

  const enterTest = () => {
    setTestMode(true);
    setSelectedId(null);
    setAnswers({});
    setGrade(null);
    setQuery("");
    setExpanded(defaultExpanded(tree));
  };
  const exitTest = () => {
    setTestMode(false);
    setSlotId(null);
    setAnswers({});
    setGrade(null);
    setSelectedId(null);
  };
  const retry = () => {
    setAnswers({});
    setGrade(null);
    setSelectedId(null);
  };
  const check = () => {
    const g = gradeBlankMap(blanks, answers);
    setGrade(g);
    setSlotId(null);
    for (const n of blanks) {
      if (n.blockId) onResult?.(n.blockId, `mm-${n.id}`.slice(0, 40), g.verdicts[n.id] === "right");
    }
    if (g.total > 0 && g.pct > (best[activeId] ?? -1)) {
      const next = { ...best, [activeId]: g.pct };
      setBest(next);
      saveBest(userId, storage(), next);
    }
  };

  const switchSource = (id: string) => {
    if (id === activeId) return;
    setSourceId(id);
  };

  const selected = selectedId ? (nodeById.get(selectedId) ?? null) : null;
  const showCard = selected !== null && (!testMode || grade !== null);
  const selectedLevel = selected?.blockId
    ? masteryLevel(radar.blocks[String(selected.blockId)], weakness(radar, selected.blockId))
    : null;
  const selectedVerdict = selected && grade ? grade.verdicts[selected.id] : undefined;

  const askAboutNode = (n: MindMapNode) => {
    const name = n.title[lang];
    if (pack) {
      ask(rtl ? `وسّع فرع ${name} في الخريطة` : `Expand the “${name}” branch of the map`, {
        studio: { kind: "mindmap", packId: pack.id },
      });
    } else if (testMode) {
      ask(rtl ? `اشرحلي ${name} بالتفصيل` : `Explain ${name} in detail`);
    } else {
      // Noor Studio builds a new, expanded map of this branch and saves it for the student.
      ask(
        rtl ? `اعمل لي خريطة ذهنية موسعة عن ${name}` : `Make me an expanded mind map about ${name}`,
        { detect: true },
      );
    }
  };

  // Popover position (screen space inside the canvas).
  const slotPlaced = slotId ? layout.byId.get(slotId) : undefined;
  let popLeft = 8;
  let popTop = 8;
  if (slotPlaced) {
    const sx = view.x + slotPlaced.x * view.k;
    const sy = view.y + slotPlaced.y * view.k;
    const sh = slotPlaced.h * view.k;
    popLeft = Math.max(8, Math.min(vp.w - 288, sx + (slotPlaced.w * view.k) / 2 - 140));
    popTop = sy + sh + 8;
    if (popTop + 290 > vp.h) popTop = Math.max(8, sy - 290 - 8);
  }

  const verdictCounts = grade
    ? { right: grade.right, wrong: grade.total - grade.right }
    : { right: 0, wrong: 0 };

  return (
    <div ref={fs.ref} className={"flex flex-col gap-3 " + fs.frame}>
      {/* Header */}
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="min-w-0 flex-1 text-lg font-bold">🧠 {l(ui.title)}</h2>
        <FullscreenButton active={fs.active} onToggle={() => void fs.toggle()} />
        <div className="flex rounded-full border p-0.5 text-xs font-bold">
          <button
            type="button"
            aria-pressed={tab === "base"}
            onClick={() => {
              setTab("base");
              switchSource("base");
            }}
            className={`rounded-full px-3 py-1 transition ${tab === "base" ? "bg-subject text-primary-foreground" : "hover:bg-accent"}`}
          >
            {l(ui.base)}
          </button>
          <button
            type="button"
            aria-pressed={tab === "mine"}
            onClick={() => {
              setTab("mine");
              const first = studio.mindMapPacks[studio.mindMapPacks.length - 1];
              if (first && !pack) switchSource(first.id);
            }}
            className={`rounded-full px-3 py-1 transition ${tab === "mine" ? "bg-subject text-primary-foreground" : "hover:bg-accent"}`}
          >
            {l(ui.mine)} ({studio.mindMapPacks.length})
          </button>
        </div>
        {!testMode && (
          <button
            type="button"
            onClick={enterTest}
            className="flex items-center gap-1.5 rounded-full bg-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-400 hover:bg-cyan-500/30"
          >
            <Puzzle className="size-3.5" /> {l(ui.testMode)}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 hover:bg-accent"
          aria-label={l(ui.close)}
        >
          <X className="size-5" />
        </button>
      </header>

      {/* Noor's creations */}
      {tab === "mine" && (
        <div className="rounded-2xl border border-subject/30 bg-subject/5 p-3">
          {studio.mindMapPacks.length === 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="min-w-0 flex-1 text-sm text-muted-foreground">{l(ui.noCreations)}</p>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 rounded-full bg-subject px-3 py-1.5 text-xs font-bold text-primary-foreground"
              >
                <Sparkles className="size-3.5" /> {l(ui.askNoor)}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {studio.mindMapPacks.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={p.id === activeId}
                  onClick={() => switchSource(p.id)}
                  className={`max-w-56 truncate rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    p.id === activeId
                      ? "border-subject bg-subject/20 text-subject"
                      : "hover:bg-accent"
                  }`}
                >
                  {p.kind === "blank" ? "🧩 " : "🧠 "}
                  {p.title[lang]}
                </button>
              ))}
              {pack && (
                <span className="ms-auto flex items-center gap-1.5">
                  <span className="rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {l(pack.kind === "blank" ? ui.blankTag : ui.mapTag)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setStudioFocus({ kind: "mindmap", packId: pack.id });
                      setOpen(true);
                    }}
                    className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold hover:bg-accent"
                  >
                    <Pencil className="size-3.5" /> {l(ui.editNoor)}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmDel === pack.id) {
                        mutate((s) => removeMindMapPack(s, pack.id));
                        setConfirmDel(null);
                        setSourceId("base");
                      } else setConfirmDel(pack.id);
                    }}
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${
                      confirmDel === pack.id
                        ? "border-destructive bg-destructive/15 text-destructive"
                        : "hover:bg-accent"
                    }`}
                  >
                    <Trash2 className="size-3.5" />{" "}
                    {l(confirmDel === pack.id ? ui.delSure : ui.del)}
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search / test bar */}
      {!testMode ? (
        <div className="flex items-center gap-2">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value.slice(0, 60))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && matches.length) goToMatch((matchIdx + 1) % matches.length);
              }}
              placeholder={l(ui.search)}
              aria-label={l(ui.search)}
              className="h-9 w-full rounded-full border border-input bg-background/60 ps-9 pe-16 text-sm outline-none focus:border-subject"
            />
            {query.trim().length >= 2 && (
              <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center font-mono text-[11px] text-muted-foreground">
                {matches.length ? `${matchIdx + 1}/${matches.length}` : l(ui.noMatch)}
              </span>
            )}
          </label>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-2.5">
          <span className="text-xs font-bold text-cyan-400">
            🧩 {l(ui.filled)} {answered} {l(ui.of)} {blanks.length}
          </span>
          {grade && (
            <span className="text-xs font-bold">
              {l(ui.score)}: {grade.right}/{grade.total} ({grade.pct}%)
              {best[activeId] !== undefined && (
                <span className="text-muted-foreground">
                  {" "}
                  · {l(ui.best)} {best[activeId]}%
                </span>
              )}
            </span>
          )}
          <span className="flex-1" />
          {grade ? (
            <button
              type="button"
              onClick={retry}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold hover:bg-accent"
            >
              <RotateCcw className="size-3.5" /> {l(ui.retry)}
            </button>
          ) : (
            <button
              type="button"
              onClick={check}
              disabled={answered === 0}
              className="flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600 disabled:opacity-50"
            >
              <CheckCircle2 className="size-3.5" /> {l(ui.check)}
            </button>
          )}
          <button
            type="button"
            onClick={exitTest}
            className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold hover:bg-accent"
          >
            <X className="size-3.5" /> {l(ui.exitTest)}
          </button>
          {grade && (
            <p className="basis-full text-sm" role="status">
              {verdictCounts.right}✅ · {verdictCounts.wrong}❌ —{" "}
              {l(grade.pct >= 80 ? ui.great : grade.pct >= 50 ? ui.good : ui.low)}
            </p>
          )}
        </div>
      )}

      {/* Canvas */}
      <div
        ref={boxRef}
        dir="ltr"
        tabIndex={0}
        role="application"
        aria-label={l(ui.title)}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ background: WORLD_BG, touchAction: "none" }}
        className={
          "relative w-full cursor-grab touch-none select-none overflow-hidden rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:cursor-grabbing " +
          (fs.active ? "min-h-0 flex-1" : "h-[70dvh] min-h-[26rem]")
        }
      >
        <div
          className="absolute left-0 top-0 will-change-transform"
          style={{
            width: layout.width,
            height: layout.height,
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
            transformOrigin: "0 0",
          }}
        >
          <World
            layout={layout}
            lang={lang}
            testMode={testMode}
            blankMin={blankMin}
            answers={answers}
            grade={grade}
            selectedId={selectedId}
            matchSet={matchSet}
            focusId={focusId}
            radar={radar}
            onNode={onNode}
            onToggle={onToggle}
          />
        </div>

        {/* Floating controls */}
        <div data-mm-ui className="absolute bottom-3 right-3 z-10 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={toggleAll}
            aria-label={l(allOpen ? ui.collapseAll : ui.expandAll)}
            title={l(allOpen ? ui.collapseAll : ui.expandAll)}
            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-[#2b2f36] text-slate-100 shadow-lg hover:bg-[#363b44]"
          >
            {allOpen ? (
              <ChevronsDownUp className="size-5" />
            ) : (
              <ChevronsUpDown className="size-5" />
            )}
          </button>
          <div className="flex flex-col overflow-hidden rounded-full border border-white/10 bg-[#2b2f36] shadow-lg">
            <button
              type="button"
              onClick={() => zoomBy(1.25)}
              aria-label={l(ui.zoomIn)}
              title={l(ui.zoomIn)}
              className="flex size-10 items-center justify-center text-slate-100 hover:bg-[#363b44]"
            >
              <Plus className="size-5" />
            </button>
            <span className="mx-2 h-px bg-white/10" />
            <button
              type="button"
              onClick={() => zoomBy(1 / 1.25)}
              aria-label={l(ui.zoomOut)}
              title={l(ui.zoomOut)}
              className="flex size-10 items-center justify-center text-slate-100 hover:bg-[#363b44]"
            >
              <Minus className="size-5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => requestCamera("fit")}
            aria-label={l(ui.fitBtn)}
            title={l(ui.fitBtn)}
            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-[#2b2f36] text-slate-100 shadow-lg hover:bg-[#363b44]"
          >
            <Maximize2 className="size-5" />
          </button>
        </div>

        {/* Node summary card */}
        {showCard && selected && (
          <div
            data-mm-ui
            dir={rtl ? "rtl" : "ltr"}
            className="absolute bottom-3 left-3 z-10 max-h-[60%] w-[min(26rem,calc(100%-5.5rem))] overflow-y-auto rounded-2xl border border-white/10 bg-[#2b2f36]/95 p-3.5 text-slate-100 shadow-2xl backdrop-blur"
          >
            <div className="mb-1.5 flex items-start gap-2">
              <h3 className="flex-1 text-sm font-bold leading-6">{selected.title[lang]}</h3>
              {selected.badge && (
                <span className="rounded-full bg-sky-500/20 px-2 py-0.5 font-mono text-[11px] text-sky-200">
                  {selected.badge[lang]}
                </span>
              )}
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label={l(ui.close)}
                className="rounded-full p-1 text-slate-300 hover:bg-white/10"
              >
                <X className="size-4" />
              </button>
            </div>
            {selectedVerdict && (
              <p
                className={`mb-1.5 text-xs font-bold ${selectedVerdict === "right" ? "text-emerald-300" : "text-red-300"}`}
              >
                {l(selectedVerdict === "right" ? ui.right : ui.wrong)}
                {selectedVerdict !== "right" && (
                  <>
                    {" · "}
                    {l(ui.rightIs)}: {selected.title[lang]}
                  </>
                )}
              </p>
            )}
            {selected.summary && (
              <p className="mb-2 text-[13px] leading-6 text-slate-200">
                {selectedVerdict ? (
                  <>
                    <Lightbulb className="me-1 inline size-3.5 text-amber-300" />
                    <b>{l(ui.noorSays)}: </b>
                  </>
                ) : null}
                {selected.summary[lang]}
              </p>
            )}
            {!testMode && (
              <p className="mb-2 text-[11px] text-slate-400">
                <span
                  className={`me-1 inline-block size-2 rounded-full ${selectedLevel ? MASTERY_DOT[selectedLevel] : "bg-slate-500"}`}
                />
                {l(
                  selectedLevel === "good"
                    ? ui.masteryGood
                    : selectedLevel === "mid"
                      ? ui.masteryMid
                      : selectedLevel === "bad"
                        ? ui.masteryBad
                        : ui.masteryNone,
                )}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {selected.blockId && !testMode && (
                <button
                  type="button"
                  onClick={() => {
                    onGoToBlock(selected.blockId!);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-cyan-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-600"
                >
                  <ExternalLink className="size-3.5" /> {l(ui.goToBlock)} §{selected.blockId}
                </button>
              )}
              {selected.supports3D && selected.blockId && onView3D && !testMode && (
                <button
                  type="button"
                  onClick={() => {
                    onView3D(selected.blockId!);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20"
                >
                  <Box className="size-3.5" /> {l(ui.view3D)}
                </button>
              )}
              <button
                type="button"
                onClick={() => askAboutNode(selected)}
                className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold text-slate-100 hover:bg-white/10"
              >
                <Sparkles className="size-3.5 text-amber-300" />{" "}
                {l(testMode ? ui.explainMore : pack ? ui.expandNoor : ui.editNoor)}
              </button>
            </div>
          </div>
        )}

        {/* Blank-slot popover */}
        {slotNode && !grade && (
          <SlotPopover
            key={slotNode.id}
            options={slotOptions}
            current={answers[slotNode.id] ?? ""}
            lang={lang}
            left={popLeft}
            top={popTop}
            onPick={(text) => {
              setAnswers((a) => ({ ...a, [slotNode.id]: text }));
              setSlotId(null);
            }}
            onClear={() => {
              setAnswers((a) => {
                const next = { ...a };
                delete next[slotNode.id];
                return next;
              });
              setSlotId(null);
            }}
            onClose={() => setSlotId(null)}
          />
        )}
      </div>
    </div>
  );
}
