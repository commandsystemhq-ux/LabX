import { Lightbulb, X } from "lucide-react";
import { useLang } from "@/lib/i18n";

interface Props {
  text: string;
  onAskTutor: () => void;
  onSnooze: () => void;
  onDismiss: () => void;
}

/** Small, non-blocking nudge. Polite live region, so screen readers announce it without stealing focus. */
export function IdleHintCard({ text, onAskTutor, onSnooze, onDismiss }: Props) {
  const { t } = useLang();
  return (
    <div
      role="status"
      aria-live="polite"
      className="glass-strong fixed inset-x-3 bottom-20 z-40 animate-fade-up rounded-2xl border border-subject/40 p-3 shadow-lg sm:inset-x-auto sm:bottom-4 sm:start-4 sm:w-80"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-subject/15 text-subject">
          <Lightbulb className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-subject">{t("idleHintTitle")}</p>
          <p className="mt-1 whitespace-pre-line break-words text-xs leading-relaxed">{text}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t("idleDismiss")}
          title={t("idleDismiss")}
          className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onAskTutor}
          className="rounded-full bg-subject px-3 py-1.5 text-[11px] font-bold text-primary-foreground transition hover:brightness-110"
        >
          {t("idleAsk")}
        </button>
        <button
          type="button"
          onClick={onSnooze}
          className="rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold hover:bg-accent"
        >
          {t("idleSnooze")}
        </button>
      </div>
    </div>
  );
}
