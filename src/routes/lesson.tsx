import { createFileRoute } from "@tanstack/react-router";
import { AccountNotice } from "@/components/layout/AccountNotice";
import { Navbar } from "@/components/layout/Navbar";
import { SupportBoard } from "@/components/lesson/board/SupportBoard";
import { LessonWorkspace } from "@/components/lesson/LessonWorkspace";
import { findLesson } from "@/data/mockCurriculum";

interface LessonSearch {
  id?: string | undefined;
  /** Duel seed / challenger result of the live-board lesson (validated by the board). */
  duel?: string | undefined;
  vs?: string | undefined;
}

export const Route = createFileRoute("/lesson")({
  validateSearch: (search: Record<string, unknown>): LessonSearch => ({
    id: typeof search["id"] === "string" ? search["id"] : undefined,
    duel: typeof search["duel"] === "string" ? search["duel"] : undefined,
    vs: typeof search["vs"] === "string" ? search["vs"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "مساحة الدرس التفاعلية — LabX" },
      {
        name: "description",
        content:
          "Interactive lesson workspace: live simulation, variable sliders, real-time graph, AI tutor and visual quiz.",
      },
      { property: "og:title", content: "Interactive Lesson & Simulation — LabX" },
      {
        property: "og:description",
        content: "Drag the variables, watch the simulation react, and ask the AI tutor why.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LessonPage,
});

function LessonPage() {
  const { id, duel, vs } = Route.useSearch();
  const lookup = findLesson(id);
  return (
    <div data-subject={lookup.subject.id} className="min-h-screen">
      <Navbar grade={lookup.grade.id} />
      <main className="mx-auto max-w-375 px-3 pb-24 pt-4 sm:px-5">
        <div className="mb-3 empty:hidden">
          <AccountNotice />
        </div>
        {lookup.lesson.board === "support" ? (
          <SupportBoard key={lookup.lesson.id} lookup={lookup} duel={duel} vs={vs} />
        ) : (
          <LessonWorkspace key={lookup.lesson.id} lookup={lookup} />
        )}
      </main>
    </div>
  );
}
