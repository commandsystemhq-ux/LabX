import { Eye, Layers, Pause, Play, RotateCcw, ZoomIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import type { LayerDef } from "@/data/simExtras";
import { useLang } from "@/lib/i18n";
import type { StageView } from "./scenes";

/** Layer id → visible. Ids come from `extras[sim].layers`. */
export type StageLayers = Record<string, boolean>;

interface Props {
  playing: boolean;
  onPlayingChange: (v: boolean) => void;
  speed: number;
  onSpeed: (v: number) => void;
  onReset: () => void;
  layerDefs: LayerDef[];
  layers: StageLayers;
  onLayers: (l: StageLayers) => void;
  view: StageView;
  onView: (v: StageView) => void;
}

const iconBtn =
  "flex size-9 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function StageToolbar(p: Props) {
  const { t, l, dir } = useLang();
  const [layersOpen, setLayersOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!layersOpen) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setLayersOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [layersOpen]);

  return (
    <div className="glass-strong flex flex-wrap items-center justify-center gap-1 rounded-2xl p-1.5">
      <button
        type="button"
        className={iconBtn + " bg-subject/15 text-subject"}
        onClick={() => p.onPlayingChange(!p.playing)}
        aria-label={p.playing ? t("pause") : t("play")}
        title={p.playing ? t("pause") : t("play")}
      >
        {p.playing ? <Pause className="size-4" /> : <Play className="size-4" />}
      </button>

      <div className="flex items-center gap-2 px-2" title={t("speed")}>
        <span className="hidden text-[11px] text-muted-foreground sm:inline">{t("speed")}</span>
        <Slider
          dir={dir}
          className="w-20 sm:w-24"
          min={0.25}
          max={3}
          step={0.25}
          value={[p.speed]}
          onValueChange={([v]) => p.onSpeed(v ?? 1)}
          aria-label={t("speed")}
        />
        <span className="w-9 font-mono text-[11px] font-bold text-subject">
          {p.speed.toFixed(2).replace(/0$/, "")}×
        </span>
      </div>

      <button
        type="button"
        className={iconBtn}
        onClick={p.onReset}
        aria-label={t("reset")}
        title={t("reset")}
      >
        <RotateCcw className="size-4" />
      </button>

      <div ref={ref} className="relative">
        <button
          type="button"
          className={iconBtn + (layersOpen ? " bg-accent" : "")}
          onClick={() => setLayersOpen((o) => !o)}
          aria-expanded={layersOpen}
          aria-label={t("layers")}
          title={t("layers")}
        >
          <Layers className="size-4" />
        </button>
        {layersOpen && (
          <div className="glass-strong absolute bottom-full z-20 mb-2 w-52 animate-fade-up rounded-xl p-1.5 inset-s-1/2 -translate-x-1/2 rtl:translate-x-1/2">
            {p.layerDefs.map((def) => (
              <label
                key={def.id}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent"
              >
                {l(def.label)}
                <input
                  type="checkbox"
                  checked={p.layers[def.id] ?? false}
                  onChange={(e) => p.onLayers({ ...p.layers, [def.id]: e.target.checked })}
                  className="size-4 accent-subject"
                />
              </label>
            ))}
          </div>
        )}
      </div>

      <span className="mx-1 h-6 w-px bg-border" />

      <div role="radiogroup" aria-label="View" className="flex rounded-xl bg-background/60 p-0.5">
        {(["macro", "molecular"] as const).map((v) => {
          const Icon = v === "macro" ? Eye : ZoomIn;
          const active = p.view === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => p.onView(v)}
              className={
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all " +
                (active
                  ? "bg-subject text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              <Icon className="size-3.5" />
              <span className="hidden sm:inline">{t(v)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
