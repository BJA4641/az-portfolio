import type { Property } from "@prisma/client";

const PROPERTY_TYPES = ["HOUSE", "APARTMENT", "COMMERCIAL", "LAND", "OTHER"];
const STATUSES = ["OWNED", "FOR_SALE", "SOLD"];

export function PropertyForm({
  action,
  defaultValues
}: {
  action: (formData: FormData) => void;
  defaultValues?: Partial<Property>;
}) {
  const purchaseDateValue = defaultValues?.purchaseDate
    ? new Date(defaultValues.purchaseDate).toISOString().slice(0, 10)
    : "";

  return (
    <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Property name">
        <input name="name" required defaultValue={defaultValues?.name} className="input" />
      </Field>
      <Field label="Country">
        <input name="country" required defaultValue={defaultValues?.country} className="input" />
      </Field>
      <Field label="Address">
        <input name="addressLine" required defaultValue={defaultValues?.addressLine} className="input" />
      </Field>
      <Field label="City">
        <input name="city" required defaultValue={defaultValues?.city} className="input" />
      </Field>
      <Field label="Type">
        <select name="propertyType" defaultValue={defaultValues?.propertyType ?? "HOUSE"} className="input">
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Status">
        <select name="status" defaultValue={defaultValues?.status ?? "OWNED"} className="input">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Currency">
        <input name="currency" defaultValue={defaultValues?.currency ?? "USD"} className="input" />
      </Field>
      <Field label="Current value">
        <input
          type="number"
          step="0.01"
          name="currentValue"
          defaultValue={defaultValues?.currentValue ?? undefined}
          className="input"
        />
      </Field>
      <Field label="Purchase price">
        <input
          type="number"
          step="0.01"
          name="purchasePrice"
          defaultValue={defaultValues?.purchasePrice ?? undefined}
          className="input"
        />
      </Field>
      <Field label="Purchase date">
        <input type="date" name="purchaseDate" defaultValue={purchaseDateValue} className="input" />
      </Field>
      <Field label="Notes" full>
        <textarea name="notes" defaultValue={defaultValues?.notes ?? undefined} className="input" rows={3} />
      </Field>
      <div className="col-span-full flex justify-end gap-2">
        <button type="submit" className="rounded-lg bg-brand-950 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          Save property
        </button>
      </div>
    </form>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${full ? "col-span-full" : ""}`}>
      <span className="font-medium text-[var(--text)]">{label}</span>
      {children}
    </label>
  );
}
