import { groupNodes, PICK_GROUPS } from "@/data/lessons/supportLab";
import type { Focus3D } from "@/data/lessons/supportTypes";

/**
 * Which real BodyParts3D meshes each human scene shows solid, ghosted or hides, how they are
 * tinted, and which parts the camera frames. Pure (node names in, node names out) so it can be
 * tested against the actual GLB files.
 */

export type HumanFocus = Exclude<Focus3D, "cell-plant" | "cell-animal" | "tissues" | "stem">;
export type Dir = "front" | "back" | "side" | "top" | "bottom";

export type PlantFocus = "cell-plant" | "cell-animal" | "tissues" | "stem";
export const isPlantFocus = (f: string): f is PlantFocus =>
  f === "cell-plant" || f === "cell-animal" || f === "tissues" || f === "stem";

export const isHumanFocus = (f: Focus3D): f is HumanFocus =>
  f !== "cell-plant" && f !== "cell-animal" && f !== "tissues" && f !== "stem";

export interface FocusPlan {
  solid: Set<string>;
  ghost: Set<string>;
  tint: Map<string, string>;
  /** Skeleton nodes the camera frames. */
  frame: string[];
  /** Muscle-file nodes shown (the Achilles scene). */
  muscles: Set<string>;
  muscleTint: Map<string, string>;
  dirs: Dir[];
  /** Distance multiplier: bigger = further away. */
  pad: number;
}

export interface PlanInput {
  skeleton: readonly string[];
  muscles: readonly string[];
  jointKind: "fibrous" | "cartilaginous" | "synovial" | null;
}

const CREAM = "#f3e6c4";
const AMBER = "#fbbf24";
const BLUE = "#93c5fd";
const INDIGO = "#a5b4fc";
const GREEN = "#86efac";
const RED = "#fca5a5";

const AXIAL = [
  "cranial-bones",
  "facial-bones",
  "hyoid",
  "cervical-vertebrae",
  "thoracic-vertebrae",
  "lumbar-vertebrae",
  "sacrum",
  "true-ribs",
  "floating-ribs",
  "sternum",
  "costal-cartilages",
  "discs",
];
const SPINE = ["cervical-vertebrae", "thoracic-vertebrae", "lumbar-vertebrae", "sacrum", "discs"];
const LIMB_BONES = [
  "clavicle",
  "scapula",
  "humerus",
  "radius",
  "ulna",
  "carpals",
  "metacarpals",
  "hand-phalanges",
  "hip-bone",
  "femur",
  "patella",
  "tibia",
  "fibula",
  "tarsals",
  "metatarsals",
  "foot-phalanges",
];
const ARM = [
  "clavicle",
  "scapula",
  "humerus",
  "radius",
  "ulna",
  "carpals",
  "metacarpals",
  "hand-phalanges",
];
const LEG = ["femur", "patella", "tibia", "fibula", "tarsals", "metatarsals", "foot-phalanges"];

const isRight = (n: string) => !n.startsWith("left-");

/** Splits a node list by group lists, optionally keeping only the body's right side. */
function nodesOf(groups: readonly string[], names: readonly string[], rightOnly = false) {
  const out = new Set<string>();
  for (const g of groups) {
    for (const n of groupNodes(g, names)) if (!rightOnly || isRight(n)) out.add(n);
  }
  return out;
}

