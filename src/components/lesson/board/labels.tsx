import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import * as THREE from "three";

/**
 * DOM labels for the 3D scenes. drei's <Html> mounts a separate React root per label and trips
 * React 19 when the canvas unmounts, so (like the adrenaline atlas) labels are plain DOM nodes
 * moved to the projection of their 3D anchors every frame — no React state in the render loop.
 */

export interface LabelItem {
  pos: THREE.Vector3;
  text: string;
  /** Tailwind classes for the chip. */
  className?: string;
  /** Pixel offset applied after projection. */
  dy?: number;
}

export class LabelRegistry {
  readonly items = new Map<string, LabelItem>();
  readonly elements = new Map<string, HTMLElement>();
  private listeners = new Set<() => void>();
  version = 0;
  private queued = false;

  private bump() {
    if (this.queued) return;
    this.queued = true;
    queueMicrotask(() => {
      this.queued = false;
      this.version++;
      this.listeners.forEach((l) => l());
    });
  }
  set(id: string, item: LabelItem) {
    this.items.set(id, item);
    this.bump();
  }
  delete(id: string) {
    if (this.items.delete(id)) this.bump();
  }
  clear() {
    this.items.clear();
    this.bump();
  }
  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => void this.listeners.delete(l);
  };
  getVersion = () => this.version;
}

export function useLabelRegistry() {
  return useMemo(() => new LabelRegistry(), []);
}

const DEFAULT_CLASS =
  "border border-white/25 bg-black/75 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full";

/** The chips themselves (outside the canvas). */
export function LabelOverlay({ reg }: { reg: LabelRegistry }) {
  useSyncExternalStore(reg.subscribe, reg.getVersion, () => 0);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {[...reg.items.entries()].map(([id, item]) => (
        <span
          key={id}
          ref={(el) => {
            if (el) reg.elements.set(id, el);
            else reg.elements.delete(id);
          }}
          className={`invisible absolute left-0 top-0 whitespace-nowrap ${item.className ?? DEFAULT_CLASS}`}
        >
          {item.text}
        </span>
      ))}
    </div>
  );
}

/** Inside the canvas: moves every chip to its anchor's screen position. */
export function LabelProjector({ reg }: { reg: LabelRegistry }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    for (const [id, item] of reg.items) {
      const el = reg.elements.get(id);
      if (!el) continue;
      v.copy(item.pos).project(camera);
      const visible = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
      el.style.visibility = visible ? "visible" : "hidden";
      if (visible) {
        const x = (v.x * 0.5 + 0.5) * size.width;
        const y = (-v.y * 0.5 + 0.5) * size.height + (item.dy ?? 0);
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
      }
    }
  });
  return null;
}

/** Registers one label for as long as the component is mounted (renders nothing in 3D). */
export function RegLabel({
  reg,
  id,
  pos,
  text,
  className,
  dy,
}: {
  reg: LabelRegistry;
  id: string;
  pos: [number, number, number] | THREE.Vector3;
  text: string;
  className?: string;
  dy?: number;
}) {
  const [x, y, z] = Array.isArray(pos) ? pos : [pos.x, pos.y, pos.z];
  useEffect(() => {
    reg.set(id, {
      pos: new THREE.Vector3(x, y, z),
      text,
      ...(className ? { className } : {}),
      ...(dy !== undefined ? { dy } : {}),
    });
    return () => reg.delete(id);
  }, [reg, id, x, y, z, text, className, dy]);
  return null;
}
