import { useEffect, useRef, useState } from "react";
import { pickGroup } from "@/data/lessons/supportLab";
import type { MatchTask, NumericTask, PickTask } from "@/data/lessons/supportTypes";
import { useLang, type L10n } from "@/lib/i18n";
import type { TaskEvent } from "./DrawingLab";
import { S } from "./strings";

const groupName = (id: string): L10n => pickGroup(id)?.name ?? { ar: id, en: id };

/** A pick from the 3D scene (or a marker) that answers the open pick task. */
export interface IncomingPick {
  group: string;
  seq: number;
}

export function PickTaskView({
  task,
  block,
  incoming,
  onEvent,
}: {
  task: PickTask;
  block: number;
  incoming: IncomingPick | null;
  onEvent: (e: TaskEvent) => void;
}) {
  const { l } = useLang();
  const [chosen, setChosen] = useState<string | null>(null);
  const seen = useRef(0);

  const answer = (id: string) => {
    if (chosen) return;
    setChosen(id);
    const ok = id === task.answer;
    onEvent({
      taskId: task.id,
      block,
      ok,
      action: {
        ar: `اختار «${groupName(id).ar}» في: ${task.prompt.ar}`,
        en: `Picked “${groupName(id).en}” for: ${task.prompt.en}`,
      },
      ...(ok
        ? {}
        : {
            mistakes: [
              {
                block,
                kind: "pick" as const,
                picked: groupName(id),
                correct: groupName(task.answer),
                explain: task.wrongWhy?.[id] ?? task.why,
              },
            ],
          }),
    });
  };

  useEffect(() => {
    if (!incoming || incoming.seq === seen.current) return;
    seen.current = incoming.seq;
    if (task.options.includes(incoming.group)) answer(incoming.group);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- answers once per incoming pick
  }, [incoming]);

  const ok = chosen === task.answer;
  return (
    <div>
      <p className="text-sm font-semibold">{l(task.prompt)}</p>
      <p className="mt-1 text-xs text-muted-foreground">{l(S.tapPart)}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {task.options.map((o) => (
          <button
            key={o}
            type="button"
            disabled={chosen !== null}
            onClick={() => answer(o)}
            className={
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition " +
              (chosen === o
                ? ok
                  ? "border-bio bg-bio/20"
                  : "border-destructive bg-destructive/20"
                : chosen !== null && o === task.answer
                  ? "border-bio bg-bio/10"
                  : "border-subject/40 bg-subject/10 hover:bg-subject/20 disabled:opacity-60")
            }
          >
            {l(groupName(o))}
          </button>
        ))}
      </div>
      {chosen && (
        <div
          role="status"
          className={
            "mt-2 rounded-xl border p-3 text-sm leading-relaxed " +
            (ok ? "border-bio/40 bg-bio/10" : "border-warning/40 bg-warning/10")
          }
        >
          <p className="font-bold">{l(ok ? S.correct : S.wrong)}</p>
          <p className="mt-1">{l(ok ? task.why : (task.wrongWhy?.[chosen] ?? task.why))}</p>
          {!ok && (
            <button
              type="button"
              onClick={() => setChosen(null)}
              className="mt-2 rounded-full border border-border px-3 py-1 text-xs font-semibold hover:bg-accent"
            >
              {l(S.retry)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function NumericTaskView({
  task,
  block,
  onEvent,
}: {
  task: NumericTask;
  block: number;
  onEvent: (e: TaskEvent) => void;
}) {
  const { l } = useLang();
  const [value, setValue] = useState("");
  const [result, setResult] = useState<boolean | null>(null);

  const check = () => {
    const n = Number(value.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))));
    if (!value.trim() || !Number.isFinite(n)) return;
    const ok = n === task.answer;
    setResult(ok);
    onEvent({
      taskId: task.id,
      block,
      ok,
      action: { ar: `كتب ${n} في: ${task.prompt.ar}`, en: `Entered ${n} for: ${task.prompt.en}` },
      ...(ok
        ? {}
        : {
            mistakes: [
              {
                block,
                kind: "numeric" as const,
                picked: { ar: String(n), en: String(n) },
                correct: { ar: String(task.answer), en: String(task.answer) },
                explain: task.why,
              },
            ],
          }),
    });
  };

  return (
    <div>
      <p className="text-sm font-semibold">{l(task.prompt)}</p>
      <form
        className="mt-2 flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          check();
        }}
      >
        <input
          inputMode="numeric"
          value={value}
          maxLength={6}
          onChange={(e) => {
            setValue(e.target.value);
            setResult(null);
          }}
          aria-label={l(S.yourNumber)}
          placeholder={l(S.yourNumber)}
          className="h-10 w-28 rounded-xl border border-input bg-background/60 px-3 text-center font-mono text-sm outline-none focus:border-subject"
        />
        {task.unit && <span className="text-sm text-muted-foreground">{l(task.unit)}</span>}
        <button
          type="submit"
          disabled={!value.trim()}
          className="rounded-full bg-subject px-4 py-2 text-sm font-bold text-primary-foreground hover:brightness-110 disabled:opacity-40"
        >
          {l(S.check)}
        </button>
      </form>
      {result !== null && (
        <div
          role="status"
          className={
            "mt-2 rounded-xl border p-3 text-sm leading-relaxed " +
            (result ? "border-bio/40 bg-bio/10" : "border-warning/40 bg-warning/10")
          }
        >
          <p className="font-bold">{l(result ? S.correct : S.wrong)}</p>
          <p className="mt-1">{l(task.why)}</p>
        </div>
      )}
    </div>
  );
}

export function MatchTaskView({
  task,
  block,
  onEvent,
}: {
  task: MatchTask;
  block: number;
  onEvent: (e: TaskEvent) => void;
}) {
  const { l } = useLang();
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  const check = () => {
    setChecked(true);
    const wrong = task.items.filter((it) => picked[it.id] !== it.answer);
    const label = (id: string | undefined): L10n =>
      task.options.find((o) => o.id === id)?.label ?? { ar: "—", en: "—" };
    onEvent({
      taskId: task.id,
      block,
      ok: wrong.length === 0,
      action: {
        ar: `وصّل ${task.items.length - wrong.length} من ${task.items.length} في «${task.title.ar}»`,
        en: `Matched ${task.items.length - wrong.length} of ${task.items.length} in “${task.title.en}”`,
      },
      mistakes: wrong.map((it) => ({
        block,
        kind: "match" as const,
        picked: label(picked[it.id]),
        correct: label(it.answer),
        explain: {
          ar: `«${it.prompt.ar}» ← «${label(it.answer).ar}». ${task.why.ar}`,
          en: `“${it.prompt.en}” → “${label(it.answer).en}”. ${task.why.en}`,
        },
      })),
    });
  };

  return (
    <div>
      <p className="text-sm font-semibold">{l(task.title)}</p>
      <ul className="mt-2 space-y-2">
        {task.items.map((it) => {
          const right = checked && picked[it.id] === it.answer;
          const bad = checked && picked[it.id] !== it.answer;
          return (
            <li
              key={it.id}
              className={
                "flex flex-wrap items-center gap-2 rounded-xl border p-2 text-sm " +
                (right
                  ? "border-bio/50 bg-bio/10"
                  : bad
                    ? "border-destructive/50 bg-destructive/10"
                    : "border-border")
              }
            >
              <span className="min-w-0 flex-1">{l(it.prompt)}</span>
              <select
                value={picked[it.id] ?? ""}
                onChange={(e) => {
                  setPicked((p) => ({ ...p, [it.id]: e.target.value }));
                  setChecked(false);
                }}
                aria-label={l(it.prompt)}
                className="h-9 max-w-[55%] rounded-lg border border-input bg-background px-2 text-xs"
              >
                <option value="">—</option>
                {task.options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {l(o.label)}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={check}
        disabled={Object.keys(picked).length === 0}
        className="mt-2 rounded-full bg-subject px-4 py-2 text-sm font-bold text-primary-foreground hover:brightness-110 disabled:opacity-40"
      >
        {l(S.check)}
      </button>
      {checked && (
        <p className="mt-2 text-sm leading-relaxed" role="status">
          {task.items.every((it) => picked[it.id] === it.answer)
            ? `${l(S.correct)} ${l(task.why)}`
            : l(S.retry)}
        </p>
      )}
    </div>
  );
}
