import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/delete-button";
import { PropertyCombobox } from "@/components/property-combobox";
import { formatDate, formatMoney } from "@/lib/format";
import { createAsset, deleteAsset } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  IN_USE: "bg-emerald-50 text-emerald-700",
  STORED: "bg-gray-100 text-gray-600",
  DISPOSED: "bg-red-50 text-red-700"
};

export default async function AssetsPage() {
  const [assets, properties] = await Promise.all([
    db.asset.findMany({ include: { property: { select: { name: true, country: true } } }, orderBy: { createdAt: "desc" } }),
    db.property.findMany({ select: { id: true, name: true, country: true }, orderBy: { name: "asc" } })
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Assets" subtitle="Equipment and furniture tracked at the property level, separate from the property itself" />

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Add asset</h2>
        <form action={createAsset} className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          <div className="col-span-2">
            <PropertyCombobox name="propertyId" properties={properties} required placeholder="Property" />
          </div>
          <input name="name" required placeholder="Asset name" className="input" />
          <input name="category" required placeholder="Category" className="input" />
          <input type="date" name="purchaseDate" className="input" />
          <input type="number" step="0.01" name="value" placeholder="Value" className="input" />
          <input name="currency" defaultValue="USD" className="input" />
          <select name="status" defaultValue="IN_USE" className="input">
            <option value="IN_USE">In use</option>
            <option value="STORED">Stored</option>
            <option value="DISPOSED">Disposed</option>
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
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Purchased</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id} className="table-row-hover border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 font-medium">
                  {a.name}
                  <p className="text-xs text-[var(--text-muted)]">{a.category}</p>
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{a.property.name}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{a.purchaseDate ? formatDate(a.purchaseDate) : "—"}</td>
                <td className="px-4 py-3 tabular-nums">{a.value ? formatMoney(a.value, a.currency) : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[a.status]}`}>
                    {a.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <DeleteButton action={deleteAsset} id={a.id} />
                </td>
              </tr>
            ))}
            {assets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  No assets yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
