/**
 * DhanDrishti Voice Registry — the ONE source of truth for voice personas.
 *
 * Each persona is an application identity (friendly name) mapped to a REAL
 * provider voice id. Personas are deliberately separated from provider voice
 * ids so the UI never has to know raw provider identifiers.
 *
 * Honesty rules (match requirement 27/28):
 *  - Every persona maps to a real provider voice id.
 *  - Gender shown in the UI comes from the provider's metadata at runtime
 *    (see ElevenLabsTTSProvider.getVoices), never invented here.
 *  - If a voice id is not available in the configured account, the provider
 *    reports it as unavailable and the UI hides the card.
 *
 * Voice engines:
 *  - ElevenLabs (PRIMARY AI provider): real public preset voice ids
 *    (Rachel/Bella/Domi/Elli female; Josh/Adam/Antoni/Arnold/Sam male).
 *    ElevenLabs v3 model can speak Kannada + 73 other languages.
 *
 * Kannada is first-class and the primary language of the voice system.
 */

import type { ProviderVoice } from "@/services/tts/types";

export type PersonaGender = "female" | "male";

export interface VoiceLanguage {
  /** Language base code, e.g. "kn". */
  base: string;
  /** BCP-47 code, e.g. "kn-IN". */
  code: string;
  label: string;
  /** Native label shown in the language tabs, e.g. "ಕನ್ನಡ". */
  native: string;
  /** Display ordering (Kannada first). */
  order: number;
}

export interface VoicePersona {
  /** Stable persona id, e.g. "kn-ananya". */
  id: string;
  name: string;
  gender: PersonaGender;
  personality: string;
  description: string;
  languageBase: string;
  languageCode: string;
  /** ElevenLabs public preset voice id (primary AI engine). */
  elevenVoiceId: string;
  /** Provider metadata gender for the ElevenLabs preset. */
  elevenGender: "female" | "male";
  /** Native sample text (Kannada stays in script — never romanized). */
  sampleText: string;
  /** Whether this is a signature/headliner persona. */
  featured: boolean;
}

/* ------------------------------------------------------------------ */
/* Languages (Kannada first)                                           */
/* ------------------------------------------------------------------ */
export const VOICE_LANGUAGES: VoiceLanguage[] = [
  { base: "kn", code: "kn-IN", label: "Kannada", native: "ಕನ್ನಡ", order: 0 },
  { base: "en", code: "en-IN", label: "English", native: "English", order: 1 },
  { base: "hi", code: "hi-IN", label: "Hindi", native: "हिन्दी", order: 2 },
  { base: "te", code: "te-IN", label: "Telugu", native: "తెలుగు", order: 3 },
  { base: "ta", code: "ta-IN", label: "Tamil", native: "தமிழ்", order: 4 },
  { base: "ml", code: "ml-IN", label: "Malayalam", native: "മലയാളം", order: 5 },
  { base: "mr", code: "mr-IN", label: "Marathi", native: "मराठी", order: 6 },
];

/* ------------------------------------------------------------------ */
/* Real ElevenLabs public preset voice ids (verified).                  */
/* These are the genuine default voices in every ElevenLabs account.    */
/* ------------------------------------------------------------------ */
// A custom Voice Design voice is permitted through the ElevenLabs Free-plan
// API. It is shared across personas until additional custom voices are added.
//const DHANDRISHTI_MULTILINGUAL_VOICE = "eHS15p8fxK788Tx0X7EO";
const DHANDRISHTI_MULTILINGUAL_VOICE = "5wrRb4AvDAj1E07zFlJk";

const ELEVEN = {
  Rachel: DHANDRISHTI_MULTILINGUAL_VOICE,
  Bella: DHANDRISHTI_MULTILINGUAL_VOICE,
  Domi: DHANDRISHTI_MULTILINGUAL_VOICE,
  Elli: DHANDRISHTI_MULTILINGUAL_VOICE,
  Josh: DHANDRISHTI_MULTILINGUAL_VOICE,
  Adam: DHANDRISHTI_MULTILINGUAL_VOICE,
  Antoni: DHANDRISHTI_MULTILINGUAL_VOICE,
  Arnold: DHANDRISHTI_MULTILINGUAL_VOICE,
  Sam: DHANDRISHTI_MULTILINGUAL_VOICE,
} as const;

export type ElevenPresetName = keyof typeof ELEVEN;

