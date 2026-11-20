import type { HazardLevel } from "@/data/simExtras";
import { BETA_BLOCK_FACTOR, computeAdrenaline, type SimValues } from "@/data/simulations";
import type { L10n } from "@/lib/i18n";

/**
 * Pure helpers for the 3D adrenaline world (no three.js, no React): stations, camera poses, the
 * anatomy files and how they line up in one body coordinate system, and the physiology-driven
 * animation parameters. The render loop derives everything from the same `SimValues` the simulation
 * uses, so the 3D scene can never disagree with the HUD.
 */

export type Station =
  "body" | "heart" | "adrenal" | "blood" | "brain" | "muscle" | "nerve" | "signal";
export type Vec3 = [number, number, number];
export interface Pose {
  pos: Vec3;
  target: Vec3;
}

/** Stations offered by each stage view; the first one is where the camera starts. */
export const STATIONS_BY_VIEW = {
  macro: ["body", "heart", "adrenal", "blood", "brain", "muscle", "nerve"],
  molecular: ["muscle", "nerve", "signal"],
} as const satisfies Record<"macro" | "molecular", readonly Station[]>;

export const STATION_LABEL: Record<Station, L10n> = {
  body: { ar: "الجسم كامل", en: "Full body" },
  heart: { ar: "القلب", en: "Heart" },
  adrenal: { ar: "الغدة الكظرية", en: "Adrenal glands" },
  blood: { ar: "اركب مجرى الدم", en: "Bloodstream ride" },
  brain: { ar: "المخ والنخاع", en: "Brain & spinal cord" },
  muscle: { ar: "أكتين وميوسين", en: "Actin & myosin" },
  nerve: { ar: "الخلية العصبية", en: "Neuron & synapse" },
  signal: { ar: "مستقبل الأدرينالين", en: "Adrenaline receptor" },
};

/** Compact text of the station buttons (the full label is the tooltip / accessible name). */
export const STATION_SHORT: Record<Station, L10n> = {
  body: { ar: "الجسم", en: "Body" },
  heart: { ar: "القلب", en: "Heart" },
  adrenal: { ar: "الغدة الكظرية", en: "Adrenals" },
  blood: { ar: "اركب مجرى الدم", en: "Bloodstream ride" },
  brain: { ar: "المخ", en: "Brain" },
  muscle: { ar: "الأكتين والميوسين", en: "Actin & myosin" },
  nerve: { ar: "الخلية العصبية", en: "Neuron" },
  signal: { ar: "المستقبل", en: "Receptor" },
};

/* ------------------------------ real anatomy (BodyParts3D) ------------------------------ */

export type LayerId = "muscles" | "skeleton" | "vessels" | "nerves" | "organs";
export type LayerMode = "solid" | "ghost" | "hidden";

export const LAYERS: { id: LayerId; label: L10n; initial: LayerMode }[] = [
  { id: "muscles", label: { ar: "العضلات", en: "Muscles" }, initial: "ghost" },
  { id: "vessels", label: { ar: "الأوعية الدموية", en: "Blood vessels" }, initial: "solid" },
  { id: "nerves", label: { ar: "الأعصاب والنخاع", en: "Nerves & cord" }, initial: "hidden" },
  { id: "organs", label: { ar: "الأعضاء الداخلية", en: "Internal organs" }, initial: "solid" },
  { id: "skeleton", label: { ar: "الهيكل العظمي", en: "Skeleton" }, initial: "hidden" },
];

export const nextMode = (m: LayerMode): LayerMode =>
  m === "solid" ? "ghost" : m === "ghost" ? "hidden" : "solid";

export const initialModes = (): Record<LayerId, LayerMode> =>
  Object.fromEntries(LAYERS.map((l) => [l.id, l.initial])) as Record<LayerId, LayerMode>;

/** Layer visibility each anatomical station switches to (the student can change it afterwards). */
export const STATION_LAYERS: Partial<Record<Station, Record<LayerId, LayerMode>>> = {
  body: {
    muscles: "ghost",
    vessels: "solid",
    nerves: "hidden",
    organs: "solid",
    skeleton: "hidden",
  },
  heart: {
    muscles: "hidden",
    vessels: "solid",
    nerves: "hidden",
    organs: "solid",
    skeleton: "hidden",
  },
  adrenal: {
    muscles: "hidden",
    vessels: "solid",
    nerves: "hidden",
    organs: "solid",
    skeleton: "ghost",
  },
  brain: {
    muscles: "hidden",
    vessels: "ghost",
    nerves: "solid",
    organs: "solid",
    skeleton: "hidden",
  },
};

