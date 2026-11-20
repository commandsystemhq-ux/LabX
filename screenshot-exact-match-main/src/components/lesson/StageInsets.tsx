import { activationEnergy, equilibriumProgress } from "@/data/simExtras";
import type { SimValues } from "@/data/simulations";
import { useLang } from "@/lib/i18n";

/** Biology: how far diffusion has progressed towards equilibrium on the simulation clock. */
export function EquilibriumTimeline({ values, time }: { values: SimValues; time: number }) {
  const { t, lang } = useLang();
  const progress = equilibriumProgress(values, time);
  const pct = Math.round(progress * 100);
  const phase =
    progress < 0.1
      ? lang === "ar"
        ? "البداية"
        : "Start"
      : progress < 0.9
        ? lang === "ar"
          ? "انتشار نشط"
          : "Spreading"
        : lang === "ar"
          ? "اتزان"
          : "Equilibrium";

  return (
    <div className="glass-strong rounded-2xl px-3 py-2" dir="ltr">
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className="font-semibold text-muted-foreground">
          {t("timeline")} · {t("equilibrium")}
        </span>
        <span className="font-mono font-bold text-subject">{pct}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <span
          className="absolute inset-y-0 start-0 rounded-full bg-gradient-subject"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>t = {time.toFixed(1)}s</span>
        <span>{phase}</span>
      </div>
    </div>
  );
}

/** Chemistry: activation-energy profile with and without the catalyst. */
export function EnergyDiagram({ catalyst }: { catalyst: number }) {
  const { t } = useLang();
  const e = activationEnergy(catalyst);
  const peak = (ea: number) => 60 - ea * 0.62;
  const curve = (ea: number) => {
    const y = peak(ea);
    return `M 8 60 C 56 60 62 ${y} 100 ${y} S 150 76 192 76`;
  };

  return (
    <div className="glass-strong rounded-2xl px-3 py-2" dir="ltr">
      <p className="text-[11px] font-semibold text-muted-foreground">{t("energyDiagram")}</p>
      <svg
        viewBox="0 0 200 90"
        className="mt-1 h-20 w-full"
        role="img"
        aria-label={t("energyDiagram")}
      >
        <path
          d={curve(e.base)}
          fill="none"
          stroke="var(--muted-foreground)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <path d={curve(e.withCatalyst)} fill="none" stroke="var(--subject)" strokeWidth="2.5" />
        <line x1="8" y1="60" x2="40" y2="60" stroke="var(--foreground)" strokeOpacity="0.4" />
        <text
          x="100"
          y={peak(e.withCatalyst) - 4}
          textAnchor="middle"
          fontSize="8"
          fill="var(--subject)"
        >
          Ea {e.withCatalyst.toFixed(0)}
        </text>
        {catalyst > 0 && (
          <text
            x="100"
            y={peak(e.base) - 4}
            textAnchor="middle"
            fontSize="8"
            fill="var(--muted-foreground)"
          >
            Ea {e.base.toFixed(0)}
          </text>
        )}
        <text x="8" y="80" fontSize="7" fill="var(--muted-foreground)">
          {t("withoutCatalyst")} / {t("withCatalyst")}
        </text>
      </svg>
    </div>
  );
}
