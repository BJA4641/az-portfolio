"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUserId, requireOwner } from "@/lib/rbac";
import { nextReference } from "@/lib/reference";

const invoiceSchema = z.object({
  maintenanceVisitId: z.string().min(1),
  supplierInvoiceNumber: z.string().optional().nullable(),
  invoiceDate: z.string().min(1),
  dueDate: z.string().min(1),
  amount: z.coerce.number().positive()
});

export async function createInvoice(formData: FormData) {
  const data = invoiceSchema.parse({
    maintenanceVisitId: formData.get("maintenanceVisitId"),
    supplierInvoiceNumber: formData.get("supplierInvoiceNumber") || null,
    invoiceDate: formData.get("invoiceDate"),
    dueDate: formData.get("dueDate"),
    amount: formData.get("amount")
  });

  const visit = await db.maintenanceVisit.findUniqueOrThrow({ where: { id: data.maintenanceVisitId } });
  if (visit.approvalStatus !== "APPROVED") {
    throw new Error("This expense & order isn't approved yet — an invoice can only be raised against an approved one.");
  }
  if (!visit.vendorId) {
    throw new Error("This expense & order has no vendor on file yet.");
  }

  const existing = await db.invoice.findMany({
    where: { maintenanceVisitId: data.maintenanceVisitId, voided: false },
    select: { amount: true }
  });
  const alreadyInvoiced = existing.reduce((sum, i) => sum + i.amount, 0);
  if (visit.cost != null && alreadyInvoiced + data.amount > visit.cost + 0.01) {
    throw new Error(
      `Invoicing ${data.amount} would exceed the recorded cost (${visit.cost}); already invoiced ${alreadyInvoiced}.`
    );
  }

  if (data.supplierInvoiceNumber) {
    const duplicate = await db.invoice.findFirst({
      where: { vendorId: visit.vendorId, supplierInvoiceNumber: data.supplierInvoiceNumber, voided: false }
    });
    if (duplicate) {
      throw new Error("This supplier invoice number is already on file for this vendor.");
    }
  }

  const [referenceNo, createdById] = await Promise.all([nextReference("INV"), getSessionUserId()]);

  const invoice = await db.invoice.create({
    data: {
      referenceNo,
      maintenanceVisitId: data.maintenanceVisitId,
      vendorId: visit.vendorId,
      supplierInvoiceNumber: data.supplierInvoiceNumber,
      invoiceDate: new Date(data.invoiceDate),
      dueDate: new Date(data.dueDate),
      amount: data.amount,
      currency: visit.currency,
      createdById
    }
  });
  revalidatePath("/invoices");
  revalidatePath("/maintenance");
  redirect(`/invoices/${invoice.id}`);
}

const paymentSchema = z.object({
  paymentDate: z.string().min(1),
  amount: z.coerce.number().positive(),
  method: z.enum(["BANK_TRANSFER", "CASH", "CHEQUE", "CARD", "OTHER"]),
  notes: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  transferReference: z.string().optional().nullable(),
  chequeNumber: z.string().optional().nullable(),
  cashReceiptNumber: z.string().optional().nullable(),
  receivedBy: z.string().optional().nullable()
});

export async function recordPayment(invoiceId: string, formData: FormData) {
  const data = paymentSchema.parse({
    paymentDate: formData.get("paymentDate"),
    amount: formData.get("amount"),
    method: formData.get("method"),
    notes: formData.get("notes") || null,
    bankName: formData.get("bankName") || null,
    transferReference: formData.get("transferReference") || null,
    chequeNumber: formData.get("chequeNumber") || null,
    cashReceiptNumber: formData.get("cashReceiptNumber") || null,
    receivedBy: formData.get("receivedBy") || null
  });

  const invoice = await db.invoice.findUniqueOrThrow({ where: { id: invoiceId }, include: { payments: true } });
  if (invoice.voided) throw new Error("Cannot record a payment against a voided invoice.");
  const paidSoFar = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  if (paidSoFar + data.amount > invoice.amount + 0.01) {
    throw new Error(`This payment would overpay the invoice (outstanding: ${(invoice.amount - paidSoFar).toFixed(2)}).`);
  }

  const [referenceNo, createdById] = await Promise.all([nextReference("PAY"), getSessionUserId()]);

  await db.invoicePayment.create({
    data: {
      referenceNo,
      invoiceId,
      paymentDate: new Date(data.paymentDate),
      amount: data.amount,
      method: data.method,
      notes: data.notes,
      bankName: data.bankName,
      transferReference: data.transferReference,
      chequeNumber: data.chequeNumber,
      cashReceiptNumber: data.cashReceiptNumber,
      receivedBy: data.receivedBy,
      createdById
    }
  });
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
}

export async function voidInvoice(formData: FormData) {
  await requireOwner();
  const id = formData.get("id") as string;
  await db.invoice.update({ where: { id }, data: { voided: true } });
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
}
