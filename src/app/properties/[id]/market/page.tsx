import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/delete-button";
import { ForecastChart } from "@/components/charts/forecast-chart";
import { formatDate, formatMoney } from "@/lib/format";
import { DISPLAY_CURRENCY, toDisplayCurrency } from "@/lib/currency";
import {
  averageCompPricePerSqm,
  averageCompRentPerSqm,
  percentVsBenchmark,
  projectForward,
  resolveAppreciationRate,
  resolveRentGrowthRate
} from "@/lib/valuation";
import { createComparable, deleteComparable, updateForecastAssumptions } from "./actions";

export const dynamic = "force-dynamic";

export default async function MarketAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [property, comparables, activeLease] = await Promise.all([
    db.property.findUnique({ where: { id } }),
    db.comparable.findMany({ where: { propertyId: id }, orderBy: { createdAt: "desc" } }),
    db.lease.findFirst({ where: { propertyId: id, status: "ACTIVE" }, orderBy: { startDate: "desc" } })
  ]);
  if (!property) notFound();

  const boundCreateComp = createComparable.bind(null, id);
  const boundUpdateAssumptions = updateForecastAssumptions.bind(null, id);

  const subjectValue = property.currentValue ?? property.purchasePrice ?? null;
  const subjectValueUSD = subjectValue != null ? toDisplayCurrency(subjectValue, property.currency) : null;
  const subjectPricePerSqm =
    subjectValueUSD != null && property.areaSqm ? subjectValueUSD / property.areaSqm : null;

  const subjectRentUSD = activeLease ? toDisplayCurrency(activeLease.rentAmount, activeLease.currency) : null;
  const subjectRentPerSqm = subjectRentUSD != null && property.areaSqm ? subjectRentUSD / property.areaSqm : null;

  const compsInUSD = comparables.map((c) => ({
    salePrice: c.salePrice != null ? toDisplayCurrency(c.salePrice, c.currency) : null,
    monthlyRent: c.monthlyRent != null ? toDisplayCurrency(c.monthlyRent, c.currency) : null,
    areaSqm: c.areaSqm
  }));
  const avgPricePerSqm = averageCompPricePerSqm(compsInUSD);
  const avgRentPerSqm = averageCompRentPerSqm(compsInUSD);

  const pricePremiumPct =
    subjectPricePerSqm != null && avgPricePerSqm != null
      ? percentVsBenchmark(subjectPricePerSqm, avgPricePerSqm)
      : null;
  const rentPremiumPct =
    subjectRentPerSqm != null && avgRentPerSqm != null
      ? percentVsBenchmark(subjectRentPerSqm, avgRentPerSqm)
      : null;

  const appreciation = resolveAppreciationRate({
    overrideRate: property.appreciationRateOverride,
    purchasePrice: property.purchasePrice,
    purchaseDate: property.purchaseDate,
    currentValue: property.currentValue
  });
  const rentGrowth = resolveRentGrowthRate(property.rentGrowthRateOverride);

  const priceForecast = subjectValueUSD != null ? projectForward(subjectValueUSD, appreciation.rate, 5) : [];
  const rentForecast = subjectRentUSD != null ? projectForward(subjectRentUSD, rentGrowth.rate, 5) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={`${property.name} — market analysis`}
          subtitle="Comps you log, benchmarked against this property, plus a projection from historical performance"
        />
        <Link href={`/properties/${id}`} className="text-sm font-medium text-brand-700 hover:underline">
          Back to property
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-sm text-[var(--text-muted)]">Price per m² vs comps</p>
          {subjectPricePerSqm == null ? (
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Set the property&apos;s area (m²) below to enable this comparison.
            </p>
          ) : avgPricePerSqm == null ? (
            <>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatMoney(subjectPricePerSqm, DISPLAY_CURRENCY)}/m²
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Add sale comps below to see how this compares.</p>
            </>
          ) : (
            <>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatMoney(subjectPricePerSqm, DISPLAY_CURRENCY)}/m²
              </p>
              <p className={`mt-1 text-xs font-medium ${pricePremiumPct! >= 0 ? "text-orange-600" : "text-emerald-600"}`}>
                {pricePremiumPct! >= 0 ? "+" : ""}
                {pricePremiumPct!.toFixed(1)}% vs {formatMoney(avgPricePerSqm, DISPLAY_CURRENCY)}/m² comp average
              </p>
            </>
          )}
        </div>
        <div className="card p-5">
          <p className="text-sm text-[var(--text-muted)]">Rent per m² vs comps</p>
          {subjectRentPerSqm == null ? (
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Needs an active lease and the property&apos;s area (m²).
            </p>
          ) : avgRentPerSqm == null ? (
            <>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatMoney(subjectRentPerSqm, DISPLAY_CURRENCY)}/m²
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Add rent comps below to see how this compares.</p>
            </>
          ) : (
            <>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatMoney(subjectRentPerSqm, DISPLAY_CURRENCY)}/m²
              </p>
              <p className={`mt-1 text-xs font-medium ${rentPremiumPct! >= 0 ? "text-orange-600" : "text-emerald-600"}`}>
                {rentPremiumPct! >= 0 ? "+" : ""}
                {rentPremiumPct!.toFixed(1)}% vs {formatMoney(avgRentPerSqm, DISPLAY_CURRENCY)}/m² comp average
              </p>
            </>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-1 text-sm font-semibold text-[var(--text)]">Forecast assumptions</h2>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          Appreciation rate is{" "}
          {appreciation.source === "override"
            ? "your manual override"
            : appreciation.source === "historical"
              ? "computed from this property's purchase price → current value"
              : "a default 3%/yr assumption (no purchase history to compute from)"}
          . Rent growth is {rentGrowth.source === "override" ? "your manual override" : "a default 2%/yr assumption"}.
          These are projections, not guarantees.
        </p>
        <form action={boundUpdateAssumptions} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--text)]">Area (m²)</span>
            <input type="number" step="0.01" name="areaSqm" defaultValue={property.areaSqm ?? undefined} className="input" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--text)]">Appreciation rate override (%/yr)</span>
            <input
              type="number"
              step="0.1"
              name="appreciationRateOverride"
              defaultValue={
                property.appreciationRateOverride != null ? (property.appreciationRateOverride * 100).toFixed(1) : undefined
              }
              placeholder="auto"
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--text)]">Rent growth override (%/yr)</span>
            <input
              type="number"
              step="0.1"
              name="rentGrowthRateOverride"
              defaultValue={
                property.rentGrowthRateOverride != null ? (property.rentGrowthRateOverride * 100).toFixed(1) : undefined
              }
              placeholder="auto"
              className="input"
            />
          </label>
          <div className="col-span-full">
            <button type="submit" className="rounded-lg bg-brand-950 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
              Save assumptions
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-1 text-sm font-semibold text-[var(--text)]">
            5-year value forecast ({(appreciation.rate * 100).toFixed(1)}%/yr)
          </h2>
          {priceForecast.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-muted)]">No value on record yet.</p>
          ) : (
            <ForecastChart
              data={priceForecast}
              valueLabel="Projected value"
              currency={DISPLAY_CURRENCY}
            />
          )}
        </div>
        <div className="card p-5">
          <h2 className="mb-1 text-sm font-semibold text-[var(--text)]">
            5-year rent forecast ({(rentGrowth.rate * 100).toFixed(1)}%/yr)
          </h2>
          {rentForecast.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-muted)]">No active lease to project from.</p>
          ) : (
            <ForecastChart
              data={rentForecast}
              valueLabel="Projected monthly rent"
              currency={DISPLAY_CURRENCY}
            />
          )}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Comparable properties</h2>
        <form action={boundCreateComp} className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-7">
          <input name="addressLine" required placeholder="Address" className="input col-span-2" />
          <input name="city" required placeholder="City" className="input" />
          <input name="country" required placeholder="Country" className="input" />
          <input type="number" step="0.01" name="areaSqm" required placeholder="Area (m²)" className="input" />
          <input type="number" step="0.01" name="salePrice" placeholder="Sale price" className="input" />
          <input type="number" step="0.01" name="monthlyRent" placeholder="Monthly rent" className="input" />
          <input name="currency" defaultValue={property.currency} className="input" />
          <input type="date" name="observedDate" className="input" />
          <input name="source" placeholder="Source (listing, agent...)" className="input col-span-2" />
          <button type="submit" className="rounded-lg bg-brand-950 px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
            Add comp
          </button>
        </form>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <th className="py-2">Address</th>
              <th className="py-2">Area</th>
              <th className="py-2">Sale price</th>
              <th className="py-2">Rent</th>
              <th className="py-2">Observed</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {comparables.map((c) => (
              <tr key={c.id} className="table-row-hover border-b border-[var(--border)] last:border-0">
                <td className="py-2">
                  {c.addressLine}
                  <p className="text-xs text-[var(--text-muted)]">
                    {c.city}, {c.country}
                    {c.source ? ` — ${c.source}` : ""}
                  </p>
                </td>
                <td className="py-2 tabular-nums">{c.areaSqm} m²</td>
                <td className="py-2 tabular-nums">{c.salePrice ? formatMoney(c.salePrice, c.currency) : "—"}</td>
                <td className="py-2 tabular-nums">{c.monthlyRent ? formatMoney(c.monthlyRent, c.currency) : "—"}</td>
                <td className="py-2 text-[var(--text-muted)]">{c.observedDate ? formatDate(c.observedDate) : "—"}</td>
                <td className="py-2 text-right">
                  <DeleteButton action={deleteComparable} id={c.id} extraFields={{ propertyId: id }} />
                </td>
              </tr>
            ))}
            {comparables.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-[var(--text-muted)]">
                  No comps logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
