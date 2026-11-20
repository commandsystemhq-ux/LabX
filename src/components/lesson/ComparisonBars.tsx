import type { Comparison } from "@/data/quizCompare";
import { useLang } from "@/lib/i18n";

/** Before / what the wrong answer implies / what the simulation really shows. */
export function ComparisonBars({ cmp, compact = false }: { cmp: Comparison; compact?: boolean }) {
  const { l, t } = useLang();
  const rows: { key: string; label: string; value: number; tone: string }[] = [
    { key: "before", label: t("before"), value: cmp.before, tone: "bg-muted-foreground/60" },
  ];
  if (cmp.claimed !== null) {
    rows.push({ key: "claim", label: t("yourClaim"), value: cmp.claimed, tone: "bg-destructive" });
  }
  rows.push({ key: "actual", label: t("actual"), value: cmp.actual, tone: "bg-bio" });

  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1e-9);

  return (
    <div className="rounded-xl border border-border bg-background/50 p-3" dir="ltr">
      <p className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-muted-foreground">
        <span>{t("compareTitle")}</span>
        <span className="font-mono text-foreground">
          {cmp.symbol} · {l(cmp.label)} ({cmp.unit})
        </span>
      </p>
      <ul className={"flex flex-col " + (compact ? "gap-1.5" : "gap-2")}>
        {rows.map((r) => (
          <li key={r.key} className="grid grid-cols-[84px_1fr_64px] items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">{r.label}</span>
            <span className="h-2 overflow-hidden rounded-full bg-muted">
              <span
                className={"block h-full rounded-full transition-[width] duration-700 " + r.tone}
                style={{ width: `${Math.max(2, (Math.abs(r.value) / max) * 100)}%` }}
              />
            </span>
            <span className="text-end font-mono font-bold tabular-nums">
              {r.value.toFixed(cmp.digits)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
