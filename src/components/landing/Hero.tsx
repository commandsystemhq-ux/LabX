import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Bot, Box, PlayCircle, Wallet } from "lucide-react";
import { HeroOrbit } from "./HeroOrbit";
import { Button } from "@/components/ui/button";
import { STUDENT_PRICE_EGP } from "@/data/mockCurriculum";
import { useLang } from "@/lib/i18n";

export function Hero() {
  const { lang, t, dir } = useLang();
  const ar = lang === "ar";
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const features = [
    {
      icon: Box,
      title: ar ? "محاكاة 3D لمنهج الوزارة" : "3D sims for the Ministry curriculum",
      sub: ar ? "أحياء • فيزياء • كيمياء" : "Biology • Physics • Chemistry",
      tone: "physics",
    },
    {
      icon: Bot,
      title: ar ? "معلم ذكي فاهم المشهد" : "Context-aware AI tutor",
      sub: ar ? "بيشرح بالعامية حسب اللي قدامك" : "Explains what's on your screen",
      tone: "biology",
    },
    {
      icon: Wallet,
      title: ar ? "باقات في متناول الكل" : "Affordable plans",
      sub: ar
        ? `للطالب ${STUDENT_PRICE_EGP} ج.م/شهر • باقات للمدارس`
        : `Students ${STUDENT_PRICE_EGP} EGP/mo • School plans`,
      tone: "chemistry",
    },
  ] as const;

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-dot-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pb-24 lg:pt-20">
        <div className="animate-fade-up">
          <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground">
            <span className="size-1.5 animate-blink rounded-full bg-bio" />
            {ar
              ? "مطابق لمنهج وزارة التربية والتعليم — المرحلة الثانوية"
              : "Aligned with the Egyptian Ministry curriculum — Secondary stage"}
          </span>

          <h1 className="mt-6 font-display text-4xl font-black leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
            {ar ? (
              <>
                العلوم <span className="text-gradient-brand">بتتشاف</span>
                <br />
                مش بتتحفظ.
              </>
            ) : (
              <>
                Science you can <span className="text-gradient-brand">see</span>,
                <br />
                not memorize.
              </>
            )}
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {ar
              ? "حرّك الجهد، سخّن التفاعل، ادخل جوه الخلية. محاكاة تفاعلية ثلاثية الأبعاد لكل درس في المنهج، ومعلم ذكي بيفهم إنت بتعمل إيه دلوقتي."
              : "Tune the voltage, heat a reaction, step inside a cell. Interactive 3D simulations for every lesson, with an AI tutor that knows exactly what you're looking at."}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild variant="hero" size="xl" className="rounded-full">
              <Link to="/dashboard">
                {t("startFree")}
                <Arrow />
              </Link>
            </Button>
            <Button asChild variant="glass" size="xl" className="rounded-full">
              <Link to="/lesson" search={{ id: undefined }}>
                <PlayCircle />
                {ar ? "جرّب درس قانون أوم" : "Try the Ohm's law lesson"}
              </Link>
            </Button>
          </div>

          <ul className="mt-10 grid gap-3 sm:grid-cols-3">
            {features.map((f) => (
              <li key={f.title} data-subject={f.tone} className="glass rounded-2xl p-4">
                <f.icon className="size-5 text-subject" />
                <p className="mt-3 text-sm font-bold leading-snug">{f.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{f.sub}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-fade-up [animation-delay:150ms]">
          <HeroOrbit />
        </div>
      </div>
    </section>
  );
}
