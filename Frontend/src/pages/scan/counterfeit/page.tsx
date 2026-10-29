import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ScanLine,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Camera,
  History as HistoryIcon,
  Phone,
} from "lucide-react";
import { useApp } from "@/context/AppProvider";
import { useVoice } from "@/context/VoiceProvider";
import { CURRENCY_MAP, getCurrency, type CurrencyCode } from "@/constants/currencies";
import { runCounterfeitCheck, getLocalizedLabel } from "@/services/counterfeit/counterfeitService";
import { checkResultMessage, verdictMessage, voiceMessage } from "@/services/voice/voiceMessages";
import { ReportSheet } from "@/pages/scan/counterfeit/ReportSheet";
import type { CounterfeitResult, SecurityCheck } from "@/types";

type Phase = "idle" | "scanning" | "analyzing" | "result";

// ─── Verdict config ───────────────────────────────────────────────────────────

const VERDICT_CONFIG = {
  authentic: {
    Icon: ShieldCheck,
    label: "Authentic",
    sublabel: "All security features verified",
    bg: "bg-gradient-to-br from-primary-700 to-primary-950",
    ring: "ring-primary-400/40",
    iconColor: "text-primary-200",
    badge: "bg-primary-600/30 text-primary-100 ring-1 ring-primary-400/30",
  },
  suspicious: {
    Icon: ShieldAlert,
    label: "Suspicious",
    sublabel: "One or more features need verification",
    bg: "bg-gradient-to-br from-accent-700 to-accent-950",
    ring: "ring-accent-400/40",
    iconColor: "text-accent-200",
    badge: "bg-accent-600/30 text-accent-100 ring-1 ring-accent-400/30",
  },
  counterfeit: {
    Icon: ShieldX,
    label: "Likely Counterfeit",
    sublabel: "Multiple security features failed",
    bg: "bg-gradient-to-br from-red-800 to-red-950",
    ring: "ring-red-400/40",
    iconColor: "text-red-200",
    badge: "bg-red-600/30 text-red-100 ring-1 ring-red-400/30",
  },
};

