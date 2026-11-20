import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { GraphSpec } from "@/data/simulations";
import { useLang } from "@/lib/i18n";

export function LiveGraph({ graph, tall = false }: { graph: GraphSpec; tall?: boolean }) {
  const { l, t } = useLang();
  const xs = graph.data.map((d) => d.x);
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-subject" /> {t("current")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0 w-4 border-t-2 border-dashed border-muted-foreground" />{" "}
          {t("baseline")}
        </span>
        <span className="ms-auto font-mono" dir="ltr">
          {l(graph.yLabel)} ({graph.yUnit}) vs {l(graph.xLabel)} ({graph.xUnit})
        </span>
      </div>
      <div className={tall ? "h-64" : "h-48"} dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={graph.data} margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 4" />
            <XAxis
              dataKey="x"
              type="number"
              domain={[Math.min(...xs), Math.max(...xs)]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
            />
            <YAxis
              domain={[0, graph.yMax]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              allowDataOverflow
            />
            <Line
              type="monotone"
              dataKey="base"
              stroke="var(--muted-foreground)"
              strokeDasharray="5 5"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="y"
              stroke="var(--subject)"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
            <ReferenceLine
              x={graph.point.x}
              stroke="var(--subject)"
              strokeOpacity={0.4}
              strokeDasharray="3 3"
            />
            <ReferenceDot
              x={graph.point.x}
              y={Math.min(graph.point.y, graph.yMax)}
              r={7}
              fill="var(--subject)"
              stroke="var(--background)"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
