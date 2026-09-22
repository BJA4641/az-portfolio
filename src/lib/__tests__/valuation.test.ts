import { describe, expect, it } from "vitest";
import {
  averageCompPricePerSqm,
  averageCompRentPerSqm,
  computeCagr,
  percentVsBenchmark,
  projectForward,
  resolveAppreciationRate,
  resolveRentGrowthRate
} from "@/lib/valuation";

describe("computeCagr", () => {
  it("computes the compound annual growth rate over N years", () => {
    // 100 -> 133.1 over 3 years is exactly 10%/yr
    expect(computeCagr(100, 133.1, 3)).toBeCloseTo(0.1, 3);
  });

  it("returns null for non-positive inputs instead of NaN/Infinity", () => {
    expect(computeCagr(0, 100, 3)).toBeNull();
    expect(computeCagr(100, 100, 0)).toBeNull();
  });
});

describe("resolveAppreciationRate", () => {
  it("prefers an explicit manual override above all else", () => {
    const result = resolveAppreciationRate({
      overrideRate: 0.05,
      purchasePrice: 100,
      purchaseDate: new Date("2020-01-01"),
      currentValue: 200,
      now: new Date("2024-01-01")
    });
    expect(result).toEqual({ rate: 0.05, source: "override" });
  });

  it("falls back to a computed CAGR when there's purchase history", () => {
    const result = resolveAppreciationRate({
      purchasePrice: 100,
      purchaseDate: new Date("2020-01-01"),
      currentValue: 121,
      now: new Date("2022-01-01")
    });
    expect(result.source).toBe("historical");
    expect(result.rate).toBeCloseTo(0.1, 2); // 100 -> 121 over 2 years = 10%/yr
  });

  it("falls back to the default assumption when there's no history at all", () => {
    const result = resolveAppreciationRate({});
    expect(result).toEqual({ rate: 0.03, source: "default" });
  });
});

describe("resolveRentGrowthRate", () => {
  it("uses the override when provided, else the default", () => {
    expect(resolveRentGrowthRate(0.04)).toEqual({ rate: 0.04, source: "override" });
    expect(resolveRentGrowthRate(null)).toEqual({ rate: 0.02, source: "default" });
  });
});

describe("projectForward", () => {
  it("compounds a base value forward year over year", () => {
    const points = projectForward(1000, 0.1, 3);
    expect(points).toHaveLength(3);
    expect(points[0]).toEqual({ year: 1, value: 1100 });
    expect(points[1].value).toBeCloseTo(1210, 2);
    expect(points[2].value).toBeCloseTo(1331, 2);
  });
});

describe("comp benchmarking", () => {
  const comps = [
    { salePrice: 200_000, areaSqm: 100 }, // 2000/sqm
    { salePrice: 300_000, areaSqm: 100 }, // 3000/sqm
    { monthlyRent: 1500, areaSqm: 100 } // no sale price, shouldn't count toward price avg
  ];

  it("averages only comps that actually have a sale price", () => {
    expect(averageCompPricePerSqm(comps)).toBeCloseTo(2500, 2);
  });

  it("averages only comps that actually have a rent", () => {
    expect(averageCompRentPerSqm(comps)).toBeCloseTo(15, 2);
  });

  it("returns null when no comps qualify, instead of NaN", () => {
    expect(averageCompPricePerSqm([{ areaSqm: 50 }])).toBeNull();
  });
});

describe("percentVsBenchmark", () => {
  it("computes a positive premium when the subject is above the benchmark", () => {
    expect(percentVsBenchmark(120, 100)).toBeCloseTo(20, 3);
  });

  it("computes a negative premium when the subject is below the benchmark", () => {
    expect(percentVsBenchmark(80, 100)).toBeCloseTo(-20, 3);
  });
});
