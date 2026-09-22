// Static exchange rates (quote currency per 1 unit of key currency), used only
// to make cross-currency dashboard totals meaningful. These are NOT live —
// there's no FX data feed wired up. Update this table periodically, or swap
// getRate() for a real provider (e.g. exchangerate.host) later.
const RATES_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  AED: 0.27,
  KRW: 0.00072
};

export const DISPLAY_CURRENCY = "USD";

export function getRate(currency: string): number {
  return RATES_TO_USD[currency] ?? 1;
}

export function toDisplayCurrency(amount: number, currency: string): number {
  return amount * getRate(currency);
}

export function sumInDisplayCurrency(items: { amount: number; currency: string }[]): number {
  return items.reduce((sum, item) => sum + toDisplayCurrency(item.amount, item.currency), 0);
}
