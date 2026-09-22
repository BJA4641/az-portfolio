import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { LeaseForm } from "@/components/leases/lease-form";
import { createLease } from "../actions";

export default async function NewLeasePage() {
  const properties = await db.property.findMany({
    select: { id: true, name: true, country: true },
    orderBy: { name: "asc" }
  });

  return (
    <div>
      <PageHeader title="Add lease" />
      <div className="card max-w-3xl p-6">
        <LeaseForm action={createLease} properties={properties} />
      </div>
    </div>
  );
}
