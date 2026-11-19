import { computeDiffusion } from "@/data/simulations";
import { useLang } from "@/lib/i18n";
import { frac, rand, type SceneProps, tri, useIntegrated } from "./sceneUtils";

/** Molecular view: phospholipid bilayer with channels; particles cross from high → low. */
export function MembraneScene({ t, values, activity, labels, flow }: SceneProps) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { crossing } = computeDiffusion(values.temperature, values.gradient, values.permeability);
  const thermal = useIntegrated(t, 0.12 + (values.temperature / 60) * 0.25);
  const cross = useIntegrated(t, 0.08 + activity * 0.4);
  const channels = values.permeability <= 0 ? 0 : 1 + Math.round((values.permeability / 100) * 4);
  const channelY = Array.from({ length: channels }, (_, i) => 60 + ((i + 0.5) * 260) / channels);
  const leftCount = 10 + Math.round(values.gradient * 0.3);
  const rightCount = 10;
  const crossers = values.gradient > 0 && channels > 0 ? Math.round(2 + activity * 10) : 0;
  const mx = 300;

  const heads: number[] = [];
  for (let y = 50; y <= 330; y += 14) {
    if (!channelY.some((c) => Math.abs(c - y) < 16)) heads.push(y);
  }

  const bounce = (i: number, side: "l" | "r") => {
    const x0 = side === "l" ? 40 : mx + 30;
    const w = side === "l" ? mx - 70 : 230;
    return {
      x: x0 + tri(rand(i, side === "l" ? 41 : 51) * 2 + thermal * (0.5 + rand(i, 42))) * w,
      y: 45 + tri(rand(i, side === "l" ? 43 : 53) * 2 + thermal * (0.5 + rand(i, 44))) * 290,
    };
  };

  return (
    <svg
      viewBox="0 0 600 380"
      className="h-full w-full"
      role="img"
      aria-label="Membrane diffusion simulation"
    >
      <rect x="20" y="30" width="560" height="320" rx="20" fill="none" stroke="var(--border)" />
      <rect
        x="20"
        y="30"
        width={mx - 40}
        height="320"
        rx="20"
        fill="var(--bio)"
        fillOpacity={0.03 + values.gradient / 1500}
      />

      {/* Bilayer */}
      {heads.map((y) => (
        <g key={y}>
          <circle cx={mx - 14} cy={y} r="6" fill="var(--bio)" fillOpacity="0.8" />
          <circle cx={mx + 14} cy={y} r="6" fill="var(--bio)" fillOpacity="0.8" />
          <line
            x1={mx - 8}
            y1={y - 2}
            x2={mx - 1}
            y2={y - 2}
            stroke="var(--bio)"
            strokeOpacity="0.5"
          />
          <line
            x1={mx + 1}
            y1={y + 2}
            x2={mx + 8}
            y2={y + 2}
            stroke="var(--bio)"
            strokeOpacity="0.5"
          />
        </g>
      ))}
      {channelY.map((y) => (
        <g key={y}>
          <rect
            x={mx - 22}
            y={y - 16}
            width="44"
            height="4"
            rx="2"
            fill="var(--warning)"
            opacity="0.8"
          />
          <rect
            x={mx - 22}
            y={y + 12}
            width="44"
            height="4"
            rx="2"
            fill="var(--warning)"
            opacity="0.8"
          />
        </g>
      ))}

      {Array.from({ length: leftCount }, (_, i) => {
        const p = bounce(i, "l");
        return (
          <circle
            key={`l${i}`}
            cx={p.x}
            cy={p.y}
            r="5"
            fill="var(--foreground)"
            fillOpacity="0.8"
          />
        );
      })}
      {Array.from({ length: rightCount }, (_, i) => {
        const p = bounce(i, "r");
        return (
          <circle
            key={`r${i}`}
            cx={p.x}
            cy={p.y}
            r="5"
            fill="var(--foreground)"
            fillOpacity="0.8"
          />
        );
      })}

      {Array.from({ length: crossers }, (_, i) => {
        const p = frac(cross * (0.7 + rand(i, 61) * 0.6) + rand(i, 62));
        const ch = channelY[i % channels] ?? 190;
        const sy = 60 + rand(i, 63) * 260;
        const ey = 60 + rand(i, 64) * 260;
        const x = 60 + p * 480;
        let y: number;
        if (x < mx - 30) y = sy + (ch - sy) * ((x - 60) / (mx - 90));
        else if (x > mx + 30) y = ch + (ey - ch) * ((x - mx - 30) / (540 - mx - 30));
        else y = ch;
        return (
          <circle
            key={`c${i}`}
            cx={x}
            cy={y}
            r="5.5"
            fill="var(--bio)"
            stroke="var(--foreground)"
            strokeOpacity="0.6"
          />
        );
      })}

      {flow && values.gradient > 0 && channels > 0 && (
        <g>
          <line x1="230" y1="360" x2="370" y2="360" stroke="var(--warning)" strokeWidth="3" />
          <path
            d="M 362 352 L 374 360 L 362 368"
            fill="none"
            stroke="var(--warning)"
            strokeWidth="3"
          />
        </g>
      )}

      {labels && (
        <g fontSize="12" fontWeight="600" fill="var(--muted-foreground)">
          <text x="160" y="22" textAnchor="middle">
            {ar ? "تركيز عالي" : "High concentration"}
          </text>
          <text x="445" y="22" textAnchor="middle">
            {ar ? "تركيز منخفض" : "Low concentration"}
          </text>
          <text x={mx} y="22" textAnchor="middle" fill="var(--warning)">
            {channels} {ar ? "قنوات" : "channels"}
          </text>
          <text
            x="560"
            y="375"
            textAnchor="end"
            fontFamily="var(--font-mono)"
            fill="var(--bio)"
            fontWeight="700"
          >
            {crossing.toFixed(1)} /s
          </text>
        </g>
      )}
    </svg>
  );
}
