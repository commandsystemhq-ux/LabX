import { computeDiffusion } from "@/data/simulations";
import { useLang } from "@/lib/i18n";
import { frac, rand, type SceneProps, useIntegrated } from "./sceneUtils";

/** Macro view: a cell with particles diffusing inward through its membrane. */
export function CellScene({ t, values, activity, labels, flow }: SceneProps) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { rate } = computeDiffusion(values.temperature, values.gradient, values.permeability);
  const phase = useIntegrated(t, activity * 0.35);
  const count = Math.round(6 + (values.gradient / 100) * 34);
  const cx = 300;
  const cy = 190;

  return (
    <svg viewBox="0 0 600 380" className="h-full w-full" role="img" aria-label="Cell diffusion simulation">
      <circle cx={cx} cy={cy} r="130" fill="var(--bio)" fillOpacity="0.07" />
      <circle cx={cx} cy={cy} r="120" fill="var(--bio)" fillOpacity="0.06" stroke="var(--bio)" strokeWidth="5" strokeDasharray={`${4 + values.permeability / 10} 6`} strokeDashoffset={-t * 14} />
      <circle cx={cx} cy={cy} r="112" fill="none" stroke="var(--bio)" strokeOpacity="0.35" strokeWidth="2" />
      <circle cx={cx + 10} cy={cy - 5} r="38" fill="var(--bio)" fillOpacity="0.2" stroke="var(--bio)" strokeOpacity="0.6" strokeWidth="2" />
      <circle cx={cx + 16} cy={cy - 10} r="10" fill="var(--bio)" fillOpacity="0.45" />
      <ellipse cx={cx - 60} cy={cy + 45} rx="22" ry="10" fill="none" stroke="var(--warning)" strokeOpacity="0.6" strokeWidth="2" transform={`rotate(-20 ${cx - 60} ${cy + 45})`} />
      <ellipse cx={cx + 55} cy={cy + 60} rx="18" ry="8" fill="none" stroke="var(--warning)" strokeOpacity="0.6" strokeWidth="2" transform={`rotate(25 ${cx + 55} ${cy + 60})`} />

      {Array.from({ length: 40 }, (_, i) => {
        if (i >= count) return null;
        const a = rand(i, 31) * Math.PI * 2 + Math.sin(t * 0.5 + i) * 0.05;
        const p = frac(phase * (0.6 + rand(i, 32) * 0.8) + rand(i, 33));
        const r = 260 - p * 200;
        const x = cx + Math.cos(a) * r * 1.15;
        const y = cy + Math.sin(a) * r * 0.85;
        const inside = r < 120;
        return <circle key={i} cx={x} cy={y} r="5" fill={inside ? "var(--bio)" : "var(--foreground)"} fillOpacity={inside ? 0.9 : 0.75} />;
      })}

      {flow &&
        [0, 1, 2, 3, 4, 5].map((k) => {
          const a = (k / 6) * Math.PI * 2 + 0.3;
          const x1 = cx + Math.cos(a) * 175;
          const y1 = cy + Math.sin(a) * 150;
          const x2 = cx + Math.cos(a) * 140;
          const y2 = cy + Math.sin(a) * 125;
          return (
            <g key={k} opacity={values.gradient > 0 ? 0.85 : 0.2}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--warning)" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx={x2} cy={y2} r="3" fill="var(--warning)" />
            </g>
          );
        })}

      {labels && (
        <g fontSize="12" fontWeight="600" fill="var(--muted-foreground)">
          <text x={cx + 10} y={cy + 52} textAnchor="middle">{ar ? "النواة" : "Nucleus"}</text>
          <text x="80" y="40">{ar ? "تركيز عالي برة" : "High concentration outside"}</text>
          <text x={cx} y="355" textAnchor="middle">{ar ? "الغشاء البلازمي" : "Plasma membrane"}</text>
          <text x="530" y="40" textAnchor="end" fontFamily="var(--font-mono)" fill="var(--bio)" fontWeight="700">
            J = {rate.toFixed(1)} µmol/s
          </text>
        </g>
      )}
    </svg>
  );
}
