import { computeRate } from "@/data/simulations";
import { useLang } from "@/lib/i18n";
import { frac, rand, type SceneProps, useIntegrated } from "./sceneUtils";

/** Macro view: reacting liquid in a beaker on a hot plate; bubbles ∝ reaction rate. */
export function BeakerScene({ t, values, activity, labels, flow }: SceneProps) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { rate } = computeRate(values.temperature, values.concentration, values.catalyst);
  const phase = useIntegrated(t, 0.25 + activity * 0.9);
  const heat = values.temperature / 100;
  const visible = Math.round(4 + activity * 34);
  const grains = Math.round(values.catalyst * 2);
  const liquidTop = 150;
  const liquidBottom = 300;

  return (
    <svg
      viewBox="0 0 600 380"
      className="h-full w-full"
      role="img"
      aria-label="Beaker reaction simulation"
    >
      <defs>
        <clipPath id="beaker-clip">
          <path d="M 205 70 L 205 290 Q 205 310 225 310 L 375 310 Q 395 310 395 290 L 395 70 Z" />
        </clipPath>
        <linearGradient id="liquid" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor="var(--chem)"
            stopOpacity={0.25 + values.concentration * 0.12}
          />
          <stop
            offset="100%"
            stopColor="var(--chem)"
            stopOpacity={0.5 + values.concentration * 0.15}
          />
        </linearGradient>
      </defs>

      {/* Hot plate */}
      <rect x="170" y="318" width="260" height="22" rx="6" fill="var(--muted)" />
      <rect
        x="185"
        y="318"
        width="230"
        height="5"
        rx="2"
        fill="var(--heat)"
        opacity={0.15 + heat * 0.85}
      />
      <ellipse cx="300" cy="318" rx="120" ry="10" fill="var(--heat)" opacity={heat * 0.35} />

      <g clipPath="url(#beaker-clip)">
        <rect
          x="200"
          y={liquidTop + Math.sin(t * 2) * 1.5}
          width="200"
          height="200"
          fill="url(#liquid)"
        />
        {Array.from({ length: 40 }, (_, i) => {
          if (i >= visible) return null;
          const p = frac(phase * (0.7 + rand(i, 2) * 0.8) + rand(i, 9));
          const y = liquidBottom - p * (liquidBottom - liquidTop + 10);
          const x = 220 + rand(i, 4) * 160 + Math.sin(t * 3 + i) * 3;
          const r = 2 + rand(i, 6) * 4 + p * 2;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={r}
              fill="none"
              stroke="var(--foreground)"
              strokeOpacity={0.6 - p * 0.3}
              strokeWidth="1.5"
            />
          );
        })}
        {Array.from({ length: grains }, (_, i) => (
          <rect
            key={i}
            x={225 + rand(i, 11) * 150}
            y={298 - rand(i, 12) * 6}
            width="7"
            height="5"
            rx="1"
            fill="var(--warning)"
            opacity="0.85"
            transform={`rotate(${rand(i, 13) * 90} ${228 + rand(i, 11) * 150} 300)`}
          />
        ))}
      </g>

      {/* Beaker glass */}
      <path
        d="M 195 62 L 205 70 L 205 290 Q 205 310 225 310 L 375 310 Q 395 310 395 290 L 395 70 L 405 62"
        fill="none"
        stroke="var(--foreground)"
        strokeOpacity="0.7"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {[120, 170, 220, 270].map((y) => (
        <line
          key={y}
          x1="380"
          y1={y}
          x2="392"
          y2={y}
          stroke="var(--foreground)"
          strokeOpacity="0.4"
          strokeWidth="1.5"
        />
      ))}

      {/* Thermometer */}
      {flow && (
        <g>
          <rect
            x="455"
            y="90"
            width="14"
            height="190"
            rx="7"
            fill="var(--muted)"
            stroke="var(--foreground)"
            strokeOpacity="0.3"
          />
          <rect
            x="459"
            y={94 + (1 - heat) * 170}
            width="6"
            height={heat * 170 + 10}
            rx="3"
            fill="var(--heat)"
          />
          <circle cx="462" cy="290" r="13" fill="var(--heat)" />
          <text
            x="462"
            y="78"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="13"
            fontWeight="700"
            fill="var(--heat)"
          >
            {values.temperature.toFixed(0)}°C
          </text>
        </g>
      )}

      {labels && (
        <g fontSize="12" fontWeight="600" fill="var(--muted-foreground)">
          <text
            x="300"
            y="45"
            textAnchor="middle"
            fill="var(--foreground)"
            fontFamily="var(--font-mono)"
            fontSize="14"
            fontWeight="700"
          >
            Mg + 2HCl → MgCl₂ + H₂↑
          </text>
          <text x="120" y="160" textAnchor="middle">
            {ar ? "فقاعات H₂" : "H₂ bubbles"}
          </text>
          <line
            x1="150"
            y1="165"
            x2="215"
            y2="200"
            stroke="var(--muted-foreground)"
            strokeDasharray="3 3"
          />
          <text
            x="120"
            y="250"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fill="var(--chem)"
            fontWeight="700"
          >
            {values.concentration.toFixed(1)} M
          </text>
          <text
            x="120"
            y="270"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fill="var(--chem)"
          >
            r = {rate.toFixed(1)}
          </text>
          {grains > 0 && (
            <text x="300" y="365" textAnchor="middle" fill="var(--warning)">
              {ar ? "عامل حفاز" : "Catalyst"} {values.catalyst.toFixed(1)}g
            </text>
          )}
        </g>
      )}
    </svg>
  );
}
