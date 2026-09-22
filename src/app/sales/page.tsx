import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/delete-button";
import { PropertyCombobox } from "@/components/property-combobox";
import { formatDate, formatMoney } from "@/lib/format";
import {
  createBroker,
  deleteBroker,
  createSale,
  deleteSale,
  createCommission,
  deleteCommission,
  markCommissionPaid
} from "./actions";

export const dynamic = "force-dynamic";

const SALE_STYLES: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700"
};

export default async function SalesPage() {
  const [brokers, sales, commissions, properties, leases] = await Promise.all([
    db.broker.findMany({ orderBy: { createdAt: "desc" } }),
    db.sale.findMany({
      include: { property: { select: { name: true } }, broker: { select: { name: true } } },
      orderBy: { saleDate: "desc" }
    }),
    db.commission.findMany({
      include: { broker: { select: { name: true } }, sale: { select: { id: true } } },
      orderBy: { createdAt: "desc" }
    }),
    db.property.findMany({ select: { id: true, name: true, country: true }, orderBy: { name: "asc" } }),
    db.lease.findMany({ select: { id: true, tenantName: true }, orderBy: { startDate: "desc" } })
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Sales & brokers" subtitle="Property sales, brokers, and commissions" />

      {/* Brokers */}
      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Brokers</h2>
        <form action={createBroker} className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-6">
          <input name="name" required placeholder="Name" className="input" />
          <input name="agencyName" placeholder="Agency" className="input" />
          <input name="country" required placeholder="Country" className="input" />
          <input name="contact" placeholder="Contact" className="input" />
          <input type="number" step="0.01" name="defaultCommissionRate" placeholder="Default rate %" className="input" />
          <button type="submit" className="rounded-lg bg-brand-950 px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
            Add broker
          </button>
        </form>
        <table className="w-full text-sm">
          <tbody>
            {brokers.map((b) => (
              <tr key={b.id} className="table-row-hover border-t border-[var(--border)]">
                <td className="py-2 font-medium">{b.name}</td>
                <td className="py-2 text-[var(--text-muted)]">{b.agencyName ?? "—"}</td>
                <td className="py-2 text-[var(--text-muted)]">{b.country}</td>
                <td className="py-2 text-[var(--text-muted)]">
                  {b.defaultCommissionRate ? `${b.defaultCommissionRate}%` : "—"}
                </td>
                <td className="py-2 text-right">
                  <DeleteButton action={deleteBroker} id={b.id} />
                </td>
              </tr>
            ))}
            {brokers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-[var(--text-muted)]">
                  No brokers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Sales */}
      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Sales</h2>
        <form action={createSale} className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-7">
          <div className="col-span-2">
            <PropertyCombobox name="propertyId" properties={properties} required placeholder="Property" />
          </div>
          <input type="date" name="saleDate" required className="input" />
          <input type="number" step="0.01" name="salePrice" required placeholder="Sale price" className="input" />
          <input name="currency" defaultValue="USD" className="input" />
          <input name="buyerName" required placeholder="Buyer" className="input" />
          <select name="brokerId" defaultValue="" className="input">
            <option value="">No broker</option>
            {brokers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select name="status" defaultValue="PENDING" className="input">
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button type="submit" className="rounded-lg bg-brand-950 px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
            Add sale
          </button>
        </form>
        <table className="w-full text-sm">
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="table-row-hover border-t border-[var(--border)]">
                <td className="py-2 font-medium">{s.property.name}</td>
                <td className="py-2 text-[var(--text-muted)]">{formatDate(s.saleDate)}</td>
                <td className="py-2 tabular-nums">{formatMoney(s.salePrice, s.currency)}</td>
                <td className="py-2 text-[var(--text-muted)]">{s.buyerName}</td>
                <td className="py-2 text-[var(--text-muted)]">{s.broker?.name ?? "—"}</td>
                <td className="py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SALE_STYLES[s.status]}`}>
                    {s.status}
                  </span>
                </td>
                <td className="py-2 text-right">
                  <DeleteButton action={deleteSale} id={s.id} />
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-[var(--text-muted)]">
                  No sales yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Commissions */}
      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Commissions & fees</h2>
        <form action={createCommission} className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-7">
          <select name="brokerId" required defaultValue="" className="input">
            <option value="" disabled>
              Broker
            </option>
            {brokers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select name="saleId" defaultValue="" className="input">
            <option value="">No sale</option>
            {sales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.property.name} sale
              </option>
            ))}
          </select>
          <select name="leaseId" defaultValue="" className="input">
            <option value="">No lease</option>
            {leases.map((l) => (
              <option key={l.id} value={l.id}>
                {l.tenantName} lease
              </option>
            ))}
          </select>
          <input type="number" step="0.01" name="amount" required placeholder="Amount" className="input" />
          <input name="currency" defaultValue="USD" className="input" />
          <input type="number" step="0.01" name="rate" placeholder="Rate %" className="input" />
          <select name="status" defaultValue="PENDING" className="input">
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
          </select>
          <button type="submit" className="col-span-2 rounded-lg bg-brand-950 px-3 py-2 text-sm font-semibold text-white hover:opacity-90 sm:col-span-1">
            Add commission
          </button>
        </form>
        <table className="w-full text-sm">
          <tbody>
            {commissions.map((c) => (
              <tr key={c.id} className="table-row-hover border-t border-[var(--border)]">
                <td className="py-2 font-medium">{c.broker.name}</td>
                <td className="py-2 tabular-nums">{formatMoney(c.amount, c.currency)}</td>
                <td className="py-2 text-[var(--text-muted)]">{c.rate ? `${c.rate}%` : "—"}</td>
                <td className="py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.status === "PAID" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {c.status !== "PAID" && (
                      <form action={markCommissionPaid.bind(null, c.id)}>
                        <button type="submit" className="text-xs font-medium text-brand-700 hover:underline">
                          Mark paid
                        </button>
                      </form>
                    )}
                    <DeleteButton action={deleteCommission} id={c.id} />
                  </div>
                </td>
              </tr>
            ))}
            {commissions.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-[var(--text-muted)]">
                  No commissions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
