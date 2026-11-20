import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three/examples/jsm/controls/OrbitControls.js";
import {
  groupNodes,
  groupOfNode,
  pickGroup,
  PELVIS_WIDTH,
  radiusState,
  skullTissue,
  vertebraNode,
} from "@/data/lessons/supportLab";
import { MUSCLE_NODES, SKELETON_NODES } from "@/data/lessons/anatomyNodes";
import { ANATOMY_FILES, placementOf } from "../scenes/adr3d-model";
import {
  DIR_LABEL,
  DIR_VECTOR,
  planFocus,
  type Dir,
  type FocusPlan,
  type HumanFocus,
} from "./boneFocus";
import {
  LabelOverlay,
  LabelProjector,
  RegLabel,
  useLabelRegistry,
  type LabelRegistry,
} from "./labels";
import type { SceneState } from "./sceneState";

/**
 * The human 3D scenes of the support lesson. They load the REAL BodyParts3D skeleton (and, for
 * the Achilles scene, muscles) already shipped in public/models/anatomy — no primitive bodies.
 * Only small labelled markers (ligaments, cavities, foramen) are drawn on top as annotations.
 */

type FileId = "skeleton" | "muscles";
const FILE = Object.fromEntries(ANATOMY_FILES.map((f) => [f.id, f])) as Record<
  string,
  (typeof ANATOMY_FILES)[number]
>;

type PartMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;

interface Prepared {
  root: THREE.Group;
  meshes: Map<string, PartMesh>;
}

const BONE = new THREE.Color("#efe6cf");
const CYAN = new THREE.Color("#22d3ee");
const AMBER = new THREE.Color("#f59e0b");
const NONE = new THREE.Color("#000000");

function prepare(source: THREE.Object3D): Prepared {
  const root = source.clone(true) as THREE.Group;
  const meshes = new Map<string, PartMesh>();
  root.traverse((o) => {
    const mesh = o as PartMesh;
    if (!mesh.isMesh) return;
    mesh.material = new THREE.MeshStandardMaterial({
      color: BONE.clone(),
      roughness: 0.62,
      metalness: 0.02,
    });
    mesh.userData["raycast"] = THREE.Mesh.prototype.raycast;
    meshes.set(mesh.name || mesh.parent?.name || `part-${meshes.size}`, mesh);
  });
  return { root, meshes };
}

/** World-space box of a set of meshes (the group transforms must be up to date). */
function boxOf(meshes: Iterable<THREE.Object3D>): THREE.Box3 {
  const box = new THREE.Box3();
  for (const m of meshes) box.union(new THREE.Box3().setFromObject(m));
  return box;
}

function slice(box: THREE.Box3, from: number, to: number): THREE.Box3 {
  const h = box.max.y - box.min.y;
  const out = box.clone();
  out.min.y = box.min.y + h * from;
  out.max.y = box.min.y + h * to;
  return out;
}

interface Registry {
  skeleton: Prepared | null;
  muscles: Prepared | null;
}

/* ----------------------------------- model ---------------------------------- */

interface ModelProps {
  file: FileId;
  plan: FocusPlan;
  focus: HumanFocus;
  scene: SceneState;
  selected: string | null;
  registry: React.MutableRefObject<Registry>;
  onReady: () => void;
  onPick: (group: string, point: THREE.Vector3) => void;
}

