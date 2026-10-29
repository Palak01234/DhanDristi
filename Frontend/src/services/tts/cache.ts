import type { TTSResult, TTSRequest } from "@/services/tts/types";

/**
 * Deterministic in-memory audio cache for previews and repeated synthetic
 * speech. The key is composed only of the parameters that shape the audio, so
 * the exact same sample is never regenerated.
 *
 * This is intentionally in-memory (per session) and does NOT cache
 * user-generated transcription of sensitive data indefinitely — the app only
 * caches fixed preview text and short result announcements in memory.
 */
const cache = new Map<string, TTSResult>();

export function cacheKey(req: TTSRequest): string {
  return [
    req.providerVoiceId,
    req.language,
    req.text,
    req.speed,
    req.style ?? "",
  ].join("|");
}

export function getCachedAudio(key: string): TTSResult | undefined {
  return cache.get(key)?.audioUrl ? cache.get(key) : undefined;
}

export function setCachedAudio(key: string, result: TTSResult): void {
  // Keep last ~64 entries to bound memory.
  if (cache.size > 64) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  cache.set(key, result);
}