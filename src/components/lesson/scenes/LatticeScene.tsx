import { computeOhm } from "@/data/simulations";
import { useLang } from "@/lib/i18n";
import { frac, rand, type SceneProps, useIntegrated } from "./sceneUtils";

/** Molecular view inside the wire: vibrating ion lattice + drifting free electrons. */
export function LatticeScene({ t, values, labels, flow }: SceneProps) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { current } = computeOhm(
    values.voltage,
    values.resistance,
    values.temperature,
    values.fault,
  );
  const drift = useIntegrated(t, Math.min(current * 0.06, 0.8));
  const amp = 1.5 + (values.temperature / 150) * 9;
  const cols = 9;
  const rows = 4;
  const left = 50;
  const top = 80;
  const width = 500;
  const height = 220;

  return (
    <svg
      viewBox="0 0 600 380"
      className="h-full w-full"
      role="img"
      aria-label="Metal lattice simulation"
    >
      <rect
        x={left - 20}
        y={top - 30}
        width={width + 40}
        height={height + 60}
        rx="40"
        fill="var(--phys)"
        fillOpacity="0.04"
        stroke="var(--phys)"
        strokeOpacity="0.35"
        strokeDasharray="4 6"
      />

      {/* Ions */}
      {Array.from({ length: cols * rows }, (_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const bx = left + 25 + c * ((width - 50) / (cols - 1));
        const by = top + 20 + r * ((height - 40) / (rows - 1));
        const x = bx + Math.sin(t * 13 + i * 1.7) * amp;
        const y = by + Math.cos(t * 11 + i * 2.3) * amp;
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r="13"
              fill={`color-mix(in oklab, var(--heat) ${Math.round((values.temperature / 150) * 70)}%, var(--muted))`}
              stroke="var(--foreground)"
              strokeOpacity="0.25"
            />
            <text
              x={x}
              y={y + 4}
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fill="var(--foreground)"
              fillOpacity="0.7"
            >
              +
            </text>
          </g>
        );
      })}

      {/* Electrons */}
      {Array.from({ length: 30 }, (_, i) => {
        const x = left + frac(rand(i, 3) + drift * (0.8 + rand(i, 5) * 0.4)) * width;
        const y = top + rand(i, 7) * height + Math.sin(t * 4 + i) * 8;
        return <circle key={i} cx={x} cy={y} r="4.5" fill="var(--phys)" />;
      })}

      {flow && (
        <g opacity={current > 0.01 ? 1 : 0.3}>
          <line x1="200" y1="345" x2="400" y2="345" stroke="var(--phys)" strokeWidth="3" />
          <path
            d="M 392 335 L 408 345 L 392 355"
            fill="none"
            stroke="var(--phys)"
            strokeWidth="3"
          />
          <text
            x="300"
            y="335"
            textAnchor="middle"
            fontSize="12"
            fill="var(--phys)"
            fontWeight="700"
          >
            {ar ? "انجراف الإلكترونات" : "electron drift"}
          </text>
        </g>
      )}

      {labels && (
        <g fontSize="12" fontWeight="600">
          <circle
            cx="60"
            cy="28"
            r="7"
            fill="var(--muted)"
            stroke="var(--foreground)"
            strokeOpacity="0.3"
          />
          <text x="74" y="32" fill="var(--muted-foreground)">
            {ar ? "أيونات موجبة (بتهتز مع الحرارة)" : "Positive ions (vibrate with heat)"}
          </text>
          <circle cx="60" cy="50" r="4.5" fill="var(--phys)" />
          <text x="74" y="54" fill="var(--muted-foreground)">
            {ar ? "إلكترونات حرة" : "Free electrons"}
          </text>
          <text
            x="540"
            y="40"
            textAnchor="end"
            fontFamily="var(--font-mono)"
            fill="var(--heat)"
            fontWeight="700"
          >
            T = {values.temperature.toFixed(0)}°C
          </text>
        </g>
      )}
    </svg>
  );
}
