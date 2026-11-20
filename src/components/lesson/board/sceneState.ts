import type { MaterialId, SampleId } from "@/data/lessons/supportLab";

/**
 * Everything the board and its labs tell the 3D / 2D scene to show. Plain data, written by the
 * board and read by the scene; the canvases never write back except through `onPick`.
 */
export interface SceneState {
  /** Pick-group ids that glow (exam-trap probes, task feedback). */
  highlight: string[];
  /** When set, tapping any of these groups answers the current pick task. */
  pickable: string[] | null;
  /** Vertebra 1–33 highlighted by the reverse graph lab. */
  vertebra: number | null;
  /** Age 0–80 drives the skull joints' fibrous → bony colour. */
  skullAge: number | null;
  /** Radius turn in degrees (0–180). */
  radiusDeg: number;
  pelvis: "male" | "female" | null;
  achillesTorn: boolean;
  jointKind: "fibrous" | "cartilaginous" | "synovial" | null;
  /** The stem section paints this sample with this material (deposit lab). */
  deposit: { sample: SampleId; material: MaterialId | null } | null;
}

export const EMPTY_SCENE: SceneState = {
  highlight: [],
  pickable: null,
  vertebra: null,
  skullAge: null,
  radiusDeg: 0,
  pelvis: null,
  achillesTorn: false,
  jointKind: null,
  deposit: null,
};

export type StageMode = "3d" | "2d";
