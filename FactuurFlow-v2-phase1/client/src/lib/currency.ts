export const CURRENCIES = [
  { code: "EUR", label: "Euro (€)",              locale: "de-DE" },
  { code: "USD", label: "US Dollar ($)",          locale: "en-US" },
  { code: "GBP", label: "British Pound (£)",      locale: "en-GB" },
  { code: "CHF", label: "Swiss Franc (Fr)",        locale: "de-CH" },
  { code: "SEK", label: "Swedish Krona (kr)",      locale: "sv-SE" },
  { code: "NOK", label: "Norwegian Krone (kr)",    locale: "nb-NO" },
  { code: "DKK", label: "Danish Krone (kr)",       locale: "da-DK" },
  { code: "PLN", label: "Polish Złoty (zł)",       locale: "pl-PL" },
  { code: "CZK", label: "Czech Koruna (Kč)",       locale: "cs-CZ" },
  { code: "HUF", label: "Hungarian Forint (Ft)",   locale: "hu-HU" },
  { code: "AUD", label: "Australian Dollar (A$)",  locale: "en-AU" },
  { code: "CAD", label: "Canadian Dollar (C$)",    locale: "en-CA" },
  { code: "JPY", label: "Japanese Yen (¥)",        locale: "ja-JP" },
  { code: "CNY", label: "Chinese Yuan (¥)",        locale: "zh-CN" },
  { code: "INR", label: "Indian Rupee (₹)",        locale: "en-IN" },
  { code: "BRL", label: "Brazilian Real (R$)",     locale: "pt-BR" },
  { code: "MXN", label: "Mexican Peso ($)",        locale: "es-MX" },
  { code: "ZAR", label: "South African Rand (R)",  locale: "en-ZA" },
  { code: "AED", label: "UAE Dirham (د.إ)",        locale: "ar-AE" },
  { code: "SGD", label: "Singapore Dollar (S$)",   locale: "en-SG" },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]["code"];

export function formatCurrency(amount: string | number, currency = "EUR"): string {
  const num = Number(amount);
  const entry = CURRENCIES.find((c) => c.code === currency);
  const locale = entry?.locale ?? "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
