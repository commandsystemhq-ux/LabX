import { OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { FIGURES } from "@/data/lessons/supportFigures";
import { MATERIALS, type MaterialId } from "@/data/lessons/supportLab";
import type { FigureId } from "@/data/lessons/supportTypes";
import type { PlantFocus } from "./boneFocus";
import {
  LabelOverlay,
  LabelProjector,
  RegLabel,
  useLabelRegistry,
  type LabelRegistry,
} from "./labels";
import type { SceneState } from "./sceneState";

/**
 * Procedural 3D for the plant half of the lesson: plant vs animal cell, the five tissues and the
 * stem cross-section (with the material-deposit lab). There is no BodyParts3D model for plants,
 * so these are built from real cell geometry (rounded cells, organelles, rings).
 */

export type TissueKind = "parenchyma" | "collenchyma" | "sclerenchyma" | "xylem" | "phloem";
export const TISSUES: TissueKind[] = [
  "parenchyma",
  "collenchyma",
  "sclerenchyma",
  "xylem",
  "phloem",
];

const MATERIAL_COLOR: Record<MaterialId, string> = {
  cellulose: "#38bdf8",
  lignin: "#92400e",
  cutin: "#eab308",
  suberin: "#a16207",
};

interface Names {
  (figure: FigureId, id: string): string;
}

function Tag({
  reg,
  children,
  pos,
}: {
  reg: LabelRegistry;
  children: string;
  pos: [number, number, number];
}) {
  const id = useId();
  return <RegLabel reg={reg} id={id} pos={pos} text={children} />;
}
function Glass({
  color,
  opacity = 0.3,
  double = false,
}: {
  color: string;
  opacity?: number;
  double?: boolean;
}) {
  return (
    <meshPhysicalMaterial
      color={color}
      transparent
      opacity={opacity}
      roughness={0.25}
      depthWrite={false}
      side={double ? THREE.DoubleSide : THREE.FrontSide}
    />
  );
}

/* ---------------------------------- cells ----------------------------------- */

function Cell({
  plant,
  nm,
  labels,
  reg,
}: {
  plant: boolean;
  nm: Names;
  labels: boolean;
  reg: LabelRegistry;
}) {
  const fig: FigureId = plant ? "cell-plant" : "cell-animal";
  const nucleus: [number, number, number] = plant ? [-0.95, 0.45, 0.1] : [-0.2, 0.15, 0.1];
  return (
    <group>
      {plant ? (
        <>
          <RoundedBox args={[3.4, 2.4, 2.4]} radius={0.16} smoothness={4}>
            <Glass color="#4ade80" opacity={0.22} double />
          </RoundedBox>
          <RoundedBox args={[3.15, 2.15, 2.15]} radius={0.14} smoothness={4}>
            <Glass color="#fde047" opacity={0.2} double />
          </RoundedBox>
          <mesh position={[0.45, -0.05, 0]} scale={[1.05, 0.8, 0.8]}>
            <sphereGeometry args={[1, 32, 24]} />
            <Glass color="#38bdf8" opacity={0.5} />
          </mesh>
          {[
            [1.2, 0.85, 0.7],
            [1.15, -0.85, -0.6],
            [-1.0, -0.85, 0.5],
            [0.1, 0.95, -0.7],
          ].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]} scale={[0.3, 0.13, 0.2]}>
              <sphereGeometry args={[1, 16, 12]} />
              <meshStandardMaterial color="#16a34a" roughness={0.5} />
            </mesh>
          ))}
        </>
      ) : (
        <>
          <mesh scale={[1.75, 1.25, 1.25]}>
            <sphereGeometry args={[1, 40, 28]} />
            <Glass color="#fde047" opacity={0.3} />
          </mesh>
          {[
            [0.95, 0.5, 0.5, 0.2],
            [1.05, -0.55, -0.2, 0.15],
          ].map((p, i) => (
            <mesh key={i} position={[p[0]!, p[1]!, p[2]!]}>
              <sphereGeometry args={[p[3]!, 16, 12]} />
              <Glass color="#38bdf8" opacity={0.55} />
            </mesh>
          ))}
        </>
      )}
      <mesh position={nucleus}>
        <sphereGeometry args={[0.4, 24, 18]} />
        <meshStandardMaterial color="#8b5cf6" roughness={0.45} />
      </mesh>
      <mesh position={nucleus}>
        <sphereGeometry args={[0.47, 20, 14]} />
        <meshBasicMaterial color="#c4b5fd" wireframe transparent opacity={0.6} />
      </mesh>
      <mesh position={[nucleus[0] + 0.05, nucleus[1] - 0.95, 0.1]} rotation={[0.3, 0.4, 0]}>
        <torusKnotGeometry args={[0.22, 0.05, 80, 8, 2, 3]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.6} />
      </mesh>
      {(plant
        ? [
            [1.45, 0.1, 0.5],
            [-1.3, -0.1, 0.4],
          ]
        : [
            [-1.0, -0.5, 0.4],
            [0.65, 0.1, -0.4],
          ]
      ).map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[0, 0, 1.2 + i]}>
          <capsuleGeometry args={[0.09, 0.22, 6, 12]} />
          <meshStandardMaterial color="#f97316" roughness={0.5} />
        </mesh>
      ))}
      {labels && (
        <>
          {plant ? (
            <>
              <Tag reg={reg} pos={[-1.75, 1.2, 1.25]}>
                {nm(fig, "cell-wall")}
              </Tag>
              <Tag reg={reg} pos={[-1.6, 0.2, 1.1]}>
                {nm(fig, "plasma-membrane")}
              </Tag>
              <Tag reg={reg} pos={[-0.95, 1.05, 0.5]}>
                {nm(fig, "nucleus")}
              </Tag>
              <Tag reg={reg} pos={[-1.45, 0.45, 0.7]}>
                {nm(fig, "nuclear-membrane")}
              </Tag>
              <Tag reg={reg} pos={[-0.85, -1.35, 0.5]}>
                {nm(fig, "er")}
              </Tag>
              <Tag reg={reg} pos={[0.5, 0.3, 0.95]}>
                {nm(fig, "vacuole")}
              </Tag>
              <Tag reg={reg} pos={[1.2, 1.25, 0.9]}>
                {nm(fig, "chloroplast")}
              </Tag>
              <Tag reg={reg} pos={[1.75, 0.25, 0.7]}>
                {nm(fig, "mitochondria")}
              </Tag>
              <Tag reg={reg} pos={[0.1, -1.25, 1.0]}>
                {nm(fig, "cytoplasm")}
              </Tag>
            </>
          ) : (
            <>
              <Tag reg={reg} pos={[-1.85, 0.9, 0.6]}>
                {nm(fig, "plasma-membrane")}
              </Tag>
              <Tag reg={reg} pos={[-0.2, 0.9, 0.7]}>
                {nm(fig, "nucleus")}
              </Tag>
              <Tag reg={reg} pos={[-0.9, 0.35, 0.9]}>
                {nm(fig, "nuclear-membrane")}
              </Tag>
              <Tag reg={reg} pos={[-0.15, -1.45, 0.5]}>
                {nm(fig, "er")}
              </Tag>
              <Tag reg={reg} pos={[-1.0, -0.95, 0.5]}>
                {nm(fig, "mitochondria")}
              </Tag>
              <Tag reg={reg} pos={[1.6, 0.85, 0.5]}>
                {nm(fig, "vacuole")}
              </Tag>
              <Tag reg={reg} pos={[0.9, -0.4, 0.9]}>
                {nm(fig, "cytoplasm")}
              </Tag>
            </>
          )}
        </>
      )}
    </group>
  );
}

