export const CURRENCIES = [
  { code: "USD", symbol: "$",    name: "US Dollar" },
  { code: "EUR", symbol: "€",    name: "Euro" },
  { code: "GBP", symbol: "£",    name: "British Pound" },
  { code: "CAD", symbol: "CA$",  name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$",   name: "Australian Dollar" },
  { code: "CHF", symbol: "CHF",  name: "Swiss Franc" },
  { code: "JPY", symbol: "¥",    name: "Japanese Yen" },
  { code: "CNY", symbol: "¥",    name: "Chinese Yuan" },
  { code: "INR", symbol: "₹",    name: "Indian Rupee" },
  { code: "BRL", symbol: "R$",   name: "Brazilian Real" },
  { code: "MXN", symbol: "MX$",  name: "Mexican Peso" },
  { code: "SGD", symbol: "S$",   name: "Singapore Dollar" },
  { code: "HKD", symbol: "HK$",  name: "Hong Kong Dollar" },
  { code: "NOK", symbol: "kr",   name: "Norwegian Krone" },
  { code: "SEK", symbol: "kr",   name: "Swedish Krona" },
  { code: "DKK", symbol: "kr",   name: "Danish Krone" },
  { code: "ZAR", symbol: "R",    name: "South African Rand" },
  { code: "AED", symbol: "د.إ",  name: "UAE Dirham" },
  { code: "SRD", symbol: "Sr$",  name: "Surinamese Dollar" },
  { code: "TTD", symbol: "TT$",  name: "Trinidad Dollar" },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]["code"];

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

/** Always formats as: symbol + space + amount (e.g. "$ 1,234.56", "€ 5,000.00") */
export function formatCurrency(amount: number | string, currencyCode: string = "USD"): string {
  const num = Number(amount);
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol} ${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
