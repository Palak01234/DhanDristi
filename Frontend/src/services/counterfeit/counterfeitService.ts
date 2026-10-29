import type { CurrencyCode } from "@/constants/currencies";
import type { CounterfeitResult, SecurityCheck, CheckResult } from "@/types";

// ─── Per-currency security feature definitions ────────────────────────────────

export type CheckDef = { id: string; label: string; description: string };

export const CHECKS: Record<string, CheckDef[]> = {
  INR: [
    { id: "watermark",   label: "Gandhi Watermark",     description: "Portrait watermark visible when held to light" },
    { id: "thread",      label: "Security Thread",       description: "Windowed thread with 'भारत' and 'RBI' text" },
    { id: "ink",         label: "Color-Shifting Ink",    description: "Numeral shifts green → blue when tilted" },
    { id: "micro",       label: "Microprinting",         description: "'भारत' / 'India' microprint along security thread" },
    { id: "serial",      label: "Serial Number",         description: "Ascending font-size serial number format" },
    { id: "uv",          label: "UV Fluorescence",       description: "Embedded security fibres fluoresce under UV" },
    { id: "intaglio",    label: "Intaglio Printing",     description: "Raised print on portrait, RBI seal, Ashoka Pillar" },
  ],
  USD: [
    { id: "watermark",   label: "Portrait Watermark",    description: "Embedded watermark aligns with printed portrait" },
    { id: "thread",      label: "Security Thread",        description: "Embedded polyester thread shifts pink under UV" },
    { id: "ink",         label: "Color-Shifting Ink",    description: "Bell-in-inkwell numeral shifts copper → green" },
    { id: "ribbon",      label: "3-D Security Ribbon",   description: "Blue woven ribbon with shifting bells and 100s" },
    { id: "serial",      label: "Serial Number",         description: "Two unique serial numbers in green ink" },
    { id: "micro",       label: "Microprinting",         description: "Collar text reads 'THE UNITED STATES OF AMERICA'" },
    { id: "intaglio",    label: "Raised Print",          description: "Tactile feel on portrait, borders, and lettering" },
  ],
  EUR: [
    { id: "hologram",    label: "Hologram Strip",        description: "Gold stripe with € symbol, architectural motifs" },
    { id: "emerald",     label: "Emerald Number",        description: "Shimmering light effect in numeral when tilted" },
    { id: "thread",      label: "Security Thread",       description: "Embedded thread with 'EURO' and € symbol" },
    { id: "watermark",   label: "Watermark",             description: "Portrait and architectural watermark" },
    { id: "ink",         label: "UV Ink",                description: "EU stars, map, ECB initials fluoresce under UV" },
    { id: "micro",       label: "Microprinting",         description: "Tiny 'EURO€' printed along edge and on the bridge" },
    { id: "intaglio",    label: "Raised Print",          description: "Intaglio printing on main image, large value" },
  ],
  GBP: [
    { id: "hologram",    label: "Hologram",              description: "Foil patch or hologram with multiple images" },
    { id: "watermark",   label: "Watermark",             description: "Monarch portrait watermark in paper" },
    { id: "thread",      label: "Security Thread",       description: "Embedded metallic strip shifts colour" },
    { id: "ink",         label: "UV Features",           description: "UV details on denomination and 'Bank of England'" },
    { id: "micro",       label: "Microprinting",         description: "Fine microtext below portrait" },
    { id: "serial",      label: "Serial Number",         description: "Unique serial number in two fonts" },
    { id: "intaglio",    label: "Raised Print",          description: "Raised print on portrait and denomination" },
  ],
  PHP: [
    { id: "watermark",   label: "Watermark",             description: "Portrait and BSP seal watermark" },
    { id: "thread",      label: "Security Thread",       description: "Metallic thread with 'BSP' microtext" },
    { id: "ink",         label: "Optically Variable Ink","description": "Numeral changes colour when tilted" },
    { id: "micro",       label: "Microprinting",         description: "Fine text along borders" },
    { id: "serial",      label: "Serial Number",         description: "BSP serial number format" },
    { id: "uv",          label: "UV Features",           description: "UV fibres and ink fluoresce under ultraviolet" },
    { id: "intaglio",    label: "Intaglio Printing",     description: "Raised print on portrait and numerals" },
  ],
};

// ─── Multilingual check labels (Kannada + Hindi) ─────────────────────────────

