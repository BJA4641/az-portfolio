import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { PropertyForm } from "@/components/properties/property-form";
import { createProperty } from "../actions";

export default async function NewPropertyPage() {
  const countries = await db.country.findMany({ select: { name: true, defaultCurrency: true }, orderBy: { name: "asc" } });
  return (
    <div>
      <PageHeader title="Add property" />
      <div className="card max-w-3xl p-6">
        <PropertyForm action={createProperty} countries={countries} />
      </div>
    </div>
  );
}
