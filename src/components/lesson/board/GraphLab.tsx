import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  scoreSizeCurve,
  scoreSkullCurve,
  skullTissue,
  SKULL_AGES,
  VERTEBRAE_COUNT,
  vertebraRegion,
  vertebraSize,
  type SpineRegion,
} from "@/data/lessons/supportLab";
import { useLang, type L10n } from "@/lib/i18n";
import type { TaskEvent } from "./DrawingLab";
import { S } from "./strings";

const W = 520;
const H = 250;
const X0 = 44;
const X1 = 504;
const Y0 = 24;
const Y1 = 196;

const REGIONS: { id: SpineRegion; from: number; to: number; color: string; name: L10n }[] = [
  { id: "cervical", from: 1, to: 7, color: "#fbbf24", name: { ar: "عنقية", en: "Cervical" } },
  { id: "thoracic", from: 8, to: 19, color: "#f3e6c4", name: { ar: "صدرية", en: "Thoracic" } },
  { id: "lumbar", from: 20, to: 24, color: "#86efac", name: { ar: "قطنية", en: "Lumbar" } },
  { id: "sacral", from: 25, to: 29, color: "#93c5fd", name: { ar: "عجزية", en: "Sacral" } },
  { id: "coccygeal", from: 30, to: 33, color: "#c4b5fd", name: { ar: "عصعصية", en: "Coccygeal" } },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export interface GraphLabProps {
  kind: "vertebrae" | "skull-age";
  block: number;
  /** Updates the 3D scene (highlighted vertebra / skull age). */
  onScene: (patch: { vertebra?: number | null; skullAge?: number | null }) => void;
  onEvent: (e: TaskEvent) => void;
  onSaveCurve: (figure: string, values: number[], title: L10n) => void;
}

/** Student-drawn vertebra size curve (1→33), tied to the highlighted vertebra in 3D. */
function VertebraeGraph({ block, onScene, onEvent, onSaveCurve }: Omit<GraphLabProps, "kind">) {
  const { l, lang } = useLang();
  const [values, setValues] = useState<(number | null)[]>(() => Array(VERTEBRAE_COUNT).fill(null));
  const [marker, setMarker] = useState(12);
  const [showKey, setShowKey] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof scoreSizeCurve> | null>(null);
  const drawing = useRef(false);
  const last = useRef<number | null>(null);

  const xOf = (n: number) => X0 + ((n - 1) / (VERTEBRAE_COUNT - 1)) * (X1 - X0);
  const yOf = (v: number) => Y1 - (v / 100) * (Y1 - Y0);

  const draw = (e: ReactPointerEvent<SVGRectElement>) => {
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const py = ((e.clientY - r.top) / r.height) * H;
    const n = clamp(
      Math.round(1 + ((px - X0) / (X1 - X0)) * (VERTEBRAE_COUNT - 1)),
      1,
      VERTEBRAE_COUNT,
    );
    const v = clamp(Math.round(((Y1 - py) / (Y1 - Y0)) * 100), 0, 100);
    setValues((prev) => {
      const next = prev.slice();
      const from = last.current;
      if (from === null || from === n) next[n - 1] = v;
      else {
        const prevV = prev[from - 1] ?? v;
        const step = n > from ? 1 : -1;
        for (let i = from; i !== n + step; i += step) {
          next[i - 1] = Math.round(prevV + ((v - prevV) * (i - from)) / (n - from));
        }
      }
      return next;
    });
    last.current = n;
    setMarker(n);
    onScene({ vertebra: n });
    setResult(null);
  };

  const filled = values.filter((v) => v !== null).length;
  const poly = (vals: (number | null)[]) =>
    vals
      .map((v, i) => (v === null ? null : `${xOf(i + 1)},${yOf(v)}`))
      .filter((p): p is string => p !== null)
      .join(" ");
  const keyValues = Array.from({ length: VERTEBRAE_COUNT }, (_, i) => vertebraSize(i + 1));
  const shown = values[marker - 1] ?? vertebraSize(marker);
  const region = REGIONS.find((r) => r.id === vertebraRegion(marker))!;

  const check = () => {
    if (filled < VERTEBRAE_COUNT) {
      setResult(null);
      return;
    }
    const sc = scoreSizeCurve(values as number[]);
    setResult(sc);
    const ok = sc.score === 3;
    onEvent({
      taskId: "graph-vertebrae",
      block,
      ok,
      action: {
        ar: `رسم منحنى حجم الفقرات (درجة ${sc.score}/3)`,
        en: `Drew the vertebra size curve (score ${sc.score}/3)`,
      },
      ...(ok
        ? {}
        : {
            mistakes: [
              {
                block,
                kind: "graph" as const,
                picked: {
                  ar: `الذروة عند الفقرة ${sc.peakAt}`,
                  en: `Peak at vertebra ${sc.peakAt}`,
                },
                correct: {
                  ar: "الذروة عند الفقرة 24 ثم ينزل",
                  en: "Peak at vertebra 24, then falling",
                },
                explain: {
                  ar: "يزداد حجم الفقرات المتمفصلة تدريجياً من الفقرة 1 حتى آخر فقرة قطنية (24)، ثم يقل حجم الفقرات الملتحمة تدريجياً من الفقرة 25 حتى الفقرة 33.",
                  en: "The size of the jointed vertebrae increases gradually from no. 1 to the last lumbar vertebra (24); the fused vertebrae then shrink gradually from no. 25 to no. 33.",
                },
              },
            ],
          }),
    });
  };

  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {lang === "ar"
          ? "ارسم بإصبعك أو الماوس منحنى حجم الفقرات من 1 إلى 33 — والمجسم هيضيّء الفقرة اللي بتعدي عليها."
          : "Draw the vertebra size curve from 1 to 33 with your finger or mouse — the 3D model lights up the vertebra you pass."}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 w-full select-none rounded-xl"
        style={{ background: "#fffdf7", touchAction: "none", direction: "ltr" }}
        role="img"
        aria-label={l(S.graphLab)}
      >
        <path d={`M${X0} ${Y0 - 6}V${Y1}H${X1 + 8}`} stroke="#94a3b8" fill="none" />
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X1} y1={yOf(v)} y2={yOf(v)} stroke="#e2e8f0" />
            <text x={X0 - 6} y={yOf(v) + 3} fontSize="9" textAnchor="end" fill="#64748b">
              {v}
            </text>
          </g>
        ))}
        {REGIONS.map((r) => (
          <g key={r.id}>
            <rect
              x={xOf(r.from) - 6}
              y={Y1 + 6}
              width={xOf(r.to) - xOf(r.from) + 12}
              height="16"
              rx="4"
              fill={r.color}
              opacity={r.id === region.id ? 1 : 0.55}
            />
            <text
              x={(xOf(r.from) + xOf(r.to)) / 2}
              y={Y1 + 18}
              fontSize="9.5"
              fontWeight="700"
              textAnchor="middle"
              fill="#0f172a"
            >
              {l(r.name)} {r.from}–{r.to}
            </text>
          </g>
        ))}
        {showKey && (
          <polyline
            points={poly(keyValues)}
            fill="none"
            stroke="#16a34a"
            strokeWidth="2"
            strokeDasharray="5 3"
          />
        )}
        <polyline
          points={poly(values)}
          fill="none"
          stroke="#d97706"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <line
          x1={xOf(marker)}
          x2={xOf(marker)}
          y1={Y0}
          y2={Y1}
          stroke="#0ea5e9"
          strokeDasharray="3 3"
        />
        <circle cx={xOf(marker)} cy={yOf(shown)} r="5" fill="#0ea5e9" />
        <rect
          x={X0}
          y={Y0 - 6}
          width={X1 - X0}
          height={Y1 - Y0 + 12}
          fill="transparent"
          style={{ cursor: "crosshair" }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drawing.current = true;
            last.current = null;
            draw(e);
          }}
          onPointerMove={(e) => {
            if (drawing.current) draw(e);
          }}
          onPointerUp={() => {
            drawing.current = false;
            last.current = null;
          }}
          onPointerCancel={() => {
            drawing.current = false;
            last.current = null;
          }}
        />
      </svg>
      <label className="mt-2 flex items-center gap-3 text-xs font-semibold">
        <span className="shrink-0">
          {lang === "ar" ? "الفقرة" : "Vertebra"} {marker}
        </span>
        <input
          type="range"
          min={1}
          max={VERTEBRAE_COUNT}
          value={marker}
          onChange={(e) => {
            const n = Number(e.target.value);
            setMarker(n);
            onScene({ vertebra: n });
          }}
          className="w-full accent-[var(--color-subject,#0ea5e9)]"
          aria-label={lang === "ar" ? "اختر الفقرة" : "Choose the vertebra"}
        />
      </label>
      <p className="mt-1 text-xs text-muted-foreground">
        {l(region.name)} · {lang === "ar" ? "الحجم" : "size"} ≈ {shown}%
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={check}
          className="rounded-full bg-subject px-4 py-2 text-sm font-bold text-primary-foreground hover:brightness-110"
        >
          {l(S.check)}
        </button>
        <button
          type="button"
          onClick={() => {
            setValues(Array(VERTEBRAE_COUNT).fill(null));
            setResult(null);
            onScene({ vertebra: null });
          }}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
        >
          {l(S.reset)}
        </button>
        <button
          type="button"
          onClick={() => setShowKey((s) => !s)}
          aria-pressed={showKey}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
        >
          {lang === "ar" ? "المنحنى الصحيح" : "Answer curve"}
        </button>
        <button
          type="button"
          disabled={filled === 0}
          onClick={() =>
            onSaveCurve(
              "vertebrae",
              values.map((v) => v ?? 0),
              {
                ar: "منحنى حجم الفقرات",
                en: "Vertebra size curve",
              },
            )
          }
          className="rounded-full border border-subject/40 px-4 py-2 text-sm font-semibold text-subject hover:bg-subject/10 disabled:opacity-40"
        >
          {l(S.toNotebook)}
        </button>
      </div>
      <p className="mt-2 text-sm" role="status">
        {filled < VERTEBRAE_COUNT && filled > 0
          ? lang === "ar"
            ? `كمّل الرسم لكل الفقرات (${filled}/33)`
            : `Complete the curve for every vertebra (${filled}/33)`
          : result
            ? `${result.rising ? "✅" : "❌"} ${lang === "ar" ? "تصاعد 1→24" : "rising 1→24"} · ${result.falling ? "✅" : "❌"} ${lang === "ar" ? "تنازل 25→33" : "falling 25→33"} · ${result.peakOk ? "✅" : "❌"} ${lang === "ar" ? "الذروة عند 24" : "peak at 24"}`
            : ""}
      </p>
    </div>
  );
}

