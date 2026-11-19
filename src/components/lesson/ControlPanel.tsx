import { Activity, LineChart as LineIcon, SlidersHorizontal } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import type { SimKey, SimValues, SimulationDef } from "@/data/simulations";
import { useLang } from "@/lib/i18n";
import { LiveGraph } from "./LiveGraph";

interface Props {
  sim: SimulationDef;
  values: SimValues;
  onChange: (key: SimKey, value: number) => void;
  onCommit: (key: SimKey, value: number) => void;
}

function digitsFor(step: number) {
  return step >= 1 ? 0 : step >= 0.1 ? 1 : 2;
}

export function ControlPanel({ sim, values, onChange, onCommit }: Props) {
  const { t, l, dir } = useLang();
  const readouts = sim.readouts(values);
  const graph = sim.graph(values);

  return (
    <div className="flex flex-col gap-4">
      <section className="glass rounded-3xl p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <SlidersHorizontal className="size-4 text-subject" /> {t("variables")}
        </h2>
        <div className="flex flex-col gap-4">
          {sim.variables.map((v) => {
            const val = values[v.key];
            return (
              <div key={v.key} className="rounded-2xl border border-border bg-background/40 p-3">
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
    </div>
  );
}
