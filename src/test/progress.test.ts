import { describe, expect, it } from "vitest";
import {
  createLocalRepository,
  createProgressStore,
  dayKey,
  EMPTY_PROGRESS,
  effectiveMastery,
  nextStreak,
  sanitizeProgress,
  studentStats,
  withQuizResult,
  withStep,
  type ProgressRepository,
  type ProgressState,
} from "@/lib/progress";

const LESSON = "g12-physics-u1-l2";
const known = (id: string) => id === LESSON || id === "g12-physics-u1-l1";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const storage = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
    key: (i: number) => [...data.keys()][i] ?? null,
    get length() {
      return data.size;
    },
  } as Storage;
  return { storage, data };
}

describe("sanitizeProgress (untrusted storage)", () => {
  it("rejects garbage, wrong versions and non-objects", () => {
    for (const bad of [null, undefined, 5, "x", [], { v: 2 }, { v: "1" }]) {
      expect(sanitizeProgress(bad, known)).toBe(EMPTY_PROGRESS);
    }
  });

  it("drops unknown lessons and clamps every number", () => {
    const state = sanitizeProgress(
      {
        v: 1,
        xp: 9e99,
        streak: { count: -4, lastDay: "2026-11-20" },
        lessons: {
          [LESSON]: { step: 99, bestScore: 50, total: 3, attempts: -1, updatedAt: "now" },
          "hacked-lesson": { step: 4, bestScore: 1, total: 1 },
          __proto__: { step: 1 },
        },
      },
      known,
    );
    expect(Object.keys(state.lessons)).toEqual([LESSON]);
    expect(state.lessons[LESSON]).toMatchObject({
      step: 4,
      bestScore: 3,
      total: 3,
      attempts: 0,
      mastery: 100,
    });
    expect(state.xp).toBe(1_000_000);
    expect(state.streak).toEqual({ count: 1, lastDay: "2026-11-20" });
  });

  it("ignores malformed streaks and never lets scores exceed the total", () => {
    const state = sanitizeProgress(
      {
        v: 1,
        xp: 10,
        streak: { count: 3, lastDay: "tomorrow" },
        lessons: { [LESSON]: { bestScore: 5, total: 2 } },
      },
      known,
    );
    expect(state.streak).toBeNull();
    expect(state.lessons[LESSON]?.bestScore).toBe(2);
  });

  it("does not pollute prototypes", () => {
    const raw = JSON.parse('{"v":1,"lessons":{"__proto__":{"polluted":true}}}') as unknown;
    sanitizeProgress(raw, () => true);
    expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
  });
});

