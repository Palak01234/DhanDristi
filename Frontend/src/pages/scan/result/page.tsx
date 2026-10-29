import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  Coins,
  ArrowLeft,
  ArrowRight,
  Repeat,
  ScanLine,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/base/Button";
import { Card } from "@/components/base/Card";
import { useApp } from "@/context/AppProvider";
import { useVoice } from "@/context/VoiceProvider";
import { getCurrency, formatAmount } from "@/constants/currencies";
import { buildConversionSpeechForVoice, buildResultSpeechForVoice } from "@/services/inference/resultSpeech";
import { convertLive } from "@/services/converter/convertService";
import type { DetectionResult, DetectedNote, VoiceTone } from "@/types";

function toneFor(result: DetectionResult): VoiceTone {
  if (result.counterfeitSuspected) return "attention";
  if (result.status === "error") return "error";
  if (result.status === "low_confidence") return "warning";
  if (result.status === "wrong_currency") return "attention";
  return "confirmation";
}

function noteLabel(note: DetectedNote): string {
  const cur = getCurrency(note.currency);
  return `${cur.name} ${cur.symbol}${note.denomination}`;
}

export default function Result() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lastResult, preferences } = useApp();
  const { speak, speakResult, stop, settings, isSpeaking, hasKannadaEngineVoice } = useVoice();

  const isErrorRoute = searchParams.get("status") === "error";
  const result = useMemo<DetectionResult>(
    () => isErrorRoute || !lastResult ? { status: "error", currencies: [] } : lastResult,
    [isErrorRoute, lastResult],
  );

  useEffect(() => {
    const note = result.currencies[0];
    if (!note || (!result.counterfeitSuspected && result.status !== "success") || !settings.autoSpeak) return;

    let cancelled = false;
    const announceResult = async () => {
      const announcement = buildResultSpeechForVoice(result, settings.language, hasKannadaEngineVoice, settings.romanizedFallback);
      const targetCode = preferences.conversionCurrency;
      const conversionPromise = convertLive({
        from: getCurrency(note.currency),
        amount: note.denomination,
        to: getCurrency(targetCode),
      });
      await speak(announcement.text, toneFor(result), announcement.lang);
      if (result.counterfeitSuspected) return;
      const conversion = await conversionPromise;
      if (cancelled) return;
      const conversionSpeech = buildConversionSpeechForVoice(
        note.currency,
        note.denomination,
        targetCode,
        conversion.amount,
        settings.language,
      );
      await speak(conversionSpeech.text, "confirmation", conversionSpeech.lang);
    };
    void announceResult();
    return () => {
      cancelled = true;
    };
  }, [hasKannadaEngineVoice, preferences.conversionCurrency, result, settings.autoSpeak, settings.language, settings.romanizedFallback, speak]);

  const handleSpeak = () => {
    if (isSpeaking) stop();
    else {
      const ann = buildResultSpeechForVoice(result, settings.language, hasKannadaEngineVoice, settings.romanizedFallback);
      speakResult(ann.text, toneFor(result), ann.lang);
    }
  };

  const handleScanAgain = () => navigate("/scan", { replace: true });
  const handleConvert = () => navigate(`/convert?amount=${primaryNote?.denomination ?? 0}&from=${primaryNote?.currency ?? preferences.detectionCurrency}`);

  const isSuccess = result.status === "success";
  const primaryNote = result.currencies[0] ?? null;
  const confidence = primaryNote ? primaryNote.confidence : 0;

  return (
    <div className="app-bg relative min-h-screen pb-10">
      {/* Mobile / narrow header */}
      <header className="flex items-center gap-3 px-5 pt-7 lg:hidden">
        <button
          onClick={() => navigate("/scan", { replace: true })}
          aria-label="Go back to scanner"
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-background-200 bg-background-50 text-foreground-800 transition-colors hover:bg-background-100"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </button>
        <h1 className="font-heading text-2xl font-bold text-foreground-950">Detection Result</h1>
      </header>

      {/* ----------------------------------------------------------------
          Desktop two-panel layout
          Left panel  = main result card (full visual, denomination, notes)
          Right panel = confidence ring + quick stats + action CTA stack
          ---------------------------------------------------------------- */}
      <div className="hidden lg:block">
        {/* Breadcrumb row */}
        <div className="flex items-center gap-2 px-8 pt-5">
          <button
            onClick={() => navigate("/scan", { replace: true })}
            aria-label="Back to scanner"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-background-200 bg-background-50 text-foreground-600 transition-colors hover:bg-background-100"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          <span className="text-sm text-foreground-500">Scanner</span>
          <span className="text-sm text-foreground-300">/</span>
          <span className="text-sm font-semibold text-foreground-950">Result</span>
        </div>

        <div className="grid min-h-[calc(100vh-8rem)] grid-cols-5 gap-8 px-8 pb-10 pt-6 xl:grid-cols-3">
          {/* Left: main result card — occupies 3/5 on xl-down, 2/3 on xl+ */}
          <section
            aria-live="polite"
            aria-label="Detection result"
            className="col-span-3 animate-fade-up xl:col-span-2"
          >
            <ResultPanel result={result} primaryNote={primaryNote} preferences={preferences} />
          </section>

          {/* Right: confidence + metadata + actions */}
          <aside
            className="col-span-2 flex flex-col gap-5 xl:col-span-1"
            aria-label="Confidence and actions"
          >
            {/* Confidence ring card */}
            <div className="surface rounded-2xl p-6 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-foreground-500">AI Confidence</p>
              <div className="mt-5 flex justify-center">
                <ConfidenceRing value={confidence} size={180} />
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground-600">
                {confidence >= 0.9 ? "Excellent — highly reliable result." :
                 confidence >= 0.75 ? "Good — reliable for most uses." :
                 confidence >= 0.55 ? "Moderate — verify before transacting." :
                 "Low — please rescan under better conditions."}
              </p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatTile
                icon={<TrendingUp aria-hidden="true" className="h-4 w-4" />}
                label="Match score"
                value={`${Math.round(confidence * 100)}%`}
                tone={confidence >= 0.85 ? "ok" : confidence >= 0.65 ? "warn" : "off"}
              />
              <StatTile
                icon={<Zap aria-hidden="true" className="h-4 w-4" />}
                label="Elapsed"
                value={result.elapsedMs ? `${result.elapsedMs}ms` : "—"}
                tone="info"
              />
            </div>

            {/* Metadata */}
            {primaryNote && (
              <div className="surface rounded-2xl px-5 py-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-foreground-500">Details</p>
                <dl className="space-y-2.5">
                  <MetaRow label="Currency" value={getCurrency(primaryNote.currency).name} />
                  <MetaRow label="Code" value={primaryNote.currency} />
                  <MetaRow
                    label="Denomination"
                    value={getCurrency(primaryNote.currency).symbol + primaryNote.denomination}
                  />
                  <MetaRow
                    label="Status"
                    value={
                      result.status === "success" ? "Detected" :
                      result.counterfeitSuspected ? "Possible counterfeit" :
                      result.status === "low_confidence" ? "Low confidence" :
                      result.status === "wrong_currency" ? "Currency mismatch" : "Error"
                    }
                  />
                </dl>
              </div>
            )}

            {/* CTA stack */}
            <div className="mt-auto flex flex-col gap-3">
              <Button
                size="xl"
                fullWidth
                onClick={handleSpeak}
                icon={
                  isSpeaking ? (
                    <VolumeX aria-hidden="true" className="h-5 w-5" />
                  ) : (
                    <Volume2 aria-hidden="true" className="h-5 w-5" />
                  )
                }
                ariaLabel={isSpeaking ? "Stop speaking" : "Speak result"}
              >
                {isSpeaking ? "Stop" : "Speak Result"}
              </Button>

              {isSuccess && (
                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  onClick={handleConvert}
                  icon={<Coins aria-hidden="true" className="h-5 w-5" />}
                >
                  Convert Amount
                </Button>
              )}

              <Button
                variant="ghost"
                size="lg"
                fullWidth
                onClick={handleScanAgain}
                icon={<ScanLine aria-hidden="true" className="h-5 w-5" />}
              >
                Scan Again
              </Button>
            </div>
          </aside>
        </div>
      </div>

      {/* ----------------------------------------------------------------
          Mobile layout (original narrow flow)
          ---------------------------------------------------------------- */}
      <main className="flex flex-1 flex-col gap-4 px-5 pt-4 lg:hidden">
        <section aria-live="polite" className="animate-fade-up">
          {result.status === "success" && result.currencies.length > 1 && <MultipleResult result={result} />}
          {result.status === "success" && result.currencies.length === 1 && <SingleResult note={result.currencies[0]} />}
          {result.status === "low_confidence" && <LowConfidence result={result} />}
          {result.status === "wrong_currency" && (
            <WrongCurrency result={result} selectedCurrency={preferences.detectionCurrency} />
          )}
          {result.status === "error" && <ErrorResult />}
        </section>

        <div className="mt-auto flex flex-col gap-3">
          <Button
            size="xl"
            fullWidth
            onClick={handleSpeak}
            icon={
              isSpeaking ? (
                <VolumeX aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Volume2 aria-hidden="true" className="h-5 w-5" />
              )
            }
            ariaLabel={isSpeaking ? "Stop speaking" : "Speak result"}
          >
            {isSpeaking ? "Stop" : "Speak Result"}
          </Button>

          {result.status !== "error" && (
            <Button
              variant="outline"
              size="lg"
              fullWidth
              onClick={handleConvert}
              icon={<Coins aria-hidden="true" className="h-5 w-5" />}
            >
              Convert
            </Button>
          )}

          <Button
            variant="ghost"
            size="lg"
            fullWidth
            onClick={handleScanAgain}
            icon={<RefreshCcw aria-hidden="true" className="h-5 w-5" />}
          >
            Scan Again
          </Button>
        </div>
      </main>
    </div>
  );
}

