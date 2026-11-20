import { ui, type L10n } from "@/lib/i18n";
import type { SimPreset, SimulationId } from "./mockCurriculum";
import {
  ADRENALINE_SURGE,
  ARTERY_FLOW_FACTOR,
  BETA_BLOCK_FACTOR,
  BLOCKED_CHANNEL_FACTOR,
  computeAdrenaline,
  computeDiffusion,
  computeOhm,
  computeRate,
  DENATURE_C,
  HR_CRITICAL,
  HR_TACHYCARDIA,
  RUNAWAY_DELTA_C,
  VOLTMETER_R,
  type SimKey,
  type SimValues,
} from "./simulations";

/**
 * Per-simulation learning extras layered on top of the pure models in simulations.ts:
 * injectable faults, real-world hazards, guided-discovery steps, calculation breakdowns
 * and subject-specific stage layers. Everything here is pure (no React, no I/O).
 */

export type HazardLevel = 0 | 1 | 2;

export interface Hazard {
  id: string;
  /** 1 = warning, 2 = critical. */
  level: 1 | 2;
  title: L10n;
  cause: L10n;
  /** What would really happen — never silently ignored. */
  consequence: L10n;
  fix: L10n;
}

export interface FaultDef {
  /** Value stored in `SimValues.fault`. */
  id: number;
  label: L10n;
  description: L10n;
}

export interface GuidedStep {
  id: string;
  title: L10n;
  task: L10n;
  hint: L10n;
  /** Index into the simulation's `explain` list revealed once the step is done. */
  explainIndex: number;
  /** Variable the student should move; highlighted in the control panel. */
  focus: SimKey;
  /** Values applied (on top of the defaults) when the step begins. */
  start: Partial<SimValues>;
  done: (v: SimValues) => boolean;
}

export interface CalcStep {
  label: string;
  expr: string;
}

export interface LayerDef {
  id: string;
  label: L10n;
  default: boolean;
}

export type EffectKind = "electric" | "chemical" | "cellular";

export interface SimExtras {
  effect: EffectKind;
  faults: FaultDef[];
  hazards: (v: SimValues) => Hazard[];
  guided: GuidedStep[];
  calc: (v: SimValues, lang: "ar" | "en") => CalcStep[];
  layers: LayerDef[];
}

const f = (n: number, d = 1) => (Number.isFinite(n) ? n.toFixed(d) : "∞");
const byLevel = (a: Hazard, b: Hazard) => b.level - a.level;

export function hazardLevel(hazards: Hazard[]): HazardLevel {
  return hazards.reduce<HazardLevel>((m, h) => (h.level > m ? h.level : m), 0);
}

const commonLayers: LayerDef[] = [
  { id: "labels", label: ui.labelsLayer, default: true },
  { id: "flow", label: ui.flowLayer, default: true },
];

/* ------------------------------------------------------------------ */
/* Physics — Ohm's law                                                 */
/* ------------------------------------------------------------------ */

export const FUSE_AMPS = 5;
export const RESISTOR_WATTS = 50;

