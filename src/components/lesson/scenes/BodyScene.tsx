import { AdrenalineStage } from "./AdrenalineStage";
import type { SceneProps } from "./sceneUtils";

/** Macro view of the adrenaline journey: the whole body in 3D, with stations to fly into. */
export function BodyScene(props: SceneProps) {
  return <AdrenalineStage {...props} mode="macro" />;
}
