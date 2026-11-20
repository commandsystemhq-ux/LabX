import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False during SSR and the hydration pass, true afterwards. Use it for output that depends on
 * engine-specific floating point (Math.sin/cos differ in the last digits between Node and
 * Chrome), which would otherwise cause hydration mismatches.
 */
export function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