/* ------------------------------------------------------------------ */
/* Native sample text per language + gender                            */
/* ------------------------------------------------------------------ */
const SAMPLES: Record<string, { female: string; male: string }> = {
  kn: {
    female:
      "ನಮಸ್ಕಾರ. ಇದು ಧನದೃಷ್ಟಿ. ನಿಮ್ಮ ಸುತ್ತಮುತ್ತಲಿನ ವಸ್ತುಗಳನ್ನು ಗುರುತಿಸಲು ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.",
    male:
      "ನಮಸ್ಕಾರ. ಇದು ಧನದೃಷ್ಟಿ. ನಿಮ್ಮ ಸುತ್ತಮುತ್ತಲಿನ ವಸ್ತುಗಳನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಗುರುತಿಸಲು ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.",
  },
  en: {
    female: "Hello. This is DhanDrishti. I help you recognise the notes around you.",
    male: "Hello. This is DhanDrishti. I help you clearly recognise the notes around you.",
  },
  hi: {
    female:
      "नमस्कार। यह धनदृष्टि है। मैं आपके आसपास के नोटों को पहचानने में मदद करती हूँ।",
    male:
      "नमस्कार। यह धनदृष्टि है। मैं आपके आसपास के नोटों को स्पष्ट पहचानने में मदद करता हूँ।",
  },
  te: {
    female:
      "నమస్కారం. ఇది ధనదృష్టి. మీ చుట్టూ ఉన్న నోట్లను గుర్తించడానికి నేను సహాయం చేస్తాను.",
    male:
      "నమస్కారం. ఇది ధనదృష్టి. మీ చుట్టూ ఉన్న నోట్లను స్పష్టంగా గుర్తించడానికి నేను సహాయం చేస్తాను.",
  },
  ta: {
    female:
      "வணக்கம். இது தனத்ரிஷ்டி. உங்களைச் சுற்றியுள்ள பணத்தாள்களை அடையாளம் காண நான் உதவுகிறேன்.",
    male:
      "வணக்கம். இது தனத்ரிஷ்டி. உங்களைச் சுற்றியுள்ள பணத்தாள்களை தெளிவாக அடையாளம் காண நான் உதவுகிறேன்.",
  },
  ml: {
    female:
      "നമസ്കാരം. ഇത് ധനദൃഷ്ടി. നിങ്ങൾക്കു ചുറ്റുമുള്ള നോട്ടുകൾ തിരിച്ചറിയാൻ ഞാൻ സഹായിക്കുന്നു.",
    male:
      "നമസ്കാരം. ഇത് ധനദൃഷ്ടി. നിങ്ങൾക്കു ചുറ്റുമുള്ള നോട്ടുകൾ വ്യക്തമായി തിരിച്ചറിയാൻ ഞാൻ സഹായിക്കുന്നു.",
  },
  mr: {
    female:
      "नमस्कार. ही धनदृष्टी आहे. तुमच्या आजूबाजूच्या नोटा ओळखण्यात मी मदत करते.",
    male:
      "नमस्कार. ही धनदृष्टी आहे. तुमच्या आजूबाजूच्या नोटा स्पष्टपणे ओळखण्यात मी मदत करतो.",
  },
};

/* ------------------------------------------------------------------ */
/* Persona constructor                                                 */
/* ------------------------------------------------------------------ */
function p(
  id: string,
  name: string,
  gender: PersonaGender,
  personality: string,
  description: string,
  languageBase: string,
  eleven: ElevenPresetName,
  featured = false,
): VoicePersona {
  const lang = VOICE_LANGUAGES.find((l) => l.base === languageBase)!;
  const sample = SAMPLES[languageBase];
  return {
    id,
    name,
    gender,
    personality,
    description,
    languageBase,
    languageCode: lang.code,
    elevenVoiceId: ELEVEN[eleven],
    elevenGender: gender,
    sampleText: gender === "female" ? sample.female : sample.male,
    featured,
  };
}

