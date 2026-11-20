import { CLOSE_PCT, type Comparison } from "@/data/quizCompare";
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
  const hasNegative = rows.some((r) => r.value < 0);
  const fmt = (n: number) => n.toFixed(cmp.digits);
  const close = cmp.gapPct !== null && cmp.gapPct <= CLOSE_PCT;
  const symbolLabel = `${cmp.symbol} · ${l(cmp.label)} (${cmp.unit})`;

  return (
    <div
      role="group"
      aria-label={`${t("compareTitle")}: ${symbolLabel}`}
      className="rounded-xl border border-border bg-background/50 p-3"
    >
      <p className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-muted-foreground">
        <span>{t("compareTitle")}</span>
        <span className="font-mono text-foreground" dir="ltr">
          {symbolLabel}
        </span>
      </p>

      <dl className="mb-2 grid gap-1 text-xs">
        {cmp.chosen && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-semibold text-destructive">{t("compareChosen")}:</dt>
            <dd>{l(cmp.chosen)}</dd>
          </div>
        )}
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-semibold text-bio">{t("compareCorrect")}:</dt>
          <dd>{l(cmp.correct)}</dd>
        </div>
      </dl>

      <ul className={"flex flex-col " + (compact ? "gap-1.5" : "gap-2")} dir="ltr">
        {rows.map((r) => {
          const width = Number.isFinite(r.value) ? Math.max(2, (Math.abs(r.value) / max) * 100) : 2;
          return (
            <li key={r.key} className="grid grid-cols-[84px_1fr_64px] items-center gap-2 text-xs">
              <span className="truncate text-muted-foreground" title={r.label}>
                {r.label}
              </span>
              <span
                role="img"
                aria-label={`${r.label}: ${fmt(r.value)} ${cmp.unit}`}
                className="h-2 overflow-hidden rounded-full bg-muted"
              >
                <span
                  className={"block h-full rounded-full transition-[width] duration-700 " + r.tone}
                  style={{ width: `${width}%` }}
                />
              </span>
              <span className="text-end font-mono font-bold tabular-nums">{fmt(r.value)}</span>
            </li>
          );
        })}
      </ul>

      {cmp.claimed === null && (
        <p className="mt-2 text-[11px] text-muted-foreground">{t("compareNoClaim")}</p>
      )}
      {cmp.gap !== null && (
        <p className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span>
            {t("compareOff")}:{" "}
            <span className="font-mono font-bold text-foreground" dir="ltr">
              {fmt(Math.abs(cmp.gap))} {cmp.unit}
              {cmp.gapPct !== null && ` (${cmp.gapPct.toFixed(0)}%)`}
            </span>
          </span>
          {close && (
            <span className="rounded-full bg-warning/20 px-2 py-0.5 font-semibold text-warning">
              {t("compareClose")}
            </span>
          )}
        </p>
      )}
      {hasNegative && (
        <p className="mt-1 text-[11px] text-muted-foreground">{t("compareNegative")}</p>
      )}
    </div>
  );
}
