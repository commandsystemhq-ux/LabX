import { useCallback, useEffect, useState } from "react";
import type { GuidedStep } from "@/data/simExtras";
import type { SimValues } from "@/data/simulations";

/**
 * Guided-discovery progress. A step is "latched" once its goal was reached, so moving the
 * slider away afterwards does not un-complete it.
 */
export function useGuided(steps: GuidedStep[], values: SimValues) {
  const [index, setIndex] = useState(0);
  const [latched, setLatched] = useState(false);

  const current = steps[index] ?? null;
  const reached = current ? current.done(values) : false;

  useEffect(() => {
    if (reached) setLatched(true);
  }, [reached, index]);

  const advance = useCallback(() => {
    setIndex((i) => Math.min(steps.length, i + 1));
    setLatched(false);
  }, [steps.length]);

  const restart = useCallback(() => {
    setIndex(0);
    setLatched(false);
  }, []);

  return {
    index,
    total: steps.length,
    current,
    done: latched || reached,
    finished: index >= steps.length,
    advance,
    restart,
  };
}

export type GuidedApi = ReturnType<typeof useGuided>;
