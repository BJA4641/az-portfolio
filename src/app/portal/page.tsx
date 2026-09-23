import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionRole, getSessionLeaseId } from "@/lib/rbac";
import { PageHeader } from "@/components/page-header";
import { formatDate, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

const PAYMENT_STYLES: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  PAID: "bg-emerald-50 text-emerald-700",
  LATE: "bg-orange-50 text-orange-700",
  MISSED: "bg-red-50 text-red-700"
};

export default async function TenantPortalPage() {
  const role = await getSessionRole();
  if (role !== "TENANT") redirect("/");

  const leaseId = await getSessionLeaseId();
  if (!leaseId) redirect("/login");

  const lease = await db.lease.findUnique({
    where: { id: leaseId },
    include: {
      property: { select: { name: true, addressLine: true, city: true, country: true } },
      rentPayments: { orderBy: { dueDate: "desc" }, take: 12 }
    }
  });
  if (!lease) redirect("/login");

  const nextDue = lease.rentPayments.find((p) => p.status === "PENDING" || p.status === "LATE");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My lease" subtitle={lease.property.name} />

      <div className="card p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-sm text-[var(--text-muted)]">Address</p>
            <p className="font-medium">
              {lease.property.addressLine}, {lease.property.city}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)]">Rent</p>
            <p className="font-medium tabular-nums">
              {formatMoney(lease.rentAmount, lease.currency)} / {lease.frequency.toLowerCase()}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)]">Lease ends</p>
            <p className="font-medium">{formatDate(lease.endDate)}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)]">Next payment due</p>
            <p className="font-medium">
              {nextDue ? `${formatMoney(nextDue.amount, nextDue.currency)} on ${formatDate(nextDue.dueDate)}` : "All caught up"}
            </p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <h2 className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--text)]">
          Rent payment history
        </h2>
        <table className="w-full text-sm">
          <tbody>
            {lease.rentPayments.map((p) => (
              <tr key={p.id} className="table-row-hover border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3">{formatDate(p.dueDate)}</td>
                <td className="px-4 py-3 tabular-nums">{formatMoney(p.amount, p.currency)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STYLES[p.status]}`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
            {lease.rentPayments.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-[var(--text-muted)]">
                  No payment history yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
