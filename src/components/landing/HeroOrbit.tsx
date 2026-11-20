import { Bot, Sparkles } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { SubjectIcon } from "@/components/common/SubjectIcon";
import { useLang } from "@/lib/i18n";

/** Decorative orbital composition for the hero (pure SVG/CSS — no WebGL needed). */
export function HeroOrbit() {
  const { lang } = useLang();
  const orbits = [
    { subject: "biology" as const, size: "inset-[4%]", anim: "animate-spin-slower" },
    { subject: "physics" as const, size: "inset-[17%]", anim: "animate-spin-slow" },
    { subject: "chemistry" as const, size: "inset-[30%]", anim: "animate-spin-slower" },
  ];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]" dir="ltr">
      <div className="absolute inset-[12%] rounded-full bg-gradient-brand opacity-20 blur-3xl" />
      {orbits.map((o) => (
        <div
          key={o.subject}
          data-subject={o.subject}
          className={`absolute ${o.size} rounded-full border border-subject/30 ${o.anim}`}
        >
          <div className="absolute -top-5 left-1/2 -translate-x-1/2">
            <div className="glass flex size-10 items-center justify-center rounded-xl glow-subject">
              <SubjectIcon subject={o.subject} className="size-5 text-subject" />
            </div>
          </div>
          <span className="absolute bottom-[12%] right-[6%] size-2 rounded-full bg-subject shadow-[var(--shadow-glow)]" />
        </div>
      ))}

      {/* Core */}
      <div className="absolute inset-[40%] flex items-center justify-center rounded-full glass-strong">
        <div className="absolute inset-0 rounded-full bg-gradient-brand opacity-25" />
        <LogoMark className="relative h-[42%] w-[62%] drop-shadow-[0_0_18px_color-mix(in_oklab,var(--phys)_55%,transparent)]" />
      </div>

      {/* Floating cards */}
      <div
        className="glass absolute -left-2 top-[8%] animate-float rounded-2xl px-3.5 py-2.5 sm:left-0"
        data-subject="physics"
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          live
        </p>
        <p className="font-mono text-sm font-bold text-subject">I = 1.20 A</p>
      </div>

      <div
        className="glass absolute -right-2 bottom-[10%] max-w-[230px] animate-float rounded-2xl p-3 [animation-delay:1.5s] sm:right-0"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-bio">
          <Bot className="size-3.5" />
          {lang === "ar" ? "المعلم الذكي" : "AI Tutor"}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {lang === "ar"
            ? "التيار قل لأن المقاومة زادت من 10Ω لـ 20Ω — تحب أشرحهالك بالعامية؟"
            : "Current fell because resistance rose from 10Ω to 20Ω — want it explained simply?"}
        </p>
      </div>

      <div className="glass absolute right-[8%] top-[2%] flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold">
        <Sparkles className="size-3.5 text-warning" />
        +50 XP
      </div>
    </div>
  );
}
