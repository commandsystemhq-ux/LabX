import { computeAdrenaline, HR_CRITICAL } from "@/data/simulations";
import { useLang } from "@/lib/i18n";
import { frac, rand, type SceneProps, useIntegrated } from "./sceneUtils";

type P = [number, number];

const bezier = (a: P, b: P, c: P, d: P, u: number): P => {
  const k = 1 - u;
  const w0 = k * k * k;
  const w1 = 3 * k * k * u;
  const w2 = 3 * k * u * u;
  const w3 = u * u * u;
  return [
    w0 * a[0] + w1 * b[0] + w2 * c[0] + w3 * d[0],
    w0 * a[1] + w1 * b[1] + w2 * c[1] + w3 * d[1],
  ];
};

// Fixed geometry: heart (left), brain (top right), working muscles (bottom right), adrenal gland.
const HEART: P = [190, 205];
const TO_BRAIN: [P, P, P, P] = [
  [205, 170],
  [250, 120],
  [320, 95],
  [375, 92],
];
const TO_BODY: [P, P, P, P] = [
  [190, 245],
  [195, 310],
  [300, 330],
  [420, 322],
];
const ADRENAL: [P, P, P, P] = [
  [330, 250],
  [300, 250],
  [260, 238],
  [228, 222],
];

const path = ([a, b, c, d]: [P, P, P, P]) =>
  `M ${a[0]} ${a[1]} C ${b[0]} ${b[1]}, ${c[0]} ${c[1]}, ${d[0]} ${d[1]}`;

