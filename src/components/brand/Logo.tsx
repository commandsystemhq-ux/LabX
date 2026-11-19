import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";

export function LogoMark({ className = "h-8 w-11" }: { className?: string }) {
  return (
    <img
      src="/logo-mark.png"
      alt=""
      aria-hidden
      width={512}
      height={512}
      decoding="async"
      draggable={false}
      className={"select-none object-contain " + className}
    />
  );
}

export function Logo() {
  const { t } = useLang();
  return (
    <Link to="/" className="flex items-center gap-3" aria-label="LabX">
      <LogoMark className="h-8 w-11 drop-shadow-[0_0_14px_color-mix(in_oklab,var(--phys)_45%,transparent)]" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
          Lab<span className="text-gradient-brand">X</span>
        </span>
        <span className="mt-1 hidden text-[10px] text-muted-foreground sm:block">
          {t("brandTagline")}
        </span>
      </span>
    </Link>
  );
}
