export function StatTile({
  label,
  value,
  hint
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--text)]">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}
