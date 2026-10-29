import * as ort from 'onnxruntime-web';
import { CLASSES } from './banknotes';

ort.env.wasm.wasmPaths = {
  mjs: import.meta.env.DEV
    ? new URL('./ort-wasm-simd-threaded.jsep.mjs', import.meta.url)
    : '/ort/ort-wasm-simd-threaded.jsep.mjs',
  wasm: import.meta.env.DEV
    ? new URL('./ort-wasm-simd-threaded.jsep.wasm', import.meta.url)
    : '/ort/ort-wasm-simd-threaded.jsep.wasm',
};
ort.env.wasm.numThreads = 1;

const MODEL_URL = '/model.onnx';
const INPUT_SIZE = 640;
const CONF_THRESHOLD = 0.35;

export interface Detection {
  classIndex: number;
  confidence: number;
  box: { x1: number; y1: number; x2: number; y2: number }; // original image pixel space
}

export interface DetectResult {
  detections: Detection[];
  preprocessMs: number;
  inferenceMs: number;
}

let sessionPromise: Promise<ort.InferenceSession> | null = null;

export function modelSizeLabel(): string {
  return '~43 MB';
}

export async function loadModel(onProgress?: (fraction: number) => void): Promise<void> {
  if (sessionPromise) {
    await sessionPromise;
    return;
  }
  sessionPromise = (async () => {
    const buffer = await fetchWithProgress(MODEL_URL, onProgress);
    return ort.InferenceSession.create(buffer, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
  })();
  await sessionPromise;
}

async function fetchWithProgress(
  url: string,
  onProgress?: (fraction: number) => void,
): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    return res.arrayBuffer();
  }
  const total = Number(res.headers.get('content-length')) || 0;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (total && onProgress) onProgress(received / total);
  }
  const out = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out.buffer;
}

interface Letterbox {
  canvas: HTMLCanvasElement;
  ratio: number;
  padX: number;
  padY: number;
}

function letterbox(img: HTMLImageElement | ImageBitmap, size = INPUT_SIZE): Letterbox {
  const srcW = 'naturalWidth' in img ? img.naturalWidth : img.width;
  const srcH = 'naturalHeight' in img ? img.naturalHeight : img.height;
  const ratio = Math.min(size / srcW, size / srcH);
  const newW = Math.round(srcW * ratio);
  const newH = Math.round(srcH * ratio);
  const padX = (size - newW) / 2;
  const padY = (size - newH) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgb(114,114,114)';
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, srcW, srcH, padX, padY, newW, newH);
  return { canvas, ratio, padX, padY };
}

function canvasToTensor(canvas: HTMLCanvasElement): ort.Tensor {
  const ctx = canvas.getContext('2d')!;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const size = canvas.width * canvas.height;
  const floatData = new Float32Array(size * 3);
  for (let i = 0; i < size; i++) {
    floatData[i] = data[i * 4] / 255; // R plane
    floatData[size + i] = data[i * 4 + 1] / 255; // G plane
    floatData[size * 2 + i] = data[i * 4 + 2] / 255; // B plane
  }
  return new ort.Tensor('float32', floatData, [1, 3, canvas.height, canvas.width]);
}

export async function detect(img: HTMLImageElement | ImageBitmap): Promise<DetectResult> {
  const session = await sessionPromise;
  if (!session) throw new Error('Model not loaded yet');

  const t0 = performance.now();
  const { canvas, ratio, padX, padY } = letterbox(img);
  const tensor = canvasToTensor(canvas);
  const t1 = performance.now();

  const inputName = session.inputNames[0];
  const outputs = await session.run({ [inputName]: tensor });
  const output = outputs[session.outputNames[0]];
  const t2 = performance.now();

  const [, numBoxes, cols] = output.dims as [number, number, number];
  const arr = output.data as Float32Array;
  const detections: Detection[] = [];
  for (let i = 0; i < numBoxes; i++) {
    const base = i * cols;
    const conf = arr[base + 4];
    if (conf < CONF_THRESHOLD) continue;
    const cls = Math.round(arr[base + 5]);
    if (cls < 0 || cls >= CLASSES.length) continue;
    const x1 = (arr[base] - padX) / ratio;
    const y1 = (arr[base + 1] - padY) / ratio;
    const x2 = (arr[base + 2] - padX) / ratio;
    const y2 = (arr[base + 3] - padY) / ratio;
    detections.push({ classIndex: cls, confidence: conf, box: { x1, y1, x2, y2 } });
  }

  return { detections, preprocessMs: t1 - t0, inferenceMs: t2 - t1 };
}
