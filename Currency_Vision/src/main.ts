import './style.css';
import { CLASSES, convert } from './banknotes';
import { loadModel, detect, type Detection } from './inference';

const dropzone = document.getElementById('dropzone') as HTMLLabelElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const statusLine = document.getElementById('status-line')!;
const canvasWrap = document.getElementById('canvas-wrap')!;
const canvas = document.getElementById('result-canvas') as HTMLCanvasElement;
const resultsPanel = document.getElementById('results-panel') as HTMLElement;
const ledgerBody = document.getElementById('ledger-body')!;
const currencySelect = document.getElementById('currency-select') as HTMLSelectElement;
const grandTotal = document.getElementById('grand-total')!;
const latencyLine = document.getElementById('latency-line')!;
const sampleButtons = document.querySelectorAll<HTMLButtonElement>('.sample-thumb');

const MAX_DISPLAY_DIM = 900;
let modelReady = false;
let busy = false;
let lastTotalsByCurrency: Record<string, number> = {};

function setStatus(text: string, tone: 'default' | 'error' = 'default') {
  statusLine.textContent = text;
  statusLine.dataset.tone = tone === 'error' ? 'error' : '';
}

async function ensureModel(): Promise<void> {
  if (modelReady) return;
  await loadModel((fraction) => {
    setStatus(`Loading detector model - ${Math.round(fraction * 100)}%`);
  });
  modelReady = true;
}

function loadImage(file: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read that image. Try a PNG or JPG file.'));
    img.src = typeof file === 'string' ? file : URL.createObjectURL(file);
  });
}

function drawResult(img: HTMLImageElement, detections: Detection[]) {
  const scale = Math.min(1, MAX_DISPLAY_DIM / Math.max(img.naturalWidth, img.naturalHeight));
  canvas.width = img.naturalWidth * scale;
  canvas.height = img.naturalHeight * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 2.5;
  ctx.font = '600 13px "IBM Plex Mono", monospace';
  ctx.textBaseline = 'bottom';

  for (const det of detections) {
    const { x1, y1, x2, y2 } = det.box;
    const bx = x1 * scale;
    const by = y1 * scale;
    const bw = (x2 - x1) * scale;
    const bh = (y2 - y1) * scale;
    ctx.strokeStyle = '#365f4f';
    ctx.strokeRect(bx, by, bw, bh);

    const label = `${CLASSES[det.classIndex].label}  ${Math.round(det.confidence * 100)}%`;
    const textW = ctx.measureText(label).width + 10;
    const labelY = by > 20 ? by : by + bh + 20;
    ctx.fillStyle = '#365f4f';
    ctx.fillRect(bx, labelY - 18, textW, 18);
    ctx.fillStyle = '#f3efe5';
    ctx.fillText(label, bx + 5, labelY);
  }

  canvasWrap.classList.add('has-image');
}

async function updateGrandTotal() {
  if (Object.keys(lastTotalsByCurrency).length === 0) {
    grandTotal.textContent = '-';
    return;
  }
  grandTotal.textContent = 'Converting...';
  const target = currencySelect.value;
  const { total, ok } = await convert(lastTotalsByCurrency, target);
  grandTotal.textContent = ok
    ? `${target} ${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : `${target} ${total.toLocaleString(undefined, { maximumFractionDigits: 2 })} (rates unavailable)`;
}

function renderLedger(counts: Record<number, number>) {
  ledgerBody.innerHTML = '';
  const entries = Object.entries(counts);
  if (entries.length === 0) {
    lastTotalsByCurrency = {};
    grandTotal.textContent = '-';
    latencyLine.textContent = '';
    resultsPanel.hidden = true;
    return;
  }

  const totalsByCurrency: Record<string, number> = {};
  for (const [idxStr, count] of entries) {
    const cls = CLASSES[Number(idxStr)];
    const subtotal = cls.value * count;
    totalsByCurrency[cls.currency] = (totalsByCurrency[cls.currency] ?? 0) + subtotal;
    const row = document.createElement('tr');
    row.innerHTML = `<td>${cls.label}</td><td>${count}</td><td>${cls.currency} ${subtotal.toLocaleString()}</td>`;
    ledgerBody.appendChild(row);
  }
  lastTotalsByCurrency = totalsByCurrency;
  resultsPanel.hidden = false;
  updateGrandTotal();
}

currencySelect.addEventListener('change', updateGrandTotal);

function detectionErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return 'Something went wrong reading that photo.';
  const text = err.message.toLowerCase();
  if (text.includes('model') || text.includes('protobuf') || text.includes('onnx')) {
    return 'Detector model could not load. Refresh and try again.';
  }
  return err.message;
}

async function runOn(source: File | string) {
  if (busy) return;
  busy = true;
  dropzone.setAttribute('aria-busy', 'true');
  try {
    setStatus('Reading image...');
    const img = await loadImage(source);

    await ensureModel();
    setStatus('Detecting banknotes...');

    const { detections, preprocessMs, inferenceMs } = await detect(img);
    drawResult(img, detections);

    const counts: Record<number, number> = {};
    for (const d of detections) counts[d.classIndex] = (counts[d.classIndex] ?? 0) + 1;
    renderLedger(counts);

    latencyLine.textContent = detections.length === 0
      ? ''
      : `Detected in ${Math.round(preprocessMs + inferenceMs)} ms on this device. Image was not uploaded.`;

    setStatus(
      detections.length === 0
        ? 'No banknotes found. Try brighter lighting, a closer photo, or less overlap.'
        : `Found ${detections.length} banknote${detections.length === 1 ? '' : 's'}.`,
    );
  } catch (err) {
    console.error(err);
    setStatus(detectionErrorMessage(err), 'error');
  } finally {
    busy = false;
    dropzone.removeAttribute('aria-busy');
  }
}

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) runOn(file);
});

['dragover', 'dragenter'].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add('is-dragover');
  }),
);
['dragleave', 'drop'].forEach((evt) =>
  dropzone.addEventListener(evt, () => dropzone.classList.remove('is-dragover')),
);
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer?.files?.[0];
  if (file) runOn(file);
});

sampleButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const src = btn.dataset.sample!;
    runOn(src);
  });
});