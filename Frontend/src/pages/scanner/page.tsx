import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flashlight,
  FlashlightOff,
  ScanLine,
  RotateCcw,
  ArrowLeft,
  Camera,
  Volume2,
  Loader2,
  Sparkles,
  Layers,
  Zap,
  Info,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/base/Button";
import { WaveformBars } from "@/components/feature/WaveformBars";
import { useApp } from "@/context/AppProvider";
import { useVoice } from "@/context/VoiceProvider";
import { getCurrency } from "@/constants/currencies";
import { runInference } from "@/services/inference/inferenceService";
import { apiUrl } from "@/services/api";
import { buildResultSpeechForVoice } from "@/services/inference/resultSpeech";
import { modeMessage, statusMessage, voiceMessage } from "@/services/voice/voiceMessages";
import type { DetectionMode } from "@/types";

type CamState = "idle" | "requesting" | "active" | "denied" | "secure" | "error";

const MODE_LABELS: Record<DetectionMode, string> = {
  single: "Single Note",
  multiple: "Multiple Notes",
  automatic: "Auto Detect",
};

const TIPS = [
  { icon: Zap, text: "Good lighting gives the highest accuracy." },
  { icon: Layers, text: "Keep the full note inside the guide frame." },
  { icon: CheckCircle2, text: "Hold the device steady while scanning." },
];

const COUNTERFEIT_CONFIDENCE_THRESHOLD = 0.75;

