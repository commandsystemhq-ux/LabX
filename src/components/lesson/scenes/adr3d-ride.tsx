import { useFrame, useThree } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three/examples/jsm/controls/OrbitControls.js";
import { useDispose, type Beat } from "./adr3d-core";
import {
  biconcaveDisc,
  buildLumen,
  buildRoute,
  newRouteFrame,
  tissueTexture,
} from "./adr3d-geometry";
import { advance, type Live } from "./adr3d-model";
import {
  captionAt,
  HEART_INDEX,
  isOxygenated,
  lumenRadius,
  ROUTE_COMMON,
  routeWaypoints,
  STENOSIS_WAYPOINT,
  type RouteId,
} from "./adr3d-route";
import { rand } from "./sceneUtils";

/** Shared, non-reactive state of the bloodstream ride (read / written by the loop and the overlay). */
export interface RideControl {
  /** Progress along the route, 0–1. */
  u: number;
  paused: boolean;
  /** Set by the progress slider; consumed by the next frame. */
  scrubTo: number | null;
  scrubbing: boolean;
  yaw: number;
  pitch: number;
  /** Overlay elements the loop writes into (no React state per frame). */
  captionEl: HTMLElement | null;
  sliderEl: HTMLInputElement | null;
}
export const newRideControl = (): RideControl => ({
  u: 0,
  paused: false,
  scrubTo: null,
  scrubbing: false,
  yaw: 0,
  pitch: 0,
  captionEl: null,
  sliderEl: null,
});

const RBC = 170;
const GLUCOSE = 90;
const MOLECULES = 80;
const DEOXY = new THREE.Color("#6b1d3a");
const OXY = new THREE.Color("#e11d48");
const RIDE_FOV = 74;

/**
 * First-person ride inside the real vessels: the lumen is built around the measured centre-line of
 * the BodyParts3D vessels (adrenal → vena cava → heart → aorta → carotid / brachial artery), with
 * red cells, oxygen, glucose and adrenaline flowing past at the live blood speed. Drag to look around.
 */
