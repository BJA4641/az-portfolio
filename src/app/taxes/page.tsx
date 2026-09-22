import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/delete-button";
import { PropertyCombobox } from "@/components/property-combobox";
import { formatDate, formatMoney } from "@/lib/format";
import { createTax, deleteTax, markTaxPaid, createFee, deleteFee, markFeePaid } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  PAID: "bg-emerald-50 text-emerald-700",
  OVERDUE: "bg-red-50 text-red-700"
};

export default async function TaxesPage() {
  const [taxes, fees, properties] = await Promise.all([
    db.tax.findMany({
      include: { property: { select: { name: true } } },
      orderBy: { dueDate: "asc" }
    }),
    db.fee.findMany({
      include: { property: { select: { name: true } } },
      orderBy: { dueDate: "asc" }
    }),
    db.property.findMany({ select: { id: true, name: true, country: true }, orderBy: { name: "asc" } })
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Taxes & fees" subtitle="Per-property taxes and recurring fees, by country" />

      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Property taxes</h2>
        <form action={createTax} className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-7">
          <div className="col-span-2">
            <PropertyCombobox name="propertyId" properties={properties} required placeholder="Property" />
          </div>
          <input name="taxType" required placeholder="Tax type" className="input" />
          <input name="country" required placeholder="Country" className="input" />
          <input type="number" name="taxYear" required placeholder="Year" defaultValue={new Date().getFullYear()} className="input" />
          <input type="number" step="0.01" name="amount" required placeholder="Amount" className="input" />
          <input name="currency" defaultValue="USD" className="input" />
          <input type="date" name="dueDate" required className="input" />
          <select name="status" defaultValue="PENDING" className="input">
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
          <button type="submit" className="rounded-lg bg-brand-950 px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
            Add tax
          </button>
        </form>
        <table className="w-full text-sm">
          <tbody>
            {taxes.map((t) => (
              <tr key={t.id} className="table-row-hover border-t border-[var(--border)]">
                <td className="py-2 font-medium">
                  {t.property.name}
                  <p className="text-xs text-[var(--text-muted)]">
                    {t.taxType} — {t.country} — {t.taxYear}
                  </p>
                </td>
                <td className="py-2 tabular-nums">{formatMoney(t.amount, t.currency)}</td>
                <td className="py-2 text-[var(--text-muted)]">{formatDate(t.dueDate)}</td>
                <td className="py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[t.status]}`}>
                    {t.status}
                  </span>
                </td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {t.status !== "PAID" && (
                      <form action={markTaxPaid.bind(null, t.id)}>
                        <button type="submit" className="text-xs font-medium text-brand-700 hover:underline">
                          Mark paid
                        </button>
                      </form>
                    )}
                    <DeleteButton action={deleteTax} id={t.id} />
                  </div>
                </td>
              </tr>
            ))}
            {taxes.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-[var(--text-muted)]">
                  No taxes recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Fees</h2>
        <form action={createFee} className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-6">
          <div className="col-span-2">
            <PropertyCombobox name="propertyId" properties={properties} required placeholder="Property" />
          </div>
          <input name="feeType" required placeholder="Fee type (HOA, legal, mgmt...)" className="input" />
          <input type="number" step="0.01" name="amount" required placeholder="Amount" className="input" />
          <input name="currency" defaultValue="USD" className="input" />
          <input type="date" name="dueDate" required className="input" />
          <select name="status" defaultValue="PENDING" className="input">
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
          <button type="submit" className="rounded-lg bg-brand-950 px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
            Add fee
          </button>
        </form>
        <table className="w-full text-sm">
          <tbody>
            {fees.map((f) => (
              <tr key={f.id} className="table-row-hover border-t border-[var(--border)]">
                <td className="py-2 font-medium">
                  {f.property.name}
                  <p className="text-xs text-[var(--text-muted)]">{f.feeType}</p>
                </td>
                <td className="py-2 tabular-nums">{formatMoney(f.amount, f.currency)}</td>
                <td className="py-2 text-[var(--text-muted)]">{formatDate(f.dueDate)}</td>
                <td className="py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[f.status]}`}>
                    {f.status}
                  </span>
                </td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {f.status !== "PAID" && (
                      <form action={markFeePaid.bind(null, f.id)}>
                        <button type="submit" className="text-xs font-medium text-brand-700 hover:underline">
                          Mark paid
                        </button>
                      </form>
                    )}
                    <DeleteButton action={deleteFee} id={f.id} />
                  </div>
                </td>
              </tr>
            ))}
            {fees.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-[var(--text-muted)]">
                  No fees recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
