import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { LessonWorkspace } from "@/components/lesson/LessonWorkspace";
import { findLesson } from "@/data/mockCurriculum";

interface LessonSearch {
  id?: string | undefined;
}

export const Route = createFileRoute("/lesson")({
  validateSearch: (search: Record<string, unknown>): LessonSearch => ({
    id: typeof search["id"] === "string" ? search["id"] : undefined,
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
  const { id } = Route.useSearch();
  const lookup = findLesson(id);
  return (
    <div data-subject={lookup.subject.id} className="min-h-screen">
      <Navbar grade={lookup.grade.id} />
      <main className="mx-auto max-w-[1500px] px-3 pb-24 pt-4 sm:px-5">
        <LessonWorkspace key={lookup.lesson.id} lookup={lookup} />
      </main>
    </div>
  );
}
