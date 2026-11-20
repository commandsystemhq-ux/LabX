import { useMemo, useState } from "react";
import { FIGURES } from "@/data/lessons/supportFigures";
import { MAX_TEXT, MAX_TITLE, type NotebookEntry } from "@/data/lessons/supportNotebook";
import type { FigureId } from "@/data/lessons/supportTypes";
import { useLang, type L10n } from "@/lib/i18n";
import { FigureSvg } from "./FigureSvg";
import { S } from "./strings";

interface Props {
  entries: readonly NotebookEntry[];
  /** Block currently on screen (new notes are filed under it). */
  block: number;
  titleOf: (block: number) => L10n;
  savedAt: number | null;
  onAdd: (title: string, text: string, block: number) => void;
  onRemove: (id: string) => void;
  onSaveNow: () => void;
  onClose: () => void;
}

function Curve({ values, figure }: { values: number[]; figure: string }) {
  const n = Math.max(2, values.length);
  const pts = values.map((v, i) => `${8 + (i * 184) / (n - 1)},${62 - (v * 52) / 100}`).join(" ");
  return (
    <svg
      viewBox="0 0 200 70"
      className="h-20 w-full rounded-lg"
      style={{ background: "#fffdf7" }}
      role="img"
      aria-label={figure}
    >
      <path d="M8 6V62H194" stroke="#94a3b8" fill="none" />
      <polyline points={pts} fill="none" stroke="#d97706" strokeWidth="2" />
    </svg>
  );
}

const isFigureId = (s: string | undefined): s is FigureId => !!s && s in FIGURES;

/** «كراسة المعمل»: notes, labelled drawings, curves and experiments, all kept on this device. */
export function Notebook({
  entries,
  block,
  titleOf,
  savedAt,
  onAdd,
  onRemove,
  onSaveNow,
  onClose,
}: Props) {
  const { l, lang } = useLang();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<number | 0>(0);

  const shown = useMemo(
    () => entries.filter((e) => filter === 0 || e.block === filter),
    [entries, filter],
  );

  return (
    <aside
      aria-label={l(S.notebook)}
      className="glass-strong fixed inset-x-2 bottom-2 top-16 z-50 flex flex-col overflow-hidden rounded-3xl sm:inset-x-auto sm:start-4 sm:w-[420px]"
    >
      <header className="flex items-center gap-2 border-b border-border p-3">
        <h3 className="flex-1 font-bold">📓 {l(S.notebook)}</h3>
        <button
          type="button"
          onClick={onSaveNow}
          className="rounded-full border border-subject/40 px-3 py-1 text-xs font-semibold text-subject hover:bg-subject/10"
        >
          {savedAt ? l(S.saved) : l(S.save)}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-border px-3 py-1 text-xs font-semibold hover:bg-accent"
        >
          {l(S.close)}
        </button>
      </header>
      <form
        className="space-y-2 border-b border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() && !text.trim()) return;
          onAdd(title, text, block);
          setTitle("");
          setText("");
        }}
      >
        <p className="text-[11px] text-muted-foreground">
          {l(S.block)} {block} — {l(titleOf(block))}
        </p>
        <input
          value={title}
          maxLength={MAX_TITLE}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={lang === "ar" ? "عنوان الملاحظة" : "Note title"}
          aria-label={lang === "ar" ? "عنوان الملاحظة" : "Note title"}
          className="h-9 w-full rounded-lg border border-input bg-background/60 px-2 text-sm outline-none focus:border-subject"
        />
        <textarea
          value={text}
          maxLength={MAX_TEXT}
          rows={3}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            lang === "ar"
              ? "اكتب ملاحظتك للمراجعة قبل الامتحان…"
              : "Write a note to review before the exam…"
          }
          aria-label={lang === "ar" ? "الملاحظة" : "Note"}
          className="w-full resize-y rounded-lg border border-input bg-background/60 p-2 text-sm outline-none focus:border-subject"
        />
        <button
          type="submit"
          disabled={!title.trim() && !text.trim()}
          className="rounded-full bg-subject px-4 py-1.5 text-sm font-bold text-primary-foreground disabled:opacity-40"
        >
          + {lang === "ar" ? "أضف ملاحظة" : "Add note"}
        </button>
      </form>
      <div className="flex items-center gap-2 px-3 pt-2">
        <label className="text-xs font-semibold" htmlFor="nb-filter">
          {l(S.blocks)}:
        </label>
        <select
          id="nb-filter"
          value={filter}
          onChange={(e) => setFilter(Number(e.target.value))}
          className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
        >
          <option value={0}>{lang === "ar" ? "الكل" : "All"}</option>
          {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} — {l(titleOf(n)).slice(0, 28)}
            </option>
          ))}
        </select>
        <span className="ms-auto text-[11px] text-muted-foreground">{shown.length}</span>
      </div>
      <ul className="flex-1 space-y-2 overflow-y-auto p-3">
        {shown.length === 0 && (
          <li className="text-sm text-muted-foreground">
            {lang === "ar"
              ? "الكراسة فاضية — احفظ رسوماتك وتجاربك من الشغل العملي."
              : "The notebook is empty — save your drawings and experiments from the lab."}
          </li>
        )}
        {shown.map((e) => (
          <li key={e.id} className="rounded-xl border border-border bg-background/50 p-2.5">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground">
                  {e.kind === "note" ? "📝" : e.kind === "drawing" ? "✏️" : "🧪"} {l(S.block)}{" "}
                  {e.block} · {new Date(e.at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB")}
                </p>
                {e.title && <p className="break-words text-sm font-bold">{e.title}</p>}
              </div>
              <button
                type="button"
                onClick={() => onRemove(e.id)}
                aria-label={lang === "ar" ? "حذف" : "Delete"}
                className="rounded-full px-2 text-xs text-muted-foreground hover:text-destructive"
              >
                ✕
              </button>
            </div>
            {e.text && (
              <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed">
                {e.text}
              </p>
            )}
            {e.drawing?.type === "labels" && isFigureId(e.drawing.figure) && (
              <div className="mt-2">
                <FigureSvg
                  figure={FIGURES[e.drawing.figure]}
                  lang={lang}
                  mode="slots"
                  placed={Object.fromEntries(
                    Object.entries(e.drawing.placed ?? {}).map(([cid, group]) => {
                      const c = FIGURES[e.drawing!.figure as FigureId].callouts.find(
                        (x) => x.group === group,
                      );
                      return [cid, c ? c.name[lang] : group];
                    }),
                  )}
                  className="w-full"
                />
              </div>
            )}
            {e.drawing?.type === "curve" && e.drawing.values && (
              <div className="mt-2">
                <Curve values={e.drawing.values} figure={e.drawing.figure ?? "curve"} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
