/**
 * Local memory of the live-board lesson: which blocks and self-tests the student finished and the
 * first answer given to each block's hook question. Untrusted on load, rebuilt field by field.
 */

export const PROGRESS_KEY = "labx.support.v1";
export const BLOCKS = 14;
export const TESTS = 6;

export interface SupportProgress {
  v: 1;
  /** Finished block numbers (1–14). */
  blocks: number[];
  /** Finished self-test numbers (1–6). */
  tests: number[];
  /** Block → index of the option chosen on the hook question. */
  hooks: Record<string, number>;
}

export const EMPTY_PROGRESS: SupportProgress = { v: 1, blocks: [], tests: [], hooks: {} };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const ints = (v: unknown, max: number) =>
  Array.isArray(v)
    ? [...new Set(v.filter((x): x is number => Number.isInteger(x) && x >= 1 && x <= max))].sort(
        (a, b) => a - b,
      )
    : [];

export function sanitizeSupportProgress(raw: unknown): SupportProgress {
  if (!isRecord(raw) || raw["v"] !== 1) return EMPTY_PROGRESS;
  const hooks: Record<string, number> = {};
  if (isRecord(raw["hooks"])) {
    for (const [k, v] of Object.entries(raw["hooks"])) {
      const n = Number(k);
      if (
        Number.isInteger(n) &&
        n >= 1 &&
        n <= BLOCKS &&
        Number.isInteger(v) &&
        (v as number) >= 0 &&
        (v as number) < 8
      ) {
        hooks[String(n)] = v as number;
      }
    }
  }
  return { v: 1, blocks: ints(raw["blocks"], BLOCKS), tests: ints(raw["tests"], TESTS), hooks };
}

/** Units finished out of 20 (14 blocks + 6 tests), as recorded in the shared progress store. */
export function unitsDone(p: SupportProgress): number {
  return p.blocks.length + p.tests.length;
}

export function withBlock(p: SupportProgress, n: number): SupportProgress {
  return p.blocks.includes(n) ? p : { ...p, blocks: ints([...p.blocks, n], BLOCKS) };
}

export function withTest(p: SupportProgress, n: number): SupportProgress {
  return p.tests.includes(n) ? p : { ...p, tests: ints([...p.tests, n], TESTS) };
}

export function withHook(p: SupportProgress, n: number, choice: number): SupportProgress {
  return { ...p, hooks: { ...p.hooks, [String(n)]: choice } };
}

export function loadSupportProgress(storage: Pick<Storage, "getItem"> | null): SupportProgress {
  try {
    const text = storage?.getItem(PROGRESS_KEY);
    return text ? sanitizeSupportProgress(JSON.parse(text) as unknown) : EMPTY_PROGRESS;
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveSupportProgress(storage: Pick<Storage, "setItem"> | null, p: SupportProgress) {
  try {
    storage?.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    /* quota / private mode */
  }
}
