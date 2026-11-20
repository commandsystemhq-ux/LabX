import type { L10n } from "@/lib/i18n";
import type { Vec3 } from "./adr3d-model";

/**
 * The bloodstream route, in the shared body frame, measured from the real BodyParts3D vessels
 * (centre-line of each vessel, from slices of the mesh): right adrenal gland → suprarenal vein →
 * inferior vena cava → right heart → pulmonary circuit → left heart → aorta → aortic arch → then
 * either the right carotid artery to the brain, or the right subclavian / axillary / brachial
 * arteries to the biceps. `r` is the lumen radius in world units.
 */
export interface Waypoint {
  p: Vec3;
  r: number;
  label?: L10n;
  /** The blood is re-oxygenated while the route passes this waypoint. */
  lungs?: boolean;
}

export type RouteId = "brain" | "muscle";

export const ROUTE_COMMON: Waypoint[] = [
  {
    p: [-0.184, 0.999, -0.033],
    r: 0.03,
    label: { ar: "الغدة الكظرية اليمنى", en: "Right adrenal gland" },
  },
  { p: [-0.15, 0.985, -0.008], r: 0.03, label: { ar: "الوريد الكظري", en: "Suprarenal vein" } },
  {
    p: [-0.075, 0.985, 0.06],
    r: 0.04,
    label: { ar: "الوريد الأجوف السفلي", en: "Inferior vena cava" },
  },
  { p: [-0.055, 1.112, 0.068], r: 0.05 },
  { p: [-0.063, 1.187, 0.073], r: 0.05 },
  { p: [-0.061, 1.286, 0.081], r: 0.05 },
  { p: [-0.061, 1.49, 0.066], r: 0.05 },
  { p: [-0.06, 1.58, 0.1], r: 0.085, label: { ar: "الأذين الأيمن", en: "Right atrium" } },
  { p: [-0.056, 1.658, 0.13], r: 0.11 },
  { p: [0.0, 1.64, 0.17], r: 0.1 },
  { p: [0.07, 1.612, 0.189], r: 0.12, label: { ar: "البطين الأيمن", en: "Right ventricle" } },
  { p: [0.109, 1.833, 0.163], r: 0.06, label: { ar: "الشريان الرئوي", en: "Pulmonary trunk" } },
  {
    p: [0.2, 1.86, 0.04],
    r: 0.05,
    lungs: true,
    label: { ar: "الرئتان: الدم يتأكسج", en: "Lungs: the blood is oxygenated" },
  },
  { p: [0.2, 1.72, -0.06], r: 0.05, lungs: true },
  { p: [0.083, 1.676, 0.055], r: 0.1, label: { ar: "الأذين الأيسر", en: "Left atrium" } },
  { p: [0.156, 1.604, 0.102], r: 0.12, label: { ar: "البطين الأيسر", en: "Left ventricle" } },
  {
    p: [0.047, 1.764, 0.1],
    r: 0.06,
    label: { ar: "الشريان الأورطي الصاعد", en: "Ascending aorta" },
  },
  { p: [0.04, 1.97, 0.04], r: 0.055, label: { ar: "قوس الأورطي", en: "Aortic arch" } },
];

