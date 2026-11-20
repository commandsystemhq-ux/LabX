import { Activity, Calculator, LineChart as LineIcon, SlidersHorizontal } from "lucide-react";
import { useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { extras } from "@/data/simExtras";
import type { SimKey, SimValues, SimulationDef } from "@/data/simulations";
import type { ControlMode } from "@/data/tutor";
import { useLang, type UiKey } from "@/lib/i18n";
import { ErrorModePanel } from "./ErrorModePanel";
import { LiveGraph } from "./LiveGraph";

interface Props {
  sim: SimulationDef;
  values: SimValues;
  onChange: (key: SimKey, value: number) => void;
  onCommit: (key: SimKey, value: number) => void;
  mode: ControlMode;
  onMode: (mode: ControlMode) => void;
  errorMode: boolean;
  onErrorMode: (enabled: boolean) => void;
  onFault: (id: number) => void;
  /** Variable highlighted by the active guided step. */
  focusKey: SimKey | null;
}

function digitsFor(step: number) {
  return step >= 1 ? 0 : step >= 0.1 ? 1 : 2;
}

const MODES: { id: ControlMode; label: UiKey }[] = [
  { id: "guided", label: "modeGuided" },
  { id: "free", label: "modeFree" },
];

export function ControlPanel({
  sim,
  values,
  onChange,
  onCommit,
  mode,
  onMode,
  errorMode,
  onErrorMode,
  onFault,
  focusKey,
}: Props) {
  const { t, l, dir, lang } = useLang();
  const readouts = useMemo(() => sim.readouts(values), [sim, values]);
  const graph = useMemo(() => sim.graph(values), [sim, values]);
  const calc = useMemo(() => extras[sim.id].calc(values, lang), [sim, values, lang]);
  const hazards = useMemo(() => extras[sim.id].hazards(values), [sim, values]);

  return (
    <div className="flex flex-col gap-4">
      <section className="glass rounded-3xl p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <SlidersHorizontal className="size-4 text-subject" /> {t("variables")}
          </h2>
          <div
            role="radiogroup"
            aria-label={t("controlMode")}
            className="flex rounded-xl bg-background/60 p-0.5"
          >
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={mode === m.id}
                onClick={() => onMode(m.id)}
                className={
                  "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors " +
                  (mode === m.id
                    ? "bg-subject text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {t(m.label)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {sim.variables.map((v) => {
            const val = values[v.key];
            const focused = focusKey === v.key;
            return (
              <div
                key={v.key}
                className={
                  "rounded-2xl border bg-background/40 p-3 transition-colors " +
                  (focused ? "animate-pulse-ring border-subject" : "border-border")
                }
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <label
                    className="flex items-center gap-2 text-sm font-semibold"
                    htmlFor={`var-${v.key}`}
                  >
                    <span
                      className="flex h-6 min-w-6 items-center justify-center rounded-md bg-subject/15 px-1 font-mono text-[11px] font-bold text-subject"
                      dir="ltr"
                    >
                      {v.symbol}
                    </span>
                    {l(v.label)}
                  </label>
                  <span className="font-mono text-lg font-bold tabular-nums" dir="ltr">
                    {val.toFixed(digitsFor(v.step))}
                    <span className="ms-1 text-xs text-muted-foreground">{v.unit}</span>
                  </span>
                </div>
                <Slider
                  id={`var-${v.key}`}
                  dir={dir}
                  min={v.min}
                  max={v.max}
                  step={v.step}
                  value={[val]}
                  onValueChange={([n]) => n !== undefined && onChange(v.key, n)}
                  onValueCommit={([n]) => n !== undefined && onCommit(v.key, n)}
                  aria-label={l(v.label)}
                />
                <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted-foreground">
                  <span>
                    {v.min}
                    {v.unit}
                  </span>
                  <span>
                    {v.max}
                    {v.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <ErrorModePanel
        sim={sim}
        values={values}
        enabled={errorMode}
        hazards={hazards}
        onEnabled={onErrorMode}
        onFault={onFault}
      />

      <section className="glass rounded-3xl p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Activity className="size-4 text-subject" /> {t("liveReadouts")}
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {readouts.map((r, i) => (
            <div
              key={r.key}
              className={
                "rounded-2xl border p-2.5 text-center " +
                (i === 0 ? "border-subject/40 bg-subject/10" : "border-border bg-background/40")
              }
            >
              <p className="truncate text-[10px] text-muted-foreground">{l(r.label)}</p>
              <p
                className={
                  "mt-1 font-mono text-lg font-bold tabular-nums " + (i === 0 ? "text-subject" : "")
                }
                dir="ltr"
              >
                {Number.isFinite(r.value) ? r.value.toFixed(r.digits) : "∞"}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground" dir="ltr">
                {r.symbol} · {r.unit}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-3xl p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <LineIcon className="size-4 text-subject" /> {t("liveGraph")}
        </h2>
        <LiveGraph graph={graph} />
      </section>

      <section className="glass rounded-3xl p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Calculator className="size-4 text-subject" /> {t("calcTitle")}
        </h2>
        <ul className="flex flex-col gap-2">
          {calc.map((c) => (
            <li
              key={c.label}
              className="rounded-xl border border-border bg-background/40 px-3 py-2"
            >
              <p className="text-[11px] text-muted-foreground">{c.label}</p>
              <p className="mt-0.5 break-words font-mono text-xs font-semibold" dir="ltr">
                {c.expr}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
