export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-[var(--text)]">{title}</h1>
      {subtitle && <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>}
    </div>
  );
}
