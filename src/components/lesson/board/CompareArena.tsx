import { useMemo, useState } from "react";
import {
  COMPARISONS,
  gradeCompare,
  type CompareAssignment,
  type CompareGrade,
} from "@/data/lessons/supportCompare";
import type { CompareId } from "@/data/lessons/supportTypes";
import { useLang } from "@/lib/i18n";
import type { TaskEvent } from "./DrawingLab";
import { S } from "./strings";

const SIDE_TONES = [
  "border-sky-400/60 bg-sky-400/10",
  "border-amber-400/60 bg-amber-400/10",
  "border-emerald-400/60 bg-emerald-400/10",
  "border-fuchsia-400/60 bg-fuchsia-400/10",
];
const BAR_TONES = ["bg-sky-500", "bg-amber-500", "bg-emerald-500", "bg-fuchsia-500"];

/** Animated meter: the bar grows to its value and a stream of dots flows at a matching speed. */
function Meter({ value, tone, text }: { value: number; tone: string; text: string | undefined }) {
  const dots = Math.max(1, Math.round(value / 20));
  return (
    <div>
      <div className="relative h-3 overflow-hidden rounded-full bg-muted">
        <div
          className={"h-full rounded-full transition-all duration-700 " + tone}
          style={{ width: `${value}%` }}
        />
        <svg
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 10"
          aria-hidden
        >
          {Array.from({ length: dots }, (_, i) => (
            <circle key={i} cy="5" r="1.6" fill="#fff" opacity="0.85">
              <animate
                attributeName="cx"
                from="-2"
                to={String(Math.max(6, value))}
                dur={`${Math.max(0.8, 3.2 - value / 40)}s`}
                begin={`${(i * 0.37).toFixed(2)}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </svg>
      </div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{text ?? `${Math.round(value)}%`}</p>
    </div>
  );
}

interface Props {
  id: CompareId;
  block: number;
  onEvent: (e: TaskEvent) => void;
}

/**
 * «حلبة المقارنات الحيّة»: the sides stand face to face with live meters; the student sorts the
 * property cards onto the sides (tap a card then a side, or drag). A card may sit on several sides.
 */
export function CompareArena({ id, block, onEvent }: Props) {
  const { l, lang } = useLang();
  const def = COMPARISONS[id];
  const [assign, setAssign] = useState<CompareAssignment>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [grade, setGrade] = useState<CompareGrade | null>(null);

  const placedIds = useMemo(
    () => new Set(Object.keys(assign).filter((k) => (assign[k] ?? []).length > 0)),
    [assign],
  );

  const toggle = (cardId: string, side: number) => {
    setAssign((a) => {
      const cur = a[cardId] ?? [];
      const next = cur.includes(side) ? cur.filter((s) => s !== side) : [...cur, side];
      return { ...a, [cardId]: next };
    });
    setGrade(null);
  };

  const onSide = (side: number) => {
    if (!picked) return;
    toggle(picked, side);
    setPicked(null);
  };

  const check = () => {
    const g = gradeCompare(def, assign);
    setGrade(g);
    const sideNames = (idx: readonly number[]) =>
      idx.map((i) => def.sides[i]).filter((x): x is NonNullable<typeof x> => !!x);
    onEvent({
      taskId: `compare-${id}`,
      block,
      ok: g.wrong.length === 0 && g.missing.length === 0,
      action: {
        ar: `رتّب ${g.correct} من ${g.total} خاصية في «${def.title.ar}»`,
        en: `Sorted ${g.correct} of ${g.total} properties in “${def.title.en}”`,
      },
      mistakes: g.wrong.slice(0, 3).flatMap((cid) => {
        const cd = def.cards.find((c) => c.id === cid);
        if (!cd) return [];
        const got = sideNames(assign[cid] ?? []);
        const right = sideNames(cd.sides);
        return [
          {
            block,
            kind: "compare" as const,
            picked: { ar: got.map((s) => s.ar).join(" + "), en: got.map((s) => s.en).join(" + ") },
            correct: {
              ar: right.map((s) => s.ar).join(" + "),
              en: right.map((s) => s.en).join(" + "),
            },
            explain: {
              ar: `«${cd.text.ar}» تخص: ${right.map((s) => s.ar).join(" و")}.`,
              en: `“${cd.text.en}” belongs to: ${right.map((s) => s.en).join(" and ")}.`,
            },
          },
        ];
      }),
    });
  };

  const cols = def.sides.length;
  return (
    <div>
      <p className="text-sm font-semibold">⚖️ {l(def.title)}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {lang === "ar"
          ? "اختار الخاصية ثم اضغط على الجهة (أو اسحبها). ممكن تتحط في أكتر من جهة."
          : "Pick a property, then tap a side (or drag it). A property can go on several sides."}
      </p>
      <div
        className={
          "mt-3 grid gap-2 " +
          (cols >= 3 ? "grid-cols-1 sm:grid-cols-" + Math.min(cols, 4) : "grid-cols-2")
        }
        style={
          cols >= 3 ? { gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))` } : undefined
        }
      >
        {def.sides.map((side, si) => (
          <div
            key={si}
            onClick={() => onSide(si)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const cid = e.dataTransfer.getData("text/plain");
              if (def.cards.some((c) => c.id === cid)) toggle(cid, si);
            }}
            role="button"
            tabIndex={0}
            aria-label={l(side)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSide(si);
              }
            }}
            className={
              "min-h-28 rounded-2xl border-2 p-2.5 " +
              SIDE_TONES[si % 4] +
              (picked ? " cursor-pointer" : "")
            }
          >
            <p className="text-center text-sm font-bold">{l(side)}</p>
            <div className="mt-2 space-y-2">
              {def.meters.map((m, mi) => (
                <div key={mi}>
                  <p className="text-[11px] font-semibold">{l(m.label)}</p>
                  <Meter
                    value={m.values[si] ?? 0}
                    tone={BAR_TONES[si % 4]!}
                    text={m.texts?.[si] ? l(m.texts[si]!) : undefined}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {def.cards
                .filter((c) => (assign[c.id] ?? []).includes(si))
                .map((c) => {
                  const bad = grade && !c.sides.includes(si);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(c.id, si);
                      }}
                      className={
                        "rounded-lg border px-2 py-1 text-start text-[11px] leading-snug " +
                        (grade
                          ? bad
                            ? "border-destructive bg-destructive/15"
                            : "border-bio bg-bio/15"
                          : "border-border bg-background/70")
                      }
                    >
                      {l(c.text)}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5" role="group">
        {def.cards.map((c) => (
          <button
            key={c.id}
            type="button"
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)}
            onClick={() => setPicked((p) => (p === c.id ? null : c.id))}
            aria-pressed={picked === c.id}
            className={
              "rounded-xl border px-2.5 py-1.5 text-start text-xs leading-snug transition " +
              (picked === c.id
                ? "border-subject bg-subject/25"
                : placedIds.has(c.id)
                  ? "border-border bg-background/40 opacity-60"
                  : "border-subject/40 bg-subject/10 hover:bg-subject/20")
            }
          >
            {l(c.text)}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={check}
          disabled={placedIds.size === 0}
          className="rounded-full bg-subject px-4 py-2 text-sm font-bold text-primary-foreground hover:brightness-110 disabled:opacity-40"
        >
          {l(S.check)}
        </button>
        <button
          type="button"
          onClick={() => {
            setAssign({});
            setGrade(null);
            setPicked(null);
          }}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
        >
          {l(S.reset)}
        </button>
      </div>
      {grade && (
        <p className="mt-2 text-sm font-bold" role="status">
          {grade.wrong.length === 0 && grade.missing.length === 0
            ? `${l(S.correct)} ${grade.correct}/${grade.total}`
            : `${grade.correct}/${grade.total} — ${
                grade.missing.length
                  ? lang === "ar"
                    ? `${grade.missing.length} لسه ما اتحطتش. `
                    : `${grade.missing.length} not placed yet. `
                  : ""
              }${l(S.retry)}`}
        </p>
      )}
    </div>
  );
}
