import { Layers } from "lucide-react";
import { actionLabel, type NoorAction } from "@/data/noor";
import type { Lang } from "@/lib/i18n";
import { useNoorStudio } from "@/lib/use-noor-studio";

/** The «open it» result card of a Noor Studio creation (shown in the chat history and in the Studio workspace). */

type StudioAction = Extract<NoorAction, { kind: "studio" }>;
export function NoorStudioCard({
  action,
  lang,
  onOpen,
}: {
  action: StudioAction;
  lang: Lang;
  onOpen: (a: StudioAction) => void;
}) {
  const { state } = useNoorStudio();
  const ar = lang === "ar";
  const pack =
    action.studio === "mindmap"
      ? state.mindMapPacks.find((p) => p.id === action.id)
      : state.flashcardPacks.find((p) => p.id === action.id);
  const count = pack ? ("cards" in pack ? pack.cards.length : pack.nodes.length) : 0;
  const blank = pack && "kind" in pack && pack.kind === "blank";
  return (
    <div className="flex max-w-[92%] items-center gap-2.5 rounded-2xl border border-subject/40 bg-subject/10 p-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-subject/20 text-subject">
        <Layers className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold">
          {pack ? pack.title[lang] : ar ? "(اتحذفت)" : "(deleted)"}
        </p>
        {pack && (
          <p className="text-[11px] text-muted-foreground">
            {action.studio === "mindmap"
              ? blank
                ? ar
                  ? `🧩 شبكة فاضية · ${count} عقدة`
                  : `🧩 Blank grid · ${count} nodes`
                : ar
                  ? `🧠 خريطة · ${count} عقدة`
                  : `🧠 Map · ${count} nodes`
              : ar
                ? `🗂️ بطاقات · ${count}`
                : `🗂️ Flashcards · ${count}`}
          </p>
        )}
      </div>
      <button
        type="button"
        disabled={!pack}
        onClick={() => onOpen(action)}
        className="shrink-0 rounded-full bg-subject px-3 py-1.5 text-xs font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
      >
        {actionLabel(action, lang)}
      </button>
    </div>
  );
}
