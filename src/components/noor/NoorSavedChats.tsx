import { ArrowLeft, FolderOpen, Trash2 } from "lucide-react";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import type { SavedChat } from "@/lib/noor-chat";

type Armed = { id: string; kind: "open" | "delete" } | null;

/**
 * The list of manually saved conversations. Opening one while the current chat has messages, and
 * deleting any, take a second click to confirm. Titles are plain text (never HTML).
 */
export function NoorSavedChats({
  chats,
  loading,
  hasCurrent,
  onOpen,
  onDelete,
  onBack,
}: {
  chats: SavedChat[];
  loading: boolean;
  hasCurrent: boolean;
  onOpen: (chat: SavedChat) => void;
  onDelete: (id: string) => Promise<boolean>;
  onBack: () => void;
}) {
  const { t, lang } = useLang();
  const [armed, setArmed] = useState<Armed>(null);
  const [failed, setFailed] = useState(false);

  const open = (chat: SavedChat) => {
    if (hasCurrent && !(armed?.id === chat.id && armed.kind === "open")) {
      setArmed({ id: chat.id, kind: "open" });
      return;
    }
    setArmed(null);
    onOpen(chat);
  };

  const remove = async (chat: SavedChat) => {
    if (!(armed?.id === chat.id && armed.kind === "delete")) {
      setArmed({ id: chat.id, kind: "delete" });
      return;
    }
    setArmed(null);
    setFailed(!(await onDelete(chat.id)));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 rounded-xl border border-border px-2 py-1.5 text-[11px] font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="size-3.5 rtl:-scale-x-100" />
          {t("noorBackToChat")}
        </button>
        <p className="flex-1 text-sm font-bold">{t("noorSavedTitle")}</p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4" aria-busy={loading}>
        {failed && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/10 p-2.5 text-xs"
          >
            {t("noorDeleteFailed")}
          </p>
        )}
        {loading && chats.length === 0 ? (
          <p role="status" className="text-xs text-muted-foreground">
            {t("authLoading")}
          </p>
        ) : chats.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            {t("noorSavedEmpty")}
          </p>
        ) : (
          chats.map((chat) => {
            const openArmed = armed?.id === chat.id && armed.kind === "open";
            const deleteArmed = armed?.id === chat.id && armed.kind === "delete";
            return (
              <div key={chat.id} className="rounded-2xl border border-border bg-background/60 p-3">
                <p dir="auto" className="break-words text-sm font-semibold">
                  {chat.title}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {chat.savedAt
                    ? new Date(chat.savedAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")
                    : "—"}{" "}
                  · {chat.messages.length.toLocaleString("en-US")} {t("noorMsgsShort")}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => open(chat)}
                    className={
                      "flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition " +
                      (openArmed
                        ? "border-warning/60 bg-warning/15 text-warning"
                        : "border-subject/40 bg-subject/10 text-subject hover:bg-subject/20")
                    }
                  >
                    <FolderOpen className="size-3.5" />
                    {openArmed ? t("noorConfirmOpen") : t("noorOpenChat")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(chat)}
                    className={
                      "flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition " +
                      (deleteArmed
                        ? "border-destructive/60 bg-destructive/15 text-destructive"
                        : "border-border text-muted-foreground hover:bg-accent hover:text-foreground")
                    }
                  >
                    <Trash2 className="size-3.5" />
                    {deleteArmed ? t("noorConfirmDelete") : t("noorDeleteChat")}
                  </button>
                  {(openArmed || deleteArmed) && (
                    <button
                      type="button"
                      onClick={() => setArmed(null)}
                      className="rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {t("noorCancel")}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
