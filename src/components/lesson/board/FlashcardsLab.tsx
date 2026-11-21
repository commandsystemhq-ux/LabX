import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Check,
  AlertTriangle,
  X,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  supportFlashcards,
  loadFlashcardState,
  saveFlashcardState,
  rateCard,
  getDueCards,
  masteryPercentage,
} from "@/data/lessons/supportFlashcards";
import type { Flashcard, FlashcardRating, FlashcardState } from "@/data/lessons/supportTypes";
import { useLang, type L10n } from "@/lib/i18n";
import { getFigure } from "@/data/lessons/supportFigures";
import { FigureSvg } from "./FigureSvg";

const t = (ar: string, en: string): L10n => ({ ar, en });

const ui = {
  title: t("البطاقات الذكية", "Smart Flashcards"),
  close: t("إغلاق", "Close"),
  flip: t("اقلب", "Flip"),
  known: t("فهمتها", "Got it"),
  hard: t("صعبة", "Hard"),
  forgot: t("نسيتها", "Forgot"),
  goToBlock: t("جرّبها في السبورة", "Try in the board"),
  all: t("الكل", "All"),
  hardForgot: t("الصعبة والمنسية", "Hard & Forgot"),
  mastery: t("الإتقان", "Mastery"),
  noCards: t("لا توجد بطاقات", "No cards"),
  hint: t("تلميح", "Hint"),
  showHint: t("اظهر التلميح", "Show hint"),
  hideHint: t("أخفِ التلميح", "Hide hint"),
};

export interface FlashcardsLabProps {
  onGoToBlock: (block: number) => void;
  onClose: () => void;
}