const ohmExtras: SimExtras = {
  effect: "electric",
  faults: [
    {
      id: 1,
      label: { ar: "قصر دائرة (أميتر على التوازي)", en: "Short circuit (ammeter in parallel)" },
      description: {
        ar: "الأميتر متوصل غلط بالتوازي مع المصدر فبيعمل ممر بمقاومة شبه صفر.",
        en: "The ammeter is wrongly wired across the source, creating a near-zero-resistance path.",
      },
    },
    {
      id: 2,
      label: { ar: "وصلة مفككة / صدئة", en: "Loose / corroded connection" },
      description: {
        ar: "مقاومة تلامس إضافية 8Ω بتسخّن الوصلة وبتطلع شرار.",
        en: "An extra 8Ω of contact resistance heats the joint and throws sparks.",
      },
    },
    {
      id: 3,
      label: { ar: "فولتميتر على التوالي", en: "Voltmeter wired in series" },
      description: {
        ar: "الفولتميتر مقاومته الداخلية كبيرة (~10kΩ) فلما يتوصل على التوالي بيقطع التيار تقريباً.",
        en: "A voltmeter's input resistance is huge (~10kΩ), so wired in series it almost blocks the current.",
      },
    },
  ],
  hazards: (v) => {
    const o = computeOhm(v.voltage, v.resistance, v.temperature, v.fault);
    const out: Hazard[] = [];

    if (v.fault === 1 && o.current > 3) {
      out.push({
        id: "short",
        level: 2,
        title: { ar: "قصر دائرة", en: "Short circuit" },
        cause: {
          ar: `الأميتر على التوازي: المقاومة الفعلية ${f(o.rEff)}Ω فقط`,
          en: `Ammeter in parallel: effective resistance is only ${f(o.rEff)}Ω`,
        },
        consequence: {
          ar: `التيار هيقفز لـ ${f(o.current)}A — الفيوز هيفصل أو السلك ممكن ينصهر.`,
          en: `Current soars to ${f(o.current)}A — the fuse will blow or the wire may melt.`,
        },
        fix: {
          ar: "وصّل الأميتر على التوالي مع المقاومة، مش على التوازي مع المصدر.",
          en: "Wire the ammeter in series with the resistor, never across the source.",
        },
      });
    }

    if (o.current >= FUSE_AMPS) {
      out.push({
        id: "overcurrent",
        level: 2,
        title: { ar: "تيار فوق حمل الفيوز", en: "Current above fuse rating" },
        cause: {
          ar: `التيار ${f(o.current, 2)}A أعلى من ${FUSE_AMPS}A`,
          en: `Current ${f(o.current, 2)}A exceeds ${FUSE_AMPS}A`,
        },
        consequence: {
          ar: "الفيوز هيفصل والمصباح هيطفي. ولو مفيش فيوز، السلك هيسخن لحد ما ينصهر.",
          en: "The fuse trips and the bulb goes dark. Without a fuse, the wire heats until it melts.",
        },
        fix: { ar: "قلّل الجهد أو زوّد المقاومة.", en: "Lower the voltage or raise the resistance." },
      });
    } else if (o.current > 3) {
      out.push({
        id: "overcurrent",
        level: 1,
        title: { ar: "تيار عالي", en: "High current" },
        cause: { ar: `التيار ${f(o.current, 2)}A`, en: `Current ${f(o.current, 2)}A` },
        consequence: {
          ar: "السلك بيسخن باستمرار وعمر العزل بيقل.",
          en: "The wire keeps heating and the insulation ages faster.",
        },
        fix: { ar: "قلّل الجهد أو زوّد المقاومة.", en: "Lower the voltage or raise the resistance." },
      });
    }

    if (o.power >= 2 * RESISTOR_WATTS) {
      out.push({
        id: "power",
        level: 2,
        title: { ar: "قدرة تفوق حد المقاومة", en: "Power far above resistor rating" },
        cause: {
          ar: `القدرة ${f(o.power)}W مقابل حد ${RESISTOR_WATTS}W`,
          en: `${f(o.power)}W against a ${RESISTOR_WATTS}W rating`,
        },
        consequence: {
          ar: "المقاومة هتحترق وتطلع دخان.",
          en: "The resistor will burn out and smoke.",
        },
        fix: {
          ar: "قلّل الجهد أو استخدم مقاومة بقدرة أكبر.",
          en: "Lower the voltage or use a higher-wattage resistor.",
        },
      });
    } else if (o.power > RESISTOR_WATTS) {
      out.push({
        id: "power",
        level: 1,
        title: { ar: "المقاومة قربت من حدها الحراري", en: "Resistor near its thermal limit" },
        cause: {
          ar: `القدرة ${f(o.power)}W أعلى من ${RESISTOR_WATTS}W`,
          en: `${f(o.power)}W is above ${RESISTOR_WATTS}W`,
        },
        consequence: {
          ar: "المقاومة هتسخن جداً وقيمتها هتتغير.",
          en: "The resistor gets very hot and drifts out of tolerance.",
        },
        fix: { ar: "قلّل الجهد.", en: "Lower the voltage." },
      });
    }

    if (v.temperature >= 135) {
      out.push({
        id: "insulation",
        level: 2,
        title: { ar: "العزل بيدوب", en: "Insulation melting" },
        cause: {
          ar: `حرارة السلك ${f(v.temperature, 0)}°C`,
          en: `Wire at ${f(v.temperature, 0)}°C`,
        },
        consequence: {
          ar: "خطر ماس كهربي وحريق.",
          en: "Risk of a short circuit and fire.",
        },
        fix: { ar: "برّد السلك أو قلّل التيار.", en: "Cool the wire or reduce the current." },
      });
    } else if (v.temperature >= 110) {
      out.push({
        id: "insulation",
        level: 1,
        title: { ar: "العزل بيلين", en: "Insulation softening" },
        cause: {
          ar: `حرارة السلك ${f(v.temperature, 0)}°C`,
          en: `Wire at ${f(v.temperature, 0)}°C`,
        },
        consequence: {
          ar: "العزل بيفقد صلابته وخواصه.",
          en: "The insulation loses stiffness and protection.",
        },
        fix: { ar: "قلّل الحرارة.", en: "Reduce the temperature." },
      });
    }

    if (v.fault === 2 && o.contactPower > 1) {
      const critical = o.contactPower > 8;
      out.push({
        id: "loose-contact",
        level: critical ? 2 : 1,
        title: { ar: "وصلة مفككة بتسخن", en: "Loose joint is heating" },
        cause: {
          ar: `${f(o.contactPower)}W بتتبدد في الوصلة`,
          en: `${f(o.contactPower)}W dissipated in the joint`,
        },
        consequence: critical
          ? {
              ar: "شرار وسخونة موضعية عالية — خطر حريق.",
              en: "Sparking and intense local heat — fire hazard.",
            }
          : {
              ar: "الوصلة بتسخن والمصباح ممكن يرمش.",
              en: "The joint heats up and the bulb may flicker.",
            },
        fix: { ar: "شد التوصيلة ونضّفها.", en: "Tighten and clean the connection." },
      });
    }

    if (v.fault === 3) {
      out.push({
        id: "meter-series",
        level: 1,
        title: { ar: "فولتميتر على التوالي", en: "Voltmeter in series" },
        cause: {
          ar: `المقاومة الفعلية بقت ${f(o.rEff, 0)}Ω بسبب المقاومة الداخلية للفولتميتر`,
          en: `Effective resistance is now ${f(o.rEff, 0)}Ω because of the voltmeter's input resistance`,
        },
        consequence: {
          ar: `التيار شبه صفر (${f(o.current * 1000, 2)}mA): الدائرة تبدو مفتوحة، والمصباح لا يضيء، والفولتميتر يقرأ جهد المصدر تقريباً مش جهد المقاومة.`,
          en: `Current is almost zero (${f(o.current * 1000, 2)}mA): the circuit looks open, the bulb stays dark and the voltmeter reads roughly the source voltage, not the voltage across the resistor.`,
        },
        fix: {
          ar: "وصّل الفولتميتر على التوازي مع المقاومة.",
          en: "Connect the voltmeter in parallel across the resistor.",
        },
      });
    }

    return out.sort(byLevel);
  },
  guided: [
    {
      id: "voltage",
      title: { ar: "الجهد بيزق التيار", en: "Voltage pushes current" },
      task: {
        ar: "ارفع الجهد لـ 18V أو أكتر وراقب شدة التيار.",
        en: "Raise the voltage to 18V or more and watch the current.",
      },
      hint: {
        ar: "اسحب سلايدر الجهد ناحية القيمة الكبيرة.",
        en: "Drag the voltage slider toward its maximum.",
      },
      explainIndex: 0,
      focus: "voltage",
      start: { voltage: 6, resistance: 10, temperature: 25 },
      done: (v) => v.voltage >= 18,
    },
    {
      id: "resistance",
      title: { ar: "المقاومة بتعرقل", en: "Resistance obstructs" },
      task: {
        ar: "زوّد المقاومة لـ 30Ω أو أكتر وشوف التيار بيقل.",
        en: "Raise the resistance to 30Ω or more and see the current fall.",
      },
      hint: {
        ar: "حرّك سلايدر المقاومة لليمين.",
        en: "Slide the resistance control up.",
      },
      explainIndex: 1,
      focus: "resistance",
      start: { voltage: 12, resistance: 10, temperature: 25 },
      done: (v) => v.resistance >= 30,
    },
    {
      id: "temperature",
      title: { ar: "الحرارة بتزوّد المقاومة", en: "Heat raises resistance" },
      task: {
        ar: "سخّن السلك لـ 100°C أو أكتر وقارن المقاومة الفعلية.",
        en: "Heat the wire to 100°C or more and compare the effective resistance.",
      },
      hint: {
        ar: "استخدم سلايدر الحرارة وركّز على 'المقاومة الفعلية'.",
        en: "Use the temperature slider and watch 'Effective R'.",
      },
      explainIndex: 2,
      focus: "temperature",
      start: { voltage: 12, resistance: 10, temperature: 25 },
      done: (v) => v.temperature >= 100,
    },
  ],
  calc: (v, lang) => {
    const o = computeOhm(v.voltage, v.resistance, v.temperature, v.fault);
    const ar = lang === "ar";
    const rStep: CalcStep =
      v.fault === 1
        ? {
            label: ar ? "المقاومة الفعلية (قصر دائرة)" : "Effective R (short)",
            expr: `Rₜ = ${f(o.rEff)} Ω`,
          }
        : v.fault === 3
          ? {
              label: ar ? "المقاومة الفعلية (فولتميتر على التوالي)" : "Effective R (series meter)",
              expr: `Rₜ = ${f(v.resistance * (1 + 0.0039 * (v.temperature - 25)))} + ${VOLTMETER_R} = ${f(o.rEff, 0)} Ω`,
            }
          : {
              label: ar ? "المقاومة الفعلية" : "Effective resistance",
              expr: `Rₜ = ${f(v.resistance, 0)} × (1 + 0.0039 × (${f(v.temperature, 0)} − 25))${
                v.fault === 2 ? " + 8" : ""
              } = ${f(o.rEff)} Ω`,
            };
    return [
      rStep,
      {
        label: ar ? "شدة التيار" : "Current",
        expr: `I = ${f(v.voltage)} ÷ ${f(o.rEff)} = ${f(o.current, 2)} A`,
      },
      {
        label: ar ? "القدرة" : "Power",
        expr: `P = ${f(v.voltage)} × ${f(o.current, 2)} = ${f(o.power)} W`,
      },
    ];
  },
  layers: [
    ...commonLayers,
    {
      id: "hidden",
      label: { ar: "رؤية ما لا يُرى", en: "See the unseen" },
      default: false,
    },
    {
      id: "field",
      label: { ar: "المجال الكهربي والقوة", en: "Electric field & force" },
      default: false,
    },
  ],
};

