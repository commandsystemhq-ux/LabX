import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Artery,
  BeatDriver,
  BodyShell,
  Brain,
  Heart3D,
  Hotspot,
  Muscle,
  Networks,
  newBeat,
} from "./adr3d-body";
import { Neuron, Receptor, Sarcomere } from "./adr3d-micro";
import {
  LABELS,
  POSES,
  STATIONS_BY_VIEW,
  STATION_LABEL,
  type LabelSpec,
  type Live,
  type Station,
} from "./adr3d-model";

interface WorldExtras {
  elements: RefObject<Map<string, HTMLElement>>;
  specs: LabelSpec[];
}

export interface AdrenalineCanvasProps {
  /** Per-frame values; written by the host on every render, read inside `useFrame` (no re-renders). */
  live: RefObject<Live>;
  mode: "macro" | "molecular";
  ar: boolean;
  labels: boolean;
  neural: boolean;
  signals: boolean;
  hazard: 0 | 1 | 2;
  dilation: number;
  stenosis: number;
  bound: number;
  blocked: boolean;
}

const HINT = {
  ar: "اسحب للتدوير • اقرص أو مرّر العجلة للتكبير • اضغط على عضو أو علامة للطيران إليه",
  en: "Drag to orbit • pinch or scroll to zoom • click an organ or marker to fly there",
};

/** Smooth fly-to-station camera. Any manual orbit/zoom/pan cancels the flight. */
function CameraRig({ station }: { station: Station }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const flying = useRef(false);
  const first = useRef(true);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (!controls) return;
    const pose = POSES[station];
    if (first.current) {
      first.current = false;
      camera.position.set(...pose.pos);
      controls.target.set(...pose.target);
      controls.update();
    } else {
      flying.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the station changes
  }, [station, controls]);

  useEffect(() => {
    if (!controls) return;
    const stop = () => {
      flying.current = false;
    };
    controls.addEventListener("start", stop);
    return () => controls.removeEventListener("start", stop);
  }, [controls]);

  useFrame((_, dt) => {
    if (!flying.current || !controls) return;
    const pose = POSES[station];
    pos.set(...pose.pos);
    target.set(...pose.target);
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 2.8);
    camera.position.lerp(pos, k);
    controls.target.lerp(target, k);
    controls.update();
    if (camera.position.distanceTo(pos) < 0.015 && controls.target.distanceTo(target) < 0.015) {
      flying.current = false;
    }
  });
  return null;
}

/** A red pulsing light that makes the whole scene flash while a hazard is active. */
function AlertLight({ hazard }: { hazard: number }) {
  const light = useRef<THREE.PointLight>(null);
  const { camera } = useThree();
  useFrame(({ clock }) => {
    const l = light.current;
    if (!l) return;
    l.position.copy(camera.position);
    l.intensity =
      hazard === 0
        ? 0
        : (0.4 + 0.5 * Math.sin(clock.elapsedTime * (hazard === 2 ? 8 : 4))) * hazard * 1.4;
  });
  return <pointLight ref={light} color="#ff3b3b" distance={30} intensity={0} />;
}

/** Moves the DOM labels to the projection of their 3D anchors every frame (no React state involved). */
function LabelProjector({
  elements,
  specs,
}: {
  elements: RefObject<Map<string, HTMLElement>>;
  specs: LabelSpec[];
}) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    for (const spec of specs) {
      const el = elements.current.get(spec.id);
      if (!el) continue;
      v.set(...spec.pos);
      const dist = v.distanceTo(camera.position);
      v.project(camera);
      const visible =
        v.z < 1 &&
        Math.abs(v.x) < 1.05 &&
        Math.abs(v.y) < 1.05 &&
        dist >= spec.minDist &&
        dist <= spec.maxDist;
      el.style.visibility = visible ? "visible" : "hidden";
      if (visible) {
        el.style.transform = `translate(${((v.x * 0.5 + 0.5) * size.width).toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * size.height).toFixed(1)}px) translate(-50%, -50%)`;
      }
    }
  });
  return null;
}

