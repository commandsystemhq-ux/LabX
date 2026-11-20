import { lessonExists, student, type Lesson } from "@/data/mockCurriculum";

/**
 * Learner progress: a small validated state plus a repository seam.
 *
 * Today the repository is `localStorage` keyed by user id ("guest" until real accounts exist).
 * An account-backed implementation (REST / DB) only needs to satisfy `ProgressRepository`.
 * Anything read from storage is untrusted and passes through `sanitizeProgress`.
 */

export const PROGRESS_VERSION = 1;
export const XP_PER_CORRECT_ANSWER = 25;

const MAX_LESSONS = 500;
const MAX_XP = 1_000_000;
const XP_PER_LEVEL = 250;

export interface LessonProgress {
  /** Highest lesson step reached (1–4). */
  step: number;
  bestScore: number;
  total: number;
  attempts: number;
  /** 0–100, derived from the best quiz result. */
  mastery: number;
  updatedAt: number;
}

export interface StreakState {
  count: number;
  /** Local calendar day, YYYY-MM-DD. */
  lastDay: string;
}

export interface ProgressState {
  v: typeof PROGRESS_VERSION;
  /** XP earned on top of the mock baseline. */
  xp: number;
  streak: StreakState | null;
  lessons: Record<string, LessonProgress>;
}

export interface ProgressRepository {
  load(): unknown;
  save(state: ProgressState): void;
  /** Notify when another tab / device changed the stored state. Returns an unsubscribe. */
  subscribe(onExternalChange: () => void): () => void;
}

export const EMPTY_PROGRESS: ProgressState = Object.freeze({
  v: PROGRESS_VERSION,
  xp: 0,
  streak: null,
  lessons: Object.freeze({}) as Record<string, LessonProgress>,
});

const clampInt = (n: unknown, lo: number, hi: number, fallback: number) => {
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, Math.round(n)));
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Validate untrusted data into a well-formed state. Never throws. */
export function sanitizeProgress(
  raw: unknown,
  isKnownLesson: (id: string) => boolean = lessonExists,
): ProgressState {
  if (!isRecord(raw) || raw["v"] !== PROGRESS_VERSION) return EMPTY_PROGRESS;

  const lessons: Record<string, LessonProgress> = {};
  const rawLessons = raw["lessons"];
  if (isRecord(rawLessons)) {
    for (const [id, value] of Object.entries(rawLessons).slice(0, MAX_LESSONS)) {
      if (id === "__proto__" || !isRecord(value) || !isKnownLesson(id)) continue;
      const total = clampInt(value["total"], 0, 20, 0);
      const bestScore = clampInt(value["bestScore"], 0, total, 0);
      lessons[id] = {
        step: clampInt(value["step"], 1, 4, 1),
        bestScore,
        total,
        attempts: clampInt(value["attempts"], 0, 1000, 0),
        mastery: total > 0 ? Math.round((100 * bestScore) / total) : 0,
        updatedAt: clampInt(value["updatedAt"], 0, Number.MAX_SAFE_INTEGER, 0),
      };
    }
  }

  const rawStreak = raw["streak"];
  const streak =
    isRecord(rawStreak) &&
    typeof rawStreak["lastDay"] === "string" &&
    DAY_RE.test(rawStreak["lastDay"])
      ? { count: clampInt(rawStreak["count"], 1, 10_000, 1), lastDay: rawStreak["lastDay"] }
      : null;

  return {
    v: PROGRESS_VERSION,
    xp: clampInt(raw["xp"], 0, MAX_XP, 0),
    streak,
    lessons,
  };
}

/* ------------------------------ pure transitions ------------------------------ */

