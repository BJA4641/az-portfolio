import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/delete-button";
import { formatDate, formatMoney } from "@/lib/format";
import { createMaintenanceVisit, deleteMaintenanceVisit, updateMaintenanceStatus } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-600"
};

export default async function MaintenancePage() {
  const [visits, properties] = await Promise.all([
    db.maintenanceVisit.findMany({
      include: { property: { select: { name: true, country: true } } },
      orderBy: { visitDate: "desc" }
    }),
    db.property.findMany({ select: { id: true, name: true, country: true }, orderBy: { name: "asc" } })
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Maintenance visits" subtitle={`${visits.length} visits`} />

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Schedule a visit</h2>
        <form action={createMaintenanceVisit} className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          <select name="propertyId" required defaultValue="" className="input col-span-2">
            <option value="" disabled>
              Property
            </option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.country}
              </option>
            ))}
          </select>
          <input type="date" name="visitDate" required className="input" />
          <input name="vendorName" required placeholder="Vendor" className="input" />
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
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Cost</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {visits.map((v) => (
              <tr key={v.id} className="table-row-hover border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 font-medium">
                  {v.property.name}
                  <p className="text-xs text-[var(--text-muted)]">{v.description}</p>
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(v.visitDate)}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{v.vendorName}</td>
                <td className="px-4 py-3 tabular-nums">{v.cost ? formatMoney(v.cost, v.currency) : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[v.status]}`}>
                    {v.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
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
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--text-muted)]">
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
