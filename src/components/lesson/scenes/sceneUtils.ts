import { useEffect, useRef, useState } from "react";
import type { SimValues } from "@/data/simulations";

export interface SceneProps {
  /** Scaled simulation time in seconds. */
  t: number;
  values: SimValues;
  /** 0–1 intensity of the process (current, reaction rate, diffusion rate). */
  activity: number;
  labels: boolean;
  flow: boolean;
}

/** Deterministic pseudo-random in [0, 1). */
export function rand(i: number, seed = 1) {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Triangle wave 0→1→0 with period 2 — used for stateless bouncing. */
export function tri(x: number) {
  const m = ((x % 2) + 2) % 2;
  return m < 1 ? m : 2 - m;
}

export const frac = (x: number) => x - Math.floor(x);

/** rAF-driven clock. Returns scaled time; resets to 0 when resetKey changes. */
export function useSimClock(playing: boolean, speed: number, resetKey: number) {
  const [t, setT] = useState(0);

  useEffect(() => {
    setT(0);
  }, [resetKey]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setT((p) => p + dt * speed);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);

  return t;
}

/**
 * Integrates a variable rate over clock time so that changing the rate
 * (e.g. dragging a slider) never makes particles jump.
 */
export function useIntegrated(t: number, rate: number) {
  const ref = useRef({ lastT: t, acc: 0 });
  const r = ref.current;
  const dt = t - r.lastT;
  if (dt < 0) r.acc = 0;
  else if (dt < 1) r.acc += dt * rate;
  r.lastT = t;
  return r.acc;
}
