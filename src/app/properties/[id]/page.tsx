import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { PropertyForm } from "@/components/properties/property-form";
import { DeleteButton } from "@/components/delete-button";
import { updateProperty, deleteProperty } from "../actions";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await db.property.findUnique({ where: { id } });
  if (!property) notFound();

  const boundUpdate = updateProperty.bind(null, id);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <PageHeader title={`Edit ${property.name}`} />
        <DeleteButton action={deleteProperty} id={property.id} />
      </div>
      <div className="card max-w-3xl p-6">
        <PropertyForm action={boundUpdate} defaultValues={property} />
      </div>
    </div>
  );
}
