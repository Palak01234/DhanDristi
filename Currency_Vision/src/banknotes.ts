// Class map from dataset.yaml (36 classes, 6 currencies) — order matches the
// model's training labels exactly, do not reorder.
export interface BanknoteClass {
  label: string;
  currency: string; // ISO code used for exchange-rate lookups
  value: number;
}

export const CLASSES: BanknoteClass[] = [
  { label: '50 USD', currency: 'USD', value: 50 },
  { label: '5 USD', currency: 'USD', value: 5 },
  { label: '1 USD', currency: 'USD', value: 1 },
  { label: '10 USD', currency: 'USD', value: 10 },
  { label: '20 USD', currency: 'USD', value: 20 },
  { label: '100 USD', currency: 'USD', value: 100 },
  { label: '100 PHP', currency: 'PHP', value: 100 },
  { label: '1000 PHP', currency: 'PHP', value: 1000 },
  { label: '1000 PHP (new)', currency: 'PHP', value: 1000 },
  { label: '20 PHP', currency: 'PHP', value: 20 },
  { label: '200 PHP', currency: 'PHP', value: 200 },
  { label: '50 PHP', currency: 'PHP', value: 50 },
  { label: '500 PHP', currency: 'PHP', value: 500 },
  { label: '100 INR', currency: 'INR', value: 100 },
  { label: '10 INR', currency: 'INR', value: 10 },
  { label: '200 INR', currency: 'INR', value: 200 },
  { label: '20 INR', currency: 'INR', value: 20 },
  { label: '500 INR', currency: 'INR', value: 500 },
  { label: '50 INR', currency: 'INR', value: 50 },
  { label: '2000 INR', currency: 'INR', value: 2000 },
  { label: '100 EUR', currency: 'EUR', value: 100 },
  { label: '10 EUR', currency: 'EUR', value: 10 },
  { label: '200 EUR', currency: 'EUR', value: 200 },
  { label: '20 EUR', currency: 'EUR', value: 20 },
  { label: '50 EUR', currency: 'EUR', value: 50 },
  { label: '5 EUR', currency: 'EUR', value: 5 },
  { label: '100 AUD', currency: 'AUD', value: 100 },
  { label: '10 AUD', currency: 'AUD', value: 10 },
  { label: '20 AUD', currency: 'AUD', value: 20 },
  { label: '50 AUD', currency: 'AUD', value: 50 },
  { label: '5 AUD', currency: 'AUD', value: 5 },
  { label: '100 CAD', currency: 'CAD', value: 100 },
  { label: '10 CAD', currency: 'CAD', value: 10 },
  { label: '20 CAD', currency: 'CAD', value: 20 },
  { label: '50 CAD', currency: 'CAD', value: 50 },
  { label: '5 CAD', currency: 'CAD', value: 5 },
];

export const CURRENCIES = ['USD', 'PHP', 'INR', 'EUR', 'AUD', 'CAD'] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

const rateCache = new Map<string, Promise<Record<string, number> | null>>();

// Public, keyless endpoint — same one the original prototype used.
function fetchRates(base: string): Promise<Record<string, number> | null> {
  if (!rateCache.has(base)) {
    const p = fetch(`https://api.exchangerate-api.com/v4/latest/${base}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j?.rates ?? null)
      .catch(() => null);
    rateCache.set(base, p);
  }
  return rateCache.get(base)!;
}

export async function convert(
  amountsByCurrency: Record<string, number>,
  target: string,
): Promise<{ total: number; ok: boolean }> {
  let total = 0;
  let ok = true;
  for (const [currency, amount] of Object.entries(amountsByCurrency)) {
    if (currency === target) {
      total += amount;
      continue;
    }
    const rates = await fetchRates(currency);
    if (!rates || !(target in rates)) {
      ok = false;
      continue;
    }
    total += amount * rates[target];
  }
  return { total, ok };
}
