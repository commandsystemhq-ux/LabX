import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Box,
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supportMindMap, findNode, collectBlockIds } from "@/data/lessons/supportMindMap";
import type { MindMapNode } from "@/data/lessons/supportTypes";
import { weakness } from "@/data/lessons/supportRadar";
import type { RadarState } from "@/data/lessons/supportRadar";
import { useLang, type L10n } from "@/lib/i18n";

const t = (ar: string, en: string): L10n => ({ ar, en });

const ui = {
  title: t("الخريطة الذهنية", "Mind Map"),
  search: t("ابحث...", "Search..."),
  goToBlock: t("انتقل للجزئية", "Go to block"),
  view3D: t("اعرض في 3D", "View in 3D"),
  close: t("إغلاق", "Close"),
  summary: t("ملخص", "Summary"),
  noResults: t("لا توجد نتائج", "No results"),
  testMode: t("وضع الاختبار: شبكة فاضية", "Test Mode: Empty Grid"),
  checkAnswers: t("صحّح الخريطة يا نور", "Check with Noor"),
  exitTest: t("خروج من الاختبار", "Exit Test"),
  correct: t("صح", "Correct"),
  wrong: t("غلط", "Wrong"),
  fillPlaceholder: t("؟", "?"),
};

export interface MindMapLabProps {
  radar: RadarState;
  onGoToBlock: (block: number) => void;
  onView3D?: (focus: string) => void;
  onClose: () => void;
}

/** Layout constants */
const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;
const LEVEL_GAP_X = 220;
const MIN_NODE_GAP_Y = 20;

interface LayoutNode {
  node: MindMapNode;
  x: number;
  y: number;
  width: number;
  height: number;
  children: LayoutNode[];
}

/**
 * Pure layout function: calculates (x, y) for each node in a horizontal tree.
 * Ensures no overlapping nodes with balanced vertical spacing.
 */
export function layoutMindMapTree(root: MindMapNode, expanded: Set<string>): LayoutNode {
  const layoutCache = new Map<string, LayoutNode>();

  function measureSubtree(node: MindMapNode): number {
    if (!node.children || !expanded.has(node.id)) {
      return NODE_HEIGHT;
    }
    let totalHeight = 0;
    for (const child of node.children) {
      totalHeight += measureSubtree(child);
      totalHeight += MIN_NODE_GAP_Y;
    }
    return Math.max(NODE_HEIGHT, totalHeight - MIN_NODE_GAP_Y);
  }

  function layoutNode(node: MindMapNode, x: number, yStart: number, yEnd: number): LayoutNode {
    const existing = layoutCache.get(node.id);
    if (existing) return existing;

    const y = (yStart + yEnd) / 2;
    const layout: LayoutNode = {
      node,
      x,
      y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      children: [],
    };

    if (node.children && expanded.has(node.id)) {
      const totalHeight = measureSubtree(node);
      let currentY = y - totalHeight / 2;

      for (const child of node.children) {
        const childHeight = measureSubtree(child);
        const childLayout = layoutNode(child, x + LEVEL_GAP_X, currentY, currentY + childHeight);
        layout.children.push(childLayout);
        currentY += childHeight + MIN_NODE_GAP_Y;
      }
    }

    layoutCache.set(node.id, layout);
    return layout;
  }

  const totalHeight = measureSubtree(root);
  return layoutNode(root, 50, 0, totalHeight);
}

