import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { updateListing } from "./actions";

export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  const properties = await db.property.findMany({
    where: { status: { not: "SOLD" } },
    orderBy: { name: "asc" }
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Listings"
        subtitle="A free, shareable public page per property — paste the link into Craigslist, Facebook, or anywhere else"
      />

      <div className="flex flex-col gap-4">
        {properties.map((p) => (
          <div key={p.id} className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {p.city}, {p.country}
                </p>
              </div>
              {p.isListed && (
                <a
                  href={`/listing/${p.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-brand-700 hover:underline"
                >
                  View public page →
                </a>
              )}
            </div>
            <form action={updateListing.bind(null, p.id)} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isListed" defaultChecked={p.isListed} className="h-4 w-4" />
                <span>Publish public listing</span>
              </label>
              <input
                type="number"
                step="0.01"
                name="askingRent"
                placeholder="Asking rent"
                defaultValue={p.askingRent ?? undefined}
                className="input"
              />
              <input
                name="listingDescription"
                placeholder="Short description"
                defaultValue={p.listingDescription ?? undefined}
                className="input col-span-2"
              />
              <div className="col-span-full">
                <button type="submit" className="rounded-lg bg-brand-950 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                  Save
                </button>
              </div>
            </form>
          </div>
        ))}
        {properties.length === 0 && <p className="text-sm text-[var(--text-muted)]">No properties yet.</p>}
      </div>

      <div className="card p-5">
        <p className="text-sm text-[var(--text-muted)]">
          <strong className="text-[var(--text)]">Publish to Zillow / Apartments.com</strong> — not connected yet. Those
          sites require a paid listing-syndication partnership. The public page above is a free alternative you can
          share manually anywhere.
        </p>
      </div>
    </div>
  );
}
