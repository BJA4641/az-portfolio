import { db } from "@/lib/db";
import { StatTile } from "@/components/stat-tile";
import { PropertyStatusChart } from "@/components/charts/property-status-chart";
import { CountryValueChart } from "@/components/charts/country-value-chart";
import { formatDate, formatMoney } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const [
    properties,
    activeLeaseCount,
    rentPaidThisMonth,
    taxesDue,
    maintenanceScheduled,
    upcomingLeases,
    upcomingMaintenance
  ] = await Promise.all([
    db.property.findMany({
      select: { status: true, country: true, currentValue: true, purchasePrice: true }
    }),
    db.lease.count({ where: { status: "ACTIVE" } }),
    db.rentPayment.aggregate({
      _sum: { amount: true },
      where: { status: "PAID", paidDate: { gte: startOfMonth, lte: endOfMonth } }
    }),
    db.tax.aggregate({
      _sum: { amount: true },
      where: { status: "PENDING", dueDate: { lte: in30Days } }
    }),
    db.maintenanceVisit.count({ where: { status: "SCHEDULED" } }),
    db.lease.findMany({
      where: { status: "ACTIVE", endDate: { lte: in60Days } },
      include: { property: { select: { name: true, country: true } } },
      orderBy: { endDate: "asc" },
      take: 5
    }),
    db.maintenanceVisit.findMany({
      where: { status: "SCHEDULED" },
      include: { property: { select: { name: true } } },
      orderBy: { visitDate: "asc" },
      take: 5
    })
  ]);

  const ownedProperties = properties.filter((p) => p.status !== "SOLD");
  const portfolioValue = ownedProperties.reduce(
    (sum, p) => sum + (p.currentValue ?? p.purchasePrice ?? 0),
    0
  );
  const occupancyRate =
    ownedProperties.length > 0
      ? Math.round((activeLeaseCount / ownedProperties.length) * 100)
      : 0;

  const statusCounts = properties.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  const valueByCountryMap = ownedProperties.reduce<Record<string, number>>((acc, p) => {
    acc[p.country] = (acc[p.country] ?? 0) + (p.currentValue ?? p.purchasePrice ?? 0);
    return acc;
  }, {});
  const valueByCountry = Object.entries(valueByCountryMap)
    .map(([country, value]) => ({ country, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Portfolio overview</h1>
        <p className="text-sm text-[var(--text-muted)]">
          {formatDate(now)} — across {new Set(properties.map((p) => p.country)).size} countries
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Properties" value={String(properties.length)} />
        <StatTile label="Portfolio value" value={formatMoney(portfolioValue, "USD")} />
        <StatTile
          label="Rent collected"
          value={formatMoney(rentPaidThisMonth._sum.amount ?? 0, "USD")}
          hint="This month"
        />
        <StatTile label="Occupancy" value={`${occupancyRate}%`} hint={`${activeLeaseCount} active leases`} />
        <StatTile
          label="Taxes due"
          value={formatMoney(taxesDue._sum.amount ?? 0, "USD")}
          hint="Next 30 days"
        />
        <StatTile label="Maintenance" value={String(maintenanceScheduled)} hint="Scheduled visits" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Properties by status</h2>
          <PropertyStatusChart counts={statusCounts} />
        </div>
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Portfolio value by country</h2>
          {valueByCountry.length > 0 ? (
            <CountryValueChart data={valueByCountry} />
          ) : (
            <p className="py-10 text-center text-sm text-[var(--text-muted)]">No data yet</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Upcoming lease expirations</h2>
          {upcomingLeases.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Nothing in the next 60 days.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {upcomingLeases.map((lease) => (
                  <tr key={lease.id} className="table-row-hover border-t border-[var(--border)]">
                    <td className="py-2">
                      <Link href="/leases" className="font-medium text-brand-700 hover:underline">
                        {lease.property.name}
                      </Link>
                      <p className="text-xs text-[var(--text-muted)]">{lease.property.country}</p>
                    </td>
                    <td className="py-2 text-right text-[var(--text-muted)]">
                      {formatDate(lease.endDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Upcoming maintenance</h2>
          {upcomingMaintenance.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Nothing scheduled.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {upcomingMaintenance.map((visit) => (
                  <tr key={visit.id} className="table-row-hover border-t border-[var(--border)]">
                    <td className="py-2">
                      <Link href="/maintenance" className="font-medium text-brand-700 hover:underline">
                        {visit.property.name}
                      </Link>
                      <p className="text-xs text-[var(--text-muted)]">{visit.vendorName}</p>
                    </td>
                    <td className="py-2 text-right text-[var(--text-muted)]">
                      {formatDate(visit.visitDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