describe("progress transitions", () => {
  it("saves the highest reached step only", () => {
    let s = withStep(EMPTY_PROGRESS, LESSON, 3, 1);
    s = withStep(s, LESSON, 2, 2);
    expect(s.lessons[LESSON]?.step).toBe(3);
    expect(withStep(s, LESSON, 2, 3)).toBe(s);
  });

  it("awards XP only for improving the best score (no farming)", () => {
    const a = withQuizResult(EMPTY_PROGRESS, LESSON, 2, 3, 1, "2026-11-20");
    expect(a.xpGained).toBe(50);
    const b = withQuizResult(a.state, LESSON, 2, 3, 2, "2026-11-20");
    expect(b.xpGained).toBe(0);
    const c = withQuizResult(b.state, LESSON, 3, 3, 3, "2026-11-20");
    expect(c.xpGained).toBe(25);
    expect(c.state.lessons[LESSON]).toMatchObject({
      bestScore: 3,
      mastery: 100,
      attempts: 3,
      step: 4,
    });
    const worse = withQuizResult(c.state, LESSON, 0, 3, 4, "2026-11-20");
    expect(worse.xpGained).toBe(0);
    expect(worse.state.lessons[LESSON]?.bestScore).toBe(3);
  });

  it("clamps bogus scores", () => {
    const r = withQuizResult(EMPTY_PROGRESS, LESSON, 99, 3, 1, "2026-11-20");
    expect(r.state.lessons[LESSON]?.bestScore).toBe(3);
    expect(withQuizResult(EMPTY_PROGRESS, LESSON, -5, 3, 1, "2026-11-20").xpGained).toBe(0);
  });

  it("streak: baseline on first activity, +1 on consecutive days, reset after a gap", () => {
    const first = nextStreak(null, "2026-11-20");
    expect(first.count).toBeGreaterThanOrEqual(1);
    expect(nextStreak(first, "2026-11-20")).toBe(first);
    expect(nextStreak(first, "2026-11-21").count).toBe(first.count + 1);
    expect(nextStreak(first, "2026-11-25").count).toBe(1);
    // month boundary
    expect(nextStreak({ count: 4, lastDay: "2026-11-30" }, "2026-12-01").count).toBe(5);
  });

  it("dayKey uses the local calendar day", () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("stored mastery never lowers seeded mastery", () => {
    const state: ProgressState = {
      ...EMPTY_PROGRESS,
      lessons: {
        [LESSON]: { step: 4, bestScore: 1, total: 4, attempts: 1, mastery: 25, updatedAt: 0 },
      },
    };
    expect(effectiveMastery(state, { id: LESSON, mastery: 48 })).toBe(48);
    expect(effectiveMastery(state, { id: LESSON, mastery: 10 })).toBe(25);
    expect(studentStats({ ...state, xp: 500 }).level).toBeGreaterThan(studentStats(state).level);
  });
});

describe("local repository + store", () => {
  it("survives corrupt JSON and a throwing storage", () => {
    const key = "labx.progress.v1.guest";
    const { storage } = memoryStorage({ [key]: "{not json" });
    expect(createLocalRepository("guest", () => storage).load()).toBeNull();
    const throwing = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("quota");
      },
    } as unknown as Storage;
    const repo = createLocalRepository("guest", () => throwing);
    expect(repo.load()).toBeNull();
    expect(() => repo.save(EMPTY_PROGRESS)).not.toThrow();
    expect(createLocalRepository("guest", () => null).load()).toBeNull();
  });

  it("scopes storage per user and sanitises the user id", () => {
    const { storage, data } = memoryStorage();
    createLocalRepository("alice", () => storage).save(EMPTY_PROGRESS);
    createLocalRepository("../../evil key", () => storage).save(EMPTY_PROGRESS);
    expect([...data.keys()].sort()).toEqual(["labx.progress.v1.alice", "labx.progress.v1.evilkey"]);
  });

  it("persists, notifies subscribers and serves a stable snapshot", () => {
    const { storage } = memoryStorage();
    let tick = 0;
    const store = createProgressStore(
      createLocalRepository("t", () => storage),
      {
        isKnownLesson: known,
        now: () => ++tick,
        today: () => "2026-11-20",
      },
    );
    let calls = 0;
    const off = store.subscribe(() => calls++);
    const before = store.getSnapshot();
    expect(store.getSnapshot()).toBe(before);

    store.recordStep(LESSON, 3);
    expect(calls).toBe(1);
    expect(store.getSnapshot()).not.toBe(before);

    const { xpGained } = store.recordQuiz(LESSON, 3, 3);
    expect(xpGained).toBe(75);
    expect(store.recordQuiz("unknown-lesson", 3, 3).xpGained).toBe(0);

    // a fresh store (new tab / reload) reads the saved state
    const reloaded = createProgressStore(
      createLocalRepository("t", () => storage),
      { isKnownLesson: known },
    );
    expect(reloaded.getSnapshot().lessons[LESSON]?.mastery).toBe(100);
    off();
  });

  it("re-reads when another tab changes storage and uses an empty server snapshot", () => {
    let stored: unknown = null;
    let notify: () => void = () => {};
    const repo: ProgressRepository = {
      load: () => stored,
      save: (s) => void (stored = s),
      subscribe: (cb) => {
        notify = cb;
        return () => void (notify = () => {});
      },
    };
    const store = createProgressStore(repo, { isKnownLesson: known });
    let calls = 0;
    const off = store.subscribe(() => calls++);
    expect(store.getSnapshot().xp).toBe(0);
    stored = { v: 1, xp: 125, streak: null, lessons: {} };
    notify();
    expect(calls).toBe(1);
    expect(store.getSnapshot().xp).toBe(125);
    expect(store.getServerSnapshot()).toBe(EMPTY_PROGRESS);
    off();
  });
});
