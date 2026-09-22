"use client";

export function DeleteButton({
  action,
  id,
  confirmText = "Delete this record? This can't be undone."
}: {
  action: (formData: FormData) => void;
  id: string;
  confirmText?: string;
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
      <button
        type="submit"
        className="text-xs font-medium text-red-600 hover:underline"
      >
        Delete
      </button>
    </form>
  );
}