function Model({ file, plan, focus, scene, selected, registry, onReady, onPick }: ModelProps) {
  const def = FILE[file]!;
  const gltf = useGLTF(def.url, false, true) as unknown as { scene: THREE.Group };
  const placement = useMemo(() => placementOf(def), [def]);
  const prepared = useMemo(() => prepare(gltf.scene), [gltf]);
  const holder = useRef<THREE.Group>(null);
  const pulse = useRef<PartMesh[]>([]);
  const sel = useRef<PartMesh[]>([]);

  useEffect(() => {
    registry.current[file] = prepared;
    holder.current?.updateWorldMatrix(true, true);
    onReady();
    return () => {
      registry.current[file] = null;
      for (const m of prepared.meshes.values()) m.material.dispose();
    };
  }, [prepared, file, registry, onReady]);

  // Visibility, tint and clicks follow the focus plan.
  useEffect(() => {
    for (const [name, mesh] of prepared.meshes) {
      const isSolid = file === "skeleton" ? plan.solid.has(name) : plan.muscles.has(name);
      const isGhost = file === "skeleton" && plan.ghost.has(name);
      const mat = mesh.material;
      mesh.visible = isSolid || isGhost;
      mat.transparent = !isSolid;
      mat.opacity = isSolid ? 1 : 0.1;
      mat.depthWrite = isSolid;
      const color =
        (file === "skeleton" ? plan.tint.get(name) : plan.muscleTint.get(name)) ?? "#efe6cf";
      mat.color.set(isSolid ? color : "#cbd5e1");
      mat.needsUpdate = true;
      mesh.raycast = isSolid ? (mesh.userData["raycast"] as THREE.Mesh["raycast"]) : () => {};
    }
  }, [prepared, plan, file]);

  // Skull joints turn from fibrous (tan) into bony (ivory) with age.
  useEffect(() => {
    if (file !== "skeleton" || focus !== "skull" || scene.skullAge === null) return;
    const { bony } = skullTissue(scene.skullAge);
    const tan = new THREE.Color("#c08a4e");
    const ivory = new THREE.Color("#f6efd9");
    const c = tan.lerp(ivory, bony / 100);
    for (const n of groupNodes("cranial-bones", [...prepared.meshes.keys()])) {
      prepared.meshes.get(n)?.material.color.copy(c);
    }
  }, [prepared, file, focus, scene.skullAge]);

  // Highlighted groups pulse; the picked group stays amber; the graph's vertebra is amber too.
  useEffect(() => {
    const names = [...prepared.meshes.keys()];
    const hi = new Set<string>();
    for (const g of scene.highlight) for (const n of groupNodes(g, names)) hi.add(n);
    if (file === "skeleton" && scene.vertebra !== null && focus === "spine") {
      hi.add(vertebraNode(scene.vertebra));
    }
    pulse.current = [...hi].map((n) => prepared.meshes.get(n)).filter((m): m is PartMesh => !!m);
    const picked = selected ? new Set(groupNodes(selected, names)) : new Set<string>();
    sel.current = [...picked].map((n) => prepared.meshes.get(n)).filter((m): m is PartMesh => !!m);
    for (const m of prepared.meshes.values()) {
      m.material.emissive.copy(NONE);
      m.material.emissiveIntensity = 0;
    }
    for (const m of sel.current) {
      m.material.emissive.copy(AMBER);
      m.material.emissiveIntensity = 0.45;
    }
  }, [prepared, file, scene.highlight, scene.vertebra, focus, selected]);

  useFrame(({ clock }) => {
    const k = 0.3 + 0.35 * Math.sin(clock.elapsedTime * 4.2);
    for (const m of pulse.current) {
      m.material.emissive.copy(CYAN);
      m.material.emissiveIntensity = Math.max(0.05, k);
    }
  });

  // The radius (and the hand it carries) turns about the fixed ulna: half a circle at most.
  const radiusRig = useRef<{ pivot: THREE.Group; a: THREE.Vector3; axis: THREE.Vector3 } | null>(
    null,
  );
  useEffect(() => {
    radiusRig.current = null;
    if (file !== "skeleton" || focus !== "pectoral") return;
    const names = [...prepared.meshes.keys()];
    const moving = [
      ...groupNodes("radius", names),
      ...groupNodes("carpals", names),
      ...groupNodes("metacarpals", names),
      ...groupNodes("hand-phalanges", names),
    ].filter((n) => !n.startsWith("left-"));
    const radius = prepared.meshes.get("right-radius");
    const ulna = prepared.meshes.get("right-ulna");
    if (!radius || !ulna) return;
    holder.current?.updateWorldMatrix(true, true);
    const rb = new THREE.Box3().setFromObject(radius);
    const ub = new THREE.Box3().setFromObject(ulna);
    const head = new THREE.Vector3((rb.min.x + rb.max.x) / 2, rb.max.y, (rb.min.z + rb.max.z) / 2);
    const tail = new THREE.Vector3((ub.min.x + ub.max.x) / 2, ub.min.y, (ub.min.z + ub.max.z) / 2);
    const a = prepared.root.worldToLocal(head.clone());
    const b = prepared.root.worldToLocal(tail.clone());
    const pivot = new THREE.Group();
    pivot.matrixAutoUpdate = false;
    prepared.root.add(pivot);
    for (const n of moving) {
      const m = prepared.meshes.get(n);
      if (m) pivot.add(m);
    }
    radiusRig.current = { pivot, a, axis: a.clone().sub(b).normalize() };
    return () => {
      for (const m of [...pivot.children]) prepared.root.add(m);
      prepared.root.remove(pivot);
      radiusRig.current = null;
    };
  }, [prepared, file, focus]);
  useEffect(() => {
    const rig = radiusRig.current;
    if (!rig) return;
    const rad = THREE.MathUtils.degToRad(radiusState(scene.radiusDeg).deg);
    const m = new THREE.Matrix4()
      .makeTranslation(rig.a.x, rig.a.y, rig.a.z)
      .multiply(new THREE.Matrix4().makeRotationAxis(rig.axis, rad))
      .multiply(new THREE.Matrix4().makeTranslation(-rig.a.x, -rig.a.y, -rig.a.z));
    rig.pivot.matrix.copy(m);
    rig.pivot.matrixWorldNeedsUpdate = true;
  }, [scene.radiusDeg, prepared, focus, file]);

  // A torn Achilles tendon: two clipped halves with a gap between them.
  useEffect(() => {
    if (file !== "muscles" || focus !== "achilles") return;
    const tendon = prepared.meshes.get("calcaneal-tendon");
    if (!tendon || !scene.achillesTorn) return;
    holder.current?.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(tendon);
    const h = box.max.y - box.min.y;
    const cut = box.min.y + h * 0.45;
    const gap = h * 0.07;
    const mk = (plane: THREE.Plane) => {
      const mat = tendon.material.clone();
      mat.clippingPlanes = [plane];
      mat.color.set("#f87171");
      mat.emissive.set("#b91c1c");
      mat.emissiveIntensity = 0.5;
      const mesh = new THREE.Mesh(tendon.geometry, mat) as PartMesh;
      mesh.raycast = () => {};
      tendon.parent?.add(mesh);
      mesh.position.copy(tendon.position);
      mesh.quaternion.copy(tendon.quaternion);
      mesh.scale.copy(tendon.scale);
      return mesh;
    };
    const upper = mk(new THREE.Plane(new THREE.Vector3(0, 1, 0), -(cut + gap)));
    const lower = mk(new THREE.Plane(new THREE.Vector3(0, -1, 0), cut - gap));
    tendon.visible = false;
    return () => {
      tendon.visible = true;
      for (const m of [upper, lower]) {
        m.parent?.remove(m);
        m.material.dispose();
      }
    };
  }, [prepared, file, focus, scene.achillesTorn]);

  return (
    <group ref={holder} position={placement.position} scale={placement.scale}>
      <primitive
        object={prepared.root}
        onClick={(e: {
          object: THREE.Object3D;
          point: THREE.Vector3;
          stopPropagation: () => void;
        }) => {
          e.stopPropagation();
          const mesh = e.object as PartMesh;
          const group = groupOfNode(mesh.name, file);
          if (group) onPick(group, e.point.clone());
        }}
        onPointerOver={(e: { object: THREE.Object3D; stopPropagation: () => void }) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      />
    </group>
  );
}

/* --------------------------------- camera rig -------------------------------- */

interface Goal {
  key: string;
  pos: THREE.Vector3;
  target: THREE.Vector3;
}

function CameraRig({ goal }: { goal: Goal | null }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const flying = useRef(false);

  useEffect(() => {
    flying.current = goal !== null;
  }, [goal]);
  useEffect(() => {
    if (!controls) return;
    const stop = () => {
      flying.current = false;
    };
    controls.addEventListener("start", stop);
    return () => controls.removeEventListener("start", stop);
  }, [controls]);

  useFrame((_, dt) => {
    if (!goal || !flying.current || !controls) return;
    const k = 1 - Math.exp(-dt * 5);
    camera.position.lerp(goal.pos, k);
    controls.target.lerp(goal.target, k);
    controls.update();
    if (camera.position.distanceTo(goal.pos) < goal.pos.length() * 0.0005 + 0.0005) {
      flying.current = false;
    }
  });
  return null;
}

/* ---------------------------------- markers ---------------------------------- */

interface MarkerSpec {
  id: string;
  label: string;
  pos: THREE.Vector3;
  color: string;
  size?: number;
}

function Marker({
  spec,
  size,
  active,
  onClick,
  reg,
}: {
  reg: LabelRegistry;
  spec: MarkerSpec;
  size: number;
  active: boolean;
  onClick: ((id: string) => void) | undefined;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const s = 1 + (active ? 0.35 * Math.sin(clock.elapsedTime * 5) : 0);
    mesh.current?.scale.setScalar(s);
  });
  return (
    <group position={spec.pos}>
      <mesh
        ref={mesh}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(spec.id);
        }}
        onPointerOver={() => {
          if (onClick) document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <sphereGeometry args={[size * (spec.size ?? 1), 16, 12]} />
        <meshBasicMaterial color={spec.color} transparent opacity={0.92} depthTest={false} />
      </mesh>
      <RegLabel reg={reg} id={`m-${spec.id}`} pos={spec.pos} text={spec.label} dy={-18} />
    </group>
  );
}

