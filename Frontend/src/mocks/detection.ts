import type { DetectionResult } from "@/types";

/**
 * Mock ML inference results.
 * The inference service abstracts this so a real trained YOLO model
 * can replace it later via an API call without touching the UI.
 */

export const MOCK_RESULTS: Record<string, DetectionResult> = {
  success: {
    status: "success",
    currencies: [{ currency: "INR", denomination: 500, confidence: 0.96 }],
    elapsedMs: 412,
  },
  low: {
    status: "low_confidence",
    currencies: [{ currency: "INR", denomination: 100, confidence: 0.61 }],
    possibleReasons: ["Poor lighting", "Note at a sharp angle", "Partial or folded note", "Damaged note"],
    elapsedMs: 388,
  },
  wrong: {
    status: "wrong_currency",
    currencies: [{ currency: "USD", denomination: 20, confidence: 0.93 }],
    elapsedMs: 402,
  },
  auto: {
    status: "success",
    currencies: [{ currency: "PHP", denomination: 1000, confidence: 0.91 }],
    elapsedMs: 455,
  },
  multiple: {
    status: "success",
    currencies: [
      { currency: "INR", denomination: 500, confidence: 0.96 },
      { currency: "INR", denomination: 100, confidence: 0.9 },
      { currency: "INR", denomination: 500, confidence: 0.94 },
    ],
    total: 1100,
    elapsedMs: 610,
  },
};