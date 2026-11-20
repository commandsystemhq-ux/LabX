import type { ComponentType } from "react";
import type { SimulationId } from "@/data/mockCurriculum";
import { BeakerScene } from "./BeakerScene";
import { CellScene } from "./CellScene";
import { CircuitScene } from "./CircuitScene";
import { LatticeScene } from "./LatticeScene";
import { MembraneScene } from "./MembraneScene";
import { ParticleBoxScene } from "./ParticleBoxScene";
import type { SceneProps } from "./sceneUtils";

export type StageView = "macro" | "molecular";

/** Placeholder 2D scenes per simulation and view. Swap for Three.js scenes later. */
export const scenes: Record<SimulationId, Record<StageView, ComponentType<SceneProps>>> = {
  ohm: { macro: CircuitScene, molecular: LatticeScene },
  "reaction-rate": { macro: BeakerScene, molecular: ParticleBoxScene },
  diffusion: { macro: CellScene, molecular: MembraneScene },
};
