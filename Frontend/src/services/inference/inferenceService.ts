import type { DetectionResult, UserPreferences } from "@/types";
import { apiUrl } from "@/services/api";

export interface InferenceOutput {
  result: DetectionResult;
}

/** Sends a camera frame to the ONNX inference API and maps its response to the UI contract. */
const MODEL_API_URL = (import.meta.env.VITE_MODEL_API_URL as string | undefined) || "";

export async function runInference(
  preferences: UserPreferences,
  video?: HTMLVideoElement,
): Promise<InferenceOutput> {
  if (video && video.videoWidth > 0 && video.videoHeight > 0) {
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.75));
    if (!blob) throw new Error("Could not capture a camera frame");

    const inferenceUrl = MODEL_API_URL
      ? `${MODEL_API_URL.replace(/\/$/, "")}/api/inference`
      : apiUrl("/api/inference");
    const response = await fetch(inferenceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "image/jpeg",
        "X-Detection-Currency": preferences.detectionCurrency,
        "X-Detection-Currencies": preferences.detectionMode === "multiple"
          ? preferences.selectedCurrencies.join(",")
          : preferences.detectionMode === "automatic"
            ? "INR,USD,PHP,EUR,AUD,CAD"
            : preferences.detectionCurrency,
        "X-Detection-Mode": preferences.detectionMode,
        "X-Confidence-Threshold": String(preferences.confidenceThreshold),
      },
      body: blob,
    });
    if (!response.ok) throw new Error(`Model API request failed (${response.status})`);
    return { result: (await response.json()) as DetectionResult };
  }

  throw new Error("Camera frame is not ready. Please wait for the camera preview and try again.");
}