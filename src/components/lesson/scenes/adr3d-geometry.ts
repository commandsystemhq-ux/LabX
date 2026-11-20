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

/** A closed brain-like blob: an icosphere with deterministic ridges (gyri). */
export function brainGeometry(radius = 0.38): THREE.BufferGeometry {
  const geometry = new THREE.IcosahedronGeometry(radius, 4);
  const pos = geometry.getAttribute("position");
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    const ridge = Math.sin(n.x * 14) * Math.sin(n.y * 12 + 1) * Math.sin(n.z * 13 + 2);
    v.multiplyScalar(1 + 0.07 * ridge);
    v.x *= 1.1;
    v.y *= 0.92;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}