export default function Scanner() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { preferences, setLastResult, addHistoryRecord, updatePreferences } = useApp();
  const { speak, settings, hasKannadaEngineVoice, isSpeaking } = useVoice();

  const [camState, setCamState] = useState<CamState>("idle");
  const [flash, setFlash] = useState(false);
  const [scanning, setScanning] = useState(false);
  const autoCaptureBusyRef = useRef(false);
  const [guideText, setGuideText] = useState(
    "Point your camera at the banknote and hold steady.",
  );

  const currency = getCurrency(preferences.detectionCurrency);
  const mode = preferences.detectionMode;

  // Ambient particles during scanning
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        left: `${(i * 7 + 5) % 100}%`,
        top: `${(i * 13 + 9) % 100}%`,
        delay: `${(i % 6) * 0.4}s`,
        size: i % 4 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
      })),
    [],
  );

  useEffect(() => {
    void fetch(apiUrl("/health"), { cache: "no-store" }).catch(() => undefined);
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const goHomeOnBrowserBack = () => navigate("/home", { replace: true });
    window.addEventListener("popstate", goHomeOnBrowserBack);
    return () => window.removeEventListener("popstate", goHomeOnBrowserBack);
  }, [navigate]);

  useEffect(() => {
    if (camState !== "active" || !videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    void video.play().catch(() => setCamState("error"));
  }, [camState]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    setCamState("requesting");
    if (!window.isSecureContext) {
      setCamState("secure");
      speak(voiceMessage("cameraHttps", settings.language), "attention", settings.language);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamState("error");
      speak(voiceMessage("cameraUnavailable", settings.language), "attention", settings.language);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCamState("active");
      speak(voiceMessage("cameraReady", settings.language), "normal", settings.language);
    } catch {
      setCamState("denied");
      speak(voiceMessage("cameraDenied", settings.language), "attention", settings.language);
    }
  };

  const toggleFlash = () => {
    setFlash((f) => !f);
    const message = flash ? "Flashlight off." : "Flashlight on.";
    speak(statusMessage(message, settings.language), "confirmation", settings.language);
  };

  const setMode = (m: DetectionMode) => {
    updatePreferences({ detectionMode: m });
    speak(modeMessage(m, settings.language), "confirmation", settings.language);
  };

  const doScan = useCallback(async (automatic = false) => {
    if (scanning || autoCaptureBusyRef.current) return;
    if (!videoRef.current || videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      setGuideText("Camera is still starting. Please wait a moment.");
      return;
    }
    if (automatic) autoCaptureBusyRef.current = true;
    setScanning(true);
    setGuideText(automatic ? "Note found. Checking clarity…" : "Scanning… please hold steady.");
    if (!automatic) speak(voiceMessage("scanning", settings.language), "normal", settings.language);
    try {
      const { result } = await runInference(preferences, videoRef.current ?? undefined);
      const confidence = result.currencies[0]?.confidence ?? 0;
      const cleanDetection = result.status === "success" && confidence >= preferences.confidenceThreshold;
      const requiresCounterfeitCheck = Boolean(result.currencies[0] && confidence < COUNTERFEIT_CONFIDENCE_THRESHOLD);
      if (automatic && !cleanDetection && !requiresCounterfeitCheck) {
        setGuideText("Hold the note steady inside the frame.");
        return;
      }
      setLastResult(result);
      const note = result.currencies[0];
      if (note) {
        await addHistoryRecord({
          id: crypto.randomUUID(),
          currency: note.currency,
          denomination: note.denomination,
          confidence: note.confidence,
          status: result.status,
          source: "camera",
          createdAt: new Date().toISOString(),
        });
      }
      if (requiresCounterfeitCheck) {
        stopCamera();
        setLastResult({ ...result, counterfeitSuspected: true });
        navigate("/scan/result");
        return;
      }
      const ann = buildResultSpeechForVoice(
        result,
        settings.language,
        hasKannadaEngineVoice,
        settings.romanizedFallback,
      );
      setGuideText(ann.text);
      navigate("/scan/result");
    } catch {
      navigate("/scan/result?status=error");
    } finally {
      setScanning(false);
      autoCaptureBusyRef.current = false;
    }
  }, [addHistoryRecord, hasKannadaEngineVoice, navigate, preferences, scanning, settings, setLastResult, speak]);

  useEffect(() => {
    if (!preferences.autoScan || camState !== "active") return;
    const timer = window.setInterval(() => {
      const video = videoRef.current;
      if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !scanning) {
        void doScan(true);
      }
    }, 1800);
    return () => window.clearInterval(timer);
  }, [camState, doScan, preferences.autoScan, scanning]);

  const cameraActive = camState === "active";

  return (
    /* Full-viewport dark shell — sidebar pushes it on lg+ via pl-72 */
    <div className="flex min-h-screen flex-col bg-background-950 lg:flex-row lg:pl-72">

      {/* ================================================================
          CAMERA PANEL — fills screen on mobile, left 60% on desktop
          ================================================================ */}
      <div className="relative flex flex-1 flex-col overflow-hidden lg:min-h-screen">
        {/* Video stream */}
        {cameraActive ? (
          <video
            ref={videoRef}
            playsInline
            muted
            aria-label="Live camera preview"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background-950 px-8 text-center">
            <CamStateView state={camState} onRetry={startCamera} />
          </div>
        )}

        {/* Dark vignette + ambient glow */}
        {cameraActive && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-background-950/70 via-transparent to-background-950/85" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background-950/80 to-transparent" />
            {/* Scan ambient particles */}
            {scanning &&
              particles.map((p, i) => (
                <span
                  key={i}
                  className="absolute rounded-full bg-accent-400/60"
                  style={{
                    left: p.left,
                    top: p.top,
                    width: p.size,
                    height: p.size,
                    animation: `float ${3 + (i % 3)}s ease-in-out ${p.delay} infinite`,
                  }}
                />
              ))}
          </div>
        )}

        {/* ── TOP BAR ── */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-5">
          <button
            onClick={() => navigate("/home")}
            aria-label="Go back"
            className="glass-dark flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl text-background-50 transition-opacity hover:opacity-80"
          >
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          </button>

          {/* Currency + live indicator */}
          <div className="flex items-center gap-2">
            {cameraActive && (
              <span className="flex items-center gap-1.5 rounded-full border border-background-50/15 bg-background-950/50 px-3 py-1.5 text-xs font-bold backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-400" />
                </span>
                <span className="text-background-50">LIVE</span>
              </span>
            )}
            <span className="flex items-center gap-2 rounded-2xl border border-background-50/15 bg-background-950/50 px-4 py-2 text-sm font-bold backdrop-blur-md">
              <span aria-hidden="true" className="text-base">{currency.flag}</span>
              <span className="text-background-50">{currency.code}</span>
            </span>
          </div>

          <button
            onClick={toggleFlash}
            aria-label={flash ? "Turn flashlight off" : "Turn flashlight on"}
            aria-pressed={flash}
            className={`glass-dark flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl transition-all ${
              flash ? "text-accent-400 ring-1 ring-accent-400/40" : "text-background-50"
            }`}
          >
            {flash ? (
              <Flashlight aria-hidden="true" className="h-5 w-5" />
            ) : (
              <FlashlightOff aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* ── VIEWFINDER FRAME ── */}
        {cameraActive && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="relative h-52 w-40 lg:h-64 lg:w-52">
              {/* Frame border */}
              <div className="absolute inset-0 rounded-2xl border border-primary-400/40" />

              {/* Animated corner brackets */}
              <CornerBracket pos="tl" />
              <CornerBracket pos="tr" />
              <CornerBracket pos="bl" />
              <CornerBracket pos="br" />

              {/* Scan line */}
              {scanning && (
                <span className="absolute inset-x-2 h-0.5 animate-scan-line rounded-full bg-gradient-to-r from-transparent via-accent-400 to-transparent" />
              )}

              {/* Center crosshair */}
              {!scanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-6 w-6 opacity-40">
                    <div className="absolute left-1/2 top-0 h-full w-px -translate-x-px bg-primary-300" />
                    <div className="absolute left-0 top-1/2 h-px w-full -translate-y-px bg-primary-300" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BOTTOM MOBILE CONTROLS (hidden lg+) ── */}
        <div className="fixed inset-x-0 bottom-0 z-30 lg:hidden">
          {/* Guide text with waveform */}
          <div className="flex items-center gap-3 px-5 pb-2 pt-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center">
              {isSpeaking ? (
                <WaveformBars barCount={9} barClass="bg-primary-400" />
              ) : (
                <Volume2 aria-hidden="true" className="h-5 w-5 text-primary-300" />
              )}
            </div>
            <p aria-live="polite" className="text-sm font-medium leading-relaxed text-background-200">
              {guideText}
            </p>
          </div>

          {/* Mode chips */}
          <div className="flex gap-2 overflow-x-auto px-5 pb-3 no-scrollbar">
            {(["single", "multiple", "automatic"] as DetectionMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex shrink-0 cursor-pointer items-center rounded-full px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                  mode === m
                    ? "bg-primary-600 text-background-50"
                    : "border border-background-50/15 bg-background-50/5 text-background-200 hover:bg-background-50/10"
                }`}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          {/* Scan button row */}
          <div className="safe-bottom flex items-center justify-center gap-8 bg-background-950 px-5 pb-8 pt-4">
            <div className="w-16" />
            <ScanButton scanning={scanning} disabled={!cameraActive} onScan={doScan} />
            <button
              onClick={() => navigate("/preferences/currency")}
              aria-label="Scan settings"
              className="glass-dark flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl text-background-200"
            >
              <Sparkles aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================
          CONTROL PANEL — desktop only (right 40%)
          ================================================================ */}
      <aside
        aria-label="Scanner controls"
        className="hidden flex-col border-l border-background-50/10 bg-background-950 lg:flex lg:w-96 lg:shrink-0"
      >
        {/* Header */}
        <div className="border-b border-background-50/10 px-7 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold text-background-50">
                Scan Currency
              </h1>
              <p className="mt-0.5 text-sm text-background-300">
                Hold steady — AI will detect the note.
              </p>
            </div>
            <button
              onClick={() => navigate("/home")}
              aria-label="Exit scanner"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-background-50/15 text-background-300 transition-colors hover:bg-background-50/10"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-7 py-6">
          {/* Active currency */}
          <button
            onClick={() => navigate("/preferences/currency")}
            className="flex cursor-pointer items-center gap-3.5 rounded-2xl border border-background-50/10 bg-background-50/5 px-4 py-3.5 text-left transition-colors hover:bg-background-50/10"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-background-50/10 bg-background-50/5 text-3xl">
              {currency.flag}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-background-400">
                Detecting
              </p>
              <p className="mt-0.5 font-heading text-lg font-bold text-background-50">
                {currency.code} — {currency.name}
              </p>
            </div>
            <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-background-400" />
          </button>

          {/* Detection mode */}
          <div>
            <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-background-400">
              Detection Mode
            </p>
            <div className="flex flex-col gap-2">
              {(["single", "multiple", "automatic"] as DetectionMode[]).map((m) => {
                const active = mode === m;
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                      active
                        ? "bg-primary-600/20 ring-1 ring-primary-500/40"
                        : "border border-background-50/10 hover:bg-background-50/5"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                        active ? "border-primary-400 bg-primary-500" : "border-background-400"
                      }`}
                    >
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-background-50" />}
                    </span>
                    <span className={`text-sm font-semibold ${active ? "text-primary-200" : "text-background-200"}`}>
                      {MODE_LABELS[m]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice guide text */}
          <div className="rounded-2xl border border-background-50/10 bg-background-50/5 px-4 py-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-7 w-7 shrink-0">
                {isSpeaking ? (
                  <WaveformBars barCount={7} barClass="bg-primary-400" />
                ) : (
                  <Volume2 aria-hidden="true" className="h-5 w-5 text-primary-400" />
                )}
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-background-400">
                Voice Guide
              </p>
            </div>
            <p aria-live="polite" className="text-sm font-medium leading-relaxed text-background-200">
              {guideText}
            </p>
          </div>

          {/* Scanning tips */}
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-background-400">
              <Info aria-hidden="true" className="h-3.5 w-3.5" />
              Tips for best results
            </p>
            <ul className="space-y-2.5">
              {TIPS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary-500/15 text-primary-300">
                    <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm text-background-300">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Confidence threshold indicator */}
          <div className="rounded-2xl border border-background-50/10 bg-background-50/5 px-4 py-3.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-background-400">Confidence threshold</p>
              <span className="rounded-lg bg-primary-600/20 px-2.5 py-1 text-xs font-bold text-primary-300">
                {Math.round(preferences.confidenceThreshold * 100)}%
              </span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-background-50/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400"
                style={{ width: `${preferences.confidenceThreshold * 100}%` }}
              />
            </div>
          </div>

          {/* Counterfeit check shortcut */}
          <button
            onClick={() => navigate("/scan/counterfeit")}
            className="group flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-background-50/10 bg-background-50/5 px-4 py-3.5 text-left transition-colors hover:bg-background-50/10"
            aria-label="Open counterfeit detection"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-300">
              <ShieldCheck aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-background-100">Counterfeit Check</p>
              <p className="text-xs text-background-400">7-point AI security analysis</p>
            </div>
            <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-background-500" />
          </button>
        </div>

        {/* Desktop Scan CTA */}
        <div className="border-t border-background-50/10 px-7 py-6">
          <DesktopScanButton
            scanning={scanning}
            disabled={!cameraActive}
            onScan={doScan}
          />
          <p className="mt-3 text-center text-xs text-background-400">
            {scanning
              ? "AI recognition running…"
              : camState === "denied"
              ? "Camera access required"
              : "Press the button to begin recognition"}
          </p>
        </div>
      </aside>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Corner bracket for the viewfinder frame
   ───────────────────────────────────────────────────────────────────────────── */
type BracketPos = "tl" | "tr" | "bl" | "br";

function CornerBracket({ pos }: { pos: BracketPos }) {
  const base = "absolute h-8 w-8 lg:h-10 lg:w-10";
  const position =
    pos === "tl" ? "-left-1 -top-1" :
    pos === "tr" ? "-right-1 -top-1" :
    pos === "bl" ? "-bottom-1 -left-1" :
    "-bottom-1 -right-1";
  const rounding =
    pos === "tl" ? "rounded-tl-2xl border-l-[3px] border-t-[3px]" :
    pos === "tr" ? "rounded-tr-2xl border-r-[3px] border-t-[3px]" :
    pos === "bl" ? "rounded-bl-2xl border-b-[3px] border-l-[3px]" :
    "rounded-br-2xl border-b-[3px] border-r-[3px]";
  return (
    <span className={`${base} ${position} ${rounding} border-accent-400`} />
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Mobile scan button — large round pulsing CTA
   ───────────────────────────────────────────────────────────────────────────── */
function ScanButton({
  scanning,
  disabled,
  onScan,
}: {
  scanning: boolean;
  disabled: boolean;
  onScan: () => void;
}) {
  if (scanning) {
    return (
      <div
        role="status"
        className="relative flex h-20 w-20 items-center justify-center"
        aria-label="Scanning in progress"
      >
        <span aria-hidden="true" className="absolute inset-0 rounded-full border-4 border-primary-500/30" />
        <span aria-hidden="true" className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-accent-400" />
        <Loader2 aria-hidden="true" className="h-9 w-9 animate-spin text-primary-300" />
      </div>
    );
  }
  return (
    <button
      onClick={onScan}
      disabled={disabled}
      aria-label="Scan currency"
      className="relative flex h-20 w-20 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-background-50 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span aria-hidden="true" className="absolute inset-0 rounded-full animate-pulse-ring bg-primary-500/40" />
      <span aria-hidden="true" className="absolute inset-0 rounded-full border-4 border-primary-400/30" />
      <ScanLine aria-hidden="true" className="h-9 w-9" strokeWidth={2.5} />
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Desktop scan button — full-width, elongated
   ───────────────────────────────────────────────────────────────────────────── */
function DesktopScanButton({
  scanning,
  disabled,
  onScan,
}: {
  scanning: boolean;
  disabled: boolean;
  onScan: () => void;
}) {
  return (
    <button
      onClick={onScan}
      disabled={disabled || scanning}
      aria-label={scanning ? "Scanning in progress" : "Start scanning"}
      className="group relative flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 text-background-50 transition-all hover:from-primary-500 hover:to-primary-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {/* Shimmer on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-background-50/10 to-transparent transition-transform duration-500 group-hover:translate-x-full"
      />
      {scanning ? (
        <>
          <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin" />
          <span className="font-heading text-lg font-bold tracking-wide">Scanning…</span>
        </>
      ) : (
        <>
          <ScanLine aria-hidden="true" className="h-6 w-6" strokeWidth={2.5} />
          <span className="font-heading text-lg font-bold tracking-wide">Scan Currency</span>
        </>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Camera state fallback view
   ───────────────────────────────────────────────────────────────────────────── */
function CamStateView({
  state,
  onRetry,
}: {
  state: CamState;
  onRetry: () => void;
}) {
  const isError = state === "denied" || state === "secure" || state === "error";
  const text =
    state === "requesting"
      ? "Requesting camera access…"
      : state === "denied"
      ? "Camera permission denied"
      : state === "secure"
      ? "Secure connection required"
      : state === "error"
      ? "Camera unavailable"
      : "Starting camera…";
  const sub =
    state === "denied"
      ? "Allow camera access in your browser settings, then try again."
      : state === "secure"
      ? "Open the HTTPS address from the terminal, not an HTTP address. Camera access is blocked on phone HTTP pages."
      : state === "error"
      ? "Your device may not support camera access in this browser."
      : "Allow camera access so DhanDrishti can see the banknote.";

  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-3xl border ${
          isError
            ? "border-accent-700/40 bg-accent-900/40"
            : "border-primary-700/40 bg-primary-900/20"
        }`}
      >
        <Camera
          aria-hidden="true"
          className={`h-10 w-10 ${isError ? "text-accent-300" : "text-primary-300"}`}
        />
      </div>
      <h2 className="mt-6 font-heading text-xl font-bold text-background-50">{text}</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-background-300">
        <Sparkles aria-hidden="true" className="mr-1.5 inline h-4 w-4 align-middle text-accent-400" />
        {sub}
      </p>
      {isError && (
        <div className="mt-8 w-full max-w-xs">
          <Button
            size="lg"
            fullWidth
            onClick={onRetry}
            icon={<RotateCcw aria-hidden="true" className="h-5 w-5" />}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}