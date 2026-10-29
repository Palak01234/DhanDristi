import type {
  ProviderStatus,
  SpeechStatus,
  TTSProvider,
  TTSRequest,
  TTSResult,
} from "@/services/tts/types";
import { ElevenLabsTTSProvider } from "@/services/tts/ElevenLabsTTSProvider";
import { cacheKey, getCachedAudio, setCachedAudio } from "@/services/tts/cache";

type StatusListener = (status: SpeechStatus) => void;
type ProviderListener = (status: ProviderStatus) => void;

/**
 * The voice orchestrator. Decides which provider speaks, plays the resulting
 * audio, caches previews, and keeps the UI informed of full lifecycle state.
 *
 * ElevenLabs is the only voice provider. Provider failures are surfaced as
 * errors instead of falling back to a system voice.
 */
class TTSManager {
  private elevenlabs = new ElevenLabsTTSProvider();
  private audio = new Audio();

  private status: SpeechStatus = "idle";
  private providerStatus: ProviderStatus;
  private statusListeners = new Set<StatusListener>();
  private providerListeners = new Set<ProviderListener>();
  private inFlight = new Map<string, Promise<void>>();
  private playbackGeneration = 0;

  constructor() {
    this.providerStatus = this.buildProviderStatus();
    this.audio.preload = "auto";
    this.audio.addEventListener("playing", () => this.setStatus("playing"));
    this.audio.addEventListener("pause", () => this.setStatus("paused"));
    this.audio.addEventListener("ended", () => this.setStatus("ended"));
    this.audio.addEventListener("error", () => {
      this.setStatus("error");
      this.setProviderStatus((s) => ({ ...s, available: false, message: "ElevenLabs audio playback failed." }));
    });
  }

  /* ------------------------- public API ------------------------- */

  registerStatus(cb: StatusListener): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  registerProvider(cb: ProviderListener): () => void {
    this.providerListeners.add(cb);
    return () => this.providerListeners.delete(cb);
  }

  getStatus(): SpeechStatus {
    return this.status;
  }

  getProviderStatus(): ProviderStatus {
    return this.providerStatus;
  }

  isUsingAi(): boolean {
    return this.pickProvider().kind === "ai";
  }

  /** The id of the provider the manager would currently use to speak. */
  getActiveProviderId(): "elevenlabs" {
    return this.pickProvider().id;
  }

  /** Speak a request through ElevenLabs. */
  speak(req: TTSRequest): Promise<void> {
    const key = cacheKey(req);
    const existing = this.inFlight.get(key);
    if (existing) return existing;

    const request = this.speakRequest(req, key);
    this.inFlight.set(key, request);
    void request.finally(() => this.inFlight.delete(key));
    return request;
  }

  private async speakRequest(req: TTSRequest, key: string): Promise<void> {
    this.stop();
    const generation = this.playbackGeneration;
    const provider = this.pickProvider();

    if (!provider.isAvailable()) {
      this.setProviderStatus({
        mode: "ai",
        providerLabel: provider.label,
        kind: "ai",
        available: false,
        usingFallback: false,
        message: "ElevenLabs voice is not configured.",
      });
      this.setStatus("error");
      return;
    }

    this.setProviderStatus({
      mode: "ai",
      providerLabel: provider.label,
      kind: "ai",
      available: true,
      usingFallback: false,
      message: `${provider.label} voice active`,
    });
    this.setStatus("synthesizing");

    try {
      let result: TTSResult | undefined = getCachedAudio(key);
      if (!result) {
        result = await provider.synthesize(req);
        setCachedAudio(key, result);
      }
      if (this.status === "error" || generation !== this.playbackGeneration) return;
      this.audio.src = result.audioUrl;
      await this.audio.play();
      await new Promise<void>((resolve) => {
        const finish = () => {
          this.audio.removeEventListener("ended", finish);
          this.audio.removeEventListener("error", finish);
          resolve();
        };
        this.audio.addEventListener("ended", finish, { once: true });
        this.audio.addEventListener("error", finish, { once: true });
      });
    } catch (error) {
      this.setProviderStatus((s) => ({
        ...s,
        available: false,
        usingFallback: false,
        message: getAiErrorMessage(error),
      }));
      this.setStatus("error");
    }
  }

  stop(): void {
    this.playbackGeneration += 1;
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.setStatus("idle");
  }

  /* ------------------------- internals ------------------------- */

  private pickProvider(): ElevenLabsTTSProvider {
    return this.elevenlabs;
  }

  private setStatus(status: SpeechStatus): void {
    this.status = status;
    this.statusListeners.forEach((l) => l(status));
  }

  private setProviderStatus(
    next: ProviderStatus | ((prev: ProviderStatus) => ProviderStatus),
  ): void {
    const value = typeof next === "function" ? next(this.providerStatus) : next;
    this.providerStatus = value;
    this.providerListeners.forEach((l) => l(value));
  }

  private buildProviderStatus(): ProviderStatus {
    if (this.elevenlabs.isAvailable()) {
      return {
        mode: "ai",
        providerLabel: this.elevenlabs.label,
        kind: "ai",
        available: true,
        usingFallback: false,
        message: `${this.elevenlabs.label} voice active`,
      };
    }
    return {
      mode: "ai",
      providerLabel: this.elevenlabs.label,
      kind: "ai",
      available: false,
      usingFallback: false,
      message: "ElevenLabs voice is not configured.",
    };
  }
}

function getAiErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/\b402\b|credit|quota|billing|payment/i.test(message)) {
    return "ElevenLabs voice credits are unavailable.";
  }
  if (/\b401\b|\b403\b|unauthori[sz]ed|forbidden/i.test(message)) {
    return "ElevenLabs voice access is not authorised.";
  }
  return "ElevenLabs voice is temporarily unavailable.";
}

export const ttsManager = new TTSManager();
