import { useFrame } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { buildTube } from "./adr3d-geometry";
import { advance, MUSCLE_AT, NERVE_AT, SIGNAL_AT, type Live } from "./adr3d-model";
import { useDispose } from "./adr3d-body";
import { rand } from "./sceneUtils";

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
 * Muscle sarcomere: Z-discs, thick myosin filaments with swinging cross-bridge heads, thin actin
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
  const thick = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#fb923c",
        emissive: "#c2410c",
        emissiveIntensity: 0.4,
      }),
    [],
  );
  const thin = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#7dd3fc",
        emissive: "#0369a1",
        emissiveIntensity: 0.4,
      }),
    [],
  );
  useDispose(thick);
  useDispose(thin);
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
    thick.color.copy(tmp);
    thick.emissiveIntensity = 0.15 + 0.5 * d.energy;
    tmp.set("#7dd3fc").lerp(grey, 1 - d.energy);
    thin.color.copy(tmp);

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
          dummy.rotation.set(0, 0, Math.PI / 2);
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
              fy + Math.cos(phi) * 0.075,
              fz + Math.sin(phi) * 0.075,
            );
            dummy.rotation.set(phi, 0, -s * 0.7 * swing);
            dummy.scale.set(1, 1, 1);
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
        const sx = rand(i, 3) * 3.0 - 1.5;
        dummy.position.set(
          sx + Math.sin(l.t * 2 + i) * 0.05,
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
      {HEX.map(([y, z], i) => (
        <mesh key={i} position={[0, y, z]} rotation={[0, 0, Math.PI / 2]} material={thick}>
          <cylinderGeometry args={[0.045, 0.045, 2.0, 12]} />
        </mesh>
      ))}
      <instancedMesh
        ref={heads}
        args={[undefined, undefined, HEX.length * 2 * HEADS_PER_SIDE]}
        frustumCulled={false}
        material={thick}
      >
        <capsuleGeometry args={[0.022, 0.07, 4, 8]} />
      </instancedMesh>
      <instancedMesh
        ref={actin}
        args={[undefined, undefined, ACTIN_PER_SIDE * 2]}
        frustumCulled={false}
        material={thin}
      >
        <cylinderGeometry args={[0.02, 0.02, 1.3, 8]} />
      </instancedMesh>
      {[zLeft, zRight].map((r, i) => (
        <mesh key={i} ref={r} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.85, 0.85, 0.07, 28]} />
          <meshStandardMaterial
            color="#a78bfa"
            emissive="#6d28d9"
            emissiveIntensity={0.5}
            transparent
            opacity={0.55}
          />
        </mesh>
      ))}
      <instancedMesh ref={calcium} args={[undefined, undefined, CA]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshBasicMaterial color="#bef264" toneMapped={false} />
      </instancedMesh>
    </group>
  );
});

const PULSES = 6;
const VESICLES = 26;
const RECEPTORS = 14;