/** Fibrous vs bony tissue in the skull joints against age: drag the five fibrous points. */
function SkullGraph({ block, onScene, onEvent, onSaveCurve }: Omit<GraphLabProps, "kind">) {
  const { l, lang } = useLang();
  const [fibrous, setFibrous] = useState<number[]>([50, 50, 50, 50, 50]);
  const [age, setAge] = useState(20);
  const [showKey, setShowKey] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof scoreSkullCurve> | null>(null);
  const dragging = useRef<number | null>(null);

  const xOf = (a: number) => X0 + (a / 80) * (X1 - X0);
  const yOf = (v: number) => Y1 - (v / 100) * (Y1 - Y0);
  const pts = (vals: readonly number[]) =>
    vals.map((v, i) => `${xOf(SKULL_AGES[i]!)},${yOf(v)}`).join(" ");
  const key = SKULL_AGES.map((a) => skullTissue(a).fibrous);
  const now = skullTissue(age);

  const move = (e: ReactPointerEvent<SVGSVGElement>) => {
    const i = dragging.current;
    if (i === null) return;
    const r = e.currentTarget.getBoundingClientRect();
    const py = ((e.clientY - r.top) / r.height) * H;
    const v = clamp(Math.round(((Y1 - py) / (Y1 - Y0)) * 100), 0, 100);
    setFibrous((f) => f.map((x, j) => (j === i ? v : x)));
    setResult(null);
  };

  const check = () => {
    const sc = scoreSkullCurve(fibrous);
    setResult(sc);
    const ok = sc.score === 3;
    onEvent({
      taskId: "graph-skull-age",
      block,
      ok,
      action: {
        ar: `رسم منحنى الأنسجة الليفية والعظمية في الجمجمة (درجة ${sc.score}/3)`,
        en: `Drew the fibrous / bony skull tissue curve (score ${sc.score}/3)`,
      },
      ...(ok
        ? {}
        : {
            mistakes: [
              {
                block,
                kind: "graph" as const,
                picked: { ar: "المنحنى اللي رسمته", en: "Your curve" },
                correct: {
                  ar: "الليفي ينقص والعظمي يزيد مع العمر",
                  en: "Fibrous falls and bony rises with age",
                },
                explain: {
                  ar: "المفاصل الليفية تلتحم العظام عندها بأنسجة ليفية تتحول مع تقدم العمر إلى أنسجة عظمية، فالنسيج الليفي يقل والعظمي يزيد.",
                  en: "At fibrous joints the bones are joined by fibrous tissue that turns into bony tissue with age, so fibrous tissue falls and bony tissue rises.",
                },
              },
            ],
          }),
    });
  };

  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {lang === "ar"
          ? "اسحب النقط الخمس لرسم النسيج الليفي مع العمر (العظمي = 100 − الليفي)، وحرّك العمر وشوف الجمجمة في الـ 3D."
          : "Drag the five points to draw fibrous tissue against age (bony = 100 − fibrous), then move the age and watch the skull in 3D."}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 w-full select-none rounded-xl"
        style={{ background: "#fffdf7", touchAction: "none", direction: "ltr" }}
        role="img"
        aria-label={l(S.graphLab)}
        onPointerMove={move}
        onPointerUp={() => (dragging.current = null)}
        onPointerCancel={() => (dragging.current = null)}
      >
        <path d={`M${X0} ${Y0 - 6}V${Y1}H${X1 + 8}`} stroke="#94a3b8" fill="none" />
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X1} y1={yOf(v)} y2={yOf(v)} stroke="#e2e8f0" />
            <text x={X0 - 6} y={yOf(v) + 3} fontSize="9" textAnchor="end" fill="#64748b">
              {v}%
            </text>
          </g>
        ))}
        {SKULL_AGES.map((a) => (
          <text key={a} x={xOf(a)} y={Y1 + 16} fontSize="10" textAnchor="middle" fill="#475569">
            {a}
          </text>
        ))}
        <text x={X1} y={Y1 + 32} fontSize="10" textAnchor="end" fill="#475569">
          {lang === "ar" ? "العمر (سنة)" : "age (years)"}
        </text>
        {showKey && (
          <>
            <polyline
              points={pts(key)}
              fill="none"
              stroke="#16a34a"
              strokeWidth="2"
              strokeDasharray="5 3"
            />
            <polyline
              points={pts(key.map((v) => 100 - v))}
              fill="none"
              stroke="#16a34a"
              strokeWidth="2"
              strokeDasharray="2 3"
            />
          </>
        )}
        <polyline points={pts(fibrous)} fill="none" stroke="#b45309" strokeWidth="2.6" />
        <polyline
          points={pts(fibrous.map((v) => 100 - v))}
          fill="none"
          stroke="#0369a1"
          strokeWidth="2.6"
          strokeDasharray="6 3"
        />
        <line x1={xOf(age)} x2={xOf(age)} y1={Y0} y2={Y1} stroke="#0ea5e9" strokeDasharray="3 3" />
        {fibrous.map((v, i) => (
          <circle
            key={i}
            cx={xOf(SKULL_AGES[i]!)}
            cy={yOf(v)}
            r="9"
            fill="#f59e0b"
            stroke="#92400e"
            strokeWidth="2"
            style={{ cursor: "grab" }}
            role="slider"
            aria-label={`${lang === "ar" ? "عمر" : "age"} ${SKULL_AGES[i]}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={v}
            tabIndex={0}
            onKeyDown={(e) => {
              const d = e.key === "ArrowUp" ? 5 : e.key === "ArrowDown" ? -5 : 0;
              if (d) {
                e.preventDefault();
                setFibrous((f) => f.map((x, j) => (j === i ? clamp(x + d, 0, 100) : x)));
                setResult(null);
              }
            }}
            onPointerDown={(e) => {
              e.currentTarget.ownerSVGElement?.setPointerCapture(e.pointerId);
              dragging.current = i;
            }}
          />
        ))}
        <g fontSize="10" fontWeight="700">
          <text x={X0 + 8} y={Y0 + 4} fill="#b45309">
            {lang === "ar" ? "ليفي" : "fibrous"}
          </text>
          <text x={X0 + 60} y={Y0 + 4} fill="#0369a1">
            {lang === "ar" ? "عظمي" : "bony"}
          </text>
        </g>
      </svg>
      <label className="mt-2 flex items-center gap-3 text-xs font-semibold">
        <span className="shrink-0">
          {lang === "ar" ? "العمر" : "Age"} {age}
        </span>
        <input
          type="range"
          min={0}
          max={80}
          value={age}
          onChange={(e) => {
            const a = Number(e.target.value);
            setAge(a);
            onScene({ skullAge: a });
          }}
          className="w-full accent-[var(--color-subject,#0ea5e9)]"
          aria-label={lang === "ar" ? "العمر" : "Age"}
        />
      </label>
      <p className="mt-1 text-xs text-muted-foreground">
        {lang === "ar" ? "ليفي" : "fibrous"} {now.fibrous}% · {lang === "ar" ? "عظمي" : "bony"}{" "}
        {now.bony}%
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={check}
          className="rounded-full bg-subject px-4 py-2 text-sm font-bold text-primary-foreground hover:brightness-110"
        >
          {l(S.check)}
        </button>
        <button
          type="button"
          onClick={() => {
            setFibrous([50, 50, 50, 50, 50]);
            setResult(null);
          }}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
        >
          {l(S.reset)}
        </button>
        <button
          type="button"
          onClick={() => setShowKey((s) => !s)}
          aria-pressed={showKey}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
        >
          {lang === "ar" ? "المنحنى الصحيح" : "Answer curve"}
        </button>
        <button
          type="button"
          onClick={() =>
            onSaveCurve("skull-age", fibrous, {
              ar: "منحنى الأنسجة الليفية في الجمجمة",
              en: "Fibrous tissue curve in the skull",
            })
          }
          className="rounded-full border border-subject/40 px-4 py-2 text-sm font-semibold text-subject hover:bg-subject/10"
        >
          {l(S.toNotebook)}
        </button>
      </div>
      {result && (
        <p className="mt-2 text-sm" role="status">
          {result.fibrousFalls ? "✅" : "❌"} {lang === "ar" ? "الليفي ينقص" : "fibrous falls"} ·{" "}
          {result.bonyRises ? "✅" : "❌"} {lang === "ar" ? "العظمي يزيد" : "bony rises"} ·{" "}
          {result.startsFibrous ? "✅" : "❌"}{" "}
          {lang === "ar" ? "يبدأ ليفياً عند الميلاد" : "starts fibrous at birth"}
        </p>
      )}
    </div>
  );
}

export function GraphLab(props: GraphLabProps) {
  const { kind, ...rest } = props;
  return kind === "vertebrae" ? <VertebraeGraph {...rest} /> : <SkullGraph {...rest} />;
}
