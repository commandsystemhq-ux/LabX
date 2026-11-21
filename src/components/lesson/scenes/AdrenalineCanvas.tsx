import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  useProgress,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { memo, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three/examples/jsm/controls/OrbitControls.js";
import { Atlas, partKey, type PartPick } from "./adr3d-atlas";
import { BeatDriver, newBeat } from "./adr3d-core";
import { Neuron, Receptor, Sarcomere } from "./adr3d-micro";
import {
  initialModes,
  LABELS,
  LAYERS,
  nextMode,
  POSES,
  STATION_LABEL,
  STATION_LAYERS,
  STATION_SHORT,
  STATIONS_BY_VIEW,
  type LabelSpec,
  type LayerId,
  type LayerMode,
  type Live,
  type Pose,
  type Station,
  type Vec3,
} from "./adr3d-model";
import { categoryName, partName } from "./adr3d-names";
import { newRideControl, Ride, Secretion, type RideControl } from "./adr3d-ride";
import { ROUTE_LABEL, type RouteId } from "./adr3d-route";

export interface AdrenalineCanvasProps {
  /** Per-frame values; written by the host on every render, read inside `useFrame` (no re-renders). */
  live: RefObject<Live>;
  mode: "macro" | "molecular";
  ar: boolean;
  labels: boolean;
  hazard: 0 | 1 | 2;
  dilation: number;
  stenosis: number;
  bound: number;
  blocked: boolean;
}

const T = {
  hint: {
    ar: "اسحب للتدوير • اقرص أو مرّر للتكبير • اضغط على أي عضو أو عضلة أو وعاء لعزله والطيران إليه",
    en: "Drag to orbit • pinch or scroll to zoom • click any organ, muscle or vessel to isolate it and fly there",
  },
  hintRide: {
    ar: "اسحب للتلفت 360° داخل الدم",
    en: "Drag to look around 360° inside the blood",
  },
  layers: { ar: "طبقات الأجهزة", en: "Body systems" },
  stations: { ar: "محطات الرحلة", en: "Journey stations" },
  solid: { ar: "ظاهر", en: "Solid" },
  ghost: { ar: "شفاف (أشعة)", en: "X-ray" },
  hidden: { ar: "مخفي", en: "Hidden" },
  fly: { ar: "طيران للعضو", en: "Fly to part" },
  isolate: { ar: "عزل", en: "Isolate" },
  unisolate: { ar: "إلغاء العزل", en: "Show all" },
  close: { ar: "إغلاق", en: "Close" },
  secrete: { ar: "أفرز أدرينالين", en: "Secrete adrenaline" },
  pause: { ar: "إيقاف مؤقت", en: "Pause" },
  resume: { ar: "متابعة", en: "Resume" },
  exit: { ar: "خروج من الدم", en: "Exit the blood" },
  progress: { ar: "موضع الرحلة", en: "Ride position" },
  loading: { ar: "جاري تحميل النماذج التشريحية", en: "Loading the anatomy models" },
};
const t = (l: { ar: string; en: string }, ar: boolean) => (ar ? l.ar : l.en);
const MODE_MARK: Record<LayerMode, string> = { solid: "●", ghost: "◐", hidden: "○" };

interface Fly {
  pose: Pose;
  /** Increments for every request, so flying to the same pose again works. */
  id: number;
}

/** Smooth fly-to camera. Any manual orbit / zoom / pan cancels the flight. */
function CameraRig({ fly, enabled }: { fly: Fly; enabled: boolean }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const flying = useRef(false);
  const first = useRef(true);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (!controls) return;
    if (first.current) {
      first.current = false;
      camera.position.set(...fly.pose.pos);
      controls.target.set(...fly.pose.target);
      controls.update();
    } else {
      flying.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only for a new flight request
  }, [fly.id, controls]);

  useEffect(() => {
    if (!controls) return;
    const stop = () => {
      flying.current = false;
    };
    controls.addEventListener("start", stop);
    return () => controls.removeEventListener("start", stop);
  }, [controls]);

  useFrame((_, dt) => {
    if (!enabled || !flying.current || !controls) return;
    pos.set(...fly.pose.pos);
    target.set(...fly.pose.target);
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 2.8);
    camera.position.lerp(pos, k);
    controls.target.lerp(target, k);
    controls.update();
    if (camera.position.distanceTo(pos) < 0.01 && controls.target.distanceTo(target) < 0.01) {
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
        : (0.4 + 0.5 * Math.sin(clock.elapsedTime * (hazard === 2 ? 8 : 4))) * hazard * 0.6;
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

/** Studio lighting from procedural light panels (no HDR download) + a soft contact shadow. */
function Studio({ macro }: { macro: boolean }) {
  return (
    <>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.6} position={[0, 5, 6]} scale={[12, 4, 1]} />
        <Lightformer
          form="rect"
          intensity={1.4}
          color="#bfdbfe"
          position={[-7, 1, 3]}
          rotation-y={Math.PI / 2}
          scale={[8, 5, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.1}
          color="#fde68a"
          position={[7, 0, -2]}
          rotation-y={-Math.PI / 2}
          scale={[8, 5, 1]}
        />
        <Lightformer form="ring" intensity={1.6} color="#ffffff" position={[0, -3, 5]} scale={5} />
      </Environment>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 6, 5]} intensity={1.1} />
      {macro && (
        <ContactShadows
          position={[0, -3.45, 0]}
          opacity={0.35}
          scale={9}
          blur={2.6}
          far={4}
          resolution={512}
          frames={1}
        />
      )}
    </>
  );
}

interface WorldProps extends AdrenalineCanvasProps {
  elements: RefObject<Map<string, HTMLElement>>;
  specs: LabelSpec[];
  fly: Fly;
  modes: Record<LayerId, LayerMode>;
  selected: string | null;
  isolate: boolean;
  ride: boolean;
  route: RouteId;
  rideCtl: RefObject<RideControl>;
  burst: RefObject<number>;
  onPick: (p: PartPick) => void;
}

const World = memo(function World(props: WorldProps) {
  const { live, mode, ar, hazard, ride, route, dilation, stenosis, fly, modes, selected, isolate } =
    props;
  const beat = useRef(newBeat());
  const macro = mode === "macro";
  return (
    <>
      <Studio macro={macro} />
      <AlertLight hazard={hazard} />
      <BeatDriver live={live} beat={beat} />
      <CameraRig fly={fly} enabled={!ride} />
      <LabelProjector elements={props.elements} specs={props.specs} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.09}
        minDistance={0.05}
        maxDistance={22}
        rotateSpeed={0.7}
      />

      {macro && (
        <>
          <Atlas
            live={live}
            beat={beat}
            modes={modes}
            selected={selected}
            isolate={isolate}
            burst={props.burst}
            ride={ride}
            onPick={props.onPick}
          />
          <Secretion live={live} burst={props.burst} hidden={ride} />
          <Ride
            live={live}
            beat={beat}
            ctl={props.rideCtl}
            route={route}
            active={ride}
            dilation={dilation}
            stenosis={stenosis}
            ar={ar}
          />
        </>
      )}
      <Sarcomere live={live} />
      <Neuron live={live} />
      {mode === "molecular" && <Receptor live={live} bound={props.bound} blocked={props.blocked} />}
    </>
  );
});

