import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/delete-button";
import { PropertyCombobox } from "@/components/property-combobox";
import { formatDate, formatMoney } from "@/lib/format";
import { getSessionRole } from "@/lib/rbac";
import {
  createMaintenanceVisit,
  deleteMaintenanceVisit,
  updateMaintenanceStatus,
  assignMaintenanceVisit,
  submitForApproval,
  setApprovalStatus
} from "./actions";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  REQUESTED: "bg-orange-50 text-orange-700",
  SCHEDULED: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-600"
};

const APPROVAL_STYLES: Record<string, string> = {
  OPEN: "bg-gray-100 text-gray-600",
  AWAITING_APPROVAL: "bg-orange-50 text-orange-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700"
};

export default async function MaintenancePage() {
  const [allVisits, properties, vendors, role] = await Promise.all([
    db.maintenanceVisit.findMany({
      include: { property: { select: { name: true, country: true } }, vendor: { select: { name: true } } },
      orderBy: { visitDate: "desc" }
    }),
    db.property.findMany({ select: { id: true, name: true, country: true }, orderBy: { name: "asc" } }),
    db.vendor.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    getSessionRole()
  ]);
  const isOwner = role === "OWNER";

  const requests = allVisits.filter((v) => v.status === "REQUESTED");
  const visits = allVisits.filter((v) => v.status !== "REQUESTED");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Maintenance visits" subtitle={`${visits.length} visits, ${requests.length} tenant requests to triage`} />

      {requests.length > 0 && (
        <div className="card overflow-hidden">
          <h2 className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--text)]">
            Tenant requests awaiting triage
          </h2>
          <table className="w-full text-sm">
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium">{r.property.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{r.description}</p>
                    <p className="text-xs text-[var(--text-muted)]">Requested {formatDate(r.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <form action={assignMaintenanceVisit.bind(null, r.id)} className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                      <input type="date" name="visitDate" required className="input" />
                      <select name="vendorId" defaultValue="" className="input">
                        <option value="">Choose vendor...</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                      <input name="vendorName" placeholder="Or type new vendor" className="input" />
                      <input type="number" step="0.01" name="cost" placeholder="Est. cost" className="input" />
                      <input name="currency" defaultValue="USD" className="input" />
                      <button type="submit" className="rounded-lg bg-brand-950 px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
                        Schedule
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <DeleteButton action={deleteMaintenanceVisit} id={r.id} confirmText="Dismiss this tenant request?" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Schedule a visit</h2>
        <form action={createMaintenanceVisit} className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          <div className="col-span-2">
            <PropertyCombobox name="propertyId" properties={properties} required placeholder="Property" />
          </div>
          <input type="date" name="visitDate" required className="input" />
          <select name="vendorId" defaultValue="" className="input">
            <option value="">Choose vendor...</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <input name="vendorName" placeholder="Or type new vendor" className="input" />
          <input name="description" required placeholder="Description" className="input col-span-2" />
          <input type="number" step="0.01" name="cost" placeholder="Cost" className="input" />
          <input name="currency" defaultValue="USD" className="input" />
          <select name="status" defaultValue="SCHEDULED" className="input">
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button type="submit" className="rounded-lg bg-brand-950 px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
            Add
          </button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Cost</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Approval</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {visits.map((v) => (
              <tr key={v.id} className="table-row-hover border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{v.referenceNo ?? "—"}</td>
                <td className="px-4 py-3 font-medium">
                  {v.property.name}
                  <p className="text-xs text-[var(--text-muted)]">{v.description}</p>
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(v.visitDate)}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{v.vendor?.name ?? v.vendorName ?? "—"}</td>
                <td className="px-4 py-3 tabular-nums">{v.cost ? formatMoney(v.cost, v.currency) : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[v.status]}`}>
                    {v.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${APPROVAL_STYLES[v.approvalStatus]}`}>
                    {v.approvalStatus.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {v.approvalStatus === "OPEN" && !isOwner && (
                      <form action={submitForApproval.bind(null, v.id)}>
                        <button type="submit" className="text-xs font-medium text-brand-700 hover:underline">
                          Submit for approval
                        </button>
                      </form>
                    )}
                    {isOwner && (v.approvalStatus === "OPEN" || v.approvalStatus === "AWAITING_APPROVAL") && (
                      <>
                        <form action={setApprovalStatus.bind(null, v.id, "APPROVED")}>
                          <button type="submit" className="text-xs font-medium text-emerald-700 hover:underline">
                            Approve
                          </button>
                        </form>
                        <form action={setApprovalStatus.bind(null, v.id, "REJECTED")}>
                          <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                            Reject
                          </button>
                        </form>
                      </>
                    )}
                    {v.approvalStatus === "APPROVED" && v.vendorId && (
                      <Link href={`/invoices?woId=${v.id}`} className="text-xs font-medium text-brand-700 hover:underline">
                        Create invoice
                      </Link>
                    )}
                    {v.status === "SCHEDULED" && (
                      <form action={updateMaintenanceStatus.bind(null, v.id, "COMPLETED")}>
                        <button type="submit" className="text-xs font-medium text-brand-700 hover:underline">
                          Mark done
                        </button>
                      </form>
                    )}
                    <DeleteButton action={deleteMaintenanceVisit} id={v.id} />
                  </div>
                </td>
              </tr>
            ))}
            {visits.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  No maintenance visits yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
