import type { DetectionResult } from "@/types";
import type { CurrencyCode } from "@/constants/currencies";

/**
 * Detection-result announcements — multilingual and native-first.
 *
 * The announcement text is produced in the user's selected voice language,
 * in that language's native script. Kannada text stays as Kannada; it is never
 * silently converted to romanized (English-style) form.
 *
 * The only case where romanized text is produced is the explicit, opt-in
 * "Romanized fallback" setting, and only when the active provider is the
 * device fallback AND the device cannot natively speak Kannada.
 */

export interface ResultSpeechPieces {
  text: string;
  /** Language tag to announce in (native script for the selected language). */
  lang: string;
}

type Kind = "low_confidence" | "counterfeit" | "wrong_currency" | "error" | "multiple" | "single" | "none";

interface Tokens {
  kind: Kind;
  code: string;
  denom: string;
  conf: string;
  count: string;
  total: string;
}

function extract(result: DetectionResult): Tokens {
  const base: Tokens = { kind: "none", code: "", denom: "", conf: "", count: "", total: "" };
  if (result.counterfeitSuspected && result.currencies[0]) {
    const note = result.currencies[0];
    return { ...base, kind: "counterfeit", code: note.currency, denom: String(note.denomination), conf: String(Math.round(note.confidence * 100)) };
  }
  if (result.status === "low_confidence" && result.currencies[0]) {
    const note = result.currencies[0];
    return { ...base, kind: "low_confidence", code: note.currency, denom: String(note.denomination), conf: String(Math.round(note.confidence * 100)) };
  }
  if (result.status === "wrong_currency") {
    return { ...base, kind: "wrong_currency" };
  }
  if (result.status === "error") {
    return { ...base, kind: "error" };
  }
  if (result.currencies.length > 1) {
    return {
      ...base,
      kind: "multiple",
      count: String(result.currencies.length),
      code: result.currencies[0]?.currency ?? "",
      total: String(result.total ?? result.currencies.reduce((s, n) => s + n.denomination, 0)),
    };
  }
  if (result.currencies.length === 1) {
    const note = result.currencies[0];
    return { ...base, kind: "single", code: note.currency, denom: String(note.denomination), conf: String(Math.round(note.confidence * 100)) };
  }
  return base;
}

type PhraseMap = Record<Kind, (t: Tokens) => string>;

