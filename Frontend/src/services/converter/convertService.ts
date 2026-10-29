import { getCurrency, type CurrencyInfo } from "@/constants/currencies";

export interface ConversionInput {
  from: CurrencyInfo;
  amount: number;
  to: CurrencyInfo;
}

export interface ConversionResult {
  rate: number;
  amount: number;
  source: "online" | "offline" | "cached";
}

const liveRateCache = new Map<string, Promise<Record<string, number> | null>>();

async function fetchLiveRates(base: string): Promise<Record<string, number> | null> {
  const cached = liveRateCache.get(base);
  if (cached) return cached;
  const request = fetch(`https://api.exchangerate-api.com/v4/latest/${base}`)
    .then(async (response) => response.ok ? ((await response.json()) as { rates?: Record<string, number> }).rates ?? null : null)
    .catch(() => null);
  liveRateCache.set(base, request);
  return request;
}

/**
 * Conversion service. Uses indicative base USD rates for offline fallback.
 * When connected to a live rates API, replace the internal rate fetch here.
 */
export function convert(input: ConversionInput): ConversionResult {
  const { from, amount, to } = input;
  const rate = to.baseRate / from.baseRate;
  return {
    rate,
    amount: amount * rate,
    source: "offline",
  };
}

export async function convertLive(input: ConversionInput): Promise<ConversionResult> {
  const rates = await fetchLiveRates(input.from.code);
  const liveRate = rates?.[input.to.code];
  if (liveRate !== undefined) {
    return { rate: liveRate, amount: input.amount * liveRate, source: "online" };
  }
  return convert(input);
}

export function speakConversion(from: CurrencyInfo, amount: number, to: CurrencyInfo, result: number): string {
  const amountText = amount.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const resultText = result.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return `${amountText} ${from.code} equals ${resultText} ${to.code}.`;
}

export function detectNotesInAmount(code: string, amount: number): { count: number; denomination: number }[] {
  const cur = getCurrency(code);
  const denoms = [...cur.denominations]
    .map((d) => d.value)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => b - a);
  let remaining = amount;
  const breakdown: { count: number; denomination: number }[] = [];
  for (const d of denoms) {
    const count = Math.floor(remaining / d);
    if (count > 0) {
      breakdown.push({ count, denomination: d });
      remaining -= count * d;
    }
  }
  return breakdown;
}