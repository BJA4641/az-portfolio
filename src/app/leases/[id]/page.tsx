import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { LeaseForm } from "@/components/leases/lease-form";
import { DeleteButton } from "@/components/delete-button";
import { formatDate, formatMoney } from "@/lib/format";
import {
  updateLease,
  deleteLease,
  addRentPayment,
  deleteRentPayment,
  markRentPaid,
  setTenantAccess,
  revokeTenantAccess
} from "../actions";

const PAYMENT_STYLES: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  PAID: "bg-emerald-50 text-emerald-700",
  LATE: "bg-orange-50 text-orange-700",
  MISSED: "bg-red-50 text-red-700"
};

export default async function LeaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lease, properties, tenantUsers] = await Promise.all([
    db.lease.findUnique({
      where: { id },
      include: { rentPayments: { orderBy: { dueDate: "desc" } } }
    }),
    db.property.findMany({ select: { id: true, name: true, country: true }, orderBy: { name: "asc" } }),
    db.user.findMany({ where: { leaseId: id, role: "TENANT" }, orderBy: { createdAt: "asc" } })
  ]);
  if (!lease) notFound();

  const boundUpdate = updateLease.bind(null, id);
  const boundAddPayment = addRentPayment.bind(null, id);
  const boundSetTenantAccess = setTenantAccess.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title={`${lease.tenantName} — lease`} />
        <DeleteButton action={deleteLease} id={lease.id} confirmText="Delete this lease and all its rent payments?" />
      </div>

      <div className="card max-w-3xl p-6">
        <LeaseForm action={boundUpdate} properties={properties} defaultValues={lease} />
      </div>

      <div className="card flex max-w-3xl flex-wrap items-center gap-3 border border-dashed border-[var(--border)] bg-gray-50 p-5">
        <button
          type="button"
          disabled
          title="Requires connecting Stripe or Plaid (per-transaction fees apply)"
          className="cursor-not-allowed rounded-lg bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-500"
        >
          Enable online rent payment
        </button>
        <button
          type="button"
          disabled
          title="Requires connecting DocuSign or HelloSign"
          className="cursor-not-allowed rounded-lg bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-500"
        >
          Send lease for e-signature
        </button>
        <p className="text-xs text-[var(--text-muted)]">Not connected yet — these need a paid third-party service.</p>
      </div>

      <div className="card max-w-3xl p-6">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Rent payments</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <th className="py-2">Due</th>
              <th className="py-2">Amount</th>
              <th className="py-2">Status</th>
              <th className="py-2">Paid</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {lease.rentPayments.map((payment) => (
              <tr key={payment.id} className="border-b border-[var(--border)] last:border-0">
                <td className="py-2">{formatDate(payment.dueDate)}</td>
                <td className="py-2 tabular-nums">{formatMoney(payment.amount, payment.currency)}</td>
                <td className="py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STYLES[payment.status]}`}>
                    {payment.status}
                  </span>
                </td>
                <td className="py-2 text-[var(--text-muted)]">
                  {payment.paidDate ? formatDate(payment.paidDate) : "—"}
                </td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {payment.status !== "PAID" && (
                      <form action={markRentPaid.bind(null, lease.id, payment.id)}>
                        <button type="submit" className="text-xs font-medium text-brand-700 hover:underline">
                          Mark paid
                        </button>
                      </form>
                    )}
                    <form action={deleteRentPayment}>
                      <input type="hidden" name="id" value={payment.id} />
                      <input type="hidden" name="leaseId" value={lease.id} />
                      <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {lease.rentPayments.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-[var(--text-muted)]">
                  No payments recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <form action={boundAddPayment} className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-5">
          <input type="date" name="dueDate" required className="input" placeholder="Due date" />
          <input type="number" step="0.01" name="amount" required className="input" placeholder="Amount" defaultValue={lease.rentAmount} />
          <input name="currency" className="input" defaultValue={lease.currency} />
          <select name="status" className="input" defaultValue="PENDING">
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="LATE">Late</option>
            <option value="MISSED">Missed</option>
          </select>
          <button type="submit" className="rounded-lg bg-brand-950 px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
            Add payment
          </button>
        </form>
      </div>

      <div className="card max-w-3xl p-6">
        <h2 className="mb-1 text-sm font-semibold text-[var(--text)]">Tenant portal access</h2>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          Give {lease.tenantName} their own login to view this lease and rent history, and submit maintenance
          requests, at /portal.
        </p>
        {tenantUsers.length > 0 && (
          <table className="mb-4 w-full text-sm">
            <tbody>
              {tenantUsers.map((u) => (
                <tr key={u.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2 font-medium">{u.name}</td>
                  <td className="py-2 text-[var(--text-muted)]">{u.email}</td>
                  <td className="py-2 text-right">
                    <DeleteButton
                      action={revokeTenantAccess}
                      id={u.id}
                      extraFields={{ userId: u.id, leaseId: lease.id }}
                      confirmText="Revoke this tenant's portal access?"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <form action={boundSetTenantAccess} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input name="name" required placeholder="Tenant name" defaultValue={lease.tenantName} className="input" />
          <input type="email" name="email" required placeholder="Login email" className="input" />
          <input type="password" name="password" required placeholder="Password (min 8 chars)" className="input" />
          <button type="submit" className="rounded-lg bg-brand-950 px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
            {tenantUsers.length > 0 ? "Add another login" : "Create tenant login"}
          </button>
        </form>
      </div>
    </div>
  );
}
