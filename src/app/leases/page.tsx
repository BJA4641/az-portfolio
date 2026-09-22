import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/delete-button";
import { SearchBox } from "@/components/search-box";
import { Pagination } from "@/components/pagination";
import { deleteLease } from "./actions";
import { formatDate, formatMoney } from "@/lib/format";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-blue-50 text-blue-700",
  EXPIRED: "bg-gray-100 text-gray-600",
  TERMINATED: "bg-red-50 text-red-700"
};

export default async function LeasesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const where: Prisma.LeaseWhereInput = q
    ? {
        OR: [
          { tenantName: { contains: q, mode: "insensitive" } },
          { property: { name: { contains: q, mode: "insensitive" } } },
          { property: { country: { contains: q, mode: "insensitive" } } }
        ]
      }
    : {};

  const [leases, total] = await Promise.all([
    db.lease.findMany({
      where,
      include: { property: { select: { name: true, country: true } } },
      orderBy: { startDate: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    db.lease.count({ where })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <PageHeader title="Leases & rent" subtitle={`${total} leases`} />
        <Link href="/leases/new" className="rounded-lg bg-brand-950 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          Add lease
        </Link>
      </div>

      <SearchBox action="/leases" defaultValue={q} placeholder="Search by tenant, property, or country..." />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Rent</th>
              <th className="px-4 py-3">Ends</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {leases.map((lease) => (
              <tr key={lease.id} className="table-row-hover border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 font-medium">
                  {lease.property.name}
                  <p className="text-xs text-[var(--text-muted)]">{lease.property.country}</p>
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{lease.tenantName}</td>
                <td className="px-4 py-3 tabular-nums">
                  {formatMoney(lease.rentAmount, lease.currency)} / {lease.frequency.toLowerCase()}
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(lease.endDate)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[lease.status]}`}>
                    {lease.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/leases/${lease.id}`} className="text-xs font-medium text-brand-700 hover:underline">
                      Manage
                    </Link>
                    <DeleteButton action={deleteLease} id={lease.id} />
                  </div>
                </td>
              </tr>
            ))}
            {leases.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  {q ? `No leases match "${q}".` : "No leases yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} basePath="/leases" q={q} />
      </div>
    </div>
  );
}
