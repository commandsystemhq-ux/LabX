import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ChevronDown, GraduationCap, LogOut, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { LangToggle } from "@/components/common/LangToggle";
import { Button } from "@/components/ui/button";
import { DEFAULT_GRADE, grades, type GradeId } from "@/data/mockCurriculum";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";

export function GradePreview({ active = DEFAULT_GRADE }: { active?: GradeId | undefined }) {
  const { l, t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = grades.find((g) => g.id === active) ?? grades[0]!;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent/60"
      >
        <GraduationCap className="size-4 text-phys" />
        <span className="hidden text-muted-foreground md:inline">{t("grade")}:</span>
        <span>{l(current.short)}</span>
        <ChevronDown className={"size-3.5 transition-transform " + (open ? "rotate-180" : "")} />
      </button>
      {open && (
        <div className="glass-strong absolute top-full z-50 mt-2 w-60 animate-fade-up rounded-xl p-1.5 start-0">
          {grades.map((g) => (
            <Link
              key={g.id}
              to="/dashboard"
              search={{ grade: g.id }}
              onClick={() => setOpen(false)}
              className={
                "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent " +
                (g.id === active ? "text-phys" : "text-foreground")
              }
            >
              {l(g.name)}
              {g.id === active && <span className="size-1.5 rounded-full bg-phys" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountActions() {
  const { t, dir } = useLang();
  const { status, user, configured, signOut } = useAuth();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  if (status === "loading") return <span aria-hidden className="h-8 w-24" />;

  if (user) {
    return (
      <>
        <Link
          to="/auth"
          aria-label={t("account")}
          className="glass hidden max-w-[10rem] items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent/60 md:flex"
        >
          <UserRound className="size-4 shrink-0 text-phys" />
          <span className="truncate">{user.name || user.email}</span>
        </Link>
        <Button asChild variant="hero" size="sm" className="rounded-full px-4">
          <Link to="/dashboard">
            {t("dashboard")}
            <Arrow />
          </Link>
        </Button>
        <Button
          type="button"
          variant="glass"
          size="icon"
          className="rounded-full"
          aria-label={t("signOut")}
          title={t("signOut")}
          onClick={() => void signOut()}
        >
          <LogOut />
        </Button>
      </>
    );
  }

  return (
    <>
      {configured && (
        <Button asChild variant="glass" size="sm" className="rounded-full px-4">
          <Link to="/auth" search={{ mode: "signin" }}>
            {t("signIn")}
          </Link>
        </Button>
      )}
      <Button asChild variant="hero" size="sm" className="rounded-full px-4">
        {configured ? (
          <Link to="/auth" search={{ mode: "signup" }}>
            {t("startFree")}
            <Arrow />
          </Link>
        ) : (
          <Link to="/dashboard">
            {t("startFree")}
            <Arrow />
          </Link>
        )}
      </Button>
    </>
  );
}

export function Navbar({ grade }: { grade?: GradeId | undefined }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <GradePreview active={grade} />
          </div>
          <LangToggle />
          <AccountActions />
        </div>
      </nav>
    </header>
  );
}
