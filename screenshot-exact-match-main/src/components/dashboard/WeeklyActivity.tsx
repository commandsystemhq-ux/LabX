import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { findLesson } from "@/data/mockCurriculum";
import { useLang } from "@/lib/i18n";
import { dayKey, type ProgressState } from "@/lib/progress";
import { useIsClient } from "@/lib/use-is-client";
import { useProgress } from "@/lib/use-progress";

const DAYS = 7;

/** Estimated minutes per day for the last week: each lesson counts on the day it was last worked on. */
function weeklyMinutes(progress: ProgressState, now: Date, locale: string) {
  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (DAYS - 1 - i));
    return {
      key: dayKey(d),
      day: d.toLocaleDateString(locale, { weekday: "short" }),
      minutes: 0,
    };
  });
  for (const [id, entry] of Object.entries(progress.lessons)) {
    if (!entry.updatedAt) continue;
    const slot = days.find((d) => d.key === dayKey(new Date(entry.updatedAt)));
    if (slot) slot.minutes += findLesson(id).lesson.minutes;
  }
  return days.map(({ day, minutes }) => ({ day, minutes }));
}

export function WeeklyActivity() {
  const { t, lang } = useLang();
  const progress = useProgress();
  const isClient = useIsClient();
  const data = isClient
    ? weeklyMinutes(progress, new Date(), lang === "ar" ? "ar-EG" : "en-US")
    : [];
  const total = data.reduce((s, d) => s + d.minutes, 0);
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-bold">{lang === "ar" ? "نشاطك الأسبوع ده" : "This week"}</p>
        <p className="font-mono text-xs text-muted-foreground">
          {total} {lang === "ar" ? "دقيقة" : "min"}
        </p>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{t("weeklyEstimate")}</p>
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
