import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { memo, Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { Beat } from "./adr3d-core";
import {
  advance,
  ANATOMY_FILES,
  placementOf,
  type AnatomyFile,
  type LayerId,
  type LayerMode,
  type Live,
  type Vec3,
} from "./adr3d-model";

/** What the student clicked: enough to name it, highlight it and fly the camera to it. */
export interface PartPick {
  file: AnatomyFile["id"];
  node: string;
  center: Vec3;
  radius: number;
}
export const partKey = (file: string, node: string) => `${file}:${node}`;

type PartMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>;
interface PartData {
  part: string;
  file: AnatomyFile["id"];
  /** Local-space centre of the mesh, used to scale chambers about themselves. */
  center: THREE.Vector3;
  basePosition: THREE.Vector3;
  glowColor: THREE.Color;
  glow: number;
  hover: boolean;
  selected: boolean;
  raycast: THREE.Mesh["raycast"];
}
const data = (m: THREE.Object3D) => m.userData as PartData;

const HIGHLIGHT = new THREE.Color("#38bdf8");
const HOVER = new THREE.Color("#bae6fd");
const GREEN = new THREE.Color("#22c55e");
const AMBER = new THREE.Color("#f59e0b");
const RED = new THREE.Color("#ef4444");
const BLUE = new THREE.Color("#60a5fa");
const CYAN = new THREE.Color("#22d3ee");
const NOEMISSIVE = new THREE.Color("#000000");

/** Final emissive of a part: selection > hover > the physiology glow. */
function applyEmissive(mesh: PartMesh) {
  const d = data(mesh);
  const m = mesh.material;
  if (d.selected) {
    m.emissive.copy(HIGHLIGHT);
    m.emissiveIntensity = 0.7;
  } else if (d.hover) {
    m.emissive.copy(HOVER);
    m.emissiveIntensity = 0.45;
  } else if (d.glow > 0.001) {
    m.emissive.copy(d.glowColor);
    m.emissiveIntensity = d.glow;
  } else {
    m.emissive.copy(NOEMISSIVE);
    m.emissiveIntensity = 0;
  }
}

function glow(mesh: PartMesh, color: THREE.Color, intensity: number) {
  const d = data(mesh);
  d.glowColor.copy(color);
  d.glow = intensity;
  applyEmissive(mesh);
}

/** Scales a mesh about its own centre (chambers pulse in place, never drift or tear). */
function scaleAbout(mesh: PartMesh, s: number) {
  const d = data(mesh);
  mesh.scale.setScalar(s);
  mesh.position
    .copy(d.center)
    .multiplyScalar(1 - s)
    .add(d.basePosition);
}

/**
 * Clones a loaded atlas file, gives each part its own physically-based material (same illustrative
 * colour as the model, soft clearcoat for a wet look) and records what the animation needs.
 */
function prepare(scene: THREE.Object3D, file: AnatomyFile["id"]) {
  const root = scene.clone(true);
  const meshes: PartMesh[] = [];
  const materials: THREE.MeshPhysicalMaterial[] = [];
  root.traverse((o) => {
    const mesh = o as PartMesh;
    if (!mesh.isMesh) return;
    const src = mesh.material as unknown as THREE.MeshStandardMaterial;
    const mat = new THREE.MeshPhysicalMaterial({
      color: src.color.clone(),
      roughness: 0.52,
      metalness: 0,
      clearcoat: 0.35,
      clearcoatRoughness: 0.4,
      sheen: 0.25,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color("#ffd1d1"),
      envMapIntensity: 1,
    });
    mesh.material = mat;
    mesh.geometry.computeBoundingBox();
    const center = new THREE.Vector3();
    mesh.geometry.boundingBox?.getCenter(center);
    mesh.userData = {
      part: mesh.name || mesh.parent?.name || "part",
      file,
      center,
      basePosition: mesh.position.clone(),
      glowColor: new THREE.Color(),
      glow: 0,
      hover: false,
      selected: false,
      raycast: THREE.Mesh.prototype.raycast,
    } satisfies PartData;
    meshes.push(mesh);
    materials.push(mat);
  });
  const byName = new Map(meshes.map((m) => [data(m).part, m]));
  return { root, meshes, materials, byName };
}
type Prepared = ReturnType<typeof prepare>;

const ARM_MUSCLES = /^(biceps-brachii|brachialis|triceps-brachii|deltoid|coracobrachialis)/;

/** Per-file live animation, driven by the same values as the HUD. */
function animate(
  file: AnatomyFile["id"],
  prepared: Prepared,
  state: { muscle: { t: number; acc: number } },
  live: Live,
  beat: Beat,
  burst: number,
) {
  const { meshes, byName } = prepared;
  const d = live.drive;
  const t = live.t;
  const hazard = live.hazard;

  if (file === "heart") {
    const c = beat.c;
    const k = d.contractility;
    const fast = d.p.hr >= 150 || live.values.fault === 1;
    const blocked = live.values.fault === 3;
    for (const m of meshes) {
      const n = data(m).part;
      let s = 1;
      if (/ventricle|ventricular-wall/.test(n)) s = 1 - 0.085 * k * c.systole;
      else if (/atrium/.test(n)) s = 1 + 0.03 * c.systole - 0.07 * k * c.atrial;
      else if (/aorta|aortic|pulmonary|vena-cava/.test(n)) s = 1 + 0.04 * k * c.systole;
      scaleAbout(m, s);
      const tone = hazard === 2 ? RED : blocked ? BLUE : fast ? AMBER : RED;
      const i = blocked ? 0.1 + 0.12 * c.systole : 0.1 + (0.22 + 0.4 * (fast ? 1 : 0)) * c.systole;
      glow(m, tone, hazard > 0 ? i + 0.2 + 0.2 * Math.sin(t * 9) : i);
    }
  } else if (file === "adrenals") {
    const g = Math.min(1, d.a + burst);
    for (const [name, m] of byName) {
      if (!/adrenal-gland/.test(name)) continue;
      const pulse = 0.7 + 0.3 * Math.sin(t * 4 + (name.startsWith("left") ? 1.7 : 0));
      glow(m, AMBER, 0.12 + 1.1 * g * pulse);
      scaleAbout(m, 1 + 0.05 * g * pulse);
    }
  } else if (file === "brain") {
    const b = live.drive.p.brain;
    const tone = b < 40 ? RED : b < 70 ? AMBER : GREEN;
    for (const m of meshes) {
      const sparkle = 0.7 + 0.3 * Math.sin(t * (1.5 + d.nerveRate) + data(m).center.x * 9);
      glow(m, tone, (0.06 + 0.5 * (b / 100) * sparkle) * (hazard === 2 ? 1.5 : 1));
    }
  } else if (file === "muscles") {
    const acc = advance(state.muscle, t, d.muscleFreq);
    const c = d.muscleAmp * (0.5 - 0.5 * Math.cos(acc * Math.PI * 2));
    for (const m of meshes) {
      if (ARM_MUSCLES.test(data(m).part)) {
        glow(m, RED, 0.08 + 0.9 * c);
        scaleAbout(m, 1 + 0.045 * c);
      }
    }
  } else if (file === "vessels") {
    const s = beat.c.systole;
    for (const m of meshes) {
      const vein = /vein|vena/.test(data(m).part);
      glow(m, vein ? BLUE : RED, vein ? 0.04 : 0.05 + 0.3 * s);
    }
  } else if (file === "spinal-cord") {
    for (const m of meshes) {
      const pulse = 0.6 + 0.4 * Math.sin(t * (2 + d.nerveRate) + data(m).center.y * 6);
      glow(m, CYAN, 0.05 + 0.6 * d.nerveAmp * pulse);
    }
  }
}

function LayerModel({
  file,
  mode,
  selected,
  isolate,
  live,
  beat,
  burst,
  onPick,
}: {
  file: AnatomyFile;
  mode: LayerMode;
  selected: string | null;
  isolate: boolean;
  live: RefObject<Live>;
  beat: RefObject<Beat>;
  burst: RefObject<number>;
  onPick: (p: PartPick) => void;
}) {
  // No Draco (the files are plain GLB); Meshopt stays enabled so compressed replacements still load.
  const gltf = useGLTF(file.url, false, true) as unknown as { scene: THREE.Group };
  const placement = useMemo(() => placementOf(file), [file]);
  const prepared = useMemo(() => prepare(gltf.scene, file.id), [gltf, file.id]);
  const state = useRef({ muscle: { t: 0, acc: 0 } });
  useEffect(
    () => () => {
      prepared.materials.forEach((m) => m.dispose());
    },
    [prepared],
  );

  // Layer mode / isolation / selection are applied when they change, not every frame.
  useEffect(() => {
    for (const mesh of prepared.meshes) {
      const d = data(mesh);
      const mat = mesh.material;
      const isSel = selected === partKey(file.id, d.part);
      d.selected = isSel;
      let kind: "solid" | "ghost" | "faint" = mode === "hidden" ? "ghost" : mode;
      if (isolate && selected) kind = isSel ? "solid" : "faint";
      mat.transparent = kind !== "solid";
      mat.opacity = kind === "solid" ? 1 : kind === "ghost" ? 0.14 : 0.04;
      mat.depthWrite = kind === "solid";
      mat.needsUpdate = true;
      // Ghost, faint and hidden parts are see-through: clicks go to the solid thing behind them.
      mesh.raycast = kind === "solid" && mode !== "hidden" ? d.raycast : () => {};
      applyEmissive(mesh);
    }
  }, [prepared, mode, selected, isolate, file.id]);

  useFrame(() => {
    if (mode === "hidden") return;
    animate(file.id, prepared, state.current, live.current, beat.current, burst.current);
  });

  const hovered = useRef<PartMesh | null>(null);
  useEffect(
    () => () => {
      document.body.style.cursor = "";
    },
    [],
  );

  return (
    <group position={placement.position} scale={placement.scale} visible={mode !== "hidden"}>
      <primitive
        object={prepared.root}
        onPointerOver={(e: { object: THREE.Object3D; stopPropagation: () => void }) => {
          e.stopPropagation();
          const mesh = e.object as PartMesh;
          if (!mesh.isMesh || !data(mesh)) return;
          if (hovered.current && hovered.current !== mesh) {
            data(hovered.current).hover = false;
            applyEmissive(hovered.current);
          }
          hovered.current = mesh;
          data(mesh).hover = true;
          applyEmissive(mesh);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          if (hovered.current) {
            data(hovered.current).hover = false;
            applyEmissive(hovered.current);
            hovered.current = null;
          }
          document.body.style.cursor = "";
        }}
        onClick={(e: { object: THREE.Object3D; stopPropagation: () => void }) => {
          e.stopPropagation();
          const mesh = e.object as PartMesh;
          if (!mesh.isMesh || !data(mesh)) return;
          const box = new THREE.Box3().setFromObject(mesh);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          onPick({
            file: file.id,
            node: data(mesh).part,
            center: [center.x, center.y, center.z],
            radius: Math.max(0.05, size.length() / 2),
          });
        }}
      />
    </group>
  );
}

export interface AtlasProps {
  live: RefObject<Live>;
  beat: RefObject<Beat>;
  modes: Record<LayerId, LayerMode>;
  selected: string | null;
  isolate: boolean;
  /** 0–1 extra adrenal secretion from the "secrete adrenaline" button (decays over time). */
  burst: RefObject<number>;
  /** The bloodstream ride hides the atlas (the camera is inside the vessel). */
  ride: boolean;
  onPick: (p: PartPick) => void;
}

/**
 * The real human body: BodyParts3D models placed in one shared frame. A file is only downloaded the
 * first time its layer is shown; hidden layers keep their GPU data but are not drawn.
 */
export const Atlas = memo(function Atlas(props: AtlasProps) {
  const shown = useRef(new Set<string>());
  return (
    <>
      {ANATOMY_FILES.map((file) => {
        const mode = props.ride ? "hidden" : props.modes[file.layer];
        if (mode !== "hidden") shown.current.add(file.id);
        if (!shown.current.has(file.id)) return null;
        return (
          <Suspense key={file.id} fallback={null}>
            <LayerModel
              file={file}
              mode={mode}
              selected={props.selected}
              isolate={props.isolate}
              live={props.live}
              beat={props.beat}
              burst={props.burst}
              onPick={props.onPick}
            />
          </Suspense>
        );
      })}
    </>
  );
});
