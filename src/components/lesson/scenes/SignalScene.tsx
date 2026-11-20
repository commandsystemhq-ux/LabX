import { AdrenalineStage } from "./AdrenalineStage";
import type { SceneProps } from "./sceneUtils";

/** Molecular view of the adrenaline journey: sarcomere, synapse and receptor in 3D. */
export function SignalScene(props: SceneProps) {
  return <AdrenalineStage {...props} mode="molecular" />;
}
