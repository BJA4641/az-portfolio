"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const leaseSchema = z.object({
  propertyId: z.string().min(1),
  tenantName: z.string().min(1),
  tenantContact: z.string().optional().nullable(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  rentAmount: z.coerce.number(),
  currency: z.string().min(1),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]),
  status: z.enum(["ACTIVE", "EXPIRED", "TERMINATED"]),
  depositAmount: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable()
});

function parseLease(formData: FormData) {
  return leaseSchema.parse({
    propertyId: formData.get("propertyId"),
    tenantName: formData.get("tenantName"),
    tenantContact: formData.get("tenantContact") || null,
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    rentAmount: formData.get("rentAmount"),
    currency: formData.get("currency"),
    frequency: formData.get("frequency"),
    status: formData.get("status"),
    depositAmount: formData.get("depositAmount") || null,
    notes: formData.get("notes") || null
  });
}

export async function createLease(formData: FormData) {
  const data = parseLease(formData);
  await db.lease.create({
    data: {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate)
    }
  });
  revalidatePath("/leases");
  redirect("/leases");
}

export async function updateLease(id: string, formData: FormData) {
  const data = parseLease(formData);
  await db.lease.update({
    where: { id },
    data: {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate)
    }
  });
  revalidatePath("/leases");
  redirect("/leases");
}

export async function deleteLease(formData: FormData) {
  const id = formData.get("id") as string;
  await db.lease.delete({ where: { id } });
  revalidatePath("/leases");
}

const paymentSchema = z.object({
  dueDate: z.string().min(1),
  amount: z.coerce.number(),
  currency: z.string().min(1),
  status: z.enum(["PENDING", "PAID", "LATE", "MISSED"]),
  paidDate: z.string().optional().nullable()
});

export async function addRentPayment(leaseId: string, formData: FormData) {
  const data = paymentSchema.parse({
    dueDate: formData.get("dueDate"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    status: formData.get("status"),
    paidDate: formData.get("paidDate") || null
  });
  await db.rentPayment.create({
    data: {
      leaseId,
      dueDate: new Date(data.dueDate),
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      paidDate: data.paidDate ? new Date(data.paidDate) : null
    }
  });
  revalidatePath(`/leases/${leaseId}`);
}

export async function markRentPaid(leaseId: string, paymentId: string) {
  await db.rentPayment.update({
    where: { id: paymentId },
    data: { status: "PAID", paidDate: new Date() }
  });
  revalidatePath(`/leases/${leaseId}`);
}

export async function deleteRentPayment(formData: FormData) {
  const id = formData.get("id") as string;
  const leaseId = formData.get("leaseId") as string;
  await db.rentPayment.delete({ where: { id } });
  revalidatePath(`/leases/${leaseId}`);
}
