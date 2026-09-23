import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/delete-button";
import { formatMoney } from "@/lib/format";
import { DISPLAY_CURRENCY, toDisplayCurrency } from "@/lib/currency";
import { createVendor, deleteVendor } from "./actions";

export const dynamic = "force-dynamic";

const IRS_1099_THRESHOLD_USD = 600;

export default async function VendorsPage({
  searchParams
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year: yearParam } = await searchParams;
  const year = parseInt(yearParam ?? String(new Date().getFullYear()), 10);
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const [vendors, paidVisits] = await Promise.all([
    db.vendor.findMany({ orderBy: { name: "asc" } }),
    db.maintenanceVisit.findMany({
      where: {
        status: "COMPLETED",
        vendorId: { not: null },
        cost: { not: null },
        visitDate: { gte: yearStart, lt: yearEnd }
      },
      select: { vendorId: true, cost: true, currency: true }
    })
  ]);

  const totalsByVendor = new Map<string, number>();
  for (const v of paidVisits) {
    const usd = toDisplayCurrency(v.cost ?? 0, v.currency);
    totalsByVendor.set(v.vendorId!, (totalsByVendor.get(v.vendorId!) ?? 0) + usd);
  }

  const summaryRows = vendors
    .map((v) => ({ vendor: v, total: totalsByVendor.get(v.id) ?? 0 }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);

  const yearOptions = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Vendors & 1099" subtitle="Track vendors and who crosses the $600/yr IRS 1099-NEC threshold" />

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Add vendor</h2>
        <form action={createVendor} className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          <input name="name" required placeholder="Vendor name" className="input" />
          <input name="country" required placeholder="Country" className="input" />
          <input name="contact" placeholder="Contact" className="input" />
          <input type="email" name="email" placeholder="Email" className="input" />
          <input name="taxId" placeholder="Tax ID / EIN (optional)" className="input" />
          <button type="submit" className="rounded-lg bg-brand-950 px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
            Add vendor
          </button>
        </form>
        <table className="mt-4 w-full text-sm">
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id} className="table-row-hover border-t border-[var(--border)]">
                <td className="py-2 font-medium">{v.name}</td>
                <td className="py-2 text-[var(--text-muted)]">{v.country}</td>
                <td className="py-2 text-[var(--text-muted)]">{v.email ?? "—"}</td>
                <td className="py-2 text-right">
                  <DeleteButton action={deleteVendor} id={v.id} />
                </td>
              </tr>
            ))}
            {vendors.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-[var(--text-muted)]">
                  No vendors yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--text)]">1099 summary — {year}</h2>
          <div className="flex items-center gap-3">
            <form action="/vendors" method="GET" className="flex items-center gap-2">
              <select name="year" defaultValue={String(year)} className="input">
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <button type="submit" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-gray-50">
                View
              </button>
            </form>
            <a
              href={`/vendors/1099.csv?year=${year}`}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-gray-50"
            >
              Export CSV
            </a>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Tax ID</th>
              <th className="px-4 py-3 text-right">Total paid ({DISPLAY_CURRENCY})</th>
              <th className="px-4 py-3 text-right">1099 required</th>
            </tr>
          </thead>
          <tbody>
            {summaryRows.map((r) => (
              <tr key={r.vendor.id} className="table-row-hover border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 font-medium">{r.vendor.name}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{r.vendor.taxId ?? "Not on file"}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatMoney(r.total, DISPLAY_CURRENCY)}</td>
                <td className="px-4 py-3 text-right">
                  {r.total >= IRS_1099_THRESHOLD_USD ? (
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                      Yes — ≥ $600
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Below threshold</span>
                  )}
                </td>
              </tr>
            ))}
            {summaryRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  No completed, vendor-linked maintenance costs in {year} yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card p-5">
        <p className="text-sm text-[var(--text-muted)]">
          <strong className="text-[var(--text)]">E-filing with the IRS</strong> — not connected yet. This report tells you
          who needs a 1099-NEC and totals the amount; actually filing electronically needs a paid service like{" "}
          <span className="font-medium">Track1099</span> or <span className="font-medium">Tax1099</span>. Export the CSV
          above and upload it there, or fill out paper 1099-NEC forms yourself using these totals.
        </p>
      </div>
    </div>
  );
}
