import { useLang } from "@/lib/i18n";
import { rand, type SceneProps, tri, useIntegrated } from "./sceneUtils";

/** Molecular view for reactions: two species bouncing; nearby A–B pairs spark as collisions. */
export function ParticleBoxScene({ t, values, labels, flow }: SceneProps) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const speed = Math.sqrt((values.temperature + 273) / 298) ** 3 * 0.22;
  const phase = useIntegrated(t, speed);
  const n = Math.round(6 + values.concentration * 9);
  const L = 50;
  const T = 50;
  const Wd = 500;
  const Ht = 270;
  const threshold = 16 + values.catalyst * 1.6;

  const pts = Array.from({ length: n * 2 }, (_, i) => {
    const vx = (0.25 + rand(i, 21) * 0.5) * (rand(i, 22) > 0.5 ? 1 : -1);
    const vy = (0.25 + rand(i, 23) * 0.5) * (rand(i, 24) > 0.5 ? 1 : -1);
    return {
      x: L + 10 + tri(rand(i, 25) * 2 + phase * vx) * (Wd - 20),
      y: T + 10 + tri(rand(i, 26) * 2 + phase * vy) * (Ht - 20),
      a: i < n,
    };
  });

  const sparks: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = n; j < n * 2; j++) {
      const a = pts[i]!;
      const b = pts[j]!;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      if (dx * dx + dy * dy < threshold * threshold) sparks.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    }
  }

  return (
    <svg viewBox="0 0 600 380" className="h-full w-full" role="img" aria-label="Molecular collision simulation">
      <rect x={L} y={T} width={Wd} height={Ht} rx="18" fill="var(--chem)" fillOpacity="0.05" stroke="var(--chem)" strokeOpacity="0.4" />
      {values.catalyst > 0 && (
        <rect x={L + 4} y={T + Ht - 10} width={Wd - 8} height="6" rx="3" fill="var(--warning)" opacity={0.25 + values.catalyst * 0.06} />
      )}
      {sparks.map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy={s.y} r="16" fill="var(--warning)" opacity="0.25" />
          <path d={`M ${s.x - 8} ${s.y} L ${s.x + 8} ${s.y} M ${s.x} ${s.y - 8} L ${s.x} ${s.y + 8}`} stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}
      {pts.map((p, i) =>
        p.a ? (
          <circle key={i} cx={p.x} cy={p.y} r="8" fill="var(--chem)" />
        ) : (
          <circle key={i} cx={p.x} cy={p.y} r="6" fill="var(--foreground)" fillOpacity="0.85" />
        ),
      )}
      {flow &&
        pts.slice(0, 6).map((p, i) => (
          <line key={i} x1={p.x} y1={p.y} x2={p.x + (rand(i, 21) > 0.5 ? 1 : -1) * speed * 60} y2={p.y} stroke="var(--chem)" strokeOpacity="0.6" strokeWidth="2" />
        ))}
      {labels && (
        <g fontSize="12" fontWeight="600" fill="var(--muted-foreground)">
          <circle cx="60" cy="25" r="7" fill="var(--chem)" />
          <text x="74" y="29">{ar ? "جزيئات A" : "Molecules A"}</text>
          <circle cx="170" cy="25" r="5" fill="var(--foreground)" />
          <text x="182" y="29">{ar ? "جزيئات B" : "Molecules B"}</text>
          <circle cx="290" cy="25" r="7" fill="var(--warning)" opacity="0.5" />
          <text x="302" y="29">{ar ? "تصادم فعّال" : "Effective collision"}</text>
          <text x="550" y="355" textAnchor="end" fontFamily="var(--font-mono)" fill="var(--warning)" fontWeight="700">
            {sparks.length} {ar ? "تصادم الآن" : "collisions now"}
          </text>
        </g>
      )}
    </svg>
  );
}
