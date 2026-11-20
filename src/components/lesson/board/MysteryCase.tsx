import { useMemo, useState } from "react";
import {
  evaluateMystery,
  MYSTERY_STEPS,
  MYSTERY_STORY,
  type MysteryAnswers,
} from "@/data/lessons/supportMystery";
import type { SupportMistake } from "@/data/lessons/supportNoor";
import type { SceneView } from "@/data/lessons/supportTypes";
import { useLang } from "@/lib/i18n";
import { EMPTY_SCENE, type SceneState, type StageMode } from "./sceneState";
import { Scene } from "./Scene";
import { S } from "./strings";

const VIEWS: SceneView[] = [
  {
    focus: "achilles",
    figure: "achilles",
    label: { ar: "الساق ووتر أخيل", en: "Leg and Achilles tendon" },
  },
  { focus: "knee", figure: "knee", label: { ar: "الركبة وأربطتها", en: "Knee and ligaments" } },
];

interface Props {
  /** Blocks 13 / 14 are the ones this case revises. */
  onStep: (e: { stepId: string; ok: boolean; mistakes: SupportMistake[] }) => void;
  onFinish: (score: number, solved: boolean) => void;
}

/**
 * «مسرح الجريمة العلمية»: examine the leg and knee in 3D, then answer six steps (what is torn,
 * which muscle, the twisted knee, symptoms, causes, treatment).
 */