/** Length (m) of the conductor the supply voltage is applied across in the field panel. */
export const WIRE_LENGTH_M = 0.5;
const ELECTRON_CHARGE = 1.602e-19;
/** Free-electron density of copper (m⁻³) and a 1 mm² cross-section (m²). */
const COPPER_N = 8.5e28;
const WIRE_AREA_M2 = 1e-6;

/** Field, force and drift speed in the conductor: E = V/L, F = eE, v_d = I/(n·e·A). */
export function fieldInfo(v: SimValues) {
  const o = computeOhm(v.voltage, v.resistance, v.temperature, v.fault);
  const field = v.voltage / WIRE_LENGTH_M;
  const force = ELECTRON_CHARGE * field;
  const driftMmPerS = (o.current / (COPPER_N * ELECTRON_CHARGE * WIRE_AREA_M2)) * 1000;
  return { field, force, driftMmPerS, current: o.current };
}

/** Scientific notation with a fixed mantissa, e.g. 3.85e-18. */
export function sci(n: number, digits = 2) {
  return Number.isFinite(n) ? n.toExponential(digits) : "∞";
}

/* ------------------------------------------------------------------ */
/* Chemistry — reaction rate                                           */
/* ------------------------------------------------------------------ */

/** Activation energy (kJ/mol) without / with catalyst (4.5 kJ per gram, floor 30). */
export function activationEnergy(catalyst: number) {
  const base = 80;
  return { base, withCatalyst: Math.max(30, base - 4.5 * catalyst), deltaH: -40 };
}

