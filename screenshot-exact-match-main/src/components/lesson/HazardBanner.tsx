import { AlertOctagon, TriangleAlert } from "lucide-react";
import type { Hazard } from "@/data/simExtras";
import { useLang } from "@/lib/i18n";

/**
 * Real-world consequence of the current scene, rendered inside the stage so it never shifts
 * the layout while a slider is being dragged. Announced to assistive tech via role="alert".
 */
export function HazardBanner({ hazards }: { hazards: Hazard[] }) {
  const { l, t } = useLang();
  const [top, ...rest] = hazards;
  if (!top) return null;

  const critical = top.level === 2;
  const Icon = critical ? AlertOctagon : TriangleAlert;

  return (
    <div
      role="alert"
      className={
        "animate-fade-up rounded-2xl border bg-background/92 p-2.5 backdrop-blur-md sm:p-3 " +
        (critical ? "border-destructive/70" : "border-warning/60")
      }
    >
      <div className="flex items-start gap-2.5">
        <span
          className={
            "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg " +
            (critical ? "bg-destructive text-destructive-foreground" : "bg-warning/25 text-warning")
          }
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1 text-xs leading-relaxed">
          <p className={"text-sm font-bold " + (critical ? "text-destructive" : "text-warning")}>
            {critical ? t("critical") : t("warning")} — {l(top.title)}
            {rest.length > 0 && (
              <span className="ms-2 rounded-full border border-border px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                +{rest.length}
              </span>
            )}
          </p>
          <p className="mt-0.5 hidden text-muted-foreground sm:block">
            <span className="font-semibold">{t("cause")}:</span> {l(top.cause)}
          </p>
          <p className="mt-0.5">
            <span className="font-semibold">{t("consequence")}:</span> {l(top.consequence)}
          </p>
          <p className="mt-0.5 hidden text-bio sm:block">
            <span className="font-semibold">{t("fix")}:</span> {l(top.fix)}
          </p>
        </div>
      </div>
    </div>
  );
}
