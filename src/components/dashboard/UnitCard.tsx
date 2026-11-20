import { Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, PlayCircle, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { unitMastery, type Lesson, type Unit } from "@/data/mockCurriculum";
import { useLang } from "@/lib/i18n";
import { useMastery } from "@/lib/use-progress";

function status(mastery: number) {
  if (mastery >= 85) return "mastered" as const;
  if (mastery > 0) return "inProgress" as const;
  return "notStarted" as const;
}

function LessonRow({ lesson, index, mastery }: { lesson: Lesson; index: number; mastery: number }) {
  const { l, t } = useLang();
  const s = status(mastery);
  const ActionIcon = s === "mastered" ? RotateCcw : PlayCircle;
  const action = s === "mastered" ? t("review") : s === "inProgress" ? t("continue") : t("launch");

  return (
    <li className="group flex flex-col gap-3 rounded-2xl border border-transparent p-3 transition-colors hover:border-border hover:bg-background/40 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={
            "flex size-9 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold " +
            (s === "mastered" ? "bg-subject text-primary-foreground" : "bg-subject/12 text-subject")
          }
        >
          {s === "mastered" ? <CheckCircle2 className="size-4" /> : index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{l(lesson.title)}</p>
          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3" /> {lesson.minutes} {t("minutes")}
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="size-3" /> +{lesson.xp} XP
            </span>
            <span
              className={
                "rounded-full px-2 py-0.5 text-[10px] font-bold " +
                (s === "mastered"
                  ? "bg-bio/15 text-bio"
                  : s === "inProgress"
                    ? "bg-warning/15 text-warning"
                    : "bg-muted text-muted-foreground")
              }
            >
              {t(s)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:w-64">
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
            <span>{t("mastery")}</span>
            <span className="font-mono font-bold text-foreground">{mastery}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-subject transition-[width] duration-700"
              style={{ width: `${mastery}%` }}
            />
          </div>
        </div>
        <Button
          asChild
          size="sm"
          variant={s === "inProgress" ? "subject" : "subject-soft"}
          className="rounded-full"
        >
          <Link to="/lesson" search={{ id: lesson.id }}>
            <ActionIcon />
            {action}
          </Link>
        </Button>
      </div>
    </li>
  );
}

export function UnitCard({ unit, index }: { unit: Unit; index: number }) {
  const { l, lang, t } = useLang();
  const masteryOf = useMastery();
  const avg = unitMastery(unit, masteryOf);
  return (
    <article
      className="glass animate-fade-up rounded-3xl p-4 sm:p-5"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <header className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-subject">
            {lang === "ar" ? `الوحدة ${index + 1}` : `Unit ${index + 1}`}
          </p>
          <h3 className="mt-0.5 text-lg font-bold">{l(unit.title)}</h3>
        </div>
        <div className="text-end">
          <p className="font-mono text-xl font-bold">{avg}%</p>
          <p className="text-[11px] text-muted-foreground">
            {unit.lessons.length} {t("lessons")}
          </p>
        </div>
      </header>
      <ul className="flex flex-col gap-1">
        {unit.lessons.map((lesson, i) => (
          <LessonRow key={lesson.id} lesson={lesson} index={i} mastery={masteryOf(lesson)} />
        ))}
      </ul>
    </article>
  );
}
