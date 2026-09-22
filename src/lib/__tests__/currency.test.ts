import { describe, expect, it } from "vitest";
import { getRate, sumInDisplayCurrency, toDisplayCurrency } from "@/lib/currency";

describe("currency conversion", () => {
  it("returns 1:1 for the display currency itself", () => {
    expect(getRate("USD")).toBe(1);
    expect(toDisplayCurrency(500, "USD")).toBe(500);
  });

  it("converts a non-USD amount using its rate", () => {
    const converted = toDisplayCurrency(100, "EUR");
    expect(converted).toBeCloseTo(108, 1);
  });

  it("falls back to a 1:1 rate for an unknown currency instead of throwing", () => {
    expect(toDisplayCurrency(100, "XYZ")).toBe(100);
  });

  it("sums mixed-currency amounts in the display currency, not as raw numbers", () => {
    // This is the exact bug the dashboard shipped with: summing raw amounts
    // across currencies as if 1 EUR === 1 USD.
    const items = [
      { amount: 100, currency: "EUR" },
      { amount: 100, currency: "USD" }
    ];
    const naiveSum = items.reduce((s, i) => s + i.amount, 0);
    const correctSum = sumInDisplayCurrency(items);

    expect(naiveSum).toBe(200);
    expect(correctSum).not.toBe(naiveSum);
    expect(correctSum).toBeCloseTo(208, 1); // 100*1.08 + 100*1
  });
});
