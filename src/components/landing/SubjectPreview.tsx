import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SubjectIcon } from "@/components/common/SubjectIcon";
import { countLessons, subjects, type SubjectId } from "@/data/mockCurriculum";
import { useLang } from "@/lib/i18n";

function MiniScene({ subject }: { subject: SubjectId }) {
  if (subject === "physics") {
    return (
      <svg viewBox="0 0 200 110" className="h-full w-full">
        <rect
          x="20"
          y="15"
          width="160"
          height="80"
          rx="6"
          fill="none"
          className="stroke-muted-foreground/40"
          strokeWidth="2"
        />
        <rect
          x="20"
          y="15"
          width="160"
          height="80"
          rx="6"
          fill="none"
          className="stroke-subject"
          strokeWidth="2.5"
          strokeDasharray="6 14"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-200"
            dur="3s"
            repeatCount="indefinite"
          />
        </rect>
        <polyline
          points="80,15 86,7 94,23 102,7 110,23 118,7 124,15"
          fill="none"
          className="stroke-heat"
          strokeWidth="2.5"
        />
        <circle
          cx="180"
          cy="55"
          r="11"
          className="fill-warning/30 stroke-warning"
          strokeWidth="2"
        />
        <line x1="14" y1="48" x2="26" y2="48" className="stroke-foreground" strokeWidth="3" />
        <line x1="17" y1="58" x2="23" y2="58" className="stroke-foreground" strokeWidth="3" />
      </svg>
    );
  }
  if (subject === "chemistry") {
    return (
      <svg viewBox="0 0 200 110" className="h-full w-full">
        {[...Array(10)].map((_, i) => (
          <circle
            key={i}
            r={i % 2 ? 6 : 8}
            className={i % 2 ? "fill-subject" : "fill-foreground/80"}
          >
            <animate
              attributeName="cx"
              values={`${20 + i * 16};${180 - i * 12};${20 + i * 16}`}
              dur={`${3 + (i % 4)}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values={`${20 + ((i * 37) % 70)};${90 - ((i * 23) % 60)};${20 + ((i * 37) % 70)}`}
              dur={`${2.5 + (i % 3)}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 110" className="h-full w-full">
      <circle
        cx="100"
        cy="55"
        r="44"
        fill="none"
        className="stroke-subject"
        strokeWidth="2.5"
        strokeDasharray="8 5"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="-52"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle
        cx="100"
        cy="55"
        r="16"
        className="fill-subject/25 stroke-subject"
        strokeWidth="1.5"
      />
      {[...Array(8)].map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <circle key={i} r="3.5" className="fill-foreground/80">
            <animate
              attributeName="cx"
              values={`${100 + Math.cos(a) * 95};${100 + Math.cos(a) * 30}`}
              dur={`${2 + (i % 3) * 0.6}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values={`${55 + Math.sin(a) * 55};${55 + Math.sin(a) * 20}`}
              dur={`${2 + (i % 3) * 0.6}s`}
              repeatCount="indefinite"
            />
          </circle>
        );
      })}
    </svg>
  );
}

export function SubjectPreview() {
  const { l, lang, dir } = useLang();
  const ar = lang === "ar";
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-10 flex flex-col items-start gap-2">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-phys">
          {ar ? "اختار مادتك" : "Pick a subject"}
        </p>
        <h2 className="font-display text-3xl font-bold sm:text-4xl">
          {ar ? "تلات عوالم… معمل واحد في جيبك" : "Three worlds, one lab in your pocket"}
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {subjects.map((s, i) => (
          <Link
            key={s.id}
            to="/dashboard"
            search={{ subject: s.id }}
            data-subject={s.id}
            style={{ animationDelay: `${i * 100}ms` }}
            className="group glass relative flex animate-fade-up flex-col overflow-hidden rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-subject/50 hover:glow-subject"
          >
            <div className="absolute -top-24 size-48 rounded-full bg-subject/20 blur-3xl transition-opacity group-hover:opacity-100 end-0 opacity-50" />
            <div className="relative flex items-center justify-between">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-subject/15 text-xl">
                {s.emoji}
              </span>
              <span className="rounded-full border border-subject/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-subject">
                {countLessons(s.id)} {ar ? "درس" : "lessons"}
              </span>
            </div>

            <div
              className="relative mt-5 h-32 overflow-hidden rounded-2xl border border-border bg-stage-grid"
              dir="ltr"
            >
              <MiniScene subject={s.id} />
            </div>

            <h3 className="relative mt-5 flex items-center gap-2 text-xl font-bold">
              <SubjectIcon subject={s.id} className="size-5 text-subject" />
              {l(s.name)}
            </h3>
            <p className="relative mt-1 text-sm font-semibold text-subject">{l(s.previewTitle)}</p>
            <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
              {l(s.tagline)}
            </p>

            <span className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
              {ar ? "استكشف الدروس" : "Explore lessons"}
              <Arrow className="size-4 transition-transform group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
