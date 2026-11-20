import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, PlayCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";
import { UnitCard } from "@/components/dashboard/UnitCard";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { WeeklyActivity } from "@/components/dashboard/WeeklyActivity";
import { SubjectIcon } from "@/components/common/SubjectIcon";
import { Button } from "@/components/ui/button";
import {
  curriculum,
  DEFAULT_GRADE,
  DEFAULT_SUBJECT,
  isGradeId,
  isSubjectId,
  student,
  subjectMastery,
  subjects,
  type GradeId,
  type SubjectId,
} from "@/data/mockCurriculum";
import { useLang } from "@/lib/i18n";
import { useMastery } from "@/lib/use-progress";

interface DashboardSearch {
  grade?: GradeId | undefined;
  subject?: SubjectId | undefined;
}

export const Route = createFileRoute("/dashboard")({
  validateSearch: (search: Record<string, unknown>): DashboardSearch => ({
    grade: isGradeId(search["grade"]) ? search["grade"] : undefined,
    subject: isSubjectId(search["subject"]) ? search["subject"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "لوحة المنهج — LabX" },
      {
        name: "description",
        content: "Your LabX curriculum dashboard: units, lessons, mastery, XP and daily streak.",
      },
      { property: "og:title", content: "Curriculum Dashboard — LabX" },
      {
        property: "og:description",
        content: "Track mastery across biology, physics and chemistry units.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const search = Route.useSearch();
  const grade = search["grade"] ?? DEFAULT_GRADE;
  const subjectId = search["subject"] ?? DEFAULT_SUBJECT;
  const navigate = useNavigate({ from: "/dashboard" });
  const { l, lang, dir } = useLang();
  const ar = lang === "ar";
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const units = curriculum[grade][subjectId];
  const subject = subjects.find((s) => s.id === subjectId) ?? subjects[1]!;
  const masteryOf = useMastery();
  const mastery = subjectMastery(units, masteryOf);
  const nextLesson =
    units.flatMap((u) => u.lessons).find((x) => masteryOf(x) > 0 && masteryOf(x) < 85) ??
    units[0]!.lessons[0]!;

  const setSearch = (patch: DashboardSearch) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true, resetScroll: false });

  return (
    <div className="min-h-screen">
      <Navbar grade={grade} />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
        <div className="mb-5 animate-fade-up">
          <p className="text-sm text-muted-foreground">{ar ? "أهلاً يا" : "Welcome back,"}</p>
          <h1 className="font-display text-3xl font-bold">
            {l(student.name)} <span className="inline-block animate-float">👋</span>
          </h1>
        </div>

        <DashboardTopBar grade={grade} onGrade={(g) => setSearch({ grade: g })} />

        {/* Subject tabs */}
        <div
          role="tablist"
          aria-label={ar ? "المواد" : "Subjects"}
          className="mt-6 grid grid-cols-3 gap-2 sm:gap-3"
        >
          {subjects.map((s) => {
            const active = s.id === subjectId;
            const m = subjectMastery(curriculum[grade][s.id], masteryOf);
            return (
              <button
                key={s.id}
                role="tab"
                type="button"
                aria-selected={active}
                data-subject={s.id}
                onClick={() => setSearch({ subject: s.id })}
                className={
                  "relative flex flex-col items-start gap-1 overflow-hidden rounded-2xl border p-3 text-start transition-all sm:flex-row sm:items-center sm:gap-3 sm:p-4 " +
                  (active
                    ? "border-subject/60 bg-subject/12 glow-subject"
                    : "glass hover:border-subject/30")
                }
              >
                <span className="text-2xl sm:text-3xl">{s.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span
                    className={
                      "block text-sm font-bold sm:text-base " + (active ? "text-subject" : "")
                    }
                  >
                    {l(s.name)}
                  </span>
                  <span className="block font-mono text-[11px] text-muted-foreground">{m}%</span>
                </span>
                {active && (
                  <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-subject" />
                )}
              </button>
            );
          })}
        </div>

        <div data-subject={subjectId} className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="flex flex-col gap-5" aria-live="polite">
            {units.map((u, i) => (
              <UnitCard key={u.id} unit={u} index={i} />
            ))}
          </section>

          <aside className="flex flex-col gap-5">
            <div className="glass relative overflow-hidden rounded-3xl p-5">
              <div className="absolute -top-20 size-48 rounded-full bg-subject/25 blur-3xl end-0" />
              <div className="relative flex items-center gap-4">
                <div className="relative">
                  <ProgressRing value={mastery} size={76} stroke={7} />
                  <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold">
                    {mastery}%
                  </span>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-bold">
                    <SubjectIcon subject={subjectId} className="size-4 text-subject" />
                    {l(subject.name)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {ar ? "متوسط الإتقان في المادة" : "Average subject mastery"}
                  </p>
                </div>
              </div>
              <div className="relative mt-5 rounded-2xl border border-subject/25 bg-background/50 p-4">
                <p className="text-[11px] font-semibold text-subject">
                  {ar ? "كمّل من مكان ما وقفت" : "Pick up where you left off"}
                </p>
                <p className="mt-1 font-bold">{l(nextLesson.title)}</p>
                <Button asChild variant="subject" className="mt-3 w-full rounded-full">
                  <Link to="/lesson" search={{ id: nextLesson.id }}>
                    <PlayCircle />
                    {ar ? "افتح المحاكاة" : "Open simulation"}
                    <Arrow />
                  </Link>
                </Button>
              </div>
            </div>
            <WeeklyActivity />
          </aside>
        </div>
      </main>
    </div>
  );
}