function Tube({
  points,
  radius,
  color,
  active,
  onClick,
}: {
  points: THREE.Vector3[];
  radius: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  const geo = useMemo(
    () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, radius, 8, false),
    [points, radius],
  );
  useEffect(() => () => geo.dispose(), [geo]);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (mat.current)
      mat.current.emissiveIntensity = active ? 0.5 + 0.4 * Math.sin(clock.elapsedTime * 5) : 0.15;
  });
  return (
    <mesh
      geometry={geo}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <meshStandardMaterial
        ref={mat}
        color={color}
        emissive={color}
        roughness={0.5}
        depthTest={false}
      />
    </mesh>
  );
}

interface Annotations {
  markers: MarkerSpec[];
  tubes: { id: string; label: string; points: THREE.Vector3[]; color: string }[];
  rings: {
    id: string;
    center: THREE.Vector3;
    rx: number;
    rz: number;
    color: string;
    label: string;
  }[];
  size: number;
}

/** Annotation overlays computed from the real meshes' bounding boxes. */
function annotate(focus: HumanFocus, reg: Registry, scene: SceneState, ar: boolean): Annotations {
  const out: Annotations = { markers: [], tubes: [], rings: [], size: 0.02 };
  const sk = reg.skeleton;
  if (!sk) return out;
  const t = (a: string, e: string) => (ar ? a : e);
  const name = (id: string) => {
    const g = pickGroup(id);
    return g ? (ar ? g.name.ar : g.name.en) : id;
  };
  const box = (n: string) => {
    const m = sk.meshes.get(n);
    return m ? new THREE.Box3().setFromObject(m) : null;
  };
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const ctr = (b: THREE.Box3) => b.getCenter(new THREE.Vector3());

  switch (focus) {
    case "vertebra": {
      const b = box("third-lumbar-vertebra-l3");
      if (!b) break;
      const c = ctr(b);
      const s = b.getSize(new THREE.Vector3());
      out.size = Math.max(s.x, s.z) * 0.035;
      const add = (id: string, label: string, p: THREE.Vector3, color = "#38bdf8") =>
        out.markers.push({ id, label, pos: p, color });
      add("v-body", t("جسم الفقرة", "Body"), V(c.x, c.y, b.max.z - s.z * 0.12), "#f59e0b");
      add(
        "v-spinous",
        t("النتوء الشوكي", "Spinous process"),
        V(c.x, c.y + s.y * 0.1, b.min.z + s.z * 0.04),
        "#ef4444",
      );
      add(
        "v-trans-l",
        t("نتوء مستعرض", "Transverse"),
        V(b.min.x + s.x * 0.04, c.y, c.z - s.z * 0.05),
        "#22c55e",
      );
      add(
        "v-trans-r",
        t("نتوء مستعرض", "Transverse"),
        V(b.max.x - s.x * 0.04, c.y, c.z - s.z * 0.05),
        "#22c55e",
      );
      add(
        "v-sup-l",
        t("مفصلي علوي", "Sup. articular"),
        V(c.x - s.x * 0.17, b.max.y, c.z - s.z * 0.16),
        "#a78bfa",
      );
      add(
        "v-sup-r",
        t("مفصلي علوي", "Sup. articular"),
        V(c.x + s.x * 0.17, b.max.y, c.z - s.z * 0.16),
        "#a78bfa",
      );
      add(
        "v-inf-l",
        t("مفصلي سفلي", "Inf. articular"),
        V(c.x - s.x * 0.14, b.min.y, c.z - s.z * 0.3),
        "#ec4899",
      );
      add(
        "v-inf-r",
        t("مفصلي سفلي", "Inf. articular"),
        V(c.x + s.x * 0.14, b.min.y, c.z - s.z * 0.3),
        "#ec4899",
      );
      add("v-canal", t("القناة العصبية", "Neural canal"), V(c.x, c.y, c.z - s.z * 0.1), "#fde047");
      break;
    }
    case "skull": {
      const b = box("occipital-bone");
      if (!b) break;
      const c = ctr(b);
      const s = b.getSize(new THREE.Vector3());
      out.size = s.x * 0.03;
      out.markers.push({
        id: "foramen-magnum",
        label: name("foramen-magnum"),
        pos: V(c.x, b.min.y + s.y * 0.04, c.z + s.z * 0.05),
        color: "#ef4444",
        size: 1.4,
      });
      break;
    }
    case "pectoral": {
      const b = box("right-scapula");
      if (!b) break;
      const s = b.getSize(new THREE.Vector3());
      const c = ctr(b);
      out.size = s.x * 0.05;
      const lateral = c.x < 0 ? b.min.x : b.max.x;
      out.markers.push({
        id: "glenoid",
        label: name("glenoid"),
        pos: V(lateral, b.max.y - s.y * 0.2, c.z + s.z * 0.05),
        color: "#ef4444",
        size: 1.2,
      });
      break;
    }
    case "pelvic": {
      const r = box("right-hip-bone");
      const l = box("left-hip-bone");
      if (!r || !l) break;
      const both = r.clone().union(l);
      const s = both.getSize(new THREE.Vector3());
      const c = ctr(both);
      out.size = s.x * 0.03;
      const lat = ctr(r).x < 0 ? r.min.x : r.max.x;
      out.markers.push({
        id: "acetabulum",
        label: name("acetabulum"),
        pos: V(lat + (lat < 0 ? 1 : -1) * s.x * 0.04, c.y + s.y * 0.12, c.z),
        color: "#ef4444",
      });
      out.markers.push({
        id: "pubic-symphysis",
        label: name("pubic-symphysis"),
        pos: V(
          (r.min.x + r.max.x + l.min.x + l.max.x) / 4,
          both.min.y + s.y * 0.3,
          both.max.z - s.z * 0.04,
        ),
        color: "#22c55e",
      });
      if (scene.pelvis) {
        const brim = V(c.x, c.y - s.y * 0.05, c.z);
        const w = s.x * 0.5;
        const d = s.z * 0.34;
        out.rings.push(
          {
            id: "female",
            center: brim,
            rx: w * PELVIS_WIDTH.female * 0.82,
            rz: d,
            color: scene.pelvis === "female" ? "#f472b6" : "#64748b",
            label: t("حوض الأنثى (أوسع)", "Female pelvis (wider)"),
          },
          {
            id: "male",
            center: brim,
            rx: w * PELVIS_WIDTH.male * 0.82,
            rz: d * 0.9,
            color: scene.pelvis === "male" ? "#38bdf8" : "#64748b",
            label: t("حوض الذكر", "Male pelvis"),
          },
        );
      }
      break;
    }
    case "joints": {
      const m = (n: string, f: (b: THREE.Box3) => THREE.Vector3, id: string, label: string) => {
        const b = box(n);
        if (b) out.markers.push({ id, label, pos: f(b), color: "#f59e0b" });
      };
      const sizeRef = box("right-femur");
      if (sizeRef) out.size = sizeRef.getSize(new THREE.Vector3()).x * 0.18;
      m(
        "right-humerus",
        (b) => V(ctr(b).x, b.max.y, ctr(b).z),
        "shoulder",
        t("مفصل الكتف", "Shoulder"),
      );
      m("right-humerus", (b) => V(ctr(b).x, b.min.y, ctr(b).z), "elbow", t("مفصل الكوع", "Elbow"));
      m("right-femur", (b) => V(ctr(b).x, b.max.y - 0.03, ctr(b).z), "hip", t("مفصل الفخذ", "Hip"));
      m("right-femur", (b) => V(ctr(b).x, b.min.y, ctr(b).z), "knee", t("مفصل الركبة", "Knee"));
      break;
    }
    case "knee": {
      const ti = box("right-tibia");
      const fi = box("right-fibula");
      if (!ti || !fi) break;
      const tc = ctr(ti);
      const ts = ti.getSize(new THREE.Vector3());
      const side = tc.x < 0 ? -1 : 1; // +1: lateral is +x
      out.size = ts.x * 0.06;
      const hw = ts.x * 0.5;
      const yJ = ti.max.y;
      const yTop = yJ + ts.y * 0.09;
      const z0 = tc.z;
      const d = ts.z;
      const tube = (id: string, color: string, pts: THREE.Vector3[]) =>
        out.tubes.push({ id, label: name(id), points: pts, color });
      // The two cruciate ligaments cross in an X inside the joint.
      tube("acl", "#ef4444", [
        V(tc.x - side * hw * 0.25, yJ, z0 + d * 0.15),
        V(tc.x + side * hw * 0.05, (yJ + yTop) / 2, z0 - d * 0.02),
        V(tc.x + side * hw * 0.35, yTop, z0 - d * 0.2),
      ]);
      tube("pcl", "#a855f7", [
        V(tc.x + side * hw * 0.25, yJ, z0 - d * 0.2),
        V(tc.x - side * hw * 0.05, (yJ + yTop) / 2, z0 - d * 0.02),
        V(tc.x - side * hw * 0.35, yTop, z0 + d * 0.1),
      ]);
      tube("medial-ligament", "#f59e0b", [
        V(tc.x - side * hw * 1.02, yJ + ts.y * 0.1, z0),
        V(tc.x - side * hw * 1.08, yJ, z0),
        V(tc.x - side * hw * 1.02, yJ - ts.y * 0.12, z0),
      ]);
      const fib = ctr(fi);
      tube("lateral-ligament", "#22c55e", [
        V(tc.x + side * hw * 1.02, yJ + ts.y * 0.1, z0),
        V(tc.x + side * hw * 1.08, yJ, z0),
        V(fib.x, fi.max.y - ts.y * 0.01, z0),
      ]);
      break;
    }
    case "achilles": {
      const mu = reg.muscles;
      const tendon = mu?.meshes.get("calcaneal-tendon");
      if (!tendon) break;
      const b = new THREE.Box3().setFromObject(tendon);
      const c = ctr(b);
      const s = b.getSize(new THREE.Vector3());
      out.size = 0.035;
      if (scene.achillesTorn) {
        out.markers.push({
          id: "tear",
          label: t("موضع التمزق", "Tear site"),
          pos: V(c.x, b.min.y + s.y * 0.45, c.z + s.z * 0.6),
          color: "#ef4444",
        });
      }
      break;
    }
    default:
      break;
  }
  return out;
}