const World = memo(function World(
  props: AdrenalineCanvasProps &
    WorldExtras & { station: Station; onStation: (s: Station) => void },
) {
  const {
    live,
    mode,
    ar,
    labels,
    neural,
    signals,
    hazard,
    dilation,
    stenosis,
    station,
    onStation,
  } = props;
  const beat = useRef(newBeat());
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 4]} intensity={1.3} />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} color="#7dd3fc" />
      <AlertLight hazard={hazard} />
      <BeatDriver live={live} beat={beat} />
      <CameraRig station={station} />
      <LabelProjector elements={props.elements} specs={props.specs} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.09}
        minDistance={0.12}
        maxDistance={16}
        rotateSpeed={0.7}
      />

      {mode === "macro" && (
        <>
          <BodyShell />
          <Networks live={live} beat={beat} neural={neural} hazard={hazard} />
          <Brain live={live} onStation={onStation} />
          <Muscle live={live} onStation={onStation} />
          <Heart3D live={live} beat={beat} onStation={onStation} />
          <Artery live={live} dilation={dilation} stenosis={stenosis} signals={signals} />
          <Hotspot
            station="heart"
            position={[0.12, 1.02, 0.28]}
            current={station}
            onStation={onStation}
          />
          <Hotspot
            station="blood"
            position={[0.02, 1.45, 0.18]}
            current={station}
            onStation={onStation}
          />
          <Hotspot
            station="muscle"
            position={[1.03, 0.95, 0.22]}
            current={station}
            onStation={onStation}
          />
          <Hotspot
            station="nerve"
            position={[0, 2.62, 0.1]}
            current={station}
            onStation={onStation}
          />
        </>
      )}
      <Sarcomere live={live} />
      <Neuron live={live} />
      {mode === "molecular" && <Receptor live={live} bound={props.bound} blocked={props.blocked} />}
    </>
  );
});

/**
 * The interactive 3D exploration of the adrenaline journey: one world, several stations the camera
 * flies between (buttons, organs and 3D hotspots), with full orbit / zoom / touch controls.
 * Client-only and lazily loaded; the heavy three.js code never runs during SSR.
 */
const AdrenalineCanvas = memo(function AdrenalineCanvas(props: AdrenalineCanvasProps) {
  const stations = STATIONS_BY_VIEW[props.mode];
  const [station, setStation] = useState<Station>(stations[0]);
  const { ar } = props;
  const elements = useRef(new Map<string, HTMLElement>());
  const specs = useMemo(() => LABELS.filter((s) => s.views.includes(props.mode)), [props.mode]);

  return (
    <div
      className="relative h-full w-full touch-none overflow-hidden rounded-2xl"
      dir={ar ? "rtl" : "ltr"}
    >
      <Canvas
        camera={{ fov: 50, near: 0.01, far: 120, position: POSES[stations[0]].pos }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        aria-label={
          ar
            ? "استكشاف ثلاثي الأبعاد للأدرينالين والقلب والمخ"
            : "3D exploration of adrenaline, the heart and the brain"
        }
      >
        <World
          {...props}
          elements={elements}
          specs={specs}
          station={station}
          onStation={setStation}
        />
      </Canvas>

      {props.labels && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden={false}>
          {specs.map((spec) => {
            const text = spec.text[ar ? "ar" : "en"];
            const className = `absolute left-0 top-0 invisible whitespace-nowrap rounded-full border bg-black/60 px-2 py-0.5 text-[11px] font-semibold ${spec.tone}`;
            const ref = (el: HTMLElement | null) => {
              if (el) elements.current.set(spec.id, el);
              else elements.current.delete(spec.id);
            };
            return spec.station ? (
              <button
                key={spec.id}
                ref={ref}
                type="button"
                onClick={() => setStation(spec.station!)}
                className={`${className} pointer-events-auto cursor-pointer hover:bg-white/20`}
              >
                {text}
              </button>
            ) : (
              <span key={spec.id} ref={ref} className={className}>
                {text}
              </span>
            );
          })}
        </div>
      )}

      <p className="pointer-events-none absolute inset-x-2 top-1 text-center text-[10px] text-muted-foreground">
        {ar ? HINT.ar : HINT.en}
      </p>
      <div
        role="group"
        aria-label={ar ? "محطات الرحلة" : "Journey stations"}
        className="absolute inset-x-2 bottom-1 flex flex-wrap justify-center gap-1.5"
      >
        {stations.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={station === s}
            onClick={() => setStation(s)}
            className={
              "rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-md transition " +
              (station === s
                ? "border-sky-300 bg-sky-400/25 text-sky-50"
                : "border-white/20 bg-black/45 text-white/80 hover:bg-white/15")
            }
          >
            {STATION_LABEL[s][ar ? "ar" : "en"]}
          </button>
        ))}
      </div>
    </div>
  );
});

export default AdrenalineCanvas;
