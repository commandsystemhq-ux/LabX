import { useCallback, useEffect, useState } from "react";

export const IDLE_MS = 60_000;
export const SNOOZE_MS = 3 * 60_000;

interface Options {
  /** False pauses everything (free lab, tutor open, board mode, finished quiz...). */
  enabled: boolean;
  /**
   * Any new object here means "the student just did something" (changed a value, a step, a mode...).
   * Pass a memoised object whose dependencies are the interactions that should reset the timer.
   */
  activity: object;
  idleMs?: number;
  snoozeMs?: number;
}

/**
 * Shows a hint once the student has been idle for `idleMs`. Any activity hides it and restarts the
 * timer; "snooze" re-arms it after `snoozeMs`; "dismiss" silences it for the rest of this lesson.
 * The timer stops while the tab is hidden, and it is cleaned up on unmount.
 */
export function useIdleHint({
  enabled,
  activity,
  idleMs = IDLE_MS,
  snoozeMs = SNOOZE_MS,
}: Options) {
  const [visible, setVisible] = useState(false);
  const [snoozedUntil, setSnoozedUntil] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setVisible(false);
    if (!enabled || dismissed) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    };
    const arm = () => {
      stop();
      const wait = Math.max(idleMs, snoozedUntil - Date.now());
      timer = setTimeout(() => setVisible(true), wait);
    };
    const onVisibility = () => (document.visibilityState === "hidden" ? stop() : arm());

    if (document.visibilityState !== "hidden") arm();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, dismissed, activity, snoozedUntil, idleMs]);

  const snooze = useCallback(() => {
    setVisible(false);
    setSnoozedUntil(Date.now() + snoozeMs);
  }, [snoozeMs]);

  const dismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
  }, []);

  return { visible: visible && enabled && !dismissed, snooze, dismiss };
}
