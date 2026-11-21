import { ShieldAlert } from "lucide-react";
import { extras, type Hazard } from "@/data/simExtras";
import type { SimulationDef, SimValues } from "@/data/simulations";
import { useLang } from "@/lib/i18n";

interface Props {
  sim: SimulationDef;
  values: SimValues;
  enabled: boolean;
  hazards: Hazard[];
  onEnabled: (v: boolean) => void;
  onFault: (id: number) => void;
}

/** Real-World Error Mode: opt-in switch + list of injectable faults for the current simulation. */
export function ErrorModePanel({ sim, values, enabled, hazards, onEnabled, onFault }: Props) {
  const { t, l } = useLang();
  const faults = extras[sim.id].faults;
  const active = faults.find((f) => f.id === values.fault);

  return (
    <section className="glass rounded-3xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <ShieldAlert className="size-4 text-subject" /> {t("errorMode")}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("errorModeHint")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={t("errorMode")}
          onClick={() => onEnabled(!enabled)}
          className={
            "relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
            (enabled ? "border-subject bg-subject" : "border-input bg-muted")
          }
        >
          <span
            className={
              "absolute top-0.5 size-4 rounded-full bg-background shadow transition-all " +
              (enabled ? "inset-e-0.5" : "inset-s-0.5")
            }
          />
        </button>
      </div>

      {enabled && (
        <div className="mt-3 animate-fade-up">
          <div role="radiogroup" aria-label={t("errorMode")} className="flex flex-col gap-1.5">
            {[{ id: 0, label: { ar: t("noFault"), en: t("noFault") } }, ...faults].map((f) => {
              const checked = values.fault === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => onFault(f.id)}
                  className={
                    "rounded-xl border px-3 py-2 text-start text-sm font-semibold transition-colors " +
                    (checked
                      ? f.id === 0
                        ? "border-subject/50 bg-subject/10 text-subject"
                        : "border-destructive/60 bg-destructive/10 text-destructive"
                      : "border-border bg-background/40 text-muted-foreground hover:border-subject/40 hover:text-foreground")
                  }
                >
                  {l(f.label)}
                </button>
              );
            })}
          </div>
          {active && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {l(active.description)}
            </p>
          )}
          <p role="status" className="mt-3 text-xs font-semibold">
            {hazards.length === 0 ? (
              <span className="text-bio">{t("noHazards")}</span>
            ) : (
              <span className={hazards[0]?.level === 2 ? "text-destructive" : "text-warning"}>
                {t("hazards")}: {hazards.map((h) => l(h.title)).join(" · ")}
              </span>
            )}
          </p>
        </div>
      )}
    </section>
  );
}
