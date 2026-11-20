import { radiusState, RADIUS_MAX_DEG } from "@/data/lessons/supportLab";
import { useLang } from "@/lib/i18n";
import type { SceneState } from "./sceneState";

type Patch = (p: Partial<SceneState>) => void;

/** The radius turns about the fixed ulna through at most 180°, carrying the hand with it. */
export function RadiusTool({ scene, onScene }: { scene: SceneState; onScene: Patch }) {
  const { lang } = useLang();
  const st = radiusState(scene.radiusDeg);
  return (
    <div>
      <p className="text-sm font-semibold">
        🦴 {lang === "ar" ? "حركة الكعبرة حول الزند" : "The radius turning round the ulna"}
      </p>
      <label className="mt-2 flex items-center gap-3 text-xs font-semibold">
        <span className="w-14 shrink-0 font-mono">{Math.round(st.deg)}°</span>
        <input
          type="range"
          min={0}
          max={RADIUS_MAX_DEG}
          step={1}
          value={scene.radiusDeg}
          onChange={(e) => onScene({ radiusDeg: Number(e.target.value) })}
          className="w-full"
          aria-label={lang === "ar" ? "زاوية دوران الكعبرة" : "Radius angle"}
        />
      </label>
      <ul className="mt-2 space-y-1 text-xs leading-relaxed">
        <li>
          {lang === "ar" ? "الزند: ثابت (0°)" : "Ulna: fixed (0°)"} ·{" "}
          {lang === "ar" ? "الكعبرة والكف:" : "radius + hand:"}{" "}
          <span className="font-mono">{Math.round(st.handDeg)}°</span>
        </li>
        <li>
          {st.side === "outside"
            ? lang === "ar"
              ? "الكعبرة في الخارج جهة الإبهام (الوضع التشريحي)"
              : "Radius outside, thumb side (anatomical position)"
            : lang === "ar"
              ? "الكعبرة عبرت للداخل (كف اليد انقلب 180°)"
              : "Radius has crossed to the inside (hand turned 180°)"}
        </li>
        <li className={st.crossed ? "font-bold text-bio" : "text-muted-foreground"}>
          {st.crossed
            ? lang === "ar"
              ? "✕ الكعبرة متقاطعة مع الزند على شكل حرف X"
              : "✕ the radius crosses the ulna in an X"
            : lang === "ar"
              ? "لسه ما اتقاطعتش — كمّل التدوير"
              : "Not crossed yet — keep turning"}
        </li>
      </ul>
      <div className="mt-2 flex gap-2">
        {[0, 90, 180].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onScene({ radiusDeg: d })}
            className="rounded-full border border-border px-3 py-1 text-xs font-semibold hover:bg-accent"
          >
            {d}°
          </button>
        ))}
      </div>
    </div>
  );
}

/** Male vs female pelvic cavity: the female one is wider to suit pregnancy and birth. */
export function PelvisTool({ scene, onScene }: { scene: SceneState; onScene: Patch }) {
  const { lang } = useLang();
  const opts = [
    { id: "male" as const, ar: "حوض الذكر", en: "Male pelvis" },
    { id: "female" as const, ar: "حوض الأنثى", en: "Female pelvis" },
  ];
  return (
    <div>
      <p className="text-sm font-semibold">
        ⚖️ {lang === "ar" ? "مقارنة حوض الذكر والأنثى" : "Male vs female pelvis"}
      </p>
      <div className="mt-2 flex gap-2">
        {opts.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={scene.pelvis === o.id}
            onClick={() => onScene({ pelvis: scene.pelvis === o.id ? null : o.id })}
            className={
              "rounded-full border px-3 py-1.5 text-xs font-semibold " +
              (scene.pelvis === o.id
                ? "border-subject bg-subject/25"
                : "border-border hover:bg-accent")
            }
          >
            {lang === "ar" ? o.ar : o.en}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs leading-relaxed">
        {lang === "ar"
          ? "تجويف الحوض في الأنثى أكثر اتساعاً منه في الذكر لكي يلائم عمليتي الحمل والولادة. (الحلقتان المرسومتان للتوضيح فقط.)"
          : "The pelvic cavity of the female is wider than the male's to suit pregnancy and childbirth. (The two rings are drawn for illustration only.)"}
      </p>
    </div>
  );
}

/** Tear the Achilles tendon and see the two ends separate; the symptoms follow. */
export function AchillesTool({ scene, onScene }: { scene: SceneState; onScene: Patch }) {
  const { lang } = useLang();
  return (
    <div>
      <p className="text-sm font-semibold">
        🦶 {lang === "ar" ? "تمزق وتر أخيل" : "Achilles tendon rupture"}
      </p>
      <button
        type="button"
        aria-pressed={scene.achillesTorn}
        onClick={() => onScene({ achillesTorn: !scene.achillesTorn })}
        className={
          "mt-2 rounded-full border px-4 py-2 text-xs font-bold " +
          (scene.achillesTorn
            ? "border-destructive bg-destructive/15 text-destructive"
            : "border-subject/40 bg-subject/10 text-subject")
        }
      >
        {scene.achillesTorn
          ? lang === "ar"
            ? "✂️ الوتر متمزق — اضغط للإصلاح"
            : "✂️ Torn — tap to repair"
          : lang === "ar"
            ? "مزّق الوتر (تمزق كامل)"
            : "Tear the tendon (complete tear)"}
      </button>
      {scene.achillesTorn && (
        <ul className="mt-2 list-disc space-y-1 ps-5 text-xs leading-relaxed">
          <li>{lang === "ar" ? "عدم القدرة على المشي" : "Cannot walk"}</li>
          <li>{lang === "ar" ? "تورم في منطقة الإصابة" : "Swelling at the injury"}</li>
          <li>{lang === "ar" ? "آلام حادة" : "Severe pain"}</li>
          <li className="font-semibold">
            {lang === "ar"
              ? "العلاج عند التمزق الكامل: تدخل جراحي"
              : "Treatment for a complete tear: surgery"}
          </li>
        </ul>
      )}
    </div>
  );
}
