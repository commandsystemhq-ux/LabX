import { useEffect, useMemo, useState } from "react";
import {
  BLOCK_COUNT,
  buildRescue,
  RESCUE_MINUTES,
  weakBlocks,
  weakness,
  type RadarState,
  type RescueKind,
  type RescuePlan,
} from "@/data/lessons/supportRadar";
import { useLang, type L10n } from "@/lib/i18n";
import { S } from "./strings";

const KIND: Record<RescueKind, L10n> = {
  review: { ar: "اقرا النص وراجع التبسيط", en: "Re-read the text and the simple explanation" },
  trap: { ar: "جرّب مصيدة الامتحان", en: "Run the exam trap" },
  lab: { ar: "أعد المهام العملية", en: "Redo the lab tasks" },
  quiz: { ar: "حل الأسئلة الفورية", en: "Redo the quick questions" },
};

interface Props {
  radar: RadarState;
  titleOf: (block: number) => L10n;
  /** Item ids (tasks and questions) of a block, so the plan can name what was missed. */
  itemsOf: (block: number) => string[];
  onGoto: (block: number, kind: RescueKind) => void;
}

const CX = 150;
const CY = 150;
const R = 110;

function point(i: number, r: number): [number, number] {
  const a = (i / BLOCK_COUNT) * Math.PI * 2 - Math.PI / 2;
  return [CX + Math.cos(a) * r, CY + Math.sin(a) * r];
}

/**
 * «طبيب نقط الضعف»: a radar of the 14 blocks (the further out, the weaker) and a 10-minute rescue
 * session built from the weakest ones, with a countdown.
 */
export function WeaknessRadar({ radar, titleOf, itemsOf, onGoto }: Props) {
  const { l, lang } = useLang();
  const weak = useMemo(() => weakBlocks(radar, 4), [radar]);
  const [plan, setPlan] = useState<RescuePlan | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (left === null || left <= 0) return;
    const id = window.setTimeout(() => setLeft((s) => (s === null ? s : s - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [left]);

  const tracked = Array.from({ length: BLOCK_COUNT }, (_, i) => radar.blocks[String(i + 1)]).some(
    (b) => b && b.hits + b.misses > 0,
  );
  const poly = Array.from({ length: BLOCK_COUNT }, (_, i) =>
    point(i, 8 + (weakness(radar, i + 1) / 100) * (R - 8)).join(","),
  ).join(" ");

  const start = () => {
    const p = buildRescue(radar, itemsOf);
    setPlan(p);
    setDone(new Set());
    setLeft(p.steps.length ? RESCUE_MINUTES * 60 : null);
  };

  const mm =
    left === null
      ? ""
      : `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;

  return (
    <div className="glass rounded-3xl p-4">
      <h3 className="text-lg font-bold">🎯 {l(S.radar)}</h3>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <svg
          viewBox="0 0 300 300"
          className="mx-auto w-full max-w-xs"
          role="img"
          aria-label={l(S.radar)}
        >
          {[0.25, 0.5, 0.75, 1].map((k) => (
            <polygon
              key={k}
              points={Array.from({ length: BLOCK_COUNT }, (_, i) => point(i, R * k).join(",")).join(
                " ",
              )}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.15"
            />
          ))}
          {Array.from({ length: BLOCK_COUNT }, (_, i) => {
            const [x, y] = point(i, R);
            const [lx, ly] = point(i, R + 14);
            return (
              <g key={i}>
                <line x1={CX} y1={CY} x2={x} y2={y} stroke="currentColor" strokeOpacity="0.12" />
                <text
                  x={lx}
                  y={ly + 3}
                  fontSize="10"
                  textAnchor="middle"
                  fill="currentColor"
                  opacity="0.8"
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
          <polygon
            points={poly}
            fill="#ef4444"
            fillOpacity="0.28"
            stroke="#ef4444"
            strokeWidth="2"
          />
        </svg>
        <div>
          {!tracked ? (
            <p className="text-sm text-muted-foreground">
              {lang === "ar"
                ? "لسه مفيش بيانات — حل أسئلة الجزئيات وهنرسم لك نقط الضعف تلقائياً."
                : "No data yet — answer some block questions and your weak spots will appear here."}
            </p>
          ) : weak.length === 0 ? (
            <p className="text-sm font-semibold text-bio">
              {lang === "ar" ? "مفيش نقط ضعف واضحة 👏" : "No clear weak spots 👏"}
            </p>
          ) : (
            <ul className="space-y-2">
              {weak.map((w) => (
                <li
                  key={w.block}
                  className="rounded-xl border border-destructive/40 bg-destructive/10 p-2 text-sm"
                >
                  <span className="font-bold">
                    {l(S.block)} {w.block}
                  </span>{" "}
                  — {l(titleOf(w.block))}
                  <span className="ms-2 font-mono text-xs text-destructive">
                    {w.weakness}% · {w.misses} {lang === "ar" ? "غلطات" : "misses"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={start}
            disabled={weak.length === 0}
            className="mt-3 rounded-full bg-subject px-4 py-2 text-sm font-bold text-primary-foreground hover:brightness-110 disabled:opacity-40"
          >
            🚑 {lang === "ar" ? "ابدأ جلسة إنقاذ 10 دقايق" : "Start a 10-minute rescue session"}
          </button>
        </div>
      </div>
      {plan && (
        <div className="mt-4 rounded-2xl border border-subject/30 bg-subject/5 p-3">
          <p className="font-bold">
            {lang === "ar" ? "جلسة الإنقاذ" : "Rescue session"} · {plan.minutes}{" "}
            {lang === "ar" ? "دقيقة" : "min"}
            {mm && <span className="ms-3 font-mono text-subject">⏱ {mm}</span>}
          </p>
          <ol className="mt-2 space-y-2">
            {plan.steps.map((s, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={done.has(i)}
                  onChange={() =>
                    setDone((d) => {
                      const n = new Set(d);
                      if (n.has(i)) n.delete(i);
                      else n.add(i);
                      return n;
                    })
                  }
                  aria-label={l(KIND[s.kind])}
                />
                <span className="min-w-0 flex-1">
                  <b>
                    {l(S.block)} {s.block}
                  </b>{" "}
                  · {l(KIND[s.kind])} ({s.minutes}′)
                  {s.itemIds.length > 0 && (
                    <span className="text-xs text-muted-foreground"> · {s.itemIds.length}✗</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => onGoto(s.block, s.kind)}
                  className="rounded-full border border-subject/40 px-3 py-1 text-xs font-semibold text-subject hover:bg-subject/10"
                >
                  {lang === "ar" ? "افتح" : "Open"}
                </button>
              </li>
            ))}
          </ol>
          {left === 0 && (
            <p className="mt-2 text-sm font-bold text-bio">
              {lang === "ar" ? "خلصت الجلسة! 👏" : "Session over! 👏"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
