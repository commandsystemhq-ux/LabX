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

/** Resolver returning the learner's stored mastery for a lesson (0 until they finish its quiz). */
export function useMastery() {
  const progress = useProgress();
  return useCallback(
    (lesson: Pick<Lesson, "id">) => effectiveMastery(progress, lesson),
    [progress],
  );
}

export function useStudentStats() {
  return studentStats(useProgress());
}
