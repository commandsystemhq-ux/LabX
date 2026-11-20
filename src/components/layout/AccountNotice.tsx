import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";

/** Explains where progress is going: guest (not saved), syncing, or a sync problem to retry. */
export function AccountNotice() {
  const { t } = useLang();
  const { status, configured, sync, retrySync } = useAuth();

  if (status === "loading") return null;

  if (status === "guest") {
    if (!configured) return null;
    return (
      <p
        role="status"
        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs"
      >
        <span>{t("guestNotice")}</span>
        <Link
          to="/auth"
          search={{ mode: "signin" }}
          className="font-bold text-foreground underline underline-offset-4"
        >
          {t("signIn")}
        </Link>
      </p>
    );
  }

  if (sync === "syncing") {
    return (
      <p role="status" className="rounded-2xl border border-border px-4 py-2.5 text-xs">
        {t("syncSyncing")}
      </p>
    );
  }

  if (sync === "error") {
    return (
      <p
        role="alert"
        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-xs"
      >
        <span>{t("syncError")}</span>
        <button
          type="button"
          onClick={retrySync}
          className="font-bold underline underline-offset-4"
        >
          {t("syncRetry")}
        </button>
      </p>
    );
  }

  return null;
}
