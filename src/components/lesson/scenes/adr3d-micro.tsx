import { useFrame } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useDispose } from "./adr3d-core";
import {
  buildTube,
  fiberGeometry,
  headGeometry,
  myelinGeometry,
  receptorGeometry,
  somaGeometry,
  zDiscGeometry,
} from "./adr3d-geometry";
import { advance, MUSCLE_AT, NERVE_AT, SIGNAL_AT, type Live } from "./adr3d-model";
import { rand } from "./sceneUtils";

/** Physically-based "medical illustration" material: glossy clearcoat, soft sheen, reflects the studio. */
const organic = (color: string, extra: THREE.MeshPhysicalMaterialParameters = {}) =>
  new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.38,
    metalness: 0,
    clearcoat: 0.7,
    clearcoatRoughness: 0.25,
    sheen: 0.5,
    sheenRoughness: 0.5,
    envMapIntensity: 1.2,
    ...extra,
  });

const HEX: [number, number][] = [
  [0, 0],
  ...Array.from({ length: 6 }, (_, i): [number, number] => [
    Math.cos((i / 6) * Math.PI * 2) * 0.2,
    Math.sin((i / 6) * Math.PI * 2) * 0.2,
  ]),
];
const ACTIN_PER_SIDE = 12;
const HEADS_PER_SIDE = 6;
const CA = 44;

/**
 * Muscle sarcomere: Z-discs, curved myosin filaments with swinging cross-bridge heads, thin actin
 * filaments that slide inward in contraction cycles, and glowing Ca²⁺. The cycle rate follows the
 * adrenaline response; its depth follows the oxygen and glucose that fuel it (and a beta blocker).
 */
