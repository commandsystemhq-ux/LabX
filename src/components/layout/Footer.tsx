import { LogoMark } from "@/components/brand/Logo";
import { useLang } from "@/lib/i18n";

export function Footer() {
  const { t, lang } = useLang();
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <LogoMark className="size-6" />
          <span>ScienceVerse — {t("brandTagline")}</span>
        </div>
        <p>© 2026 {lang === "ar" ? "صُنع في مصر 🇪🇬" : "Made in Egypt 🇪🇬"}</p>
      </div>
    </footer>
  );
}
