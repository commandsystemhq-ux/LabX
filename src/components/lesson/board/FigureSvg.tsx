import { memo, type ReactNode } from "react";
import type { Callout, Figure, Shape, Tone } from "@/data/lessons/supportFigures";
import type { Lang } from "@/lib/i18n";

/**
 * The 2D «ministry exam» figure: a paper-white schematic with numbered leader lines. The same
 * component draws the answer key (`show`), the practice sheet with hidden data (`hide`) and the
 * interactive labelling sheet (`slots`).
 */

const TONES: Record<Tone, { fill: string; stroke: string }> = {
  none: { fill: "none", stroke: "#E2E8F0" },
  ink: { fill: "none", stroke: "#E2E8F0" },
  soft: { fill: "#E2E8F0", stroke: "#38BDF8" },
  wall: { fill: "#bbf7d0", stroke: "#38BDF8" },
  cyto: { fill: "#fef9c3", stroke: "#38BDF8" },
  vac: { fill: "#bae6fd", stroke: "#38BDF8" },
  nuc: { fill: "#ddd6fe", stroke: "#38BDF8" },
  green: { fill: "#4ade80", stroke: "#38BDF8" },
  mito: { fill: "#fdba74", stroke: "#38BDF8" },
  bone: { fill: "#f5ecd0", stroke: "#38BDF8" },
  cart: { fill: "#bfdbfe", stroke: "#38BDF8" },
  musc: { fill: "#fca5a5", stroke: "#38BDF8" },
  lig: { fill: "none", stroke: "#38BDF8" },
  tend: { fill: "#fde68a", stroke: "#38BDF8" },
  cutin: { fill: "none", stroke: "#38BDF8" },
  xyl: { fill: "#fecaca", stroke: "#38BDF8" },
  phl: { fill: "#bfdbfe", stroke: "#38BDF8" },
};

