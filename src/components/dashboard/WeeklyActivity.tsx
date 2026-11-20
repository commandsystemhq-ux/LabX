import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { student } from "@/data/mockCurriculum";
import { useLang } from "@/lib/i18n";

export function WeeklyActivity() {
  const { l, lang } = useLang();
  const data = student.weekly.map((d) => ({ day: l(d.day), minutes: d.minutes }));
  const total = data.reduce((s, d) => s + d.minutes, 0);
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-bold">{lang === "ar" ? "نشاطك الأسبوع ده" : "This week"}</p>
        <p className="font-mono text-xs text-muted-foreground">
          {total} {lang === "ar" ? "دقيقة" : "min"}
        </p>
      </div>
      <div className="mt-4 h-28" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={lang === "ar" ? [...data].reverse() : data}>
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            />
            <Tooltip
              cursor={{ fill: "var(--accent)" }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--foreground)" }}
            />
            <Bar dataKey="minutes" fill="var(--subject)" radius={[6, 6, 2, 2]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