/** Neuron + synapse: soma, dendrites, myelinated axon, terminals and neurotransmitter release. */
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
        20,
        8,
        (u) => 0.085 * (1 - u) + 0.012,
      );
    });
    const axon = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.2, 0, 0),
      new THREE.Vector3(-0.9, 0.18, 0.1),
      new THREE.Vector3(0.5, -0.12, 0),
      new THREE.Vector3(1.75, 0.04, 0),
    ]);
    return { dendrites, axon, axonGeo: buildTube(axon, 60, 10, () => 0.05) };
  }, []);
  useEffect(
    () => () => {
      parts.dendrites.forEach((g) => g.dispose());
      parts.axonGeo.dispose();
    },
    [parts],
  );

  const soma = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0f766e",
        emissive: "#2dd4bf",
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.9,
      }),
    [],
  );
  const process = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#115e59",
        emissive: "#14b8a6",
        emissiveIntensity: 0.5,
      }),
    [],
  );
  useDispose(soma);
  useDispose(process);

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

  useFrame(() => {
    const l = live.current;
    const d = l.drive;
    soma.emissiveIntensity = 0.1 + 0.9 * d.nerveAmp;
    process.emissiveIntensity = 0.1 + 0.6 * d.nerveAmp;

    const acc = advance(clock.current, l.t, 0.16 * d.nerveRate);
    const p = pulses.current;
    if (p) {
      p.count = Math.max(1, Math.round(PULSES * d.nerveAmp));
      for (let i = 0; i < p.count; i++) {
        const u = (acc + i / PULSES) % 1;
        dummy.position.copy(parts.axon.getPoint(u));
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
        const from = BULBS[i % 3]!;
        const to = targets[i % RECEPTORS]!;
        dummy.position.lerpVectors(from, to, q);
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
      // Receptors light up (grow) when neurotransmitter keeps arriving.
      for (let i = 0; i < RECEPTORS; i++) {
        dummy.position.copy(targets[i]!);
        dummy.lookAt(POST);
        dummy.scale.setScalar(0.07 * (1 + 0.5 * d.nerveAmp * Math.max(0, Math.sin(l.t * 4 + i))));
        dummy.updateMatrix();
        r.setMatrixAt(i, dummy.matrix);
      }
      r.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group position={NERVE_AT}>
      <mesh position={[-2.7, 0, 0]} material={soma}>
        <sphereGeometry args={[0.5, 32, 24]} />
      </mesh>
      <mesh position={[-2.7, 0, 0]}>
        <sphereGeometry args={[0.2, 20, 16]} />
        <meshStandardMaterial color="#99f6e4" emissive="#5eead4" emissiveIntensity={0.5} />
      </mesh>
      {parts.dendrites.map((g, i) => (
        <mesh key={i} geometry={g} material={process} />
      ))}
      <mesh geometry={parts.axonGeo} material={process} />
      {[0.05, 0.22, 0.39, 0.56, 0.73].map((u) => {
        const at = parts.axon.getPoint(u);
        const tan = parts.axon.getTangent(u);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
        return (
          <mesh key={u} position={at} quaternion={q}>
            <capsuleGeometry args={[0.11, 0.42, 6, 14]} />
            <meshStandardMaterial
              color="#fde68a"
              emissive="#f59e0b"
              emissiveIntensity={0.25}
              transparent
              opacity={0.75}
            />
          </mesh>
        );
      })}
      {BULBS.map((b, i) => (
        <mesh key={i} position={b}>
          <sphereGeometry args={[0.15, 16, 12]} />
          <meshStandardMaterial color="#5eead4" emissive="#14b8a6" emissiveIntensity={0.6} />
        </mesh>
      ))}
      <mesh position={POST}>
        <sphereGeometry args={[1.6, 32, 24]} />
        <meshStandardMaterial
          color="#1e3a8a"
          emissive="#3b82f6"
          emissiveIntensity={0.2}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <instancedMesh ref={receptors} args={[undefined, undefined, RECEPTORS]} frustumCulled={false}>
        <coneGeometry args={[1, 2, 8]} />
        <meshStandardMaterial color="#93c5fd" emissive="#60a5fa" emissiveIntensity={0.8} />
      </instancedMesh>
      <instancedMesh ref={pulses} args={[undefined, undefined, PULSES]} frustumCulled={false}>
        <sphereGeometry args={[1, 12, 10]} />
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
          const z = 3 - wander * (3 - zMin);
          dummy.position.set(
            pocketX(j) + Math.sin(acc * 3 + i) * 0.35,
            Math.cos(acc * 2.4 + i * 2) * 0.55,
            z,
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
      <instancedMesh
        ref={lipids}
        args={[undefined, undefined, LIPIDS_X * LIPIDS_Y * 2]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0369a1" emissiveIntensity={0.5} />
      </instancedMesh>
      <mesh>
        <boxGeometry args={[3.8, 2.3, 0.3]} />
        <meshStandardMaterial color="#0c4a6e" transparent opacity={0.25} depthWrite={false} />
      </mesh>
      {[0, 1, 2, 3].map((j) => {
        const isBound = j < bound;
        return (
          <group key={j} position={[pocketX(j), 0, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.13, 0.13, 1.0, 14]} />
              <meshStandardMaterial
                color={isBound ? "#fbbf24" : "#a78bfa"}
                emissive={isBound ? "#f59e0b" : "#6d28d9"}
                emissiveIntensity={0.7}
              />
            </mesh>
            <mesh position={[0, 0, 0.5]}>
              <torusGeometry args={[0.2, 0.05, 8, 18]} />
              <meshStandardMaterial color="#c4b5fd" emissive="#8b5cf6" emissiveIntensity={0.6} />
            </mesh>
            {blocked && (
              <mesh position={[0, 0, 0.55]}>
                <boxGeometry args={[0.3, 0.3, 0.18]} />
                <meshStandardMaterial color="#dc2626" emissive="#ef4444" emissiveIntensity={0.9} />
              </mesh>
            )}
          </group>
        );
      })}
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
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color="#e879f9" toneMapped={false} />
      </instancedMesh>
    </group>
  );
});