export const Ride = memo(function Ride({
  live,
  beat,
  ctl,
  route,
  active,
  dilation,
  stenosis,
  ar,
}: {
  live: RefObject<Live>;
  beat: RefObject<Beat>;
  ctl: RefObject<RideControl>;
  route: RouteId;
  active: boolean;
  dilation: number;
  stenosis: number;
  ar: boolean;
}) {
  const waypoints = useMemo(() => routeWaypoints(route), [route]);
  const sampler = useMemo(() => buildRoute(waypoints), [waypoints]);
  const stenosisAt = STENOSIS_WAYPOINT[route];
  const lumen = useMemo(
    () =>
      buildLumen(sampler, (index) => lumenRadius(waypoints, index, dilation, stenosisAt, stenosis)),
    [sampler, waypoints, dilation, stenosisAt, stenosis],
  );
  const tissue = useMemo(() => tissueTexture(), []);
  const wall = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#a02a40",
        roughness: 0.48,
        metalness: 0,
        clearcoat: 0.45,
        clearcoatRoughness: 0.4,
        envMapIntensity: 0.7,
        sheen: 0.3,
        sheenColor: new THREE.Color("#ff9aa8"),
        bumpMap: tissue,
        bumpScale: 2.4,
        emissive: new THREE.Color("#5b0f1d"),
        emissiveIntensity: 0.35,
      }),
    [tissue],
  );
  const disc = useMemo(() => biconcaveDisc(), []);
  useDispose(lumen);
  useDispose(tissue);
  useDispose(wall);
  useDispose(disc);

  const rbc = useRef<THREE.InstancedMesh>(null);
  const o2 = useRef<THREE.InstancedMesh>(null);
  const sugar = useRef<THREE.InstancedMesh>(null);
  const hormone = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const frame = useMemo(newRouteFrame, []);
  const camFrame = useMemo(newRouteFrame, []);
  const aheadFrame = useMemo(newRouteFrame, []);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(), []);
  const aim = useMemo(() => new THREE.Vector3(), []);
  const flow = useRef({ t: 0, acc: 0 });
  const rideClock = useRef({ t: 0, acc: 0 });
  const color = useMemo(() => new THREE.Color(), []);
  const basis = useMemo(() => new THREE.Matrix4(), []);
  const baseQ = useMemo(() => new THREE.Quaternion(), []);
  const lookQ = useMemo(() => new THREE.Quaternion(), []);
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []);
  const x = useMemo(() => new THREE.Vector3(), []);
  const z = useMemo(() => new THREE.Vector3(), []);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const wasActive = useRef(false);
  const fovBefore = useRef(50);
  const lastCaption = useRef<unknown>(null);

  // While riding, the orbit controls give way to drag-to-look and the field of view widens.
  useEffect(() => {
    if (active) {
      wasActive.current = true;
      fovBefore.current = camera.fov;
      if (controls) controls.enabled = false;
      camera.fov = RIDE_FOV;
      camera.near = 0.003;
      camera.updateProjectionMatrix();
      ctl.current.yaw = 0;
      ctl.current.pitch = 0;
      return () => {
        if (controls) controls.enabled = true;
        camera.fov = fovBefore.current;
        camera.near = 0.01;
        camera.updateProjectionMatrix();
      };
    }
    return undefined;
  }, [active, camera, controls, ctl]);

  useEffect(() => {
    if (!active) return;
    const el = gl.domElement;
    let dragging = false;
    let lx = 0;
    let ly = 0;
    const down = (e: PointerEvent) => {
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const c = ctl.current;
      c.yaw -= (e.clientX - lx) * 0.006;
      c.pitch = Math.max(-1.45, Math.min(1.45, c.pitch - (e.clientY - ly) * 0.006));
      lx = e.clientX;
      ly = e.clientY;
    };
    const up = (e: PointerEvent) => {
      dragging = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [active, gl, ctl]);

  /** Position inside the lumen at route fraction u, offset by (angle, fraction of the radius). */
  const place = (u: number, angle: number, rho: number, out: THREE.Object3D) => {
    sampler.at(u, frame);
    const r = lumenRadius(waypoints, frame.index, dilation, stenosisAt, stenosis) * rho;
    const ca = Math.cos(angle) * r;
    const sa = Math.sin(angle) * r;
    out.position.set(
      frame.pos.x + frame.nor.x * ca + frame.bin.x * sa,
      frame.pos.y + frame.nor.y * ca + frame.bin.y * sa,
      frame.pos.z + frame.nor.z * ca + frame.bin.z * sa,
    );
    return frame.index;
  };

  useFrame(() => {
    if (!active) return;
    const l = live.current;
    const c = ctl.current;
    const b = beat.current;

    // --- camera: advance along the route (or hold still when paused / scrubbing) ---
    const before = rideClock.current.acc;
    advance(rideClock.current, l.t, l.drive.rideSpeed / sampler.length);
    if (!c.paused && !c.scrubbing) c.u += rideClock.current.acc - before;
    if (c.scrubTo !== null) {
      c.u = c.scrubTo;
      c.scrubTo = null;
    }
    c.u = ((c.u % 1) + 1) % 1;

    sampler.at(c.u, camFrame);
    camera.position.copy(camFrame.pos);
    // Look slightly ahead along the vessel so bends do not point the view into the wall.
    sampler.at((c.u + 0.03) % 1, aheadFrame);
    forward.copy(camFrame.tan).multiplyScalar(0.4);
    forward
      .addScaledVector(aim.copy(aheadFrame.pos).sub(camFrame.pos).normalize(), 0.6)
      .normalize();
    up.copy(camFrame.nor).addScaledVector(forward, -camFrame.nor.dot(forward)).normalize();
    z.copy(forward).negate();
    x.crossVectors(up, z).normalize();
    basis.makeBasis(x, up, z);
    baseQ.setFromRotationMatrix(basis);
    euler.set(c.pitch, c.yaw, 0);
    lookQ.setFromEuler(euler);
    camera.quaternion.copy(baseQ).multiply(lookQ);
    const kick = 2.4 * b.c.systole * l.drive.contractility;
    if (Math.abs(camera.fov - (RIDE_FOV + kick)) > 0.02) {
      camera.fov = RIDE_FOV + kick;
      camera.updateProjectionMatrix();
    }

    // --- overlay readouts (DOM written directly, no React state) ---
    if (c.sliderEl && !c.scrubbing) c.sliderEl.value = String(c.u);
    const caption = captionAt(waypoints, camFrame.index);
    if (c.captionEl && caption !== lastCaption.current) {
      lastCaption.current = caption;
      c.captionEl.textContent = caption ? (ar ? caption.ar : caption.en) : "";
    }

    // --- wall: faint throb with each beat ---
    wall.emissiveIntensity = 0.3 + 0.5 * b.c.systole;

    // --- particles ---
    const running = l.flow;
    const before2 = flow.current.acc;
    if (running)
      advance(flow.current, l.t, (l.drive.cellSpeed * (1 + 0.35 * b.c.systole)) / sampler.length);
    const acc = running ? flow.current.acc : before2;
    const spin = acc * sampler.length * 4;

    const cells = rbc.current;
    const oxy = o2.current;
    if (cells && oxy) {
      const fraction = Math.min(1, Math.max(0, (l.values.oxygen - 55) / 43));
      let o2Count = 0;
      for (let i = 0; i < RBC; i++) {
        const u = (acc * (0.9 + rand(i, 7) * 0.2) + i / RBC) % 1;
        const idx = place(
          u,
          rand(i, 1) * Math.PI * 2 + spin * 0.05,
          0.1 + rand(i, 2) * 0.75,
          dummy,
        );
        dummy.rotation.set(
          rand(i, 3) * 3 + spin * 0.6,
          rand(i, 4) * 3,
          rand(i, 5) * 3 + spin * 0.4,
        );
        dummy.scale.setScalar(0.0062);
        dummy.updateMatrix();
        cells.setMatrixAt(i, dummy.matrix);
        const bright = isOxygenated(waypoints, idx);
        color.copy(bright ? OXY : DEOXY);
        cells.setColorAt(i, color);
        if (bright && rand(i, 9) < fraction) {
          dummy.position.y += 0.006;
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(0.0032);
          dummy.updateMatrix();
          oxy.setMatrixAt(o2Count++, dummy.matrix);
        }
      }
      oxy.count = o2Count;
      cells.instanceMatrix.needsUpdate = true;
      if (cells.instanceColor) cells.instanceColor.needsUpdate = true;
      oxy.instanceMatrix.needsUpdate = true;
    }

    const glu = sugar.current;
    if (glu) {
      glu.count = Math.round((l.values.glucose / 300) * (GLUCOSE - 6)) + 6;
      for (let i = 0; i < glu.count; i++) {
        place(
          (acc * 0.95 + i / GLUCOSE + rand(i, 11) * 0.02) % 1,
          rand(i, 12) * Math.PI * 2,
          0.2 + rand(i, 13) * 0.7,
          dummy,
        );
        dummy.rotation.set(spin * 0.2 + i, spin * 0.3, 0);
        dummy.scale.setScalar(0.0048);
        dummy.updateMatrix();
        glu.setMatrixAt(i, dummy.matrix);
      }
      glu.instanceMatrix.needsUpdate = true;
    }

    const mol = hormone.current;
    if (mol) {
      mol.count = Math.round(l.drive.a * MOLECULES);
      for (let i = 0; i < mol.count; i++) {
        place(
          (acc * 1.1 + i / MOLECULES + rand(i, 21) * 0.03) % 1,
          rand(i, 22) * Math.PI * 2,
          0.25 + rand(i, 23) * 0.6,
          dummy,
        );
        dummy.rotation.set(spin, spin * 0.6 + i, 0);
        dummy.scale.setScalar(0.0062 * (1 + 0.25 * Math.sin(l.t * 6 + i)));
        dummy.updateMatrix();
        mol.setMatrixAt(i, dummy.matrix);
      }
      mol.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group visible={active}>
      <mesh geometry={lumen} material={wall} frustumCulled={false} />
      <instancedMesh ref={rbc} args={[disc, undefined, RBC]} frustumCulled={false}>
        <meshPhysicalMaterial
          roughness={0.4}
          clearcoat={0.6}
          clearcoatRoughness={0.3}
          emissive="#7f1d1d"
          emissiveIntensity={0.25}
        />
      </instancedMesh>
      <instancedMesh ref={o2} args={[undefined, undefined, RBC]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={1.1} />
      </instancedMesh>
      <instancedMesh ref={sugar} args={[undefined, undefined, GLUCOSE]} frustumCulled={false}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.8} />
      </instancedMesh>
      <instancedMesh ref={hormone} args={[undefined, undefined, MOLECULES]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#facc15"
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      </instancedMesh>
      <pointLight position={[0, 0, 0]} intensity={0} />
    </group>
  );
});

const SECRETION = 80;

/**
 * Adrenaline leaving the adrenal gland: glowing molecules stream through the real suprarenal vein and
 * vena cava towards the right atrium. The rate follows the adrenaline level (and the "secrete" button).
 */
export const Secretion = memo(function Secretion({
  live,
  burst,
  hidden,
}: {
  live: RefObject<Live>;
  burst: RefObject<number>;
  hidden: boolean;
}) {
  const sampler = useMemo(() => buildRoute(ROUTE_COMMON.slice(0, HEART_INDEX + 1), 200), []);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const frame = useMemo(newRouteFrame, []);
  const clock = useRef({ t: 0, acc: 0 });
  const last = useRef(0);

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    const l = live.current;
    burst.current = Math.max(0, burst.current - dt * 0.2);
    const level = Math.min(1, l.drive.a + burst.current);
    m.count = hidden ? 0 : Math.round(level * SECRETION);
    const acc = advance(clock.current, l.t, (0.55 + 0.12 * l.drive.rideSpeed) / sampler.length);
    last.current = acc;
    for (let i = 0; i < m.count; i++) {
      const u = (acc + i / SECRETION) % 1;
      sampler.at(u, frame);
      const wob = rand(i, 3) * Math.PI * 2 + l.t * 2;
      dummy.position.set(
        frame.pos.x + Math.cos(wob) * 0.012,
        frame.pos.y,
        frame.pos.z + Math.sin(wob) * 0.012,
      );
      dummy.scale.setScalar(0.011 * (1 + 0.3 * Math.sin(l.t * 7 + i)));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, SECRETION]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color="#fef08a"
        emissive="#facc15"
        emissiveIntensity={2.6}
        toneMapped={false}
      />
    </instancedMesh>
  );
});
