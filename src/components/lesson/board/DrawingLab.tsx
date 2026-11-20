import { useMemo, useState } from "react";
import { FIGURES } from "@/data/lessons/supportFigures";
import {
  evaluateDeposit,
  MATERIALS,
  MATERIAL_IDS,
  SAMPLES,
  SAMPLE_IDS,
  type MaterialId,
  type SampleId,
} from "@/data/lessons/supportLab";
import type { SupportMistake } from "@/data/lessons/supportNoor";
import type { LabelTask } from "@/data/lessons/supportTypes";
import { useLang, type L10n } from "@/lib/i18n";
import { FigureSvg } from "./FigureSvg";
import { S } from "./strings";

export interface TaskEvent {
  taskId: string;
  block: number;
  ok: boolean;
  /** Short line for Noor's "what the student did". */
  action: L10n;
  mistakes?: SupportMistake[];
}

interface Chip {
  key: string;
  group: string;
  name: L10n;
}

/* ------------------------------ labelling / assembly ------------------------------ */

interface LabelLabProps {
  task: LabelTask;
  block: number;
  onEvent: (e: TaskEvent) => void;
  onSaveDrawing: (figure: string, placed: Record<string, string>, title: L10n) => void;
}

/**
 * «ارسم وركّب بإيدك»: pick a label and tap its number on the drawing (or drag it there). On the
 * vertebra, each process is only drawn once the student names it correctly, so the sketch is built
 * by the student.
 */
