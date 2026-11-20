import { useFrame } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { biconcaveDisc, brainGeometry, buildTube } from "./adr3d-geometry";
import {
  advance,
  ARTERY_POINTS,
  arteryRadius,
  cardiac,
  type Live,
  type Station,
  type Vec3,
} from "./adr3d-model";
import { rand } from "./sceneUtils";

/** Shared heartbeat: updated once per frame (before everything else), read by every organ. */
export interface Beat {
  clock: { t: number; acc: number };
  phase: number;
  c: ReturnType<typeof cardiac>;
}
export const newBeat = (): Beat => ({ clock: { t: 0, acc: 0 }, phase: 0, c: cardiac(0) });

/** Disposes a three.js resource (geometry / material) created outside of JSX when it is replaced. */
export function useDispose(resource: { dispose: () => void }) {
  useEffect(() => () => resource.dispose(), [resource]);
}

export function BeatDriver({ live, beat }: { live: RefObject<Live>; beat: RefObject<Beat> }) {
  useFrame(() => {
    const l = live.current;
    const b = beat.current;
    b.phase = advance(b.clock, l.t, l.drive.p.hr / 60);
    b.c = cardiac(b.phase);
  }, -2);
  return null;
}

const RED = new THREE.Color("#ef4444");
const WARN = new THREE.Color("#f59e0b");
const GREEN = new THREE.Color("#22c55e");
const tmpColor = new THREE.Color();

/** Click + hover behaviour shared by the organs: a pointer cursor and a highlight flag. */
function useHover() {
  const [hover, setHover] = useState(false);
  useEffect(() => {
    document.body.style.cursor = hover ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hover]);
  return {
    hover,
    handlers: {
      onPointerOver: (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        setHover(true);
      },
      onPointerOut: () => setHover(false),
    },
  };
}

/** Translucent anatomical silhouette. */
export const BodyShell = memo(function BodyShell() {
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#7dd3fc",
        transparent: true,
        opacity: 0.09,
        roughness: 0.2,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [],
  );
  useDispose(material);
  return (
    <group>
      <mesh position={[0, 2.05, 0]} material={material}>
        <sphereGeometry args={[0.5, 32, 24]} />
      </mesh>
      <mesh position={[0, 1.52, 0]} material={material}>
        <cylinderGeometry args={[0.19, 0.24, 0.4, 20]} />
      </mesh>
      <mesh position={[0, 0.5, 0]} material={material}>
        <capsuleGeometry args={[0.55, 1.15, 8, 24]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 1.0, 0.45, 0]} rotation={[0, 0, s * 0.16]} material={material}>
            <capsuleGeometry args={[0.16, 1.25, 8, 16]} />
          </mesh>
          <mesh position={[s * 0.3, -1.45, 0]} material={material}>
            <capsuleGeometry args={[0.22, 1.7, 8, 16]} />
          </mesh>
        </group>
      ))}
    </group>
  );
});

const curve = (pts: Vec3[]) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));