export function MysteryCase({ onStep, onFinish }: Props) {
  const { l, lang } = useLang();
  const [viewIndex, setViewIndex] = useState(0);
  const [mode, setMode] = useState<StageMode>("3d");
  const [labels, setLabels] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [torn, setTorn] = useState(true);
  const [answers, setAnswers] = useState<MysteryAnswers>({});
  const [draft, setDraft] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [stepOk, setStepOk] = useState<boolean | null>(null);

  const step = MYSTERY_STEPS[index];
  const finished = index >= MYSTERY_STEPS.length;
  const result = useMemo(() => (finished ? evaluateMystery(answers) : null), [finished, answers]);

  const scene: SceneState = useMemo(
    () => ({
      ...EMPTY_SCENE,
      achillesTorn: torn,
      pickable: step?.pick ? step.options.map((o) => o.id) : null,
    }),
    [torn, step],
  );

  const submit = (ids: string[]) => {
    if (!step || stepOk !== null) return;
    const next = { ...answers, [step.id]: ids };
    setAnswers(next);
    const r = evaluateMystery(next).steps.find((s) => s.id === step.id)!;
    setStepOk(r.ok);
    const right = step.options.filter((o) => o.correct);
    const chosen = step.options.filter((o) => ids.includes(o.id));
    onStep({
      stepId: step.id,
      ok: r.ok,
      mistakes: r.ok
        ? []
        : [
            {
              block: step.id === "knee" ? 13 : 14,
              kind: "mystery",
              picked: {
                ar: chosen.map((o) => o.text.ar).join("، ") || "—",
                en: chosen.map((o) => o.text.en).join(", ") || "—",
              },
              correct: {
                ar: right.map((o) => o.text.ar).join("، "),
                en: right.map((o) => o.text.en).join(", "),
              },
              explain: r.feedback[0] ?? right[0]!.why,
            },
          ],
    });
  };

  const next = () => {
    const i = index + 1;
    setIndex(i);
    setDraft([]);
    setStepOk(null);
    setSelected(null);
    if (MYSTERY_STEPS[i]) setViewIndex(MYSTERY_STEPS[i]!.id === "knee" ? 1 : 0);
    if (i >= MYSTERY_STEPS.length) {
      const r = evaluateMystery(answers);
      onFinish(r.score, r.solved);
    }
  };

  const onPick = (group: string) => {
    if (!step?.pick || step.kind !== "single") return;
    if (step.options.some((o) => o.id === group)) submit([group]);
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
      <Scene
        views={VIEWS}
        viewIndex={viewIndex}
        onView={(i) => {
          setViewIndex(i);
          setSelected(null);
        }}
        mode={mode}
        onMode={setMode}
        labels={labels}
        onLabels={setLabels}
        scene={scene}
        selected={selected}
        onSelect={setSelected}
        onPick={onPick}
      />
      <div className="glass rounded-3xl p-4">
        <h3 className="text-lg font-bold">🕵️ {l(S.mystery)}</h3>
        <p className="mt-2 text-sm leading-relaxed">{l(MYSTERY_STORY)}</p>
        <label className="mt-2 flex items-center gap-2 text-xs">
          <input type="checkbox" checked={torn} onChange={(e) => setTorn(e.target.checked)} />
          {lang === "ar" ? "اعرض الوتر المتمزق في الساق" : "Show the torn tendon in the leg"}
        </label>
        <div className="mt-3 flex gap-1" aria-hidden>
          {MYSTERY_STEPS.map((s, i) => (
            <span
              key={s.id}
              className={"h-1.5 flex-1 rounded-full " + (i <= index ? "bg-subject" : "bg-muted")}
            />
          ))}
        </div>
        {step && (
          <div className="mt-3">
            <p className="font-bold">{l(step.title)}</p>
            <p className="mt-1 text-sm leading-relaxed">{l(step.prompt)}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {step.options.map((o) => {
                const chosen =
                  step.kind === "single"
                    ? (answers[step.id] ?? []).includes(o.id)
                    : draft.includes(o.id);
                const shown = stepOk !== null;
                return (
                  <button
                    key={o.id}
                    type="button"
                    disabled={shown}
                    aria-pressed={chosen}
                    onClick={() => {
                      if (step.kind === "single") submit([o.id]);
                      else
                        setDraft((d) =>
                          d.includes(o.id) ? d.filter((x) => x !== o.id) : [...d, o.id],
                        );
                    }}
                    className={
                      "rounded-xl border px-3 py-2 text-start text-xs font-semibold transition " +
                      (shown && o.correct
                        ? "border-bio bg-bio/15"
                        : shown && chosen
                          ? "border-destructive bg-destructive/15"
                          : chosen
                            ? "border-subject bg-subject/25"
                            : "border-border bg-background/50 hover:border-subject/60")
                    }
                  >
                    {l(o.text)}
                  </button>
                );
              })}
            </div>
            {step.kind === "multi" && stepOk === null && (
              <button
                type="button"
                disabled={draft.length === 0}
                onClick={() => submit(draft)}
                className="mt-2 rounded-full bg-subject px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-40"
              >
                {l(S.check)}
              </button>
            )}
            {stepOk !== null && (
              <div
                role="status"
                className={
                  "mt-3 rounded-xl border p-3 text-sm leading-relaxed " +
                  (stepOk ? "border-bio/40 bg-bio/10" : "border-warning/40 bg-warning/10")
                }
              >
                <p className="font-bold">{l(stepOk ? S.correct : S.wrong)}</p>
                <ul className="mt-1 list-disc space-y-1 ps-5">
                  {step.options
                    .filter((o) =>
                      stepOk ? o.correct : o.correct || (answers[step.id] ?? []).includes(o.id),
                    )
                    .map((o) => (
                      <li key={o.id}>{l(o.why)}</li>
                    ))}
                </ul>
                <button
                  type="button"
                  onClick={next}
                  className="mt-2 rounded-full bg-subject px-4 py-2 text-sm font-bold text-primary-foreground"
                >
                  {l(S.next)}
                </button>
              </div>
            )}
          </div>
        )}
        {result && (
          <div
            className="mt-3 rounded-xl border border-subject/40 bg-subject/10 p-3 text-sm leading-relaxed"
            role="status"
          >
            <p className="text-lg font-black">
              {result.solved ? "🏆" : "🔍"} {result.score}%
            </p>
            <p>
              {result.solved
                ? lang === "ar"
                  ? "القضية اتحلت! تمزق وتر أخيل (العضلة التوأمية ← عظمة الكعب) مع التواء بالرباط الصليبي، والعلاج جراحة لو التمزق كامل."
                  : "Case solved! A torn Achilles tendon (gastrocnemius → heel bone) with a twisted cruciate ligament; surgery if the tear is complete."
                : lang === "ar"
                  ? "في خطوات محتاجة مراجعة — اسأل نور عن اللي غلطت فيه."
                  : "Some steps need review — ask Noor about what you missed."}
            </p>
            <button
              type="button"
              onClick={() => {
                setAnswers({});
                setIndex(0);
                setDraft([]);
                setStepOk(null);
              }}
              className="mt-2 rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-accent"
            >
              {l(S.retry)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