/* --------------------------------- tissues ---------------------------------- */

const GRID: [number, number, number][] = [];
for (const x of [-1, 0, 1])
  for (const y of [-1, 0, 1]) for (const z of [-0.5, 0.5]) GRID.push([x, y, z]);

function Tissue({
  kind,
  nm,
  labels,
  reg,
}: {
  kind: TissueKind;
  nm: Names;
  labels: boolean;
  reg: LabelRegistry;
}) {
  const fig: FigureId = "tissues";
  switch (kind) {
    case "parenchyma":
      return (
        <group>
          {GRID.map(([x, y, z], i) => (
            <group key={i} position={[x * 1.05, y * 1.05, z * 1.05]}>
              <mesh>
                <sphereGeometry args={[0.46, 20, 14]} />
                <Glass color="#86efac" opacity={0.45} />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.1, 10, 8]} />
                <meshStandardMaterial color="#8b5cf6" />
              </mesh>
            </group>
          ))}
          {labels && (
            <>
              <Tag reg={reg} pos={[0, 1.9, 0]}>
                {nm(fig, "parenchyma")}
              </Tag>
              <Tag reg={reg} pos={[0.52, 0.52, 1.0]}>
                {nm(fig, "intercellular-space")}
              </Tag>
            </>
          )}
        </group>
      );
    case "collenchyma":
      return (
        <group>
          {GRID.map(([x, y, z], i) => (
            <group key={i} position={[x * 1, y * 1, z * 1]}>
              <RoundedBox args={[0.92, 0.92, 0.92]} radius={0.06}>
                <Glass color="#86efac" opacity={0.4} />
              </RoundedBox>
              {[-1, 1].flatMap((sx) =>
                [-1, 1].flatMap((sy) =>
                  [-1, 1].map((sz) => (
                    <mesh key={`${sx}${sy}${sz}`} position={[sx * 0.44, sy * 0.44, sz * 0.44]}>
                      <sphereGeometry args={[0.17, 10, 8]} />
                      <meshStandardMaterial color="#38bdf8" roughness={0.5} />
                    </mesh>
                  )),
                ),
              )}
            </group>
          ))}
          {labels && (
            <Tag reg={reg} pos={[0, 1.95, 0]}>
              {nm(fig, "collenchyma")}
            </Tag>
          )}
        </group>
      );
    case "sclerenchyma":
      return (
        <group>
          {GRID.map(([x, y, z], i) => (
            <group key={i} position={[x, y, z]}>
              <RoundedBox args={[0.92, 0.92, 0.92]} radius={0.05}>
                <meshStandardMaterial color="#92400e" roughness={0.7} />
              </RoundedBox>
              <mesh>
                <sphereGeometry args={[0.1, 8, 6]} />
                <meshBasicMaterial color="#1c1917" />
              </mesh>
            </group>
          ))}
          {labels && (
            <Tag reg={reg} pos={[0, 1.95, 0]}>
              {nm(fig, "sclerenchyma")}
            </Tag>
          )}
        </group>
      );
    case "xylem":
      return (
        <group>
          <mesh position={[-0.7, 0, 0]}>
            <cylinderGeometry args={[0.38, 0.38, 3.2, 28, 1, true]} />
            <Glass color="#fecaca" opacity={0.4} double />
          </mesh>
          {[-1.2, -0.7, -0.2, 0.3, 0.8, 1.3].map((y) => (
            <mesh key={y} position={[-0.7, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.38, 0.05, 8, 28]} />
              <meshStandardMaterial color="#92400e" />
            </mesh>
          ))}
          {[-0.9, 0.1, 1.0].map((y, i) => (
            <mesh key={i} position={[-0.7 + 0.38, y, 0]} rotation={[0, 0, Math.PI / 2]}>
              <circleGeometry args={[0.07, 12]} />
              <meshBasicMaterial color="#1c1917" side={THREE.DoubleSide} />
            </mesh>
          ))}
          <mesh position={[0.75, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.12, 3.2, 20, 1, true]} />
            <Glass color="#fecaca" opacity={0.4} double />
          </mesh>
          {[-1, -0.3, 0.4, 1.1].map((y) => (
            <mesh key={y} position={[0.75, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.17 - (y + 1.3) * 0.015, 0.035, 8, 20]} />
              <meshStandardMaterial color="#92400e" />
            </mesh>
          ))}
          {labels && (
            <>
              <Tag reg={reg} pos={[0, 1.95, 0]}>
                {nm(fig, "xylem")}
              </Tag>
              <Tag reg={reg} pos={[-1.5, 0.6, 0]}>
                {nm(fig, "vessel")}
              </Tag>
              <Tag reg={reg} pos={[1.4, 0.3, 0]}>
                {nm(fig, "tracheid")}
              </Tag>
              <Tag reg={reg} pos={[-0.2, -1.0, 0.5]}>
                {nm(fig, "pit")}
              </Tag>
            </>
          )}
        </group>
      );
    case "phloem":
      return (
        <group>
          {[-1.1, -0.2, 0.7].map((y) => (
            <group key={y} position={[-0.6, y, 0]}>
              <mesh>
                <cylinderGeometry args={[0.38, 0.38, 0.8, 24, 1, true]} />
                <Glass color="#93c5fd" opacity={0.45} double />
              </mesh>
              <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.38, 20]} />
                <meshBasicMaterial color="#1d4ed8" wireframe />
              </mesh>
            </group>
          ))}
          {[-1.1, -0.2, 0.7].map((y) => (
            <group key={y} position={[0.4, y, 0]}>
              <mesh>
                <cylinderGeometry args={[0.14, 0.14, 0.8, 16, 1, true]} />
                <Glass color="#fde047" opacity={0.5} double />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.07, 10, 8]} />
                <meshStandardMaterial color="#8b5cf6" />
              </mesh>
            </group>
          ))}
          {labels && (
            <>
              <Tag reg={reg} pos={[0, 1.95, 0]}>
                {nm(fig, "phloem")}
              </Tag>
              <Tag reg={reg} pos={[-1.5, 0.3, 0]}>
                {nm(fig, "sieve-tube")}
              </Tag>
              <Tag reg={reg} pos={[1.2, -0.2, 0]}>
                {nm(fig, "companion-cell")}
              </Tag>
            </>
          )}
        </group>
      );
  }
}

