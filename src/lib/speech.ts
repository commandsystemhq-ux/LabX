/**
 * Thin, safe wrapper over the Web Speech API (speech-to-text). Browsers without it (Firefox, some
 * in-app browsers, SSR, jsdom) report `supported() === false` and the UI falls back to typing.
 */

interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResult {
  isFinal: boolean;
  0: RecognitionAlternative;
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

function ctor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechSupported(): boolean {
  return ctor() !== null;
}

export type SpeechError = "denied" | "no-speech" | "unsupported" | "other";

export interface Listener {
  stop(): void;
}

export interface ListenOptions {
  /** `ar-EG` for Egyptian Arabic, `en-US` for English. */
  lang: "ar-EG" | "en-US";
  /** Final text so far plus the interim guess, replaced on every update. */
  onText: (finalText: string, interim: string) => void;
  onEnd: () => void;
  onError: (e: SpeechError) => void;
}

/** Starts listening. Returns null (and calls `onError("unsupported")`) when the API is missing. */
export function startListening(opts: ListenOptions): Listener | null {
  const Ctor = ctor();
  if (!Ctor) {
    opts.onError("unsupported");
    return null;
  }
  let rec: Recognition;
  try {
    rec = new Ctor();
  } catch {
    opts.onError("unsupported");
    return null;
  }
  rec.lang = opts.lang;
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  let finalText = "";
  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i]!;
      const text = r[0]?.transcript ?? "";
      if (r.isFinal) finalText += (finalText ? " " : "") + text.trim();
      else interim += text;
    }
    opts.onText(finalText, interim);
  };
  rec.onerror = (e) => {
    const code = e.error;
    opts.onError(
      code === "not-allowed" || code === "service-not-allowed"
        ? "denied"
        : code === "no-speech"
          ? "no-speech"
          : "other",
    );
  };
  rec.onend = () => opts.onEnd();
  try {
    rec.start();
  } catch {
    opts.onError("other");
    return null;
  }
  return {
    stop() {
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    },
  };
}
