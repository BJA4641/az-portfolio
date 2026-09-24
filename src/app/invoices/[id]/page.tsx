import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { formatDate, formatMoney } from "@/lib/format";
import { computeInvoiceStatus, INVOICE_STATUS_STYLES } from "@/lib/invoices";
import { getSessionRole } from "@/lib/rbac";
import { AttachmentPanel } from "@/components/documents/attachment-panel";
import { DeleteButton } from "@/components/delete-button";
import { recordPayment, voidInvoice } from "../actions";

export const dynamic = "force-dynamic";

const METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Bank transfer",
  CASH: "Cash",
  CHEQUE: "Cheque",
  CARD: "Card",
  OTHER: "Other"
};

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invoice, role] = await Promise.all([
    db.invoice.findUnique({
      where: { id },
      include: {
        payments: { orderBy: { paymentDate: "desc" } },
        vendor: true,
        maintenanceVisit: { include: { property: true } },
        createdBy: { select: { name: true } }
      }
    }),
    getSessionRole()
  ]);
  if (!invoice) notFound();

  const paid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  const outstanding = Math.max(invoice.amount - paid, 0);
  const status = computeInvoiceStatus(invoice, paid);
  const boundRecordPayment = recordPayment.bind(null, invoice.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={invoice.referenceNo}
          subtitle={`${invoice.maintenanceVisit.referenceNo ?? invoice.maintenanceVisit.id} · ${invoice.maintenanceVisit.property.name} · ${invoice.vendor.name}`}
        />
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${INVOICE_STATUS_STYLES[status]}`}>
            {status.replace("_", " ")}
          </span>
          {role === "OWNER" && !invoice.voided && (
            <DeleteButton
              action={voidInvoice}
              id={invoice.id}
              label="Void invoice"
              confirmText="Void this invoice? It stays in history but drops out of payable balances."
            />
          )}
        </div>
      </div>

      <div className="card grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[var(--text-muted)]">Invoice date</p>
          <p className="font-medium">{formatDate(invoice.invoiceDate)}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)]">Due date</p>
          <p className="font-medium">{formatDate(invoice.dueDate)}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)]">Amount</p>
          <p className="font-medium tabular-nums">{formatMoney(invoice.amount, invoice.currency)}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)]">Outstanding</p>
          <p className="font-medium tabular-nums">{formatMoney(outstanding, invoice.currency)}</p>
        </div>
        {invoice.supplierInvoiceNumber && (
          <div>
            <p className="text-xs text-[var(--text-muted)]">Supplier invoice #</p>
            <p className="font-medium">{invoice.supplierInvoiceNumber}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-[var(--text-muted)]">Created by</p>
          <p className="font-medium">{invoice.createdBy?.name ?? "—"}</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Payments</h2>
        <table className="mb-4 w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <th className="py-2">Reference</th>
              <th className="py-2">Date</th>
              <th className="py-2">Amount</th>
              <th className="py-2">Method</th>
              <th className="py-2">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {invoice.payments.map((p) => (
              <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                <td className="py-2">{p.referenceNo}</td>
                <td className="py-2 text-[var(--text-muted)]">{formatDate(p.paymentDate)}</td>
                <td className="py-2 tabular-nums">{formatMoney(p.amount, invoice.currency)}</td>
                <td className="py-2 text-[var(--text-muted)]">{METHOD_LABELS[p.method]}</td>
                <td className="py-2 text-xs text-[var(--text-muted)]">
                  {p.method === "BANK_TRANSFER" && [p.bankName, p.transferReference].filter(Boolean).join(" · ")}
                  {p.method === "CHEQUE" && p.chequeNumber && `Cheque #${p.chequeNumber}`}
                  {p.method === "CASH" && [p.cashReceiptNumber && `Receipt #${p.cashReceiptNumber}`, p.receivedBy && `Received by ${p.receivedBy}`].filter(Boolean).join(" · ")}
                  {p.notes}
                </td>
              </tr>
            ))}
            {invoice.payments.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-[var(--text-muted)]">
                  No payments recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {!invoice.voided && outstanding > 0 && (
          <form action={boundRecordPayment} className="grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-4">
            <input type="date" name="paymentDate" required className="input" placeholder="Payment date" />
            <input type="number" step="0.01" name="amount" required max={outstanding} defaultValue={outstanding} className="input" placeholder="Amount" />
            <select name="method" defaultValue="BANK_TRANSFER" className="input">
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
              <option value="CARD">Card</option>
              <option value="OTHER">Other</option>
            </select>
            <input name="bankName" placeholder="Bank name (if transfer)" className="input" />
            <input name="transferReference" placeholder="Transfer reference" className="input" />
            <input name="chequeNumber" placeholder="Cheque number" className="input" />
            <input name="cashReceiptNumber" placeholder="Cash receipt #" className="input" />
            <input name="receivedBy" placeholder="Received by (cash)" className="input" />
            <input name="notes" placeholder="Notes" className="input col-span-2" />
            <button type="submit" className="rounded-lg bg-brand-950 px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
              Record payment
            </button>
          </form>
        )}
      </div>

      <div className="card p-6">
        <AttachmentPanel
          entityType="Invoice"
          entityId={invoice.id}
          entityLabel={invoice.referenceNo}
          revalidatePath={`/invoices/${invoice.id}`}
        />
      </div>

      <Link href="/invoices" className="text-sm font-medium text-brand-700 hover:underline">
        ← Back to invoices
      </Link>
    </div>
  );
}