const store = () => (typeof window === "undefined" ? null : safeStorage());

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function FlashcardsLab({ onGoToBlock, onClose }: FlashcardsLabProps) {
  const { l, lang } = useLang();
  const [state, setState] = useState<FlashcardState>(loadFlashcardState(store()));
  const [filter, setFilter] = useState<"all" | "hard-forgot">("all");
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const cards = useMemo(() => getDueCards(supportFlashcards.cards, state, filter), [state, filter]);

  const card = cards[current];

  const mastery = useMemo(() => masteryPercentage(state, supportFlashcards.cards.length), [state]);

  // Save state on change
  useEffect(() => {
    saveFlashcardState(store(), state);
  }, [state]);

  const handleRate = useCallback(
    (rating: FlashcardRating) => {
      if (!card) return;
      setState((prev) => rateCard(prev, card.id, rating));
      setFlipped(false);
      setShowHint(false);
      if (current < cards.length - 1) {
        setCurrent(current + 1);
      } else {
        setCurrent(0);
      }
    },
    [card, current, cards.length],
  );

  const handlePrev = useCallback(() => {
    setFlipped(false);
    setShowHint(false);
    setCurrent((prev) => (prev > 0 ? prev - 1 : cards.length - 1));
  }, [cards.length]);

  const handleNext = useCallback(() => {
    setFlipped(false);
    setShowHint(false);
    setCurrent((prev) => (prev < cards.length - 1 ? prev + 1 : 0));
  }, [cards.length]);

  const handleFlip = useCallback(() => {
    setFlipped((prev) => !prev);
  }, []);

  const handleGoToBlock = useCallback(() => {
    if (card?.blockId) {
      onGoToBlock(card.blockId);
      onClose();
    }
  }, [card, onGoToBlock, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
      else if (e.key === " " || e.key === "Enter") handleFlip();
      else if (flipped) {
        if (e.key === "1") handleRate("known");
        else if (e.key === "2") handleRate("hard");
        else if (e.key === "3") handleRate("forgot");
      }
    },
    [handlePrev, handleNext, handleFlip, handleRate, flipped],
  );

  if (!card) {
    return (
      <div className="flex h-full flex-col gap-4">
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
        <div className="flex flex-1 items-center justify-center">
          <p className="text-center text-muted-foreground">{l(ui.noCards)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4" onKeyDown={handleKeyDown} tabIndex={-1}>
      {/* Header */}
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

      {/* Filter and Mastery */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-full border p-0.5">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              filter === "all" ? "bg-subject text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            {l(ui.all)}
          </button>
          <button
            type="button"
            onClick={() => setFilter("hard-forgot")}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              filter === "hard-forgot" ? "bg-subject text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            {l(ui.hardForgot)}
          </button>
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

      {/* Card */}
      <div className="flex flex-1 items-center justify-center">
        <div
          className="perspective-[1000px] relative w-full max-w-md"
          style={{ perspective: "1000px" }}
        >
          {/* Front */}
          <div
            className={`absolute inset-0 transition-transform duration-500 ${
              flipped ? "rotate-y-180" : ""
            }`}
            style={{
              backfaceVisibility: "hidden",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            <div className="glass flex h-64 flex-col items-center justify-center gap-4 rounded-3xl p-6 text-center">
              {card.visual ? (
                <div className="flex-1 overflow-hidden rounded-xl">
                  <FigureSvg
                    figure={getFigure(card.visual.figure)}
                    lang={lang}
                    mode={card.visual.hideLabels ? "hide" : "show"}
                  />
                </div>
              ) : (
                <p className="text-lg font-bold">{lang === "ar" ? card.front.ar : card.front.en}</p>
              )}
              {card.hint && !showHint && (
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold hover:bg-accent"
                >
                  <Eye className="size-3.5" /> {l(ui.showHint)}
                </button>
              )}
              {card.hint && showHint && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{l(ui.hint)}:</span>
                  <span>{lang === "ar" ? card.hint.ar : card.hint.en}</span>
                  <button
                    type="button"
                    onClick={() => setShowHint(false)}
                    className="rounded-full p-1 hover:bg-accent"
                  >
                    <EyeOff className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Back */}
          <div
            className={`absolute inset-0 transition-transform duration-500 ${
              flipped ? "" : "rotate-y-180"
            }`}
            style={{
              backfaceVisibility: "hidden",
              transform: flipped ? "rotateY(0deg)" : "rotateY(180deg)",
            }}
          >
            <div className="glass flex h-64 flex-col items-center justify-center gap-4 rounded-3xl p-6 text-center">
              <p className="text-lg font-bold">{lang === "ar" ? card.back.ar : card.back.en}</p>
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

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={handlePrev}
          className="rounded-full p-2 hover:bg-accent"
          aria-label="Previous"
        >
          {lang === "ar" ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
        </button>
        <span className="font-mono text-sm">
          {current + 1} / {cards.length}
        </span>
        <button
          type="button"
          onClick={handleNext}
          className="rounded-full p-2 hover:bg-accent"
          aria-label="Next"
        >
          {lang === "ar" ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
        </button>
      </div>

      {/* Flip Button */}
      {!flipped && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleFlip}
            className="flex items-center gap-1.5 rounded-full bg-subject px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-subject/80"
          >
            <RotateCw className="size-4" /> {l(ui.flip)}
          </button>
        </div>
      )}

      {/* Rating Buttons */}
      {flipped && (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => handleRate("known")}
            className="flex items-center gap-1.5 rounded-full bg-green-500 px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-green-600"
          >
            <Check className="size-4" /> {l(ui.known)} ✅
          </button>
          <button
            type="button"
            onClick={() => handleRate("hard")}
            className="flex items-center gap-1.5 rounded-full bg-yellow-500 px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-yellow-600"
          >
            <AlertTriangle className="size-4" /> {l(ui.hard)} 🟡
          </button>
          <button
            type="button"
            onClick={() => handleRate("forgot")}
            className="flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-red-600"
          >
            <X className="size-4" /> {l(ui.forgot)} 🔴
          </button>
        </div>
      )}
    </div>
  );
}
