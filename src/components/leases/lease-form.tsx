import type { Lease, Property } from "@prisma/client";

export function LeaseForm({
  action,
  properties,
  defaultValues
}: {
  action: (formData: FormData) => void;
  properties: Pick<Property, "id" | "name" | "country">[];
  defaultValues?: Partial<Lease>;
}) {
  const startDate = defaultValues?.startDate
    ? new Date(defaultValues.startDate).toISOString().slice(0, 10)
    : "";
  const endDate = defaultValues?.endDate
    ? new Date(defaultValues.endDate).toISOString().slice(0, 10)
    : "";

  return (
    <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="col-span-full flex flex-col gap-1 text-sm">
        <span className="font-medium text-[var(--text)]">Property</span>
        <select name="propertyId" required defaultValue={defaultValues?.propertyId} className="input">
          <option value="" disabled>
            Select a property
          </option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.country}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-[var(--text)]">Tenant name</span>
        <input name="tenantName" required defaultValue={defaultValues?.tenantName} className="input" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-[var(--text)]">Tenant contact</span>
        <input name="tenantContact" defaultValue={defaultValues?.tenantContact ?? undefined} className="input" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-[var(--text)]">Start date</span>
        <input type="date" name="startDate" required defaultValue={startDate} className="input" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-[var(--text)]">End date</span>
        <input type="date" name="endDate" required defaultValue={endDate} className="input" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-[var(--text)]">Rent amount</span>
        <input type="number" step="0.01" name="rentAmount" required defaultValue={defaultValues?.rentAmount} className="input" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-[var(--text)]">Currency</span>
        <input name="currency" defaultValue={defaultValues?.currency ?? "USD"} className="input" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-[var(--text)]">Frequency</span>
        <select name="frequency" defaultValue={defaultValues?.frequency ?? "MONTHLY"} className="input">
          <option value="MONTHLY">Monthly</option>
          <option value="QUARTERLY">Quarterly</option>
          <option value="ANNUAL">Annual</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-[var(--text)]">Status</span>
        <select name="status" defaultValue={defaultValues?.status ?? "ACTIVE"} className="input">
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="TERMINATED">Terminated</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-[var(--text)]">Deposit amount</span>
        <input type="number" step="0.01" name="depositAmount" defaultValue={defaultValues?.depositAmount ?? undefined} className="input" />
      </label>
      <label className="col-span-full flex flex-col gap-1 text-sm">
        <span className="font-medium text-[var(--text)]">Notes</span>
        <textarea name="notes" defaultValue={defaultValues?.notes ?? undefined} className="input" rows={3} />
      </label>
      <div className="col-span-full flex justify-end">
        <button type="submit" className="rounded-lg bg-brand-950 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          Save lease
        </button>
      </div>
    </form>
  );
}