/* ----------------------------------- stem ----------------------------------- */

function ringGeometry(outer: number, inner: number, depth: number, from = 0, to = Math.PI * 2) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outer, from, to, false);
  if (to - from < Math.PI * 2 - 0.001) shape.absarc(0, 0, inner, to, from, true);
  else {
    const hole = new THREE.Path();
    hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 40 });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

function Ring({
  outer,
  inner,
  color,
  depth = 0.5,
  from,
  to,
  opacity = 1,
}: {
  outer: number;
  inner: number;
  color: string;
  depth?: number;
  from?: number;
  to?: number;
  opacity?: number;
}) {
  const geo = useMemo(
    () => ringGeometry(outer, inner, depth, from, to),
    [outer, inner, depth, from, to],
  );
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial
        color={color}
        roughness={0.6}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
}

const BUNDLES = 8;

/** Water drops cross the painted layer if its material lets water through, else bounce back. */
function WaterDrops({ radius, water }: { radius: number; water: number }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const drops = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({ a: (i / 14) * Math.PI * 2, phase: (i * 0.37) % 1 })),
    [],
  );
  useFrame(({ clock }) => {
    drops.forEach((d, i) => {
      const m = refs.current[i];
      if (!m) return;
      const t = (clock.elapsedTime * 0.35 + d.phase) % 1;
      const pass = i < Math.round((water / 100) * 14);
      const barrier = radius - 0.1;
      const tri = t < 0.5 ? t * 2 : (1 - t) * 2;
      const r = pass ? 0.5 + t * (radius + 0.4) : 0.5 + tri * (barrier - 0.5);
      m.position.set(Math.cos(d.a) * r, Math.sin(d.a) * r, 0.32);
    });
  });
  return (
    <>
      {drops.map((_, i) => (
        <mesh key={i} ref={(el) => void (refs.current[i] = el)}>
          <sphereGeometry args={[0.06, 8, 6]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      ))}
    </>
  );
}

