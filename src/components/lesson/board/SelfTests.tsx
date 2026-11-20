import { useState } from "react";
import { selfTests } from "@/data/lessons/supportLesson";
import { useLang } from "@/lib/i18n";
import { QuestionCard } from "./QuestionCard";
import { S } from "./strings";

interface Props {
  doneTests: ReadonlySet<number>;
  /** Called after each answer so the radar and Noor can follow along. */
  onAnswer: (test: number, questionId: string, block: number, ok: boolean, chosen: number) => void;
  onFinish: (test: number, correct: number, total: number) => void;
}

/** The six «اختبر نفسك» tests of the textbook pages, one question at a time with instant feedback. */
export function SelfTests({ doneTests, onAnswer, onFinish }: Props) {
  const { l, lang } = useLang();
  const [open, setOpen] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  const test = open === null ? null : selfTests.find((t) => t.n === open);

  if (test) {
    const q = test.questions[index];
    return (
      <div className="glass rounded-3xl p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold">📝 {l(test.title)}</h3>
          <button
            type="button"
            onClick={() => setOpen(null)}
            className="rounded-full border border-border px-3 py-1 text-xs font-semibold hover:bg-accent"
          >
            {l(S.back)}
          </button>
        </div>
        {finished || !q ? (
          <div className="mt-4 text-center" role="status">
            <p className="text-3xl font-black text-subject">
              {correct}/{test.questions.length}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {correct === test.questions.length
                ? lang === "ar"
                  ? "ممتاز! 👏"
                  : "Excellent! 👏"
                : lang === "ar"
                  ? "راجع الأسئلة اللي غلطت فيها مع نور."
                  : "Review the ones you missed with Noor."}
            </p>
            <button
              type="button"
              onClick={() => {
                setIndex(0);
                setCorrect(0);
                setFinished(false);
              }}
              className="mt-3 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
            >
              {l(S.retry)}
            </button>
          </div>
        ) : (
          <div className="mt-3">
            <QuestionCard
              key={q.id}
              q={q}
              counter={`${index + 1} / ${test.questions.length}`}
              nextLabel={index + 1 >= test.questions.length ? l(S.finish) : l(S.next)}
              onAnswer={(ok, chosen) => {
                if (ok) setCorrect((c) => c + 1);
                onAnswer(test.n, q.id, q.block, ok, chosen);
              }}
              onNext={() => {
                if (index + 1 >= test.questions.length) {
                  setFinished(true);
                  // `correct` already includes the last answer by the time Next is pressed.
                  onFinish(test.n, correct, test.questions.length);
                } else setIndex((i) => i + 1);
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-4">
      <h3 className="text-lg font-bold">📝 {l(S.tests)}</h3>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {selfTests.map((t) => (
          <li key={t.n}>
            <button
              type="button"
              onClick={() => {
                setOpen(t.n);
                setIndex(0);
                setCorrect(0);
                setFinished(false);
              }}
              className="flex h-full w-full flex-col gap-1 rounded-2xl border border-border bg-background/50 p-3 text-start transition hover:border-subject/60 hover:bg-subject/10"
            >
              <span className="font-bold">
                {doneTests.has(t.n) ? "✅ " : ""}
                {l(t.title)}
              </span>
              <span className="text-xs text-muted-foreground">{l(t.covers)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