const MAPS: Record<string, PhraseMap> = {
  en: {
    low_confidence: (t) =>
      `Detection uncertain. Possibly ${t.code} ${t.denom}, but confidence is low. Please try again in better light.`,
    counterfeit: (t) => `Warning. The ${t.code} ${t.denom} note may be counterfeit. Please verify its security features.`,
    wrong_currency: () => "Attention. This appears to be a different currency. Please check again.",
    error: () => "Sorry, there was an error recognizing the currency. Please try again.",
    multiple: (t) => `Detected ${t.count} notes. Total ${t.code} ${t.total}.`,
    single: (t) => `Successful detection. ${t.code} ${t.denom}.`,
    none: () => "No currency detected.",
  },
  kn: {
    low_confidence: (t) =>
      `ಪತ್ತೆ ಖಚಿತವಾಗಿಲ್ಲ. ಬಹುಶಃ ${knAmount(t.code, t.denom)}, ಆದರೆ ವಿಶ್ವಾಸ ಕಡಿಮೆ. ಚೆನ್ನಾಗಿ ಬೆಳಕಿನಲ್ಲಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.`,
    counterfeit: (t) => `ಎಚ್ಚರಿಕೆ. ${knAmount(t.code, t.denom)} ನೋಟು ನಕಲಿ ಆಗಿರಬಹುದು. ದಯವಿಟ್ಟು ಭದ್ರತಾ ಲಕ್ಷಣಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.`,
    wrong_currency: () => "ಗಮನ. ಇದು ಬೇರೆ ಕರೆನ್ಸಿಯಾಗಿ ಕಾಣುತ್ತಿದೆ. ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ.",
    error: () => "ಕ್ಷಮಿಸಿ. ಕರೆನ್ಸಿ ಗುರುತಿಸುವಲ್ಲಿ ದೋಷವಾಗಿದೆ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    multiple: (t) => `${t.count} ನೋಟು ಪತ್ತೆಯಾಗಿವೆ. ಒಟ್ಟು ${t.code} ${t.total}.`,
    single: (t) => `ಯಶಸ್ವಿ ಪತ್ತೆ. ${knAmount(t.code, t.denom)} ಪತ್ತೆಯಾಗಿದೆ.`,
    none: () => "ಯಾವುದೇ ಕರೆನ್ಸಿ ಪತ್ತೆಯಾಗಿಲ್ಲ.",
  },
  hi: {
    low_confidence: (t) =>
      `पहचान अनिश्चित है। संभवतः ${t.code} ${t.denom}, लेकिन विश्वास कम है। कृपया अच्छी रोशनी में फिर प्रयास करें।`,
    counterfeit: (t) => `चेतावनी। ${t.code} ${t.denom} का नोट नकली हो सकता है। कृपया सुरक्षा विशेषताओं की जाँच करें।`,
    wrong_currency: () => "ध्यान दें। यह एक अलग मुद्रा प्रतीत होती है। कृपया फिर जाँचें।",
    error: () => "माफ़ कीजिए। मुद्रा पहचान में त्रुटि हुई। कृपया फिर प्रयास करें।",
    multiple: (t) => `${t.count} नोट मिले। कुल ${t.code} ${t.total}.`,
    single: (t) => `सफल पहचान। ${t.code} ${t.denom}.`,
    none: () => "कोई मुद्रा नहीं मिली।",
  },
  te: {
    low_confidence: (t) =>
      `గుర్తింపు అనిశ్చితం. బహుశా ${t.code} ${t.denom}, కానీ విశ్వాసం తక్కువ. దయచేసి మంచి వెలుతురులో మళ్ళీ ప్రయత్నించండి.`,
    counterfeit: (t) => `హెచ్చరిక. ${t.code} ${t.denom} నోటు నకిలీ కావచ్చు. దయచేసి భద్రతా లక్షణాలను పరిశీలించండి.`,
    wrong_currency: () => "శ్రద్ధ. ఇది వేరే కరెన్సీలా కనిపిస్తోంది. దయచేసి మళ్ళీ పరిశీలించండి.",
    error: () => "క్షమించండి. కరెన్సీ గుర్తింపులో లోపం ఏర్పడింది. మళ్ళీ ప్రయత్నించండి.",
    multiple: (t) => `${t.count} నోట్లు గుర్తించబడ్డాయి. మొత్తం ${t.code} ${t.total}.`,
    single: (t) => `విజయవంతమైన గుర్తింపు. ${t.code} ${t.denom}.`,
    none: () => "ఎటువంటి కరెన్సీ గుర్తించబడలేదు.",
  },
  ta: {
    low_confidence: (t) =>
      `அடையாளம் உறுதியாக இல்லை. ஒருவேளை ${t.code} ${t.denom}, ஆனால் நம்பிக்கை குறைவு. சிறந்த ஒளியில் மீண்டும் முயற்சிக்கவும்.`,
    counterfeit: (t) => `எச்சரிக்கை. ${t.code} ${t.denom} நோட்டு கள்ளநோட்டாக இருக்கலாம். பாதுகாப்பு அம்சங்களைச் சரிபார்க்கவும்.`,
    wrong_currency: () => "கவனம். இது வேறு நாணயமாகத் தெரிகிறது. மீண்டும் சரிபார்க்கவும்.",
    error: () => "மன்னிக்கவும். நாணயத்தை அடையாளம் காண்பதில் பிழை. மீண்டும் முயற்சிக்கவும்.",
    multiple: (t) => `${t.count} பணத்தாள்கள் கண்டறியப்பட்டன. மொத்தம் ${t.code} ${t.total}.`,
    single: (t) => `வெற்றிகரமான கண்டறிதல். ${t.code} ${t.denom}.`,
    none: () => "எந்த நாணயமும் கண்டறியப்படவில்லை.",
  },
  ml: {
    low_confidence: (t) =>
      `തിരിച്ചറിയൽ ഉറപ്പില്ല. ഒരുപക്ഷേ ${t.code} ${t.denom}, പക്ഷേ വിശ്വാസം കുറവാണ്. നല്ല വെളിച്ചത്തിൽ വീണ്ടും ശ്രമിക്കുക.`,
    counterfeit: (t) => `മുന്നറിയിപ്പ്. ${t.code} ${t.denom} നോട്ട് കള്ളനോട്ടായിരിക്കാം. സുരക്ഷാ സവിശേഷതകൾ പരിശോധിക്കുക.`,
    wrong_currency: () => "ശ്രദ്ധ. ഇത് മറ്റൊരു കറൻസിയായി കാണപ്പെടുന്നു. വീണ്ടും പരിശോധിക്കുക.",
    error: () => "ക്ഷമിക്കണം. കറൻസി തിരിച്ചറിയുന്നതിൽ പിശക്. വീണ്ടും ശ്രമിക്കുക.",
    multiple: (t) => `${t.count} നോട്ടുകൾ കണ്ടെത്തി. ആകെ ${t.code} ${t.total}.`,
    single: (t) => `വിജയകരമായ കണ്ടെത്തൽ. ${t.code} ${t.denom}.`,
    none: () => "കറൻസി കണ്ടെത്തിയില്ല.",
  },
  mr: {
    low_confidence: (t) =>
      `ओळख निश्चित नाही. कदाचित ${t.code} ${t.denom}, पण विश्वास कमी आहे. चांगल्या प्रकाशात पुन्हा प्रयत्न करा.`,
    counterfeit: (t) => `इशारा. ${t.code} ${t.denom} ची नोट बनावट असू शकते. कृपया सुरक्षा वैशिष्ट्ये तपासा.`,
    wrong_currency: () => "लक्ष द्या. हे वेगळे चलन दिसते. पुन्हा तपासा.",
    error: () => "माफ करा. चलन ओळखण्यात त्रुटी. पुन्हा प्रयत्न करा.",
    multiple: (t) => `${t.count} नोटा सापडल्या. एकूण ${t.code} ${t.total}.`,
    single: (t) => `यशस्वी ओळख. ${t.code} ${t.denom}.`,
    none: () => "चलन सापडले नाही.",
  },
};