const chemExtras: SimExtras = {
  effect: "chemical",
  faults: [
    {
      id: 1,
      label: { ar: "خلط الكاشف دفعة واحدة", en: "All reagent mixed at once" },
      description: {
        ar: "بدل الإضافة التدريجية: السرعة الابتدائية ×3 وفوران مفاجئ.",
        en: "Instead of gradual addition: initial rate ×3 and sudden foaming.",
      },
    },
    {
      id: 2,
      label: { ar: "وعاء مقفول بدون تنفيس", en: "Sealed vessel, no venting" },
      description: {
        ar: "الغاز الناتج مالوش مخرج فالضغط بيزيد جوه الوعاء.",
        en: "Produced gas cannot escape, so pressure builds inside.",
      },
    },
    {
      id: 3,
      label: { ar: "تفاعل طارد بدون تبريد", en: "Exothermic reaction, no cooling" },
      description: {
        ar: `الحرارة الناتجة محبوسة فالوعاء بيسخن +${RUNAWAY_DELTA_C}°C فوق المضبوط، والسرعة بتزيد معاها.`,
        en: `The released heat is trapped, so the vessel runs +${RUNAWAY_DELTA_C}°C above the set value and the rate climbs with it.`,
      },
    },
  ],
  hazards: (v) => {
    const r = computeRate(v.temperature, v.concentration, v.catalyst, v.fault);
    const out: Hazard[] = [];

    if (v.fault === 1) {
      out.push({
        id: "burst",
        level: 1,
        title: { ar: "خلط دفعة واحدة", en: "Mixed all at once" },
        cause: { ar: "السرعة الابتدائية اتضاعفت ×3", en: "Initial rate multiplied ×3" },
        consequence: {
          ar: "تصاعد مفاجئ للغاز وفوران وطرطشة للمحلول.",
          en: "Sudden gas release, foaming and splashing.",
        },
        fix: {
          ar: "ضيف الكاشف تدريجياً مع التقليب.",
          en: "Add the reagent gradually while stirring.",
        },
      });
    }

    if (r.rate >= 600) {
      out.push({
        id: "runaway",
        level: 2,
        title: { ar: "تفاعل جامح", en: "Runaway reaction" },
        cause: { ar: `السرعة ${f(r.rate, 0)} mM/s`, en: `Rate ${f(r.rate, 0)} mM/s` },
        consequence: {
          ar: "الغاز بيتولد أسرع من ما يتصرف: ضغط وطرطشة وسخونة، والوعاء ممكن ينفجر.",
          en: "Gas forms faster than it can escape: pressure, splashing and heat — the vessel may burst.",
        },
        fix: {
          ar: "برّد الخليط، قلّل التركيز، وضيف الكاشف تدريجياً.",
          en: "Cool the mixture, lower the concentration and add reagent gradually.",
        },
      });
    } else if (r.rate >= 150) {
      out.push({
        id: "runaway",
        level: 1,
        title: { ar: "تفاعل سريع جداً", en: "Very fast reaction" },
        cause: { ar: `السرعة ${f(r.rate, 0)} mM/s`, en: `Rate ${f(r.rate, 0)} mM/s` },
        consequence: {
          ar: "غاز كتير بيتولد بسرعة وفوران ممكن يطلع من الوعاء.",
          en: "Lots of gas forms quickly and may froth over.",
        },
        fix: { ar: "قلّل الحرارة أو التركيز.", en: "Lower temperature or concentration." },
      });
    }

    if (v.fault === 2 && r.rate >= 40) {
      const critical = r.rate >= 100;
      out.push({
        id: "pressure",
        level: critical ? 2 : 1,
        title: { ar: "ضغط داخل وعاء مقفول", en: "Pressure in a sealed vessel" },
        cause: {
          ar: `سرعة ${f(r.rate, 0)} mM/s بدون تنفيس`,
          en: `${f(r.rate, 0)} mM/s with no vent`,
        },
        consequence: critical
          ? {
              ar: "الوعاء ممكن ينفجر وتتطاير شظايا.",
              en: "The vessel may burst and throw fragments.",
            }
          : { ar: "الضغط بيزيد تدريجياً.", en: "Pressure keeps climbing." },
        fix: { ar: "افتح التنفيس أو برّد الوعاء.", en: "Open a vent or cool the vessel." },
      });
    }

    if (v.fault === 3) {
      const critical = r.tEff >= 85;
      out.push({
        id: "no-cooling",
        level: critical ? 2 : 1,
        title: { ar: "تفاعل طارد بدون تبريد", en: "Exothermic reaction without cooling" },
        cause: {
          ar: `الحرارة الفعلية ${f(r.tEff, 0)}°C بدل ${f(v.temperature, 0)}°C (ΔH = −40 kJ/mol محبوسة)`,
          en: `Actual temperature ${f(r.tEff, 0)}°C instead of ${f(v.temperature, 0)}°C (ΔH = −40 kJ/mol trapped)`,
        },
        consequence: critical
          ? {
              ar: "الحرارة بترفع السرعة والسرعة بترفع الحرارة: غليان ممكن وانفجار الوعاء.",
              en: "Heat raises the rate and the rate raises the heat: boiling and a possible vessel burst.",
            }
          : {
              ar: "الخليط بيسخن أكتر من المخطط والسرعة بتزيد (تقريباً ×2 كل +10°C).",
              en: "The mixture runs hotter than planned and the rate climbs (about ×2 per +10°C).",
            },
        fix: {
          ar: "برّد الوعاء بحمام مائي أو ثلج وضيف الكاشف تدريجياً.",
          en: "Cool the vessel in a water or ice bath and add reagent gradually.",
        },
      });
    }

    if (v.temperature >= 95) {
      out.push({
        id: "boiling",
        level: 2,
        title: { ar: "غليان المحلول", en: "Solution boiling" },
        cause: { ar: `الحرارة ${f(v.temperature, 0)}°C`, en: `${f(v.temperature, 0)}°C` },
        consequence: {
          ar: "تطاير المحلول وأبخرة ضارة.",
          en: "Solution spits and releases harmful vapours.",
        },
        fix: { ar: "قلّل الحرارة.", en: "Lower the temperature." },
      });
    } else if (v.temperature >= 85) {
      out.push({
        id: "boiling",
        level: 1,
        title: { ar: "قرب الغليان", en: "Near boiling" },
        cause: { ar: `الحرارة ${f(v.temperature, 0)}°C`, en: `${f(v.temperature, 0)}°C` },
        consequence: { ar: "أبخرة وتبخر سريع.", en: "Vapours and rapid evaporation." },
        fix: { ar: "قلّل الحرارة.", en: "Lower the temperature." },
      });
    }

    return out.sort(byLevel);
  },
  guided: [
    {
      id: "concentration",
      title: { ar: "تصادمات أكتر", en: "More collisions" },
      task: {
        ar: "زوّد التركيز لـ 1.8M أو أكتر وراقب التصادمات.",
        en: "Raise the concentration to 1.8M or more and watch collisions.",
      },
      hint: { ar: "حرّك سلايدر التركيز لليمين.", en: "Slide the concentration control up." },
      explainIndex: 0,
      focus: "concentration",
      start: { temperature: 25, concentration: 0.5, catalyst: 0 },
      done: (v) => v.concentration >= 1.8,
    },
    {
      id: "temperature",
      title: { ar: "+10°C = سرعة ×2", en: "+10°C = rate ×2" },
      task: {
        ar: "سخّن الخليط لـ 45°C أو أكتر وقارن سرعة التفاعل.",
        en: "Heat the mixture to 45°C or more and compare the rate.",
      },
      hint: { ar: "استخدم سلايدر الحرارة.", en: "Use the temperature slider." },
      explainIndex: 1,
      focus: "temperature",
      start: { temperature: 25, concentration: 1, catalyst: 0 },
      done: (v) => v.temperature >= 45,
    },
    {
      id: "catalyst",
      title: { ar: "العامل الحفاز", en: "The catalyst" },
      task: {
        ar: "ضيف 5g أو أكتر من العامل الحفاز من غير ما تغيّر الحرارة.",
        en: "Add 5g or more of catalyst without changing the temperature.",
      },
      hint: { ar: "سلايدر العامل الحفاز.", en: "Use the catalyst slider." },
      explainIndex: 2,
      focus: "catalyst",
      start: { temperature: 25, concentration: 1, catalyst: 0 },
      done: (v) => v.catalyst >= 5,
    },
  ],
  calc: (v, lang) => {
    const ar = lang === "ar";
    const r = computeRate(v.temperature, v.concentration, v.catalyst, v.fault);
    const tempFactor = 2 ** ((r.tEff - 25) / 10);
    const catFactor = 1 + 0.3 * v.catalyst;
    const burst = v.fault === 1 ? 3 : 1;
    const k = v.concentration > 0 ? r.rate / v.concentration / 1000 : 0;
    const e = activationEnergy(v.catalyst);
    return [
      {
        label: ar ? "معامل الحرارة" : "Temperature factor",
        expr: `2^((${f(r.tEff, 0)} − 25) ÷ 10) = ${f(tempFactor, 2)}×`,
      },
      {
        label: ar ? "معامل العامل الحفاز" : "Catalyst factor",
        expr: `1 + 0.3 × ${f(v.catalyst)} = ${f(catFactor, 2)}×`,
      },
      {
        label: ar ? "سرعة التفاعل" : "Reaction rate",
        expr: `r = 5 × ${f(v.concentration)} × ${f(tempFactor, 2)} × ${f(catFactor, 2)}${
          burst > 1 ? " × 3" : ""
        } = ${f(r.rate)} mM/s`,
      },
      {
        label: ar ? "ثابت السرعة وعمر النصف" : "Rate constant & half-life",
        expr: `k = ${k.toFixed(4)} s⁻¹ · t½ = ${f(r.halfLife, 0)} s`,
      },
      {
        label: ar ? "طاقة التنشيط" : "Activation energy",
        expr: `Ea = ${f(e.base, 0)} → ${f(e.withCatalyst, 1)} kJ/mol`,
      },
    ];
  },
  layers: [
    ...commonLayers,
    { id: "energy", label: { ar: "مخطط الطاقة", en: "Energy diagram" }, default: false },
    {
      id: "equilibrium",
      label: { ar: "الاتزان ولوشاتيليه", en: "Equilibrium & Le Chatelier" },
      default: false,
    },
  ],
};

const GAS_R = 8.314;
/** Below this |ln(Q/K)| the system is treated as already at equilibrium. */
const SHIFT_EPS = 0.05;

export type EquilibriumShift = "forward" | "reverse" | "none";

/**
 * Le Chatelier for the exothermic reaction A ⇌ B (ΔH = −40 kJ/mol), measured against the reference
 * state 25 °C / 1 M (K = 1, Q = 1). K follows van't Hoff; adding reactant lowers Q = [B]/[A].
 * The catalyst speeds up both directions equally, so it never moves the equilibrium.
 */