const CHECK_ICONS = {
  pass:      { Icon: CheckCircle2, color: "text-primary-500", bg: "bg-primary-50",   label: "PASS" },
  uncertain: { Icon: HelpCircle,   color: "text-accent-600",  bg: "bg-accent-50",    label: "CHECK" },
  fail:      { Icon: XCircle,      color: "text-red-500",     bg: "bg-red-50",       label: "FAIL" },
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CounterfeitCheck() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const spokenCount = useRef(0);

  const { preferences, addHistoryRecord } = useApp();
  const { speak } = useVoice();

  const [phase, setPhase] = useState<Phase>("idle");
  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState(false);
  const [result, setResult] = useState<CounterfeitResult | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);

  const requestedCurrency = searchParams.get("currency");
  const currencyCode: CurrencyCode = requestedCurrency && requestedCurrency in CURRENCY_MAP
    ? (requestedCurrency as CurrencyCode)
    : preferences.detectionCurrency;
  const requestedDenomination = Number(searchParams.get("denomination"));
  const denomination = Number.isFinite(requestedDenomination) && requestedDenomination > 0
    ? requestedDenomination
    : 500;
  const currency = getCurrency(currencyCode);

  // ── Camera setup ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setCamError(true); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        setCamReady(true);
        speak(voiceMessage("cameraReady", preferences.voice.language), "normal", preferences.voice.language);
      } catch { if (!cancelled) setCamError(true); }
    })();
    return () => { cancelled = true; streamRef.current?.getTracks().forEach((t) => t.stop()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sequential reveal (600 ms per check — long enough for voice to land) ──
  useEffect(() => {
    if (!result || phase !== "result") return;
    if (revealedCount >= result.checks.length) return;
    const t = setTimeout(() => setRevealedCount((n) => n + 1), 600);
    return () => clearTimeout(t);
  }, [result, revealedCount, phase]);

  // ── Voice: speak each check as it's revealed (with multilingual label) ──
  useEffect(() => {
    if (!result || phase !== "result" || revealedCount === 0) return;
    if (revealedCount <= spokenCount.current) return;
    spokenCount.current = revealedCount;

    const check = result.checks[revealedCount - 1];
    if (!check) return;

    // Use the user’s voice language for localised label (Kannada / Hindi / English)
    const voiceLang = preferences.voice.language ?? "en-IN";
    const localLabel = getLocalizedLabel(check.id, voiceLang, check.label);

    const tone =
      check.result === "fail"      ? "attention" :
      check.result === "uncertain" ? "warning"   : "normal";
    speak(checkResultMessage(localLabel, check.result, voiceLang), tone, voiceLang);
  }, [result, revealedCount, phase, speak, preferences.voice.language]);

  // ── Voice: final verdict after all checks are revealed ──
  useEffect(() => {
    if (!result || phase !== "result") return;
    if (revealedCount < result.checks.length) return;

    const passes = result.checks.filter((c) => c.result === "pass").length;
    const fails  = result.checks.filter((c) => c.result === "fail").length;
    const pct    = Math.round(result.overallConfidence * 100);
    const total  = result.checks.length;

    const t = setTimeout(() => {
      const voiceLang = preferences.voice.language ?? "en-IN";
      const msg = verdictMessage(result.verdict, total, passes, fails, pct, voiceLang);
      speak(msg, result.verdict === "counterfeit" ? "attention" : "confirmation", voiceLang);
    }, 900);

    return () => clearTimeout(t);
  }, [result, revealedCount, phase, speak]);

  // ── Start check ──
  const doCheck = async () => {
    if (!camReady || phase !== "idle") return;
    spokenCount.current = 0;
    setPhase("scanning");
    speak(voiceMessage("scanning", preferences.voice.language), "normal", preferences.voice.language);
    await new Promise((r) => setTimeout(r, 700));
    setPhase("analyzing");
    speak(voiceMessage("analysing", preferences.voice.language), "normal", preferences.voice.language);
    const data = await runCounterfeitCheck(currencyCode, denomination);
    await addHistoryRecord({
      id: crypto.randomUUID(),
      currency: data.currency,
      denomination: data.denomination,
      confidence: data.overallConfidence,
      status: "success",
      source: "counterfeit_check",
      counterfeitVerdict: data.verdict,
      createdAt: new Date().toISOString(),
    });
    setResult(data);
    setRevealedCount(0);
    setPhase("result");
    // Voice verdict will fire from the effects above after all checks are revealed
  };

  const reset = () => {
    setResult(null);
    setRevealedCount(0);
    spokenCount.current = 0;
    setPhase("idle");
  };

  // ── Report sheet ──
  if (reportOpen && result) {
    return <ReportSheet result={result} onClose={() => setReportOpen(false)} />;
  }

  // ── Result view ──
  if (phase === "result" && result) {
    return (
      <ResultView
        result={result}
        revealedCount={revealedCount}
        onReset={reset}
        onBack={() => navigate(-1)}
        onReport={() => setReportOpen(true)}
      />
    );
  }

  // ── Camera / analyzing view ──
  return (
    <div className="relative flex min-h-screen flex-col bg-background-950">
      {camReady && !camError && (
        <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" aria-label="Camera preview" />
      )}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background-950/75 via-transparent to-background-950/90" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-5">
        <button onClick={() => navigate(-1)} aria-label="Go back" className="glass-dark flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl text-background-50">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-background-400">DhanDrishti</p>
          <h1 className="font-heading text-lg font-bold text-background-50">Counterfeit Check</h1>
        </div>
        <span className="flex items-center gap-2 rounded-2xl border border-background-50/15 bg-background-950/50 px-3.5 py-2 text-sm font-bold backdrop-blur-md">
          <span aria-hidden="true" className="text-base">{currency.flag}</span>
          <span className="text-background-50">{currency.code}</span>
        </span>
      </div>

      {/* Viewfinder */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-48 w-72">
          <div className="absolute inset-0 rounded-2xl border border-secondary-400/40" />
          {(["tl", "tr", "bl", "br"] as const).map((p) => (
            <span
              key={p}
              className={`absolute h-8 w-8 border-secondary-400 ${
                p === "tl" ? "-left-0.5 -top-0.5 rounded-tl-xl border-l-[3px] border-t-[3px]" :
                p === "tr" ? "-right-0.5 -top-0.5 rounded-tr-xl border-r-[3px] border-t-[3px]" :
                p === "bl" ? "-bottom-0.5 -left-0.5 rounded-bl-xl border-b-[3px] border-l-[3px]" :
                             "-bottom-0.5 -right-0.5 rounded-br-xl border-b-[3px] border-r-[3px]"
              }`}
            />
          ))}
          {phase === "scanning" && (
            <span className="absolute inset-x-2 h-0.5 animate-scan-line rounded-full bg-gradient-to-r from-transparent via-secondary-400 to-transparent" />
          )}
          {phase === "idle" && (
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-background-950/70 px-3 py-1 text-xs font-semibold text-background-200 backdrop-blur-sm">
              Align note to fill the frame
            </span>
          )}
        </div>
      </div>

      {/* Camera error */}
      {camError && (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-accent-700/40 bg-accent-900/40">
            <Camera className="h-10 w-10 text-accent-300" />
          </div>
          <h2 className="font-heading text-xl font-bold text-background-50">Camera unavailable</h2>
          <p className="max-w-xs text-sm leading-relaxed text-background-300">
            Allow camera access in your browser settings, then reload the page.
          </p>
        </div>
      )}

      {/* Analysing overlay — with animated steps */}
      {phase === "analyzing" && (
        <AnalyzingOverlay currency={preferences.detectionCurrency} />
      )}

      {/* Bottom CTA */}
      <div className="relative z-10 mt-auto safe-bottom px-6 pb-10 pt-4">
        <button
          onClick={doCheck}
          disabled={!camReady || camError || phase !== "idle"}
          aria-label="Analyse note for counterfeit"
          className="group relative w-full cursor-pointer overflow-hidden rounded-2xl disabled:cursor-not-allowed disabled:opacity-40"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-secondary-600 via-secondary-500 to-secondary-600 transition-all duration-500 group-hover:from-secondary-500 group-hover:via-secondary-400 group-hover:to-secondary-500" />
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" aria-hidden="true" />
          <div className="relative flex h-16 items-center justify-center gap-3 px-7">
            {phase === "scanning" ? (
              <Loader2 className="h-6 w-6 animate-spin text-background-50" />
            ) : (
              <ScanLine className="h-6 w-6 text-background-50" strokeWidth={2.5} />
            )}
            <span className="font-heading text-lg font-bold tracking-wide text-background-50">
              {phase === "scanning" ? "Scanning…" : "Analyse Note"}
            </span>
          </div>
        </button>
        <p className="mt-3 text-center text-xs text-background-500">
          AI analysis checks 7 security features per note
        </p>
      </div>
    </div>
  );
}

// ─── Analysing overlay ────────────────────────────────────────────────────────

const STEP_LABELS_BY_CURRENCY: Record<string, string[]> = {
  INR: ["Gandhi Watermark", "Security Thread", "Colour-Shifting Ink", "Microprinting", "UV Fluorescence", "Serial Number", "Intaglio Print"],
  USD: ["Portrait Watermark", "Security Thread", "Colour-Shifting Ink", "3-D Security Ribbon", "Microprinting", "Serial Number", "Raised Print"],
  EUR: ["Hologram Strip", "Emerald Number", "Security Thread", "Watermark", "UV Ink", "Microprinting", "Raised Print"],
};
const DEFAULT_STEPS = ["Watermark", "Security Thread", "Special Inks", "Microprinting", "Serial Number", "Security Paper", "Raised Print"];

function AnalyzingOverlay({ currency }: { currency: string }) {
  const steps = STEP_LABELS_BY_CURRENCY[currency] ?? DEFAULT_STEPS;
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (activeStep >= steps.length) return;
    const t = setTimeout(() => setActiveStep((s) => s + 1), 300);
    return () => clearTimeout(t);
  }, [activeStep, steps.length]);

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-background-950/85 backdrop-blur-sm">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-secondary-700/40 bg-secondary-900/30">
        <Loader2 className="h-11 w-11 animate-spin text-secondary-300" />
      </div>
      <div className="text-center">
        <p className="font-heading text-xl font-bold text-background-50">Analysing…</p>
        <p className="mt-1 text-sm text-background-400">Checking all security features</p>
      </div>
      <div className="w-72 space-y-1.5">
        {steps.map((step, i) => (
          <div
            key={step}
            className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2 transition-all duration-300 ${
              i < activeStep  ? "bg-primary-900/40 text-primary-200" :
              i === activeStep ? "bg-secondary-900/50 text-background-100" :
              "text-background-600"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                i < activeStep  ? "bg-primary-400" :
                i === activeStep ? "animate-pulse bg-secondary-400" :
                "bg-background-700"
              }`}
            />
            <span className={`text-sm ${i === activeStep ? "font-bold" : "font-medium"}`}>
              {step}{i === activeStep ? "…" : i < activeStep ? " ✓" : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Result view ──────────────────────────────────────────────────────────────

function ResultView({
  result,
  revealedCount,
  onReset,
  onBack,
  onReport,
}: {
  result: CounterfeitResult;
  revealedCount: number;
  onReset: () => void;
  onBack: () => void;
  onReport: () => void;
}) {
  const navigate = useNavigate();
  const cfg = VERDICT_CONFIG[result.verdict];
  const VerdictIcon = cfg.Icon;
  const pct = Math.round(result.overallConfidence * 100);
  const currency = getCurrency(result.currency);
  const elapsed = (result.elapsedMs / 1000).toFixed(1);
  const totalRevealed = revealedCount;
  const total = result.checks.length;

  return (
    <div className="min-h-screen bg-background-50 pb-10">
      {/* Verdict hero */}
      <div className={`${cfg.bg} px-5 pb-8 pt-5 ring-1 ring-inset ${cfg.ring}`}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} aria-label="Go back" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-background-50/10 text-background-50 transition-colors hover:bg-background-50/20">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="text-sm font-semibold text-background-200">Counterfeit Check · Result</p>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-background-50/10 ring-1 ring-inset ${cfg.ring}`}>
            <VerdictIcon className={`h-9 w-9 ${cfg.iconColor}`} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-background-300">Verdict</p>
            <h2 className="font-heading text-3xl font-bold text-background-50">{cfg.label}</h2>
            <p className="mt-0.5 text-sm text-background-300">{cfg.sublabel}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${cfg.badge}`}>{pct}% confidence</span>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${cfg.badge}`}>{currency.flag} {currency.code}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${cfg.badge}`}>{elapsed}s scan</span>
          {result.verdict === "suspicious" && (
            <span className="flex items-center gap-1 rounded-full bg-background-50/10 px-3 py-1 text-xs font-bold text-accent-200 ring-1 ring-accent-400/30">
              <AlertTriangle className="h-3 w-3" /> Verify with a bank
            </span>
          )}
        </div>

        {/* Reveal progress */}
        {totalRevealed < total && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-background-400">Reviewing checks…</p>
              <p className="text-xs font-bold text-background-200">{totalRevealed}/{total}</p>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-background-50/10">
              <div
                className="h-full rounded-full bg-background-50/40 transition-all duration-500"
                style={{ width: `${(totalRevealed / total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Security checks */}
      <div className="px-5 py-6">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground-500">
          Security Feature Analysis
        </h3>
        <ul className="space-y-2.5">
          {result.checks.map((check, i) => (
            <SecurityCheckItem key={check.id} check={check} visible={i < revealedCount} />
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="space-y-3 px-5">
        <button
          onClick={onReset}
          className="group relative w-full cursor-pointer overflow-hidden rounded-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 transition-all duration-500 group-hover:from-primary-500 group-hover:via-primary-400 group-hover:to-primary-500" />
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" aria-hidden="true" />
          <div className="relative flex h-14 items-center justify-center gap-2 px-6">
            <RotateCcw className="h-5 w-5 text-background-50" />
            <span className="font-semibold text-background-50">Check Another Note</span>
          </div>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/history")}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-background-200 bg-background-50 py-3 text-sm font-semibold text-foreground-800 transition-colors hover:bg-background-100"
          >
            <HistoryIcon className="h-4 w-4" /> History
          </button>
          <button
            onClick={onReport}
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors ${
              result.verdict === "counterfeit"
                ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                : "border border-background-200 bg-background-50 text-foreground-800 hover:bg-background-100"
            }`}
          >
            <Phone className="h-4 w-4" />
            {result.verdict === "counterfeit" ? "Report" : "Report Info"}
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="mx-5 mt-6 rounded-xl bg-background-100 px-4 py-3 text-xs leading-relaxed text-foreground-500">
        This AI analysis is for assistance only. For legal or commercial decisions, always consult an authorised bank or currency verification service.
      </p>
    </div>
  );
}

// ─── Security check row ───────────────────────────────────────────────────────

function SecurityCheckItem({ check, visible }: { check: SecurityCheck; visible: boolean }) {
  const vis = CHECK_ICONS[check.result];
  const CheckIcon = vis.Icon;
  const confPct = Math.round(check.confidence * 100);

  return (
    <li
      className={`surface flex items-center gap-3.5 overflow-hidden rounded-2xl px-4 py-3 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${vis.bg}`}>
        <CheckIcon className={`h-5 w-5 ${vis.color}`} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground-950">{check.label}</p>
        <p className="truncate text-xs text-foreground-500">{check.description}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
          check.result === "pass"      ? "bg-primary-50 text-primary-700" :
          check.result === "uncertain" ? "bg-accent-50 text-accent-700" :
          "bg-red-50 text-red-700"
        }`}>
          {vis.label}
        </span>
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-16 overflow-hidden rounded-full bg-background-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                check.result === "pass"      ? "bg-primary-500" :
                check.result === "uncertain" ? "bg-accent-500" :
                "bg-red-400"
              }`}
              style={{ width: `${confPct}%` }}
            />
          </div>
          <span className="w-7 text-right text-[10px] font-semibold text-foreground-500">{confPct}%</span>
        </div>
      </div>
    </li>
  );
}