export const ROUTE_BRANCH: Record<RouteId, Waypoint[]> = {
  brain: [
    {
      p: [0.0, 2.02, 0.04],
      r: 0.04,
      label: { ar: "الجذع العضدي الرأسي", en: "Brachiocephalic trunk" },
    },
    { p: [-0.049, 2.092, 0.016], r: 0.035, label: { ar: "الشريان السباتي", en: "Carotid artery" } },
    { p: [-0.075, 2.242, -0.01], r: 0.033 },
    { p: [-0.088, 2.347, -0.019], r: 0.033 },
    { p: [-0.104, 2.471, -0.018], r: 0.031 },
    { p: [-0.127, 2.594, -0.022], r: 0.03 },
    { p: [-0.111, 2.709, -0.018], r: 0.03 },
    { p: [-0.05, 2.84, 0.041], r: 0.028 },
    { p: [-0.02, 2.93, 0.02], r: 0.025, label: { ar: "المخ", en: "Brain" } },
  ],
  muscle: [
    {
      p: [0.0, 2.02, 0.04],
      r: 0.04,
      label: { ar: "الجذع العضدي الرأسي", en: "Brachiocephalic trunk" },
    },
    {
      p: [-0.057, 2.078, 0.04],
      r: 0.033,
      label: { ar: "الشريان تحت الترقوة", en: "Subclavian artery" },
    },
    { p: [-0.118, 2.123, 0.005], r: 0.03 },
    { p: [-0.199, 2.121, 0.014], r: 0.03 },
    { p: [-0.299, 2.085, 0.028], r: 0.03 },
    { p: [-0.336, 2.068, 0.015], r: 0.03, label: { ar: "الشريان الإبطي", en: "Axillary artery" } },
    { p: [-0.455, 2.017, -0.014], r: 0.03 },
    { p: [-0.562, 1.875, -0.04], r: 0.03 },
    { p: [-0.587, 1.801, -0.058], r: 0.03, label: { ar: "الشريان العضدي", en: "Brachial artery" } },
    { p: [-0.626, 1.649, -0.073], r: 0.028 },
    { p: [-0.692, 1.496, -0.086], r: 0.028 },
    {
      p: [-0.724, 1.362, -0.078],
      r: 0.026,
      label: { ar: "العضلة ذات الرأسين", en: "Biceps muscle" },
    },
  ],
};

export const ROUTE_LABEL: Record<RouteId, L10n> = {
  brain: { ar: "إلى المخ", en: "To the brain" },
  muscle: { ar: "إلى العضلة", en: "To the muscle" },
};

/** Waypoint index where the narrowing fault applies (the mid carotid artery); none on the arm route. */
export const STENOSIS_WAYPOINT: Record<RouteId, number | null> = { brain: 22, muscle: null };

export const routeWaypoints = (id: RouteId): Waypoint[] => [...ROUTE_COMMON, ...ROUTE_BRANCH[id]];

/** Index of the last waypoint of the part shared by both routes (the aortic arch). */
export const ARCH_INDEX = ROUTE_COMMON.length - 1;
/** Index of the right atrium: adrenaline released by the gland reaches the heart here. */
export const HEART_INDEX = 8;

/** Fractional waypoint index → lumen radius (smooth), with the narrowing applied around a waypoint. */
export function lumenRadius(
  waypoints: Waypoint[],
  index: number,
  dilation: number,
  stenosisAt: number | null,
  stenosis: number,
) {
  const i = Math.min(waypoints.length - 1, Math.max(0, index));
  const a = Math.floor(i);
  const b = Math.min(waypoints.length - 1, a + 1);
  const k = i - a;
  const s = k * k * (3 - 2 * k);
  const base = waypoints[a]!.r * (1 - s) + waypoints[b]!.r * s;
  const narrowing =
    stenosisAt === null || !stenosis ? 0 : 0.65 * Math.exp(-(((i - stenosisAt) / 1.6) ** 2));
  return base * dilation * (1 - narrowing);
}

/** Caption of the vessel / chamber at a fractional waypoint index. */
export function captionAt(waypoints: Waypoint[], index: number): L10n | null {
  for (let i = Math.min(waypoints.length - 1, Math.floor(index)); i >= 0; i--) {
    const label = waypoints[i]!.label;
    if (label) return label;
  }
  return null;
}

/** True once the blood has passed the lungs (it is bright red and carries oxygen). */
export function isOxygenated(waypoints: Waypoint[], index: number) {
  const lastLungs = waypoints.reduce((m, w, i) => (w.lungs ? i : m), -1);
  return lastLungs >= 0 && index > lastLungs - 0.5;
}