const SAMPLE_RADIUS = {
  epidermis: 2.0,
  collenchyma: 1.72,
  sclerenchyma: 1.25,
  xylem: 1.1,
  cork: 2.25,
} as const;

function Stem({
  scene,
  nm,
  labels,
  reg,
}: {
  scene: SceneState;
  nm: Names;
  labels: boolean;
  reg: LabelRegistry;
}) {
  const fig: FigureId = "stem-section";
  const dep = scene.deposit;
  const paint = (sample: keyof typeof SAMPLE_RADIUS, base: string) =>
    dep && dep.sample === sample && dep.material ? MATERIAL_COLOR[dep.material] : base;
  const cork = dep?.sample === "cork";
  const pi2 = Math.PI * 2;
  return (
    <group rotation={[-0.35, 0, 0]}>
      {cork && <Ring outer={2.3} inner={2.1} color={paint("cork", "#a16207")} />}
      <Ring outer={2.1} inner={2.02} color={paint("epidermis", "#eab308")} depth={0.52} />
      <Ring outer={2.02} inner={1.92} color={paint("epidermis", "#86efac")} />
      <Ring outer={1.92} inner={1.55} color={paint("collenchyma", "#7dd3fc")} />
      <Ring outer={1.55} inner={0.9} color="#bbf7d0" opacity={0.9} />
      <mesh>
        <cylinderGeometry args={[0.9, 0.9, 0.48, 40]} />
        <meshStandardMaterial color="#fef9c3" roughness={0.7} />
      </mesh>
      {Array.from({ length: BUNDLES }, (_, i) => {
        const a = (i / BUNDLES) * pi2 + Math.PI / BUNDLES;
        return (
          <group key={i} rotation={[0, 0, a]}>
            <mesh position={[1.4, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.5, 16]} />
              <meshStandardMaterial color="#60a5fa" />
            </mesh>
            <mesh position={[1.12, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.14, 0.14, 0.5, 18]} />
              <meshStandardMaterial color={paint("xylem", "#ef4444")} />
            </mesh>
            <mesh position={[1.53, 0, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.55]}>
              <cylinderGeometry args={[0.2, 0.2, 0.5, 18]} />
              <meshStandardMaterial color={paint("sclerenchyma", "#a8a29e")} />
            </mesh>
          </group>
        );
      })}
      {dep?.material && (
        <WaterDrops radius={SAMPLE_RADIUS[dep.sample]} water={MATERIALS[dep.material].water} />
      )}
      {labels && (
        <>
          <Tag reg={reg} pos={[0, 2.45, 0.3]}>
            {nm(fig, "cutin")}
          </Tag>
          <Tag reg={reg} pos={[2.35, 0.9, 0.3]}>
            {nm(fig, "epidermis")}
          </Tag>
          <Tag reg={reg} pos={[-2.2, 0.9, 0.3]}>
            {nm(fig, "collenchyma")}
          </Tag>
          <Tag reg={reg} pos={[0, -2.45, 0.3]}>
            {nm(fig, "sclerenchyma")}
          </Tag>
          <Tag reg={reg} pos={[0.95, -0.5, 0.35]}>
            {nm(fig, "xylem")}
          </Tag>
          <Tag reg={reg} pos={[0.0, 0.0, 0.4]}>
            {nm(fig, "phloem")}
          </Tag>
        </>
      )}
    </group>
  );
}