/** Macro view: heart, vessels and brain. The heart beats at the live rate; blood carries O₂ and glucose. */
export function BodyScene({ t, values, labels, flow, layers, hazard }: SceneProps) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const p = computeAdrenaline(values.adrenaline, values.oxygen, values.glucose, values.fault);

  const beat = useIntegrated(t, p.hr / 60);
  const blood = useIntegrated(t, 0.12 + p.output * 0.09);
  const pulse = Math.exp(-7 * frac(beat));
  const chaotic = p.hr >= HR_CRITICAL ? 0.07 * Math.sin(t * 41) : 0;
  const heartScale = 1.55 + 0.28 * pulse * (0.6 + p.arousal * 0.4) + chaotic;

  const narrowed = values.fault === 2;
  const brainTone =
    p.brain < 40 ? "var(--destructive)" : p.brain < 70 ? "var(--warning)" : "var(--bio)";
  const bloodColor = `color-mix(in oklab, var(--destructive) ${Math.round(values.oxygen)}%, var(--chem))`;
  const cells = Math.round(6 + p.output * 2.5);
  const sugar = Math.round(values.glucose / 30) + 1;
  const sparks = Math.round((p.brain / 100) * 14);
  const molecules = Math.round((p.surged / 100) * 9);

  const dots = (route: [P, P, P, P], n: number, seed: number, speed = 1) =>
    Array.from({ length: n }, (_, i) => {
      const u = frac(blood * speed + i / n + rand(i, seed) * 0.05);
      return { i, pos: bezier(route[0], route[1], route[2], route[3], u) };
    });

  return (
    <svg
      viewBox="0 0 600 380"
      className="h-full w-full"
      role="img"
      aria-label="Heart, blood vessels and brain simulation"
    >
      {/* Vessels */}
      <path
        d={path(TO_BRAIN)}
        fill="none"
        stroke="var(--destructive)"
        strokeOpacity="0.28"
        strokeWidth={narrowed ? 5 : 13}
        strokeLinecap="round"
      />
      <path
        d={path(TO_BODY)}
        fill="none"
        stroke="var(--destructive)"
        strokeOpacity="0.28"
        strokeWidth="13"
        strokeLinecap="round"
      />
      {narrowed && (
        <g>
          {[0.35, 0.5, 0.65].map((u) => {
            const [x, y] = bezier(...TO_BRAIN, u);
            return <circle key={u} cx={x} cy={y} r="8" fill="var(--warning)" fillOpacity="0.85" />;
          })}
        </g>
      )}

      {/* Layer: chemical signals — adrenaline leaves the adrenal gland towards the heart */}
      {layers["signals"] && (
        <g>
          <ellipse cx="338" cy="252" rx="20" ry="10" fill="var(--warning)" fillOpacity="0.3" />
          {dots(ADRENAL, molecules, 91, 1.6).map(({ i, pos }) => (
            <text
              key={i}
              x={pos[0]}
              y={pos[1]}
              fontSize="13"
              textAnchor="middle"
              fill="var(--warning)"
            >
              ✦
            </text>
          ))}
        </g>
      )}

      {/* Blood cells towards the brain and the muscles */}
      {flow &&
        dots(TO_BRAIN, cells, 11, narrowed ? 0.6 : 1).map(({ i, pos }) => (
          <circle key={`b${i}`} cx={pos[0]} cy={pos[1]} r={narrowed ? 3 : 4.5} fill={bloodColor} />
        ))}
      {flow &&
        dots(TO_BODY, Math.round(cells * 0.8), 21).map(({ i, pos }) => (
          <circle key={`m${i}`} cx={pos[0]} cy={pos[1]} r="4.5" fill={bloodColor} />
        ))}
      {flow &&
        dots(TO_BRAIN, sugar, 31, 0.9).map(({ i, pos }) => (
          <rect
            key={`g${i}`}
            x={pos[0] - 3}
            y={pos[1] - 9}
            width="6"
            height="6"
            rx="1.5"
            fill="var(--warning)"
          />
        ))}

      {/* Muscles */}
      <ellipse
        cx="445"
        cy="322"
        rx="38"
        ry="20"
        fill="var(--destructive)"
        fillOpacity={0.1 + p.arousal * 0.12 + values.adrenaline / 400}
        stroke="var(--destructive)"
        strokeOpacity="0.4"
      />

      {/* Brain */}
      <g>
        <ellipse
          cx="430"
          cy="84"
          rx="72"
          ry="50"
          fill={brainTone}
          fillOpacity={0.1 + (p.brain / 100) * 0.4}
          stroke={brainTone}
          strokeWidth={hazard > 0 ? 3.5 : 2}
        />
        <path
          d="M 385 84 q 14 -22 28 0 t 28 0 t 28 0 M 395 108 q 12 -14 24 0 t 24 0 t 24 0"
          fill="none"
          stroke={brainTone}
          strokeOpacity="0.55"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {layers["brain"] &&
          Array.from({ length: sparks }, (_, i) => {
            const a = rand(i, 71) * Math.PI * 2;
            const r = 8 + rand(i, 72) * 34;
            const on = 0.35 + 0.65 * Math.abs(Math.sin(t * (2 + rand(i, 73) * 3) + i));
            return (
              <circle
                key={i}
                cx={430 + Math.cos(a) * r * 1.5}
                cy={84 + Math.sin(a) * r * 0.9}
                r="2.6"
                fill="var(--foreground)"
                fillOpacity={on}
              />
            );
          })}
        {p.brain < 40 && (
          <text x="430" y="92" fontSize="26" textAnchor="middle" fill="var(--destructive)">
            ⚠
          </text>
        )}
      </g>

      {/* Heart */}
      <g transform={`translate(${HEART[0]} ${HEART[1]}) scale(${heartScale})`}>
        <path
          d="M 0 20 C -42 -8 -30 -42 0 -22 C 30 -42 42 -8 0 20 Z"
          fill="var(--destructive)"
          fillOpacity={0.55 + 0.35 * pulse}
          stroke={p.hr >= 150 ? "var(--warning)" : "var(--destructive)"}
          strokeWidth={p.hr >= 150 ? 2.2 : 1.4}
        />
      </g>

      {labels && (
        <g fontSize="12" fontWeight="600" fill="var(--muted-foreground)">
          <text x={HEART[0]} y="262" textAnchor="middle">
            {ar ? "القلب" : "Heart"}
          </text>
          <text x="430" y="152" textAnchor="middle" fill={brainTone}>
            {ar ? "المخ" : "Brain"} · {p.brain.toFixed(0)}%
          </text>
          <text x="445" y="356" textAnchor="middle">
            {ar ? "العضلات" : "Muscles"}
          </text>
          <text x="300" y="116" textAnchor="middle" fill="var(--warning)">
            {ar ? "جلوكوز" : "Glucose"} {values.glucose.toFixed(0)}
          </text>
          <text x="232" y="332" textAnchor="middle" fill={bloodColor}>
            O₂ {values.oxygen.toFixed(0)}%
          </text>
          <text
            x="32"
            y="42"
            fontFamily="var(--font-mono)"
            fontSize="22"
            fontWeight="700"
            fill={p.hr >= 150 || p.hr < 50 ? "var(--destructive)" : "var(--foreground)"}
          >
            ♥ {p.hr.toFixed(0)}
            <tspan fontSize="12" dx="4">
              bpm
            </tspan>
          </text>
          <text x="32" y="62" fontFamily="var(--font-mono)" fill="var(--muted-foreground)">
            {p.output.toFixed(1)} L/min
          </text>
        </g>
      )}
    </svg>
  );
}