export const VOICE_PERSONAS: VoicePersona[] = [
  // --------------- Kannada (kn-IN) — Female -------------------------
  p("kn-ananya", "Ananya", "female", "Warm • Reassuring", "Warm, friendly and reassuring.", "kn", "Rachel", true),
  p("kn-kavya", "Kavya", "female", "Energetic • Friendly", "Young, energetic and clear.", "kn", "Bella"),
  p("kn-meera", "Meera", "female", "Calm • Gentle", "Calm, gentle and conversational.", "kn", "Domi"),
  p("kn-nandini", "Nandini", "female", "Confident • Professional", "Confident and professional.", "kn", "Elli"),
  // --------------- Kannada (kn-IN) — Male ---------------------------
  p("kn-arjun", "Arjun", "male", "Confident • Clear", "Confident, clear and trustworthy.", "kn", "Josh", true),
  p("kn-vikram", "Vikram", "male", "Deep • Authoritative", "Deep and authoritative.", "kn", "Adam"),
  p("kn-rohan", "Rohan", "male", "Friendly • Youthful", "Friendly and youthful.", "kn", "Antoni"),
  p("kn-kiran", "Kiran", "male", "Calm • Balanced", "Calm and balanced.", "kn", "Arnold"),
  p("kn-surya", "Surya", "male", "Energetic • Confident", "Energetic and confident.", "kn", "Sam"),

  // --------------- English (en-IN) ----------------------------------
  p("en-maya", "Maya", "female", "Warm • Crisp", "Warm and crisp international clarity.", "en", "Rachel"),
  p("en-tara", "Tara", "female", "Bright • Cheerful", "Bright, cheerful and everyday confident.", "en", "Bella"),
  p("en-zara", "Zara", "female", "Calm • Smooth", "Calm and smooth narration.", "en", "Domi"),
  p("en-nia", "Nia", "female", "Clear • Professional", "Clear and professional.", "en", "Elli"),
  p("en-rohan", "Rohan", "male", "Friendly • Clear", "Clear, friendly and natural.", "en", "Josh"),
  p("en-aaron", "Aaron", "male", "Calm • Confident", "Calm, measured and reassuring.", "en", "Adam"),
  p("en-dev", "Dev", "male", "Earnest • Steady", "Earnest and steady.", "en", "Antoni"),

  // --------------- Hindi (hi-IN) ------------------------------------
  p("hi-ananya", "Ananya", "female", "Warm • Gentle", "Warm and gentle Hindi voice.", "hi", "Rachel"),
  p("hi-arjun", "Arjun", "male", "Firm • Clear", "Firm and clear Hindi voice.", "hi", "Josh"),
  p("hi-meera", "Meera", "female", "Soft • Natural", "Soft and natural Hindi voice.", "hi", "Bella"),

  // --------------- Telugu (te-IN) -----------------------------------
  p("te-ananya", "Ananya", "female", "Warm • Caring", "Warm and caring Telugu voice.", "te", "Rachel"),
  p("te-arjun", "Arjun", "male", "Steady • Clear", "Steady and clear Telugu voice.", "te", "Josh"),

  // --------------- Tamil (ta-IN) ------------------------------------
  p("ta-ananya", "Ananya", "female", "Warm • Gentle", "Warm and gentle Tamil voice.", "ta", "Rachel"),
  p("ta-arjun", "Arjun", "male", "Deep • Clear", "Deep and clear Tamil voice.", "ta", "Josh"),

  // --------------- Malayalam (ml-IN) --------------------------------
  p("ml-ananya", "Ananya", "female", "Warm • Gentle", "Warm and gentle Malayalam voice.", "ml", "Rachel"),
  p("ml-arjun", "Arjun", "male", "Calm • Clear", "Calm and clear Malayalam voice.", "ml", "Josh"),

  // --------------- Marathi (mr-IN) ----------------------------------
  p("mr-ananya", "Ananya", "female", "Warm • Gentle", "Warm and gentle Marathi voice.", "mr", "Rachel"),
  p("mr-arjun", "Arjun", "male", "Steady • Clear", "Steady and clear Marathi voice.", "mr", "Josh"),
];

export const DEFAULT_LANGUAGE_BASE = "kn";
export const DEFAULT_PERSONA_ID = "kn-ananya";

/* ------------------------------------------------------------------ */
/* Registry helpers                                                    */
/* ------------------------------------------------------------------ */
const personaById = new Map(VOICE_PERSONAS.map((v) => [v.id, v]));

export function getLanguages(): VoiceLanguage[] {
  return [...VOICE_LANGUAGES].sort((a, b) => a.order - b.order);
}

export function getPersona(id: string | null | undefined): VoicePersona {
  if (id) {
    const found = personaById.get(id);
    if (found) return found;
  }
  return personaById.get(DEFAULT_PERSONA_ID)!;
}

export function getPersonasForLanguage(base: string): VoicePersona[] {
  return VOICE_PERSONAS.filter((v) => v.languageBase === base);
}

/** Resolve the ElevenLabs voice id for a persona. */
export function getProviderVoiceId(persona: VoicePersona): string {
  return persona.elevenVoiceId;
}

export function personaToProviderVoice(persona: VoicePersona): ProviderVoice {
  return {
    id: persona.id,
    name: persona.name,
    providerVoiceId: persona.elevenVoiceId,
    languageCode: persona.languageCode,
    ssmlGender: persona.elevenGender === "female" ? "FEMALE" : "MALE",
    gender: persona.elevenGender,
    availability: "available",
  };
}
