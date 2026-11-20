import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { biconcaveDisc, brainGeometry, buildTube } from "@/components/lesson/scenes/adr3d-geometry";
import {
  advance,
  ARTERY_BASE_RADIUS,
  arteryRadius,
  cardiac,
  LABELS,
  POSES,
  STATION_LABEL,
  STATIONS_BY_VIEW,
  worldDrive,
} from "@/components/lesson/scenes/adr3d-model";
import { defaultsOf, simulations } from "@/data/simulations";

const base = defaultsOf(simulations.adrenaline);
const drive = (patch: Partial<typeof base>) => worldDrive({ ...base, ...patch });

describe("3D adrenaline world: stations", () => {
  it("macro starts on the whole body, molecular on the actin–myosin model", () => {
    expect(STATIONS_BY_VIEW.macro[0]).toBe("body");
    expect(STATIONS_BY_VIEW.macro).toEqual(["body", "heart", "blood", "muscle", "nerve"]);
    expect(STATIONS_BY_VIEW.molecular).toEqual(["muscle", "nerve", "signal"]);
  });

  it("every station has a pose and a bilingual label", () => {
    for (const s of ["body", "heart", "blood", "muscle", "nerve", "signal"] as const) {
      expect(POSES[s].pos).toHaveLength(3);
      expect(POSES[s].target).toHaveLength(3);
      expect(STATION_LABEL[s].ar && STATION_LABEL[s].en).toBeTruthy();
    }
  });

  it("DOM labels are bilingual, unique and hotspots point at real stations", () => {
    expect(new Set(LABELS.map((l) => l.id)).size).toBe(LABELS.length);
    for (const l of LABELS) {
      expect(l.text.ar && l.text.en, l.id).toBeTruthy();
      if (l.station) expect(POSES[l.station]).toBeDefined();
    }
  });
});

describe("3D adrenaline world: heart cycle", () => {
  it("ventricles squeeze in systole with the aortic valve open and the mitral one shut", () => {
    const systole = cardiac(0.2);
    expect(systole.systole).toBeGreaterThan(0.8);
    expect(systole.slOpen).toBe(1);
    expect(systole.avOpen).toBe(0);
  });

  it("the AV valves reopen for filling while the outflow valves close", () => {
    const diastole = cardiac(0.7);
    expect(diastole.systole).toBe(0);
    expect(diastole.avOpen).toBe(1);
    expect(diastole.slOpen).toBe(0);
    expect(cardiac(1.2).x).toBeCloseTo(0.2, 6);
  });
});

describe("3D adrenaline world: physiology-driven animation", () => {
  it("muscle contraction speeds up with adrenaline and fades without oxygen or glucose", () => {
    expect(drive({ adrenaline: 80 }).muscleFreq).toBeGreaterThan(
      drive({ adrenaline: 10 }).muscleFreq,
    );
    expect(drive({ oxygen: 62 }).muscleAmp).toBeLessThan(drive({ oxygen: 98 }).muscleAmp);
    expect(drive({ glucose: 40 }).muscleAmp).toBeLessThan(drive({ glucose: 90 }).muscleAmp);
  });

  it("a beta blocker mutes the muscle and leaves every receptor uncovered by adrenaline", () => {
    const normal = drive({ adrenaline: 90 });
    const blocked = drive({ adrenaline: 90, fault: 3 });
    expect(blocked.muscleFreq).toBeLessThan(normal.muscleFreq);
    expect(blocked.boundReceptors).toBe(0);
    expect(normal.boundReceptors).toBeGreaterThan(0);
  });

  it("nerve firing follows the brain response; a narrowed artery sets the stenosis flag", () => {
    expect(drive({ glucose: 40 }).nerveAmp).toBeLessThan(drive({}).nerveAmp);
    expect(drive({ fault: 2 }).stenosis).toBe(1);
    expect(drive({}).stenosis).toBe(0);
    expect(drive({ adrenaline: 100 }).dilation).toBeGreaterThan(drive({ adrenaline: 0 }).dilation);
  });

  it("the artery narrows at the plaque and widens with adrenaline", () => {
    expect(arteryRadius(0.1, 1, 0)).toBeCloseTo(ARTERY_BASE_RADIUS, 6);
    expect(arteryRadius(0.5, 1, 1)).toBeLessThan(arteryRadius(0.1, 1, 1) * 0.5);
    expect(arteryRadius(0.1, 1.2, 0)).toBeGreaterThan(arteryRadius(0.1, 1, 0));
  });

  it("advance() integrates over simulation time and survives pause / reset", () => {
    const c = { t: 0, acc: 0 };
    expect(advance(c, 0.5, 2)).toBeCloseTo(1, 6);
    expect(advance(c, 0.5, 2)).toBeCloseTo(1, 6); // paused: time did not move
    expect(advance(c, 9, 2)).toBeCloseTo(1, 6); // a long jump is ignored, not integrated
    expect(advance(c, 0, 2)).toBe(0); // reset
  });
});

describe("3D adrenaline world: geometry", () => {
  it("builds a tube with a varying radius, valid indices and disposable buffers", () => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0.3, 2, 0),
    ]);
    const geo = buildTube(curve, 20, 8, (u) => 0.1 * (1 - u) + 0.01);
    const pos = geo.getAttribute("position");
    expect(pos.count).toBe(21 * 9);
    expect(geo.getIndex()!.count).toBe(20 * 8 * 6);
    expect(Number.isFinite(pos.getX(0)) && Number.isFinite(pos.getZ(pos.count - 1))).toBe(true);
    geo.dispose();
  });

  it("makes a biconcave red-cell disc and a closed brain mesh", () => {
    const disc = biconcaveDisc();
    disc.computeBoundingBox();
    const size = disc.boundingBox!.getSize(new THREE.Vector3());
    expect(size.x).toBeCloseTo(2, 1);
    expect(size.y).toBeLessThan(0.6); // thin disc
    const brain = brainGeometry();
    expect(brain.getAttribute("position").count).toBeGreaterThan(500);
    disc.dispose();
    brain.dispose();
  });
});