export function LabelLab({ task, block, onEvent, onSaveDrawing }: LabelLabProps) {
  const { l, lang } = useLang();
  const figure = FIGURES[task.figure];
  const active = useMemo(
    () => figure.callouts.filter((c) => task.parts.includes(c.group) || task.parts.includes(c.id)),
    [figure, task.parts],
  );
  const chips = useMemo<Chip[]>(() => {
    const seen: Record<string, number> = {};
    return active.map((c) => {
      seen[c.group] = (seen[c.group] ?? 0) + 1;
      return { key: `${c.group}#${seen[c.group]}`, group: c.group, name: c.name };
    });
  }, [active]);
  const activeIds = useMemo(() => new Set(active.map((c) => c.id)), [active]);
  const assemble = task.figure === "vertebra";

  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [chip, setChip] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [checked, setChecked] = useState<{ right: Set<string>; wrong: Set<string> } | null>(null);

  const chipByKey = (k: string) => chips.find((c) => c.key === k);
  const used = new Set(Object.values(placed));
  const texts: Record<string, string> = {};
  for (const [cid, key] of Object.entries(placed)) {
    const c = chipByKey(key);
    if (c) texts[cid] = l(c.name);
  }
  const revealed = useMemo(() => {
    const out = new Set<string>(["body"]);
    if (!assemble) return out;
    for (const c of active) {
      const key = placed[c.id];
      if (key && chipByKey(key)?.group === c.group) out.add(c.id);
    }
    // The neural ring and canal are the first things drawn, so the processes have something to sit on.
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chips derive from `active`
  }, [assemble, active, placed]);

  const put = (slotId: string, chipKey: string) => {
    if (!activeIds.has(slotId) || !chipByKey(chipKey)) return;
    setPlaced((p) => {
      const next = { ...p };
      for (const [k, v] of Object.entries(next)) if (v === chipKey) delete next[k];
      next[slotId] = chipKey;
      return next;
    });
    setChip(null);
    setSlot(null);
    setChecked(null);
  };

  const onSlot = (id: string) => {
    if (!activeIds.has(id)) return;
    if (chip) put(id, chip);
    else if (placed[id]) {
      setPlaced((p) => {
        const n = { ...p };
        delete n[id];
        return n;
      });
      setChecked(null);
    } else setSlot((s) => (s === id ? null : id));
  };
  const onChip = (key: string) => {
    if (slot) put(slot, key);
    else setChip((c) => (c === key ? null : key));
  };

  const check = () => {
    const right = new Set<string>();
    const wrong = new Set<string>();
    const mistakes: SupportMistake[] = [];
    active.forEach((c, i) => {
      const key = placed[c.id];
      const got = key ? chipByKey(key) : undefined;
      if (got && got.group === c.group) right.add(c.id);
      else {
        wrong.add(c.id);
        mistakes.push({
          block,
          kind: "label",
          picked: got ? got.name : { ar: "لم أسمّه", en: "left empty" },
          correct: c.name,
          explain: {
            ar: `الرقم ${figure.callouts.indexOf(c) + 1} في رسمة «${figure.title.ar}» هو «${c.name.ar}». راجع نص الكتاب لهذه الجزئية.`,
            en: `Number ${figure.callouts.indexOf(c) + 1} in the drawing “${figure.title.en}” is “${c.name.en}”. Review the textbook text of this block.`,
          },
        });
        void i;
      }
    });
    setChecked({ right, wrong });
    onEvent({
      taskId: task.id,
      block,
      ok: wrong.size === 0,
      action: {
        ar: `سمّى ${right.size} من ${active.length} جزء في «${figure.title.ar}»`,
        en: `Labelled ${right.size} of ${active.length} parts of “${figure.title.en}”`,
      },
      mistakes,
    });
  };

  return (
    <div>
      <p className="text-sm font-semibold">{l(task.title)}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {l(assemble ? S.assemble : S.chooseLabel)}
      </p>
      <div className="mx-auto mt-2 max-w-xl">
        <FigureSvg
          figure={figure}
          lang={lang}
          mode="slots"
          placed={texts}
          active={activeIds}
          selected={slot}
          {...(checked ? { right: checked.right, wrong: checked.wrong } : {})}
          {...(assemble ? { revealed } : {})}
          onCallout={onSlot}
          onDropLabel={(id, payload) => put(id, payload)}
          className="w-full touch-manipulation"
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={l(S.place)}>
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", c.key)}
            disabled={used.has(c.key)}
            onClick={() => onChip(c.key)}
            aria-pressed={chip === c.key}
            className={
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition " +
              (chip === c.key
                ? "border-subject bg-subject/25"
                : used.has(c.key)
                  ? "border-border opacity-40"
                  : "border-subject/40 bg-subject/10 hover:bg-subject/20")
            }
          >
            {l(c.name)}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={check}
          disabled={Object.keys(placed).length === 0}
          className="rounded-full bg-subject px-4 py-2 text-sm font-bold text-primary-foreground hover:brightness-110 disabled:opacity-40"
        >
          {l(S.check)}
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaced({});
            setChecked(null);
            setChip(null);
            setSlot(null);
          }}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
        >
          {l(S.reset)}
        </button>
        <button
          type="button"
          onClick={() => {
            const flat: Record<string, string> = {};
            for (const [cid, key] of Object.entries(placed)) {
              const g = chipByKey(key)?.group;
              if (g) flat[cid] = g;
            }
            onSaveDrawing(task.figure, flat, figure.title);
          }}
          disabled={Object.keys(placed).length === 0}
          className="rounded-full border border-subject/40 px-4 py-2 text-sm font-semibold text-subject hover:bg-subject/10 disabled:opacity-40"
        >
          {l(S.toNotebook)}
        </button>
      </div>
      {checked && (
        <p
          role="status"
          className={
            "mt-2 text-sm font-bold " + (checked.wrong.size === 0 ? "text-bio" : "text-destructive")
          }
        >
          {checked.wrong.size === 0
            ? l(S.correct)
            : `${checked.right.size}/${active.length} — ${l(S.retry)}`}
        </p>
      )}
    </div>
  );
}

/* ------------------------------ material deposit lab ------------------------------ */