/** BodyParts3D files: millimetre centre (Z-up source frame) and uniform scale used to make each GLB. */
export interface AnatomyFile {
  id: "muscles" | "skeleton" | "vessels" | "spinal-cord" | "heart" | "brain" | "adrenals";
  url: string;
  layer: LayerId;
  centerMm: Vec3;
  scale: number;
  mb: number;
}

export const ANATOMY_FILES: AnatomyFile[] = [
  {
    id: "muscles",
    url: "/models/anatomy/muscles.glb",
    layer: "muscles",
    centerMm: [-0.6569976806640625, -97.01134777069092, 816.8721876144409],
    scale: 0.004,
    mb: 5.4,
  },
  {
    id: "vessels",
    url: "/models/anatomy/vessels.glb",
    layer: "vessels",
    centerMm: [0.0024999999999977263, -95.36285000000001, 739.6817],
    scale: 0.004,
    mb: 2.3,
  },
  {
    id: "heart",
    url: "/models/anatomy/heart.glb",
    layer: "organs",
    centerMm: [21.5438, -113.22494999999999, 1245.6399999999999],
    scale: 0.02,
    mb: 2.4,
  },
  {
    id: "brain",
    url: "/models/anatomy/brain.glb",
    layer: "organs",
    centerMm: [-0.5234999999999985, -79.67385, 1547.48],
    scale: 0.02,
    mb: 5.6,
  },
  {
    id: "adrenals",
    url: "/models/anatomy/adrenals.glb",
    layer: "organs",
    centerMm: [1.4037999999999968, -96.00869999999999, 1035.8895],
    scale: 0.016,
    mb: 0.5,
  },
  {
    id: "spinal-cord",
    url: "/models/anatomy/spinal-cord.glb",
    layer: "nerves",
    centerMm: [15.401699999999998, -66.449125, 1144.4385],
    scale: 0.008,
    mb: 4.9,
  },
  {
    id: "skeleton",
    url: "/models/anatomy/skeleton.glb",
    layer: "skeleton",
    centerMm: [-0.667999267578125, -109.74665069580078, 817.0244853496552],
    scale: 0.0025,
    mb: 5.0,
  },
];

/** One world unit = 250 mm. The body is centred on the muscles model (it spans y = ±3.29). */
export const WORLD_SCALE = 0.004;
export const WORLD_CENTER_MM: Vec3 = [-0.6569976806640625, -97.01134777069092, 816.8721876144409];

/**
 * Group transform that puts a GLB into the shared body frame. Each GLB is
 * `((x − cx)·s, (z − cz)·s, −(y − cy)·s)` of the source millimetres, so the common frame needs a
 * scale of `WORLD_SCALE / s` and an offset of the centre difference.
 */
export function placementOf(file: Pick<AnatomyFile, "centerMm" | "scale">): {
  scale: number;
  position: Vec3;
} {
  const [cx, cy, cz] = file.centerMm;
  const [bx, by, bz] = WORLD_CENTER_MM;
  return {
    scale: WORLD_SCALE / file.scale,
    position: [(cx - bx) * WORLD_SCALE, (cz - bz) * WORLD_SCALE, -(cy - by) * WORLD_SCALE],
  };
}

/** Micro-scale worlds live far away from the body, in the same scene. */
export const MUSCLE_AT: Vec3 = [14, 0, 0];
export const NERVE_AT: Vec3 = [-14, 0, 0];
export const SIGNAL_AT: Vec3 = [0, -14, 0];

export const POSES: Record<Station, Pose> = {
  body: { pos: [0, 0.2, 8.2], target: [0, 0, 0] },
  heart: { pos: [0.4, 1.75, 0.95], target: [0.115, 1.63, 0.13] },
  adrenal: { pos: [0.1, 1.28, 0.95], target: [0.01, 1.05, -0.06] },
  blood: { pos: [-0.184, 1.15, 0.5], target: [-0.184, 0.999, -0.033] },
  brain: { pos: [0.35, 3.1, 1.75], target: [0, 3.0, 0.03] },
  muscle: { pos: [MUSCLE_AT[0], 0.5, 4.2], target: MUSCLE_AT },
  nerve: { pos: [NERVE_AT[0] + 1, 0.8, 6.2], target: [NERVE_AT[0] + 1, 0, 0] },
  signal: { pos: [0.9, SIGNAL_AT[1] + 0.4, 4.6], target: SIGNAL_AT },
};

/* --------------------------------- physiology → animation --------------------------------- */

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const smooth = (x: number) => {
  const k = clamp(x, 0, 1);
  return k * k * (3 - 2 * k);
};

