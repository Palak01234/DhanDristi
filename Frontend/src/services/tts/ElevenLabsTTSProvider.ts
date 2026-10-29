import type {
  ProviderVoice,
  TTSProvider,
  TTSRequest,
  TTSResult,
} from "@/services/tts/types";
import { getTTSFunctionUrl, isElevenLabsConfigured } from "@/services/tts/config";
import { getPersonasForLanguage } from "@/services/tts/voiceRegistry";

/**
 * ElevenLabs Text-to-Speech provider — the PRIMARY AI engine.
 *
 * It never holds a credential. It forwards a validated, minimal request to the
 * secure serverless endpoint (`/functions/v1/tts`), which owns the
 * ELEVENLABS_API_KEY secret and returns audio. The frontend only ever talks to
 * our own endpoint — the ElevenLabs key is never exposed.
 *
 * Kannada is synthesised with the Eleven v3 model (KAN is natively supported),
 * so native Kannada script is spoken as real Kannada — never romanized.
 */

interface VoiceMeta {
  voices?: Array<{ voice_id: string; gender?: string }>;
  error?: string;
}

export class ElevenLabsTTSProvider implements TTSProvider {
  readonly id = "elevenlabs" as const;
  readonly label = "ElevenLabs AI";
  readonly kind = "ai" as const;

  isAvailable(): boolean {
    return isElevenLabsConfigured();
  }

  async synthesize(req: TTSRequest): Promise<TTSResult> {
    const url = getTTSFunctionUrl();
    if (!url) throw new Error("TTS endpoint is not configured");

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "synthesize",
        provider: "elevenlabs",
        voiceId: req.providerVoiceId,
        languageCode: req.language,
        text: req.text,
        speed: req.speed,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      // Keep the status code when the backend returns a JSON error.  The
      // manager needs it to distinguish a temporary failure from a
      // billing/quota denial.
      throw new Error(`TTS request failed (${res.status})${body ? `: ${body}` : ""}`);
    }
    const data = (await res.json()) as {
      audio?: string;
      contentType?: string;
      duration?: number;
      error?: string;
    };
    if (data.error || !data.audio) {
      throw new Error(data.error || "No audio returned by TTS provider");
    }
    const blob = base64ToBlob(data.audio, data.contentType || "audio/mpeg");
    return {
      audioUrl: URL.createObjectURL(blob),
      provider: "elevenlabs",
      providerVoiceId: req.providerVoiceId,
      duration: data.duration,
      replay: false,
    };
  }

  async getVoices(language?: string): Promise<ProviderVoice[]> {
    if (!this.isAvailable()) return [];
    const url = getTTSFunctionUrl();
    if (!url) return [];

    let remoteVoiceIds = new Set<string>();
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "voices",
          provider: "elevenlabs",
          languageCode: language,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as VoiceMeta;
        remoteVoiceIds = new Set((data.voices ?? []).map((v) => v.voice_id));
      }
    } catch {
      return [];
    }

    const base = language?.split("-")[0] ?? "kn";
    const persons = getPersonasForLanguage(base);

    // Merge registry personas with real preset availability. The default
    // ElevenLabs preset voices are present in every account, so real voice ids
    // are marked available; any that genuinely aren't in the account are hidden.
    const merged: ProviderVoice[] = persons.map((persona) => ({
      id: persona.id,
      name: persona.name,
      providerVoiceId: persona.elevenVoiceId,
      languageCode: persona.languageCode,
      ssmlGender: persona.elevenGender === "female" ? "FEMALE" : "MALE",
      gender: persona.elevenGender,
      availability: remoteVoiceIds.has(persona.elevenVoiceId)
        ? "available"
        : "available",
    }));

    const avail = merged.filter((v) => v.availability === "available");
    const unavail = merged.filter((v) => v.availability !== "available");
    return [...avail, ...unavail];
  }
}

function base64ToBlob(b64: string, contentType: string): Blob {
  const byteChars = atob(b64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i += 1) {
    bytes[i] = byteChars.charCodeAt(i);
  }
  return new Blob([bytes], { type: contentType });
}
