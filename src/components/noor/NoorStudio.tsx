import { ChevronDown, Layers, Palette, Pencil } from "lucide-react";
import { useState } from "react";
import type { StudioFocus, StudioIntent } from "@/data/lessons/noorStudio";
import { actionLabel, type NoorAction } from "@/data/noor";
import type { Lang } from "@/lib/i18n";
import { useNoorStudio } from "@/lib/use-noor-studio";

/** Noor Studio pieces of the chat: the quick-actions bar and the «open it» result card. */

type StudioAction = Extract<NoorAction, { kind: "studio" }>;

const intent = (
  kind: StudioIntent["kind"],
  request: string,
  extra: Partial<StudioIntent> = {},
): StudioIntent => ({
  action: "create",
  kind,
  blank: false,
  weak: false,
  request,
  ...extra,
});

export interface NoorStudioBarProps {
  lang: Lang;
  busy: boolean;
  /** Block on screen in the live board (null elsewhere). */
  block: number | null;
  /** The pack «عدّل دي» refers to, when it still exists. */
  focus: StudioFocus | null;
  onRun: (text: string, intent: StudioIntent) => void;
}

export function NoorStudioBar({ lang, busy, block, focus, onRun }: NoorStudioBarProps) {
  const ar = lang === "ar";
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const { state } = useNoorStudio();

  const alive =
    focus !== null &&
    (focus.kind === "mindmap"
      ? state.mindMapPacks.some((p) => p.id === focus.packId)
      : state.flashcardPacks.some((p) => p.id === focus.packId));
  const target = alive ? focus : null;
  const where = block ? (ar ? `جزئية ${block}` : `block ${block}`) : null;

  const makeMap = () => {
    const text = where
      ? ar
        ? `اعملّي خريطة ذهنية لـ${where}`
        : `Make me a mind map of ${where}`
      : ar
        ? "اعملّي خريطة ذهنية لنقط ضعفي"
        : "Make me a mind map of my weak spots";
    onRun(text, intent("mindmap", text, { weak: !where }));
  };
  const makeBlank = () => {
    const text = where
      ? ar
        ? `اعمل شبكة فاضية للتسميع عن ${where}`
        : `Make a blank recall grid about ${where}`
      : ar
        ? "اعمل شبكة فاضية للتسميع على نقط ضعفي"
        : "Make a blank recall grid on my weak spots";
    onRun(text, intent("mindmap", text, { blank: true, weak: !where }));
  };
  const makeCards = () => {
    const text = ar ? "ولّد بطاقات لنقط ضعفي" : "Make flashcards for my weak spots";
    onRun(text, intent("flashcards", text, { weak: true }));
  };
  const edit = (text: string, extra: Partial<StudioIntent> = {}) => {
    if (!target) return;
    onRun(text, intent(target.kind, text, { action: "edit", ...extra }));
    setEditing(false);
  };

  const chip =
    "shrink-0 rounded-full border border-subject/30 bg-subject/10 px-3 py-1.5 text-xs font-semibold text-subject transition hover:bg-subject/20 disabled:pointer-events-none disabled:opacity-40";

  return (
    <section
      aria-label={ar ? "استوديو نور" : "Noor Studio"}
      className="border-b border-border px-4 py-2"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 text-xs font-bold text-foreground"
      >
        <Palette className="size-3.5 text-subject" /> {ar ? "🎨 استوديو نور" : "🎨 Noor Studio"}
        <ChevronDown className={`ms-auto size-3.5 transition ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button type="button" className={chip} disabled={busy} onClick={makeMap}>
            {ar ? "ولّد خريطة ذهنية مخصصة" : "Generate a custom mind map"}
          </button>
          <button type="button" className={chip} disabled={busy} onClick={makeBlank}>
            {ar ? "اعمل شبكة فاضية للتسميع" : "Make a blank recall grid"}
          </button>
          <button type="button" className={chip} disabled={busy} onClick={makeCards}>
            {ar ? "ولّد بطاقات لنقط ضعفي" : "Flashcards for my weak spots"}
          </button>
          <button
            type="button"
            className={chip}
            disabled={busy || !target}
            aria-pressed={editing}
            title={
              target ? undefined : ar ? "اعمل خريطة أو بطاقات الأول" : "Make a map or cards first"
            }
            onClick={() => setEditing((e) => !e)}
          >
            <Pencil className="me-1 inline size-3" />
            {ar ? "عدّل الرزمة/الخريطة الحالية" : "Edit the current pack/map"}
          </button>
          {editing && target && (
            <div className="flex basis-full flex-wrap gap-1.5 rounded-xl border border-border bg-background/60 p-2">
              <button
                type="button"
                className={chip}
                disabled={busy}
                onClick={() => edit(ar ? "خليها أبسط بالعامية" : "Make it simpler")}
              >
                {ar ? "أبسط بالعامية" : "Simpler"}
              </button>
              <button
                type="button"
                className={chip}
                disabled={busy}
                onClick={() => edit(ar ? "اختصر الإجابات" : "Shorten the answers")}
              >
                {ar ? "اختصرها" : "Shorter"}
              </button>
              <button
                type="button"
                className={chip}
                disabled={busy}
                onClick={() =>
                  edit(
                    target.kind === "mindmap"
                      ? ar
                        ? "زوّد فروع"
                        : "Add more branches"
                      : ar
                        ? "زوّد بطاقات"
                        : "Add more cards",
                  )
                }
              >
                {ar ? "زوّد" : "Add more"}
              </button>
              {target.kind === "mindmap" && (
                <>
                  <button
                    type="button"
                    className={chip}
                    disabled={busy}
                    onClick={() =>
                      edit(ar ? "حولها لشبكة فاضية للتسميع" : "Turn it into a blank recall grid", {
                        blank: true,
                      })
                    }
                  >
                    {ar ? "حوّلها شبكة فاضية" : "Make it blank"}
                  </button>
                  <button
                    type="button"
                    className={chip}
                    disabled={busy}
                    onClick={() =>
                      edit(
                        ar
                          ? "رجعها خريطة مليانة بالإجابات"
                          : "Turn it back into a full map with answers",
                      )
                    }
                  >
                    {ar ? "رجّعها مليانة" : "Make it full"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

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