/** One heartbeat as a function of its phase (0–1): contraction and valve openings. */
export function cardiac(phase: number) {
  const x = phase - Math.floor(phase);
  const systole = x < 0.38 ? Math.sin((x / 0.38) * Math.PI) : 0;
  const atrial = x > 0.88 ? Math.sin(((x - 0.88) / 0.12) * Math.PI) : 0;
  const avOpen = x < 0.38 ? clamp(1 - x / 0.04, 0, 1) : smooth((x - 0.38) / 0.08);
  const slOpen = x < 0.38 ? clamp(Math.min(x / 0.05, (0.38 - x) / 0.05), 0, 1) : 0;
  return { x, systole, atrial, avOpen, slOpen };
}

/** Everything the 3D scene animates, derived from the live simulation values. */
export function worldDrive(values: SimValues) {
  const p = computeAdrenaline(values.adrenaline, values.oxygen, values.glucose, values.fault);
  const a = p.surged / 100;
  const aMuscle = a * (values.fault === 3 ? BETA_BLOCK_FACTOR : 1);
  const oxygenFactor = clamp((values.oxygen - 55) / 43, 0, 1) ** 1.5;
  const energy = oxygenFactor * p.glucoseFactor;
  const muscleFreq = 0.45 + 2.2 * aMuscle;
  const muscleAmp = clamp(energy * (0.3 + 0.7 * Math.min(1, aMuscle * 1.6 + 0.2)), 0, 1);
  const calcium = clamp(muscleAmp * (0.3 + 0.7 * aMuscle), 0, 1);
  const nerveRate = 0.6 + 3.2 * (p.brain / 100) * (0.4 + 0.6 * Math.min(1, a * 1.5));
  const nerveAmp = clamp(p.brain / 100, 0, 1);
  const boundReceptors = values.fault === 3 ? 0 : Math.min(4, Math.ceil(a * 4));
  // Vessel calibre: adrenaline widens the working arteries; a narrowed artery is a fault.
  const dilation = Math.round((0.9 + 0.35 * a) * 20) / 20;
  const stenosis = values.fault === 2 ? 1 : 0;
  // How hard the heart squeezes: a beta blocker mutes it, a surge strengthens it.
  const contractility = values.fault === 3 ? 0.5 : 0.8 + 0.5 * a;
  return {
    p,
    a,
    aMuscle,
    energy,
    muscleFreq,
    muscleAmp,
    calcium,
    nerveRate,
    nerveAmp,
    boundReceptors,
    dilation,
    stenosis,
    contractility,
    /** Blood-cell speed along the route, in world units per second. */
    cellSpeed: (0.35 + 0.12 * p.output) * 1.5,
    /** Camera speed during the bloodstream ride (cells overtake it). */
    rideSpeed: 0.35 + 0.12 * p.output,
  };
}
export type WorldDrive = ReturnType<typeof worldDrive>;

/** The values the render loop reads each frame (written during render, read in `useFrame`). */
export interface Live {
  /** Scaled simulation time in seconds (pauses with the stage's play/pause). */
  t: number;
  values: SimValues;
  drive: WorldDrive;
  flow: boolean;
  hazard: HazardLevel;
}

/** Integrates a per-frame rate over simulation time without jumps when paused or reset. */
export function advance(prev: { t: number; acc: number }, t: number, rate: number) {
  const dt = t - prev.t;
  prev.t = t;
  if (dt < 0) prev.acc = 0;
  else if (dt < 1) prev.acc += dt * rate;
  return prev.acc;
}

/* ------------------------------------- DOM labels ------------------------------------- */

/**
 * Text labels anchored in 3D. They are drawn as plain DOM elements positioned every frame from the
 * camera projection (no extra React roots inside the canvas), so they stay crisp, bilingual and
 * keyboard-reachable. `station` makes a label a clickable hotspot that flies the camera there.
 */
export interface LabelSpec {
  id: string;
  pos: Vec3;
  text: L10n;
  views: ("macro" | "molecular")[];
  station?: Station;
  tone: string;
  /** Hidden when the camera is closer than `minDist` / farther than `maxDist` (world units). */
  minDist: number;
  maxDist: number;
}

const at = (base: Vec3, dx: number, dy: number, dz: number): Vec3 => [
  base[0] + dx,
  base[1] + dy,
  base[2] + dz,
];
const SKY = "text-sky-100 border-sky-300/50";
const BOTH = ["macro", "molecular"] as ("macro" | "molecular")[];