/** Glowing vessel network (pulses with each beat) and nerve network (brightens with brain activity). */
export const Networks = memo(function Networks({
  live,
  beat,
  neural,
  hazard,
}: {
  live: RefObject<Live>;
  beat: RefObject<Beat>;
  neural: boolean;
  hazard: number;
}) {
  const parts = useMemo(() => {
    const vessels = [
      curve([
        [0.12, 0.85, 0.05],
        [0.7, 1.0, 0],
        [1.05, 0.4, 0],
        [1.2, -0.1, 0],
      ]),
      curve([
        [0.12, 0.85, 0.05],
        [-0.55, 1.0, 0],
        [-0.95, 0.4, 0],
        [-1.1, -0.1, 0],
      ]),
      curve([
        [0.1, 0.3, 0.05],
        [0.3, -0.6, 0.05],
        [0.32, -1.5, 0.05],
        [0.3, -2.7, 0.05],
      ]),
      curve([
        [0.1, 0.3, 0.05],
        [-0.25, -0.6, 0.05],
        [-0.3, -1.5, 0.05],
        [-0.3, -2.7, 0.05],
      ]),
    ].map((c) => new THREE.TubeGeometry(c, 40, 0.028, 8));
    const nerves = [
      curve([
        [0, 1.9, -0.12],
        [0, 1.2, -0.2],
        [0, 0.2, -0.22],
        [0, -0.5, -0.16],
      ]),
      curve([
        [0, 1.1, -0.2],
        [0.7, 0.9, -0.12],
        [1.05, 0.3, -0.05],
        [1.2, -0.2, -0.05],
      ]),
      curve([
        [0, 1.1, -0.2],
        [-0.7, 0.9, -0.12],
        [-1.0, 0.3, -0.05],
        [-1.1, -0.2, -0.05],
      ]),
      curve([
        [0, -0.4, -0.18],
        [0.3, -1.4, -0.1],
        [0.3, -2.7, -0.1],
      ]),
      curve([
        [0, -0.4, -0.18],
        [-0.28, -1.4, -0.1],
        [-0.3, -2.7, -0.1],
      ]),
    ];
    return {
      vessels,
      nerves,
      nerveGeo: nerves.map((c) => new THREE.TubeGeometry(c, 40, 0.014, 6)),
      spine: nerves[0]!,
    };
  }, []);
  useEffect(
    () => () => {
      parts.vessels.forEach((g) => g.dispose());
      parts.nerveGeo.forEach((g) => g.dispose());
    },
    [parts],
  );

  const vesselMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#7f1d1d",
        emissive: "#dc2626",
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.85,
      }),
    [],
  );
  const nerveMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0e7490",
        emissive: "#22d3ee",
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9,
      }),
    [],
  );
  useDispose(vesselMat);
  useDispose(nerveMat);
  const pulses = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const travel = useRef({ t: 0, acc: 0 });
  const PULSES = 10;

  useFrame(() => {
    const l = live.current;
    const b = beat.current;
    vesselMat.emissiveIntensity = 0.5 + 1.4 * b.c.systole + (hazard === 2 ? 0.6 : 0);
    vesselMat.emissive.set(hazard > 0 ? "#b91c1c" : "#dc2626");
    nerveMat.emissiveIntensity = neural ? 0.4 + 1.6 * l.drive.nerveAmp : 0.1;
    const mesh = pulses.current;
    if (!mesh) return;
    const acc = advance(travel.current, l.t, 0.18 * l.drive.nerveRate);
    mesh.count = neural ? Math.round(PULSES * l.drive.nerveAmp) : 0;
    for (let i = 0; i < mesh.count; i++) {
      const u = (acc + i / PULSES) % 1;
      dummy.position.copy(parts.spine.getPoint(u));
      dummy.scale.setScalar(0.04 + 0.02 * l.drive.nerveAmp);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {parts.vessels.map((g, i) => (
        <mesh key={`v${i}`} geometry={g} material={vesselMat} />
      ))}
      {parts.nerveGeo.map((g, i) => (
        <mesh key={`n${i}`} geometry={g} material={nerveMat} />
      ))}
      <instancedMesh ref={pulses} args={[undefined, undefined, PULSES]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshBasicMaterial color="#a5f3fc" />
      </instancedMesh>
    </group>
  );
});
/** The brain organ: colour follows the live brain response; click flies to the neuron. */
export const Brain = memo(function Brain({
  live,
  onStation,
}: {
  live: RefObject<Live>;
  onStation: (s: Station) => void;
}) {
  const geometry = useMemo(() => brainGeometry(0.38), []);
  useDispose(geometry);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const { hover, handlers } = useHover();
  useFrame(() => {
    const m = mat.current;
    if (!m) return;
    const brain = live.current.drive.p.brain;
    tmpColor.copy(brain < 40 ? RED : brain < 70 ? WARN : GREEN);
    m.color.copy(tmpColor).multiplyScalar(0.55);
    m.emissive.copy(tmpColor);
    m.emissiveIntensity = (0.1 + (brain / 100) * 0.7) * (hover ? 1.6 : 1);
  });
  return (
    <mesh
      geometry={geometry}
      position={[0, 2.07, 0.02]}
      onClick={(e) => {
        e.stopPropagation();
        onStation("nerve");
      }}
      {...handlers}
    >
      <meshStandardMaterial ref={mat} roughness={0.55} transparent opacity={0.92} />
    </mesh>
  );
});

/** Working muscle (biceps): flexes with adrenaline; click flies to its sarcomere. */
export const Muscle = memo(function Muscle({
  live,
  onStation,
}: {
  live: RefObject<Live>;
  onStation: (s: Station) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const { hover, handlers } = useHover();
  const clock = useRef({ t: 0, acc: 0 });
  useFrame(() => {
    const l = live.current;
    const acc = advance(clock.current, l.t, l.drive.muscleFreq);
    const c = l.drive.muscleAmp * (0.5 - 0.5 * Math.cos(acc * Math.PI * 2));
    ref.current?.scale.set(0.2 * (1 + 0.35 * c), 0.45 * (1 - 0.22 * c), 0.2 * (1 + 0.35 * c));
    if (mat.current) mat.current.emissiveIntensity = (0.15 + 0.6 * c) * (hover ? 1.8 : 1);
  });
  return (
    <mesh
      ref={ref}
      position={[1.03, 0.4, 0]}
      rotation={[0, 0, 0.16]}
      onClick={(e) => {
        e.stopPropagation();
        onStation("muscle");
      }}
      {...handlers}
    >
      <sphereGeometry args={[1, 24, 18]} />
      <meshStandardMaterial ref={mat} color="#9f1239" emissive="#fb7185" roughness={0.6} />
    </mesh>
  );
});

function Valve({
  position,
  radius,
  open,
  dir,
  beat,
}: {
  position: Vec3;
  radius: number;
  open: (b: Beat) => number;
  /** +1 swings the leaflets up (ejection), -1 down (filling). */
  dir: 1 | -1;
  beat: RefObject<Beat>;
}) {
  const a = useRef<THREE.Group>(null);
  const b = useRef<THREE.Group>(null);
  useFrame(() => {
    const swing = open(beat.current) * 1.15 * dir;
    if (a.current) a.current.rotation.x = swing;
    if (b.current) b.current.rotation.x = -swing;
  });
  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <torusGeometry args={[radius, radius * 0.18, 8, 20]} />
        <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={0.5} />
      </mesh>
      {/* Two leaflets hinged on the ring: flat across the opening when closed, swung aside when open. */}
      <group ref={a} position={[0, radius, 0]}>
        <mesh position={[0, -radius / 2, 0]}>
          <planeGeometry args={[radius * 1.7, radius]} />
          <meshStandardMaterial
            color="#fecaca"
            side={THREE.DoubleSide}
            transparent
            opacity={0.85}
          />
        </mesh>
      </group>
      <group ref={b} position={[0, -radius, 0]}>
        <mesh position={[0, radius / 2, 0]}>
          <planeGeometry args={[radius * 1.7, radius]} />
          <meshStandardMaterial
            color="#fecaca"
            side={THREE.DoubleSide}
            transparent
            opacity={0.85}
          />
        </mesh>
      </group>
    </group>
  );
}

/** Four-chambered heart with four valves, beating at the live bpm. */
export const Heart3D = memo(function Heart3D({
  live,
  beat,
  onStation,
}: {
  live: RefObject<Live>;
  beat: RefObject<Beat>;
  onStation: (s: Station) => void;
}) {
  const lv = useRef<THREE.Mesh>(null);
  const rv = useRef<THREE.Mesh>(null);
  const la = useRef<THREE.Mesh>(null);
  const ra = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const { hover, handlers } = useHover();
  const wall = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#b91c1c",
        emissive: "#dc2626",
        transparent: true,
        opacity: 0.42,
        roughness: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [],
  );
  useDispose(wall);

  useFrame(() => {
    const c = beat.current.c;
    const fast = live.current.drive.p.hr >= 150;
    lv.current?.scale.set(0.19, 0.27 * (1 - 0.16 * c.systole), 0.19 * (1 - 0.1 * c.systole));
    rv.current?.scale.set(0.17, 0.24 * (1 - 0.14 * c.systole), 0.17 * (1 - 0.1 * c.systole));
    la.current?.scale.setScalar(0.13 * (1 - 0.1 * c.atrial));
    ra.current?.scale.setScalar(0.13 * (1 - 0.1 * c.atrial));
    wall.emissive.set(fast ? "#f59e0b" : "#dc2626");
    wall.emissiveIntensity = (0.25 + 0.6 * c.systole) * (hover ? 1.7 : 1);
    if (light.current) light.current.intensity = 0.4 + 2.2 * c.systole;
  });

  return (
    <group
      position={[0.12, 0.62, 0.05]}
      onClick={(e) => {
        e.stopPropagation();
        onStation("heart");
      }}
      {...handlers}
    >
      <mesh ref={lv} position={[0.07, -0.1, 0]} material={wall}>
        <sphereGeometry args={[1, 24, 18]} />
      </mesh>
      <mesh ref={rv} position={[-0.09, -0.07, 0.05]} material={wall}>
        <sphereGeometry args={[1, 24, 18]} />
      </mesh>
      <mesh ref={la} position={[0.09, 0.17, -0.07]} material={wall}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
      <mesh ref={ra} position={[-0.11, 0.15, 0.04]} material={wall}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
      <mesh position={[0.02, 0.32, 0]} material={wall}>
        <cylinderGeometry args={[0.045, 0.055, 0.18, 14]} />
      </mesh>
      {/* Mitral & tricuspid (AV) valves open during filling; aortic & pulmonary during ejection. */}
      <Valve
        position={[0.08, 0.04, -0.03]}
        radius={0.055}
        open={(b) => b.c.avOpen}
        dir={-1}
        beat={beat}
      />
      <Valve
        position={[-0.1, 0.04, 0.04]}
        radius={0.055}
        open={(b) => b.c.avOpen}
        dir={-1}
        beat={beat}
      />
      <Valve
        position={[0.03, 0.2, -0.01]}
        radius={0.04}
        open={(b) => b.c.slOpen}
        dir={1}
        beat={beat}
      />
      <Valve
        position={[-0.05, 0.2, 0.08]}
        radius={0.04}
        open={(b) => b.c.slOpen}
        dir={1}
        beat={beat}
      />
      <pointLight ref={light} color="#ff5a5a" distance={1.2} intensity={0.6} />
    </group>
  );
});
const RBC = 80;
const GLUCOSE = 60;
const ADRENALINE = 40;

