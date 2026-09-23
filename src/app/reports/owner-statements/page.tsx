import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { formatMoney } from "@/lib/format";
import { DISPLAY_CURRENCY, toDisplayCurrency } from "@/lib/currency";

export const dynamic = "force-dynamic";

function startOfYear(): string {
  return new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

type Line = { propertyId: string; amount: number };

export default async function OwnerStatementsPage({
  searchParams
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from: fromParam, to: toParam } = await searchParams;
  const from = fromParam || startOfYear();
  const to = toParam || today();
  const fromDate = new Date(from);
  const toDate = new Date(new Date(to).getTime() + 24 * 60 * 60 * 1000 - 1);

  const [properties, rentPayments, maintenance, fees, taxes, commissions] = await Promise.all([
    db.property.findMany({ select: { id: true, name: true, country: true, currency: true }, orderBy: { name: "asc" } }),
    db.rentPayment.findMany({
      where: { status: "PAID", paidDate: { gte: fromDate, lte: toDate } },
      select: { amount: true, currency: true, lease: { select: { propertyId: true } } }
    }),
    db.maintenanceVisit.findMany({
      where: { status: "COMPLETED", visitDate: { gte: fromDate, lte: toDate }, cost: { not: null } },
      select: { cost: true, currency: true, propertyId: true }
    }),
    db.fee.findMany({
      where: { status: "PAID", paidDate: { gte: fromDate, lte: toDate } },
      select: { amount: true, currency: true, propertyId: true }
    }),
    db.tax.findMany({
      where: { status: "PAID", paidDate: { gte: fromDate, lte: toDate } },
      select: { amount: true, currency: true, propertyId: true }
    }),
    db.commission.findMany({
      where: { status: "PAID", paidDate: { gte: fromDate, lte: toDate } },
      select: {
        amount: true,
        currency: true,
        sale: { select: { propertyId: true } },
        lease: { select: { propertyId: true } }
      }
    })
  ]);

  const toLines = (rows: { amount: number; currency: string; propertyId: string }[]): Line[] =>
    rows.map((r) => ({ propertyId: r.propertyId, amount: toDisplayCurrency(r.amount, r.currency) }));

  const incomeLines = toLines(
    rentPayments
      .filter((r) => r.lease?.propertyId)
      .map((r) => ({ amount: r.amount, currency: r.currency, propertyId: r.lease!.propertyId }))
  );
  const maintenanceLines = toLines(
    maintenance.map((m) => ({ amount: m.cost ?? 0, currency: m.currency, propertyId: m.propertyId }))
  );
  const feeLines = toLines(fees.map((f) => ({ amount: f.amount, currency: f.currency, propertyId: f.propertyId })));
  const taxLines = toLines(taxes.map((t) => ({ amount: t.amount, currency: t.currency, propertyId: t.propertyId })));
  const commissionLines = toLines(
    commissions
      .filter((c) => c.sale?.propertyId || c.lease?.propertyId)
      .map((c) => ({
        amount: c.amount,
        currency: c.currency,
        propertyId: (c.sale?.propertyId ?? c.lease?.propertyId)!
      }))
  );

  const sumFor = (lines: Line[], propertyId: string) =>
    lines.filter((l) => l.propertyId === propertyId).reduce((s, l) => s + l.amount, 0);

  const rows = properties.map((p) => {
    const income = sumFor(incomeLines, p.id);
    const maintenanceExpense = sumFor(maintenanceLines, p.id);
    const feeExpense = sumFor(feeLines, p.id);
    const taxExpense = sumFor(taxLines, p.id);
    const commissionExpense = sumFor(commissionLines, p.id);
    const totalExpense = maintenanceExpense + feeExpense + taxExpense + commissionExpense;
    return {
      property: p,
      income,
      maintenanceExpense,
      feeExpense,
      taxExpense,
      commissionExpense,
      totalExpense,
      net: income - totalExpense
    };
  });

  const portfolioTotal = rows.reduce(
    (acc, r) => ({
      income: acc.income + r.income,
      expense: acc.expense + r.totalExpense,
      net: acc.net + r.net
    }),
    { income: 0, expense: 0, net: 0 }
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Owner statements"
        subtitle="Income minus expenses, computed from your recorded transactions — converted to USD for comparison"
      />

      <form action="/reports/owner-statements" method="GET" className="card flex flex-wrap items-end gap-3 p-5">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-[var(--text)]">From</span>
          <input type="date" name="from" defaultValue={from} className="input" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-[var(--text)]">To</span>
          <input type="date" name="to" defaultValue={to} className="input" />
        </label>
        <button type="submit" className="rounded-lg bg-brand-950 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          Update
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-[var(--text-muted)]">Total income</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{formatMoney(portfolioTotal.income, DISPLAY_CURRENCY)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-[var(--text-muted)]">Total expenses</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{formatMoney(portfolioTotal.expense, DISPLAY_CURRENCY)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-[var(--text-muted)]">Net to owner</p>
          <p className={`mt-2 text-2xl font-semibold tabular-nums ${portfolioTotal.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {formatMoney(portfolioTotal.net, DISPLAY_CURRENCY)}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3 text-right">Rent income</th>
              <th className="px-4 py-3 text-right">Maintenance</th>
              <th className="px-4 py-3 text-right">Fees</th>
              <th className="px-4 py-3 text-right">Taxes</th>
              <th className="px-4 py-3 text-right">Commissions</th>
              <th className="px-4 py-3 text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.property.id} className="table-row-hover border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 font-medium">
                  {r.property.name}
                  <p className="text-xs text-[var(--text-muted)]">{r.property.country}</p>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatMoney(r.income, DISPLAY_CURRENCY)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--text-muted)]">
                  ({formatMoney(r.maintenanceExpense, DISPLAY_CURRENCY)})
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--text-muted)]">
                  ({formatMoney(r.feeExpense, DISPLAY_CURRENCY)})
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--text-muted)]">
                  ({formatMoney(r.taxExpense, DISPLAY_CURRENCY)})
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--text-muted)]">
                  ({formatMoney(r.commissionExpense, DISPLAY_CURRENCY)})
                </td>
                <td className={`px-4 py-3 text-right font-semibold tabular-nums ${r.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {formatMoney(r.net, DISPLAY_CURRENCY)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
