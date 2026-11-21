import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  RotateCw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNoorControl } from "@/components/noor/NoorProvider";
import { packToFlashcards, removeFlashcardPack } from "@/data/lessons/noorStudio";
import { getFigure } from "@/data/lessons/supportFigures";
import {
  getDueCards,
  loadFlashcardState,
  masteryPercentage,
  rateCard,
  saveFlashcardState,
  supportFlashcards,
} from "@/data/lessons/supportFlashcards";
import type { Flashcard, FlashcardRating, FlashcardState } from "@/data/lessons/supportTypes";
import { useLang, type L10n } from "@/lib/i18n";
import { useNoorStudio } from "@/lib/use-noor-studio";
import { FigureSvg } from "./FigureSvg";

const t = (ar: string, en: string): L10n => ({ ar, en });

const ui = {
  title: t("البطاقات الذكية", "Smart Flashcards"),
  close: t("إغلاق", "Close"),
  flip: t("عرض الإجابة", "Show answer"),
  known: t("فهمتها", "Got it"),
  hard: t("صعبة", "Hard"),
  forgot: t("نسيتها", "Forgot"),
  goToBlock: t("جرّبها في السبورة", "Try in the board"),
  all: t("الكل", "All"),
  hardForgot: t("الصعبة والمنسية", "Hard & Forgot"),
  mine: t("✨ إبداعات نور لك", "✨ Noor's creations for you"),
  mastery: t("الإتقان", "Mastery"),
  noCards: t("لا توجد بطاقات", "No cards"),
  noCreations: t(
    "لسه مفيش بطاقات من نور. اطلب منه: «ولّد بطاقات لنقط ضعفي» أو «اعملّي بطاقات عن الأربطة».",
    "No cards from Noor yet. Ask him: “make flashcards for my weak spots” or “make cards about ligaments”.",
  ),
  openNoor: t("افتح نور", "Open Noor"),
  hint: t("تلميح", "Hint"),
  showHint: t("اظهر التلميح", "Show hint"),
  hideHint: t("أخفِ التلميح", "Hide hint"),
  explainNoor: t("✨ اشرح لي يا نور", "✨ Explain with Noor"),
  editNoor: t("عدّل مع نور", "Edit with Noor"),
  del: t("حذف الرزمة", "Delete pack"),
  delSure: t("تأكيد الحذف؟", "Delete for good?"),
  prev: t("السابقة", "Previous"),
  next: t("التالية", "Next"),
  lookFigure: t(
    "انظر الرسمة وسمّي الأجزاء المرقّمة",
    "Look at the figure and name the numbered parts",
  ),
};

export interface FlashcardsLabProps {
  onGoToBlock: (block: number) => void;
  onClose: () => void;
  /** Open this Noor Studio pack first. */
  initialPackId?: string | null;
}

const store = () => (typeof window === "undefined" ? null : safeStorage());

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

type Filter = "all" | "hard-forgot" | "mine";

