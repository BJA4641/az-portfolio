import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PublicListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await db.property.findUnique({ where: { id } });
  if (!property || !property.isListed) notFound();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          {property.propertyType} for rent
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--text)]">{property.name}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {property.addressLine}, {property.city}, {property.country}
        </p>

        {property.askingRent && (
          <p className="mt-4 text-3xl font-semibold tabular-nums text-[var(--text)]">
            {formatMoney(property.askingRent, property.currency)}
            <span className="text-base font-normal text-[var(--text-muted)]"> / month</span>
          </p>
        )}

        {property.areaSqm && <p className="mt-2 text-sm text-[var(--text-muted)]">{property.areaSqm} m²</p>}

        {property.listingDescription && (
          <p className="mt-4 whitespace-pre-line text-sm text-[var(--text)]">{property.listingDescription}</p>
        )}

        <div className="mt-6 rounded-lg border border-[var(--border)] bg-gray-50 p-3 text-xs text-[var(--text-muted)]">
          Interested? Contact the listing owner directly to inquire about this property.
        </div>
      </div>
    </div>
  );
}
