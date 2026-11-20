import { Link } from "@tanstack/react-router";
import { Check, Minus, School, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STUDENT_PRICE_EGP } from "@/data/mockCurriculum";
import { useLang, type L10n } from "@/lib/i18n";

type Mark = "yes" | "no" | "partial";

const rows: { label: L10n; sv: Mark; book: Mark; tutor: Mark }[] = [
  {
    label: { ar: "محاكاة تفاعلية ثلاثية الأبعاد", en: "Interactive 3D simulations" },
    sv: "yes",
    book: "no",
    tutor: "no",
  },
  {
    label: { ar: "معلم ذكي متاح 24 ساعة بالعامية", en: "24/7 AI tutor in Egyptian Arabic" },
    sv: "yes",
    book: "no",
    tutor: "partial",
  },
  {
    label: { ar: "مطابق لمنهج الوزارة درس بدرس", en: "Lesson-by-lesson Ministry alignment" },
    sv: "yes",
    book: "yes",
    tutor: "yes",
  },
  {
    label: { ar: "بتشوف غلطتك عملياً", en: "See your mistakes in action" },
    sv: "yes",
    book: "no",
    tutor: "partial",
  },
  {
    label: { ar: "بيشتغل على موبايل عادي", en: "Runs on an everyday phone" },
    sv: "yes",
    book: "yes",
    tutor: "no",
  },
];

function MarkIcon({ m }: { m: Mark }) {
  if (m === "yes")
    return (
      <span className="mx-auto flex size-7 items-center justify-center rounded-full bg-bio/15 text-bio">
        <Check className="size-4" />
      </span>
    );
  if (m === "partial")
    return (
      <span className="mx-auto flex size-7 items-center justify-center rounded-full bg-warning/15 text-warning">
        <Minus className="size-4" />
      </span>
    );
  return (
    <span className="mx-auto flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <X className="size-4" />
    </span>
  );
}

export function WhyStrip() {
  const { l, lang } = useLang();
  const ar = lang === "ar";
  const cols = ar
    ? ["لاب إكس", "الكتاب المدرسي", "الدروس الخصوصية"]
    : ["LabX", "Textbook", "Private lessons"];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-bio">
            {ar ? "ليه لاب إكس؟" : "Why LabX?"}
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            {ar ? "الفرق مش في الشرح… الفرق إنك تجرّب" : "The difference? You get to experiment."}
          </h2>

          <div className="glass mt-8 overflow-x-auto rounded-3xl">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-start font-semibold text-muted-foreground" />
                  {cols.map((c, i) => (
                    <th
                      key={c}
                      className={
                        "p-4 text-center font-bold " +
                        (i === 0 ? "text-gradient-brand" : "text-muted-foreground")
                      }
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label.en} className="border-b border-border/50 last:border-0">
                    <td className="p-4 font-medium">{l(r.label)}</td>
                    <td className="bg-phys/5 p-4">
                      <MarkIcon m={r.sv} />
                    </td>
                    <td className="p-4">
                      <MarkIcon m={r.book} />
                    </td>
                    <td className="p-4">
                      <MarkIcon m={r.tutor} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:pt-16">
          <div
            data-subject="physics"
            className="glass relative overflow-hidden rounded-3xl p-6 glow-subject"
          >
            <div className="absolute -top-16 size-40 rounded-full bg-subject/25 blur-3xl end-0" />
            <User className="relative size-5 text-subject" />
            <p className="relative mt-3 text-sm font-semibold text-muted-foreground">
              {ar ? "باقة الطالب" : "Student plan"}
            </p>
            <p className="relative mt-1 font-display text-4xl font-black">
              {STUDENT_PRICE_EGP}{" "}
              <span className="text-lg font-bold text-muted-foreground">
                {ar ? "ج.م / شهر" : "EGP / mo"}
              </span>
            </p>
            <p className="relative mt-2 text-sm text-muted-foreground">
              {ar
                ? "كل المواد العلمية + المعلم الذكي بدون حدود."
                : "All science subjects + unlimited AI tutor."}
            </p>
            <Button asChild variant="subject" className="relative mt-5 w-full rounded-full">
              <Link to="/dashboard">{ar ? "ابدأ مجاناً 7 أيام" : "Start a 7-day free trial"}</Link>
            </Button>
          </div>
          <div data-subject="biology" className="glass rounded-3xl p-6">
            <School className="size-5 text-subject" />
            <p className="mt-3 text-sm font-semibold text-muted-foreground">
              {ar ? "باقة المدارس" : "School plan"}
            </p>
            <p className="mt-1 text-xl font-bold">
              {ar ? "سعر خاص حسب عدد الطلاب" : "Custom pricing per student count"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {ar
                ? "وضع السبورة للمعلم، تقارير الفصل، ومتابعة الإتقان."
                : "Teacher board mode, class reports, and mastery tracking."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
