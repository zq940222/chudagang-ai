const currencySymbols: Record<string, string> = {
  CNY: "\u00A5",
  USD: "$",
  EUR: "\u20AC",
  GBP: "\u00A3",
  JPY: "\u00A5",
  HKD: "HK$",
};

export function formatCurrencyAmount(amount: number, currency: string) {
  const normalized = currency.trim().toUpperCase();
  const formatted = amount.toLocaleString();
  const symbol = currencySymbols[normalized];

  if (symbol) {
    return `${symbol}${formatted}`;
  }

  return `${formatted} ${normalized}`;
}
