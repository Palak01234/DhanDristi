/**
 * DhanDrishti AI Text-to-Speech architecture — core contracts.
 *
 * The application never talks to a raw speech engine directly. It goes through
 * a provider abstraction. The active provider is decided by TTSManager:
 *
 *   ElevenLabs AI TTS is the only provider. Failures surface as an error.
 *
 * Providers are replaceable without touching UI code.
 */

export type ProviderId = "elevenlabs";
export type ProviderKind = "ai" | "device";

/** Fine-grained speech lifecycle, surfaced to the UI. */
export type SpeechStatus =
  | "idle"
  | "synthesizing"
  | "playing"
  | "paused"
  | "ended"
  | "error";

export interface TTSRequest {
  /** The text to synthesise. Kannada text stays in native script. */
  text: string;
  /** BCP-47 language code, e.g. "kn-IN". */
  language: string;
  /** DhanDrishti persona id, e.g. "kn-ananya". */
  voiceId: string;
  /** The provider's real voice id, e.g. "kn-IN-Chirp3-HD-Achernar". */
  providerVoiceId: string;
  /** User speech speed 0.5 – 2.0. */
  speed: number;
  /** Optional user pitch (only used where the provider supports it). */
  pitch?: number;
  /** Optional user volume 0 – 1. */
  volume?: number;
  /** Optional speaking style / emphasis when the provider supports it. */
  style?: string;
}

export interface TTSResult {
  /** Audio URL returned by ElevenLabs. */
  audioUrl: string;
  provider: ProviderId;
  providerVoiceId: string;
  duration?: number;
  replay?: boolean;
}

/** A real voice exposed by a provider, including availability metadata. */
export interface ProviderVoice {
  /** DhanDrishti persona id ("" for extra provider voices not in registry). */
  id: string;
  /** Friendly persona name. */
  name: string;
  /** The provider's real voice id. */
  providerVoiceId: string;
  /** BCP-47 language code from provider metadata. */
  languageCode: string;
  /** Provider ssmlGender — the authoritative gender source. */
  ssmlGender: string;
  /** Normalised gender. */
  gender: "female" | "male";
  /** Whether this voice exists/works in the configured account. */
  availability: "available" | "unavailable";
}

export interface TTSProvider {
  readonly id: ProviderId;
  readonly label: string;
  readonly kind: ProviderKind;
  /** Whether this provider is configured and can synthesise right now. */
  isAvailable(): boolean;
  /** Synthesise audio for the given request. */
  synthesize(req: TTSRequest): Promise<TTSResult>;
  /** List real voices for a language, with availability computed from the account. */
  getVoices(language?: string): Promise<ProviderVoice[]>;
}

/** Human-readable status shown in the UI, never raw error stacks. */
export interface ProviderStatus {
  mode: "ai" | "device";
  providerLabel: string;
  kind: ProviderKind;
  available: boolean;
  usingFallback: boolean;
  message: string;
}