import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/delete-button";
import { deleteProperty } from "./actions";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const properties = await db.property.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <PageHeader title="Properties" subtitle={`${properties.length} properties across your portfolio`} />
        <Link
          href="/properties/new"
          className="rounded-lg bg-brand-950 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Add property
        </Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Value</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.id} className="table-row-hover border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  {p.city}, {p.country}
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{p.propertyType}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatMoney(p.currentValue ?? p.purchasePrice ?? 0, p.currency)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/properties/${p.id}`} className="text-xs font-medium text-brand-700 hover:underline">
                      Edit
                    </Link>
                    <DeleteButton action={deleteProperty} id={p.id} />
                  </div>
                </td>
              </tr>
            ))}
            {properties.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  No properties yet. Add your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    OWNED: "bg-blue-50 text-blue-700",
    FOR_SALE: "bg-orange-50 text-orange-700",
    SOLD: "bg-emerald-50 text-emerald-700"
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? ""}`}>
      {status.replace("_", " ")}
    </span>
  );
}
