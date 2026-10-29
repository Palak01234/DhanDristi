import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/base/Button";
import { TopBar } from "@/components/base/TopBar";
import { getCurrency } from "@/constants/currencies";
import { useApp } from "@/context/AppProvider";

export default function DenominationPreference() {
  const navigate = useNavigate();
  const { preferences, updatePreferences } = useApp();

  const currencyCodes =
    preferences.detectionMode === "automatic"
      ? preferences.selectedCurrencies
      : preferences.selectedCurrencies.length
        ? preferences.selectedCurrencies
        : [preferences.detectionCurrency];

  const [selected, setSelected] = useState<number[]>(preferences.selectedDenominations);

  const list = useMemo(() => {
    const seen = new Set<number>();
    const denoms: { value: number; label: string; code: string }[] = [];
    for (const code of currencyCodes) {
      const cur = getCurrency(code);
      for (const d of cur.denominations) {
        if (!seen.has(d.value)) {
          seen.add(d.value);
          denoms.push({ value: d.value, label: d.label, code });
        }
      }
    }
    return denoms;
  }, [currencyCodes]);

  const allSelected = selected.length === 0;
  const toggleAll = () => setSelected(allSelected ? list.map((d) => d.value) : []);

  const toggle = (value: number) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const finish = () => {
    updatePreferences({ selectedDenominations: selected });
    navigate("/home");
  };

  return (
    <div className="app-bg mx-auto flex min-h-screen max-w-md flex-col lg:max-w-none">
      <TopBar title="Denominations" subtitle="Which note values to detect?" />
      <div className="flex-1 px-5 py-6 md:px-8">
        <h1 className="text-xl font-bold text-foreground-950">Choose denominations</h1>
        <p className="mt-1.5 text-sm text-foreground-600">
          Allow all denominations, or select only the ones you want the scanner to identify.
        </p>

        <button
          onClick={toggleAll}
          aria-pressed={allSelected}
          className={`mt-6 flex w-full cursor-pointer items-center justify-between rounded-2xl border-2 px-4 py-4 transition-colors ${
            allSelected ? "border-primary-500 bg-primary-50" : "border-background-200 bg-background-50 hover:border-background-300"
          }`}
        >
          <span className={`text-sm font-bold ${allSelected ? "text-primary-800" : "text-foreground-950"}`}>
            Allow all denominations
          </span>
          <span
            aria-hidden="true"
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
              allSelected ? "border-primary-600 bg-primary-600" : "border-background-300"
            }`}
          >
            {allSelected && <Check aria-hidden="true" className="h-3.5 w-3.5 text-background-50" />}
          </span>
        </button>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((d) => {
            const active = !allSelected && selected.includes(d.value);
            return (
              <button
                key={`${d.code}-${d.value}`}
                onClick={() => toggle(d.value)}
                aria-pressed={active}
                disabled={allSelected}
                className={`flex min-h-14 cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 transition-colors ${
                  allSelected
                    ? "border-background-100 bg-background-100 opacity-50"
                    : active
                      ? "border-primary-500 bg-primary-50"
                      : "border-background-200 bg-background-50 hover:border-background-300"
                }`}
              >
                <span className={`text-sm font-bold ${active ? "text-primary-800" : "text-foreground-950"}`}>
                  {d.label}
                </span>
                {active && <Check aria-hidden="true" className="h-4 w-4 text-primary-700" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-background-200 bg-background-50/90 px-5 py-4 backdrop-blur-md md:px-8">
        <Button size="xl" fullWidth onClick={finish}>
          Finish Setup
        </Button>
      </div>
    </div>
  );
}