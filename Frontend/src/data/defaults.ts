import type { UserPreferences } from "@/types";

export const DEFAULT_PREFERENCES: UserPreferences = {
  detectionCurrency: "INR",
  detectionMode: "single",
  selectedCurrencies: ["INR"],
  selectedDenominations: [], // empty = all denominations
  conversionCurrency: "USD",
  voice: {
    language: "kn-IN",
    voiceId: "kn-ananya",
    voiceURI: null,
    speed: 1,
    pitch: 1,
    volume: 1,
    autoSpeak: true,
    repeatResult: false,
    vibration: false,
    favoriteVoiceId: null,
    romanizedFallback: false,
  },
  accessibility: {
    highContrast: false,
    largeText: false,
    darkMode: false,
  },
  confidenceThreshold: 0.8,
  autoScan: true,
  offlineModel: false,
  exchangeRateData: "online",
};