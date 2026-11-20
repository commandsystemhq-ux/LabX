import { memo, useId } from "react";
import {
  activationEnergy,
  equilibriumProgress,
  fieldInfo,
  leChatelier,
  microscopeInfo,
  sci,
} from "@/data/simExtras";
import type { SimValues } from "@/data/simulations";
import { useLang } from "@/lib/i18n";
import type { StageView } from "./scenes";

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Physics: electric field along the conductor, the force on an electron and its drift. */
export const FieldPanel = memo(function FieldPanel({ values }: { values: SimValues }) {
  const { t } = useLang();
  const info = fieldInfo(values);
  // 48 V/m is the maximum field (24 V across 0.5 m); arrows scale against it.
  const eLen = info.field > 0 ? clamp((info.field / 48) * 70, 10, 70) : 0;
  const fLen = info.field > 0 ? clamp((info.field / 48) * 36, 6, 36) : 0;

  return (
    <div className="glass-strong rounded-2xl px-3 py-2" dir="ltr">
      <p className="text-[11px] font-semibold text-muted-foreground">{t("fieldTitle")}</p>
      <svg
        viewBox="0 0 200 84"
        className="mt-1 h-20 w-full"
        role="img"
        aria-label={t("fieldTitle")}
      >
        <defs>
          <marker id="fp-arrow-e" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6 z" fill="var(--subject)" />
          </marker>
          <marker id="fp-arrow-f" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6 z" fill="var(--warning)" />
          </marker>
        </defs>
        <rect
          x="22"
          y="34"
          width="156"
          height="22"
          rx="5"
          fill="var(--subject)"
          fillOpacity="0.12"
          stroke="var(--subject)"
          strokeOpacity="0.5"
        />
        <text x="8" y="50" fontSize="12" fill="var(--foreground)">
          +
        </text>
        <text x="184" y="50" fontSize="12" fill="var(--foreground)">
          −
        </text>
        {eLen > 0 && (
          <line
            x1="30"
            y1="22"
            x2={30 + eLen}
            y2="22"
            stroke="var(--subject)"
            strokeWidth="2"
            markerEnd="url(#fp-arrow-e)"
          />
        )}
        <text x="30" y="14" fontSize="7" fill="var(--subject)">
          {t("fieldDirection")}
        </text>
        <circle cx="110" cy="45" r="5" fill="var(--warning)" />
        <text x="110" y="48" fontSize="7" textAnchor="middle" fill="var(--primary-foreground)">
          e⁻
        </text>
        {fLen > 0 && (
          <line
            x1="104"
            y1="45"
            x2={104 - fLen}
            y2="45"
            stroke="var(--warning)"
            strokeWidth="2"
            markerEnd="url(#fp-arrow-f)"
          />
        )}
        <text x="22" y="72" fontSize="7" fill="var(--muted-foreground)">
          F = eE · {t("fieldElectron")}
        </text>
      </svg>
      <dl className="grid grid-cols-[1fr_auto] gap-x-3 font-mono text-[10px]">
        <dt className="text-muted-foreground">{t("fieldStrength")}</dt>
        <dd className="text-end font-bold text-subject">E = {info.field.toFixed(1)} V/m</dd>
        <dt className="text-muted-foreground">{t("fieldForce")}</dt>
        <dd className="text-end font-bold">F = {sci(info.force)} N</dd>
        <dt className="text-muted-foreground">{t("fieldDrift")}</dt>
        <dd className="text-end font-bold">
          v<sub>d</sub> ={" "}
          {info.driftMmPerS < 0.001 ? sci(info.driftMmPerS) : info.driftMmPerS.toFixed(3)} mm/s
        </dd>
      </dl>
      <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{t("fieldNote")}</p>
    </div>
  );
});

