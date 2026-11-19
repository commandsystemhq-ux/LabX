import { computeOhm } from "@/data/simulations";
import { useLang } from "@/lib/i18n";
import { type SceneProps, useIntegrated } from "./sceneUtils";

const X0 = 90;
const Y0 = 70;
const W = 420;
const H = 240;
const PERIM = 2 * (W + H);

function pointOnLoop(u: number) {
  let d = (((u % 1) + 1) % 1) * PERIM;
  if (d < W) return { x: X0 + d, y: Y0 };
  d -= W;
  if (d < H) return { x: X0 + W, y: Y0 + d };
  d -= H;
  if (d < W) return { x: X0 + W - d, y: Y0 + H };
  d -= W;
  return { x: X0, y: Y0 + H - d };
}

/** Macro view: a simple DC circuit — battery, resistor, bulb, ammeter, drifting electrons. */
export function CircuitScene({ t, values, labels, flow }: SceneProps) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { current, power, rEff } = computeOhm(
    values.voltage,
    values.resistance,
    values.temperature,
  );
  const phase = useIntegrated(t, Math.min(current * 0.09, 1.4));
  const heat = Math.min(1, Math.max(0, (values.temperature - 25) / 125));
  const glow = Math.min(1, power / 60);
  const N = 24;

  return (
    <svg
      viewBox="0 0 600 380"
      className="h-full w-full"
      role="img"
      aria-label="Electric circuit simulation"
    >
      <defs>
        <radialGradient id="bulb-glow">
          <stop offset="0%" stopColor="var(--warning)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--warning)" stopOpacity="0" />
        </radialGradient>
        <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Wire */}
      <rect
        x={X0}
        y={Y0}
        width={W}
        height={H}
        rx="4"
        fill="none"
        stroke="var(--muted-foreground)"
        strokeOpacity="0.35"
        strokeWidth="6"
      />
      <rect
        x={X0}
        y={Y0}
        width={W}
        height={H}
        rx="4"
        fill="none"
        stroke="var(--phys)"
        strokeOpacity={0.15 + Math.min(current / 4, 1) * 0.6}
        strokeWidth="2"
        filter="url(#soft-glow)"
      />

      {/* Electrons */}
      {Array.from({ length: N }, (_, i) => {
        const p = pointOnLoop(i / N - phase);
        return (
          <circle key={i} cx={p.x} cy={p.y} r="4.5" fill="var(--phys)" filter="url(#soft-glow)" />
        );
      })}

      {/* Battery (left) */}
      <rect x={X0 - 24} y="160" width="48" height="60" fill="oklch(0.12 0.02 264)" />
      <line
        x1={X0 - 22}
        y1="178"
        x2={X0 + 22}
        y2="178"
        stroke="var(--foreground)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1={X0 - 12}
        y1="200"
        x2={X0 + 12}
        y2="200"
        stroke="var(--foreground)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <text x={X0 + 32} y="182" fill="var(--warning)" fontSize="16" fontWeight="700">
        +
      </text>
      <text x={X0 + 32} y="208" fill="var(--muted-foreground)" fontSize="18" fontWeight="700">
        −
      </text>

      {/* Resistor (top) */}
      <rect x="240" y={Y0 - 16} width="120" height="32" fill="oklch(0.12 0.02 264)" />
      <polyline
        points={`240,${Y0} 252,${Y0} 260,${Y0 - 13} 276,${Y0 + 13} 292,${Y0 - 13} 308,${Y0 + 13} 324,${Y0 - 13} 340,${Y0 + 13} 348,${Y0} 360,${Y0}`}
        fill="none"
        stroke={`color-mix(in oklab, var(--heat) ${Math.round(heat * 100)}%, var(--foreground))`}
        strokeWidth="4"
        strokeLinejoin="round"
        filter={heat > 0.2 ? "url(#soft-glow)" : undefined}
      />
      {heat > 0.15 &&
        [0, 1, 2].map((k) => (
          <path
            key={k}
            d={`M ${280 + k * 20} ${Y0 - 22} q 5 -8 0 -16 q -5 -8 0 -16`}
            fill="none"
            stroke="var(--heat)"
            strokeOpacity={heat * (0.4 + 0.4 * Math.sin(t * 3 + k))}
            strokeWidth="2"
            strokeLinecap="round"
          />
        ))}

      {/* Bulb (right) */}
      <circle cx={X0 + W} cy="190" r={30 + glow * 40} fill="url(#bulb-glow)" opacity={glow} />
      <circle
        cx={X0 + W}
        cy="190"
        r="22"
        fill="oklch(0.12 0.02 264)"
        stroke="var(--foreground)"
        strokeOpacity="0.8"
        strokeWidth="2.5"
      />
      <path
        d={`M ${X0 + W - 9} 198 q 4.5 -18 9 0 q 4.5 -18 9 0`}
        fill="none"
        stroke={glow > 0.05 ? "var(--warning)" : "var(--muted-foreground)"}
        strokeWidth="2.5"
      />

      {/* Ammeter (bottom) */}
      <circle
        cx="300"
        cy={Y0 + H}
        r="26"
        fill="oklch(0.12 0.02 264)"
        stroke="var(--phys)"
        strokeWidth="2.5"
      />
      <text
        x="300"
        y={Y0 + H + 6}
        textAnchor="middle"
        fill="var(--phys)"
        fontSize="18"
        fontWeight="700"
        fontFamily="var(--font-mono)"
      >
        A
      </text>
      <g transform={`rotate(${-60 + Math.min(current / 6, 1) * 120} 300 ${Y0 + H})`}>
        <line
          x1="300"
          y1={Y0 + H}
          x2="300"
          y2={Y0 + H - 18}
          stroke="var(--heat)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* Conventional current arrows */}
      {flow &&
        [0.12, 0.38, 0.62, 0.88].map((u, i) => {
          // conventional current: opposite to electron drift
          const p = pointOnLoop(1 - u);
          const q = pointOnLoop(1 - u - 0.01);
          const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
          return (
            <g
              key={i}
              transform={`translate(${p.x} ${p.y}) rotate(${ang})`}
              opacity={current > 0.01 ? 0.9 : 0.2}
            >
              <path
                d="M -8 -12 L 8 0 L -8 12"
                fill="none"
                stroke="var(--warning)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                transform="translate(0 -22)"
              />
            </g>
          );
        })}

      {/* Labels */}
      {labels && (
        <g fontFamily="var(--font-mono)" fontSize="13" fontWeight="700">
          <text x="300" y={Y0 - 30} textAnchor="middle" fill="var(--foreground)">
            R = {rEff.toFixed(1)} Ω
          </text>
          <text x={X0 - 40} y="245" textAnchor="middle" fill="var(--warning)">
            {values.voltage.toFixed(1)} V
          </text>
          <text x="300" y={Y0 + H + 48} textAnchor="middle" fill="var(--phys)">
            I = {current.toFixed(2)} A
          </text>
          <text x={X0 + W} y="248" textAnchor="middle" fill="var(--warning)">
            P = {power.toFixed(1)} W
          </text>
          <g
            fontFamily="var(--font-sans)"
            fontSize="11"
            fontWeight="600"
            fill="var(--muted-foreground)"
          >
            <text x={X0 - 40} y="150" textAnchor="middle">
              {ar ? "البطارية" : "Battery"}
            </text>
            <text x="300" y={Y0 + 34} textAnchor="middle">
              {ar ? "المقاومة" : "Resistor"}
            </text>
            <text x={X0 + W} y="155" textAnchor="middle">
              {ar ? "المصباح" : "Bulb"}
            </text>
            <text x="370" y={Y0 + H + 5}>
              {ar ? "الأميتر" : "Ammeter"}
            </text>
          </g>
        </g>
      )}
    </svg>
  );
}
