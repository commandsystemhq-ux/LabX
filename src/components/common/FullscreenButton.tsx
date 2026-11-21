import { Maximize, Minimize } from "lucide-react";
import { useLang } from "@/lib/i18n";

/** «ملء الشاشة ⛶» toggle shared by the labs and the board stage. */
export function FullscreenButton({
  active,
  onToggle,
  className = "",
}: {
  active: boolean;
  onToggle: () => void;
  className?: string;
}) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const label = active
    ? ar
      ? "إنهاء ملء الشاشة"
      : "Exit full screen"
    : ar
      ? "ملء الشاشة"
      : "Full screen";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={
        "flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-3 py-1.5 text-xs font-bold transition hover:bg-accent " +
        className
      }
    >
      {active ? <Minimize className="size-3.5" /> : <Maximize className="size-3.5" />}
      <span className="hidden sm:inline">{label}</span>
      <span aria-hidden>⛶</span>
    </button>
  );
}