/** Generate cubic Bezier path between parent and child nodes */
function bezierPath(parent: LayoutNode, child: LayoutNode): string {
  const x1 = parent.x + parent.width;
  const y1 = parent.y + parent.height / 2;
  const x2 = child.x;
  const y2 = child.y + child.height / 2;
  const cx1 = x1 + (x2 - x1) / 2;
  const cx2 = x1 + (x2 - x1) / 2;
  return `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
}

/** Mastery color based on radar weakness */
function masteryColor(weak: number): string {
  if (weak >= 50) return "bg-red-500/20 border-red-500/50 text-red-400";
  if (weak >= 25) return "bg-yellow-500/20 border-yellow-500/50 text-yellow-400";
  return "bg-green-500/20 border-green-500/50 text-green-400";
}

export function MindMapLab({ radar, onGoToBlock, onView3D, onClose }: MindMapLabProps) {
  const { l, lang } = useLang();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["root", "plant", "human"]));
  const [selected, setSelected] = useState<MindMapNode | null>(null);
  const [testMode, setTestMode] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  // Pan and zoom state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const layout = useMemo(() => layoutMindMapTree(supportMindMap.root, expanded), [expanded]);

  // Calculate bounds for fit
  const bounds = useMemo(() => {
    let maxX = 0,
      maxY = 0,
      minY = 0;
    function traverse(l: LayoutNode) {
      maxX = Math.max(maxX, l.x + l.width);
      maxY = Math.max(maxY, l.y + l.height / 2);
      minY = Math.min(minY, l.y - l.height / 2);
      l.children.forEach(traverse);
    }
    traverse(layout);
    return { width: maxX + 100, height: maxY - minY + 100, minY };
  }, [layout]);

  // Pan handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    },
    [pan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.min(2, Math.max(0.3, z * delta)));
  }, []);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(2, z * 1.2)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(0.3, z / 1.2)), []);
  const fitView = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const scaleX = containerWidth / bounds.width;
    const scaleY = containerHeight / bounds.height;
    const newZoom = Math.min(scaleX, scaleY, 1);
    setZoom(newZoom);
    setPan({ x: 20, y: -bounds.minY * newZoom + 20 });
  }, [bounds]);

  useEffect(() => {
    fitView();
  }, [fitView]);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleGoToBlock = useCallback(() => {
    if (selected?.blockId) {
      onGoToBlock(selected.blockId);
      onClose();
    }
  }, [selected, onGoToBlock, onClose]);

  const handleView3D = useCallback(() => {
    if (selected?.supports3D && selected.blockId && onView3D) {
      onView3D(selected.id);
      onClose();
    }
  }, [selected, onView3D, onClose]);

  // Test mode: collect all leaf nodes with blockId
  const testNodes = useMemo(() => {
    const nodes: MindMapNode[] = [];
    function collect(node: MindMapNode) {
      if (node.blockId && (!node.children || node.children.length === 0)) {
        nodes.push(node);
      }
      if (node.children) {
        node.children.forEach(collect);
      }
    }
    collect(supportMindMap.root);
    return nodes;
  }, []);

  const handleAnswerSelect = useCallback((nodeId: string, answer: string) => {
    setUserAnswers((prev) => ({ ...prev, [nodeId]: answer }));
  }, []);

  const handleCheckAnswers = useCallback(() => {
    const results: Record<string, boolean> = {};
    testNodes.forEach((node) => {
      const correctAnswer = lang === "ar" ? node.title.ar : node.title.en;
      results[node.id] = userAnswers[node.id] === correctAnswer;
    });
    setChecked(results);
  }, [testNodes, userAnswers, lang]);

  const enterTestMode = useCallback(() => {
    setTestMode(true);
    setUserAnswers({});
    setChecked({});
    setExpanded(new Set(["root", "plant", "human"]));
  }, []);

  const exitTestMode = useCallback(() => {
    setTestMode(false);
    setUserAnswers({});
    setChecked({});
  }, []);

  // Render node
  const renderNode = useCallback(
    (l: LayoutNode, depth: number = 0): React.ReactNode => {
      const weak = l.node.blockId ? weakness(radar, l.node.blockId) : 0;
      const masteryClass = l.node.blockId ? masteryColor(weak) : "bg-slate-700/50 border-slate-600";
      const hasChildren = l.node.children && l.node.children.length > 0;
      const isExpanded = expanded.has(l.node.id);
      const isSelected = selected?.id === l.node.id;

      // Test mode: show placeholder for leaf nodes
      const showTestPlaceholder = testMode && l.node.blockId && !l.node.children?.length;
      const userAnswer = userAnswers[l.node.id];
      const isChecked = l.node.id in checked;
      const isCorrect = checked[l.node.id];

      // Generate options for test mode (correct + 2 wrong from siblings)
      const testOptions = useMemo(() => {
        if (!showTestPlaceholder) return [];
        const siblings = testNodes.filter((n) => n.id !== l.node.id);
        const shuffled = siblings.sort(() => Math.random() - 0.5).slice(0, 2);
        const correct = lang === "ar" ? l.node.title.ar : l.node.title.en;
        return [correct, ...shuffled.map((n) => (lang === "ar" ? n.title.ar : n.title.en))].sort(
          () => Math.random() - 0.5,
        );
      }, [showTestPlaceholder, testNodes, l.node, lang]);

      return (
        <g key={l.node.id}>
          {/* Bezier paths to children */}
          {l.children.map((child) => (
            <path
              key={`path-${child.node.id}`}
              d={bezierPath(l, child)}
              fill="none"
              stroke="#38BDF8"
              strokeWidth={2}
              opacity={0.6}
            />
          ))}

          {/* Node rectangle */}
          <g
            transform={`translate(${l.x}, ${l.y - l.height / 2})`}
            onClick={() => !testMode && setSelected(l.node)}
            style={{ cursor: testMode ? "default" : "pointer" }}
          >
            <rect
              width={l.width}
              height={l.height}
              rx={12}
              className={`${masteryClass} ${isSelected ? "ring-2 ring-cyan-400" : ""}`}
              fill="currentColor"
              fillOpacity={0.1}
              stroke="currentColor"
              strokeWidth={1.5}
            />

            {/* Expand/collapse button */}
            {hasChildren && !testMode && (
              <g
                transform={`translate(${lang === "ar" ? -12 : l.width + 12}, ${l.height / 2})`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(l.node.id);
                }}
                style={{ cursor: "pointer" }}
              >
                <circle r={10} fill="#1e293b" stroke="#38BDF8" strokeWidth={1.5} />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#38BDF8"
                  fontSize={14}
                  fontWeight="bold"
                >
                  {isExpanded ? (lang === "ar" ? ">" : "<") : lang === "ar" ? "<" : ">"}
                </text>
              </g>
            )}

            {/* Node content */}
            <foreignObject x={8} y={8} width={l.width - 16} height={l.height - 16}>
              <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
                {showTestPlaceholder ? (
                  <>
                    <span className="text-xs text-slate-400">
                      {lang === "ar" ? `§${l.node.blockId}` : `§${l.node.blockId}`}
                    </span>
                    {isChecked ? (
                      <div className="flex items-center gap-1">
                        {isCorrect ? (
                          <CheckCircle2 className="size-5 text-green-400" />
                        ) : (
                          <XCircle className="size-5 text-red-400" />
                        )}
                        <span className="text-sm font-bold">
                          {lang === "ar" ? l.node.title.ar : l.node.title.en}
                        </span>
                      </div>
                    ) : userAnswer ? (
                      <span className="text-sm font-bold text-cyan-400">{userAnswer}</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <HelpCircle className="size-4 text-cyan-400" />
                        <span className="text-lg font-bold text-cyan-400">?</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-sm font-bold">
                      {lang === "ar" ? l.node.title.ar : l.node.title.en}
                    </span>
                    {l.node.badge && (
                      <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-mono">
                        {lang === "ar" ? l.node.badge.ar : l.node.badge.en}
                      </span>
                    )}
                  </>
                )}
              </div>
            </foreignObject>
          </g>

          {/* Render children */}
          {l.children.map((child) => renderNode(child, depth + 1))}
        </g>
      );
    },
    [expanded, selected, testMode, userAnswers, checked, radar, lang, toggleExpand],
  );

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <header className="flex items-center gap-3">
        <h2 className="flex-1 text-lg font-bold">🧠 {l(ui.title)}</h2>
        {!testMode && (
          <button
            type="button"
            onClick={enterTestMode}
            className="flex items-center gap-1.5 rounded-full bg-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-400 hover:bg-cyan-500/30"
          >
            <HelpCircle className="size-3.5" /> {l(ui.testMode)}
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

      {/* Test mode controls */}
      {testMode && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exitTestMode}
            className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold hover:bg-accent"
          >
            <X className="size-3.5" /> {l(ui.exitTest)}
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleCheckAnswers}
            disabled={Object.keys(userAnswers).length < testNodes.length}
            className="flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600 disabled:opacity-50"
          >
            <CheckCircle2 className="size-3.5" /> {l(ui.checkAnswers)}
          </button>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden rounded-2xl bg-slate-900"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {renderNode(layout)}
        </svg>

        {/* Zoom controls */}
        <div className="absolute bottom-4 end-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={zoomIn}
            className="rounded-full bg-slate-800 p-2 text-slate-300 hover:bg-slate-700"
          >
            <ZoomIn className="size-4" />
          </button>
          <button
            type="button"
            onClick={zoomOut}
            className="rounded-full bg-slate-800 p-2 text-slate-300 hover:bg-slate-700"
          >
            <ZoomOut className="size-4" />
          </button>
          <button
            type="button"
            onClick={fitView}
            className="rounded-full bg-slate-800 p-2 text-slate-300 hover:bg-slate-700"
          >
            <Maximize2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Selected Node Card */}
      {selected && !testMode && (
        <div className="glass rounded-2xl p-4">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="flex-1 font-bold">
              {lang === "ar" ? selected.title.ar : selected.title.en}
            </h3>
            {selected.badge && (
              <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-mono">
                {lang === "ar" ? selected.badge.ar : selected.badge.en}
              </span>
            )}
          </div>
          {selected.summary && (
            <p className="mb-3 text-sm text-muted-foreground">
              {lang === "ar" ? selected.summary.ar : selected.summary.en}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {selected.blockId && (
              <button
                type="button"
                onClick={handleGoToBlock}
                className="flex items-center gap-1.5 rounded-full bg-cyan-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-600"
              >
                <ExternalLink className="size-3.5" /> {l(ui.goToBlock)} §{selected.blockId}
              </button>
            )}
            {selected.supports3D && (
              <button
                type="button"
                onClick={handleView3D}
                className="flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20"
              >
                <Box className="size-3.5" /> {l(ui.view3D)}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
