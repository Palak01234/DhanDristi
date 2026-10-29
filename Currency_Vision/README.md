# Vision Demo

This project is a lightweight browser-based object detection demo. It loads a trained ONNX model in the browser, runs inference locally on uploaded images, draws detection boxes, and summarizes the results in a simple interface.

## Project structure

- `index.html` and `src/` - Vite frontend
- `public/model.onnx` - model used for inference
- `public/ort/` - ONNX Runtime WebAssembly files
- `public/samples/` - sample images for testing
- `dataset.yaml` - example dataset configuration

## Run locally

```bash
npm install
npm run build
npm run preview
```

For development:

```bash
npm run dev
```

For the React frontend scanner, run the model API in a second terminal:

```bash
npm run api
```

The API listens on `http://localhost:8787`. Set `VITE_MODEL_API_URL` in the
frontend environment when the API is deployed elsewhere. The React scanner
captures a camera frame and sends it to `/api/inference`; the API loads
`public/model.onnx` with ONNX Runtime Node and returns detected currencies,
denominations, and confidence scores.

## Notes

- The app performs inference locally in the browser.
- No backend or external service is required for the detection flow.
- This is a demo project intended for learning and experimentation.
