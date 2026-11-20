import { useCallback, useSyncExternalStore } from "react";
import type { Lesson } from "@/data/mockCurriculum";
import { effectiveMastery, progressStore, studentStats, type ProgressState } from "./progress";

/** Live progress snapshot. Server render and first hydration use the empty baseline. */
export function useProgress(): ProgressState {
  return useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot,
    progressStore.getServerSnapshot,
  );
}

/** Resolver that merges seeded (mock) mastery with the learner's stored results. */
export function useMastery() {
  const progress = useProgress();
  return useCallback(
    (lesson: Pick<Lesson, "id" | "mastery">) => effectiveMastery(progress, lesson),
    [progress],
  );
}

export function useStudentStats() {
  return studentStats(useProgress());
}
