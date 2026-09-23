import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionRole, getSessionLeaseId } from "@/lib/rbac";
import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/lib/format";
import { createMaintenanceRequest } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  REQUESTED: "bg-orange-50 text-orange-700",
  SCHEDULED: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-600"
};

export default async function TenantMaintenancePage() {
  const role = await getSessionRole();
  if (role !== "TENANT") redirect("/");

  const leaseId = await getSessionLeaseId();
  if (!leaseId) redirect("/login");

  const lease = await db.lease.findUniqueOrThrow({ where: { id: leaseId }, select: { propertyId: true } });
  const visits = await db.maintenanceVisit.findMany({
    where: { propertyId: lease.propertyId },
    include: { vendor: { select: { name: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Maintenance requests" subtitle="Submit a request and track its status" />

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">New request</h2>
        <form action={createMaintenanceRequest} className="flex gap-3">
          <input
            name="description"
            required
            placeholder="Describe the issue (e.g. leaking kitchen faucet)"
            className="input flex-1"
          />
          <button type="submit" className="rounded-lg bg-brand-950 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Submit
          </button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {visits.map((v) => (
              <tr key={v.id} className="table-row-hover border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3">
                  {v.description}
                  {(v.vendor?.name ?? v.vendorName) && (
                    <p className="text-xs text-[var(--text-muted)]">Vendor: {v.vendor?.name ?? v.vendorName}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[v.status]}`}>
                    {v.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-[var(--text-muted)]">
                  {v.status === "SCHEDULED" ? formatDate(v.visitDate) : formatDate(v.createdAt)}
                </td>
              </tr>
            ))}
            {visits.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  No maintenance requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