/* ----------------------------------- host ----------------------------------- */

export interface PlantCanvasProps {
  focus: PlantFocus;
  scene: SceneState;
  ar: boolean;
  labels: boolean;
}

export default function PlantCanvas({ focus, scene, ar, labels }: PlantCanvasProps) {
  const [tissue, setTissue] = useState<TissueKind>("parenchyma");
  const reg = useLabelRegistry();
  const nm: Names = (figure, id) => {
    const c = FIGURES[figure].callouts.find((x) => x.id === id);
    return c ? (ar ? c.name.ar : c.name.en) : id;
  };
  const dist = focus === "stem" ? 7.5 : focus === "tissues" ? 6.5 : 6.2;
  return (
    <div className="relative h-full min-h-80 w-full touch-none overflow-hidden rounded-2xl bg-linear-to-b from-emerald-950 to-slate-900">
      <Canvas
        key={focus}
        camera={{ fov: 40, near: 0.1, far: 80, position: [0, 0.6, dist] }}
        dpr={[1, 1.6]}
        gl={{ antialias: true }}
        aria-label={
          ar ? "مجسم ثلاثي الأبعاد للخلية والأنسجة النباتية" : "3D plant cell and tissues"
        }
      >
        <ambientLight intensity={0.9} />
        <hemisphereLight args={["#ffffff", "#334155", 0.6]} />
        <directionalLight position={[3, 5, 4]} intensity={1.3} />
        <directionalLight position={[-4, -2, -3]} intensity={0.5} />
        <LabelProjector reg={reg} />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.09}
          autoRotate={focus !== "stem"}
          autoRotateSpeed={0.8}
          minDistance={2}
          maxDistance={16}
        />
        {focus === "cell-plant" && <Cell plant nm={nm} labels={labels} reg={reg} />}
        {focus === "cell-animal" && <Cell plant={false} nm={nm} labels={labels} reg={reg} />}
        {focus === "tissues" && <Tissue kind={tissue} nm={nm} labels={labels} reg={reg} />}
        {focus === "stem" && <Stem scene={scene} nm={nm} labels={labels} reg={reg} />}
      </Canvas>
      <LabelOverlay reg={reg} />
      {focus === "tissues" && (
        <div className="absolute inset-s-2 top-2 flex flex-wrap gap-1" dir={ar ? "rtl" : "ltr"}>
          {TISSUES.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={k === tissue}
              onClick={() => setTissue(k)}
              className={
                "rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur " +
                (k === tissue
                  ? "border-emerald-300 bg-emerald-300/25 text-emerald-100"
                  : "border-white/20 bg-black/40 text-white/80 hover:bg-white/10")
              }
            >
              {nm("tissues", k)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
