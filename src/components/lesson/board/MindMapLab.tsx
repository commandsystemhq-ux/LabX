import { ChevronDown, ChevronLeft, ChevronRight, Search, X, Box, ExternalLink } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
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
};

export interface MindMapLabProps {
  radar: RadarState;
  onGoToBlock: (block: number) => void;
  onView3D?: (focus: string) => void;
  onClose: () => void;
}

/** Mastery color based on radar weakness. */
function masteryColor(weak: number): string {
  if (weak >= 50) return "text-red-500";
  if (weak >= 25) return "text-yellow-500";
  return "text-green-500";
}

/** Mastery background based on radar weakness. */
function masteryBg(weak: number): string {
  if (weak >= 50) return "bg-red-500/10 border-red-500/30";
  if (weak >= 25) return "bg-yellow-500/10 border-yellow-500/30";
  return "bg-green-500/10 border-green-500/30";
}

interface NodeCardProps {
  node: MindMapNode;
  radar: RadarState;
  expanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  lang: "ar" | "en";
}

function NodeCard({ node, radar, expanded, onToggle, onSelect, lang }: NodeCardProps) {
  const hasChildren = node.children && node.children.length > 0;
  const weak = node.blockId ? weakness(radar, node.blockId) : 0;
  const color = node.blockId ? masteryColor(weak) : "text-foreground";
  const bg = node.blockId ? masteryBg(weak) : "bg-background/50";

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onSelect}
        className={`group flex items-center gap-2 rounded-xl border px-3 py-2 text-start transition hover:bg-accent ${bg}`}
      >
        {hasChildren && (
          <span className="flex-shrink-0">
            {expanded ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : lang === "ar" ? (
              <ChevronLeft className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className={`flex items-center gap-2 ${color}`}>
            <span className="truncate font-bold">
              {lang === "ar" ? node.title.ar : node.title.en}
            </span>
            {node.badge && (
              <span className="flex-shrink-0 rounded-full bg-subject/20 px-2 py-0.5 text-xs font-mono">
                {lang === "ar" ? node.badge.ar : node.badge.en}
              </span>
            )}
          </div>
        </div>
        {node.blockId && (
          <span className="flex-shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-mono">
            §{node.blockId}
          </span>
        )}
      </button>
      {hasChildren && expanded && (
        <div className="mt-1 me-4 flex flex-col gap-1 border-s-subject/30 ps-2 rtl:border-e-2 rtl:border-s-0">
          {node.children!.map((child) => (
            <NodeCard
              key={child.id}
              node={child}
              radar={radar}
              expanded={false}
              onToggle={() => {}}
              onSelect={onSelect}
              lang={lang}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MindMapLab({ radar, onGoToBlock, onView3D, onClose }: MindMapLabProps) {
  const { l, lang } = useLang();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["root", "plant", "human"]));
  const [selected, setSelected] = useState<MindMapNode | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectNode = useCallback(
    (node: MindMapNode) => {
      setSelected(node);
      if (node.children && node.children.length > 0) {
        toggleExpand(node.id);
      }
    },
    [toggleExpand],
  );

  const filteredNodes = useMemo(() => {
    if (!search.trim()) return null;
    const query = search.toLowerCase();
    const results: MindMapNode[] = [];

    function searchNode(node: MindMapNode) {
      const titleMatch =
        node.title.ar.toLowerCase().includes(query) || node.title.en.toLowerCase().includes(query);
      const badgeMatch = node.badge
        ? node.badge.ar.toLowerCase().includes(query) || node.badge.en.toLowerCase().includes(query)
        : false;
      const summaryMatch = node.summary
        ? node.summary.ar.toLowerCase().includes(query) ||
          node.summary.en.toLowerCase().includes(query)
        : false;

      if (titleMatch || badgeMatch || summaryMatch) {
        results.push(node);
      }
      if (node.children) {
        for (const child of node.children) {
          searchNode(child);
        }
      }
    }

    searchNode(supportMindMap.root);
    return results;
  }, [search]);

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

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <header className="flex items-center gap-3">
        <h2 className="flex-1 text-lg font-bold">🧠 {l(ui.title)}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 hover:bg-accent"
          aria-label={l(ui.close)}
        >
          <X className="size-5" />
        </button>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={l(ui.search)}
          className="w-full rounded-xl border bg-background/50 py-2 ps-10 pe-3 text-sm focus:border-subject focus:outline-none"
        />
      </div>

      {/* Tree or Search Results */}
      <div className="flex-1 overflow-y-auto">
        {filteredNodes ? (
          filteredNodes.length > 0 ? (
            <div className="flex flex-col gap-1">
              {filteredNodes.map((node) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  radar={radar}
                  expanded={expanded.has(node.id)}
                  onToggle={() => toggleExpand(node.id)}
                  onSelect={() => selectNode(node)}
                  lang={lang}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">{l(ui.noResults)}</p>
          )
        ) : (
          <div className="flex flex-col gap-1">
            <NodeCard
              node={supportMindMap.root}
              radar={radar}
              expanded={expanded.has(supportMindMap.root.id)}
              onToggle={() => toggleExpand(supportMindMap.root.id)}
              onSelect={() => selectNode(supportMindMap.root)}
              lang={lang}
            />
            {expanded.has(supportMindMap.root.id) && supportMindMap.root.children && (
              <div className="mt-1 flex flex-col gap-1 border-s-subject/30 ps-2 rtl:border-e-2 rtl:border-s-0">
                {supportMindMap.root.children.map((child) => (
                  <NodeCard
                    key={child.id}
                    node={child}
                    radar={radar}
                    expanded={expanded.has(child.id)}
                    onToggle={() => toggleExpand(child.id)}
                    onSelect={() => selectNode(child)}
                    lang={lang}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Node Card */}
      {selected && (
        <div className="glass rounded-2xl p-4">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="flex-1 font-bold">
              {lang === "ar" ? selected.title.ar : selected.title.en}
            </h3>
            {selected.badge && (
              <span className="rounded-full bg-subject/20 px-2 py-0.5 text-xs font-mono">
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
                className="flex items-center gap-1.5 rounded-full bg-subject px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-subject/80"
              >
                <ExternalLink className="size-3.5" /> {l(ui.goToBlock)} §{selected.blockId}
              </button>
            )}
            {selected.supports3D && (
              <button
                type="button"
                onClick={handleView3D}
                className="flex items-center gap-1.5 rounded-full border border-subject/40 bg-subject/10 px-3 py-1.5 text-xs font-bold text-subject hover:bg-subject/20"
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