export function leChatelier(v: SimValues) {
  const dH = activationEnergy(v.catalyst).deltaH * 1000;
  const T = v.temperature + 273.15;
  const K = Math.exp((-dH / GAS_R) * (1 / T - 1 / 298.15));
  const Q = 1 / Math.max(v.concentration, 0.1);
  const ratio = Math.log(Q / K);
  const shift: EquilibriumShift =
    ratio > SHIFT_EPS ? "reverse" : ratio < -SHIFT_EPS ? "forward" : "none";

  const reasons: L10n[] = [];
  if (v.concentration > 1.05) {
    reasons.push({
      ar: "زيادة تركيز المتفاعلات: النظام يستهلكها فينتقل نحو النواتج.",
      en: "More reactant: the system consumes it and shifts toward the products.",
    });
  } else if (v.concentration < 0.95) {
    reasons.push({
      ar: "نقص تركيز المتفاعلات: النظام يعوّضها فينتقل نحو المتفاعلات.",
      en: "Less reactant: the system replenishes it and shifts toward the reactants.",
    });
  }
  if (v.temperature > 27) {
    reasons.push({
      ar: "التفاعل طارد للحرارة: رفع الحرارة يُنقصه فيزيد الاتجاه العكسي ويقلّ K.",
      en: "The reaction is exothermic: heating favours the reverse direction and lowers K.",
    });
  } else if (v.temperature < 23) {
    reasons.push({
      ar: "التفاعل طارد للحرارة: التبريد يرفع K وينقل الاتزان نحو النواتج.",
      en: "The reaction is exothermic: cooling raises K and favours the products.",
    });
  }
  if (v.catalyst > 0) {
    reasons.push({
      ar: "الحفاز يسرّع الاتجاهين بالتساوي: يقرّب الوصول للاتزان دون تغيير موضعه.",
      en: "The catalyst speeds both directions equally: it reaches equilibrium sooner without moving it.",
    });
  }
  return { K, Q, shift, reasons };
}

/* ------------------------------------------------------------------ */
/* Biology — diffusion                                                 */
/* ------------------------------------------------------------------ */

/** Fraction (0–1) of the way to equilibrium after `t` simulated seconds. */
export function equilibriumProgress(v: SimValues, t: number) {
  const effectiveGradient = v.fault === 2 ? Math.min(100, v.gradient + 40) : v.gradient;
  // Nothing to equalise: both sides already match.
  if (effectiveGradient <= 0) return 1;
  const { rate } = computeDiffusion(v.temperature, v.gradient, v.permeability, v.fault);
  return 1 - Math.exp(-(rate / 120) * Math.max(0, t));
}

const bioExtras: SimExtras = {
  effect: "cellular",
  faults: [
    {
      id: 1,
      label: { ar: "غشاء تالف (مسرّب)", en: "Damaged (leaky) membrane" },
      description: {
        ar: "النفاذية بتعلى وبتفقد الانتقائية.",
        en: "Permeability rises and selectivity is lost.",
      },
    },
    {
      id: 2,
      label: { ar: "محلول مفرط التركيز برة الخلية", en: "Hypertonic surroundings" },
      description: {
        ar: "فرق التركيز بيزيد 40% فالماء بيخرج من الخلية.",
        en: "Gradient grows by 40%, pulling water out of the cell.",
      },
    },
    {
      id: 3,
      label: { ar: "قنوات بروتينية مسدودة", en: "Blocked channel proteins" },
      description: {
        ar: `مثبّط أو سم بيسد القنوات فبيفضل ${Math.round(BLOCKED_CHANNEL_FACTOR * 100)}% بس من النفاذية.`,
        en: `An inhibitor or toxin plugs the channels, leaving only ${Math.round(BLOCKED_CHANNEL_FACTOR * 100)}% of the permeability.`,
      },
    },
  ],
  hazards: (v) => {
    const d = computeDiffusion(v.temperature, v.gradient, v.permeability, v.fault);
    const out: Hazard[] = [];

    if (d.denatured) {
      out.push({
        id: "denature",
        level: 2,
        title: { ar: "بروتينات الغشاء اتشوّهت", en: "Membrane proteins denatured" },
        cause: {
          ar: `حرارة ${f(v.temperature, 0)}°C أعلى من ${DENATURE_C}°C`,
          en: `${f(v.temperature, 0)}°C is above ${DENATURE_C}°C`,
        },
        consequence: {
          ar: "الغشاء بيفقد انتقائيته ويبقى مسرّب، والخلية ممكن تموت.",
          en: "The membrane loses selectivity and leaks; the cell may die.",
        },
        fix: { ar: "رجّع الحرارة قرب 37°C.", en: "Bring the temperature back near 37°C." },
      });
    } else if (v.temperature >= 42) {
      out.push({
        id: "fever",
        level: 1,
        title: { ar: "حرارة مرتفعة", en: "Elevated temperature" },
        cause: { ar: `حرارة ${f(v.temperature, 0)}°C`, en: `${f(v.temperature, 0)}°C` },
        consequence: {
          ar: "الإنزيمات والبروتينات بتبدأ تتأثر.",
          en: "Enzymes and proteins start to be affected.",
        },
        fix: { ar: "قلّل الحرارة.", en: "Lower the temperature." },
      });
    } else if (v.temperature <= 5) {
      out.push({
        id: "cold",
        level: 1,
        title: { ar: "برودة شديدة", en: "Severe cold" },
        cause: { ar: `حرارة ${f(v.temperature, 0)}°C`, en: `${f(v.temperature, 0)}°C` },
        consequence: {
          ar: "حركة الجزيئات بطيئة جداً والانتشار شبه واقف.",
          en: "Molecules barely move and diffusion nearly stops.",
        },
        fix: { ar: "ارفع الحرارة.", en: "Raise the temperature." },
      });
    }

    if (v.fault === 1) {
      out.push({
        id: "leak",
        level: 2,
        title: { ar: "غشاء تالف", en: "Damaged membrane" },
        cause: {
          ar: `النفاذية الفعلية بقت أعلى من المضبوطة (${f(v.permeability, 0)}%)`,
          en: `Effective permeability exceeds the set ${f(v.permeability, 0)}%`,
        },
        consequence: {
          ar: "الجزيئات بتعدّي من غير تحكم والخلية بتفقد محتوياتها.",
          en: "Molecules cross uncontrolled and the cell loses its contents.",
        },
        fix: {
          ar: "ارجع للحالة السليمة (شيل العطل).",
          en: "Return to a healthy membrane (clear the fault).",
        },
      });
    }

    if (v.fault === 2) {
      out.push({
        id: "hypertonic",
        level: 1,
        title: { ar: "محلول مفرط التركيز", en: "Hypertonic solution" },
        cause: { ar: "فرق التركيز زاد 40%", en: "Gradient increased by 40%" },
        consequence: {
          ar: "الماء بيخرج من الخلية فتنكمش (بلازمة).",
          en: "Water leaves the cell and it shrinks (plasmolysis).",
        },
        fix: { ar: "قلّل فرق التركيز.", en: "Reduce the concentration gradient." },
      });
    }

    if (v.fault === 3) {
      out.push({
        id: "blocked-channels",
        level: 1,
        title: { ar: "قنوات الغشاء مسدودة", en: "Membrane channels blocked" },
        cause: {
          ar: `النفاذية الفعلية ${f(v.permeability * BLOCKED_CHANNEL_FACTOR, 0)}% بدل ${f(v.permeability, 0)}% (معدل الانتشار ${f(d.rate)})`,
          en: `Effective permeability ${f(v.permeability * BLOCKED_CHANNEL_FACTOR, 0)}% instead of ${f(v.permeability, 0)}% (diffusion rate ${f(d.rate)})`,
        },
        consequence: {
          ar: "الجلوكوز والأيونات بتدخل ببطء فالخلية بتجوع وتتجمع الفضلات جوّاها.",
          en: "Glucose and ions enter slowly, so the cell starves and wastes build up inside.",
        },
        fix: {
          ar: "أزل المثبّط أو استخدم مضاداً له.",
          en: "Remove the inhibitor or use an antidote.",
        },
      });
    }

    return out.sort(byLevel);
  },
  guided: [
    {
      id: "zero-gradient",
      title: { ar: "من غير فرق تركيز", en: "No gradient" },
      task: {
        ar: "صفّر فرق التركيز وراقب: صافي الانتشار بيقف.",
        en: "Set the gradient to zero and watch net diffusion stop.",
      },
      hint: {
        ar: "اسحب سلايدر فرق التركيز لأقصى اليسار.",
        en: "Drag the gradient slider to its minimum.",
      },
      explainIndex: 0,
      focus: "gradient",
      start: { temperature: 37, gradient: 50, permeability: 60 },
      done: (v) => v.gradient === 0,
    },
    {
      id: "big-gradient",
      title: { ar: "قانون فيك", en: "Fick's law" },
      task: {
        ar: "زوّد فرق التركيز لـ 80% أو أكتر وقارن المعدل.",
        en: "Raise the gradient to 80% or more and compare the rate.",
      },
      hint: { ar: "حرّك سلايدر فرق التركيز لليمين.", en: "Slide the gradient control up." },
      explainIndex: 1,
      focus: "gradient",
      start: { temperature: 37, gradient: 20, permeability: 60 },
      done: (v) => v.gradient >= 80,
    },
    {
      id: "permeability",
      title: { ar: "نفاذية الغشاء", en: "Membrane permeability" },
      task: {
        ar: "افتح نفاذية الغشاء لـ 90% أو أكتر.",
        en: "Open the membrane permeability to 90% or more.",
      },
      hint: { ar: "سلايدر النفاذية.", en: "Use the permeability slider." },
      explainIndex: 2,
      focus: "permeability",
      start: { temperature: 37, gradient: 50, permeability: 20 },
      done: (v) => v.permeability >= 90,
    },
  ],
  calc: (v, lang) => {
    const ar = lang === "ar";
    const d = computeDiffusion(v.temperature, v.gradient, v.permeability, v.fault);
    const perm = d.leaky
      ? Math.min(100, v.permeability * 1.8 + 20)
      : d.blocked
        ? v.permeability * BLOCKED_CHANNEL_FACTOR
        : v.permeability;
    const grad = v.fault === 2 ? Math.min(100, v.gradient + 40) : v.gradient;
    return [
      {
        label: ar ? "النفاذية الفعلية" : "Effective permeability",
        expr: `P = ${f(perm, 0)} %${
          d.leaky
            ? ar
              ? " (غشاء مسرّب)"
              : " (leaky)"
            : d.blocked
              ? ar
                ? " (قنوات مسدودة)"
                : " (blocked channels)"
              : ""
        }`,
      },
      {
        label: ar ? "فرق التركيز الفعلي" : "Effective gradient",
        expr: `ΔC = ${f(grad, 0)} %`,
      },
      {
        label: ar ? "معدل الانتشار" : "Diffusion rate",
        expr: `J = ${f(grad / 100, 2)} × ${f(perm / 100, 2)} × (${f(v.temperature, 0)} + 273) ÷ 310 × 100 = ${f(d.rate)}`,
      },
      {
        label: ar ? "زمن الاتزان" : "Time to equilibrium",
        expr: `tₑ = 60 ÷ ${f(d.rate)} = ${f(d.equilibrium)} min`,
      },
    ];
  },
  layers: [
    ...commonLayers,
    { id: "anatomy", label: { ar: "التشريح", en: "Anatomy" }, default: false },
    { id: "timeline", label: { ar: "الخط الزمني", en: "Timeline" }, default: true },
    {
      id: "microscope",
      label: { ar: "الميكروسكوب الافتراضي", en: "Virtual microscope" },
      default: false,
    },
  ],
};