/** Kannada translations keyed by check ID */
const KN_LABELS: Record<string, string> = {
  watermark: "ವಾಟರ್‌ಮಾರ್ಕ್",
  thread:    "ಭದ್ರತಾ ದಾರ",
  ink:       "ಬಣ್ಣ ಬದಲಾಗುವ ಶಾಯಿ",
  ribbon:    "ಭದ್ರತಾ ರಿಬ್ಬನ್",
  hologram:  "ಹೋಲೋಗ್ರಾಮ್",
  emerald:   "ಎಮರಲ್ಡ್ ಸಂಖ್ಯೆ",
  micro:     "ಮೈಕ್ರೋಪ್ರಿಂಟಿಂಗ್",
  serial:    "ಸರಣಿ ಸಂಖ್ಯೆ",
  uv:        "ಯೂವಿ ಪ್ರತಿದೀಪ್ತಿ",
  intaglio:  "ಎತ್ತರಿಸಿದ ಮುದ್ರಣ",
  paper:     "ಭದ್ರತಾ ಕಾಗದ",
};

/** Hindi translations keyed by check ID */
const HI_LABELS: Record<string, string> = {
  watermark: "वॉटरमार्क",
  thread:    "सुरक्षा धागा",
  ink:       "रंग बदलने वाली स्याही",
  ribbon:    "सुरक्षा रिबन",
  hologram:  "होलोग्राम",
  emerald:   "पन्ना संख्या",
  micro:     "माइक्रोप्रिंटिंग",
  serial:    "क्रम संख्या",
  uv:        "यूवी प्रतिदीप्ति",
  intaglio:  "उभरी हुई छपाई",
  paper:     "सुरक्षा कागज",
};

/**
 * Returns the localised label for a check feature.
 * Falls back to English if the language or translation is not available.
 * @param checkId  The check feature ID (e.g. "watermark", "thread").
 * @param lang     BCP-47 language code from voice settings (e.g. "kn-IN", "hi-IN", "en-IN").
 * @param fallback The default English label to return when no translation exists.
 */
export function getLocalizedLabel(checkId: string, lang: string, fallback: string): string {
  const base = lang.split("-")[0].toLowerCase();
  if (base === "kn") return KN_LABELS[checkId] ?? fallback;
  if (base === "hi") return HI_LABELS[checkId] ?? fallback;
  return fallback;
}

// Fallback for any unsupported currency
export const DEFAULT_CHECKS: CheckDef[] = [
  { id: "watermark",   label: "Watermark",             description: "Security watermark when held to light" },
  { id: "thread",      label: "Security Thread",       description: "Embedded or windowed security thread" },
  { id: "ink",         label: "Special Inks",          description: "UV or colour-shifting security inks" },
  { id: "micro",       label: "Microprinting",         description: "Fine microprint text along edges" },
  { id: "serial",      label: "Serial Number",         description: "Official serial number format" },
  { id: "paper",       label: "Security Paper",        description: "Correct weight and feel of official paper" },
  { id: "intaglio",    label: "Raised Print",          description: "Intaglio printing creates tactile texture" },
];

// ─── Mock analysis ────────────────────────────────────────────────────────────

function randomCheck(authentic: boolean): { result: CheckResult; confidence: number } {
  if (authentic) {
    return { result: "pass", confidence: 0.86 + Math.random() * 0.13 };
  }
  const r = Math.random();
  if (r < 0.68) return { result: "pass",      confidence: 0.78 + Math.random() * 0.18 };
  if (r < 0.88) return { result: "uncertain", confidence: 0.42 + Math.random() * 0.26 };
  return          { result: "fail",      confidence: 0.18 + Math.random() * 0.28 };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function runCounterfeitCheck(
  currency: CurrencyCode,
  denomination: number,
): Promise<CounterfeitResult> {
  const start = Date.now();
  // Simulate neural-network inference time
  await new Promise((r) => setTimeout(r, 2400));

  const defs = CHECKS[currency] ?? DEFAULT_CHECKS;

  // Demo: most notes are authentic; ~10% chance of suspicious result for demo purposes
  const scenario = Math.random() < 0.1 ? "suspicious" : "authentic";
  const isAuthentic = scenario === "authentic";

  const checks: SecurityCheck[] = defs.map((def) => {
    const { result, confidence } = randomCheck(isAuthentic);
    return { ...def, result, confidence };
  });

  const passes    = checks.filter((c) => c.result === "pass").length;
  const fails     = checks.filter((c) => c.result === "fail").length;
  const total     = checks.length;

  let verdict: CounterfeitResult["verdict"];
  let overallConfidence: number;

  if (fails >= 2 || passes < total * 0.4) {
    verdict = "counterfeit";
    overallConfidence = 0.28 + Math.random() * 0.22;
  } else if (fails === 1 || passes < total * 0.72) {
    verdict = "suspicious";
    overallConfidence = 0.52 + Math.random() * 0.22;
  } else {
    verdict = "authentic";
    overallConfidence = 0.84 + Math.random() * 0.15;
  }

  return { verdict, overallConfidence, checks, currency, denomination, elapsedMs: Date.now() - start };
}