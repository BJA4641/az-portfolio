"use client";

export function DeleteButton({
  action,
  id,
  extraFields,
  confirmText = "Delete this record? This can't be undone.",
  label = "Delete"
}: {
  action: (formData: FormData) => void;
  id: string;
  extraFields?: Record<string, string>;
  confirmText?: string;
  label?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      {extraFields &&
        Object.entries(extraFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      <button
        type="submit"
        className="text-xs font-medium text-red-600 hover:underline"
      >
        {label}
      </button>
    </form>
  );
}