export function dayKey(date: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

function previousDay(key: string) {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  return dayKey(new Date(y, m - 1, d - 1));
}

/** Keeps the mock baseline streak on first activity, then +1 per consecutive day. */
export function nextStreak(streak: StreakState | null, today: string): StreakState {
  if (!streak) return { count: student.streak, lastDay: today };
  if (streak.lastDay === today) return streak;
  return {
    count: streak.lastDay === previousDay(today) ? streak.count + 1 : 1,
    lastDay: today,
  };
}

function touch(state: ProgressState, lessonId: string, now: number): LessonProgress {
  return (
    state.lessons[lessonId] ?? {
      step: 1,
      bestScore: 0,
      total: 0,
      attempts: 0,
      mastery: 0,
      updatedAt: now,
    }
  );
}

export function withStep(state: ProgressState, lessonId: string, step: number, now: number) {
  const lesson = touch(state, lessonId, now);
  const next = clampInt(step, 1, 4, 1);
  if (next <= lesson.step && state.lessons[lessonId]) return state;
  return {
    ...state,
    lessons: {
      ...state.lessons,
      [lessonId]: { ...lesson, step: Math.max(lesson.step, next), updatedAt: now },
    },
  };
}

/** XP is only awarded for improving on the previous best score (no farming). */
export function withQuizResult(
  state: ProgressState,
  lessonId: string,
  score: number,
  total: number,
  now: number,
  today: string,
) {
  const safeTotal = clampInt(total, 1, 20, 1);
  const safeScore = clampInt(score, 0, safeTotal, 0);
  const lesson = touch(state, lessonId, now);
  const improved =
    lesson.total === safeTotal ? Math.max(0, safeScore - lesson.bestScore) : safeScore;
  const keepBest = lesson.total === safeTotal && lesson.bestScore >= safeScore;
  const bestScore = keepBest ? lesson.bestScore : safeScore;
  const xpGained = improved * XP_PER_CORRECT_ANSWER;
  const next: ProgressState = {
    ...state,
    xp: Math.min(MAX_XP, state.xp + xpGained),
    streak: nextStreak(state.streak, today),
    lessons: {
      ...state.lessons,
      [lessonId]: {
        ...lesson,
        step: 4,
        total: safeTotal,
        bestScore,
        attempts: Math.min(1000, lesson.attempts + 1),
        mastery: Math.round((100 * bestScore) / safeTotal),
        updatedAt: now,
      },
    },
  };
  return { state: next, xpGained };
}

/* ---------------------------------- queries ---------------------------------- */

/** Stored mastery never lowers the seeded (mock) mastery. */
export function effectiveMastery(state: ProgressState, lesson: Pick<Lesson, "id" | "mastery">) {
  return Math.max(lesson.mastery, state.lessons[lesson.id]?.mastery ?? 0);
}

export function studentStats(state: ProgressState) {
  return {
    xp: student.xp + state.xp,
    streak: state.streak?.count ?? student.streak,
    level: student.level + Math.floor(state.xp / XP_PER_LEVEL),
  };
}

/* ------------------------------- local repository ------------------------------ */

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function createLocalRepository(
  userId = "guest",
  getStorage: () => Storage | null = browserStorage,
): ProgressRepository {
  const safeId = userId.replace(/[^a-z0-9_-]/gi, "").slice(0, 40) || "guest";
  const key = `labx.progress.v${PROGRESS_VERSION}.${safeId}`;
  return {
    load() {
      try {
        const text = getStorage()?.getItem(key);
        return text ? (JSON.parse(text) as unknown) : null;
      } catch {
        return null;
      }
    },
    save(state) {
      try {
        getStorage()?.setItem(key, JSON.stringify(state));
      } catch {
        /* quota exceeded / private mode: progress stays in memory for this session */
      }
    },
    subscribe(onChange) {
      if (typeof window === "undefined") return () => {};
      const handler = (e: StorageEvent) => {
        if (e.key === key || e.key === null) onChange();
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    },
  };
}

/* ----------------------------------- store ------------------------------------ */

export interface ProgressStoreOptions {
  now?: () => number;
  today?: () => string;
  isKnownLesson?: (id: string) => boolean;
}

export function createProgressStore(repo: ProgressRepository, options: ProgressStoreOptions = {}) {
  const now = options.now ?? Date.now;
  const today = options.today ?? (() => dayKey(new Date()));
  const isKnown = options.isKnownLesson ?? lessonExists;
  const listeners = new Set<() => void>();
  let cache: ProgressState | null = null;
  let detach: (() => void) | null = null;

  const read = () => sanitizeProgress(repo.load(), isKnown);
  const emit = () => listeners.forEach((l) => l());
  const commit = (next: ProgressState) => {
    if (next === cache) return;
    cache = next;
    repo.save(next);
    emit();
  };

  return {
    getSnapshot: () => (cache ??= read()),
    getServerSnapshot: () => EMPTY_PROGRESS,
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (!detach) {
        detach = repo.subscribe(() => {
          cache = read();
          emit();
        });
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && detach) {
          detach();
          detach = null;
        }
      };
    },
    recordStep(lessonId: string, step: number) {
      if (!isKnown(lessonId)) return;
      commit(withStep((cache ??= read()), lessonId, step, now()));
    },
    recordQuiz(lessonId: string, score: number, total: number) {
      if (!isKnown(lessonId)) return { xpGained: 0 };
      const result = withQuizResult((cache ??= read()), lessonId, score, total, now(), today());
      commit(result.state);
      return { xpGained: result.xpGained };
    },
    reset() {
      commit({ ...EMPTY_PROGRESS, lessons: {} });
    },
  };
}

export type ProgressStore = ReturnType<typeof createProgressStore>;

export const progressStore: ProgressStore = createProgressStore(createLocalRepository("guest"));
