import { Mic, MicOff, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { feynmanFeedback, reviewFeynman, type FeynmanReview } from "@/data/lessons/supportNoor";
import type { FeynmanDef } from "@/data/lessons/supportTypes";
import { useLang } from "@/lib/i18n";
import { speechSupported, startListening, type Listener, type SpeechError } from "@/lib/speech";
import { NoorMarkdown } from "@/components/noor/NoorMarkdown";
import { S } from "./strings";

export const MAX_FEYNMAN = 800;

interface Props {
  def: FeynmanDef;
  blockTitle: string;
  /** Opens Noor and asks it to review the written answer (server AI for signed-in students). */
  onAskNoor: (text: string) => void;
  /** Reports the answer and its local review (feeds Noor's "student work"). */
  onReviewed: (answer: string, review: FeynmanReview) => void;
}

/**
 * «اشرح لي كأني صاحبك»: free text or voice (Web Speech API, Egyptian Arabic) and an instant local
 * review that lists the scientific keywords the answer is missing. Browsers without speech input
 * keep the text box and show a note instead of the mic.
 */
export function FeynmanCheck({ def, blockTitle, onAskNoor, onReviewed }: Props) {
  const { l, lang } = useLang();
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [review, setReview] = useState<FeynmanReview | null>(null);
  const [supported, setSupported] = useState(true);
  const listener = useRef<Listener | null>(null);
  const base = useRef("");

  useEffect(() => {
    setSupported(speechSupported());
    return () => listener.current?.stop();
  }, []);

  const stop = () => {
    listener.current?.stop();
    listener.current = null;
    setListening(false);
    setInterim("");
  };

  const errorNote = (e: SpeechError) =>
    l(e === "denied" ? S.micDenied : e === "unsupported" ? S.micNone : S.micFail);

  const toggleMic = () => {
    if (listening) {
      stop();
      return;
    }
    setNote(null);
    base.current = text;
    const handle = startListening({
      lang: lang === "ar" ? "ar-EG" : "en-US",
      onText: (finalText, partial) => {
        const joined = [base.current, finalText].filter(Boolean).join(" ");
        setText(joined.slice(0, MAX_FEYNMAN));
        setInterim(partial);
      },
      onEnd: () => {
        listener.current = null;
        setListening(false);
        setInterim("");
      },
      onError: (e) => {
        if (e === "no-speech") return;
        setNote(errorNote(e));
        if (e === "unsupported") setSupported(false);
        setListening(false);
      },
    });
    if (handle) {
      listener.current = handle;
      setListening(true);
    }
  };

  const submit = () => {
    stop();
    const r = reviewFeynman(text, def);
    setReview(r);
    onReviewed(text.trim(), r);
  };

  const ask = () => {
    const quoted = text.trim().slice(0, 500);
    onAskNoor(
      lang === "ar"
        ? `راجع شرحي لجزئية «${blockTitle}» وقولي الكلمات العلمية الناقصة: ${quoted}`
        : `Review my explanation of “${blockTitle}” and list the missing scientific keywords: ${quoted}`,
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-background/50 p-4">
      <h4 className="font-bold">{l(S.feynmanTitle)}</h4>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{l(def.prompt)}</p>
      <div className="relative mt-3">
        <textarea
          value={text + (interim ? ` ${interim}` : "")}
          maxLength={MAX_FEYNMAN}
          onChange={(e) => {
            setText(e.target.value);
            setReview(null);
          }}
          rows={4}
          placeholder={l(S.feynmanPlaceholder)}
          aria-label={l(S.feynmanTitle)}
          className="w-full resize-y rounded-xl border border-input bg-background/60 p-3 pe-12 text-sm outline-none focus:border-subject"
        />
        <button
          type="button"
          onClick={toggleMic}
          disabled={!supported}
          aria-pressed={listening}
          aria-label={l(listening ? S.micStop : S.mic)}
          title={supported ? l(listening ? S.micStop : S.mic) : l(S.micNone)}
          className={
            "absolute inset-e-2 top-2 flex size-9 items-center justify-center rounded-full border transition " +
            (listening
              ? "animate-pulse border-destructive bg-destructive/20 text-destructive"
              : "border-subject/40 bg-subject/10 text-subject hover:bg-subject/20 disabled:opacity-40")
          }
        >
          {supported ? <Mic className="size-4" /> : <MicOff className="size-4" />}
        </button>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground" role="status">
        {listening ? l(S.micListening) : !supported ? l(S.micNone) : (note ?? "")}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim()}
          className="flex items-center gap-1.5 rounded-full bg-subject px-4 py-2 text-sm font-bold text-primary-foreground hover:brightness-110 disabled:opacity-40"
        >
          <Sparkles className="size-4" /> {l(S.reviewMe)}
        </button>
        {review && !review.tooShort && (
          <button
            type="button"
            onClick={ask}
            className="flex items-center gap-1.5 rounded-full border border-subject/40 bg-subject/10 px-4 py-2 text-sm font-semibold text-subject hover:bg-subject/20"
          >
            <Send className="size-4 rtl:-scale-x-100" /> {l(S.askNoor)}
          </button>
        )}
      </div>
      {review && (
        <div className="mt-3 rounded-xl border border-subject/30 bg-subject/5 p-3 text-sm leading-relaxed">
          <NoorMarkdown text={feynmanFeedback(review, def, lang)} />
        </div>
      )}
    </div>
  );
}