function Bar({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={"h-full rounded-full transition-all duration-500 " + tone}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

interface DepositLabProps {
  taskId: string;
  block: number;
  onEvent: (e: TaskEvent) => void;
  /** Tells the 3D stem which sample is painted with which material. */
  onScene: (d: { sample: SampleId; material: MaterialId | null } | null) => void;
  onSaveNote: (title: string, text: string) => void;
}

/**
 * «مختبر ترسيب المواد»: the student paints a tissue with cellulose, lignin, cutin or suberin and
 * sees water permeability, flexibility, rigidity and whether the cell lives or dies.
 */
export function DepositLab({ taskId, block, onEvent, onScene, onSaveNote }: DepositLabProps) {
  const { l, lang } = useLang();
  const [sample, setSample] = useState<SampleId>("epidermis");
  const [material, setMaterial] = useState<MaterialId | null>(null);
  const [solved, setSolved] = useState<Set<SampleId>>(new Set());

  const result = material ? evaluateDeposit(sample, material) : null;

  const paint = (m: MaterialId) => {
    setMaterial(m);
    onScene({ sample, material: m });
    const r = evaluateDeposit(sample, m);
    const next = new Set(solved);
    if (r.ok) next.add(sample);
    setSolved(next);
    const s = SAMPLES[sample];
    onEvent({
      taskId,
      block,
      ok: next.size === SAMPLE_IDS.length,
      action: {
        ar: `رسّب ${MATERIALS[m].name.ar} على «${s.name.ar}» ${r.ok ? "(صح)" : "(غلط)"}`,
        en: `Painted ${MATERIALS[m].name.en} on “${s.name.en}” ${r.ok ? "(right)" : "(wrong)"}`,
      },
      ...(r.ok
        ? {}
        : {
            mistakes: [
              {
                block,
                kind: "deposit" as const,
                picked: MATERIALS[m].name,
                correct: MATERIALS[s.correct].name,
                explain: {
                  ar: `${s.tissue.ar}: يترسب فيه ${MATERIALS[s.correct].name.ar} (${s.where.ar}). ${r.problems.map((p) => p.ar).join("؛ ")}.`,
                  en: `${s.tissue.en}: it is laid down with ${MATERIALS[s.correct].name.en} (${s.where.en}). ${r.problems.map((p) => p.en).join("; ")}.`,
                },
              },
            ],
          }),
    });
  };

  return (
    <div>
      <p className="text-sm font-semibold">{l(S.depositLab)}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {lang === "ar"
          ? "اختار النسيج، وبعدين «ادهنه» بمادة من الأربعة وشوف الماء والمرونة والصلابة وحياة الخلية."
          : "Pick a tissue, then paint it with one of the four materials and watch water, flexibility, rigidity and cell life."}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5" role="group">
        {SAMPLE_IDS.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={sample === id}
            onClick={() => {
              setSample(id);
              setMaterial(null);
              onScene({ sample: id, material: null });
            }}
            className={
              "rounded-full border px-3 py-1.5 text-xs font-semibold " +
              (sample === id
                ? "border-subject bg-subject/20"
                : "border-border bg-background/50 hover:bg-accent")
            }
          >
            {solved.has(id) ? "✅ " : ""}
            {l(SAMPLES[id].name)}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5" role="group">
        {MATERIAL_IDS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => paint(m)}
            aria-pressed={material === m}
            className={
              "rounded-xl border px-3 py-2 text-xs font-bold transition " +
              (material === m
                ? "border-subject bg-subject/25"
                : "border-subject/30 bg-subject/10 hover:bg-subject/20")
            }
          >
            🖌️ {l(MATERIALS[m].name)}
          </button>
        ))}
      </div>
      {result && material && (
        <div className="mt-3 space-y-2 rounded-xl border border-border bg-background/50 p-3">
          <Bar
            label={lang === "ar" ? "نفاذية الماء" : "Water permeability"}
            value={result.water}
            tone="bg-sky-500"
          />
          <Bar
            label={lang === "ar" ? "المرونة" : "Flexibility"}
            value={result.flex}
            tone="bg-emerald-500"
          />
          <Bar
            label={lang === "ar" ? "الصلابة" : "Rigidity"}
            value={result.stiff}
            tone="bg-amber-700"
          />
          <p className="text-sm">
            {result.alive
              ? lang === "ar"
                ? "🟢 الخلية تفضل حية"
                : "🟢 The cell stays alive"
              : lang === "ar"
                ? "⚫ الخلية تموت (غير حية)"
                : "⚫ The cell dies (non-living)"}
          </p>
          <p className={"text-sm font-bold " + (result.ok ? "text-bio" : "text-destructive")}>
            {l(result.verdict)}
          </p>
          {result.problems.length > 0 && (
            <ul className="list-disc space-y-1 ps-5 text-xs leading-relaxed">
              {result.problems.map((p, i) => (
                <li key={i}>{l(p)}</li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() =>
              onSaveNote(
                `${l(SAMPLES[sample].name)} + ${l(MATERIALS[material].name)}`,
                `${l(result.verdict)} — ${lang === "ar" ? "ماء" : "water"} ${result.water}%, ${lang === "ar" ? "مرونة" : "flex"} ${result.flex}%, ${lang === "ar" ? "صلابة" : "rigidity"} ${result.stiff}%`,
              )
            }
            className="rounded-full border border-subject/40 px-3 py-1.5 text-xs font-semibold text-subject hover:bg-subject/10"
          >
            {l(S.toNotebook)}
          </button>
        </div>
      )}
      <p className="mt-2 text-xs font-semibold text-muted-foreground">
        {solved.size}/{SAMPLE_IDS.length} ✅
      </p>
    </div>
  );
}