export function FlashcardsLab({ onGoToBlock, onClose, initialPackId = null }: FlashcardsLabProps) {
  const { l, lang } = useLang();
  const { ask, setOpen, setStudioFocus } = useNoorControl();
  const { state: studio, mutate } = useNoorStudio();
  const [state, setState] = useState<FlashcardState>(loadFlashcardState(store()));
  const [filter, setFilter] = useState<Filter>(initialPackId ? "mine" : "all");
  const [packId, setPackId] = useState<string | null>(initialPackId);
  const [confirmDel, setConfirmDel] = useState(false);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const pack =
    filter === "mine"
      ? (studio.flashcardPacks.find((p) => p.id === packId) ??
        studio.flashcardPacks[studio.flashcardPacks.length - 1] ??
        null)
      : null;

  const cards = useMemo<Flashcard[]>(() => {
    if (filter === "mine") return pack ? packToFlashcards(pack) : [];
    return getDueCards(supportFlashcards.cards, state, filter);
  }, [filter, pack, state]);

  const total = filter === "mine" ? (pack?.cards.length ?? 0) : supportFlashcards.cards.length;
  const mastery = useMemo(() => {
    if (filter !== "mine") return masteryPercentage(state, supportFlashcards.cards.length);
    const ids = new Set(pack?.cards.map((c) => c.id));
    const known = Object.entries(state.ratings).filter(([id, r]) => ids.has(id) && r === "known");
    return total === 0 ? 0 : Math.round((100 * known.length) / total);
  }, [filter, pack, state, total]);

  // The deck shrinks when a card is rated or a pack changes: never point past the end.
  useEffect(() => {
    if (current > 0 && current >= cards.length) setCurrent(0);
  }, [cards.length, current]);

  useEffect(() => {
    if (pack) setStudioFocus({ kind: "flashcards", packId: pack.id });
  }, [pack, setStudioFocus]);

  useEffect(() => {
    saveFlashcardState(store(), state);
  }, [state]);

  useEffect(() => {
    if (!confirmDel) return;
    const id = window.setTimeout(() => setConfirmDel(false), 4000);
    return () => window.clearTimeout(id);
  }, [confirmDel]);

  const card = cards[current];

  const reset = () => {
    setCurrent(0);
    setFlipped(false);
    setShowHint(false);
  };

  const handleRate = useCallback(
    (rating: FlashcardRating) => {
      if (!card) return;
      setState((prev) => rateCard(prev, card.id, rating));
      setFlipped(false);
      setShowHint(false);
      setCurrent((c) => (c < cards.length - 1 ? c + 1 : 0));
    },
    [card, cards.length],
  );

  const handlePrev = useCallback(() => {
    setFlipped(false);
    setShowHint(false);
    setCurrent((prev) => (prev > 0 ? prev - 1 : Math.max(0, cards.length - 1)));
  }, [cards.length]);

  const handleNext = useCallback(() => {
    setFlipped(false);
    setShowHint(false);
    setCurrent((prev) => (prev < cards.length - 1 ? prev + 1 : 0));
  }, [cards.length]);

  const handleFlip = useCallback(() => setFlipped((prev) => !prev), []);

  const handleGoToBlock = useCallback(() => {
    if (card?.blockId) {
      onGoToBlock(card.blockId);
      onClose();
    }
  }, [card, onGoToBlock, onClose]);

  const handleExplainNoor = useCallback(() => {
    if (!card) return;
    const front = lang === "ar" ? card.front.ar : card.front.en;
    const back = lang === "ar" ? card.back.ar : card.back.en;
    const prompt =
      lang === "ar"
        ? `اشرح لي هذه البطاقة بالعامية المصرية:\n\n**السؤال:** ${front}\n\n**الإجابة:** ${back}\n\nبسّطها لي واضربلي مثال من الحياة.`
        : `Explain this flashcard in simple terms:\n\n**Question:** ${front}\n\n**Answer:** ${back}\n\nGive me a real-life example.`;
    ask(prompt);
  }, [card, lang, ask]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("button, input, textarea")) {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      }
      const forward = lang === "ar" ? "ArrowLeft" : "ArrowRight";
      if (e.key === forward) handleNext();
      else if (e.key === (lang === "ar" ? "ArrowRight" : "ArrowLeft")) handlePrev();
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleFlip();
      } else if (flipped) {
        if (e.key === "1") handleRate("known");
        else if (e.key === "2") handleRate("hard");
        else if (e.key === "3") handleRate("forgot");
      }
    },
    [lang, handlePrev, handleNext, handleFlip, handleRate, flipped],
  );

  const frontText = card ? (lang === "ar" ? card.front.ar : card.front.en) : "";
  const visual =
    card && "visual" in card
      ? (card as { visual?: { figure: Parameters<typeof getFigure>[0]; hideLabels?: boolean } })
          .visual
      : undefined;

  const Header = (
    <header className="flex items-center gap-3">
      <h2 className="flex-1 text-lg font-bold">🗂️ {l(ui.title)}</h2>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full p-2 hover:bg-accent"
        aria-label={l(ui.close)}
      >
        <X className="size-5" />
      </button>
    </header>
  );

  const Filters = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap rounded-full border p-0.5">
        {(
          [
            ["all", l(ui.all)],
            ["hard-forgot", l(ui.hardForgot)],
            ["mine", `${l(ui.mine)} (${studio.flashcardPacks.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => {
              setFilter(id);
              reset();
            }}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              filter === id ? "bg-subject text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-muted-foreground">{l(ui.mastery)}:</span>
        <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-subject transition-all"
            style={{ width: `${mastery}%` }}
          />
        </div>
        <span className="font-mono text-xs font-bold">{mastery}%</span>
      </div>
    </div>
  );

  const PackBar =
    filter === "mine" ? (
      studio.flashcardPacks.length === 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-subject/30 bg-subject/5 p-3">
          <p className="min-w-0 flex-1 text-sm text-muted-foreground">{l(ui.noCreations)}</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-subject px-3 py-1.5 text-xs font-bold text-primary-foreground"
          >
            <Sparkles className="size-3.5" /> {l(ui.openNoor)}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-subject/30 bg-subject/5 p-3">
          {studio.flashcardPacks.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={p.id === pack?.id}
              onClick={() => {
                setPackId(p.id);
                reset();
              }}
              className={`max-w-56 truncate rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                p.id === pack?.id ? "border-subject bg-subject/20 text-subject" : "hover:bg-accent"
              }`}
            >
              🗂️ {p.title[lang]} · {p.cards.length}
            </button>
          ))}
          {pack && (
            <span className="ms-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setStudioFocus({ kind: "flashcards", packId: pack.id });
                  setOpen(true);
                }}
                className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold hover:bg-accent"
              >
                <Pencil className="size-3.5" /> {l(ui.editNoor)}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmDel) {
                    mutate((s) => removeFlashcardPack(s, pack.id));
                    setConfirmDel(false);
                    setPackId(null);
                    reset();
                  } else setConfirmDel(true);
                }}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${
                  confirmDel
                    ? "border-destructive bg-destructive/15 text-destructive"
                    : "hover:bg-accent"
                }`}
              >
                <Trash2 className="size-3.5" /> {l(confirmDel ? ui.delSure : ui.del)}
              </button>
            </span>
          )}
        </div>
      )
    ) : null;

  if (!card) {
    return (
      <div className="flex flex-col gap-4">
        {Header}
        {Filters}
        {PackBar}
        <div className="flex min-h-40 items-center justify-center">
          <p className="text-center text-muted-foreground">{l(ui.noCards)}</p>
        </div>
      </div>
    );
  }

  const PrevIcon = lang === "ar" ? ChevronRight : ChevronLeft;
  const NextIcon = lang === "ar" ? ChevronLeft : ChevronRight;

  return (
    <div className="flex flex-col gap-4" onKeyDown={handleKeyDown} tabIndex={-1}>
      {Header}
      {Filters}
      {PackBar}

      {/* Counter: always «current / total» regardless of text direction */}
      <div className="text-center" dir="ltr">
        <span className="font-mono text-sm text-muted-foreground">
          {current + 1} / {cards.length}
        </span>
      </div>

      {/* Card: two faces, each with backface-visibility hidden, so neither text is ever mirrored */}
      <div className="flex items-center justify-center">
        <div className="relative h-88 w-full max-w-md" style={{ perspective: "1000px" }}>
          {/* Front */}
          <div
            className="absolute inset-0 transition-transform duration-500"
            aria-hidden={flipped}
            style={{
              backfaceVisibility: "hidden",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              transformStyle: "preserve-3d",
            }}
          >
            <div className="glass flex h-full flex-col items-center gap-2 rounded-3xl p-4 text-center">
              {visual ? (
                <>
                  <p className="shrink-0 text-sm font-bold">{frontText}</p>
                  <div
                    className="relative min-h-0 w-full flex-1 overflow-hidden rounded-2xl"
                    style={{ minHeight: 160 }}
                  >
                    <FigureSvg
                      figure={getFigure(visual.figure)}
                      lang={lang}
                      mode={visual.hideLabels ? "hide" : "show"}
                      className="absolute inset-0 h-full w-full"
                    />
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">{l(ui.lookFigure)}</p>
                </>
              ) : (
                <>
                  <p className="my-auto text-lg font-bold leading-8">{frontText}</p>
                  {card.hint && !showHint && (
                    <button
                      type="button"
                      onClick={() => setShowHint(true)}
                      className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold hover:bg-accent"
                    >
                      <Eye className="size-3.5" /> {l(ui.showHint)}
                    </button>
                  )}
                  {card.hint && showHint && (
                    <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                      <span>{l(ui.hint)}:</span>
                      <span>{lang === "ar" ? card.hint.ar : card.hint.en}</span>
                      <button
                        type="button"
                        onClick={() => setShowHint(false)}
                        aria-label={l(ui.hideHint)}
                        className="rounded-full p-1 hover:bg-accent"
                      >
                        <EyeOff className="size-3.5" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 transition-transform duration-500"
            aria-hidden={!flipped}
            style={{
              backfaceVisibility: "hidden",
              transform: flipped ? "rotateY(0deg)" : "rotateY(-180deg)",
              transformStyle: "preserve-3d",
            }}
          >
            <div className="glass flex h-full flex-col items-center justify-center gap-4 overflow-y-auto rounded-3xl p-6 text-center">
              <p className="text-lg font-bold leading-8 text-green-600 dark:text-green-400">
                {lang === "ar" ? card.back.ar : card.back.en}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={handleExplainNoor}
                  className="flex items-center gap-1.5 rounded-full bg-subject px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-subject/80"
                >
                  <Sparkles className="size-3.5" /> {l(ui.explainNoor)}
                </button>
                <button
                  type="button"
                  onClick={handleGoToBlock}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold hover:bg-accent"
                >
                  <ExternalLink className="size-3.5" /> {l(ui.goToBlock)} §{card.blockId}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={handlePrev}
          className="rounded-full p-2 hover:bg-accent"
          aria-label={l(ui.prev)}
        >
          <PrevIcon className="size-5" />
        </button>

        {!flipped ? (
          <button
            type="button"
            onClick={handleFlip}
            className="flex items-center gap-1.5 rounded-full bg-subject px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-subject/80"
          >
            <RotateCw className="size-4" /> {l(ui.flip)}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleRate("known")}
              className="flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-green-600"
            >
              <Check className="size-3.5" /> {l(ui.known)}
            </button>
            <button
              type="button"
              onClick={() => handleRate("hard")}
              className="flex items-center gap-1.5 rounded-full bg-yellow-500 px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-yellow-600"
            >
              <AlertTriangle className="size-3.5" /> {l(ui.hard)}
            </button>
            <button
              type="button"
              onClick={() => handleRate("forgot")}
              className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-red-600"
            >
              <X className="size-3.5" /> {l(ui.forgot)}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleNext}
          className="rounded-full p-2 hover:bg-accent"
          aria-label={l(ui.next)}
        >
          <NextIcon className="size-5" />
        </button>
      </div>
    </div>
  );
}
