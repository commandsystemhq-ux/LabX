import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  biconcaveDisc,
  buildLumen,
  buildRoute,
  buildTube,
} from "@/components/lesson/scenes/adr3d-geometry";
import {
  advance,
  ANATOMY_FILES,
  cardiac,
  initialModes,
  LABELS,
  LAYERS,
  nextMode,
  placementOf,
  POSES,
  STATION_LABEL,
  STATION_LAYERS,
  STATIONS_BY_VIEW,
  worldDrive,
} from "@/components/lesson/scenes/adr3d-model";
import { categoryName, partName } from "@/components/lesson/scenes/adr3d-names";
import {
  ARCH_INDEX,
  captionAt,
  HEART_INDEX,
  isOxygenated,
  lumenRadius,
  ROUTE_COMMON,
  routeWaypoints,
  STENOSIS_WAYPOINT,
} from "@/components/lesson/scenes/adr3d-route";
import { defaultsOf, simulations } from "@/data/simulations";

const base = defaultsOf(simulations.adrenaline);
const drive = (patch: Partial<typeof base>) => worldDrive({ ...base, ...patch });

/* --- a tiny GLB reader: node name → world-space bounding box (from the POSITION accessor bounds) --- */
interface Glb {
  json: {
    nodes: { name: string; mesh: number }[];
    meshes: { primitives: { attributes: { POSITION: number } }[] }[];
    accessors: { min: number[]; max: number[] }[];
    extensionsUsed?: string[];
  };
}
const glbPath = (url: string) => join(process.cwd(), "public", url);
function readGlb(url: string): Glb {
  const buf = readFileSync(glbPath(url));
  expect(buf.toString("ascii", 0, 4)).toBe("glTF");
  return { json: JSON.parse(buf.toString("utf8", 20, 20 + buf.readUInt32LE(12))) as Glb["json"] };
}
function worldBox(fileId: string, node: string) {
  const file = ANATOMY_FILES.find((f) => f.id === fileId)!;
  const { json } = readGlb(file.url);
  const n = json.nodes.find((x) => x.name === node)!;
  const place = placementOf(file);
  const box = new THREE.Box3();
  for (const prim of json.meshes[n.mesh]!.primitives) {
    const a = json.accessors[prim.attributes.POSITION]!;
    box.expandByPoint(new THREE.Vector3(...(a.min as [number, number, number])));
    box.expandByPoint(new THREE.Vector3(...(a.max as [number, number, number])));
  }
  box.min.multiplyScalar(place.scale).add(new THREE.Vector3(...place.position));
  box.max.multiplyScalar(place.scale).add(new THREE.Vector3(...place.position));
  return box;
}

