import type { L10n, Lang } from "@/lib/i18n";
import type { SimPreset, SimulationId, SubjectId } from "./mockCurriculum";

/**
 * Simulation definitions: variables, physics/chemistry/biology models, graph specs,
 * lesson-flow content (story, explanation, quiz) and mock AI-tutor replies.
 * The stage visuals in src/components/lesson/scenes read the same values.
 */

export type SimKey =
  | "voltage"
  | "resistance"
  | "temperature"
  | "concentration"
  | "catalyst"
  | "gradient"
  | "permeability"
  /** Injected real-world fault (0 = none). Meaning is defined per simulation in simExtras. */
  | "fault";

/** Every simulation reads from the same value bag; unused keys stay at 0. */
export type SimValues = Record<SimKey, number>;

export interface SimVariable {
  key: SimKey;
  label: L10n;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  default: number;
}

export interface Readout {
  key: string;
  label: L10n;
  symbol: string;
  value: number;
  unit: string;
  digits: number;
}

export interface GraphSpec {
  xLabel: L10n;
  yLabel: L10n;
  xUnit: string;
  yUnit: string;
  data: { x: number; y: number; base: number }[];
  point: { x: number; y: number };
  yMax: number;
}

export interface QuizQuestion {
  prompt: L10n;
  options: L10n[];
  correct: number;
  explanation: L10n;
  /** Values loaded into the simulation when the student asks to "see the mistake". */
  demo: Partial<SimValues>;
  demoNote: L10n;
  /** Optional stage view to switch to while demonstrating. */
  demoView?: "macro" | "molecular";
  /** Readout key compared before/after in the demo (defaults to the first readout). */
  focus?: string;
  /** What a student who picked option N implicitly claims the focus readout becomes. */
  claims?: Record<number, number>;
}

export interface ValueChange {
  key: SimKey;
  from: number;
  to: number;
}

export type TutorIntent = "colloquial" | "why" | "example" | "mistake" | "free" | "hint" | "hazard";