export const LABELS: LabelSpec[] = [
  {
    id: "hs-heart",
    pos: [0.12, 1.63, 0.42],
    text: STATION_LABEL.heart,
    views: ["macro"],
    station: "heart",
    tone: SKY,
    minDist: 2.5,
    maxDist: 30,
  },
  {
    id: "hs-adrenal",
    pos: [-0.2, 1.0, 0.25],
    text: STATION_LABEL.adrenal,
    views: ["macro"],
    station: "adrenal",
    tone: "text-amber-100 border-amber-300/50",
    minDist: 2.5,
    maxDist: 30,
  },
  {
    id: "hs-brain",
    pos: [0, 3.35, 0.2],
    text: STATION_LABEL.brain,
    views: ["macro"],
    station: "brain",
    tone: SKY,
    minDist: 2.5,
    maxDist: 30,
  },
  {
    id: "hs-muscle",
    pos: [-0.74, 1.44, 0.15],
    text: STATION_LABEL.muscle,
    views: ["macro"],
    station: "muscle",
    tone: SKY,
    minDist: 2.5,
    maxDist: 30,
  },
  {
    id: "myosin",
    pos: at(MUSCLE_AT, 0, 0.85, 0),
    text: { ar: "ميوسين (خيوط سميكة)", en: "Myosin (thick)" },
    views: BOTH,
    tone: "text-orange-100 border-orange-300/50",
    minDist: 0,
    maxDist: 9,
  },
  {
    id: "actin",
    pos: at(MUSCLE_AT, -1.0, -0.95, 0),
    text: { ar: "أكتين (خيوط رفيعة)", en: "Actin (thin)" },
    views: BOTH,
    tone: SKY,
    minDist: 0,
    maxDist: 9,
  },
  {
    id: "zdisc",
    pos: at(MUSCLE_AT, 1.55, 1.0, 0),
    text: { ar: "قرص Z", en: "Z-disc" },
    views: BOTH,
    tone: "text-violet-100 border-violet-300/50",
    minDist: 0,
    maxDist: 9,
  },
  {
    id: "calcium",
    pos: at(MUSCLE_AT, 0.5, -1.05, 0.4),
    text: { ar: "Ca²⁺", en: "Ca²⁺" },
    views: BOTH,
    tone: "text-lime-100 border-lime-300/50",
    minDist: 0,
    maxDist: 9,
  },
  {
    id: "soma",
    pos: at(NERVE_AT, -2.7, 0.9, 0),
    text: { ar: "جسم الخلية العصبية", en: "Cell body" },
    views: BOTH,
    tone: SKY,
    minDist: 0,
    maxDist: 12,
  },
  {
    id: "dendrites",
    pos: at(NERVE_AT, -3.9, -1.2, 0),
    text: { ar: "زوائد شجيرية", en: "Dendrites" },
    views: BOTH,
    tone: SKY,
    minDist: 0,
    maxDist: 12,
  },
  {
    id: "axon",
    pos: at(NERVE_AT, -0.3, 0.55, 0),
    text: { ar: "محور مغلّف بالمايلين", en: "Myelinated axon" },
    views: BOTH,
    tone: "text-amber-100 border-amber-300/50",
    minDist: 0,
    maxDist: 12,
  },
  {
    id: "synapse",
    pos: at(NERVE_AT, 3.0, 1.0, 0),
    text: { ar: "التشابك العصبي", en: "Synapse" },
    views: BOTH,
    tone: "text-yellow-100 border-yellow-300/50",
    minDist: 0,
    maxDist: 12,
  },
  {
    id: "receptor",
    pos: at(SIGNAL_AT, 0, 1.4, 0.4),
    text: { ar: "مستقبلات بيتا في غشاء خلية القلب", en: "β-receptors in the heart-cell membrane" },
    views: ["molecular"],
    tone: SKY,
    minDist: 0,
    maxDist: 10,
  },
  {
    id: "adrenaline",
    pos: at(SIGNAL_AT, -1.2, 0.5, 2.2),
    text: { ar: "جزيئات الأدرينالين", en: "Adrenaline molecules" },
    views: ["molecular"],
    tone: "text-yellow-100 border-yellow-300/50",
    minDist: 0,
    maxDist: 10,
  },
  {
    id: "signal",
    pos: at(SIGNAL_AT, 0.4, -1.0, -1.3),
    text: { ar: "إشارة داخل الخلية", en: "Signal inside the cell" },
    views: ["molecular"],
    tone: "text-fuchsia-100 border-fuchsia-300/50",
    minDist: 0,
    maxDist: 10,
  },
];