/** Biology: light vs electron microscope view of the cell membrane. */
export const MicroscopeView = memo(function MicroscopeView({
  values,
  view,
}: {
  values: SimValues;
  view: StageView;
}) {
  const { t, lang } = useLang();
  const clipId = useId();
  const m = microscopeInfo(values, view);
  const fov = m.fovUm >= 10 ? `${Math.round(m.fovUm)} µm` : `${m.fovUm.toFixed(1)} µm`;

  return (
    <div className="glass-strong rounded-2xl px-3 py-2" dir="ltr">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-semibold text-muted-foreground">{t("scopeTitle")}</span>
        <span className="font-mono font-bold text-subject">
          {m.magnification.toLocaleString("en-US")}×
        </span>
      </div>
      <svg
        viewBox="0 0 200 96"
        className="mt-1 h-24 w-full"
        role="img"
        aria-label={t("scopeTitle")}
      >
        <defs>
          <clipPath id={clipId}>
            <circle cx="48" cy="48" r="42" />
          </clipPath>
        </defs>
        <circle
          cx="48"
          cy="48"
          r="43"
          fill="var(--background)"
          stroke="var(--foreground)"
          strokeOpacity="0.5"
        />
        <g clipPath={`url(#${clipId})`}>
          {m.kind === "light" ? (
            <>
              {(
                [
                  [30, 34, 17],
                  [66, 38, 15],
                  [48, 68, 18],
                ] as const
              ).map(([cx, cy, r], i) => (
                <g key={i}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="var(--subject)"
                    fillOpacity="0.14"
                    stroke="var(--subject)"
                    strokeOpacity="0.7"
                  />
                  <circle cx={cx} cy={cy} r={r / 3} fill="var(--subject)" fillOpacity="0.5" />
                </g>
              ))}
            </>
          ) : (
            <>
              <rect x="0" y="0" width="96" height="42" fill="var(--muted)" fillOpacity="0.4" />
              <line x1="0" y1="42" x2="96" y2="42" stroke="var(--subject)" strokeWidth="3" />
              <line x1="0" y1="52" x2="96" y2="52" stroke="var(--subject)" strokeWidth="3" />
              {Array.from({ length: m.channels }, (_, i) => (
                <rect
                  key={i}
                  x={8 + i * (80 / Math.max(m.channels, 1))}
                  y="40"
                  width="7"
                  height="14"
                  rx="2"
                  fill="var(--warning)"
                />
              ))}
              {Array.from({ length: m.solute }, (_, i) => (
                <circle
                  key={i}
                  cx={10 + ((i * 37) % 76)}
                  cy={8 + ((i * 17) % 26)}
                  r="2.2"
                  fill="var(--foreground)"
                  fillOpacity="0.7"
                />
              ))}
              <text x="4" y="14" fontSize="6" fill="var(--muted-foreground)">
                {t("scopeOutside")}
              </text>
              <text x="4" y="86" fontSize="6" fill="var(--muted-foreground)">
                {t("scopeInside")}
              </text>
            </>
          )}
        </g>
        <text x="100" y="22" fontSize="8" fontWeight="700" fill="var(--foreground)">
          {m.kind === "light" ? t("scopeLight") : t("scopeElectron")}
        </text>
        <text x="100" y="36" fontSize="7" fill="var(--muted-foreground)">
          {t("scopeFov")}: {fov}
        </text>
        <line x1="100" y1="46" x2="160" y2="46" stroke="var(--foreground)" strokeWidth="1.5" />
        <text x="100" y="56" fontSize="6" fill="var(--muted-foreground)">
          {m.kind === "light" ? "≈ 100 µm" : "≈ 1 µm"}
        </text>
        {m.kind === "electron" && (
          <g>
            <rect x="100" y="64" width="6" height="8" rx="1.5" fill="var(--warning)" />
            <text x="110" y="70" fontSize="6" fill="var(--muted-foreground)">
              {t("scopeChannel")}
            </text>
          </g>
        )}
      </svg>
      <p
        className="text-[10px] leading-snug text-muted-foreground"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        {m.membraneVisible ? t("scopeVisible") : t("scopeHidden")}
      </p>
    </div>
  );
});

/** Chemistry: K vs Q and the direction the equilibrium shifts (Le Chatelier). */
export const EquilibriumShiftPanel = memo(function EquilibriumShiftPanel({
  values,
}: {
  values: SimValues;
}) {
  const { t, l, lang } = useLang();
  const { K, Q, shift, reasons } = leChatelier(values);
  const bar = (x: number) => clamp(50 + 50 * Math.log10(Math.max(x, 1e-3)), 4, 98);
  const arrow = shift === "forward" ? "A → B" : shift === "reverse" ? "A ← B" : "A ⇌ B";
  const label =
    shift === "forward"
      ? t("leShiftForward")
      : shift === "reverse"
        ? t("leShiftReverse")
        : t("leShiftNone");

  return (
    <div className="glass-strong rounded-2xl px-3 py-2">
      <p className="text-[11px] font-semibold text-muted-foreground">{t("leTitle")}</p>
      <ul className="mt-1.5 flex flex-col gap-1" dir="ltr">
        {(
          [
            ["K", K, "bg-muted-foreground/60"],
            ["Q", Q, "bg-subject"],
          ] as const
        ).map(([name, value, tone]) => (
          <li
            key={name}
            className="grid grid-cols-[14px_1fr_38px] items-center gap-1.5 text-[10px]"
          >
            <span className="font-mono font-bold">{name}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-muted">
              <span
                className={"block h-full rounded-full transition-[width] duration-500 " + tone}
                style={{ width: `${bar(value)}%` }}
              />
            </span>
            <span className="text-end font-mono tabular-nums">{value.toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 flex items-center justify-between gap-2 text-[11px] font-bold">
        <span className="font-mono text-subject" dir="ltr">
          {arrow}
        </span>
        <span>{label}</span>
      </p>
      {reasons.slice(0, 2).map((r, i) => (
        <p
          key={i}
          className="mt-1 text-[10px] leading-snug text-muted-foreground"
          dir={lang === "ar" ? "rtl" : "ltr"}
        >
          {l(r)}
        </p>
      ))}
    </div>
  );
});

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
