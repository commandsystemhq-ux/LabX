import { useEffect, useRef, useState } from "react";
import type { ExamTrapDef } from "@/data/lessons/supportTypes";
import { useLang } from "@/lib/i18n";
import { S } from "./strings";

const SECONDS = 15;

interface Props {
  trap: ExamTrapDef;
  /** Pick-group ids to glow in the scene while a probe runs. */
  onHighlight: (groups: string[]) => void;
  /** Reports the probe the student ran (for Noor and the notebook). */
  onProbe: (probeId: string) => void;
}

/**
 * «⚠️ مصيدة الامتحان»: the famous wrong belief, 2–4 tap-experiments that must fit in 15 seconds,
 * and then the textbook truth. The countdown only paces the student; nothing is lost at 0.
 */
export function ExamTrap({ trap, onHighlight, onProbe }: Props) {
  const { l } = useLang();
  const [left, setLeft] = useState(SECONDS);
  const [ran, setRan] = useState<string[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) return;
    if (left <= 0) return;
    const id = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [left, ran.length]);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      onHighlight([]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup only on unmount
    [],
  );

  const run = (id: string) => {
    started.current = true;
    const probe = trap.probes.find((p) => p.id === id);
    if (!probe) return;
    window.clearTimeout(timer.current);
    setRunning(id);
    onHighlight(probe.highlight ?? []);
    onProbe(id);
    timer.current = window.setTimeout(() => {
      setRan((r) => (r.includes(id) ? r : [...r, id]));
      setRunning(null);
    }, 450);
  };

  const done = ran.length === trap.probes.length || left <= 0;

  return (
    <div className="rounded-2xl border border-warning/50 bg-warning/10 p-4">
      <p className="text-sm font-bold text-warning">⚠️ {l(S.trapButton)}</p>
      <p className="mt-2 text-sm leading-relaxed">
        <span className="font-semibold">{l(S.trapClaim)}: </span>
        {l(trap.claim)}
      </p>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={SECONDS}
        aria-valuenow={left}
        aria-label={l(S.trapSeconds)}
      >
        <div
          className="h-full rounded-full bg-warning transition-all duration-1000 ease-linear"
          style={{ width: `${(left / SECONDS) * 100}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {l(S.trapSeconds)} · {left}s
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {trap.probes.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => run(p.id)}
            aria-pressed={ran.includes(p.id)}
            className={
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition " +
              (ran.includes(p.id)
                ? "border-warning bg-warning/20"
                : "border-border bg-background/60 hover:border-warning")
            }
          >
            {l(S.trapRun)}: {l(p.label)}
          </button>
        ))}
      </div>
      <ul className="mt-3 space-y-2" aria-live="polite">
        {trap.probes
          .filter((p) => ran.includes(p.id) || running === p.id)
          .map((p) => (
            <li
              key={p.id}
              className={
                "rounded-xl border p-2.5 text-sm leading-relaxed " +
                (running === p.id
                  ? "animate-pulse border-border"
                  : p.verdict === "bad"
                    ? "border-destructive/50 bg-destructive/10"
                    : p.verdict === "ok"
                      ? "border-bio/50 bg-bio/10"
                      : "border-border bg-background/50")
              }
            >
              {running === p.id
                ? "…"
                : `${p.verdict === "bad" ? "❌ " : p.verdict === "ok" ? "✅ " : "ℹ️ "}${l(p.result)}`}
            </li>
          ))}
      </ul>
      {done && (
        <div className="mt-3 rounded-xl border border-bio/50 bg-bio/10 p-3 text-sm leading-relaxed">
          <p className="font-bold text-bio">{l(S.trapTruth)}</p>
          <p className="mt-1">{l(trap.truth)}</p>
        </div>
      )}
    </div>
  );
}
