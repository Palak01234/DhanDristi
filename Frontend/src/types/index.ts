import type { CurrencyCode } from "@/constants/currencies";

export type DetectionMode = "single" | "multiple" | "automatic";

export type DetectionStatus =
  | "success"
  | "low_confidence"
  | "wrong_currency"
  | "error";

export type VoiceTone =
  | "normal"
  | "warning"
  | "attention"
  | "error"
  | "confirmation";

export interface VoiceSettings {
  language: string;
  /** DhanDrishti branded AI voice identifier (e.g. "kn-ananya"). */
  voiceId: string | null;
  /** Mapped device/browser voice used as the current speech engine (architecture). */
  voiceURI: string | null;
  speed: number;
  pitch: number;
  volume: number;
  autoSpeak: boolean;
  repeatResult: boolean;
  vibration: boolean;
  favoriteVoiceId: string | null;
  /** Opt-in only: render Kannada as Latin phonetic text. */
  romanizedFallback: boolean;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  darkMode: boolean;
}

export interface UserPreferences {
  detectionCurrency: CurrencyCode;
  detectionMode: DetectionMode;
  selectedCurrencies: CurrencyCode[];
  selectedDenominations: number[];
  conversionCurrency: CurrencyCode;
  voice: VoiceSettings;
  accessibility: AccessibilitySettings;
  confidenceThreshold: number;
  autoScan: boolean;
  offlineModel: boolean;
  exchangeRateData: "online" | "offline" | "cached";
}

export interface DetectionRecord {
  id: string;
  currency: CurrencyCode;
  denomination: number;
  confidence: number;
  status: DetectionStatus;
  source: "camera" | "manual" | "counterfeit_check";
  createdAt: string;
  /** Only present when source === "counterfeit_check" */
  counterfeitVerdict?: CounterfeitVerdict;
}

export interface DetectedNote {
  currency: CurrencyCode;
  denomination: number;
  confidence: number;
}

export interface DetectionResult {
  status: DetectionStatus;
  currencies: DetectedNote[];
  counterfeitSuspected?: boolean;
  total?: number;
  possibleReasons?: string[];
  elapsedMs?: number;
}

// ─── Counterfeit detection ──────────────────────────────────────────────────

export type CheckResult = "pass" | "fail" | "uncertain";
export type CounterfeitVerdict = "authentic" | "suspicious" | "counterfeit";

export interface SecurityCheck {
  id: string;
  label: string;
  description: string;
  result: CheckResult;
  confidence: number;
}

export interface CounterfeitResult {
  verdict: CounterfeitVerdict;
  overallConfidence: number;
  checks: SecurityCheck[];
  currency: CurrencyCode;
  denomination: number;
  elapsedMs: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "user" | "admin";
}