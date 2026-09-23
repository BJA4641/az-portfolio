import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { toDisplayCurrency, DISPLAY_CURRENCY } from "@/lib/currency";

export async function GET(request: NextRequest) {
  const year = parseInt(request.nextUrl.searchParams.get("year") ?? String(new Date().getFullYear()), 10);
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const [vendors, paidVisits] = await Promise.all([
    db.vendor.findMany({ orderBy: { name: "asc" } }),
    db.maintenanceVisit.findMany({
      where: {
        status: "COMPLETED",
        vendorId: { not: null },
        cost: { not: null },
        visitDate: { gte: yearStart, lt: yearEnd }
      },
      select: { vendorId: true, cost: true, currency: true }
    })
  ]);

  const totalsByVendor = new Map<string, number>();
  for (const v of paidVisits) {
    const usd = toDisplayCurrency(v.cost ?? 0, v.currency);
    totalsByVendor.set(v.vendorId!, (totalsByVendor.get(v.vendorId!) ?? 0) + usd);
  }

  const rows = vendors
    .map((v) => ({ vendor: v, total: totalsByVendor.get(v.id) ?? 0 }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);

  const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const lines = [
    ["Vendor", "Tax ID", `Total Paid (${DISPLAY_CURRENCY})`, "Requires 1099-NEC (>= $600)"].join(","),
    ...rows.map((r) =>
      [
        escapeCsv(r.vendor.name),
        escapeCsv(r.vendor.taxId ?? "Not on file"),
        r.total.toFixed(2),
        r.total >= 600 ? "Yes" : "No"
      ].join(",")
    )
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="1099-summary-${year}.csv"`
    }
  });
}
