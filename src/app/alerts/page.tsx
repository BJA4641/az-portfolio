import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { formatDate, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

type Alert = {
  type: "Tax" | "Fee" | "Rent" | "Lease" | "Maintenance";
  title: string;
  subtitle: string;
  date: Date;
  amount?: { value: number; currency: string };
  overdue: boolean;
  href: string;
};

const TYPE_STYLES: Record<Alert["type"], string> = {
  Tax: "bg-orange-50 text-orange-700",
  Fee: "bg-orange-50 text-orange-700",
  Rent: "bg-blue-50 text-blue-700",
  Lease: "bg-violet-50 text-violet-700",
  Maintenance: "bg-emerald-50 text-emerald-700"
};

export default async function AlertsPage() {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const [taxes, fees, rentPayments, leases, maintenance] = await Promise.all([
    db.tax.findMany({
      where: { status: { in: ["PENDING", "OVERDUE"] }, dueDate: { lte: in30Days } },
      include: { property: { select: { name: true } } },
      orderBy: { dueDate: "asc" }
    }),
    db.fee.findMany({
      where: { status: { in: ["PENDING", "OVERDUE"] }, dueDate: { lte: in30Days } },
      include: { property: { select: { name: true } } },
      orderBy: { dueDate: "asc" }
    }),
    db.rentPayment.findMany({
      where: { status: { in: ["PENDING", "LATE"] }, dueDate: { lte: in30Days } },
      include: { lease: { select: { tenantName: true, property: { select: { name: true } } } } },
      orderBy: { dueDate: "asc" }
    }),
    db.lease.findMany({
      where: { status: "ACTIVE", endDate: { lte: in60Days } },
      include: { property: { select: { name: true } } },
      orderBy: { endDate: "asc" }
    }),
    db.maintenanceVisit.findMany({
      where: { status: "SCHEDULED", visitDate: { lte: in30Days } },
      include: { property: { select: { name: true } } },
      orderBy: { visitDate: "asc" }
    })
  ]);

  const alerts: Alert[] = [
    ...taxes.map((t) => ({
      type: "Tax" as const,
      title: t.property.name,
      subtitle: t.taxType,
      date: t.dueDate,
      amount: { value: t.amount, currency: t.currency },
      overdue: t.dueDate < now,
      href: "/taxes"
    })),
    ...fees.map((f) => ({
      type: "Fee" as const,
      title: f.property.name,
      subtitle: f.feeType,
      date: f.dueDate,
      amount: { value: f.amount, currency: f.currency },
      overdue: f.dueDate < now,
      href: "/taxes"
    })),
    ...rentPayments.map((r) => ({
      type: "Rent" as const,
      title: r.lease.property.name,
      subtitle: `Rent from ${r.lease.tenantName}`,
      date: r.dueDate,
      amount: { value: r.amount, currency: r.currency },
      overdue: r.dueDate < now,
      href: "/leases"
    })),
    ...leases.map((l) => ({
      type: "Lease" as const,
      title: l.property.name,
      subtitle: `Lease with ${l.tenantName} ends`,
      date: l.endDate,
      overdue: l.endDate < now,
      href: `/leases/${l.id}`
    })),
    ...maintenance.map((m) => ({
      type: "Maintenance" as const,
      title: m.property.name,
      subtitle: m.description,
      date: m.visitDate,
      overdue: m.visitDate < now,
      href: "/maintenance"
    }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const overdue = alerts.filter((a) => a.overdue);
  const upcoming = alerts.filter((a) => !a.overdue);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Alerts"
        subtitle={`${overdue.length} overdue, ${upcoming.length} coming up in the next 30–60 days`}
      />

      <AlertSection title="Overdue" items={overdue} emptyText="Nothing overdue." />
      <AlertSection title="Upcoming" items={upcoming} emptyText="Nothing coming up." />
    </div>
  );
}

function AlertSection({ title, items, emptyText }: { title: string; items: Alert[]; emptyText: string }) {
  return (
    <div className="card overflow-hidden">
      <h2 className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--text)]">
        {title} ({items.length})
      </h2>
      {items.length === 0 ? (
        <p className="px-4 py-6 text-sm text-[var(--text-muted)]">{emptyText}</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="table-row-hover border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[item.type]}`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={item.href} className="font-medium text-brand-700 hover:underline">
                    {item.title}
                  </Link>
                  <p className="text-xs text-[var(--text-muted)]">{item.subtitle}</p>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {item.amount ? formatMoney(item.amount.value, item.amount.currency) : "—"}
                </td>
                <td className="px-4 py-3 text-right text-[var(--text-muted)]">{formatDate(item.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
