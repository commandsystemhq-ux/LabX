import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProgressRepository, ProgressState } from "./progress";

const SAVE_DELAY_MS = 800;

export interface RemoteProgressRepository extends ProgressRepository {
  /** Fetch the account's saved state. Throws on network / permission errors. */
  hydrate(): Promise<void>;
  /** Write any pending change now. Resolves false if the write failed. */
  flush(): Promise<boolean>;
  /** Flush and release timers / listeners. */
  dispose(): void;
}

/**
 * `ProgressRepository` backed by one `user_progress` row per account (RLS: owner only).
 * Reads are served from memory after `hydrate()`; writes are debounced upserts so rapid
 * slider/step changes don't spam the API. Everything read here is still sanitised by the store.
 */
export function createSupabaseRepository(
  client: SupabaseClient,
  userId: string,
  onSaveError: (error: unknown) => void = () => {},
): RemoteProgressRepository {
  let cache: unknown = null;
  let pending: ProgressState | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  const flush = async () => {
    if (timer) clearTimeout(timer);
    timer = null;
    if (!pending) return true;
    const state = pending;
    pending = null;
    const { error } = await client
      .from("user_progress")
      .upsert({ user_id: userId, state, updated_at: new Date().toISOString() });
    if (error) {
      // Keep the change so the next save (or flush) retries it.
      pending ??= state;
      onSaveError(error);
      return false;
    }
    return true;
  };

  const onHide = () => {
    if (document.visibilityState === "hidden") void flush();
  };
  const onPageHide = () => void flush();
  if (typeof window !== "undefined") {
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
  }

  return {
    async hydrate() {
      const { data, error } = await client
        .from("user_progress")
        .select("state")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      cache = (data as { state?: unknown } | null)?.state ?? null;
    },
    load: () => cache,
    save(state) {
      if (disposed) return;
      cache = state;
      pending = state;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void flush(), SAVE_DELAY_MS);
    },
    subscribe: () => () => {},
    flush,
    dispose() {
      if (disposed) return;
      void flush();
      disposed = true;
      if (typeof window !== "undefined") {
        document.removeEventListener("visibilitychange", onHide);
        window.removeEventListener("pagehide", onPageHide);
      }
    },
  };
}
