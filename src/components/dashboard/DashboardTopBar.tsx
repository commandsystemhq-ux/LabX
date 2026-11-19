import { Flame, Sparkles, Trophy } from "lucide-react";
import { grades, student, type GradeId } from "@/data/mockCurriculum";
import { useLang } from "@/lib/i18n";

export function DashboardTopBar({
  grade,
  onGrade,
}: {
  grade: GradeId;
  onGrade: (g: GradeId) => void;
}) {
  const { l, t, lang } = useLang();
  return (
    <div className="glass flex flex-col gap-4 rounded-3xl p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
      <div
        role="tablist"
        aria-label={t("grade")}
        className="flex gap-1 overflow-x-auto rounded-2xl bg-background/60 p-1 scrollbar-none"
      >
        {grades.map((g) => {
          const active = g.id === grade;
          return (
            <button
              key={g.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onGrade(g.id)}
              className={
                "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all " +
                (active
                  ? "bg-foreground text-background shadow"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {l(g.name)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-2 rounded-2xl border border-phys/30 bg-phys/10 px-3.5 py-2">
          <Sparkles className="size-4 text-phys" />
          <span className="font-mono text-base font-bold text-phys">
            {student.xp.toLocaleString("en-US")}
          </span>
          <span className="text-xs text-muted-foreground">{t("xp")}</span>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-warning/30 bg-warning/10 px-3.5 py-2">
          <Flame className="size-4 animate-blink text-warning" />
          <span className="font-mono text-base font-bold text-warning">{student.streak}</span>
          <span className="text-xs text-muted-foreground">{t("streak")}</span>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-chem/30 bg-chem/10 px-3.5 py-2">
          <Trophy className="size-4 text-chem" />
          <span className="text-xs text-muted-foreground">
            {lang === "ar" ? "المستوى" : "Level"}
          </span>
          <span className="font-mono text-base font-bold text-chem">{student.level}</span>
        </div>
      </div>
    </div>
  );
}
