import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/base/Button";
import { PageHeader } from "@/components/base/PageHeader";
import { SUPPORTED_CURRENCIES, type CurrencyCode, type CurrencyInfo } from "@/constants/currencies";
import type { DetectionMode } from "@/types";
import { useApp } from "@/context/AppProvider";

const MODES: { value: DetectionMode; title: string; desc: string; icon: string }[] = [
  { value: "single", title: "Single Currency", desc: "Focus on one currency only.", icon: "💠" },
  { value: "multiple", title: "Multiple Selected", desc: "Detect among currencies you choose.", icon: "🧩" },
  { value: "automatic", title: "Automatic Detection", desc: "Auto-detect all six supported currencies.", icon: "✨" },
];

export default function CurrencyPreference() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { preferences, updatePreferences, lastResult } = useApp();
  const fromResult = searchParams.get("from") === "result";
  const suggested = fromResult ? lastResult?.currencies[0]?.currency : undefined;
  const [mode, setMode] = useState<DetectionMode>(preferences.detectionMode);
  const [selected, setSelected] = useState<CurrencyCode[]>(
    fromResult && suggested ? [suggested] : preferences.selectedCurrencies,
  );

  const toggleCurrency = (code: CurrencyCode) => {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const save = () => {
    const detectionCurrency =
      mode === "single" ? (selected[0] ?? "INR") : preferences.detectionCurrency;
    updatePreferences({
      detectionMode: mode,
      selectedCurrencies:
        mode === "automatic" ? SUPPORTED_CURRENCIES.map((c) => c.code) : selected,
      detectionCurrency,
    });
  };

  const continueToDenomination = () => {
    save();
    navigate("/preferences/denomination");
  };

  const saveAndRescan = () => {
    save();
    navigate("/scan");
  };

  const effectiveList =
    mode === "automatic" ? SUPPORTED_CURRENCIES.map((c) => c.code) : selected;

  return (
    <div className="app-bg relative mx-auto flex min-h-screen max-w-md flex-col lg:max-w-none">
      <PageHeader title="Detection Currency" subtitle="How should DhanDrishti scan?" showBack />

      <div className="flex-1 px-5 py-6 md:px-8">
        {fromResult && (
          <div className="mb-6 flex items-start gap-2 rounded-xl bg-accent-50 p-4 ring-1 ring-accent-200">
            <Sparkles aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent-700" />
            <p className="text-sm font-semibold text-accent-900">
              A different currency was detected. Pick what you want to scan for, then save — you'll
              return to the scanner.
            </p>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
          <div>
            <h2 className="text-base font-bold text-foreground-950">Detection mode</h2>
            <div className="mt-3 space-y-3" role="radiogroup" aria-label="Detection mode">
              {MODES.map((m) => {
                const active = mode === m.value;
                return (
                  <button
                    key={m.value}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setMode(m.value)}
                    className={`flex w-full cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
                      active
                        ? "border-primary-500 bg-primary-50"
                        : "border-background-200 bg-background-50 hover:border-background-300"
                    }`}
                  >
                    <span aria-hidden="true" className="text-2xl">{m.icon}</span>
                    <div className="flex-1">
                      <span className={`block text-sm font-bold ${active ? "text-primary-800" : "text-foreground-950"}`}>
                        {m.title}
                      </span>
                      <span className="block text-xs text-foreground-600">{m.desc}</span>
                    </div>
                    <span
                      aria-hidden="true"
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        active ? "border-primary-600 bg-primary-600" : "border-background-300"
                      }`}
                    >
                      {active && <Check aria-hidden="true" className="h-3.5 w-3.5 text-background-50" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 lg:mt-0">
            {mode !== "automatic" ? (
              <>
                <h2 className="text-base font-bold text-foreground-950">Choose currencies</h2>
                <p className="mt-1 text-xs text-foreground-600">Tap to select. You can choose more than one.</p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <CurrencyCard
                      key={c.code}
                      currency={c}
                      active={selected.includes(c.code)}
                      onToggle={() => toggleCurrency(c.code)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="rounded-xl bg-secondary-50 p-4 text-sm font-semibold text-secondary-800 ring-1 ring-secondary-200">
                Automatic mode detects all six currencies: INR, USD, PHP, EUR, AUD and CAD.
              </p>
            )}

            <p className="mt-3 text-xs text-foreground-500">Effective: {effectiveList.join(", ")}</p>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-background-200 bg-background-50/90 px-5 py-4 backdrop-blur-md md:px-8">
        <Button size="xl" fullWidth onClick={fromResult ? saveAndRescan : continueToDenomination}>
          {fromResult ? "Save & Back to Scan" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

function CurrencyCard({
  currency,
  active,
  onToggle,
}: {
  currency: CurrencyInfo;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={active}
      className={`relative flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-4 transition-all ${
        active
          ? "border-primary-500 bg-primary-50"
          : "border-background-200 bg-background-50 hover:border-background-300"
      }`}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-background-50"
        >
          <Check aria-hidden="true" className="h-3 w-3" />
        </span>
      )}
      <span aria-hidden="true" className="text-4xl">{currency.flag}</span>
      <span className={`text-sm font-bold ${active ? "text-primary-800" : "text-foreground-950"}`}>
        {currency.code}
      </span>
      <span className="text-[11px] text-foreground-600">{currency.name}</span>
    </button>
  );
}