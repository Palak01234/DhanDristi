/**
 * TTS provider configuration.
 *
 * API credentials are NEVER stored in frontend source. The AI TTS providers
 * route audio requests through a secure serverless endpoint (Readdy Backend
 * Edge Function) that holds the real secret. The frontend only knows the
 * public function URL, derived from the connected backend project URL.
 *
 * ElevenLabs is the only active voice engine.
 */

function env(): {
  supabaseUrl: string;
  ttsEndpoint: string;
  elevenEnabled: string;
} {
  return {
    supabaseUrl:
      (import.meta.env.VITE_PUBLIC_SUPABASE_URL as string | undefined) ?? "",
    ttsEndpoint:
      (import.meta.env.VITE_PUBLIC_TTS_ENDPOINT as string | undefined) ?? "",
    elevenEnabled:
      (import.meta.env.VITE_PUBLIC_ELEVENLABS_TTS_ENABLED as string | undefined) ?? "",
  };
}

/** Public URL of the secure TTS edge function. */
export function getTTSFunctionUrl(): string {
  const e = env();
  if (e.ttsEndpoint) return e.ttsEndpoint;
  return apiUrl("/api/tts");
}

/** Whether ElevenLabs AI TTS is enabled (backend + key configured + not opted out). */
export function isElevenLabsConfigured(): boolean {
  const e = env();
  const url = getTTSFunctionUrl();
  if (!url) return false;
  if (e.elevenEnabled === "false") return false;
  return true;
}

export function getSupabaseUrl(): string {
  return env().supabaseUrl;
}
import { apiUrl } from "@/services/api";
