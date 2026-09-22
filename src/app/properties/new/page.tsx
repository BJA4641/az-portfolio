import { PageHeader } from "@/components/page-header";
import { PropertyForm } from "@/components/properties/property-form";
import { createProperty } from "../actions";

export default function NewPropertyPage() {
  return (
    <div>
      <PageHeader title="Add property" />
      <div className="card max-w-3xl p-6">
        <PropertyForm action={createProperty} />
      </div>
    </div>
  );
}
