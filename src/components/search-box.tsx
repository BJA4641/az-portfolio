export function SearchBox({ action, defaultValue, placeholder }: { action: string; defaultValue?: string; placeholder: string }) {
  return (
    <form action={action} method="GET" className="mb-4">
      <input
        type="text"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="input w-full max-w-sm"
      />
    </form>
  );
}