const ROMAN_KN: PhraseMap = {
  low_confidence: (t) =>
    `Patte khachitavagilla. Bahusha ${t.code} ${t.denom}, aadare vishwaasa kadime. Chennagi belakinali matte prayatnisi.`,
  counterfeit: (t) => `Eccharike. ${t.code} ${t.denom} notu nakali agirabahudu. Bhadrata lakshanagalannu parisheelisi.`,
  wrong_currency: () => "Gamana. Idu bere karensiyaagi kaanutide. Matte parisheelisi.",
  error: () => "Kshamisi. Karensi gurutisuvalu doshavagide. Matte prayatnisi.",
  multiple: (t) => `${t.count} notu patteyagive. Ottu ${t.code} ${t.total}.`,
  single: (t) => `Yashasvi patte. ${t.code} ${t.denom}.`,
  none: () => "Yaavude karensi patteyagilla.",
};

export interface BuildSpeechOptions {
  /** Selected voice language code, e.g. "kn-IN". */
  lang: string;
  /** Whether a native Kannada voice is available. */
  hasKannadaEngine: boolean;
  /** User opted-in romanized Kannada fallback (device path only). */
  allowRomanized?: boolean;
}

export function buildResultSpeechForVoice(
  result: DetectionResult,
  opts: BuildSpeechOptions | string,
  hasKannadaEngine?: boolean,
  allowRomanized?: boolean,
): ResultSpeechPieces {
  const normalized: BuildSpeechOptions =
    typeof opts === "string"
      ? { lang: opts, hasKannadaEngine: hasKannadaEngine ?? true, allowRomanized }
      : opts;

  const t = extract(result);
  const base = (normalized.lang || "").toLowerCase().split("-")[0];

  if (base === "kn") {
    const canSpeakNative = normalized.hasKannadaEngine;
    if (canSpeakNative) return { text: render(MAPS.kn, t), lang: "kn-IN" };
    // Only romanize when the user explicitly opted in.
    if (normalized.allowRomanized) return { text: render(ROMAN_KN, t), lang: "en-IN" };
    // Otherwise keep native script so an AI backend (or future native engine) can speak it.
    return { text: render(MAPS.kn, t), lang: "kn-IN" };
  }

  const map = MAPS[base] ?? MAPS.en;
  return { text: render(map, t), lang: base === "en" ? "en-IN" : `${base}-IN` };
}

function render(map: PhraseMap, t: Tokens): string {
  return map[t.kind](t);
}

/** English-only announcement (kept for consumers needing plain text). */
export function buildResultSpeech(result: DetectionResult): string {
  return buildResultSpeechForVoice(result, { lang: "en-IN", hasKannadaEngine: true }).text;
}

