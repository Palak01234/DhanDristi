import { type ChangeEvent, useRef, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Check,
  Phone,
  Camera,
  ExternalLink,
  ShieldX,
  AlertTriangle,
  X,
} from "lucide-react";
import { getCurrency } from "@/constants/currencies";
import type { CounterfeitResult } from "@/types";

// ─── Per-currency reporting info ──────────────────────────────────────────────

interface AuthorityInfo {
  authority: string;
  hotline: string;
  hotlineLabel: string;
  steps: string[];
}

const AUTHORITY: Record<string, AuthorityInfo> = {
  INR: {
    authority: "Reserve Bank of India",
    hotline: "14440",
    hotlineLabel: "RBI Customer Helpline",
    steps: [
      "Do not attempt to use or pass on the note",
      "Keep the note in a separate envelope — avoid handling",
      "Deposit it at any bank branch for verification",
      "Ask the bank to send it to RBI under the Forged Note Vigilance Cell",
      "File an FIR with local police if the passer is known",
    ],
  },
  USD: {
    authority: "U.S. Secret Service",
    hotline: "1-800-827-3848",
    hotlineLabel: "Secret Service Hotline",
    steps: [
      "Do not return the note to the person who gave it to you",
      "Record all details about the passer and circumstances",
      "Place the note in an envelope without folding or crumpling",
      "Surrender the note to local police or the Secret Service",
      "Report online at reportfraud.ftc.gov",
    ],
  },
  EUR: {
    authority: "European Central Bank / National Central Bank",
    hotline: "+49 69 1344 0",
    hotlineLabel: "ECB General Enquiries",
    steps: [
      "Do not circulate the note further",
      "Take the note to the nearest bank or police station",
      "The bank will authenticate and report it to the national central bank",
      "Note details of where and how you received it",
    ],
  },
  GBP: {
    authority: "Bank of England / Action Fraud",
    hotline: "0300 123 2040",
    hotlineLabel: "Action Fraud Hotline",
    steps: [
      "Do not try to pass the note on",
      "Hand the note to your local police or bank",
      "Report the incident to Action Fraud",
      "Record any details about where you received it",
    ],
  },
  PHP: {
    authority: "Bangko Sentral ng Pilipinas",
    hotline: "+632 8708-7087",
    hotlineLabel: "BSP Consumer Protection",
    steps: [
      "Do not accept or pass the suspicious note",
      "Bring it to the nearest BSP branch or any bank",
      "File a report with the Philippine National Police (PNP)",
      "Record details of the transaction and the person involved",
    ],
  },
};

