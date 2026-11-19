import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";

export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <linearGradient id="sv-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--bio)" />
          <stop offset="50%" stopColor="var(--phys)" />
          <stop offset="100%" stopColor="var(--chem)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="var(--surface)" stroke="url(#sv-logo)" strokeWidth="1.5" />
      <ellipse cx="20" cy="20" rx="13" ry="5.2" fill="none" stroke="url(#sv-logo)" strokeWidth="1.6" transform="rotate(30 20 20)" />
      <ellipse cx="20" cy="20" rx="13" ry="5.2" fill="none" stroke="url(#sv-logo)" strokeWidth="1.6" transform="rotate(-30 20 20)" />
      <circle cx="20" cy="20" r="3.4" fill="var(--phys)" />
    </svg>
  );
}

export function Logo() {
  const { t } = useLang();
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="ScienceVerse">
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold tracking-tight">
          Science<span className="text-gradient-brand">Verse</span>
        </span>
        <span className="mt-1 hidden text-[10px] text-muted-foreground sm:block">{t("brandTagline")}</span>
      </span>
    </Link>
  );
}