export interface SimulationDef {
  id: SimulationId;
  subject: SubjectId;
  variables: SimVariable[];
  readouts: (v: SimValues) => Readout[];
  graph: (v: SimValues) => GraphSpec;
  /** 0–1 intensity used by the stage (speed of particles / electrons). */
  activity: (v: SimValues) => number;
  formula: string;
  formulaLive: (v: SimValues) => string;
  story: { title: L10n; body: L10n; question: L10n };
  explain: L10n[];
  quiz: QuizQuestion[];
  context: (v: SimValues, lang: Lang) => string;
  tutor: (intent: TutorIntent, v: SimValues, lang: Lang, change: ValueChange | null) => string;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const range = (from: number, to: number, step: number) => {
  const out: number[] = [];
  for (let x = from; x <= to + 1e-9; x += step) out.push(Math.round(x * 100) / 100);
  return out;
};
export function niceCeil(n: number) {
  if (n <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(n));
  const r = n / mag;
  const nice = r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10;
  return nice * mag;
}
const f = (n: number, d = 1) => n.toFixed(d);

export function defaultsOf(sim: SimulationDef): SimValues {
  const base: SimValues = {
    voltage: 0,
    resistance: 0,
    temperature: 0,
    concentration: 0,
    catalyst: 0,
    gradient: 0,
    permeability: 0,
    fault: 0,
  };
  for (const v of sim.variables) base[v.key] = v.default;
  return base;
}

/**
 * Starting values for one lesson: the simulation defaults plus the lesson's preset. Preset values
 * are clamped to each variable's range, and unknown keys / `fault` are ignored.
 */
export function lessonDefaults(sim: SimulationDef, preset?: SimPreset): SimValues {
  const base = defaultsOf(sim);
  for (const v of sim.variables) {
    const wanted = preset?.values?.[v.key];
    if (typeof wanted === "number" && Number.isFinite(wanted)) {
      base[v.key] = clamp(wanted, v.min, v.max);
    }
  }
  return base;
}

/* ------------------------------------------------------------------ */
/* Physics — Ohm's law with temperature-dependent resistance           */
/* ------------------------------------------------------------------ */

/** Temperature coefficient of resistance for copper-like conductor (1/°C). */
export const ALPHA = 0.0039;

/** Source + wiring resistance left when the ammeter is wrongly wired in parallel (short circuit). */
export const SHORT_CIRCUIT_R = 0.5;
/** Extra series resistance of a loose / corroded connection. */
export const LOOSE_CONTACT_R = 8;

/** Typical analogue/digital voltmeter input resistance (Ω) — it is meant to draw almost no current. */
export const VOLTMETER_R = 10_000;

/**
 * fault: 0 = none, 1 = short circuit (ammeter in parallel), 2 = loose connection,
 * 3 = voltmeter wired in series (its ~10 kΩ input resistance dominates the circuit).
 */
export function computeOhm(voltage: number, resistance: number, temperature: number, fault = 0) {
  const thermal = resistance * (1 + ALPHA * (temperature - 25));
  const rEff =
    fault === 1
      ? SHORT_CIRCUIT_R
      : fault === 2
        ? thermal + LOOSE_CONTACT_R
        : fault === 3
          ? thermal + VOLTMETER_R
          : thermal;
  const current = rEff > 0 ? voltage / rEff : 0;
  const power = voltage * current;
  const contactPower = fault === 2 ? current * current * LOOSE_CONTACT_R : 0;
  return { rEff, current, power, contactPower };
}

const ohmVars: SimVariable[] = [
  {
    key: "voltage",
    label: { ar: "الجهد", en: "Voltage" },
    symbol: "V",
    unit: "V",
    min: 0,
    max: 24,
    step: 0.5,
    default: 12,
  },
  {
    key: "resistance",
    label: { ar: "المقاومة", en: "Resistance" },
    symbol: "R",
    unit: "Ω",
    min: 2,
    max: 50,
    step: 1,
    default: 10,
  },
  {
    key: "temperature",
    label: { ar: "الحرارة", en: "Temperature" },
    symbol: "T",
    unit: "°C",
    min: 0,
    max: 150,
    step: 1,
    default: 25,
  },
];

const ohm: SimulationDef = {
  id: "ohm",
  subject: "physics",
  variables: ohmVars,
  readouts: (v) => {
    const o = computeOhm(v.voltage, v.resistance, v.temperature, v.fault);
    return [
      {
        key: "current",
        label: { ar: "شدة التيار", en: "Current" },
        symbol: "I",
        value: o.current,
        unit: "A",
        digits: 2,
      },
      {
        key: "power",
        label: { ar: "القدرة", en: "Power" },
        symbol: "P",
        value: o.power,
        unit: "W",
        digits: 1,
      },
      {
        key: "rEff",
        label: { ar: "المقاومة الفعلية", en: "Effective R" },
        symbol: "Rₜ",
        value: o.rEff,
        unit: "Ω",
        digits: 1,
      },
    ];
  },
  graph: (v) => {
    const { rEff, current } = computeOhm(v.voltage, v.resistance, v.temperature, v.fault);
    const data = range(0, 24, 1).map((x) => ({ x, y: x / rEff, base: x / 10 }));
    const maxY = Math.max(...data.map((d) => Math.max(d.y, d.base)));
    return {
      xLabel: { ar: "الجهد", en: "Voltage" },
      yLabel: { ar: "التيار", en: "Current" },
      xUnit: "V",
      yUnit: "A",
      data,
      point: { x: v.voltage, y: current },
      yMax: niceCeil(maxY),
    };
  },
  activity: (v) =>
    clamp(computeOhm(v.voltage, v.resistance, v.temperature, v.fault).current / 4, 0, 1),
  formula: "V = I × R",
  formulaLive: (v) => {
    const o = computeOhm(v.voltage, v.resistance, v.temperature, v.fault);
    return `${f(v.voltage)} V = ${f(o.current, 2)} A × ${f(o.rEff)} Ω`;
  },
  story: {
    title: { ar: "ليه شاحن موبايلك بيسخن؟", en: "Why does your phone charger get hot?" },
    body: {
      ar: "يوسف بيشحن موبايله في أوضة حرّانة في عز أغسطس في القاهرة. الشاحن سخن جداً والشحن بقى أبطأ من العادي. هل الحرارة ليها علاقة بالتيار اللي ماشي في السلك؟ تعالى ندخل جوه السلك نفسه ونشوف.",
      en: "Youssef is charging his phone in a hot Cairo room in mid-August. The charger is burning hot and charging feels slower than usual. Could heat be affecting the current in the wire? Let's go inside the wire and find out.",
    },
    question: {
      ar: "توقعك: لما السلك يسخن، التيار هيزيد ولا يقل؟",
      en: "Your guess: when the wire heats up, does current rise or fall?",
    },
  },
  explain: [
    {
      ar: "شدة التيار (I) بتتناسب طردياً مع فرق الجهد (V) لما المقاومة ثابتة.",
      en: "Current (I) is directly proportional to voltage (V) at constant resistance.",
    },
    {
      ar: "المقاومة (R) بتعرقل حركة الإلكترونات — كل ما تزيد، التيار يقل.",
      en: "Resistance (R) opposes electron flow — the higher it is, the lower the current.",
    },
    {
      ar: "الحرارة بتخلي أيونات الفلز تهتز أكتر، فتزيد التصادمات والمقاومة الفعلية.",
      en: "Heat makes metal ions vibrate more, increasing collisions and effective resistance.",
    },
  ],
  quiz: [
    {
      prompt: {
        ar: "لو ضاعفنا المقاومة مع ثبات الجهد، شدة التيار…",
        en: "If resistance doubles at constant voltage, the current…",
      },
      options: [
        { ar: "تتضاعف", en: "Doubles" },
        { ar: "تقل للنصف", en: "Halves" },
        { ar: "تفضل ثابتة", en: "Stays the same" },
        { ar: "تبقى صفر", en: "Drops to zero" },
      ],
      correct: 1,
      explanation: {
        ar: "I = V ÷ R، فلما R تتضاعف التيار يقل للنصف.",
        en: "I = V ÷ R, so doubling R halves the current.",
      },
      demo: { voltage: 12, resistance: 20, temperature: 25 },
      demoNote: {
        ar: "المقاومة بقت 20Ω بدل 10Ω — بص على الأميتر: التيار نزل من 1.2A لـ 0.6A.",
        en: "Resistance is now 20Ω instead of 10Ω — watch the ammeter drop from 1.2A to 0.6A.",
      },
      claims: { 0: 2.4, 2: 1.2, 3: 0 },
    },
    {
      prompt: {
        ar: "سلك معدني سخن من 25°C لـ 125°C والجهد ثابت. التيار هيعمل إيه؟",
        en: "A metal wire heats from 25°C to 125°C at constant voltage. What happens to current?",
      },
      options: [
        { ar: "يزيد لأن الإلكترونات أسرع", en: "Rises — electrons move faster" },
        { ar: "يقل لأن المقاومة زادت", en: "Falls — resistance increased" },
        { ar: "يفضل ثابت", en: "Stays constant" },
      ],
      correct: 1,
      explanation: {
        ar: "الأيونات بتهتز أكتر، المقاومة الفعلية تزيد، والتيار يقل.",
        en: "Ions vibrate more, effective resistance rises, and current falls.",
      },
      demo: { voltage: 12, resistance: 10, temperature: 125 },
      demoNote: {
        ar: "الحرارة دلوقتي 125°C — شوف الأيونات بتهتز إزاي في المنظور الجزيئي والتيار قل.",
        en: "Temperature is now 125°C — in the molecular view, ions vibrate harder and current falls.",
      },
      demoView: "molecular",
      claims: { 0: 1.5, 2: 1.2 },
    },
    {
      prompt: {
        ar: "وصّلنا الأميتر بالغلط على التوازي مع المصدر (قصر دائرة). إيه اللي هيحصل؟",
        en: "The ammeter is wired in parallel with the source by mistake (short circuit). What happens?",
      },
      options: [
        { ar: "التيار يقل لأن الدائرة اتقطعت", en: "Current drops — the circuit breaks" },
        {
          ar: "التيار يرتفع جداً والسلك والفيوز في خطر",
          en: "Current spikes — wire and fuse at risk",
        },
        { ar: "مفيش تغيير", en: "Nothing changes" },
      ],
      correct: 1,
      explanation: {
        ar: "الأميتر مقاومته صغيرة جداً، فلما يتوصل على التوازي بيعمل ممر قصير والتيار يعلى بشكل خطير. الأميتر لازم يتوصل على التوالي.",
        en: "An ammeter has tiny resistance; in parallel it creates a shortcut and current soars dangerously. Ammeters must be wired in series.",
      },
      demo: { voltage: 12, resistance: 10, temperature: 25, fault: 1 },
      demoNote: {
        ar: "قصر دائرة! المقاومة الفعلية بقت 0.5Ω والتيار قفز من 1.2A لـ 24A — ده كفاية يفصل الفيوز ويسخّن السلك.",
        en: "Short circuit! Effective resistance is 0.5Ω and current jumped from 1.2A to 24A — enough to blow the fuse and overheat the wire.",
      },
      claims: { 0: 0.5, 2: 1.2 },
    },
  ],
  context: (v, lang) => {
    const o = computeOhm(v.voltage, v.resistance, v.temperature, v.fault);
    return lang === "ar"
      ? `المقاومة = ${f(v.resistance, 0)}Ω • الجهد = ${f(v.voltage)}V • التيار = ${f(o.current, 2)}A`
      : `R = ${f(v.resistance, 0)}Ω • V = ${f(v.voltage)}V • I = ${f(o.current, 2)}A`;
  },
  tutor: (intent, v, lang, change) => {
    const o = computeOhm(v.voltage, v.resistance, v.temperature, v.fault);
    const ar = lang === "ar";
    switch (intent) {
      case "colloquial":
        return ar
          ? `بص يا سيدي، تخيل السلك ده شارع والإلكترونات عربيات. الجهد (${f(v.voltage)}V) هو اللي بيزق العربيات، والمقاومة (${f(o.rEff)}Ω) هي الزحمة والمطبات. فعدد العربيات اللي بتعدي كل ثانية — اللي هو التيار — طالع ${f(o.current, 2)}A. زوّد الزق يزيد، زوّد الزحمة يقل. بس كده!`
          : `Think of the wire as a street and electrons as cars. Voltage (${f(v.voltage)}V) pushes the cars, resistance (${f(o.rEff)}Ω) is the traffic. The number of cars passing per second — the current — is ${f(o.current, 2)}A.`;
      case "why": {
        if (!change) {
          return ar
            ? "لسه محركتش أي متغير! جرب تحرك سلايدر المقاومة أو الحرارة وارجع اسألني تاني."
            : "You haven't changed anything yet! Move the resistance or temperature slider and ask again.";
        }
        const name = ohmVars.find((x) => x.key === change.key);
        const up = change.to > change.from;
        const label = name ? name.label[lang] : change.key;
        const effect =
          change.key === "voltage"
            ? up
              ? ar
                ? "زقة أقوى، فالتيار زاد"
                : "a stronger push, so current rose"
              : ar
                ? "زقة أضعف، فالتيار قل"
                : "a weaker push, so current fell"
            : up
              ? ar
                ? "عرقلة أكتر للإلكترونات، فالتيار قل"
                : "more obstruction, so current fell"
              : ar
                ? "عرقلة أقل، فالتيار زاد"
                : "less obstruction, so current rose";
        return ar
          ? `إنت غيّرت ${label} من ${f(change.from)} لـ ${f(change.to)}${name?.unit ?? ""}. ده معناه ${effect} — القراءة دلوقتي ${f(o.current, 2)}A.`
          : `You changed ${label} from ${f(change.from)} to ${f(change.to)}${name?.unit ?? ""}. That means ${effect} — reading is now ${f(o.current, 2)}A.`;
      }
      case "example":
        return ar
          ? "مثال من البيت: سخان المية فيه سلك مقاومته عالية بيحوّل الكهربا لحرارة. ولمبة الفتيلة بتسخن لدرجة إنها تنور — وده نفس اللي بتشوفه في المصباح في المحاكاة."
          : "At home: a water heater uses a high-resistance coil to turn electricity into heat, and a filament bulb glows because it gets that hot — just like the bulb on the stage.";
      case "mistake":
        return ar
          ? "أشهر غلطة: إن الطلبة يفتكروا إن الحرارة بتزود التيار عشان الإلكترونات 'نشيطة'. الحقيقة إن الأيونات هي اللي بتهتز أكتر وبتعطل الإلكترونات، فالمقاومة تزيد والتيار يقل في الفلزات."
          : "The classic mistake: thinking heat increases current because electrons are 'energized'. In metals, ions vibrate more and block electrons, so resistance rises and current falls.";
      default:
        return ar
          ? `سؤال حلو! في المشهد الحالي التيار ${f(o.current, 2)}A والقدرة ${f(o.power)}W. جرب تغير متغير واحد بس كل مرة عشان تشوف تأثيره لوحده.`
          : `Great question! Right now current is ${f(o.current, 2)}A and power ${f(o.power)}W. Try changing one variable at a time to isolate its effect.`;
    }
  },
};

/* ------------------------------------------------------------------ */
/* Chemistry — reaction rate (collision theory, Q10 ≈ 2)               */
/* ------------------------------------------------------------------ */

/** All-at-once mixing multiplies the initial rate (no gradual addition). */
export const BURST_FACTOR = 3;

/** Heat (°C) an exothermic reaction adds to an uncooled vessel before the rate feeds back. */
export const RUNAWAY_DELTA_C = 15;

/**
 * fault: 0 = none, 1 = all reagent mixed at once, 2 = sealed vessel (rate unchanged, pressure
 * builds), 3 = exothermic reaction with no cooling (the vessel runs `RUNAWAY_DELTA_C` hotter).
 */
export function computeRate(
  temperature: number,
  concentration: number,
  catalyst: number,
  fault = 0,
) {
  const burst = fault === 1 ? BURST_FACTOR : 1;
  const tEff = fault === 3 ? temperature + RUNAWAY_DELTA_C : temperature;
  const rate = 5 * concentration * 2 ** ((tEff - 25) / 10) * (1 + 0.3 * catalyst) * burst;
  const k = concentration > 0 ? rate / concentration / 1000 : 0;
  const halfLife = k > 0 ? Math.LN2 / k : Infinity;
  const collisions = concentration * Math.sqrt((tEff + 273) / 298) * 100;
  return { rate, halfLife, collisions, tEff };
}

const rateVars: SimVariable[] = [
  {
    key: "temperature",
    label: { ar: "الحرارة", en: "Temperature" },
    symbol: "T",
    unit: "°C",
    min: 0,
    max: 100,
    step: 1,
    default: 25,
  },
  {
    key: "concentration",
    label: { ar: "التركيز", en: "Concentration" },
    symbol: "C",
    unit: "M",
    min: 0.1,
    max: 2,
    step: 0.1,
    default: 1,
  },
  {
    key: "catalyst",
    label: { ar: "العامل الحفاز", en: "Catalyst" },
    symbol: "cat",
    unit: "g",
    min: 0,
    max: 10,
    step: 0.5,
    default: 0,
  },
];

const reactionRate: SimulationDef = {
  id: "reaction-rate",
  subject: "chemistry",
  variables: rateVars,
  readouts: (v) => {
    const r = computeRate(v.temperature, v.concentration, v.catalyst, v.fault);
    return [
      {
        key: "rate",
        label: { ar: "سرعة التفاعل", en: "Reaction rate" },
        symbol: "r",
        value: r.rate,
        unit: "mM/s",
        digits: 1,
      },
      {
        key: "collisions",
        label: { ar: "معدل التصادم", en: "Collision freq." },
        symbol: "Z",
        value: r.collisions,
        unit: "%",
        digits: 0,
      },
      {
        key: "halfLife",
        label: { ar: "عمر النصف", en: "Half-life" },
        symbol: "t½",
        value: r.halfLife,
        unit: "s",
        digits: 0,
      },
    ];
  },
  graph: (v) => {
    const data = range(0, 100, 5).map((x) => ({
      x,
      y: computeRate(x, v.concentration, v.catalyst, v.fault).rate,
      base: computeRate(x, 1, 0).rate,
    }));
    const maxY = Math.max(...data.map((d) => Math.max(d.y, d.base)));
    return {
      xLabel: { ar: "الحرارة", en: "Temperature" },
      yLabel: { ar: "السرعة", en: "Rate" },
      xUnit: "°C",
      yUnit: "mM/s",
      data,
      point: {
        x: v.temperature,
        y: computeRate(v.temperature, v.concentration, v.catalyst, v.fault).rate,
      },
      yMax: niceCeil(maxY),
    };
  },
  activity: (v) =>
    clamp(
      Math.log2(computeRate(v.temperature, v.concentration, v.catalyst, v.fault).rate / 5 + 1) / 6,
      0.05,
      1,
    ),
  formula: "r = k [A]",
  formulaLive: (v) => {
    const r = computeRate(v.temperature, v.concentration, v.catalyst, v.fault);
    return `${f(r.rate)} mM/s = k × ${f(v.concentration)} M`;
  },
  story: {
    title: {
      ar: "ليه الأكل بيبوظ أسرع برة التلاجة؟",
      en: "Why does food spoil faster outside the fridge?",
    },
    body: {
      ar: "ماما سابت طبق الفول برة التلاجة في يوم حر، وبعد كام ساعة ريحته اتغيرت. نفس الطبق جوه التلاجة بيعيش أيام! الفرق كله في سرعة التفاعلات الكيميائية. تعالى نشوف الجزيئات وهي بتتصادم.",
      en: "Mom left a plate of foul out on a hot day and within hours it smelled off. In the fridge it lasts days! The difference is reaction rate. Let's watch the molecules collide.",
    },
    question: {
      ar: "توقعك: رفع الحرارة 10 درجات بيأثر قد إيه على السرعة؟",
      en: "Your guess: how much does +10°C change the rate?",
    },
  },
  explain: [
    {
      ar: "التفاعل بيحصل لما الجزيئات تتصادم بطاقة كافية (طاقة التنشيط).",
      en: "Reactions happen when molecules collide with enough energy (activation energy).",
    },
    {
      ar: "زيادة الحرارة 10°C تقريباً بتضاعف سرعة التفاعل.",
      en: "Raising temperature by ~10°C roughly doubles the rate.",
    },
    {
      ar: "العامل الحفاز بيقلل طاقة التنشيط من غير ما يُستهلك.",
      en: "A catalyst lowers activation energy without being consumed.",
    },
  ],
  quiz: [
    {
      prompt: {
        ar: "لو رفعنا الحرارة من 25°C لـ 35°C، سرعة التفاعل تقريباً…",
        en: "Raising temperature from 25°C to 35°C roughly…",
      },
      options: [
        { ar: "تتضاعف", en: "Doubles the rate" },
        { ar: "تزيد 10% بس", en: "Adds only 10%" },
        { ar: "تقل", en: "Lowers the rate" },
      ],
      correct: 0,
      explanation: {
        ar: "قاعدة تقريبية: كل 10°C زيادة بتضاعف السرعة.",
        en: "Rule of thumb: every +10°C roughly doubles the rate.",
      },
      demo: { temperature: 35, concentration: 1, catalyst: 0 },
      demoNote: {
        ar: "الحرارة 35°C — لاحظ الفقاعات والتصادمات زادت للضعف تقريباً.",
        en: "Now at 35°C — bubbles and collisions roughly doubled.",
      },
      claims: { 1: 5.5, 2: 2.5 },
    },
    {
      prompt: {
        ar: "العامل الحفاز بيزود سرعة التفاعل لأنه…",
        en: "A catalyst speeds up a reaction because it…",
      },
      options: [
        { ar: "بيُستهلك في التفاعل", en: "Gets consumed" },
        { ar: "بيقلل طاقة التنشيط", en: "Lowers activation energy" },
        { ar: "بيرفع الحرارة", en: "Raises temperature" },
      ],
      correct: 1,
      explanation: {
        ar: "بيوفر طريق بديل بطاقة تنشيط أقل، وبيخرج من التفاعل زي ما دخل.",
        en: "It offers a lower-energy pathway and leaves unchanged.",
      },
      demo: { temperature: 25, concentration: 1, catalyst: 8 },
      demoNote: {
        ar: "ضفنا 8g عامل حفاز والحرارة زي ما هي — السرعة زادت جامد.",
        en: "Added 8g of catalyst at the same temperature — the rate jumped.",
      },
      demoView: "molecular",
    },
    {
      prompt: {
        ar: "سخّنا الخليط لـ 75°C وضفنا الكاشف كله مرة واحدة بدل التدريج. الأرجح إن…",
        en: "We heated the mixture to 75°C and added all the reagent at once instead of gradually. Most likely…",
      },
      options: [
        { ar: "السرعة تقل لأن الجزيئات اتزاحمت", en: "The rate drops — molecules get crowded" },
        {
          ar: "السرعة تقفز جداً والتفاعل يخرج عن السيطرة",
          en: "The rate jumps and the reaction runs away",
        },
        { ar: "السرعة تفضل زي ما هي", en: "The rate stays the same" },
      ],
      correct: 1,
      explanation: {
        ar: "الحرارة العالية + الخلط دفعة واحدة بيضاعفوا التصادمات الفعّالة، فالتفاعل بيتسارع بشكل خطير. الإضافة التدريجية والتبريد هما الحل.",
        en: "High temperature plus all-at-once mixing multiplies effective collisions, so the reaction accelerates dangerously. Gradual addition and cooling are the fix.",
      },
      demo: { temperature: 75, concentration: 1.5, catalyst: 0, fault: 1 },
      demoNote: {
        ar: "تفاعل جامح! السرعة قفزت من 5 لأكتر من 700 mM/s — فقاعات وضغط وطرطشة.",
        en: "Runaway reaction! The rate jumped from 5 to over 700 mM/s — foaming, pressure and splashing.",
      },
      demoView: "molecular",
      claims: { 0: 3, 2: 5 },
    },
  ],
  context: (v, lang) =>
    lang === "ar"
      ? `الحرارة = ${f(v.temperature, 0)}°C • التركيز = ${f(v.concentration)}M`
      : `T = ${f(v.temperature, 0)}°C • C = ${f(v.concentration)}M`,
  tutor: (intent, v, lang, change) => {
    const r = computeRate(v.temperature, v.concentration, v.catalyst, v.fault);
    const ar = lang === "ar";
    if (intent === "colloquial")
      return ar
        ? `تخيل الجزيئات ناس في مول زحمة. كل ما الحرارة تزيد (دلوقتي ${f(v.temperature, 0)}°C) الناس بتجري أسرع وبتخبط في بعض أكتر وبقوة. وكل ما التركيز يزيد، المول بيزحم أكتر. النتيجة: سرعة التفاعل ${f(r.rate)} mM/s.`
        : `Picture molecules as people in a busy mall. Hotter (${f(v.temperature, 0)}°C) means faster, harder bumps; higher concentration means more crowding. Result: ${f(r.rate)} mM/s.`;
    if (intent === "why") {
      if (!change)
        return ar
          ? "حرك أي متغير الأول وأنا أقولك القراءة اتغيرت ليه."
          : "Move a variable first and I'll explain the change.";
      const label = rateVars.find((x) => x.key === change.key)?.label[lang] ?? change.key;
      return ar
        ? `غيرت ${label} من ${f(change.from)} لـ ${f(change.to)}. ده غيّر عدد التصادمات الفعالة، فالسرعة بقت ${f(r.rate)} mM/s.`
        : `You changed ${label} from ${f(change.from)} to ${f(change.to)}, changing effective collisions. Rate is now ${f(r.rate)} mM/s.`;
    }
    if (intent === "example")
      return ar
        ? "الحلة البريستو بتطبخ أسرع لأن الحرارة جواها أعلى من 100°C. وإنزيمات الهضم في جسمك عوامل حفازة طبيعية!"
        : "A pressure cooker cooks faster because it runs above 100°C. Your digestive enzymes are natural catalysts!";
    if (intent === "mistake")
      return ar
        ? "غلطة شائعة: إن العامل الحفاز بيُستهلك أو بيغير كمية النواتج. لا — هو بيسرّع الوصول بس."
        : "Common mistake: thinking a catalyst is consumed or changes product amount. It only speeds things up.";
    return ar
      ? `في المشهد ده عمر النصف ${f(r.halfLife, 0)} ثانية. جرب تضيف عامل حفاز وشوفه بيقل.`
      : `Half-life here is ${f(r.halfLife, 0)}s. Add catalyst and watch it shrink.`;
  },
};

/* ------------------------------------------------------------------ */
/* Biology — diffusion across a membrane (Fick's law)                  */
/* ------------------------------------------------------------------ */

/** Above this temperature (°C) membrane proteins denature and the membrane turns leaky. */
export const DENATURE_C = 50;

/** Share of membrane channels still open when an inhibitor/toxin blocks the channel proteins. */
export const BLOCKED_CHANNEL_FACTOR = 0.25;

/**
 * fault: 0 = none, 1 = damaged (leaky) membrane, 2 = hypertonic surroundings (+40% gradient),
 * 3 = channel proteins blocked by an inhibitor (permeability × `BLOCKED_CHANNEL_FACTOR`).
 */
export function computeDiffusion(
  temperature: number,
  gradient: number,
  permeability: number,
  fault = 0,
) {
  const denatured = temperature >= DENATURE_C;
  const leaky = fault === 1 || denatured;
  const blocked = fault === 3 && !leaky;
  const perm = leaky
    ? Math.min(100, permeability * 1.8 + 20)
    : blocked
      ? permeability * BLOCKED_CHANNEL_FACTOR
      : permeability;
  const grad = fault === 2 ? Math.min(100, gradient + 40) : gradient;
  const rate = (grad / 100) * (perm / 100) * ((temperature + 273) / 310) * 100;
  const equilibrium = rate > 0.01 ? 60 / rate : Infinity;
  const crossing = rate * 0.6;
  return { rate, equilibrium, crossing, leaky, denatured, blocked };
}

const diffVars: SimVariable[] = [
  {
    key: "temperature",
    label: { ar: "الحرارة", en: "Temperature" },
    symbol: "T",
    unit: "°C",
    min: 0,
    max: 60,
    step: 1,
    default: 37,
  },
  {
    key: "gradient",
    label: { ar: "فرق التركيز", en: "Concentration gradient" },
    symbol: "ΔC",
    unit: "%",
    min: 0,
    max: 100,
    step: 1,
    default: 50,
  },
  {
    key: "permeability",
    label: { ar: "نفاذية الغشاء", en: "Permeability" },
    symbol: "P",
    unit: "%",
    min: 0,
    max: 100,
    step: 1,
    default: 60,
  },
];

const diffusion: SimulationDef = {
  id: "diffusion",
  subject: "biology",
  variables: diffVars,
  readouts: (v) => {
    const d = computeDiffusion(v.temperature, v.gradient, v.permeability, v.fault);
    return [
      {
        key: "rate",
        label: { ar: "معدل الانتشار", en: "Diffusion rate" },
        symbol: "J",
        value: d.rate,
        unit: "µmol/s",
        digits: 1,
      },
      {
        key: "crossing",
        label: { ar: "جزيئات عابرة", en: "Crossing" },
        symbol: "n",
        value: d.crossing,
        unit: "/s",
        digits: 1,
      },
      {
        key: "equilibrium",
        label: { ar: "زمن الاتزان", en: "Time to equilibrium" },
        symbol: "tₑ",
        value: d.equilibrium,
        unit: "min",
        digits: 1,
      },
    ];
  },
  graph: (v) => {
    const data = range(0, 100, 5).map((x) => ({
      x,
      y: computeDiffusion(v.temperature, x, v.permeability, v.fault).rate,
      base: computeDiffusion(37, x, 60).rate,
    }));
    const maxY = Math.max(...data.map((d) => Math.max(d.y, d.base)));
    return {
      xLabel: { ar: "فرق التركيز", en: "Gradient" },
      yLabel: { ar: "المعدل", en: "Rate" },
      xUnit: "%",
      yUnit: "µmol/s",
      data,
      point: {
        x: v.gradient,
        y: computeDiffusion(v.temperature, v.gradient, v.permeability, v.fault).rate,
      },
      yMax: niceCeil(maxY),
    };
  },
  activity: (v) =>
    clamp(computeDiffusion(v.temperature, v.gradient, v.permeability, v.fault).rate / 60, 0, 1),
  formula: "J = P · ΔC",
  formulaLive: (v) => {
    const d = computeDiffusion(v.temperature, v.gradient, v.permeability, v.fault);
    return `${f(d.rate)} = ${f(v.permeability / 100, 2)} × ${f(v.gradient, 0)}%`;
  },
  story: {
    title: {
      ar: "ليه ريحة الطعمية بتوصلك من أول الشارع؟",
      en: "Why can you smell ta'meya from down the street?",
    },
    body: {
      ar: "الصبح بدري ريحة الطعمية السخنة بتوصل لحد شباكك. الجزيئات بتتحرك من المكان الزحمة للمكان الفاضي — وده بالظبط اللي بيحصل عبر غشاء الخلية كل ثانية في جسمك.",
      en: "Early morning, the smell of hot ta'meya reaches your window. Molecules move from crowded to empty spaces — exactly what happens across your cell membranes every second.",
    },
    question: {
      ar: "توقعك: لو فرق التركيز بقى صفر، الانتشار هيحصل؟",
      en: "Your guess: with zero gradient, does net diffusion happen?",
    },
  },
  explain: [
    {
      ar: "الانتشار: حركة الجزيئات من التركيز العالي للتركيز المنخفض بدون طاقة.",
      en: "Diffusion: molecules move from high to low concentration without energy.",
    },
    {
      ar: "كل ما فرق التركيز يزيد، معدل الانتشار يزيد (قانون فيك).",
      en: "A bigger gradient means faster diffusion (Fick's law).",
    },
    {
      ar: "الحرارة ونفاذية الغشاء بيسرّعوا مرور الجزيئات.",
      en: "Temperature and membrane permeability speed molecules across.",
    },
  ],
  quiz: [
    {
      prompt: {
        ar: "لو فرق التركيز بين جانبي الغشاء بقى صفر…",
        en: "If the concentration gradient becomes zero…",
      },
      options: [
        { ar: "يتوقف صافي الانتشار", en: "Net diffusion stops" },
        { ar: "الانتشار يزيد", en: "Diffusion speeds up" },
        { ar: "الجزيئات تتحرك عكس الاتجاه", en: "Molecules reverse direction" },
      ],
      correct: 0,
      explanation: {
        ar: "الجزيئات لسه بتتحرك، لكن عدد اللي داخل = اللي خارج، فالصافي صفر.",
        en: "Molecules still move, but in = out, so net flow is zero.",
      },
      demo: { temperature: 37, gradient: 0, permeability: 60 },
      demoNote: {
        ar: "فرق التركيز = صفر — لاحظ إن مفيش جزيئات بتعبر الغشاء بشكل صافي.",
        en: "Gradient is 0 — notice no net crossing through the membrane.",
      },
      demoView: "molecular",
      claims: { 1: 45, 2: -30 },
    },
    {
      prompt: {
        ar: "رفع الحرارة من 37°C لـ 55°C بيخلي الانتشار…",
        en: "Raising temperature from 37°C to 55°C makes diffusion…",
      },
      options: [
        { ar: "أبطأ", en: "Slower" },
        { ar: "أسرع", en: "Faster" },
        { ar: "زي ما هو", en: "Unchanged" },
      ],
      correct: 1,
      explanation: {
        ar: "الجزيئات بتكتسب طاقة حركة أكبر فتتحرك أسرع.",
        en: "Molecules gain kinetic energy and move faster.",
      },
      demo: { temperature: 55, gradient: 50, permeability: 60 },
      demoNote: {
        ar: "الحرارة 55°C — شوف الجزيئات بتعبر أسرع.",
        en: "Now 55°C — molecules cross faster.",
      },
      claims: { 0: 15, 2: 30 },
    },
    {
      prompt: {
        ar: "غشاء الخلية اتلف وبقى مسرّب. تأثير ده على الانتشار؟",
        en: "The cell membrane is damaged and leaky. What is the effect on diffusion?",
      },
      options: [
        { ar: "الانتشار يقل لأن الغشاء ضعيف", en: "Diffusion slows — the membrane is weak" },
        {
          ar: "الجزيئات تعدّي بدون انتقائية والخلية تفقد محتوياتها",
          en: "Molecules pass without selectivity and the cell loses its contents",
        },
        { ar: "مفيش تأثير", en: "No effect" },
      ],
      correct: 1,
      explanation: {
        ar: "الغشاء السليم بيتحكم في اللي يدخل ويخرج. لما يتلف النفاذية بتعلى والانتشار بيبقى خارج عن السيطرة.",
        en: "A healthy membrane controls what crosses. When damaged, permeability rises and diffusion becomes uncontrolled.",
      },
      demo: { temperature: 37, gradient: 50, permeability: 60, fault: 1 },
      demoNote: {
        ar: "غشاء تالف! النفاذية الفعلية بقت 100% والمعدل قفز من 30 لـ 50 µmol/s بدون تحكم.",
        en: "Damaged membrane! Effective permeability is 100% and the rate jumped from 30 to 50 µmol/s, uncontrolled.",
      },
      demoView: "molecular",
      claims: { 0: 15, 2: 30 },
    },
  ],
  context: (v, lang) =>
    lang === "ar"
      ? `فرق التركيز = ${f(v.gradient, 0)}% • النفاذية = ${f(v.permeability, 0)}%`
      : `ΔC = ${f(v.gradient, 0)}% • P = ${f(v.permeability, 0)}%`,
  tutor: (intent, v, lang, change) => {
    const d = computeDiffusion(v.temperature, v.gradient, v.permeability, v.fault);
    const ar = lang === "ar";
    if (intent === "colloquial")
      return ar
        ? `تخيل أوضة زحمة جنب أوضة فاضية وبينهم باب. الناس هتطلع طبيعي للأوضة الفاضية. فرق الزحمة هنا ${f(v.gradient, 0)}%، والباب مفتوح بنسبة ${f(v.permeability, 0)}%، فالمعدل ${f(d.rate)} µmol/s.`
        : `Imagine a crowded room next to an empty one with a door between. Gradient is ${f(v.gradient, 0)}%, the door is ${f(v.permeability, 0)}% open, so the rate is ${f(d.rate)} µmol/s.`;
    if (intent === "why") {
      if (!change) return ar ? "غيّر أي متغير وأنا أفسرلك." : "Change a variable and I'll explain.";
      const label = diffVars.find((x) => x.key === change.key)?.label[lang] ?? change.key;
      return ar
        ? `غيرت ${label} من ${f(change.from, 0)} لـ ${f(change.to, 0)}، فمعدل الانتشار بقى ${f(d.rate)} µmol/s.`
        : `You changed ${label} from ${f(change.from, 0)} to ${f(change.to, 0)}; diffusion is now ${f(d.rate)} µmol/s.`;
    }
    if (intent === "example")
      return ar
        ? "الأكسجين بيدخل دمك في الرئة بالانتشار لأن تركيزه في الحويصلات أعلى من الدم."
        : "Oxygen enters your blood in the lungs by diffusion — it's more concentrated in the alveoli.";
    if (intent === "mistake")
      return ar
        ? "غلطة شائعة: إن الجزيئات بتقف لما يحصل اتزان. هي بتفضل تتحرك، بس الصافي بيبقى صفر."
        : "Common mistake: molecules stop at equilibrium. They keep moving — net flow is just zero.";
    return ar
      ? `دلوقتي هيوصل للاتزان في حوالي ${f(d.equilibrium)} دقيقة.`
      : `Equilibrium in about ${f(d.equilibrium)} minutes.`;
  },
};

export const simulations: Record<SimulationId, SimulationDef> = {
  ohm,
  "reaction-rate": reactionRate,
  diffusion,
};