export function planFocus(focus: HumanFocus, input: PlanInput): FocusPlan {
  const { skeleton, muscles } = input;
  const all = new Set(skeleton);
  const tint = new Map<string, string>();
  const paint = (groups: readonly string[], color: string, rightOnly = false) => {
    for (const n of nodesOf(groups, skeleton, rightOnly)) tint.set(n, color);
  };
  const plan = (p: Partial<FocusPlan>): FocusPlan => ({
    solid: new Set(),
    ghost: new Set(),
    tint,
    frame: [],
    muscles: new Set(),
    muscleTint: new Map(),
    dirs: ["front", "back", "side"],
    pad: 1.15,
    ...p,
  });

  switch (focus) {
    case "full": {
      paint(AXIAL, CREAM);
      paint(LIMB_BONES, BLUE);
      return plan({ solid: all, frame: [...all], dirs: ["front", "back", "side"], pad: 1.05 });
    }
    case "spine": {
      paint(["cervical-vertebrae"], AMBER);
      paint(["thoracic-vertebrae"], CREAM);
      paint(["lumbar-vertebrae"], GREEN);
      paint(["sacrum"], BLUE);
      paint(["discs"], INDIGO);
      const solid = nodesOf(SPINE, skeleton);
      const ghost = nodesOf(
        ["cranial-bones", "facial-bones", "true-ribs", "floating-ribs", "sternum", "hip-bone"],
        skeleton,
      );
      return plan({ solid, ghost, frame: [...solid], dirs: ["side", "front", "back"], pad: 1.1 });
    }
    case "vertebra": {
      const solid = nodesOf(["lumbar-l3"], skeleton);
      paint(["lumbar-l3"], CREAM);
      return plan({ solid, frame: [...solid], dirs: ["top", "side", "front"], pad: 1.7 });
    }
    case "skull": {
      paint(["cranial-bones"], CREAM);
      paint(["facial-bones"], AMBER);
      const solid = nodesOf(["cranial-bones", "facial-bones"], skeleton);
      return plan({ solid, frame: [...solid], dirs: ["front", "side", "bottom"], pad: 1.25 });
    }
    case "thorax": {
      paint(["floating-ribs"], RED);
      paint(["costal-cartilages"], BLUE);
      const solid = nodesOf(
        ["true-ribs", "floating-ribs", "sternum", "costal-cartilages", "thoracic-vertebrae"],
        skeleton,
      );
      const ghost = nodesOf(["clavicle", "scapula", "lumbar-vertebrae"], skeleton);
      return plan({ solid, ghost, frame: [...solid], dirs: ["front", "side", "back"], pad: 1.15 });
    }
    case "pectoral": {
      paint(["radius"], AMBER, true);
      paint(["ulna"], GREEN, true);
      const solid = nodesOf(ARM, skeleton, true);
      const ghost = nodesOf(["sternum", "true-ribs", "thoracic-vertebrae"], skeleton);
      return plan({ solid, ghost, frame: [...solid], dirs: ["front", "back", "side"], pad: 1.1 });
    }
    case "pelvic": {
      paint(["hip-bone"], AMBER);
      paint(["sacrum"], BLUE);
      const solid = nodesOf(["hip-bone", "sacrum", ...LEG], skeleton);
      const ghost = nodesOf(["lumbar-vertebrae"], skeleton);
      const frame = [...nodesOf(["hip-bone", "sacrum"], skeleton)];
      return plan({ solid, ghost, frame, dirs: ["front", "top", "back", "side"], pad: 1.5 });
    }
    case "cartilage": {
      paint(["costal-cartilages"], BLUE);
      paint(["discs"], INDIGO);
      const solid = nodesOf(["costal-cartilages", "discs"], skeleton);
      const ghost = nodesOf(
        [
          "true-ribs",
          "floating-ribs",
          "sternum",
          "thoracic-vertebrae",
          "lumbar-vertebrae",
          "cervical-vertebrae",
        ],
        skeleton,
      );
      return plan({ solid, ghost, frame: [...ghost, ...solid], dirs: ["front", "side"], pad: 1.1 });
    }
    case "joints": {
      const skull = nodesOf(["cranial-bones", "facial-bones"], skeleton);
      const discs = nodesOf(["discs"], skeleton);
      const synovial = nodesOf(
        ["scapula", "humerus", "radius", "ulna", "hip-bone", "femur", "tibia", "patella"],
        skeleton,
      );
      for (const n of skull) tint.set(n, CREAM);
      for (const n of discs) tint.set(n, INDIGO);
      for (const n of synovial) tint.set(n, AMBER);
      const kind = input.jointKind;
      const solid = new Set<string>();
      const focusSet =
        kind === "fibrous"
          ? skull
          : kind === "cartilaginous"
            ? discs
            : kind === "synovial"
              ? synovial
              : null;
      if (focusSet) for (const n of focusSet) solid.add(n);
      else for (const n of all) solid.add(n);
      const ghost = new Set([...all].filter((n) => !solid.has(n)));
      const frame = kind === "fibrous" ? [...skull] : [...all];
      return plan({
        solid,
        ghost,
        frame,
        dirs: ["front", "back", "side"],
        pad: kind === "fibrous" ? 1.3 : 1.05,
      });
    }
    case "knee": {
      paint(["femur", "tibia", "fibula", "patella"], CREAM, true);
      const solid = nodesOf(["femur", "tibia", "fibula", "patella"], skeleton, true);
      return plan({ solid, frame: [...solid], dirs: ["front", "side", "back"], pad: 1.1 });
    }
    case "achilles": {
      paint(["tibia", "fibula", "tarsals", "metatarsals", "foot-phalanges"], CREAM, true);
      const solid = nodesOf(
        ["tibia", "fibula", "tarsals", "metatarsals", "foot-phalanges"],
        skeleton,
        true,
      );
      const m = nodesOf(
        ["gastrocnemius", "soleus", "calcaneal-tendon"].filter((g) => g in PICK_GROUPS),
        muscles,
      );
      const muscleTint = new Map<string, string>();
      for (const n of m) {
        muscleTint.set(
          n,
          n === "calcaneal-tendon" ? "#fde68a" : n === "gastrocnemius" ? "#dc2626" : "#f87171",
        );
      }
      return plan({
        solid,
        muscles: m,
        muscleTint,
        frame: [...solid],
        dirs: ["back", "side", "front"],
        pad: 1.2,
      });
    }
  }
}

/** Camera direction vectors (from the target towards the camera). Anterior is +z. */
export const DIR_VECTOR: Record<Dir, [number, number, number]> = {
  front: [0, 0.06, 1],
  back: [0, 0.06, -1],
  side: [1, 0.06, 0],
  top: [0.0001, 1, 0.0001],
  bottom: [0.0001, -1, 0.0001],
};

export const DIR_LABEL: Record<Dir, { ar: string; en: string }> = {
  front: { ar: "أمامي", en: "Front" },
  back: { ar: "خلفي", en: "Back" },
  side: { ar: "جانبي", en: "Side" },
  top: { ar: "علوي", en: "Top" },
  bottom: { ar: "سفلي", en: "Bottom" },
};
