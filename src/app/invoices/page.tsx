import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { formatDate, formatMoney } from "@/lib/format";
import { computeInvoiceStatus, INVOICE_STATUS_STYLES } from "@/lib/invoices";
import { createInvoice } from "./actions";

export const dynamic = "force-dynamic";

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ woId?: string }> }) {
  const { woId } = await searchParams;

  const [approvedVisits, invoices] = await Promise.all([
    db.maintenanceVisit.findMany({
      where: { approvalStatus: "APPROVED", vendorId: { not: null } },
      include: { property: { select: { name: true } }, vendor: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    }),
    db.invoice.findMany({
      include: {
        payments: { select: { amount: true } },
        vendor: { select: { name: true } },
        maintenanceVisit: { include: { property: { select: { name: true } } } }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Invoices & Payments" subtitle="Supplier payables raised against approved expense & orders" />

      <div className="card p-5">
        <h2 className="mb-1 text-sm font-semibold text-[var(--text)]">Create invoice</h2>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          Property, vendor, and currency come from the selected expense & order — only approved ones with a vendor
          on file are listed.
        </p>
        {approvedVisits.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            No approved expense & orders with a vendor yet. Approve one on the{" "}
            <Link href="/maintenance" className="text-brand-700 hover:underline">
              Maintenance
            </Link>{" "}
            page first.
          </p>
        ) : (
          <form action={createInvoice} className="grid grid-cols-2 gap-3 sm:grid-cols-6">
            <select name="maintenanceVisitId" defaultValue={woId ?? ""} required className="input col-span-2">
              <option value="" disabled>
                Choose expense & order...
              </option>
              {approvedVisits.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.referenceNo ?? v.id} · {v.description} · {v.property.name}
                </option>
              ))}
            </select>
            <input name="supplierInvoiceNumber" placeholder="Supplier invoice #" className="input" />
            <input type="date" name="invoiceDate" required placeholder="Invoice date" className="input" />
            <input type="date" name="dueDate" required placeholder="Due date" className="input" />
            <input type="number" step="0.01" name="amount" required placeholder="Amount" className="input" />
            <button type="submit" className="col-span-2 rounded-lg bg-brand-950 px-3 py-2 text-sm font-semibold text-white hover:opacity-90 sm:col-span-1">
              Create invoice
            </button>
          </form>
        )}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Outstanding</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
              const status = computeInvoiceStatus(inv, paid);
              return (
                <tr key={inv.id} className="table-row-hover border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/invoices/${inv.id}`} className="text-brand-700 hover:underline">
                      {inv.referenceNo}
                    </Link>
                    {inv.supplierInvoiceNumber && (
                      <p className="text-xs text-[var(--text-muted)]">Supplier #{inv.supplierInvoiceNumber}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{inv.vendor.name}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{inv.maintenanceVisit.property.name}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(inv.dueDate)}</td>
                  <td className="px-4 py-3 tabular-nums">{formatMoney(inv.amount, inv.currency)}</td>
                  <td className="px-4 py-3 tabular-nums">{formatMoney(Math.max(inv.amount - paid, 0), inv.currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${INVOICE_STATUS_STYLES[status]}`}>
                      {status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/invoices/${inv.id}`} className="text-xs font-medium text-brand-700 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  No invoices yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
