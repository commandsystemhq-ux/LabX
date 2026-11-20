import { useFrame } from "@react-three/fiber";
import { useEffect, type RefObject } from "react";
import { advance, cardiac, type Live } from "./adr3d-model";

/** Shared heartbeat: updated once per frame (before everything else), read by every organ. */
export interface Beat {
  clock: { t: number; acc: number };
  phase: number;
  c: ReturnType<typeof cardiac>;
}
export const newBeat = (): Beat => ({ clock: { t: 0, acc: 0 }, phase: 0, c: cardiac(0) });

/** Disposes a three.js resource (geometry / material / texture) created outside of JSX when it is replaced. */
export function useDispose(resource: { dispose: () => void } | null | undefined) {
  useEffect(
    () => () => {
      resource?.dispose();
    },
    [resource],
  );
}

/** Advances the heartbeat from the live bpm and the stage clock (so pause / speed apply). */
export function BeatDriver({ live, beat }: { live: RefObject<Live>; beat: RefObject<Beat> }) {
  useFrame(() => {
    const l = live.current;
    const b = beat.current;
    b.phase = advance(b.clock, l.t, l.drive.p.hr / 60);
    b.c = cardiac(b.phase);
  }, -2);
  return null;
}