/* -----------------------------------------------------------------------
   Desktop: full left panel — picks the correct result sub-view
   ----------------------------------------------------------------------- */
function ResultPanel({
  result,
  primaryNote,
  preferences,
}: {
  result: DetectionResult;
  primaryNote: DetectedNote | null;
  preferences: { detectionCurrency: string };
}) {
  if (result.status === "success" && result.currencies.length > 1)
    return <MultipleResultDesktop result={result} />;
  if (result.status === "success" && result.currencies.length === 1 && primaryNote)
    return <SingleResultDesktop note={primaryNote} />;
  if (result.status === "low_confidence")
    return <LowConfidenceDesktop result={result} />;
  if (result.status === "wrong_currency")
    return <WrongCurrencyDesktop result={result} selectedCurrency={preferences.detectionCurrency} />;
  return <ErrorResultDesktop />;
}

/* -----------------------------------------------------------------------
   Confidence ring (shared)
   ----------------------------------------------------------------------- */
function ConfidenceRing({
  value,
  size = 164,
  dark = false,
}: {
  value: number;
  size?: number;
  dark?: boolean;
}) {
  const clamped = Math.max(0, Math.min(1, value));
  const deg = clamped * 360;
  return (
    <div
      className="relative rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(oklch(var(--primary-500)) ${deg}deg, oklch(var(--background-200)) ${deg}deg)`,
      }}
      role="img"
      aria-label={`${Math.round(clamped * 100)} percent confidence`}
    >
      <div
        className={`absolute inset-[12px] flex flex-col items-center justify-center rounded-full ${
          dark ? "bg-background-950" : "bg-background-50"
        }`}
      >
        <span
          className={`font-heading text-4xl font-bold ${dark ? "text-background-50" : "text-foreground-950"}`}
        >
          {Math.round(clamped * 100)}%
        </span>
        <span className={`text-xs ${dark ? "text-background-200" : "text-foreground-600"}`}>
          confidence
        </span>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------
   Stat tile
   ----------------------------------------------------------------------- */
