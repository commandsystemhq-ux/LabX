import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useLang } from "@/lib/i18n";
import { worldDrive, type Live } from "./adr3d-model";
import type { SceneProps } from "./sceneUtils";

// The three.js engine is a separate chunk that is only fetched in a browser with WebGL.
const AdrenalineCanvas = lazy(() => import("./AdrenalineCanvas"));

let webglSupport: boolean | undefined;

/** True when a WebGL context can be created (false on the server, in jsdom and with GPU blocked). */
export function detectWebGL(): boolean {
  if (webglSupport !== undefined) return webglSupport;
  if (typeof window === "undefined" || !("WebGLRenderingContext" in window)) return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ??
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    webglSupport = Boolean(gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport ?? false;
}

class Boundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch() {
    /* WebGL context creation failed: the fallback below keeps the lesson usable. */
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Shown while the 3D engine downloads, or when WebGL is unavailable: the readouts still work. */
function Placeholder({ message, ar }: { message: { ar: string; en: string }; ar: boolean }) {
  return (
    <div
      role="status"
      dir={ar ? "rtl" : "ltr"}
      className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground"
    >
      {ar ? message.ar : message.en}
    </div>
  );
}

const NO_WEBGL = {
  ar: "العرض ثلاثي الأبعاد محتاج متصفح بيدعم WebGL. القراءات والرسم البياني والتحكم شغالين عادي.",
  en: "The 3D view needs a browser with WebGL. The readouts, graph and controls still work.",
};
const LOADING = { ar: "جاري تحميل العالم ثلاثي الأبعاد…", en: "Loading the 3D world…" };

/**
 * Host for the 3D adrenaline journey. It keeps the standard `SceneProps` contract: the live values
 * are copied into a ref on every render and read by the render loop, so neither the stage clock nor
 * the sliders ever re-render the three.js tree.
 */
export function AdrenalineStage(props: SceneProps & { mode: "macro" | "molecular" }) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const drive = worldDrive(props.values);
  const live = useRef<Live>({
    t: props.t,
    values: props.values,
    drive,
    flow: props.flow,
    hazard: props.hazard,
  });
  live.current = {
    t: props.t,
    values: props.values,
    drive,
    flow: props.flow,
    hazard: props.hazard,
  };

  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => setSupported(detectWebGL()), []);

  if (supported === false) return <Placeholder message={NO_WEBGL} ar={ar} />;
  if (supported === null) return <Placeholder message={LOADING} ar={ar} />;

  return (
    <Boundary fallback={<Placeholder message={NO_WEBGL} ar={ar} />}>
      <Suspense fallback={<Placeholder message={LOADING} ar={ar} />}>
        <AdrenalineCanvas
          live={live}
          mode={props.mode}
          ar={ar}
          labels={props.labels}
          neural={props.layers["brain"] ?? true}
          signals={props.layers["signals"] ?? false}
          hazard={props.hazard}
          dilation={drive.dilation}
          stenosis={drive.stenosis}
          bound={drive.boundReceptors}
          blocked={props.values.fault === 3}
        />
      </Suspense>
    </Boundary>
  );
}