/* ------------------------------------ world ---------------------------------- */

interface WorldProps {
  reg: LabelRegistry;
  focus: HumanFocus;
  dir: Dir;
  scene: SceneState;
  ar: boolean;
  onPick: (group: string) => void;
  selected: string | null;
  onSelect: (group: string | null) => void;
}

const NAMES = { skeleton: SKELETON_NODES, muscles: MUSCLE_NODES } as const;

function Lights() {
  return (
    <>
      <ambientLight intensity={0.75} />
      <hemisphereLight args={["#ffffff", "#8b7355", 0.6]} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} />
      <directionalLight position={[-3, 2, -4]} intensity={0.55} />
    </>
  );
}

function World({ reg, focus, dir, scene, ar, onPick, selected, onSelect }: WorldProps) {
  const names = NAMES;
  const registry = useRef<Registry>({ skeleton: null, muscles: null });
  const [version, setVersion] = useState(0);
  const onReady = useCallback(() => setVersion((v) => v + 1), []);
  const plan = useMemo(
    () =>
      planFocus(focus, {
        skeleton: names.skeleton,
        muscles: names.muscles,
        jointKind: scene.jointKind,
      }),
    [focus, names, scene.jointKind],
  );
  const [label, setLabel] = useState<{ text: string; pos: THREE.Vector3 } | null>(null);

  const goal = useMemo<Goal | null>(() => {
    const sk = registry.current.skeleton;
    if (!sk) return null;
    const take = (m: Map<string, PartMesh>, ns: Iterable<string>) =>
      [...ns].map((n) => m.get(n)).filter((x): x is PartMesh => !!x);
    let box = boxOf(take(sk.meshes, plan.frame));
    if (box.isEmpty()) return null;
    if (focus === "knee") {
      const parts = (n: string) => sk.meshes.get(n);
      const f = parts("right-femur");
      const ti = parts("right-tibia");
      if (f && ti) {
        box = slice(new THREE.Box3().setFromObject(f), 0, 0.28).union(
          slice(new THREE.Box3().setFromObject(ti), 0.72, 1),
        );
      }
    } else if (focus === "achilles") {
      const ti = sk.meshes.get("right-tibia");
      const foot = take(
        sk.meshes,
        groupNodes("tarsals", names.skeleton).filter((n) => !n.startsWith("left-")),
      );
      if (ti) {
        box = slice(new THREE.Box3().setFromObject(ti), 0, 0.5).union(boxOf(foot));
      }
    }
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const fov = 38;
    const dist =
      (Math.max(size.x, size.y, size.z) * plan.pad) /
      (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)));
    const v = new THREE.Vector3(...DIR_VECTOR[dir]).normalize();
    return {
      key: `${focus}-${dir}-${version}`,
      pos: center.clone().addScaledVector(v, Math.max(dist, 0.15)),
      target: center,
    };
    // `version` bumps when a model finishes loading, so the camera frames real geometry.
  }, [focus, dir, plan, version, names]);

  const ann = useMemo(
    () => annotate(focus, registry.current, scene, ar),
    [focus, scene, ar, version],
  );

  const pick = useCallback(
    (group: string, point: THREE.Vector3) => {
      const g = pickGroup(group);
      setLabel({ text: g ? (ar ? g.name.ar : g.name.en) : group, pos: point });
      onSelect(group);
      onPick(group);
    },
    [ar, onPick, onSelect],
  );
  const pickMarker = useCallback(
    (id: string) => {
      const groupId = MARKER_GROUP[id] ?? id;
      if (pickGroup(groupId)) {
        onSelect(groupId);
        onPick(groupId);
      }
    },
    [onPick, onSelect],
  );

  useEffect(() => setLabel(null), [focus, dir]);

  return (
    <>
      <Lights />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.09}
        minDistance={0.05}
        maxDistance={30}
        rotateSpeed={0.8}
      />
      <CameraRig goal={goal} />
      <LabelProjector reg={reg} />
      <Suspense fallback={null}>
        <Model
          file="skeleton"
          plan={plan}
          focus={focus}
          scene={scene}
          selected={selected}
          registry={registry}
          onReady={onReady}
          onPick={pick}
        />
      </Suspense>
      {plan.muscles.size > 0 && (
        <Suspense fallback={null}>
          <Model
            file="muscles"
            plan={plan}
            focus={focus}
            scene={scene}
            selected={selected}
            registry={registry}
            onReady={onReady}
            onPick={pick}
          />
        </Suspense>
      )}
      {ann.markers.map((m) => (
        <Marker
          key={m.id}
          reg={reg}
          spec={m}
          size={ann.size}
          active={
            scene.highlight.includes(MARKER_GROUP[m.id] ?? m.id) ||
            selected === (MARKER_GROUP[m.id] ?? m.id)
          }
          onClick={pickMarker}
        />
      ))}
      {ann.tubes.map((tb) => (
        <group key={tb.id}>
          <Tube
            points={tb.points}
            radius={ann.size * 0.8}
            color={tb.color}
            active={selected === tb.id || scene.highlight.includes(tb.id)}
            onClick={() => pickMarker(tb.id)}
          />
          <RegLabel reg={reg} id={`t-${tb.id}`} pos={tb.points[1]!} text={tb.label} />
        </group>
      ))}
      {ann.rings.map((r) => (
        <group
          key={r.id}
          position={r.center}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[r.rx, r.rz, 1]}
        >
          <mesh>
            <torusGeometry args={[1, 0.035, 8, 64]} />
            <meshBasicMaterial color={r.color} depthTest={false} transparent opacity={0.9} />
          </mesh>
        </group>
      ))}
      {ann.rings.map((r) => (
        <RegLabel
          key={`rl-${r.id}`}
          reg={reg}
          id={`r-${r.id}`}
          pos={
            new THREE.Vector3(
              r.center.x,
              r.center.y,
              r.center.z + (r.id === "female" ? 1 : -1) * r.rz * 1.12,
            )
          }
          text={r.label}
          dy={r.id === "female" ? -14 : 14}
        />
      ))}
      {label && (
        <RegLabel
          reg={reg}
          id="selected"
          pos={label.pos}
          text={label.text}
          className="rounded-xl border border-amber-300 bg-black/85 px-2.5 py-1 text-xs font-bold text-amber-200"
        />
      )}
    </>
  );
}