export const Sarcomere = memo(function Sarcomere({ live }: { live: RefObject<Live> }) {
  const heads = useRef<THREE.InstancedMesh>(null);
  const actin = useRef<THREE.InstancedMesh>(null);
  const calcium = useRef<THREE.InstancedMesh>(null);
  const zLeft = useRef<THREE.Mesh>(null);
  const zRight = useRef<THREE.Mesh>(null);
  const clock = useRef({ t: 0, acc: 0 });
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geo = useMemo(
    () => ({
      thick: fiberGeometry(2.0, 0.055, 0.012, 3),
      thin: fiberGeometry(1.3, 0.024, 0.02, 5),
      head: headGeometry(),
      disc: zDiscGeometry(),
    }),
    [],
  );
  const mats = useMemo(
    () => ({
      thick: organic("#fb923c", { emissive: new THREE.Color("#c2410c"), emissiveIntensity: 0.3 }),
      thin: organic("#7dd3fc", { emissive: new THREE.Color("#0369a1"), emissiveIntensity: 0.3 }),
      head: organic("#fdba74", { emissive: new THREE.Color("#ea580c"), emissiveIntensity: 0.3 }),
      disc: organic("#a78bfa", {
        emissive: new THREE.Color("#6d28d9"),
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.62,
        side: THREE.DoubleSide,
      }),
    }),
    [],
  );
  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose());
      Object.values(mats).forEach((m) => m.dispose());
    },
    [geo, mats],
  );
  const grey = useMemo(() => new THREE.Color("#6b7280"), []);
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const l = live.current;
    const d = l.drive;
    const acc = advance(clock.current, l.t, d.muscleFreq);
    const wave = 0.5 - 0.5 * Math.cos(acc * Math.PI * 2);
    const c = d.muscleAmp * wave;
    const slide = 0.5 * c;

    // Tired muscle (little oxygen / glucose) greys out; Ca²⁺ and glow follow the drive.
    tmp.set("#fb923c").lerp(grey, 1 - d.energy);
    mats.thick.color.copy(tmp);
    mats.head.color.copy(tmp);
    mats.thick.emissiveIntensity = 0.1 + 0.5 * d.energy;
    tmp.set("#7dd3fc").lerp(grey, 1 - d.energy);
    mats.thin.color.copy(tmp);

    zLeft.current?.position.set(-(1.8 - slide), 0, 0);
    zRight.current?.position.set(1.8 - slide, 0, 0);

    const a = actin.current;
    if (a) {
      for (let side = 0; side < 2; side++) {
        const s = side === 0 ? -1 : 1;
        for (let k = 0; k < ACTIN_PER_SIDE; k++) {
          const ring = k < 6 ? 0.36 : 0.62;
          const ang = ((k % 6) / 6) * Math.PI * 2 + (k < 6 ? 0 : Math.PI / 6);
          dummy.position.set(s * (1.8 - slide - 0.65), Math.cos(ang) * ring, Math.sin(ang) * ring);
          dummy.rotation.set(k * 0.9, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          a.setMatrixAt(side * ACTIN_PER_SIDE + k, dummy.matrix);
        }
      }
      a.instanceMatrix.needsUpdate = true;
    }

    const h = heads.current;
    if (h) {
      let i = 0;
      for (const [fy, fz] of HEX) {
        for (let side = 0; side < 2; side++) {
          const s = side === 0 ? -1 : 1;
          for (let k = 0; k < HEADS_PER_SIDE; k++) {
            const phi = k * 1.05 + side * 0.5 + fy * 9;
            // Heads ratchet towards the M-line while the muscle shortens, and recover afterwards.
            const swing = Math.sin(acc * Math.PI * 2 * 2 + k * 0.9 + fz * 7) * d.muscleAmp;
            dummy.position.set(
              s * (0.14 + k * 0.15) - s * 0.045 * swing,
              fy + Math.cos(phi) * 0.06,
              fz + Math.sin(phi) * 0.06,
            );
            dummy.rotation.set(phi, 0, -s * (0.55 + 0.7 * swing));
            dummy.scale.setScalar(0.085);
            dummy.updateMatrix();
            h.setMatrixAt(i++, dummy.matrix);
          }
        }
      }
      h.instanceMatrix.needsUpdate = true;
    }

    const ca = calcium.current;
    if (ca) {
      ca.count = Math.round(CA * d.calcium * (0.3 + 0.7 * wave));
      for (let i = 0; i < ca.count; i++) {
        dummy.position.set(
          rand(i, 3) * 3.0 - 1.5 + Math.sin(l.t * 2 + i) * 0.05,
          (rand(i, 4) - 0.5) * 1.5 + Math.cos(l.t * 1.7 + i) * 0.06,
          (rand(i, 5) - 0.5) * 1.5 + Math.sin(l.t * 1.3 + i * 2) * 0.06,
        );
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(0.035);
        dummy.updateMatrix();
        ca.setMatrixAt(i, dummy.matrix);
      }
      ca.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group position={MUSCLE_AT}>
      <pointLight position={[0, 1.8, 2.2]} color="#ffd9b0" intensity={3} distance={9} />
      <pointLight position={[-2, -1.2, -1.5]} color="#7dd3fc" intensity={2.2} distance={9} />
      {HEX.map(([y, z], i) => (
        <mesh key={i} position={[0, y, z]} geometry={geo.thick} material={mats.thick} />
      ))}
      <instancedMesh
        ref={heads}
        args={[geo.head, mats.head, HEX.length * 2 * HEADS_PER_SIDE]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={actin}
        args={[geo.thin, mats.thin, ACTIN_PER_SIDE * 2]}
        frustumCulled={false}
      />
      {[zLeft, zRight].map((r, i) => (
        <mesh
          key={i}
          ref={r}
          geometry={geo.disc}
          material={mats.disc}
          rotation={[0, 0, Math.PI / 2]}
        />
      ))}
      <instancedMesh ref={calcium} args={[undefined, undefined, CA]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial color="#bef264" toneMapped={false} />
      </instancedMesh>
    </group>
  );
});

const PULSES = 6;
const VESICLES = 26;
const RECEPTORS = 14;

/** Neuron + synapse: organic soma, tapered dendrites, myelinated axon, terminals and neurotransmitter release. */
export const Neuron = memo(function Neuron({ live }: { live: RefObject<Live> }) {
  const parts = useMemo(() => {
    const dendrites = Array.from({ length: 9 }, (_, k) => {
      const th = 1.9 + rand(k, 1) * 1.3;
      const ph = rand(k, 2) * Math.PI * 2;
      const dir = new THREE.Vector3(
        Math.cos(th),
        Math.sin(th) * Math.cos(ph),
        Math.sin(th) * Math.sin(ph),
      ).normalize();
      const start = dir
        .clone()
        .multiplyScalar(0.46)
        .add(new THREE.Vector3(-2.7, 0, 0));
      const mid = dir
        .clone()
        .multiplyScalar(1.15)
        .add(
          new THREE.Vector3(
            -2.7 + (rand(k, 3) - 0.5) * 0.3,
            (rand(k, 4) - 0.5) * 0.4,
            (rand(k, 5) - 0.5) * 0.4,
          ),
        );
      const end = dir
        .clone()
        .multiplyScalar(2.0)
        .add(new THREE.Vector3(-2.7, (rand(k, 6) - 0.5) * 0.7, (rand(k, 7) - 0.5) * 0.7));
      return buildTube(
        new THREE.CatmullRomCurve3([start, mid, end]),
        24,
        10,
        (u) => 0.085 * (1 - u) ** 0.8 + 0.012,
      );
    });
    const axon = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.2, 0, 0),
      new THREE.Vector3(-0.9, 0.18, 0.1),
      new THREE.Vector3(0.5, -0.12, 0),
      new THREE.Vector3(1.75, 0.04, 0),
    ]);
    return {
      dendrites,
      axon,
      axonGeo: buildTube(axon, 60, 12, () => 0.05),
      soma: somaGeometry(0.5),
      nucleus: somaGeometry(0.2),
      bulb: somaGeometry(0.15),
      post: somaGeometry(1.6),
      myelin: myelinGeometry(),
      receptor: receptorGeometry(),
    };
  }, []);
  useEffect(
    () => () => {
      parts.dendrites.forEach((g) => g.dispose());
      parts.axonGeo.dispose();
      for (const g of [
        parts.soma,
        parts.nucleus,
        parts.bulb,
        parts.post,
        parts.myelin,
        parts.receptor,
      ])
        g.dispose();
    },
    [parts],
  );

  const mats = useMemo(
    () => ({
      soma: organic("#14b8a6", {
        emissive: new THREE.Color("#2dd4bf"),
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.93,
      }),
      nucleus: organic("#99f6e4", { emissive: new THREE.Color("#5eead4"), emissiveIntensity: 0.5 }),
      process: organic("#0f766e", { emissive: new THREE.Color("#14b8a6"), emissiveIntensity: 0.5 }),
      myelin: organic("#fde68a", {
        emissive: new THREE.Color("#f59e0b"),
        emissiveIntensity: 0.18,
        transparent: true,
        opacity: 0.82,
        clearcoat: 1,
      }),
      bulb: organic("#5eead4", { emissive: new THREE.Color("#14b8a6"), emissiveIntensity: 0.6 }),
      post: organic("#1e3a8a", {
        emissive: new THREE.Color("#3b82f6"),
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      receptor: organic("#93c5fd", {
        emissive: new THREE.Color("#60a5fa"),
        emissiveIntensity: 0.8,
      }),
    }),
    [],
  );
  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => m.dispose());
    },
    [mats],
  );

  const pulses = useRef<THREE.InstancedMesh>(null);
  const vesicles = useRef<THREE.InstancedMesh>(null);
  const receptors = useRef<THREE.InstancedMesh>(null);
  const clock = useRef({ t: 0, acc: 0 });
  const release = useRef({ t: 0, acc: 0 });
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const POST = useMemo(() => new THREE.Vector3(4.15, 0, 0), []);
  const BULBS = useMemo(
    () => [
      new THREE.Vector3(1.98, 0.28, 0.16),
      new THREE.Vector3(2.02, 0, 0),
      new THREE.Vector3(1.98, -0.28, -0.16),
    ],
    [],
  );
  const targets = useMemo(
    () =>
      Array.from({ length: RECEPTORS }, (_, i) => {
        const d = new THREE.Vector3(
          -1,
          (rand(i, 31) - 0.5) * 0.9,
          (rand(i, 32) - 0.5) * 0.9,
        ).normalize();
        return POST.clone().addScaledVector(d, 1.6);
      }),
    [POST],
  );
  const myelinPlacements = useMemo(
    () =>
      [0.05, 0.22, 0.39, 0.56, 0.73].map((u) => ({
        u,
        position: parts.axon.getPoint(u),
        quaternion: new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          parts.axon.getTangent(u),
        ),
      })),
    [parts],
  );

  useFrame(() => {
    const l = live.current;
    const d = l.drive;
    mats.soma.emissiveIntensity = 0.1 + 0.9 * d.nerveAmp;
    mats.process.emissiveIntensity = 0.1 + 0.6 * d.nerveAmp;

    const acc = advance(clock.current, l.t, 0.16 * d.nerveRate);
    const p = pulses.current;
    if (p) {
      p.count = Math.max(1, Math.round(PULSES * d.nerveAmp));
      for (let i = 0; i < p.count; i++) {
        dummy.position.copy(parts.axon.getPoint((acc + i / PULSES) % 1));
        dummy.scale.setScalar(0.085 * (0.5 + 0.5 * d.nerveAmp));
        dummy.updateMatrix();
        p.setMatrixAt(i, dummy.matrix);
      }
      p.instanceMatrix.needsUpdate = true;
    }

    const racc = advance(release.current, l.t, 0.25 * d.nerveRate);
    const v = vesicles.current;
    if (v) {
      v.count = Math.round(2 + (VESICLES - 2) * d.nerveAmp * (0.4 + 0.6 * d.a));
      for (let i = 0; i < v.count; i++) {
        const q = (racc + i / VESICLES) % 1;
        dummy.position.lerpVectors(BULBS[i % 3]!, targets[i % RECEPTORS]!, q);
        dummy.position.y += Math.sin(q * 9 + i) * 0.06;
        dummy.position.z += Math.cos(q * 7 + i) * 0.06;
        dummy.scale.setScalar(0.04 * (1 - 0.3 * q));
        dummy.updateMatrix();
        v.setMatrixAt(i, dummy.matrix);
      }
      v.instanceMatrix.needsUpdate = true;
    }
    const r = receptors.current;
    if (r) {
      for (let i = 0; i < RECEPTORS; i++) {
        dummy.position.copy(targets[i]!);
        dummy.lookAt(POST);
        dummy.rotateX(Math.PI / 2);
        dummy.scale.setScalar(0.2 * (1 + 0.5 * d.nerveAmp * Math.max(0, Math.sin(l.t * 4 + i))));
        dummy.updateMatrix();
        r.setMatrixAt(i, dummy.matrix);
      }
      r.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group position={NERVE_AT}>
      <pointLight position={[-1.5, 2.2, 3]} color="#bffcf0" intensity={3.2} distance={11} />
      <pointLight position={[3, -1.5, 2]} color="#93c5fd" intensity={2.4} distance={11} />
      <mesh position={[-2.7, 0, 0]} geometry={parts.soma} material={mats.soma} />
      <mesh position={[-2.7, 0, 0]} geometry={parts.nucleus} material={mats.nucleus} />
      {parts.dendrites.map((g, i) => (
        <mesh key={i} geometry={g} material={mats.process} />
      ))}
      <mesh geometry={parts.axonGeo} material={mats.process} />
      {myelinPlacements.map((m) => (
        <mesh
          key={m.u}
          position={m.position}
          quaternion={m.quaternion}
          geometry={parts.myelin}
          material={mats.myelin}
          scale={[1, 1.15, 1]}
        />
      ))}
      {BULBS.map((b, i) => (
        <mesh key={i} position={b} geometry={parts.bulb} material={mats.bulb} />
      ))}
      <mesh position={POST} geometry={parts.post} material={mats.post} />
      <instancedMesh
        ref={receptors}
        args={[parts.receptor, mats.receptor, RECEPTORS]}
        frustumCulled={false}
      />
      <instancedMesh ref={pulses} args={[undefined, undefined, PULSES]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial color="#cffafe" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={vesicles} args={[undefined, undefined, VESICLES]} frustumCulled={false}>
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

const LIPIDS_X = 16;
const LIPIDS_Y = 10;
const MOLECULES = 14;
const SIGNALS = 24;

/** β-adrenergic receptors in a lipid membrane: adrenaline docks, a beta blocker covers the pockets. */
export const Receptor = memo(function Receptor({
  live,
  bound,
  blocked,
}: {
  live: RefObject<Live>;
  /** Receptors currently holding an adrenaline molecule (0 under a beta blocker). */
  bound: number;
  /** A beta blocker covers the binding pockets. */
  blocked: boolean;
}) {
  const lipids = useRef<THREE.InstancedMesh>(null);
  const molecules = useRef<THREE.InstancedMesh>(null);
  const signals = useRef<THREE.InstancedMesh>(null);
  const clock = useRef({ t: 0, acc: 0 });
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pocketX = (j: number) => -1.2 + j * 0.8;
  const geo = useMemo(() => receptorGeometry(), []);
  const mats = useMemo(
    () => ({
      lipid: organic("#38bdf8", { emissive: new THREE.Color("#0369a1"), emissiveIntensity: 0.4 }),
      free: organic("#a78bfa", { emissive: new THREE.Color("#6d28d9"), emissiveIntensity: 0.6 }),
      bound: organic("#fbbf24", { emissive: new THREE.Color("#f59e0b"), emissiveIntensity: 0.9 }),
      blocker: organic("#dc2626", { emissive: new THREE.Color("#ef4444"), emissiveIntensity: 0.9 }),
      slab: organic("#0c4a6e", { transparent: true, opacity: 0.25, depthWrite: false }),
    }),
    [],
  );
  useDispose(geo);
  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => m.dispose());
    },
    [mats],
  );

  // The lipid bilayer never moves: write its matrices once.
  useEffect(() => {
    const m = lipids.current;
    if (!m) return;
    let i = 0;
    for (let layer = 0; layer < 2; layer++) {
      for (let x = 0; x < LIPIDS_X; x++) {
        for (let y = 0; y < LIPIDS_Y; y++) {
          dummy.position.set(-1.75 + x * 0.233, -1.0 + y * 0.222, layer === 0 ? 0.2 : -0.2);
          dummy.scale.setScalar(0.085);
          dummy.updateMatrix();
          m.setMatrixAt(i++, dummy.matrix);
        }
      }
    }
    m.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  useFrame(() => {
    const l = live.current;
    const d = l.drive;
    const acc = advance(clock.current, l.t, 0.35);
    const m = molecules.current;
    if (m) {
      m.count = Math.round(d.a * MOLECULES);
      for (let i = 0; i < m.count; i++) {
        const j = i % 4;
        const docked = i < 4 && j < d.boundReceptors;
        if (docked) {
          dummy.position.set(pocketX(j), 0, 0.62);
          dummy.scale.setScalar(0.1 + 0.02 * Math.sin(l.t * 5 + j));
        } else {
          const wander = (acc * (0.6 + rand(i, 41) * 0.4) + rand(i, 42)) % 1;
          // A blocker keeps adrenaline from ever reaching the pockets.
          const zMin = blocked ? 1.1 : 0.75;
          dummy.position.set(
            pocketX(j) + Math.sin(acc * 3 + i) * 0.35,
            Math.cos(acc * 2.4 + i * 2) * 0.55,
            3 - wander * (3 - zMin),
          );
          dummy.scale.setScalar(0.085);
        }
        dummy.rotation.set(l.t + i, l.t * 0.7, 0);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
      }
      m.instanceMatrix.needsUpdate = true;
    }
    const s = signals.current;
    if (s) {
      s.count = Math.round(SIGNALS * (d.boundReceptors / 4));
      for (let i = 0; i < s.count; i++) {
        const j = i % Math.max(1, d.boundReceptors);
        const q = (acc * 1.4 + i / SIGNALS) % 1;
        dummy.position.set(
          pocketX(j) + Math.sin(i * 3 + q * 8) * 0.25,
          Math.cos(i * 2 + q * 6) * 0.25,
          -0.35 - q * 1.6,
        );
        dummy.scale.setScalar(0.05 * (1 - 0.5 * q));
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        s.setMatrixAt(i, dummy.matrix);
      }
      s.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group position={SIGNAL_AT}>
      <pointLight position={[0, 2, 3.5]} color="#ffe9c7" intensity={3} distance={10} />
      <pointLight position={[-2, -1.5, -2]} color="#c4b5fd" intensity={2.2} distance={10} />
      <instancedMesh
        ref={lipids}
        args={[undefined, mats.lipid, LIPIDS_X * LIPIDS_Y * 2]}
        frustumCulled={false}
      >
        <icosahedronGeometry args={[1, 2]} />
      </instancedMesh>
      <mesh material={mats.slab}>
        <planeGeometry args={[3.8, 2.3]} />
      </mesh>
      {[0, 1, 2, 3].map((j) => (
        <group key={j} position={[pocketX(j), 0, 0]}>
          <mesh
            geometry={geo}
            material={j < bound ? mats.bound : mats.free}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.1, 1.5, 1.1]}
          />
          {blocked && (
            <mesh
              geometry={geo}
              material={mats.blocker}
              position={[0, 0, 0.62]}
              rotation={[Math.PI / 2, 0, 0]}
              scale={[0.5, 0.4, 0.5]}
            />
          )}
        </group>
      ))}
      <instancedMesh ref={molecules} args={[undefined, undefined, MOLECULES]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#facc15"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </instancedMesh>
      <instancedMesh ref={signals} args={[undefined, undefined, SIGNALS]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#e879f9" toneMapped={false} />
      </instancedMesh>
    </group>
  );
});
