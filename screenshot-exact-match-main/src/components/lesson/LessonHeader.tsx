import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  MonitorPlay,
  Presentation,
  Target,
} from "lucide-react";
import type { LessonLookup } from "@/data/mockCurriculum";
import { useLang, type UiKey } from "@/lib/i18n";

const STEPS: { key: UiKey; icon: typeof BookOpen }[] = [
  { key: "steps1", icon: BookOpen },
  { key: "steps2", icon: MonitorPlay },
  { key: "steps3", icon: FlaskConical },
  { key: "steps4", icon: Target },
];

interface Props {
  lookup: LessonLookup;
  step: number;
  maxStep: number;
  onStep: (s: number) => void;
  onBoard: () => void;
}

export function LessonHeader({ lookup, step, maxStep, onStep, onBoard }: Props) {
  const { t, l, dir } = useLang();
  const Sep = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <header className="glass rounded-3xl p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
          >
            <Link
              to="/dashboard"
              search={{ grade: lookup.grade.id }}
              className="hover:text-foreground"
            >
              {t("dashboard")}
            </Link>
            <Sep className="size-3" />
            <Link
              to="/dashboard"
              search={{ grade: lookup.grade.id, subject: lookup.subject.id }}
              className="hover:text-foreground"
            >
              {lookup.subject.emoji} {l(lookup.subject.name)}
            </Link>
            <Sep className="size-3" />
            <span className="truncate">{l(lookup.unit.title)}</span>
          </nav>
          <h1 className="mt-1.5 flex flex-wrap items-center gap-2 text-xl font-bold sm:text-2xl">
            {l(lookup.lesson.title)}
            <span className="rounded-full border border-subject/30 bg-subject/10 px-2.5 py-0.5 text-[11px] font-semibold text-subject">
              {l(lookup.grade.short)}
            </span>
          </h1>
        </div>

        <button
          type="button"
          onClick={onBoard}
          className="glass flex shrink-0 items-center justify-center gap-2 self-start rounded-full px-4 py-2 text-sm font-semibold transition hover:border-subject/50 hover:text-subject lg:self-auto"
        >
          <Presentation className="size-4" />
          {t("boardMode")}
        </button>
      </div>

      <ol className="mt-4 flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none sm:gap-2">
        {STEPS.map((s, i) => {
          const n = i + 1;
          const active = n === step;
          const complete = n < step || n <= maxStep - 1;
          const Icon = s.icon;
          return (
            <li key={s.key} className="flex flex-1 items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => onStep(n)}
                aria-current={active ? "step" : undefined}
                className={
                  "group flex w-full min-w-max items-center gap-2 rounded-2xl border px-2.5 py-2 text-start transition-all sm:px-3 " +
                  (active
                    ? "border-subject/60 bg-subject/15 glow-subject"
                    : "border-border bg-background/40 hover:border-subject/40")
                }
              >
                <span
                  className={
                    "flex size-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold " +
                    (active
                      ? "bg-subject text-primary-foreground"
                      : complete
                        ? "bg-subject/20 text-subject"
                        : "bg-muted text-muted-foreground")
                  }
                >
                  {complete && !active ? <Check className="size-3.5" /> : n}
                </span>
                <span className="flex flex-col">
                  <span
                    className={"text-xs font-bold sm:text-sm " + (active ? "text-subject" : "")}
                  >
                    {t(s.key)}
                  </span>
                </span>
                <Icon
                  className={
                    "ms-auto hidden size-4 md:block " +
                    (active ? "text-subject" : "text-muted-foreground")
                  }
                />
              </button>
              {i < STEPS.length - 1 && (
                <span
                  className={
                    "hidden h-0.5 w-4 shrink-0 rounded-full sm:block " +
                    (n < step ? "bg-subject" : "bg-border")
                  }
                />
              )}
            </li>
          );
        })}
      </ol>
    </header>
  );
}