/** Annotation marker id → the pick group it answers for. */
const MARKER_GROUP: Record<string, string> = {
  "v-body": "vertebra-body",
  "v-spinous": "vertebra-spinous",
  "v-trans-l": "vertebra-transverse",
  "v-trans-r": "vertebra-transverse",
  "v-sup-l": "vertebra-sup-articular",
  "v-sup-r": "vertebra-sup-articular",
  "v-inf-l": "vertebra-inf-articular",
  "v-inf-r": "vertebra-inf-articular",
  "v-canal": "vertebra-canal",
};

export interface BoneCanvasProps {
  focus: HumanFocus;
  scene: SceneState;
  selected: string | null;
  ar: boolean;
  onPick: (group: string) => void;
  onSelect: (group: string | null) => void;
}

/** The 3D host: camera-direction buttons on top, the canvas below. */
export default function BoneCanvas(props: BoneCanvasProps) {
  const plan = useMemo(
    () =>
      planFocus(props.focus, {
        skeleton: SKELETON_NODES,
        muscles: MUSCLE_NODES,
        jointKind: props.scene.jointKind,
      }),
    [props.focus, props.scene.jointKind],
  );
  const reg = useLabelRegistry();
  const [dirState, setDir] = useState<{ focus: HumanFocus; dir: Dir } | null>(null);
  const dir = dirState?.focus === props.focus ? dirState.dir : plan.dirs[0]!;

  useEffect(() => () => void (document.body.style.cursor = ""), []);

  return (
    <div className="relative h-full min-h-[320px] w-full touch-none overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-800">
      <Canvas
        camera={{ fov: 38, near: 0.01, far: 140, position: [0, 0.4, 9] }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, powerPreference: "high-performance", localClippingEnabled: true }}
        aria-label={props.ar ? "مجسم ثلاثي الأبعاد للهيكل العظمي" : "3D skeleton model"}
        onPointerMissed={() => props.onSelect(null)}
      >
        <World
          reg={reg}
          focus={props.focus}
          dir={dir}
          scene={props.scene}
          ar={props.ar}
          onPick={props.onPick}
          selected={props.selected}
          onSelect={props.onSelect}
        />
      </Canvas>
      <LabelOverlay reg={reg} />
      <div className="absolute start-2 top-2 flex gap-1" dir={props.ar ? "rtl" : "ltr"}>
        {plan.dirs.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDir({ focus: props.focus, dir: d })}
            aria-pressed={d === dir}
            className={
              "rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur " +
              (d === dir
                ? "border-amber-300 bg-amber-300/25 text-amber-100"
                : "border-white/20 bg-black/40 text-white/80 hover:bg-white/10")
            }
          >
            {props.ar ? DIR_LABEL[d].ar : DIR_LABEL[d].en}
          </button>
        ))}
      </div>
    </div>
  );
}
