import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Focus mode for one element. Uses the Fullscreen API when the browser allows it (the element then
 * fills the screen and nothing else is drawn); otherwise (iOS Safari, blocked by policy) it falls
 * back to a `fixed inset-0` overlay that Esc also closes.
 */
export function useFullscreen<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [native, setNative] = useState(false);
  const [overlay, setOverlay] = useState(false);

  useEffect(() => {
    const onChange = () => setNative(document.fullscreenElement === ref.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (!overlay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOverlay(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // `backdrop-filter` ancestors (.glass) would trap a fixed child; styles.css lifts them meanwhile.
    document.documentElement.setAttribute("data-fs-overlay", "");
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.removeAttribute("data-fs-overlay");
      window.removeEventListener("keydown", onKey);
    };
  }, [overlay]);

  // Leaving the page (or unmounting the element) must not leave the browser in fullscreen.
  useEffect(
    () => () => {
      if (document.fullscreenElement && document.fullscreenElement === ref.current) {
        void document.exitFullscreen().catch(() => {});
      }
    },
    [],
  );

  const toggle = useCallback(async () => {
    const el = ref.current;
    if (!el) return;
    if (document.fullscreenElement === el) {
      await document.exitFullscreen().catch(() => {});
      return;
    }
    if (overlay) {
      setOverlay(false);
      return;
    }
    if (document.fullscreenEnabled && typeof el.requestFullscreen === "function") {
      try {
        await el.requestFullscreen();
        return;
      } catch {
        /* denied: use the overlay below */
      }
    }
    setOverlay(true);
  }, [overlay]);

  const active = native || overlay;
  /** Classes for the element itself while in focus mode (it needs its own opaque background). */
  const frame = overlay
    ? "fixed inset-0 z-50 overflow-auto bg-background! p-3 sm:p-5"
    : native
      ? "overflow-auto bg-background! p-3 sm:p-5"
      : "";
  return { ref, active, frame, toggle };
}
