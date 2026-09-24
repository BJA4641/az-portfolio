export type InvoiceStatus = "VOID" | "PAID" | "PARTIALLY_PAID" | "OVERDUE" | "DUE";

/**
 * Invoice status is always derived from its payment history, never typed
 * manually — matches the rule that paid totals/balances come from payment
 * transactions, not a free-text header field.
 */
export function computeInvoiceStatus(invoice: { voided: boolean; amount: number; dueDate: Date }, paidTotal: number): InvoiceStatus {
  if (invoice.voided) return "VOID";
  if (paidTotal >= invoice.amount) return "PAID";
  if (paidTotal > 0) return "PARTIALLY_PAID";
  if (invoice.dueDate.getTime() < Date.now()) return "OVERDUE";
  return "DUE";
}

export const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  VOID: "bg-gray-100 text-gray-500 line-through",
  PAID: "bg-emerald-50 text-emerald-700",
  PARTIALLY_PAID: "bg-blue-50 text-blue-700",
  OVERDUE: "bg-red-50 text-red-700",
  DUE: "bg-orange-50 text-orange-700"
};
