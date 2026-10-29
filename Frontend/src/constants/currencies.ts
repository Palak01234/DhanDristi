export type CurrencyCode = "INR" | "USD" | "PHP" | "EUR" | "AUD" | "CAD";

export interface Denomination {
  value: number;
  label: string;
}

export interface CurrencyInfo {
  code: CurrencyCode;
  name: string;
  nativeName: string;
  symbol: string;
  flag: string;
  denominations: Denomination[];
  /** Base USD rate used for offline conversion. Rates are indicative. */
  baseRate: number;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  {
    code: "INR",
    name: "Indian Rupee",
    nativeName: "ಭಾರತೀಯ ರೂಪಾಯಿ",
    symbol: "₹",
    flag: "🇮🇳",
    denominations: [
      { value: 10, label: "₹10" },
      { value: 20, label: "₹20" },
      { value: 50, label: "₹50" },
      { value: 100, label: "₹100" },
      { value: 200, label: "₹200" },
      { value: 500, label: "₹500" },
      { value: 2000, label: "₹2000" },
    ],
    baseRate: 0.0119,
  },
  {
    code: "USD",
    name: "US Dollar",
    nativeName: "US Dollar",
    symbol: "$",
    flag: "🇺🇸",
    denominations: [
      { value: 1, label: "$1" },
      { value: 5, label: "$5" },
      { value: 10, label: "$10" },
      { value: 20, label: "$20" },
      { value: 50, label: "$50" },
      { value: 100, label: "$100" },
    ],
    baseRate: 1,
  },
  {
    code: "PHP",
    name: "Philippine Peso",
    nativeName: "Philippine Peso",
    symbol: "₱",
    flag: "🇵🇭",
    denominations: [
      { value: 20, label: "₱20" },
      { value: 50, label: "₱50" },
      { value: 100, label: "₱100" },
      { value: 200, label: "₱200" },
      { value: 500, label: "₱500" },
      { value: 1000, label: "₱1000" },
      { value: 1000, label: "₱1000 New" },
    ],
    baseRate: 0.017,
  },
  {
    code: "EUR",
    name: "Euro",
    nativeName: "Euro",
    symbol: "€",
    flag: "🇪🇺",
    denominations: [
      { value: 5, label: "€5" },
      { value: 10, label: "€10" },
      { value: 20, label: "€20" },
      { value: 50, label: "€50" },
      { value: 100, label: "€100" },
      { value: 200, label: "€200" },
    ],
    baseRate: 1.09,
  },
  {
    code: "AUD",
    name: "Australian Dollar",
    nativeName: "Australian Dollar",
    symbol: "A$",
    flag: "🇦🇺",
    denominations: [
      { value: 5, label: "A$5" },
      { value: 10, label: "A$10" },
      { value: 20, label: "A$20" },
      { value: 50, label: "A$50" },
      { value: 100, label: "A$100" },
    ],
    baseRate: 0.66,
  },
  {
    code: "CAD",
    name: "Canadian Dollar",
    nativeName: "Canadian Dollar",
    symbol: "C$",
    flag: "🇨🇦",
    denominations: [
      { value: 5, label: "C$5" },
      { value: 10, label: "C$10" },
      { value: 20, label: "C$20" },
      { value: 50, label: "C$50" },
      { value: 100, label: "C$100" },
    ],
    baseRate: 0.73,
  },
];

export const CURRENCY_MAP: Record<CurrencyCode, CurrencyInfo> =
  SUPPORTED_CURRENCIES.reduce((acc, c) => {
    acc[c.code] = c;
    return acc;
  }, {} as Record<CurrencyCode, CurrencyInfo>);

export function getCurrency(code: string): CurrencyInfo {
  return CURRENCY_MAP[code as CurrencyCode] ?? SUPPORTED_CURRENCIES[0];
}

export function formatAmount(code: string, value: number): string {
  const cur = getCurrency(code);
  const formatted = value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
  return `${cur.symbol}${formatted}`;
}