export type ScopeKind = "light" | "electron";

/**
 * Virtual microscope: the macro view uses a light microscope (400×), the molecular view an electron
 * microscope (50 000×). Field of view ≈ 180 000 µm ÷ magnification. A light microscope resolves
 * ~0.2 µm, so the 7–10 nm membrane is only visible with the electron microscope.
 */
export function microscopeInfo(v: SimValues, view: "macro" | "molecular") {
  const kind: ScopeKind = view === "molecular" ? "electron" : "light";
  const magnification = kind === "electron" ? 50_000 : 400;
  const fovUm = 180_000 / magnification;
  const d = computeDiffusion(v.temperature, v.gradient, v.permeability, v.fault);
  const effectivePerm = d.leaky
    ? Math.min(100, v.permeability * 1.8 + 20)
    : d.blocked
      ? v.permeability * BLOCKED_CHANNEL_FACTOR
      : v.permeability;
  return {
    kind,
    magnification,
    fovUm,
    membraneVisible: kind === "electron",
    channels: Math.round(effectivePerm / 12.5),
    solute: Math.round(
      d.rate > 0
        ? Math.min(14, 2 + (v.fault === 2 ? Math.min(100, v.gradient + 40) : v.gradient) / 8)
        : 2,
    ),
    leaky: d.leaky,
  };
}

/* ------------------------------------------------------------------ */
/* Biology — "Be you": adrenaline, heart, blood flow and brain          */
/* ------------------------------------------------------------------ */

