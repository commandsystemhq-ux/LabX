import type { HazardLevel } from "@/data/simExtras";
import { BETA_BLOCK_FACTOR, computeAdrenaline, type SimValues } from "@/data/simulations";
import type { L10n } from "@/lib/i18n";

/**
 * Pure helpers for the 3D adrenaline world (no three.js, no React): stations, camera poses, and
 * the physiology-driven animation parameters. Everything the render loop needs is derived here
 * from the same `SimValues` the simulation uses, so the 3D scene can never disagree with the HUD.
 */

export type Station = "body" | "heart" | "blood" | "muscle" | "nerve" | "signal";
export type Vec3 = [number, number, number];
export interface Pose {
  pos: Vec3;
  target: Vec3;
}

/** Stations offered by each stage view; the first one is where the camera starts. */
export const STATIONS_BY_VIEW = {
  macro: ["body", "heart", "blood", "muscle", "nerve"],
  molecular: ["muscle", "nerve", "signal"],
} as const satisfies Record<"macro" | "molecular", readonly Station[]>;

export const STATION_LABEL: Record<Station, L10n> = {
  body: { ar: "الجسم كامل", en: "Full body" },
  heart: { ar: "القلب", en: "Heart" },
  blood: { ar: "مجرى الدم", en: "Bloodstream" },
  muscle: { ar: "أكتين وميوسين", en: "Actin & myosin" },
  nerve: { ar: "المخ والأعصاب", en: "Brain & nerves" },
  signal: { ar: "مستقبل الأدرينالين", en: "Adrenaline receptor" },
};

/** Where the microscopic models live in the shared world (far from the body, same scale of units). */
export const MUSCLE_AT: Vec3 = [14, 0, 0];
export const NERVE_AT: Vec3 = [-14, 0, 0];
export const SIGNAL_AT: Vec3 = [0, -14, 0];

export const POSES: Record<Station, Pose> = {
  body: { pos: [0, 0.35, 6.3], target: [0, 0.25, 0] },
  heart: { pos: [0.2, 0.7, 1.15], target: [0.12, 0.62, 0.05] },
  blood: { pos: [0.02, 1.62, 0.03], target: [0.06, 1.3, 0.04] },
  muscle: { pos: [MUSCLE_AT[0], 0.5, 4.2], target: MUSCLE_AT },
  nerve: { pos: [NERVE_AT[0] + 1, 0.8, 6.2], target: [NERVE_AT[0] + 1, 0, 0] },
  signal: { pos: [0.9, SIGNAL_AT[1] + 0.4, 4.6], target: SIGNAL_AT },
};

/** Arterial route from the heart to the brain (the tube the camera flies inside). */
export const ARTERY_POINTS: Vec3[] = [
  [0.12, 0.85, 0.05],
  [0.08, 1.15, 0.05],
  [0.02, 1.5, 0.03],
  [0, 1.78, 0.01],
  [0, 1.95, 0],
];
export const ARTERY_BASE_RADIUS = 0.07;

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
  // Atrioventricular valves slam shut as the ventricles squeeze, then reopen; semilunar do the opposite.
  const avOpen = x < 0.38 ? clamp(1 - x / 0.04, 0, 1) : smooth((x - 0.38) / 0.08);
  const slOpen = x < 0.38 ? clamp(Math.min(x / 0.05, (0.38 - x) / 0.05), 0, 1) : 0;
  return { x, systole, atrial, avOpen, slOpen };
}

/** Everything the 3D scene animates, derived from the live simulation values. */
export function worldDrive(values: SimValues) {
  const p = computeAdrenaline(values.adrenaline, values.oxygen, values.glucose, values.fault);
  const a = p.surged / 100;
  // Skeletal muscle follows adrenaline; a beta blocker mutes the response it is given.
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
    /** Blood-cell speed along the artery, in curve fractions per second. */
    bloodSpeed: 0.06 + 0.03 * p.output,
  };
}
export type WorldDrive = ReturnType<typeof worldDrive>;

/** Artery radius at curve fraction `u`, with a smooth plaque narrowing when `stenosis` is 1. */
export function arteryRadius(u: number, dilation: number, stenosis: number) {
  const narrowing = stenosis * 0.65 * Math.exp(-(((u - 0.5) / 0.12) ** 2));
  return ARTERY_BASE_RADIUS * dilation * (1 - narrowing);
}

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
    pos: [0.12, 1.02, 0.28],
    text: STATION_LABEL.heart,
    views: ["macro"],
    station: "heart",
    tone: SKY,
    minDist: 1.6,
    maxDist: 14,
  },
  {
    id: "hs-blood",
    pos: [0.02, 1.45, 0.18],
    text: STATION_LABEL.blood,
    views: ["macro"],
    station: "blood",
    tone: SKY,
    minDist: 1.6,
    maxDist: 14,
  },
  {
    id: "hs-muscle",
    pos: [1.03, 0.95, 0.22],
    text: STATION_LABEL.muscle,
    views: ["macro"],
    station: "muscle",
    tone: SKY,
    minDist: 1.6,
    maxDist: 14,
  },
  {
    id: "hs-nerve",
    pos: [0, 2.62, 0.1],
    text: STATION_LABEL.nerve,
    views: ["macro"],
    station: "nerve",
    tone: SKY,
    minDist: 1.6,
    maxDist: 14,
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