export function buildConversionSpeechForVoice(
  from: CurrencyCode,
  amount: number,
  to: CurrencyCode,
  convertedAmount: number,
  lang: string,
): ResultSpeechPieces {
  const source = formatSpeechAmount(amount);
  const converted = formatSpeechAmount(convertedAmount);
  const base = (lang || "en-IN").toLowerCase().split("-")[0];
  const phrases: Record<string, string> = {
    en: `${source} ${from} equals ${converted} ${to}.`,
    kn: `${knAmount(from, String(amount))} ಮೊತ್ತವು ${knAmount(to, formatSpeechAmount(convertedAmount))} ಗೆ ಸಮನಾಗಿದೆ.`,
    hi: `${source} ${from} के बराबर ${converted} ${to} है।`,
    te: `${source} ${from} కు ${converted} ${to} సమానం.`,
    ta: `${source} ${from} என்பது ${converted} ${to} க்கு சமம்.`,
    ml: `${source} ${from} എന്നത് ${converted} ${to} ന് തുല്യമാണ്.`,
    mr: `${source} ${from} म्हणजे ${converted} ${to}.`,
  };
  return {
    text: phrases[base] ?? phrases.en,
    lang: base === "en" ? "en-IN" : `${base}-IN`,
  };
}

function formatSpeechAmount(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

const KN_CURRENCY_NAMES: Record<CurrencyCode, string> = {
  INR: "ಭಾರತೀಯ ರೂಪಾಯಿ",
  USD: "ಅಮೆರಿಕನ್ ಡಾಲರ್",
  PHP: "ಫಿಲಿಪ್ಪೀನ್ಸ್ ಪೆಸೊ",
  EUR: "ಯೂರೋ",
  AUD: "ಆಸ್ಟ್ರೇಲಿಯನ್ ಡಾಲರ್",
  CAD: "ಕೆನಡಿಯನ್ ಡಾಲರ್",
};

const KN_DIGITS = ["ಸೊನ್ನೆ", "ಒಂದು", "ಎರಡು", "ಮೂರು", "ನಾಲ್ಕು", "ಐದು", "ಆರು", "ಏಳು", "ಎಂಟು", "ಒಂಬತ್ತು"];
const KN_SMALL_NUMBERS = [
  "ಸೊನ್ನೆ", "ಒಂದು", "ಎರಡು", "ಮೂರು", "ನಾಲ್ಕು", "ಐದು", "ಆರು", "ಏಳು", "ಎಂಟು", "ಒಂಬತ್ತು",
  "ಹತ್ತು", "ಹನ್ನೊಂದು", "ಹನ್ನೆರಡು", "ಹದಿಮೂರು", "ಹದಿನಾಲ್ಕು", "ಹದಿನೈದು", "ಹದಿನಾರು", "ಹದಿನೇಳು",
  "ಹದಿನೆಂಟು", "ಹತ್ತೊಂಬತ್ತು",
];

function knAmount(code: string, value: string): string {
  const numeric = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return `${KN_CURRENCY_NAMES[code as CurrencyCode] ?? code} ${value}`;
  const whole = Math.floor(numeric);
  const fraction = Math.round((numeric - whole) * 100);
  const numberText = knNumber(whole) + (fraction ? ` ಪಾಯಿಂಟ್ ${String(fraction).split("").map((d) => KN_DIGITS[Number(d)]).join(" ")}` : "");
  return `${numberText} ${KN_CURRENCY_NAMES[code as CurrencyCode] ?? code}`;
}

function knNumber(value: number): string {
  if (value < 20) return KN_SMALL_NUMBERS[value] ?? String(value);
  if (value < 100) {
    const tens = ["", "", "ಇಪ್ಪತ್ತು", "ಮೂವತ್ತು", "ನಲವತ್ತು", "ಐವತ್ತು", "ಅರವತ್ತು", "ಎಪ್ಪತ್ತು", "ಎಂಬತ್ತು", "ತೊಂಬತ್ತು"];
    return tens[Math.floor(value / 10)] + (value % 10 ? ` ${KN_DIGITS[value % 10]}` : "");
  }
  if (value < 1000) return `${KN_DIGITS[Math.floor(value / 100)]} ನೂರು${value % 100 ? ` ${knNumber(value % 100)}` : ""}`;
  if (value < 100000) return `${knNumber(Math.floor(value / 1000))} ಸಾವಿರ${value % 1000 ? ` ${knNumber(value % 1000)}` : ""}`;
  if (value < 10000000) return `${knNumber(Math.floor(value / 100000))} ಲಕ್ಷ${value % 100000 ? ` ${knNumber(value % 100000)}` : ""}`;
  return String(value);
}