describe("3D adrenaline world: stations", () => {
  it("macro starts on the whole body and offers the bloodstream ride; molecular starts on the sarcomere", () => {
    expect(STATIONS_BY_VIEW.macro[0]).toBe("body");
    expect(STATIONS_BY_VIEW.macro).toEqual([
      "body",
      "heart",
      "adrenal",
      "blood",
      "brain",
      "muscle",
      "nerve",
    ]);
    expect(STATIONS_BY_VIEW.molecular).toEqual(["muscle", "nerve", "signal"]);
    expect(STATION_LABEL.blood.ar).toContain("اركب مجرى الدم");
    expect(STATION_LABEL.blood.en).toContain("Bloodstream ride");
  });

  it("every station has a pose and a bilingual label", () => {
    for (const s of Object.keys(STATION_LABEL) as (keyof typeof STATION_LABEL)[]) {
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

  it("layers cycle solid → X-ray → hidden and station presets cover every layer", () => {
    expect(nextMode("solid")).toBe("ghost");
    expect(nextMode("ghost")).toBe("hidden");
    expect(nextMode("hidden")).toBe("solid");
    expect(Object.keys(initialModes()).sort()).toEqual(LAYERS.map((l) => l.id).sort());
    for (const preset of Object.values(STATION_LAYERS)) {
      expect(Object.keys(preset).sort()).toEqual(LAYERS.map((l) => l.id).sort());
    }
  });
});

describe("real anatomy files (BodyParts3D)", () => {
  it("every file exists, is a valid GLB of a browser-friendly size, and needs no special decoder", () => {
    for (const f of ANATOMY_FILES) {
      const p = glbPath(f.url);
      expect(existsSync(p), f.url).toBe(true);
      expect(statSync(p).size / 1e6).toBeLessThan(7);
      const { json } = readGlb(f.url);
      // Plain GLB: if a replacement ever uses Draco / Meshopt, useGLTF is already set up to decode it.
      expect(json.extensionsUsed ?? []).not.toContain("KHR_draco_mesh_compression");
      expect(json.nodes.length).toBeGreaterThan(5);
    }
  });

  it("contains the structures the journey is built on", () => {
    const names = (id: string) =>
      readGlb(ANATOMY_FILES.find((f) => f.id === id)!.url).json.nodes.map((n) => n.name);
    expect(names("heart")).toEqual(
      expect.arrayContaining(["right-atrium", "left-ventricle", "ascending-aorta"]),
    );
    expect(names("adrenals")).toEqual(
      expect.arrayContaining(["right-adrenal-gland", "left-adrenal-gland", "right-kidney"]),
    );
    expect(names("vessels")).toEqual(
      expect.arrayContaining(["inferior-vena-cava", "aortic-arch", "carotid-arteries"]),
    );
    expect(names("muscles")).toEqual(expect.arrayContaining(["biceps-brachii", "deltoid"]));
    expect(names("brain")).toEqual(expect.arrayContaining(["cerebellum", "left-frontal"]));
    expect(names("spinal-cord")).toEqual(
      expect.arrayContaining(["spinal-cord", "brachial-plexus"]),
    );
  });

  it("documents the real licence (CC BY-SA 2.1 Japan) next to the models", () => {
    const text = readFileSync(glbPath("/models/anatomy/ATTRIBUTION.md"), "utf8");
    expect(text).toContain("CC BY-SA 2.1");
    expect(text).toContain("BodyParts3D");
    expect(text).toContain("MIT");
  });

  it("puts every file into one coordinate system: shared structures overlap exactly", () => {
    const heartAorta = worldBox("heart", "ascending-aorta");
    const vesselAorta = worldBox("vessels", "ascending-aorta");
    for (const k of ["x", "y", "z"] as const) {
      expect(heartAorta.min[k]).toBeCloseTo(vesselAorta.min[k], 1);
      expect(heartAorta.max[k]).toBeCloseTo(vesselAorta.max[k], 1);
    }
    const adrenalIvc = worldBox("adrenals", "inferior-vena-cava");
    const vesselIvc = worldBox("vessels", "inferior-vena-cava");
    expect(adrenalIvc.min.x).toBeGreaterThanOrEqual(vesselIvc.min.x - 0.02);
    expect(adrenalIvc.max.y).toBeLessThanOrEqual(vesselIvc.max.y + 0.02);
    // Anatomical order: adrenal glands sit below the heart and above the pelvis; the brain is the highest.
    const adrenal = worldBox("adrenals", "right-adrenal-gland").getCenter(new THREE.Vector3());
    const heart = worldBox("heart", "right-ventricle").getCenter(new THREE.Vector3());
    const brain = worldBox("brain", "cerebellum").getCenter(new THREE.Vector3());
    expect(adrenal.y).toBeLessThan(heart.y);
    expect(heart.y).toBeLessThan(brain.y);
    // The right adrenal gland lies on the patient's right (negative x in this frame).
    expect(adrenal.x).toBeLessThan(0);
  });

  it("the muscles model is the reference frame (scale 1, no offset)", () => {
    const muscles = placementOf(ANATOMY_FILES.find((f) => f.id === "muscles")!);
    expect(muscles.scale).toBeCloseTo(1, 9);
    expect(muscles.position.every((v) => Math.abs(v) < 1e-9)).toBe(true);
    expect(placementOf(ANATOMY_FILES.find((f) => f.id === "heart")!).scale).toBeCloseTo(0.2, 9);
  });
});

describe("bloodstream route", () => {
  it("starts at the real right adrenal gland and passes the right heart before the aorta", () => {
    const start = new THREE.Vector3(...ROUTE_COMMON[0]!.p);
    const gland = worldBox("adrenals", "right-adrenal-gland");
    expect(gland.expandByScalar(0.05).containsPoint(start)).toBe(true);
    const ra = worldBox("heart", "right-atrium").expandByScalar(0.03);
    expect(ra.containsPoint(new THREE.Vector3(...ROUTE_COMMON[HEART_INDEX]!.p))).toBe(true);
    const arch = worldBox("heart", "aortic-arch").expandByScalar(0.08);
    expect(arch.containsPoint(new THREE.Vector3(...ROUTE_COMMON[ARCH_INDEX]!.p))).toBe(true);
  });

  it("ends in the brain or in the biceps, and is captioned in both languages", () => {
    const brain = routeWaypoints("brain");
    const muscle = routeWaypoints("muscle");
    const brainBox = worldBox("brain", "cerebellum")
      .union(worldBox("brain", "midbrain"))
      .expandByScalar(0.25);
    expect(brainBox.containsPoint(new THREE.Vector3(...brain.at(-1)!.p))).toBe(true);
    expect(muscle.at(-1)!.p[0]).toBeLessThan(-0.6); // the right arm
    for (const w of [...brain, ...muscle]) {
      if (w.label) expect(w.label.ar && w.label.en).toBeTruthy();
      expect(w.r).toBeGreaterThan(0.02);
    }
    expect(captionAt(brain, 0)?.en).toBe("Right adrenal gland");
    expect(captionAt(brain, 10.4)?.en).toBe("Right ventricle");
  });

  it("blood is oxygenated only after the lungs, and a narrowed artery shrinks the tunnel", () => {
    const w = routeWaypoints("brain");
    expect(isOxygenated(w, 5)).toBe(false);
    expect(isOxygenated(w, 15)).toBe(true);
    const at = STENOSIS_WAYPOINT.brain!;
    const open = lumenRadius(w, at, 1, at, 0);
    const narrow = lumenRadius(w, at, 1, at, 1);
    expect(narrow).toBeLessThan(open * 0.5);
    expect(lumenRadius(w, 2, 1, at, 1)).toBeCloseTo(lumenRadius(w, 2, 1, at, 0), 6);
    expect(lumenRadius(w, at, 1.2, at, 0)).toBeGreaterThan(open);
    expect(STENOSIS_WAYPOINT.muscle).toBeNull();
  });

  it("builds an arc-length route with twist-free frames and a closed lumen mesh", () => {
    const route = buildRoute(routeWaypoints("brain"), 200);
    expect(route.length).toBeGreaterThan(3);
    for (let i = 0; i <= 200; i += 20) {
      expect(route.tangents[i]!.dot(route.normals[i]!)).toBeCloseTo(0, 3);
      expect(route.normals[i]!.dot(route.binormals[i]!)).toBeCloseTo(0, 3);
    }
    expect(route.index[0]).toBeCloseTo(0, 6);
    expect(route.index[200]).toBeCloseTo(routeWaypoints("brain").length - 1, 3);
    const lumen = buildLumen(route, () => 0.04, 16, 2);
    const pos = lumen.getAttribute("position");
    expect(pos.count).toBe(101 * 17);
    expect(lumen.getIndex()!.count).toBe(100 * 16 * 6);
    for (let i = 0; i < pos.count; i += 97) expect(Number.isFinite(pos.getX(i))).toBe(true);
    lumen.dispose();
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

  it("a beta blocker mutes the muscle and the heart and leaves every receptor uncovered by adrenaline", () => {
    const normal = drive({ adrenaline: 90 });
    const blocked = drive({ adrenaline: 90, fault: 3 });
    expect(blocked.muscleFreq).toBeLessThan(normal.muscleFreq);
    expect(blocked.contractility).toBeLessThan(normal.contractility);
    expect(blocked.boundReceptors).toBe(0);
    expect(normal.boundReceptors).toBeGreaterThan(0);
    expect(drive({ adrenaline: 100 }).contractility).toBeGreaterThan(
      drive({ adrenaline: 0 }).contractility,
    );
  });

  it("nerve firing follows the brain response; a narrowed artery sets the stenosis flag; the blood speeds up with output", () => {
    expect(drive({ glucose: 40 }).nerveAmp).toBeLessThan(drive({}).nerveAmp);
    expect(drive({ fault: 2 }).stenosis).toBe(1);
    expect(drive({}).stenosis).toBe(0);
    expect(drive({ adrenaline: 100 }).dilation).toBeGreaterThan(drive({ adrenaline: 0 }).dilation);
    expect(drive({ adrenaline: 60 }).rideSpeed).toBeGreaterThan(drive({ adrenaline: 5 }).rideSpeed);
    expect(drive({}).cellSpeed).toBeGreaterThan(drive({}).rideSpeed);
  });

  it("advance() integrates over simulation time and survives pause / reset", () => {
    const c = { t: 0, acc: 0 };
    expect(advance(c, 0.5, 2)).toBeCloseTo(1, 6);
    expect(advance(c, 0.5, 2)).toBeCloseTo(1, 6); // paused: time did not move
    expect(advance(c, 9, 2)).toBeCloseTo(1, 6); // a long jump is ignored, not integrated
    expect(advance(c, 0, 2)).toBe(0); // reset
  });
});

describe("bilingual part names", () => {
  it("uses curated Arabic names and falls back to a categorised English name", () => {
    expect(partName("heart", "right-atrium")).toEqual({ ar: "الأذين الأيمن", en: "Right Atrium" });
    expect(partName("adrenals", "right-adrenal-gland").ar).toBe("الغدة الكظرية اليمنى");
    expect(partName("muscles", "gluteus-medius").ar).toBe("عضلة: Gluteus Medius");
    expect(partName("spinal-cord", "nerve-c5").en).toBe("Nerve C5");
    expect(partName("spinal-cord", "vertebra-l3").ar).toBe("الفقرة L3");
    expect(categoryName("vessels").en).toBe("Blood vessel");
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
    geo.dispose();
  });

  it("makes a biconcave red-cell disc", () => {
    const disc = biconcaveDisc();
    disc.computeBoundingBox();
    const size = disc.boundingBox!.getSize(new THREE.Vector3());
    expect(size.x).toBeCloseTo(2, 1);
    expect(size.y).toBeLessThan(0.6);
    disc.dispose();
  });
});
