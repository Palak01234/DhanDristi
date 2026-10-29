import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { UserPreferences, VoiceSettings, VoiceTone } from "@/types";
import { useApp } from "@/context/AppProvider";
import {
  getLanguages,
  getPersona,
  getPersonasForLanguage,
  getProviderVoiceId,
  DEFAULT_LANGUAGE_BASE,
  DEFAULT_PERSONA_ID,
  VOICE_PERSONAS,
  type VoiceLanguage,
  type VoicePersona,
} from "@/services/tts/voiceRegistry";
import { ttsManager } from "@/services/tts/TTSManager";
import type { ProviderStatus, SpeechStatus, TTSRequest } from "@/services/tts/types";

export interface SelectedPersona {
  id: string;
  name: string;
  family: string;
  gender: "female" | "male";
  lang: string;
  personality: string;
  providerVoiceId: string;
  sampleText: string;
}

export interface VoiceContextValue {
  supported: boolean;
  /** Provider / AI vs device status for the UI. */
  providerStatus: ProviderStatus;
  speechStatus: SpeechStatus;
  isSpeaking: boolean;
  /** True when the active provider is a configured AI provider. */
  usingAi: boolean;
  selectedVoice: SelectedPersona;
  selectedLanguage: VoiceLanguage;
  languages: VoiceLanguage[];
  personasForLanguage: (base: string) => VoicePersona[];
  settings: VoiceSettings;
  setSettings: (patch: Partial<VoiceSettings>) => void;
  setVoice: (id: string) => void;
  setLanguage: (base: string) => void;
  /** Speak arbitrary text using the selected voice (native text). */
  speak: (text: string, tone?: VoiceTone, lang?: string) => Promise<void>;
  speakResult: (text: string, tone?: VoiceTone, lang?: string) => Promise<void>;
  /** Preview a persona with a native sample. */
  previewVoice: (id?: string) => void;
  previewingVoiceId: string | null;
  stop: () => void;
  testVoice: (id?: string) => void;
  hasKannadaEngineVoice: boolean;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

function buildSelectedVoice(voiceId: string | null, settings: VoiceSettings): SelectedPersona {
  const persona = getPersona(voiceId ?? settings.voiceId);
  const lang = getLanguages().find((l) => l.base === persona.languageBase);
  return {
    id: persona.id,
    name: persona.name,
    family: lang?.label ?? "Kannada",
    gender: persona.gender,
    lang: persona.languageCode,
    personality: persona.personality,
    providerVoiceId: getProviderVoiceId(persona),
    sampleText: persona.sampleText,
  };
}

export function VoiceProvider({ children }: { children: ReactNode }) {
  const { preferences, updatePreferences } = useApp();
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>(
    ttsManager.getProviderStatus(),
  );
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>(ttsManager.getStatus());
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const repeatTimersRef = useRef<Set<number>>(new Set());
  const settingsRef = useRef<VoiceSettings>(preferences.voice);
  settingsRef.current = preferences.voice;

  useEffect(() => {
    const offProvider = ttsManager.registerProvider(setProviderStatus);
    const offStatus = ttsManager.registerStatus((s) => {
      setSpeechStatus(s);
      if (s === "ended" || s === "error" || s === "idle") setPreviewingVoiceId(null);
    });
    return () => {
      offProvider();
      offStatus();
    };
  }, []);

  const setSettings = useCallback(
    (patch: Partial<VoiceSettings>) => {
      updatePreferences({ voice: { ...settingsRef.current, ...patch } });
    },
    [updatePreferences],
  );

  const setVoice = useCallback(
    (id: string) => {
      const persona = getPersona(id);
      setSettings({ voiceId: persona.id, language: persona.languageCode });
    },
    [setSettings],
  );

  const setLanguage = useCallback(
    (base: string) => {
      const lang = getLanguages().find((l) => l.base === base) ?? getLanguages()[0];
      const persons = getPersonasForLanguage(lang.base);
      // DhanDrishti uses one shared female Voice Design voice. Selecting a
      // language must never restore a previously selected male persona.
      const chosen = persons.find((v) => v.gender === "female") ?? persons[0];
      if (chosen) setSettings({ language: lang.code, voiceId: chosen.id });
      else setSettings({ language: lang.code });
    },
    [setSettings],
  );

  const buildRequest = useCallback((text: string, tone: VoiceTone, langOverride?: string): TTSRequest => {
    const s = settingsRef.current;
    const persona = getPersona(s.voiceId);
    return {
      text,
      language: langOverride ?? s.language ?? persona.languageCode,
      voiceId: persona.id,
      providerVoiceId: getProviderVoiceId(persona),
      speed: s.speed,
      pitch: s.pitch,
      volume: s.volume,
      style: tone,
    };
  }, []);

  const speak = useCallback(
    (text: string, tone: VoiceTone = "normal", langOverride?: string) => {
      return ttsManager.speak(buildRequest(text, tone, langOverride));
    },
    [buildRequest],
  );

  const speakResult = useCallback(
    (text: string, tone: VoiceTone = "confirmation", _langOverride?: string) => {
      const s = settingsRef.current;
      // Results from individual pages must honour the language chosen in
      // Settings, rather than a page-specific detection-language override.
      const playback = ttsManager.speak(buildRequest(text, tone, _langOverride));
      if (s.repeatResult) {
        const timer = window.setTimeout(() => {
          repeatTimersRef.current.delete(timer);
          void ttsManager.speak(buildRequest(text, tone, _langOverride));
        }, 1600);
        repeatTimersRef.current.add(timer);
      }
      if (s.vibration) {
        try {
          navigator.vibrate?.([60, 60, 60]);
        } catch {
          /* ignore */
        }
      }
      return playback;
    },
    [buildRequest],
  );

  const previewVoice = useCallback(
    (id?: string) => {
      const s = settingsRef.current;
      const persona = getPersona(id ?? s.voiceId);
      setPreviewingVoiceId(persona.id);
      void ttsManager.speak(
        buildRequest(persona.sampleText, "confirmation", persona.languageCode),
      );
    },
    [buildRequest],
  );

  const testVoice = useCallback(
    (id?: string) => previewVoice(id),
    [previewVoice],
  );

  const stop = useCallback(() => {
    repeatTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    repeatTimersRef.current.clear();
    ttsManager.stop();
    setPreviewingVoiceId(null);
  }, []);

  const selectedVoice = useMemo(
    () => buildSelectedVoice(preferences.voice.voiceId, preferences.voice),
    [preferences.voice.voiceId, preferences.voice],
  );

  const selectedLanguage = useMemo(
    () => getLanguages().find((l) => l.base === selectedVoice.lang.split("-")[0]) ?? getLanguages()[0],
    [selectedVoice.lang],
  );

  const isSpeaking = speechStatus === "playing" || speechStatus === "synthesizing";

  const value: VoiceContextValue = useMemo(
    () => ({
      supported: providerStatus.available,
      providerStatus,
      speechStatus,
      isSpeaking,
      usingAi: ttsManager.isUsingAi(),
      selectedVoice,
      selectedLanguage,
      languages: getLanguages(),
      personasForLanguage: getPersonasForLanguage,
      settings: preferences.voice,
      setSettings,
      setVoice,
      setLanguage,
      speak,
      speakResult,
      previewVoice,
      previewingVoiceId,
      stop,
      testVoice,
      hasKannadaEngineVoice: false,
    }),
    [
      providerStatus,
      speechStatus,
      isSpeaking,
      selectedVoice,
      selectedLanguage,
      preferences.voice,
      previewingVoiceId,
      setSettings,
      setVoice,
      setLanguage,
      speak,
      speakResult,
      previewVoice,
      stop,
      testVoice,
    ],
  );

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice(): VoiceContextValue {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useVoice must be used within VoiceProvider");
  return ctx;
}

/** Exposed for completeness (registry integrity check). */
export const VOICE_REGISTRY_PERSONAS = VOICE_PERSONAS;
export const DEFAULT_LANGUAGE = DEFAULT_LANGUAGE_BASE;
export const DEFAULT_VOICE = DEFAULT_PERSONA_ID;
