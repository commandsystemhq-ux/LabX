import * as THREE from "three";

/** Tube around `curve` whose radius can vary along its length (plaques, tapering dendrites). */
export function buildTube(
  curve: THREE.Curve<THREE.Vector3>,
  segments: number,
  radial: number,
  radiusAt: (u: number) => number,
): THREE.BufferGeometry {
  const frames = curve.computeFrenetFrames(segments, false);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const point = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    curve.getPoint(u, point);
    const r = radiusAt(u);
    const n = frames.normals[i]!;
    const b = frames.binormals[i]!;
    for (let j = 0; j <= radial; j++) {
      const v = (j / radial) * Math.PI * 2;
      const cos = Math.cos(v);
      const sin = Math.sin(v);
      normal.set(cos * n.x + sin * b.x, cos * n.y + sin * b.y, cos * n.z + sin * b.z);
      positions.push(point.x + r * normal.x, point.y + r * normal.y, point.z + r * normal.z);
      normals.push(normal.x, normal.y, normal.z);
      uvs.push(u, j / radial);
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + radial + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

/** Red blood cell: a unit-radius biconcave disc (Evans–Fung profile) made with a lathe. */
export function biconcaveDisc(segments = 20): THREE.BufferGeometry {
  const top: THREE.Vector2[] = [];
  for (let k = 0; k <= 10; k++) {
    const r = k / 10;
    const z = 0.5 * Math.sqrt(Math.max(0, 1 - r * r)) * (0.2072 + 2.0026 * r * r - 1.1228 * r ** 4);
    top.push(new THREE.Vector2(r, z * 0.5));
  }
  const bottom = top
    .slice(1)
    .reverse()
    .map((p) => new THREE.Vector2(p.x, -p.y));
  const profile = [...bottom, ...top];
  const geometry = new THREE.LatheGeometry(profile, segments);
  geometry.computeVertexNormals();
  return geometry;
}

/* --------------------------- the bloodstream route (real vessel centre-lines) --------------------------- */

export interface RouteSampler {
  curve: THREE.CatmullRomCurve3;
  /** Arc length in world units. */
  length: number;
  samples: number;
  points: THREE.Vector3[];
  tangents: THREE.Vector3[];
  normals: THREE.Vector3[];
  binormals: THREE.Vector3[];
  /** Fractional waypoint index (0…n−1) of each sample. */
  index: number[];
  /** Position / frame at arc-length fraction `u` (0…1), written into `out`. */
  at: (u: number, out: RouteFrame) => RouteFrame;
}
export interface RouteFrame {
  pos: THREE.Vector3;
  tan: THREE.Vector3;
  nor: THREE.Vector3;
  bin: THREE.Vector3;
  index: number;
}
export const newRouteFrame = (): RouteFrame => ({
  pos: new THREE.Vector3(),
  tan: new THREE.Vector3(),
  nor: new THREE.Vector3(),
  bin: new THREE.Vector3(),
  index: 0,
});

/**
 * Samples a smooth curve through the waypoints at equal arc-length steps and builds a twist-free
 * (parallel-transport) frame at each sample, so the camera and the lumen never flip upside down.
 */
export function buildRoute(
  waypoints: { p: [number, number, number] }[],
  samples = 600,
): RouteSampler {
  const curve = new THREE.CatmullRomCurve3(
    waypoints.map((w) => new THREE.Vector3(...w.p)),
    false,
    "centripetal",
  );
  const points: THREE.Vector3[] = [];
  const tangents: THREE.Vector3[] = [];
  const normals: THREE.Vector3[] = [];
  const binormals: THREE.Vector3[] = [];
  const index: number[] = [];
  const last = waypoints.length - 1;
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    points.push(curve.getPointAt(u));
    tangents.push(curve.getTangentAt(u).normalize());
    index.push(curve.getUtoTmapping(u, 0) * last);
  }
  const seed =
    Math.abs(tangents[0]!.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  let normal = new THREE.Vector3().crossVectors(tangents[0]!, seed).cross(tangents[0]!).normalize();
  for (let i = 0; i <= samples; i++) {
    if (i > 0) {
      const q = new THREE.Quaternion().setFromUnitVectors(tangents[i - 1]!, tangents[i]!);
      normal = normal.clone().applyQuaternion(q);
    }
    normal.sub(tangents[i]!.clone().multiplyScalar(normal.dot(tangents[i]!))).normalize();
    normals.push(normal.clone());
    binormals.push(new THREE.Vector3().crossVectors(tangents[i]!, normal).normalize());
  }

  const lerpInto = (a: THREE.Vector3, b: THREE.Vector3, k: number, out: THREE.Vector3) =>
    out.copy(a).lerp(b, k);
  const at = (u: number, out: RouteFrame) => {
    const f = Math.min(samples - 1e-6, Math.max(0, u * samples));
    const i = Math.floor(f);
    const k = f - i;
    lerpInto(points[i]!, points[i + 1]!, k, out.pos);
    lerpInto(tangents[i]!, tangents[i + 1]!, k, out.tan).normalize();
    lerpInto(normals[i]!, normals[i + 1]!, k, out.nor).normalize();
    lerpInto(binormals[i]!, binormals[i + 1]!, k, out.bin).normalize();
    out.index = index[i]! + (index[i + 1]! - index[i]!) * k;
    return out;
  };
  return {
    curve,
    length: curve.getLength(),
    samples,
    points,
    tangents,
    normals,
    binormals,
    index,
    at,
  };
}

/**
 * The vessel wall around the route: a tube whose radius follows `radiusAt(index)` and whose surface is
 * lightly folded (endothelium ridges), seen from the inside. `index` is the fractional waypoint index.
 */
export function buildLumen(
  route: RouteSampler,
  radiusAt: (index: number) => number,
  radial = 24,
  step = 2,
): THREE.BufferGeometry {
  const rings = Math.floor(route.samples / step);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const noise = (a: number, b: number) =>
    Math.sin(a * 12.9898 + b * 78.233) * 0.5 + Math.sin(a * 5.1 - b * 3.7) * 0.5;
  for (let r = 0; r <= rings; r++) {
    const i = Math.min(route.samples, r * step);
    const p = route.points[i]!;
    const n = route.normals[i]!;
    const b = route.binormals[i]!;
    const base = radiusAt(route.index[i]!);
    for (let j = 0; j <= radial; j++) {
      const v = (j / radial) * Math.PI * 2;
      const fold =
        1 + 0.045 * noise(i * 0.35, (j % radial) * 1.7) + 0.02 * Math.sin(i * 0.9 + j * 2);
      const rr = base * fold;
      positions.push(
        p.x + (n.x * Math.cos(v) + b.x * Math.sin(v)) * rr,
        p.y + (n.y * Math.cos(v) + b.y * Math.sin(v)) * rr,
        p.z + (n.z * Math.cos(v) + b.z * Math.sin(v)) * rr,
      );
      uvs.push((i / route.samples) * route.length * 3, j / radial);
    }
  }
  for (let r = 0; r < rings; r++) {
    for (let j = 0; j < radial; j++) {
      const a = r * (radial + 1) + j;
      const c = a + radial + 1;
      indices.push(a, c, a + 1, c, c + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  // The seam column is duplicated (j = 0 and j = radial): share its normals so the light has no visible line.
  const normal = geometry.getAttribute("normal");
  for (let r = 0; r <= rings; r++) {
    const a = r * (radial + 1);
    const b = a + radial;
    const nx = normal.getX(a) + normal.getX(b);
    const ny = normal.getY(a) + normal.getY(b);
    const nz = normal.getZ(a) + normal.getZ(b);
    const len = Math.hypot(nx, ny, nz) || 1;
    normal.setXYZ(a, nx / len, ny / len, nz / len);
    normal.setXYZ(b, nx / len, ny / len, nz / len);
  }
  return geometry;
}

/** A tileable grey "endothelial cell" texture used as bump / roughness for the vessel wall (browser only). */
export function tissueTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d");
  if (!g) return null;
  g.fillStyle = "#808080";
  g.fillRect(0, 0, size, size);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 160; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const rx = 10 + rnd() * 16;
    const ry = 5 + rnd() * 7;
    for (const [ox, oy] of [
      [0, 0],
      [size, 0],
      [-size, 0],
      [0, size],
      [0, -size],
    ] as const) {
      g.beginPath();
      g.ellipse(x + ox, y + oy, rx, ry, 0, 0, Math.PI * 2);
      g.fillStyle = `rgba(${150 + rnd() * 60},${150 + rnd() * 60},${150 + rnd() * 60},0.55)`;
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = "rgba(40,40,40,0.55)";
      g.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

/* ------------------------------------ organic micro-scale parts ------------------------------------ */

const lathe = (profile: [number, number][], segments = 24) => {
  const g = new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
  );
  g.computeVertexNormals();
  return g;
};

/** A slightly wavy fibre of length `len` along X, thickest in the middle (spindle shaped). */
export function fiberGeometry(
  len: number,
  radius: number,
  wobble = 0.03,
  seed = 1,
): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    pts.push(
      new THREE.Vector3(
        (u - 0.5) * len,
        Math.sin(u * 5 + seed) * wobble,
        Math.cos(u * 4 + seed * 1.7) * wobble,
      ),
    );
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  return buildTube(
    curve,
    36,
    10,
    (u) => radius * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, 0.08 + u * 0.84))),
  );
}

/** Myosin head: a teardrop with a neck, for the cross-bridges. */
export const headGeometry = () =>
  lathe(
    [
      [0, 0],
      [0.55, 0.06],
      [0.8, 0.28],
      [0.6, 0.62],
      [0.3, 0.9],
      [0.22, 1.2],
      [0.16, 1.5],
      [0, 1.55],
    ].map(([r, y]) => [r!, y!] as [number, number]),
    14,
  );

/** Z-disc: a thin plate with a rounded rim and a dimpled centre (axis along Y, lay it on its side). */
export const zDiscGeometry = () =>
  lathe(
    [
      [0, -0.045],
      [0.55, -0.05],
      [0.82, -0.04],
      [0.9, -0.01],
      [0.92, 0.0],
      [0.9, 0.01],
      [0.82, 0.04],
      [0.55, 0.05],
      [0, 0.045],
    ].map(([r, y]) => [r!, y!] as [number, number]),
    48,
  );

/** One myelin segment: a rounded sausage pinched at the nodes of Ranvier (axis along Y). */
export const myelinGeometry = () =>
  lathe(
    [
      [0.05, -0.34],
      [0.1, -0.33],
      [0.15, -0.28],
      [0.16, -0.15],
      [0.165, 0],
      [0.16, 0.15],
      [0.15, 0.28],
      [0.1, 0.33],
      [0.05, 0.34],
    ].map(([r, y]) => [r!, y!] as [number, number]),
    20,
  );

/** Neuron soma: an organic blob (displaced icosphere) — not an organ from the atlas, a single cell. */
export function somaGeometry(radius = 0.5): THREE.BufferGeometry {
  const geometry = new THREE.IcosahedronGeometry(radius, 5);
  const pos = geometry.getAttribute("position");
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    const bump =
      Math.sin(n.x * 5 + 1) * Math.sin(n.y * 4 + 2) * 0.5 + Math.sin(n.z * 7 + n.x * 3) * 0.35;
    v.multiplyScalar(1 + 0.08 * bump);
    v.y *= 0.9;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** β-receptor: an hourglass-shaped transmembrane protein (axis along Y). */
export const receptorGeometry = () =>
  lathe(
    [
      [0, -0.55],
      [0.18, -0.52],
      [0.24, -0.35],
      [0.15, -0.12],
      [0.12, 0],
      [0.16, 0.14],
      [0.26, 0.34],
      [0.2, 0.52],
      [0, 0.55],
    ].map(([r, y]) => [r!, y!] as [number, number]),
    20,
  );
