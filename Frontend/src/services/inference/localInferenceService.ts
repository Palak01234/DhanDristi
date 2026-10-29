import * as ort from "onnxruntime-web";
import type { DetectionResult, UserPreferences } from "@/types";

const INPUT_SIZE = 640;
const CONFIDENCE_FLOOR = 0.35;

const CLASSES = [
  ["USD", 50], ["USD", 5], ["USD", 1], ["USD", 10], ["USD", 20], ["USD", 100],
  ["PHP", 100], ["PHP", 1000], ["PHP", 1000], ["PHP", 20], ["PHP", 200], ["PHP", 50], ["PHP", 500],
  ["INR", 100], ["INR", 10], ["INR", 200], ["INR", 20], ["INR", 500], ["INR", 50], ["INR", 2000],
  ["EUR", 100], ["EUR", 10], ["EUR", 200], ["EUR", 20], ["EUR", 50], ["EUR", 5],
  ["AUD", 100], ["AUD", 10], ["AUD", 20], ["AUD", 50], ["AUD", 5],
  ["CAD", 100], ["CAD", 10], ["CAD", 20], ["CAD", 50], ["CAD", 5],
] as const;

ort.env.wasm.numThreads = 1;
ort.env.wasm.wasmPaths = "/ort/";

let sessionPromise: Promise<ort.InferenceSession> | null = null;

function loadSession(): Promise<ort.InferenceSession> {
  sessionPromise ??= ort.InferenceSession.create("/model.onnx", {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all",
  });
  return sessionPromise;
}

function makeTensor(video: HTMLVideoElement): ort.Tensor {
  const scale = Math.min(INPUT_SIZE / video.videoWidth, INPUT_SIZE / video.videoHeight);
  const width = Math.round(video.videoWidth * scale);
  const height = Math.round(video.videoHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = INPUT_SIZE;
  canvas.height = INPUT_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare camera frame");
  context.fillStyle = "rgb(114,114,114)";
  context.fillRect(0, 0, INPUT_SIZE, INPUT_SIZE);
  context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight,
    (INPUT_SIZE - width) / 2, (INPUT_SIZE - height) / 2, width, height);
  const { data } = context.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
  const planeSize = INPUT_SIZE * INPUT_SIZE;
  const values = new Float32Array(planeSize * 3);
  for (let index = 0; index < planeSize; index += 1) {
    values[index] = data[index * 4] / 255;
    values[planeSize + index] = data[index * 4 + 1] / 255;
    values[planeSize * 2 + index] = data[index * 4 + 2] / 255;
  }
  return new ort.Tensor("float32", values, [1, 3, INPUT_SIZE, INPUT_SIZE]);
}

export async function runLocalInference(
  preferences: UserPreferences,
  video: HTMLVideoElement,
): Promise<DetectionResult> {
  const session = await loadSession();
  const output = (await session.run({ [session.inputNames[0]]: makeTensor(video) }))[session.outputNames[0]];
  const [, boxCount, columns] = output.dims as [number, number, number];
  const values = output.data as Float32Array;
  const allowed = new Set(
    preferences.detectionMode === "multiple"
      ? preferences.selectedCurrencies
      : [preferences.detectionCurrency],
  );
  const detections: DetectionResult["currencies"] = [];
  for (let index = 0; index < boxCount; index += 1) {
    const base = index * columns;
    const confidence = values[base + 4];
    const note = CLASSES[Math.round(values[base + 5])];
    if (!note || confidence < CONFIDENCE_FLOOR || !allowed.has(note[0])) continue;
    detections.push({ currency: note[0], denomination: note[1], confidence });
  }
  const selected = preferences.detectionMode === "multiple" ? detections : detections.slice(0, 1);
  const confidence = selected[0]?.confidence ?? 0;
  return {
    status: selected.length === 0 ? "error" : confidence < preferences.confidenceThreshold ? "low_confidence" : "success",
    currencies: selected,
    total: selected.reduce((total, note) => total + note.denomination, 0),
    possibleReasons: confidence < preferences.confidenceThreshold
      ? ["Poor lighting", "Note at a sharp angle", "Partial or folded note"]
      : undefined,
  };
}
