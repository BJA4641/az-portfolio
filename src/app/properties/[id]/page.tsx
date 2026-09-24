import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { PropertyForm } from "@/components/properties/property-form";
import { DeleteButton } from "@/components/delete-button";
import { AttachmentPanel } from "@/components/documents/attachment-panel";
import { updateProperty, deleteProperty } from "../actions";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [property, countries] = await Promise.all([
    db.property.findUnique({ where: { id } }),
    db.country.findMany({ select: { name: true, defaultCurrency: true }, orderBy: { name: "asc" } })
  ]);
  if (!property) notFound();

  const boundUpdate = updateProperty.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title={`Edit ${property.name}`} />
        <div className="flex items-center gap-4">
          <Link href={`/properties/${id}/market`} className="text-sm font-medium text-brand-700 hover:underline">
            Market analysis
          </Link>
          <DeleteButton action={deleteProperty} id={property.id} />
        </div>
      </div>
      <div className="card max-w-3xl p-6">
        <PropertyForm action={boundUpdate} defaultValues={property} countries={countries} />
      </div>
      <div className="card max-w-3xl p-6">
        <AttachmentPanel
          entityType="Property"
          entityId={property.id}
          entityLabel={property.name}
          revalidatePath={`/properties/${property.id}`}
        />
      </div>
    </div>
  );
}