const adrenalineExtras: SimExtras = {
  effect: "cellular",
  faults: [
    {
      id: 1,
      label: { ar: "نوبة أدرينالين زائدة", en: "Adrenaline surge" },
      description: {
        ar: `الغدة الكظرية بتفرز كمية إضافية فالأدرينالين بيزيد ${ADRENALINE_SURGE} نقطة فوق اللي ضابطه.`,
        en: `The adrenal glands release an extra burst: adrenaline rises ${ADRENALINE_SURGE} points above the setting.`,
      },
    },
    {
      id: 2,
      label: { ar: "تضيّق شريان المخ", en: "Narrowed brain artery" },
      description: {
        ar: `الدم الواصل للمخ بيقل لـ ${Math.round(ARTERY_FLOW_FACTOR * 100)}% بسبب ترسّبات في الشريان.`,
        en: `Deposits narrow the artery so only ${Math.round(ARTERY_FLOW_FACTOR * 100)}% of the blood reaches the brain.`,
      },
    },
    {
      id: 3,
      label: { ar: "حاصرات بيتا (دواء)", en: "Beta blocker (drug)" },
      description: {
        ar: `الدواء بيغطي مستقبلات القلب فبيستجيب بـ ${Math.round(BETA_BLOCK_FACTOR * 100)}% بس من تأثير الأدرينالين.`,
        en: `The drug covers the heart's receptors, so it shows only ${Math.round(BETA_BLOCK_FACTOR * 100)}% of the adrenaline effect.`,
      },
    },
  ],
  hazards: (v) => {
    const p = computeAdrenaline(v.adrenaline, v.oxygen, v.glucose, v.fault);
    const out: Hazard[] = [];

    if (p.hr >= HR_CRITICAL) {
      out.push({
        id: "tachy-critical",
        level: 2,
        title: { ar: "قلب سريع لدرجة خطيرة", en: "Dangerously fast heart" },
        cause: {
          ar: `النبض ${f(p.hr, 0)} bpm والقلب مش بيلحق يتملي`,
          en: `${f(p.hr, 0)} bpm: the heart cannot fill between beats`,
        },
        consequence: {
          ar: "الدم الخارج من القلب بيقل وممكن يحصل عدم انتظام خطير أو إغماء.",
          en: "Output falls and a dangerous rhythm or fainting can follow.",
        },
        fix: {
          ar: "قلّل الأدرينالين وهدّي الموقف.",
          en: "Lower the adrenaline and calm the situation.",
        },
      });
    } else if (p.hr >= HR_TACHYCARDIA) {
      out.push({
        id: "tachy",
        level: 1,
        title: { ar: "تسرّع القلب", en: "Racing heart" },
        cause: { ar: `النبض ${f(p.hr, 0)} bpm`, en: `${f(p.hr, 0)} bpm` },
        consequence: {
          ar: "القلب بيشتغل بجهد عالي وبتحس بخفقان وضيق.",
          en: "The heart works very hard; you feel palpitations and tightness.",
        },
        fix: { ar: "قلّل الأدرينالين أو عالج السبب.", en: "Lower adrenaline or treat the cause." },
      });
    } else if (p.hr < 50) {
      out.push({
        id: "brady",
        level: 2,
        title: { ar: "بطء القلب الخطير", en: "Dangerously slow heart" },
        cause: { ar: `النبض ${f(p.hr, 0)} bpm`, en: `${f(p.hr, 0)} bpm` },
        consequence: {
          ar: "القلب بيضعف من نقص الأكسجين والدم الواصل للمخ بيقل.",
          en: "The heart is failing from lack of oxygen and the brain gets less blood.",
        },
        fix: { ar: "ارفع أكسجين الدم فوراً.", en: "Raise the blood oxygen immediately." },
      });
    }

    if (v.oxygen < 80) {
      out.push({
        id: "hypoxia-severe",
        level: 2,
        title: { ar: "نقص أكسجين حاد", en: "Severe hypoxia" },
        cause: {
          ar: `تشبع الأكسجين ${f(v.oxygen, 0)}%`,
          en: `Oxygen saturation ${f(v.oxygen, 0)}%`,
        },
        consequence: {
          ar: "الأنسجة والمخ بيفقدوا الأكسجين وممكن يحصل إغماء وتلف.",
          en: "Tissues and brain are starved of oxygen; fainting and damage can follow.",
        },
        fix: {
          ar: "ارفع تشبع الأكسجين (تنفّس/أكسجين مساعد).",
          en: "Restore oxygen (breathing support, supplemental oxygen).",
        },
      });
    } else if (v.oxygen < 90) {
      out.push({
        id: "hypoxia",
        level: 1,
        title: { ar: "نقص أكسجين", en: "Low blood oxygen" },
        cause: {
          ar: `تشبع الأكسجين ${f(v.oxygen, 0)}%`,
          en: `Oxygen saturation ${f(v.oxygen, 0)}%`,
        },
        consequence: {
          ar: "القلب بيسرّع عشان يعوّض، والمخ بيتعب.",
          en: "The heart speeds up to compensate and the brain tires.",
        },
        fix: { ar: "ارفع تشبع الأكسجين.", en: "Raise the oxygen saturation." },
      });
    }

    if (v.glucose < 50) {
      out.push({
        id: "hypoglycemia-severe",
        level: 2,
        title: { ar: "هبوط حاد في السكر", en: "Severe hypoglycemia" },
        cause: { ar: `الجلوكوز ${f(v.glucose, 0)} mg/dL`, en: `Glucose ${f(v.glucose, 0)} mg/dL` },
        consequence: {
          ar: "المخ بيفقد وقوده: ارتباك وتشنجات وإغماء.",
          en: "The brain loses its fuel: confusion, seizures and fainting.",
        },
        fix: {
          ar: "ارفع الجلوكوز (سكر سريع الامتصاص).",
          en: "Raise the glucose (fast-acting sugar).",
        },
      });
    } else if (v.glucose < 65) {
      out.push({
        id: "hypoglycemia",
        level: 1,
        title: { ar: "هبوط في السكر", en: "Low blood sugar" },
        cause: { ar: `الجلوكوز ${f(v.glucose, 0)} mg/dL`, en: `Glucose ${f(v.glucose, 0)} mg/dL` },
        consequence: {
          ar: "رعشة ودوخة وتركيز ضعيف.",
          en: "Shakiness, dizziness and poor concentration.",
        },
        fix: { ar: "ارفع الجلوكوز.", en: "Raise the glucose." },
      });
    } else if (v.glucose > 250) {
      out.push({
        id: "hyperglycemia",
        level: 1,
        title: { ar: "ارتفاع السكر", en: "High blood sugar" },
        cause: { ar: `الجلوكوز ${f(v.glucose, 0)} mg/dL`, en: `Glucose ${f(v.glucose, 0)} mg/dL` },
        consequence: {
          ar: "عطش وتبوّل كتير وإرهاق، والمخ بيتأثر.",
          en: "Thirst, frequent urination and fatigue; the brain is affected.",
        },
        fix: {
          ar: "قلّل الجلوكوز لمستواه الطبيعي.",
          en: "Bring the glucose back to its normal range.",
        },
      });
    }

    if (p.brain < 40) {
      out.push({
        id: "brain-failure",
        level: 2,
        title: { ar: "المخ شبه متوقف", en: "Brain response collapsing" },
        cause: { ar: `استجابة المخ ${f(p.brain, 0)}%`, en: `Brain response ${f(p.brain, 0)}%` },
        consequence: {
          ar: "فقدان تركيز ووعي: الإغماء قريب.",
          en: "Loss of focus and consciousness: fainting is close.",
        },
        fix: {
          ar: "صحّح الأكسجين أو الجلوكوز أو تدفق الدم.",
          en: "Correct the oxygen, glucose or blood flow.",
        },
      });
    } else if (p.brain < 70) {
      out.push({
        id: "brain-weak",
        level: 1,
        title: { ar: "استجابة المخ ضعيفة", en: "Weak brain response" },
        cause: { ar: `استجابة المخ ${f(p.brain, 0)}%`, en: `Brain response ${f(p.brain, 0)}%` },
        consequence: {
          ar: "تشوّش ودوخة وبطء في رد الفعل.",
          en: "Confusion, dizziness and slow reactions.",
        },
        fix: { ar: "راجع الأكسجين والجلوكوز والتدفق.", en: "Check oxygen, glucose and flow." },
      });
    }

    if (v.fault === 1) {
      out.push({
        id: "adrenaline-surge",
        level: 1,
        title: { ar: "نوبة أدرينالين", en: "Adrenaline surge" },
        cause: {
          ar: `الأدرينالين الفعلي ${f(p.surged, 0)}% بدل ${f(v.adrenaline, 0)}%`,
          en: `Effective adrenaline ${f(p.surged, 0)}% instead of ${f(v.adrenaline, 0)}%`,
        },
        consequence: {
          ar: "خفقان وعرق وقلق وضغط مرتفع.",
          en: "Palpitations, sweating, anxiety and high blood pressure.",
        },
        fix: { ar: "هدّي الموقف أو شيل العطل.", en: "Calm the situation or clear the fault." },
      });
    }
    if (v.fault === 2) {
      out.push({
        id: "narrow-artery",
        level: 2,
        title: { ar: "شريان المخ ضيّق", en: "Narrowed brain artery" },
        cause: {
          ar: `تدفق المخ ${f(p.brainFlow, 0)} مل/د بدل ${f(p.output * 150, 0)}`,
          en: `Brain flow ${f(p.brainFlow, 0)} mL/min instead of ${f(p.output * 150, 0)}`,
        },
        consequence: {
          ar: "المخ بياخد دم أقل فيضعف وخطر السكتة بيزيد.",
          en: "The brain gets less blood, weakens, and stroke risk rises.",
        },
        fix: { ar: "عالج التضيّق (شيل العطل).", en: "Treat the narrowing (clear the fault)." },
      });
    }
    if (v.fault === 3) {
      out.push({
        id: "beta-blocker",
        level: 1,
        title: { ar: "حاصرات بيتا شغالة", en: "Beta blocker active" },
        cause: {
          ar: `القلب بيستجيب بـ ${Math.round(BETA_BLOCK_FACTOR * 100)}% من الأدرينالين`,
          en: `The heart responds at ${Math.round(BETA_BLOCK_FACTOR * 100)}% of the adrenaline`,
        },
        consequence: {
          ar: "النبض مش بيزيد وقت الخطر زي الطبيعي.",
          en: "The heart rate does not rise normally in danger.",
        },
        fix: { ar: "راجع جرعة الدواء مع الطبيب.", en: "Review the dose with a doctor." },
      });
    }

    return out.sort(byLevel);
  },
  guided: [
    {
      id: "adrenaline-heart",
      title: { ar: "الأدرينالين والقلب", en: "Adrenaline and the heart" },
      task: {
        ar: "ارفع الأدرينالين لـ 50% أو أكتر وراقب النبض.",
        en: "Raise adrenaline to 50% or more and watch the heart rate.",
      },
      hint: { ar: "اسحب سلايدر الأدرينالين لليمين.", en: "Slide the adrenaline control up." },
      explainIndex: 0,
      focus: "adrenaline",
      start: { adrenaline: 10, oxygen: 98, glucose: 90 },
      done: (v) => v.adrenaline >= 50,
    },
    {
      id: "oxygen",
      title: { ar: "الأكسجين يهدّي القلب", en: "Oxygen calms the heart" },
      task: {
        ar: "ارفع أكسجين الدم لـ 97% أو أكتر وشوف القلب بيهدى والمخ بياخد كفايته.",
        en: "Raise blood oxygen to 97% or more and watch the heart settle and the brain get enough.",
      },
      hint: { ar: "سلايدر أكسجين الدم.", en: "Use the blood oxygen slider." },
      explainIndex: 1,
      focus: "oxygen",
      start: { adrenaline: 10, oxygen: 91, glucose: 90 },
      done: (v) => v.oxygen >= 97,
    },
    {
      id: "glucose",
      title: { ar: "الجلوكوز وقود المخ", en: "Glucose is brain fuel" },
      task: {
        ar: "ارفع الجلوكوز لـ 90 mg/dL أو أكتر وراقب استجابة المخ ترجع كاملة.",
        en: "Raise glucose to 90 mg/dL or more and watch the brain response recover.",
      },
      hint: { ar: "سلايدر جلوكوز الدم.", en: "Use the blood glucose slider." },
      explainIndex: 1,
      focus: "glucose",
      start: { adrenaline: 10, oxygen: 98, glucose: 66 },
      done: (v) => v.glucose >= 90,
    },
  ],
  calc: (v, lang) => {
    const ar = lang === "ar";
    const p = computeAdrenaline(v.adrenaline, v.oxygen, v.glucose, v.fault);
    return [
      {
        label: ar ? "الأدرينالين الفعلي" : "Effective adrenaline",
        expr: `E = ${f(p.surged, 0)} %${v.fault === 1 ? (ar ? " (نوبة زائدة)" : " (surge)") : ""}`,
      },
      {
        label: ar ? "معدل النبض" : "Heart rate",
        expr: `HR = 60 + 105 × E^0.9${v.oxygen < 94 ? " + O₂" : ""} = ${f(p.hr, 0)} bpm`,
      },
      {
        label: ar ? "الدم الخارج من القلب" : "Cardiac output",
        expr: `CO = ${f(p.hr, 0)} × ${f(p.strokeVolume, 0)} ÷ 1000 = ${f(p.output)} L/min`,
      },
      {
        label: ar ? "الواصل للمخ" : "Delivered to the brain",
        expr: `${f(p.brainFlow, 0)} mL/min × (${f(v.oxygen, 0)}/98)³ → ${f(p.delivery * 100, 0)} %`,
      },
      {
        label: ar ? "استجابة المخ" : "Brain response",
        expr: `B = ${f(p.brain, 0)} %`,
      },
    ];
  },
  layers: [
    ...commonLayers,
    { id: "brain", label: { ar: "نشاط المخ", en: "Brain activity" }, default: true },
    { id: "signals", label: { ar: "الإشارات الكيميائية", en: "Chemical signals" }, default: false },
  ],
};
export const extras: Record<SimulationId, SimExtras> = {
  ohm: ohmExtras,
  "reaction-rate": chemExtras,
  diffusion: bioExtras,
  adrenaline: adrenalineExtras,
};

export function defaultLayers(simId: SimulationId): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const layer of extras[simId].layers) out[layer.id] = layer.default;
  return out;
}

/** Default layers plus the lesson preset's layers (ids the simulation doesn't define are ignored). */
export function lessonLayers(simId: SimulationId, preset?: SimPreset): Record<string, boolean> {
  const out = defaultLayers(simId);
  for (const id of preset?.layers ?? []) if (id in out) out[id] = true;
  return out;
}
