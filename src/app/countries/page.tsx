import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/delete-button";
import { createCountry, deleteCountry } from "./actions";

export const dynamic = "force-dynamic";

export default async function CountriesPage() {
  const countries = await db.country.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Countries"
        subtitle="Controlled master list of countries — supplies the default currency shown when adding a property"
      />

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Add country</h2>
        <form action={createCountry} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <input name="name" required placeholder="Country name" className="input" />
          <input name="isoCode" required maxLength={3} placeholder="ISO code (e.g. USA)" className="input" />
          <input name="defaultCurrency" required defaultValue="USD" placeholder="Default currency" className="input" />
          <input type="number" step="0.01" name="taxRate" placeholder="Tax rate % (optional)" className="input" />
          <input name="timezone" placeholder="Timezone (optional)" className="input" />
          <button type="submit" className="col-span-2 rounded-lg bg-brand-950 px-3 py-2 text-sm font-semibold text-white hover:opacity-90 sm:col-span-1">
            Add
          </button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">ISO</th>
              <th className="px-4 py-3">Default currency</th>
              <th className="px-4 py-3">Tax rate</th>
              <th className="px-4 py-3">Timezone</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {countries.map((c) => (
              <tr key={c.id} className="table-row-hover border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{c.isoCode}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{c.defaultCurrency}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{c.taxRate != null ? `${c.taxRate}%` : "—"}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{c.timezone ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <DeleteButton action={deleteCountry} id={c.id} />
                </td>
              </tr>
            ))}
            {countries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  No countries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