type Tone = "ok" | "warn" | "off" | "info";

const STAT_TONES: Record<Tone, string> = {
  ok: "bg-primary-50 text-primary-700 ring-1 ring-primary-200",
  warn: "bg-accent-50 text-accent-800 ring-1 ring-accent-200",
  off: "bg-background-100 text-foreground-600",
  info: "bg-secondary-50 text-secondary-800 ring-1 ring-secondary-200",
};

function StatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div className={`flex flex-col items-start rounded-2xl p-4 ${STAT_TONES[tone]}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-background-50/30">
        {icon}
      </span>
      <p className="mt-3 text-xs font-semibold opacity-70">{label}</p>
      <p className="font-heading text-2xl font-bold">{value}</p>
    </div>
  );
}

/* -----------------------------------------------------------------------
   Metadata row
   ----------------------------------------------------------------------- */
function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-foreground-500">{label}</dt>
      <dd className="text-sm font-bold text-foreground-950">{value}</dd>
    </div>
  );
}

/* -----------------------------------------------------------------------
   Desktop result sub-views (rich, full-height panels)
   ----------------------------------------------------------------------- */
function SingleResultDesktop({ note }: { note: DetectedNote }) {
  const cur = getCurrency(note.currency);
  return (
    <div className="flex h-full min-h-[480px] flex-col overflow-hidden rounded-3xl bg-background-950">
      {/* Header band */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 px-8 pt-8 pb-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-background-50/10 px-4 py-1.5 text-xs font-bold text-primary-100 ring-1 ring-background-50/15">
            <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
            Successfully detected
          </span>
          <p className="mt-6 flex items-center gap-3 text-lg font-semibold text-background-200">
            <span aria-hidden="true" className="text-3xl">{cur.flag}</span>
            {cur.name}
          </p>
          <p className="mt-1 font-heading text-7xl font-bold tracking-tight text-background-50">
            {formatAmount(note.currency, note.denomination)}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 py-8">
        <ConfidenceRing value={note.confidence} size={200} dark />
        <p className="max-w-xs text-center text-sm text-background-200">
          The AI model matched this note with{" "}
          <strong className="text-background-50">{Math.round(note.confidence * 100)}%</strong>{" "}
          confidence. The result is highly reliable.
        </p>
      </div>
    </div>
  );
}

function MultipleResultDesktop({ result }: { result: DetectionResult }) {
  const notes = result.currencies;
  return (
    <div className="flex h-full min-h-[480px] flex-col overflow-hidden rounded-3xl bg-background-950">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 px-8 pt-8 pb-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-background-50/10 px-4 py-1.5 text-xs font-bold text-primary-100 ring-1 ring-background-50/15">
            <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
            {notes.length} notes detected
          </span>
          <p className="mt-6 font-heading text-5xl font-bold text-background-50">
            {formatAmount(notes[0]?.currency ?? "INR", result.total ?? 0)}
          </p>
          <p className="mt-1 text-sm text-background-200">Total detected value</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-background-400">Breakdown</p>
        <ul className="space-y-3">
          {notes.map((note, i) => {
            const cur = getCurrency(note.currency);
            return (
              <li key={i} className="flex items-center justify-between rounded-2xl bg-background-50/10 px-5 py-3.5">
                <span className="flex items-center gap-3 text-sm font-semibold text-background-50">
                  <span aria-hidden="true" className="text-2xl">{cur.flag}</span>
                  {formatAmount(note.currency, note.denomination)}
                </span>
                <span className="rounded-full bg-primary-500/20 px-2.5 py-1 text-xs font-bold text-primary-200">
                  {Math.round(note.confidence * 100)}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function LowConfidenceDesktop({ result }: { result: DetectionResult }) {
  const note = result.currencies[0];
  const confidence = note ? note.confidence : 0;
  const reasons = result.possibleReasons?.length
    ? result.possibleReasons
    : ["Poor lighting", "Note at a sharp angle", "Partial or folded note"];

  return (
    <div className="flex h-full min-h-[480px] flex-col overflow-hidden rounded-3xl border border-background-200 bg-background-50">
      {/* Header */}
      <div className="bg-accent-50 px-8 py-8 ring-1 ring-accent-200">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-100 px-4 py-1.5 text-xs font-bold text-accent-900 ring-1 ring-accent-200">
          <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
          {result.counterfeitSuspected ? "Possible counterfeit" : "Detection uncertain"}
        </span>
        {note && (
          <p className="mt-5 font-heading text-4xl font-bold text-foreground-950">
            {noteLabel(note)}
          </p>
        )}
        <p className="mt-1 text-sm text-foreground-600">
          {result.counterfeitSuspected
            ? "The confidence score is below 75%. Verify the note's security features."
            : "This is not a claim of counterfeit — the scan was simply unclear."}
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 py-8">
        <ConfidenceRing value={confidence} size={200} />
        <div className="w-full rounded-2xl bg-accent-50 p-5 ring-1 ring-accent-200">
          <p className="mb-3 text-xs font-bold text-foreground-800">Possible reasons:</p>
          <ul className="space-y-2">
            {reasons.map((reason) => (
              <li key={reason} className="flex items-center gap-2.5 text-sm text-foreground-600">
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function WrongCurrencyDesktop({
  result,
  selectedCurrency,
}: {
  result: DetectionResult;
  selectedCurrency: string;
}) {
  const navigate = useNavigate();
  const detected = result.currencies[0];
  const detectedCur = detected ? getCurrency(detected.currency) : null;
  const selectedCur = getCurrency(selectedCurrency);

  return (
    <div className="flex h-full min-h-[480px] flex-col overflow-hidden rounded-3xl border border-background-200 bg-background-50">
      <div className="bg-accent-50 px-8 py-8 ring-1 ring-accent-200">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-100 px-4 py-1.5 text-xs font-bold text-accent-900 ring-1 ring-accent-200">
          <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
          Currency mismatch
        </span>
        <p className="mt-5 text-sm text-foreground-700">
          This appears to be a different currency than you selected.
        </p>
      </div>

      <div className="flex-1 px-8 py-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-background-100 p-5 text-center ring-1 ring-background-200">
            <p className="text-xs font-bold text-foreground-500">Selected</p>
            <div className="mt-3 flex justify-center text-5xl" aria-hidden="true">
              {selectedCur.flag}
            </div>
            <p className="mt-2 font-heading text-xl font-bold text-foreground-950">{selectedCur.code}</p>
            <p className="text-xs text-foreground-600">{selectedCur.name}</p>
          </div>
          <div className="rounded-2xl bg-accent-50 p-5 text-center ring-1 ring-accent-200">
            <p className="text-xs font-bold text-accent-700">Detected</p>
            <div className="mt-3 flex justify-center text-5xl" aria-hidden="true">
              {detectedCur?.flag}
            </div>
            <p className="mt-2 font-heading text-xl font-bold text-foreground-950">{detectedCur?.code}</p>
            <p className="text-xs text-foreground-600">{detectedCur?.name}</p>
          </div>
        </div>
        {detectedCur && detected && (
          <p className="mt-6 font-heading text-3xl font-bold text-foreground-950">
            {formatAmount(detected.currency, detected.denomination)}
          </p>
        )}

        <Button
          className="mt-6"
          variant="outline"
          size="lg"
          fullWidth
          onClick={() => navigate("/preferences/currency?from=result")}
          icon={<Repeat aria-hidden="true" className="h-5 w-5" />}
          iconRight={<ArrowRight aria-hidden="true" className="h-5 w-5" />}
        >
          Change Detection Currency
        </Button>
      </div>
    </div>
  );
}

function ErrorResultDesktop() {
  return (
    <div className="flex h-full min-h-[480px] flex-col items-center justify-center rounded-3xl border border-background-200 bg-background-50 px-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-50 ring-1 ring-accent-200">
        <AlertTriangle aria-hidden="true" className="h-8 w-8 text-accent-700" />
      </span>
      <h2 className="mt-6 font-heading text-2xl font-bold text-foreground-950">Recognition Error</h2>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-foreground-600">
        Sorry, something went wrong while recognizing the currency. Make sure the note is well-lit and clearly visible.
      </p>
    </div>
  );
}

/* -----------------------------------------------------------------------
   Mobile-only result sub-views (narrow column, unchanged)
   ----------------------------------------------------------------------- */
function SingleResult({ note }: { note: DetectedNote }) {
  const cur = getCurrency(note.currency);
  return (
    <Card className="flex flex-col items-center border-background-50/10 bg-background-950 py-9 text-center">
      <span className="flex items-center gap-2 rounded-full bg-primary-500/20 px-4 py-1.5 text-xs font-bold text-primary-200">
        <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
        Successfully detected
      </span>
      <p className="mt-5 flex items-center gap-3 text-base font-semibold text-background-200">
        <span aria-hidden="true" className="text-2xl">{cur.flag}</span>
        {cur.name}
      </p>
      <p className="mt-2 font-heading text-6xl font-bold text-background-50">
        {formatAmount(note.currency, note.denomination)}
      </p>
      <div className="mt-6">
        <ConfidenceRing value={note.confidence} dark />
      </div>
    </Card>
  );
}

function MultipleResult({ result }: { result: DetectionResult }) {
  const notes = result.currencies;
  return (
    <Card className="flex flex-col items-center border-background-50/10 bg-background-950 py-8 text-center">
      <span className="flex items-center gap-2 rounded-full bg-primary-500/20 px-4 py-1.5 text-xs font-bold text-primary-200">
        <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
        {notes.length} notes detected
      </span>
      <div className="mt-6 w-full space-y-2.5">
        {notes.map((note, i) => {
          const cur = getCurrency(note.currency);
          return (
            <div key={i} className="flex items-center justify-between rounded-xl bg-background-50/10 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-background-50">
                <span aria-hidden="true">{cur.flag}</span>
                {formatAmount(note.currency, note.denomination)}
              </span>
              <span className="text-xs font-bold text-accent-400">{Math.round(note.confidence * 100)}%</span>
            </div>
          );
        })}
      </div>
      <div className="mt-6 w-full border-t border-background-50/15 pt-5">
        <p className="text-xs text-background-200">Total value</p>
        <p className="mt-1 font-heading text-5xl font-bold text-background-50">
          {formatAmount(notes[0]?.currency ?? "INR", result.total ?? 0)}
        </p>
      </div>
    </Card>
  );
}

function LowConfidence({ result }: { result: DetectionResult }) {
  const note = result.currencies[0];
  const confidence = note ? note.confidence : 0;
  const reasons = result.possibleReasons?.length
    ? result.possibleReasons
    : ["Poor lighting", "Note at a sharp angle", "Partial or folded note"];
  return (
    <Card className="flex flex-col items-center py-8 text-center">
      <span className="flex items-center gap-2 rounded-full bg-accent-50 px-4 py-1.5 text-xs font-bold text-accent-900 ring-1 ring-accent-200">
        <AlertTriangle aria-hidden="true" className="h-4 w-4" />
        {result.counterfeitSuspected ? "Possible counterfeit" : "Detection uncertain"}
      </span>
      {note && <p className="mt-5 text-base font-semibold text-foreground-700">Possibly {noteLabel(note)}</p>}
      <div className="mt-4">
        <ConfidenceRing value={confidence} />
      </div>
      <p className="mt-5 text-sm text-foreground-600">
        {result.counterfeitSuspected
          ? "The confidence score is below 75%. Verify the note's security features."
          : "This is not a claim of counterfeit — the scan was simply unclear."}
      </p>
      <div className="mt-5 w-full rounded-xl bg-accent-50 p-4 text-left ring-1 ring-accent-200">
        <p className="text-xs font-bold text-foreground-800">Possible reasons:</p>
        <ul className="mt-2 space-y-1.5">
          {reasons.map((reason) => (
            <li key={reason} className="flex items-center gap-2 text-xs text-foreground-600">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent-500" />
              {reason}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function WrongCurrency({ result, selectedCurrency }: { result: DetectionResult; selectedCurrency: string }) {
  const navigate = useNavigate();
  const detected = result.currencies[0];
  const detectedCur = detected ? getCurrency(detected.currency) : null;
  const selectedCur = getCurrency(selectedCurrency);
  return (
    <Card className="flex flex-col items-center py-8 text-center">
      <span className="flex items-center gap-2 rounded-full bg-accent-50 px-4 py-1.5 text-xs font-bold text-accent-900 ring-1 ring-accent-200">
        <AlertTriangle aria-hidden="true" className="h-4 w-4" />
        Currency mismatch
      </span>
      <p className="mt-5 text-sm text-foreground-700">
        This appears to be a different currency than you selected.
      </p>
      <div className="mt-6 grid w-full grid-cols-2 gap-3">
        <div className="rounded-xl bg-background-100 p-4">
          <p className="text-xs font-bold text-foreground-600">Selected</p>
          <div className="mt-2 flex items-center justify-center text-3xl" aria-hidden="true">
            {selectedCur.flag}
          </div>
          <p className="mt-1 text-sm font-bold text-foreground-950">{selectedCur.code}</p>
          <p className="text-[11px] text-foreground-600">{selectedCur.name}</p>
        </div>
        <div className="rounded-xl bg-accent-50 p-4 ring-1 ring-accent-200">
          <p className="text-xs font-bold text-accent-700">Detected</p>
          <div className="mt-2 flex items-center justify-center text-3xl" aria-hidden="true">
            {detectedCur?.flag}
          </div>
          <p className="mt-1 text-sm font-bold text-foreground-950">{detectedCur?.code}</p>
          <p className="text-[11px] text-foreground-600">{detectedCur?.name}</p>
        </div>
      </div>
      {detectedCur && detected && (
        <p className="mt-4 text-lg font-bold text-foreground-950">
          {formatAmount(detected.currency, detected.denomination)}
        </p>
      )}
      <div className="mt-6 flex w-full flex-col gap-3">
        <Button
          variant="outline"
          size="lg"
          fullWidth
          onClick={() => navigate("/preferences/currency?from=result")}
          icon={<Repeat aria-hidden="true" className="h-5 w-5" />}
          iconRight={<ArrowRight aria-hidden="true" className="h-5 w-5" />}
        >
          Change Currency
        </Button>
      </div>
    </Card>
  );
}

function ErrorResult() {
  return (
    <Card className="flex flex-col items-center py-9 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50 ring-1 ring-accent-200">
        <AlertTriangle aria-hidden="true" className="h-7 w-7 text-accent-700" />
      </span>
      <h2 className="mt-5 text-xl font-bold text-foreground-950">Recognition Error</h2>
      <p className="mt-3 text-sm text-foreground-700">
        Sorry, something went wrong while recognizing the currency. Please try again.
      </p>
    </Card>
  );
}