const DEFAULT_AUTHORITY: AuthorityInfo = {
  authority: "Your National Central Bank",
  hotline: "",
  hotlineLabel: "Central Bank",
  steps: [
    "Do not attempt to use or pass on the suspicious note",
    "Place it in a separate envelope and avoid further handling",
    "Take it to your nearest bank or police station",
    "Report the incident with as much detail as possible",
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────

interface ReportSheetProps {
  result: CounterfeitResult;
  onClose: () => void;
}

export function ReportSheet({ result, onClose }: ReportSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const currency = getCurrency(result.currency);
  const info = AUTHORITY[result.currency] ?? DEFAULT_AUTHORITY;
  const pct = Math.round(result.overallConfidence * 100);
  const failedChecks = result.checks.filter((c) => c.result === "fail");
  const uncertainChecks = result.checks.filter((c) => c.result === "uncertain");
  const now = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

  const reportText = [
    "── SUSPECTED COUNTERFEIT NOTE REPORT ──",
    `Date / Time  : ${now}`,
    `Currency     : ${currency.code} — ${currency.name}`,
    `Denomination : ${currency.symbol}${result.denomination}`,
    `AI Verdict   : ${result.verdict.toUpperCase()} (${pct}% confidence)`,
    failedChecks.length  ? `Failed checks: ${failedChecks.map((c) => c.label).join(", ")}` : null,
    uncertainChecks.length ? `Uncertain    : ${uncertainChecks.map((c) => c.label).join(", ")}` : null,
    "",
    `Report to    : ${info.authority}`,
    info.hotline ? `Hotline      : ${info.hotline}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard may not be available in all contexts */
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background-50" role="dialog" aria-modal="true" aria-label="Report counterfeit note">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-800 to-red-950 px-5 pb-7 pt-5 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            aria-label="Close report"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-background-50/10 text-background-50 transition-colors hover:bg-background-50/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="text-sm font-semibold text-red-200">Counterfeit Check · Report</p>
        </div>

        <div className="mt-5 flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-background-50/10 ring-1 ring-red-400/30">
            <ShieldX className="h-8 w-8 text-red-200" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-background-50">Report Note</h1>
            <p className="mt-0.5 text-sm text-red-200">{currency.flag} {currency.code} · {currency.symbol}{result.denomination} · {pct}% confidence</p>
          </div>
        </div>

        {/* Warning banner */}
        <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-background-50/10 px-4 py-3 ring-1 ring-red-400/20">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-300" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-red-100">
            Do <strong>not</strong> attempt to use or return the note. Handle it minimally — place it in a separate envelope for authorities.
          </p>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 px-5 py-6">

          {/* Reporting authority */}
          <section aria-label="Reporting authority">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground-500">
              Who to Contact
            </h2>
            <div className="surface overflow-hidden rounded-2xl">
              <div className="border-b border-background-200 px-4 py-4">
                <p className="text-xs text-foreground-500">Authority</p>
                <p className="mt-0.5 text-base font-bold text-foreground-950">{info.authority}</p>
              </div>
              {info.hotline && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Phone className="h-4 w-4 shrink-0 text-foreground-500" aria-hidden="true" />
                  <div className="flex-1">
                    <p className="text-xs text-foreground-500">{info.hotlineLabel}</p>
                    <p className="font-heading text-lg font-bold text-foreground-950">{info.hotline}</p>
                  </div>
                  <a
                    href={`tel:${info.hotline.replace(/[^0-9+]/g, "")}`}
                    aria-label={`Call ${info.hotlineLabel}`}
                    className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-background-50 transition-colors hover:bg-primary-700"
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* Steps */}
          <section aria-label="Steps to take">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground-500">
              Steps to Take
            </h2>
            <ol className="space-y-2.5">
              {info.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background-200 text-xs font-bold text-foreground-700">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-foreground-800">{step}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Attach photo */}
          <section aria-label="Attach photo of note">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground-500">
              Attach a Photo (optional)
            </h2>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              aria-label="Take or upload photo of the note"
              onChange={handleFileChange}
              className="sr-only"
            />

            {photoUrl ? (
              <div className="relative overflow-hidden rounded-2xl border border-background-200">
                <img src={photoUrl} alt="Captured note" className="h-48 w-full object-cover" />
                <button
                  onClick={() => { setPhotoUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  aria-label="Remove photo"
                  className="absolute right-2.5 top-2.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-background-950/60 text-background-50 backdrop-blur-sm"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="border-t border-background-200 bg-background-50 px-4 py-2.5">
                  <p className="text-xs font-semibold text-primary-700">Photo attached — include when filing report</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full cursor-pointer flex-col items-center gap-2.5 rounded-2xl border-2 border-dashed border-background-300 py-7 transition-colors hover:border-primary-400 hover:bg-primary-50/30"
              >
                <Camera className="h-8 w-8 text-foreground-400" aria-hidden="true" />
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground-800">Take / Upload Photo</p>
                  <p className="text-xs text-foreground-500">Photograph the note to include with your report</p>
                </div>
              </button>
            )}
          </section>

          {/* Copy report */}
          <section aria-label="Copy report text">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground-500">
              Report Summary
            </h2>
            <div className="surface overflow-hidden rounded-2xl">
              <pre className="whitespace-pre-wrap px-4 py-4 font-mono text-xs leading-relaxed text-foreground-700">
                {reportText}
              </pre>
              <div className="border-t border-background-200 px-4 py-3">
                <button
                  onClick={copyReport}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-background-100 py-2.5 text-sm font-bold text-foreground-800 transition-colors hover:bg-background-200"
                  aria-label="Copy report details to clipboard"
                >
                  {copied ? (
                    <><Check className="h-4 w-4 text-primary-600" /> Copied!</>
                  ) : (
                    <><Copy className="h-4 w-4" /> Copy to Clipboard</>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* External resource */}
          <a
            href={result.currency === "INR" ? "https://www.rbi.org.in" : "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-background-200 bg-background-50 px-4 py-3 transition-colors hover:bg-background-100"
            aria-label="Open official authority website"
          >
            <ExternalLink className="h-4 w-4 shrink-0 text-foreground-500" aria-hidden="true" />
            <p className="text-sm font-semibold text-foreground-800">Official {info.authority} website</p>
          </a>

          {/* Legal disclaimer */}
          <p className="rounded-xl bg-background-100 px-4 py-3 text-xs leading-relaxed text-foreground-500">
            This tool provides AI-assisted guidance only. It does not constitute legal advice. Always work directly with your bank and law enforcement to report counterfeit currency.
          </p>
        </div>
      </div>
    </div>
  );
}