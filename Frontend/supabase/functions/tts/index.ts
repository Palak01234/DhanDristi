// DhanDrishti secure TTS edge function.
// Owns the ELEVENLABS_API_KEY (and optional Google credential) — never exposed
// to the frontend. Accepts only validated, minimal requests and returns audio.
// No credentials ever leak to the client.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ELEVEN_API = "https://api.elevenlabs.io/v1";
// Eleven v3 supports 70+ languages natively (Kannada = kan). It uses 3-letter
// ISO 639-3 language codes for the `language_code` field — NOT BCP-47 like
// "kn-IN". We translate from the app's BCP-47 codes below.
const ELEVEN_MODEL = "eleven_v3";

// Map our BCP-47 base codes (kn, en, hi, te, ta, ml, mr) to ElevenLabs v3
// ISO 639-3 language codes. If a code is unknown we omit language_code and let
// the v3 model auto-detect the language from the script text.
const ELEVEN_LANG: Record<string, string> = {
  kn: "kan", // Kannada
  en: "eng", // English
  hi: "hin", // Hindi
  te: "tel", // Telugu
  ta: "tam", // Tamil
  ml: "mal", // Malayalam
  mr: "mar", // Marathi
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getSupabaseClient() {
  const url = Deno.env.get("VITE_PUBLIC_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL") ?? "";
  return createClient(url, Deno.env.get("SUPABASE_ANON_KEY") ?? "anon");
}

interface SynthReq {
  action: "synthesize" | "voices" | "transcribe";
  provider: "elevenlabs" | "google";
  voiceId: string;
  languageCode?: string;
  text?: string;
  speed?: number;
}

// A conservative allow-list of elevenlabs preset voice ids (secondary guard).
const ELEVEN_ALLOWED = new Set([
  "WAeWgS3tOvE1YclFTZSA", // DhanDrishti Voice Design voice
  "21m00Tcm4TlvDq8ikWAM", // Rachel
  "EXAVITQu4vr4xnSDxMaL", // Bella
  "AZnzlk1XvdvUeBnXmlld", // Domi
  "MF3mGyEYCl7XYWbV9V6O", // Elli
  "TxGEqnHWrfWFTfGW9XjX", // Josh
  "pNInz6obpgDQGcFmaJgB", // Adam
  "ErXwobaYiN019PkySvjV", // Antoni
  "VR6AewLTigWG4xSOukaG", // Arnold
  "yoZ06aMxZJJ28mfd3POQ", // Sam
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  if (req.headers.get("content-type")?.includes("multipart/form-data")) {
    return handleTranscribe(req);
  }

  let body: SynthReq;
  try {
    body = (await req.json()) as SynthReq;
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  if (!body || !body.action || !body.provider) {
    return json(400, { error: "action and provider are required" });
  }

  if (body.provider === "elevenlabs") {
    return handleEleven(body);
  }
  if (body.provider === "google") {
    return handleGoogle(body);
  }
  return json(400, { error: "Unsupported provider" });
});

async function handleTranscribe(req: Request): Promise<Response> {
  const key = Deno.env.get("ELEVENLABS_API_KEY");
  if (!key) return json(503, { error: "ElevenLabs is not configured on the server" });
  const form = await req.formData();
  const audio = form.get("audio");
  if (!(audio instanceof File)) return json(400, { error: "audio is required" });

  const payload = new FormData();
  payload.append("model_id", "scribe_v1");
  payload.append("file", audio, audio.name || "voice-command.m4a");
  const languageCode = String(form.get("languageCode") || "").split("-")[0];
  if (languageCode) payload.append("language_code", languageCode);

  const response = await fetch(`${ELEVEN_API}/speech-to-text`, {
    method: "POST",
    headers: { "xi-api-key": key },
    body: payload,
  });
  if (!response.ok) return json(502, { error: "Speech transcription failed" });
  const data = (await response.json()) as { text?: string };
  return json(200, { text: data.text ?? "" });
}

async function handleEleven(req: SynthReq): Promise<Response> {
  const key = Deno.env.get("ELEVENLABS_API_KEY");
  if (!key) {
    return json(503, { error: "ElevenLabs is not configured on the server" });
  }

  if (req.action === "voices") {
    // Return the preset voice ids we know exist in every account.
    const voices = Array.from(ELEVEN_ALLOWED).map((voice_id) => ({ voice_id }));
    return json(200, { voices });
  }

  // ---- synthesize ----
  if (!req.text || !req.voiceId || !ELEVEN_ALLOWED.has(req.voiceId)) {
    return json(400, { error: "text and a valid voiceId are required" });
  }
  if (req.text.length > 2000) {
    return json(400, { error: "text too long" });
  }

  const speed = Math.min(2, Math.max(0.5, Number(req.speed) || 1));

  // Translate BCP-47 -> ElevenLabs v3 ISO 639-3 code. Fall back to auto-detect.
  const base = (req.languageCode || "kn-IN").split("-")[0].toLowerCase();
  const elevenLang = ELEVEN_LANG[base];

  const payload: Record<string, unknown> = {
    text: req.text,
    model_id: ELEVEN_MODEL,
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.4,
      use_speaker_boost: true,
      speed,
    },
  };
  if (elevenLang) payload.language_code = elevenLang;

  const res = await fetch(
    `${ELEVEN_API}/text-to-speech/${req.voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return json(502, { error: "ElevenLabs synthesis failed", detail });
  }

  const buf = await res.arrayBuffer();
  const b64 = bytesToBase64(new Uint8Array(buf));
  return json(200, { audio: b64, contentType: "audio/mpeg", duration: 0 });
}

async function handleGoogle(_req: SynthReq): Promise<Response> {
  return json(503, { error: "Google TTS is not configured on the server" });
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}