/** Pose for flying to a clicked part: in front of it, at a distance that frames its size. */
function poseForPart(center: Vec3, radius: number): Pose {
  const d = Math.min(8, Math.max(0.35, radius * 3.2));
  return { target: center, pos: [center[0] + d * 0.25, center[1] + d * 0.15, center[2] + d] };
}

function LoadingBadge({ ar }: { ar: boolean }) {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <p
      role="status"
      className="pointer-events-none absolute inset-s-2 top-7 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-sky-100"
    >
      {t(T.loading, ar)} {Math.round(progress)}%
    </p>
  );
}

/**
 * The interactive 3D exploration of the adrenaline journey on top of a real anatomy atlas
 * (BodyParts3D): layer toggles with X-ray, click-to-isolate parts, the adrenal gland and its
 * secretion, a first-person bloodstream ride through the real vessels, and the beating heart.
 * Client-only and lazily loaded; the heavy three.js code never runs during SSR.
 */
const AdrenalineCanvas = memo(function AdrenalineCanvas(props: AdrenalineCanvasProps) {
  const { mode, ar } = props;
  const stations = STATIONS_BY_VIEW[mode];
  const macro = mode === "macro";

  const [station, setStation] = useState<Station>(stations[0]);
  const [fly, setFly] = useState<Fly>({ pose: POSES[stations[0]], id: 0 });
  const [modes, setModes] = useState(initialModes);
  const [picked, setPicked] = useState<PartPick | null>(null);
  const [isolate, setIsolate] = useState(false);
  const [ride, setRide] = useState(false);
  const [route, setRoute] = useState<RouteId>("brain");
  const [paused, setPaused] = useState(false);

  const elements = useRef(new Map<string, HTMLElement>());
  const specs = useMemo(() => LABELS.filter((s) => s.views.includes(mode)), [mode]);
  const rideCtl = useRef(newRideControl());
  const burst = useRef(0);
  const flyId = useRef(0);

  const flyTo = useCallback((pose: Pose) => {
    flyId.current += 1;
    setFly({ pose, id: flyId.current });
  }, []);

  const goStation = useCallback(
    (s: Station) => {
      setStation(s);
      setPicked(null);
      setIsolate(false);
      if (s === "blood") {
        rideCtl.current.u = 0;
        rideCtl.current.paused = false;
        setPaused(false);
        setRide(true);
        return;
      }
      setRide(false);
      const preset = STATION_LAYERS[s];
      if (preset) setModes(preset);
      flyTo(POSES[s]);
    },
    [flyTo],
  );

  const chooseRoute = (r: RouteId) => {
    rideCtl.current.u = 0;
    setRoute(r);
  };
  const togglePause = () => {
    rideCtl.current.paused = !rideCtl.current.paused;
    setPaused(rideCtl.current.paused);
  };
  const onPick = useCallback((p: PartPick) => {
    setPicked(p);
    setIsolate(false);
  }, []);
  const selected = picked ? partKey(picked.file, picked.node) : null;
  const pickedName = picked ? partName(picked.file, picked.node) : null;

  const setCaptionEl = useCallback((el: HTMLElement | null) => {
    rideCtl.current.captionEl = el;
  }, []);
  const setSliderEl = useCallback((el: HTMLInputElement | null) => {
    rideCtl.current.sliderEl = el;
  }, []);

  // Never leave the scene in "ride" if the view changes underneath (the canvas remounts anyway).
  useEffect(() => () => void (document.body.style.cursor = ""), []);

  return (
    <div
      className="relative h-full w-full touch-none overflow-hidden rounded-2xl"
      dir={ar ? "rtl" : "ltr"}
    >
      <Canvas
        camera={{ fov: 50, near: 0.01, far: 140, position: POSES[stations[0]].pos }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        aria-label={
          ar
            ? "أطلس تشريحي ثلاثي الأبعاد: الأدرينالين والقلب والمخ"
            : "3D anatomy atlas: adrenaline, heart and brain"
        }
      >
        <World
          {...props}
          elements={elements}
          specs={specs}
          fly={fly}
          modes={modes}
          selected={selected}
          isolate={isolate}
          ride={ride}
          route={route}
          rideCtl={rideCtl}
          burst={burst}
          onPick={onPick}
        />
      </Canvas>

      {props.labels && !ride && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {specs.map((spec) => {
            const text = t(spec.text, ar);
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
                onClick={() => goStation(spec.station!)}
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

      <LoadingBadge ar={ar} />

      <p className="pointer-events-none absolute inset-x-2 top-1 text-center text-[10px] text-muted-foreground">
        {t(ride ? T.hintRide : T.hint, ar)}
      </p>

      {macro && !ride && (
        <div
          role="group"
          aria-label={t(T.layers, ar)}
          className="absolute inset-e-1.5 top-6 flex flex-col gap-1"
        >
          {LAYERS.map((layer) => (
            <button
              key={layer.id}
              type="button"
              onClick={() => setModes((m) => ({ ...m, [layer.id]: nextMode(m[layer.id]) }))}
              title={`${t(layer.label, ar)} — ${t(T[modes[layer.id]], ar)}`}
              aria-label={`${t(layer.label, ar)}: ${t(T[modes[layer.id]], ar)}`}
              className={
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md transition " +
                (modes[layer.id] === "hidden"
                  ? "border-white/15 bg-black/35 text-white/45"
                  : "border-sky-300/50 bg-sky-400/20 text-sky-50")
              }
            >
              <span aria-hidden>{MODE_MARK[modes[layer.id]]}</span>
              {t(layer.label, ar)}
            </button>
          ))}
        </div>
      )}

      {picked && pickedName && !ride && (
        <div className="absolute inset-s-1.5 top-6 max-w-60 rounded-xl border border-sky-300/40 bg-black/75 p-2.5 text-xs backdrop-blur-md">
          <p className="font-bold text-sky-100">{t(pickedName, ar)}</p>
          <p className="text-white/60">{t(categoryName(picked.file), ar)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => flyTo(poseForPart(picked.center, picked.radius))}
              className="rounded-full border border-sky-300/50 bg-sky-400/25 px-2.5 py-1 font-semibold text-sky-50"
            >
              {t(T.fly, ar)}
            </button>
            <button
              type="button"
              aria-pressed={isolate}
              onClick={() => setIsolate((v) => !v)}
              className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 font-semibold text-white"
            >
              {t(isolate ? T.unisolate : T.isolate, ar)}
            </button>
            <button
              type="button"
              onClick={() => {
                setPicked(null);
                setIsolate(false);
              }}
              className="rounded-full px-2 py-1 text-white/60 hover:text-white"
            >
              {t(T.close, ar)}
            </button>
          </div>
        </div>
      )}

      {macro && station === "adrenal" && !ride && (
        <button
          type="button"
          onClick={() => {
            burst.current = 1;
          }}
          className="absolute inset-s-1.5 bottom-12 rounded-full border border-amber-300/60 bg-amber-400/25 px-3 py-1.5 text-xs font-bold text-amber-50 backdrop-blur-md"
        >
          ⚡ {t(T.secrete, ar)}
        </button>
      )}

      {ride && (
        <div className="absolute inset-x-2 bottom-12 flex flex-col gap-1.5 rounded-xl border border-white/15 bg-black/60 p-2 backdrop-blur-md">
          <p
            ref={setCaptionEl}
            className="text-center text-xs font-bold text-sky-100"
            aria-live="polite"
          />
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={togglePause}
              aria-pressed={paused}
              className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold text-white"
            >
              {paused ? "▶ " : "⏸ "}
              {t(paused ? T.resume : T.pause, ar)}
            </button>
            {(["brain", "muscle"] as const).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={route === r}
                onClick={() => chooseRoute(r)}
                className={
                  "rounded-full border px-3 py-1 text-xs font-semibold " +
                  (route === r
                    ? "border-sky-300 bg-sky-400/25 text-sky-50"
                    : "border-white/20 bg-black/40 text-white/80")
                }
              >
                {t(ROUTE_LABEL[r], ar)}
              </button>
            ))}
            <input
              ref={setSliderEl}
              type="range"
              min={0}
              max={1}
              step={0.001}
              defaultValue={0}
              aria-label={t(T.progress, ar)}
              dir="ltr"
              className="h-1.5 w-32 flex-1 accent-sky-400"
              onPointerDown={() => {
                rideCtl.current.scrubbing = true;
              }}
              onPointerUp={() => {
                rideCtl.current.scrubbing = false;
              }}
              onInput={(e) => {
                rideCtl.current.scrubTo = Number((e.target as HTMLInputElement).value);
              }}
            />
            <button
              type="button"
              onClick={() => goStation("body")}
              className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold text-white"
            >
              {t(T.exit, ar)}
            </button>
          </div>
        </div>
      )}

      <div
        role="group"
        aria-label={t(T.stations, ar)}
        className="absolute inset-x-2 bottom-1 flex flex-nowrap justify-start gap-1.5 overflow-x-auto pb-0.5 sm:justify-center"
      >
        {stations.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={station === s && (s !== "blood" || ride)}
            title={t(STATION_LABEL[s], ar)}
            onClick={() => goStation(s)}
            className={
              "shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[11px] font-semibold backdrop-blur-md transition " +
              (station === s
                ? "border-sky-300 bg-sky-400/25 text-sky-50"
                : "border-white/20 bg-black/45 text-white/80 hover:bg-white/15")
            }
          >
            {s === "blood" ? "🩸 " : ""}
            {t(STATION_SHORT[s], ar)}
          </button>
        ))}
      </div>
    </div>
  );
});

export default AdrenalineCanvas;
