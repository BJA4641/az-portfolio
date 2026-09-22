import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  basePath,
  q
}: {
  page: number;
  totalPages: number;
  basePath: string;
  q?: string;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3 text-sm">
      <span className="text-[var(--text-muted)]">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Link
          href={hrefFor(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={`rounded-lg border border-[var(--border)] px-3 py-1 ${
            page <= 1 ? "pointer-events-none text-[var(--text-muted)]" : "hover:bg-gray-50"
          }`}
        >
          Previous
        </Link>
        <Link
          href={hrefFor(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={`rounded-lg border border-[var(--border)] px-3 py-1 ${
            page >= totalPages ? "pointer-events-none text-[var(--text-muted)]" : "hover:bg-gray-50"
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