function drawShape(s: Shape, key: string, revealed?: ReadonlySet<string>): ReactNode {
  if ("part" in s && s.part && revealed && !revealed.has(s.part)) return null;
  switch (s.t) {
    case "path": {
      const tone = TONES[s.tone ?? "ink"];
      return (
        <path
          key={key}
          d={s.d}
          fill={s.open ? "none" : tone.fill}
          stroke={tone.stroke}
          strokeWidth={s.sw ?? 1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={s.dash ? "4 3" : undefined}
        />
      );
    }
    case "ellipse": {
      const tone = TONES[s.tone ?? "ink"];
      return (
        <ellipse
          key={key}
          cx={s.cx}
          cy={s.cy}
          rx={s.rx}
          ry={s.ry}
          fill={tone.fill}
          stroke={tone.stroke}
          strokeWidth={s.sw ?? 1.5}
          strokeDasharray={s.dash ? "4 3" : undefined}
          transform={s.rot ? `rotate(${s.rot} ${s.cx} ${s.cy})` : undefined}
        />
      );
    }
    case "rect": {
      const tone = TONES[s.tone ?? "ink"];
      return (
        <rect
          key={key}
          x={s.x}
          y={s.y}
          width={s.w}
          height={s.h}
          rx={s.rx}
          fill={tone.fill}
          stroke={tone.stroke}
          strokeWidth={s.sw ?? 1.5}
        />
      );
    }
    case "text":
      return (
        <text key={key} x={s.x} y={s.y} fontSize={s.size ?? 12} fill="#E2E8F0" textAnchor="middle">
          {s.s}
        </text>
      );
    case "mirror":
      return (
        <g key={key}>
          {s.shapes.map((c, i) => drawShape(c, `${key}-${i}`, revealed))}
          <g transform="translate(520 0) scale(-1 1)">
            {s.shapes.map((c, i) => drawShape(c, `${key}-m${i}`, revealed))}
          </g>
        </g>
      );
  }
}

const COL_X = { l: 62, r: 458 } as const;
const LEAD_X = { l: 118, r: 402 } as const;

function labelPos(c: Callout): { x: number; y: number; lx: number; ly: number } {
  if (c.side === "in") {
    const x = c.tx ?? c.ax;
    return { x, y: c.ly, lx: x, ly: c.ly - 9 };
  }
  return { x: COL_X[c.side], y: c.ly, lx: LEAD_X[c.side], ly: c.ly - 4 };
}

export type LabelMode = "show" | "hide" | "slots";

export interface FigureSvgProps {
  figure: Figure;
  lang: Lang;
  mode?: LabelMode;
  /** Callout ids or groups that pulse. */
  marks?: readonly string[];
  /** `slots` mode: callout id → text of the label placed there. */
  placed?: Readonly<Record<string, string>>;
  /** `slots` mode: callout ids to colour red / green after checking. */
  wrong?: ReadonlySet<string>;
  right?: ReadonlySet<string>;
  /** `slots` mode: callouts that are part of the task (others stay labelled). */
  active?: ReadonlySet<string>;
  selected?: string | null;
  onCallout?: (id: string) => void;
  /** `slots` mode: a label chip was dropped on a callout. */
  onDropLabel?: (calloutId: string, payload: string) => void;
  /** Assembly mode: shapes tagged with a `part` are drawn only once that part is in this set. */
  revealed?: ReadonlySet<string>;
  className?: string;
  /** Callout ids to number in `hide` mode (default: all). */
  ariaLabel?: string;
}

function CalloutMark({
  c,
  lang,
  mode,
  n,
  text,
  state,
  pulsing,
  selected,
  onCallout,
  onDropLabel,
}: {
  c: Callout;
  lang: Lang;
  mode: LabelMode;
  n: number;
  text: string | undefined;
  state: "none" | "right" | "wrong";
  pulsing: boolean;
  selected: boolean;
  onCallout: ((id: string) => void) | undefined;
  onDropLabel: ((calloutId: string, payload: string) => void) | undefined;
}) {
  const { x, y, lx, ly } = labelPos(c);
  const name = c.name[lang];
  const color = state === "right" ? "#15803d" : state === "wrong" ? "#b91c1c" : "#E2E8F0";
  const long = name.length * 6.4 > 112;
  const interactive = mode === "slots" && onCallout;
  const shown = mode === "show" ? name : mode === "slots" ? (text ?? "") : "";
  return (
    <g
      data-callout={c.id}
      onClick={interactive ? () => onCallout(c.id) : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onCallout(c.id);
              }
            }
          : undefined
      }
      onDragOver={interactive && onDropLabel ? (e) => e.preventDefault() : undefined}
      onDrop={
        interactive && onDropLabel
          ? (e) => {
              e.preventDefault();
              onDropLabel(c.id, e.dataTransfer.getData("text/plain"));
            }
          : undefined
      }
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `${n}` : undefined}
      style={interactive ? { cursor: "pointer" } : undefined}
    >
      {pulsing && (
        <circle cx={c.ax} cy={c.ay} r="11" fill="none" stroke="#e11d48" strokeWidth="2">
          <animate attributeName="r" values="6;14;6" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite" />
        </circle>
      )}
      <line x1={lx} y1={ly} x2={c.ax} y2={c.ay} stroke={color} strokeWidth="1" />
      {mode === "slots" ? (
        <circle
          cx={c.ax}
          cy={c.ay}
          r="9"
          fill={selected ? "#fde68a" : "#ffffffcc"}
          stroke={color}
          strokeWidth={selected ? 2.5 : 1.4}
          strokeDasharray={text ? undefined : "3 2"}
        />
      ) : (
        <circle cx={c.ax} cy={c.ay} r="2.6" fill={color} />
      )}
      {mode === "slots" && (
        <text
          x={c.ax}
          y={c.ay + 3.5}
          fontSize="10"
          fontWeight="700"
          textAnchor="middle"
          fill={color}
        >
          {n}
        </text>
      )}
      {mode === "hide" ? (
        <g>
          <circle cx={x} cy={y} r="9" fill="#fff" stroke={color} strokeWidth="1.2" />
          <text x={x} y={y + 3.5} fontSize="10" fontWeight="700" textAnchor="middle" fill={color}>
            {n}
          </text>
        </g>
      ) : mode === "slots" ? (
        <g>
          <rect
            x={x - 56}
            y={y - 10}
            width="112"
            height="20"
            rx="6"
            fill={selected ? "#fef3c7" : "#fff"}
            stroke={color}
            strokeWidth={selected ? 2 : 1}
            strokeDasharray={text ? undefined : "3 2"}
          />
          <text
            x={x - 48}
            y={y + 4}
            fontSize="9.5"
            fontWeight="700"
            fill="#64748b"
            textAnchor="middle"
          >
            {n}
          </text>
          <text
            x={x + 4}
            y={y + 4}
            fontSize="10.5"
            fontWeight="600"
            textAnchor="middle"
            fill={color}
            {...(text && text.length * 6 > 92
              ? { textLength: 92, lengthAdjust: "spacingAndGlyphs" }
              : {})}
          >
            {text ?? ""}
          </text>
        </g>
      ) : (
        <text
          x={x}
          y={y + 4}
          fontSize="11.5"
          fontWeight="600"
          textAnchor="middle"
          fill={color}
          stroke="#ffffff"
          strokeWidth="3"
          paintOrder="stroke"
          {...(long ? { textLength: 112, lengthAdjust: "spacingAndGlyphs" } : {})}
        >
          {shown}
        </text>
      )}
    </g>
  );
}

export const FigureSvg = memo(function FigureSvg({
  figure,
  lang,
  mode = "show",
  marks = [],
  placed,
  wrong,
  right,
  active,
  selected,
  onCallout,
  onDropLabel,
  revealed,
  className,
  ariaLabel,
}: FigureSvgProps) {
  const markSet = new Set(marks);
  return (
    <svg
      viewBox={`0 0 ${figure.w} ${figure.h}`}
      className={className}
      role="img"
      aria-label={ariaLabel ?? figure.title[lang]}
      style={{ background: "#1e293b", borderRadius: 16, direction: "ltr" }}
    >
      <rect
        x="1"
        y="1"
        width={figure.w - 2}
        height={figure.h - 2}
        rx="14"
        fill="none"
        stroke="#38BDF8"
      />
      {figure.shapes.map((s, i) => drawShape(s, `s${i}`, revealed))}
      {figure.callouts.map((c, i) => {
        const inTask = mode !== "slots" || !active || active.has(c.id);
        return (
          <CalloutMark
            key={c.id}
            c={c}
            lang={lang}
            mode={inTask ? mode : "show"}
            n={i + 1}
            text={placed?.[c.id]}
            state={right?.has(c.id) ? "right" : wrong?.has(c.id) ? "wrong" : "none"}
            pulsing={markSet.has(c.id) || markSet.has(c.group)}
            selected={selected === c.id}
            onCallout={inTask ? onCallout : undefined}
            onDropLabel={inTask ? onDropLabel : undefined}
          />
        );
      })}
    </svg>
  );
});