/**
 * The arterial tunnel (translucent tube whose calibre follows adrenaline and the narrowing fault)
 * with instanced red cells, oxygen, glucose and glowing adrenaline moving at the live blood speed.
 */
export const Artery = memo(function Artery({
  live,
  dilation,
  stenosis,
  signals,
}: {
  live: RefObject<Live>;
  dilation: number;
  stenosis: number;
  signals: boolean;
}) {
  const path = useMemo(() => curve(ARTERY_POINTS), []);
  const frames = useMemo(() => path.computeFrenetFrames(90, false), [path]);
  const tube = useMemo(
    () => buildTube(path, 90, 16, (u) => arteryRadius(u, dilation, stenosis)),
    [path, dilation, stenosis],
  );
  const disc = useMemo(() => biconcaveDisc(), []);
  useDispose(tube);
  useDispose(disc);

  const rbc = useRef<THREE.InstancedMesh>(null);
  const o2 = useRef<THREE.InstancedMesh>(null);
  const sugar = useRef<THREE.InstancedMesh>(null);
  const adr = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const point = useMemo(() => new THREE.Vector3(), []);
  const flowClock = useRef({ t: 0, acc: 0 });

  /** Position inside the tube at curve fraction u, offset by (angle, radial fraction). */
  const place = (u: number, angle: number, rho: number, out: THREE.Object3D) => {
    const i = Math.min(90, Math.round(u * 90));
    path.getPoint(u, point);
    const n = frames.normals[i]!;
    const b = frames.binormals[i]!;
    const r = arteryRadius(u, dilation, stenosis) * rho;
    out.position.set(
      point.x + (n.x * Math.cos(angle) + b.x * Math.sin(angle)) * r,
      point.y + (n.y * Math.cos(angle) + b.y * Math.sin(angle)) * r,
      point.z + (n.z * Math.cos(angle) + b.z * Math.sin(angle)) * r,
    );
  };

  useFrame(() => {
    const l = live.current;
    const running = l.flow;
    const acc = running
      ? advance(flowClock.current, l.t, l.drive.bloodSpeed)
      : flowClock.current.acc;
    const spin = flowClock.current.acc * 5;

    const cells = rbc.current;
    const oxy = o2.current;
    if (cells && oxy) {
      const withO2 = Math.round(RBC * Math.min(1, Math.max(0, (l.values.oxygen - 55) / 43)));
      cells.count = RBC;
      oxy.count = withO2;
      for (let i = 0; i < RBC; i++) {
        const u = (acc * (0.85 + rand(i, 7) * 0.3) + i / RBC) % 1;
        const angle = rand(i, 1) * Math.PI * 2;
        place(u, angle, 0.15 + rand(i, 2) * 0.65, dummy);
        dummy.rotation.set(
          rand(i, 3) * 3 + spin * 0.4,
          rand(i, 4) * 3,
          rand(i, 5) * 3 + spin * 0.3,
        );
        dummy.scale.setScalar(0.016);
        dummy.updateMatrix();
        cells.setMatrixAt(i, dummy.matrix);
        if (i < withO2) {
          dummy.position.y += 0.012;
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(0.0065);
          dummy.updateMatrix();
          oxy.setMatrixAt(i, dummy.matrix);
        }
      }
      cells.instanceMatrix.needsUpdate = true;
      oxy.instanceMatrix.needsUpdate = true;
    }

    const glu = sugar.current;
    if (glu) {
      glu.count = Math.round((l.values.glucose / 300) * (GLUCOSE - 4)) + 4;
      for (let i = 0; i < glu.count; i++) {
        const u = (acc * 0.9 + i / GLUCOSE + rand(i, 11) * 0.02) % 1;
        place(u, rand(i, 12) * Math.PI * 2, 0.2 + rand(i, 13) * 0.7, dummy);
        dummy.rotation.set(spin * 0.2 + i, spin * 0.3, 0);
        dummy.scale.setScalar(0.009);
        dummy.updateMatrix();
        glu.setMatrixAt(i, dummy.matrix);
      }
      glu.instanceMatrix.needsUpdate = true;
    }

    const mol = adr.current;
    if (mol) {
      mol.count = Math.round((l.drive.a * ADRENALINE) | 0);
      const size = signals ? 0.013 : 0.009;
      for (let i = 0; i < mol.count; i++) {
        const u = (acc * 1.1 + i / ADRENALINE + rand(i, 21) * 0.03) % 1;
        place(u, rand(i, 22) * Math.PI * 2, 0.25 + rand(i, 23) * 0.6, dummy);
        dummy.rotation.set(spin, spin * 0.6 + i, 0);
        dummy.scale.setScalar(size * (1 + 0.25 * Math.sin(l.t * 6 + i)));
        dummy.updateMatrix();
        mol.setMatrixAt(i, dummy.matrix);
      }
      mol.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <mesh geometry={tube}>
        <meshPhysicalMaterial
          color={stenosis ? "#f59e0b" : "#fb7185"}
          emissive={stenosis ? "#92400e" : "#7f1d1d"}
          emissiveIntensity={0.5}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
          roughness={0.3}
        />
      </mesh>
      <instancedMesh ref={rbc} args={[disc, undefined, RBC]} frustumCulled={false}>
        <meshStandardMaterial color="#e11d48" emissive="#9f1239" emissiveIntensity={0.5} />
      </instancedMesh>
      <instancedMesh ref={o2} args={[undefined, undefined, RBC]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={0.9} />
      </instancedMesh>
      <instancedMesh ref={sugar} args={[undefined, undefined, GLUCOSE]} frustumCulled={false}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.7} />
      </instancedMesh>
      <instancedMesh ref={adr} args={[undefined, undefined, ADRENALINE]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#facc15"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
});

/** A pulsing, clickable 3D marker that flies the camera to a station (its label is a DOM overlay). */
export function Hotspot({
  station,
  position,
  current,
  onStation,
}: {
  station: Station;
  position: Vec3;
  /** The station the camera is at: its own marker is hidden. */
  current: Station;
  onStation: (s: Station) => void;
}) {
  const ring = useRef<THREE.Mesh>(null);
  const here = useMemo(() => new THREE.Vector3(...position), [position]);
  useFrame(({ clock, camera }) => {
    // Markers keep a readable on-screen size at any zoom level.
    const size = THREE.MathUtils.clamp(camera.position.distanceTo(here) / 7.4, 0.12, 1.2);
    ring.current?.scale.setScalar(
      size * (1 + 0.25 * Math.sin(clock.elapsedTime * 3 + position[0])),
    );
  });
  const { handlers } = useHover();
  return (
    <mesh
      ref={ring}
      position={position}
      visible={station !== current}
      onClick={(e) => {
        e.stopPropagation();
        onStation(station);
      }}
      {...handlers}
    >
      <sphereGeometry args={[0.055, 16, 12]} />
      <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} toneMapped={false} />
    </mesh>
  );
}
