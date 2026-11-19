import { Languages } from "lucide-react";
import { useLang } from "@/lib/i18n";

export function LangToggle() {
  const { lang, setLang, t } = useLang();
  return (
    <div
      role="group"
      aria-label={t("langSwitchLabel")}
      className="glass flex items-center rounded-full p-0.5 text-xs font-bold"
    >
      <Languages className="mx-1.5 size-3.5 text-muted-foreground" aria-hidden />
      {(["ar", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={
            "rounded-full px-2.5 py-1 transition-colors " +
            (lang === code
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {code === "ar" ? "ع" : "EN"}
        </button>
      ))}
    </div>
  );
}
