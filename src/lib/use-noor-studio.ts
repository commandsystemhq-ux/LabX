import { useCallback, useSyncExternalStore } from "react";
import {
  EMPTY_STUDIO,
  loadStudioState,
  saveStudioState,
  studioKey,
  type NoorStudioState,
} from "@/data/lessons/noorStudio";
import { useAuth } from "./auth";

/**
 * Client store of Noor Studio creations. One slot per account (`userId` or "guest"); the chat, the
 * Mind Map Lab and the Flashcards Lab all read the same slot, so a pack Noor makes shows up
 * everywhere at once. Persisted to localStorage and sanitised on every read.
 */

interface Slot {
  state: NoorStudioState;
  loaded: boolean;
  listeners: Set<() => void>;
}

const slots = new Map<string, Slot>();
const idOf = (userId: string | null) => userId || "guest";

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function slot(userId: string | null): Slot {
  const id = idOf(userId);
  let s = slots.get(id);
  if (!s) {
    s = { state: EMPTY_STUDIO, loaded: false, listeners: new Set() };
    slots.set(id, s);
  }
  if (!s.loaded && typeof window !== "undefined") {
    s.state = loadStudioState(userId, storage());
    s.loaded = true;
  }
  return s;
}

function emit(s: Slot) {
  for (const l of [...s.listeners]) l();
}

export const studioStore = {
  get(userId: string | null): NoorStudioState {
    return slot(userId).state;
  },
  subscribe(userId: string | null, listener: () => void): () => void {
    const s = slot(userId);
    s.listeners.add(listener);
    // Another tab of the same account saved something.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== studioKey(userId)) return;
      s.state = loadStudioState(userId, storage());
      emit(s);
    };
    if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
    return () => {
      s.listeners.delete(listener);
      if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
    };
  },
  /** Applies `fn`, persists and notifies. Returns false when the browser refused to store it. */
  mutate(userId: string | null, fn: (s: NoorStudioState) => NoorStudioState): boolean {
    const s = slot(userId);
    const next = fn(s.state);
    if (next === s.state) return true;
    s.state = next;
    const saved = saveStudioState(userId, storage(), next);
    emit(s);
    return saved;
  },
  /** Test helper. */
  reset() {
    slots.clear();
  },
};

export function useNoorStudio() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const state = useSyncExternalStore(
    useCallback((l: () => void) => studioStore.subscribe(userId, l), [userId]),
    () => studioStore.get(userId),
    () => EMPTY_STUDIO,
  );
  const mutate = useCallback(
    (fn: (s: NoorStudioState) => NoorStudioState) => studioStore.mutate(userId, fn),
    [userId],
  );
  return { userId, state, mutate };
}
