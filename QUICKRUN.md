# Quick Run

This is the shortest path to run the complete Currency Vision application locally.

## 1. Install dependencies

Open PowerShell in the repository root:

```powershell
cd Currency_Vision
npm install

cd ..\Frontend
npm install
```

## 2. Prepare optional services

For account and history features, make sure MongoDB is running locally on its default port, or set `MONGODB_URI` in `Currency_Vision/.env`.

For voice features, set this server-side variable in `Currency_Vision/.env`:

```dotenv
ELEVENLABS_API_KEY=your-key
```

Never put this key in frontend code or commit it to Git.

## 3. Start the API

Terminal 1:

```powershell
cd Currency_Vision
npm run api
```

Verify it at:

```text
http://localhost:8787/health
```

Expected response:

```json
{"ok":true,"model":"currency-yolo"}
```

## 4. Start the React app

Terminal 2:

```powershell
cd Frontend
npm run dev
```

Open the Vite URL, normally:

```text
https://localhost:3000
```

Accept the browser certificate warning if the local HTTPS certificate is not trusted yet. Allow camera access when scanning.

## 5. Test the main flow

1. Create an account or use the login screen.
2. Complete the currency and denomination preferences.
3. Open the scanner.
4. Allow camera access.
5. Hold a supported banknote in good lighting inside the camera view.
6. Review the detected currency, denomination, confidence, and conversion.
7. Open history to confirm the record was saved.

## Standalone demo only

To run the simpler browser-side image detector without MongoDB or the API:

```powershell
cd Currency_Vision
npm run dev
```

Open the Vite URL and upload an image. This mode runs `public/model.onnx` through ONNX Runtime WebAssembly.

## Useful checks

```powershell
# API health
Invoke-RestMethod http://localhost:8787/health

# React type check
cd Frontend
npm run type-check

# React lint
npm run lint

# Build both frontend projects
npm run build
cd ..\Currency_Vision
npm run build
```

## Common fixes

- `ECONNREFUSED` or failed `/api/inference`: start `npm run api` in `Currency_Vision`.
- MongoDB unavailable: start MongoDB or configure `MONGODB_URI`; inference itself does not require account history.
- Voice unavailable: configure `ELEVENLABS_API_KEY` and restart the API.
- Camera unavailable: use the HTTPS frontend URL and grant camera permission.
- No detections: improve lighting, keep the note flat and fully visible, and try a supported denomination.
