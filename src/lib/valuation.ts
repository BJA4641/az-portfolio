// Pure calculation helpers for the market comps / valuation / forecast
// features. Kept dependency-free (no Prisma/Next imports) so they're easy
// to unit test directly.

const DEFAULT_APPRECIATION_RATE = 0.03; // 3%/yr fallback assumption
const DEFAULT_RENT_GROWTH_RATE = 0.02; // 2%/yr fallback assumption

/** Compound annual growth rate from a starting value to an ending value over `years`. */
export function computeCagr(startValue: number, endValue: number, years: number): number | null {
  if (startValue <= 0 || years <= 0) return null;
  return Math.pow(endValue / startValue, 1 / years) - 1;
}

export function yearsBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

/**
 * Picks the appreciation rate to project with, in order of confidence:
 * an explicit manual override, then a CAGR computed from the property's own
 * purchase-to-current-value history, then a flat default assumption.
 */
export function resolveAppreciationRate(input: {
  overrideRate?: number | null;
  purchasePrice?: number | null;
  purchaseDate?: Date | null;
  currentValue?: number | null;
  now?: Date;
}): { rate: number; source: "override" | "historical" | "default" } {
  if (input.overrideRate != null) {
    return { rate: input.overrideRate, source: "override" };
  }
  if (input.purchasePrice && input.purchaseDate && input.currentValue) {
    const years = yearsBetween(input.purchaseDate, input.now ?? new Date());
    const cagr = computeCagr(input.purchasePrice, input.currentValue, years);
    if (cagr != null && Number.isFinite(cagr) && years >= 0.5) {
      return { rate: cagr, source: "historical" };
    }
  }
  return { rate: DEFAULT_APPRECIATION_RATE, source: "default" };
}

export function resolveRentGrowthRate(overrideRate?: number | null): { rate: number; source: "override" | "default" } {
  if (overrideRate != null) return { rate: overrideRate, source: "override" };
  return { rate: DEFAULT_RENT_GROWTH_RATE, source: "default" };
}

/** Projects a base amount forward `yearsAhead` years at a fixed annual rate. */
export function projectForward(baseValue: number, annualRate: number, yearsAhead: number): { year: number; value: number }[] {
  const points: { year: number; value: number }[] = [];
  for (let y = 1; y <= yearsAhead; y++) {
    points.push({ year: y, value: baseValue * Math.pow(1 + annualRate, y) });
  }
  return points;
}

export type Comp = { salePrice?: number | null; monthlyRent?: number | null; areaSqm: number };

/** Average sale price per square meter across comps that have a sale price. */
export function averageCompPricePerSqm(comps: Comp[]): number | null {
  const withPrice = comps.filter((c) => c.salePrice != null && c.areaSqm > 0);
  if (withPrice.length === 0) return null;
  const total = withPrice.reduce((sum, c) => sum + c.salePrice! / c.areaSqm, 0);
  return total / withPrice.length;
}

/** Average monthly rent per square meter across comps that have a rent. */
export function averageCompRentPerSqm(comps: Comp[]): number | null {
  const withRent = comps.filter((c) => c.monthlyRent != null && c.areaSqm > 0);
  if (withRent.length === 0) return null;
  const total = withRent.reduce((sum, c) => sum + c.monthlyRent! / c.areaSqm, 0);
  return total / withRent.length;
}

/** Percentage the subject's per-sqm figure sits above (+) or below (-) the comp average. */
export function percentVsBenchmark(subjectPerSqm: number, benchmarkPerSqm: number): number {
  if (benchmarkPerSqm === 0) return 0;
  return ((subjectPerSqm - benchmarkPerSqm) / benchmarkPerSqm) * 100;
}
