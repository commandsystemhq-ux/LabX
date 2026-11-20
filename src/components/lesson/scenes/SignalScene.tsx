import { computeAdrenaline } from "@/data/simulations";
import { useLang } from "@/lib/i18n";
import { frac, rand, type SceneProps, useIntegrated } from "./sceneUtils";

/**
 * Molecular view: oxygen on red blood cells, adrenaline binding to β-receptors of a heart cell
 * (a beta blocker covers them), and glucose feeding a neuron's mitochondria.
 */
export function SignalScene({ t, values, labels, flow, layers, hazard }: SceneProps) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const p = computeAdrenaline(values.adrenaline, values.oxygen, values.glucose, values.fault);

  const blood = useIntegrated(t, 0.08 + p.output * 0.05);
  const drift = useIntegrated(t, 0.35);
  const beat = useIntegrated(t, p.hr / 60);
  const pulse = Math.exp(-6 * frac(beat));

  const blocked = values.fault === 3;
  const receptors = 4;
  const bound = blocked ? 0 : Math.min(receptors, Math.ceil((p.surged / 100) * receptors));
  const molecules = Math.round((p.surged / 100) * 10);
  const o2Slots = Math.round((values.oxygen / 100) * 6);
  const sugar = Math.round(values.glucose / 25);
  const atp = p.brain;
  const atpTone = atp < 40 ? "var(--destructive)" : atp < 70 ? "var(--warning)" : "var(--bio)";

  return (
    <svg
      viewBox="0 0 600 380"
      className="h-full w-full"
      role="img"
      aria-label="Adrenaline receptor, oxygen and glucose at the cell level"
    >
      {/* A — blood: red cells carrying O₂ and glucose */}
      <rect
        x="12"
        y="120"
        width="170"
        height="130"
        rx="14"
        fill="var(--destructive)"
        fillOpacity="0.06"
        stroke="var(--destructive)"
        strokeOpacity="0.3"
      />
      {flow &&
        [0, 1, 2].map((k) => {
          const x = 30 + frac(blood * 0.8 + k / 3) * 140;
          const y = 150 + k * 34 + Math.sin(t * 2 + k) * 4;
          return (
            <g key={k}>
              <ellipse
                cx={x}
                cy={y}
                rx="19"
                ry="13"
                fill="var(--destructive)"
                fillOpacity="0.55"
                stroke="var(--destructive)"
              />
              {Array.from({ length: 6 }, (_, s) => (
                <circle
                  key={s}
                  cx={x - 10 + (s % 3) * 10}
                  cy={y - 4 + Math.floor(s / 3) * 8}
                  r="2.8"
                  fill={s < o2Slots ? "var(--foreground)" : "none"}
                  stroke="var(--foreground)"
                  strokeOpacity="0.35"
                />
              ))}
            </g>
          );
        })}
      {Array.from({ length: sugar }, (_, i) => (
        <rect
          key={i}
          x={25 + frac(blood * 0.5 + i / Math.max(1, sugar) + rand(i, 5) * 0.1) * 145}
          y={132 + rand(i, 6) * 105}
          width="6"
          height="6"
          rx="1.5"
          fill="var(--warning)"
        />
      ))}

      {/* B — heart muscle cell with β-adrenergic receptors */}
      <rect
        x="225"
        y="90"
        width="170"
        height="200"
        rx={28 + pulse * 6}
        fill="var(--destructive)"
        fillOpacity={0.08 + 0.1 * pulse}
        stroke="var(--destructive)"
        strokeWidth="3"
      />
      {Array.from({ length: receptors }, (_, i) => {
        const y = 120 + i * 45;
        const on = i < bound;
        return (
          <g key={i}>
            <path
              d={`M 225 ${y} l -14 -10 M 225 ${y} l -14 10`}
              stroke={on ? "var(--warning)" : "var(--muted-foreground)"}
              strokeWidth="3"
              strokeLinecap="round"
            />
            {blocked && (
              <rect
                x="196"
                y={y - 8}
                width="14"
                height="16"
                rx="3"
                fill="var(--destructive)"
                stroke="var(--foreground)"
                strokeOpacity="0.6"
              />
            )}
            {on && (
              <text x="203" y={y + 4} fontSize="13" textAnchor="middle" fill="var(--warning)">
                ✦
              </text>
            )}
          </g>
        );
      })}
      {Array.from({ length: molecules }, (_, i) => {
        const approach = frac(drift * 0.4 + rand(i, 17));
        const targetY = 120 + (i % receptors) * 45;
        const startY = 70 + rand(i, 18) * 240;
        const x = 20 + approach * 160 + (blocked ? -Math.max(0, approach - 0.85) * 120 : 0);
        const y = startY + (targetY - startY) * approach;
        return (
          <text key={i} x={x} y={y} fontSize="12" textAnchor="middle" fill="var(--warning)">
            ✦
          </text>
        );
      })}
      {/* Calcium bursts inside: stronger contraction with more bound receptors */}
      {Array.from({ length: 4 + bound * 3 }, (_, i) => (
        <circle
          key={i}
          cx={255 + rand(i, 41) * 120}
          cy={115 + rand(i, 42) * 150}
          r={1.6 + pulse * 2.4}
          fill="var(--chem)"
          fillOpacity={0.4 + 0.5 * pulse}
        />
      ))}
      <rect x="250" y="270" width="120" height="8" rx="4" fill="var(--muted)" />
      <rect
        x="250"
        y="270"
        width={Math.max(6, 120 * Math.min(1, (p.hr - 40) / 160))}
        height="8"
        rx="4"
        fill={p.hr >= 150 ? "var(--destructive)" : "var(--phys)"}
      />

      {/* C — neuron: glucose + oxygen → ATP */}
      <circle
        cx="500"
        cy="190"
        r="62"
        fill={atpTone}
        fillOpacity={0.08 + (atp / 100) * 0.18}
        stroke={atpTone}
        strokeWidth={hazard > 0 ? 4 : 2.5}
      />
      {[0, 1, 2].map((k) => (
        <ellipse
          key={k}
          cx={480 + k * 22}
          cy={175 + k * 18}
          rx="16"
          ry="8"
          fill="var(--warning)"
          fillOpacity={0.15 + (atp / 100) * 0.5}
          stroke="var(--warning)"
          transform={`rotate(${-20 + k * 25} ${480 + k * 22} ${175 + k * 18})`}
        />
      ))}
      {layers["brain"] &&
        Array.from({ length: Math.round((atp / 100) * 8) }, (_, i) => (
          <circle
            key={i}
            cx={455 + rand(i, 51) * 90}
            cy={150 + rand(i, 52) * 80}
            r="2.6"
            fill="var(--foreground)"
            fillOpacity={0.3 + 0.7 * Math.abs(Math.sin(t * 3 + i))}
          />
        ))}
      {Array.from({ length: Math.min(8, sugar) }, (_, i) => {
        const u = frac(drift * 0.5 + i / 8);
        return (
          <rect
            key={i}
            x={400 + u * 70}
            y={125 + ((i * 37) % 130)}
            width="6"
            height="6"
            rx="1.5"
            fill="var(--warning)"
          />
        );
      })}
      <rect x="440" y="275" width="120" height="8" rx="4" fill="var(--muted)" />
      <rect x="440" y="275" width={Math.max(4, 1.2 * atp)} height="8" rx="4" fill={atpTone} />

      {labels && (
        <g fontSize="12" fontWeight="600" fill="var(--muted-foreground)">
          <text x="97" y="110" textAnchor="middle">
            {ar ? "الدم: أكسجين + جلوكوز" : "Blood: O₂ + glucose"}
          </text>
          <text x="310" y="80" textAnchor="middle">
            {ar ? "خلية القلب" : "Heart cell"}
          </text>
          <text x="130" y="318" textAnchor="middle" fill="var(--warning)">
            {ar ? "جزيئات الأدرينالين" : "Adrenaline"}
          </text>
          <text
            x="310"
            y="306"
            textAnchor="middle"
            fill={blocked ? "var(--destructive)" : undefined}
          >
            {blocked
              ? ar
                ? "المستقبلات مغطاة بالدواء"
                : "Receptors covered by the drug"
              : ar
                ? `${bound}/${receptors} مستقبلات مرتبطة`
                : `${bound}/${receptors} receptors bound`}
          </text>
          <text x="500" y="112" textAnchor="middle" fill={atpTone}>
            {ar ? "خلية عصبية" : "Neuron"}
          </text>
          <text x="500" y="306" textAnchor="middle" fill={atpTone}>
            ATP · {atp.toFixed(0)}%
          </text>
        </g>
      )}
    </svg>
  );
}
