"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/rbac";
import { nextReference } from "@/lib/reference";

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
  await requireOwner();
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
  await requireOwner();
  const id = formData.get("id") as string;
  const leaseId = formData.get("leaseId") as string;
  await db.rentPayment.delete({ where: { id } });
  revalidatePath(`/leases/${leaseId}`);
}

const tenantAccessSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1)
});

/** Creates or updates the tenant login for this lease. Only the owner can grant portal access. */
export async function setTenantAccess(leaseId: string, formData: FormData) {
  await requireOwner();
  const data = tenantAccessSchema.parse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name")
  });
  const passwordHash = await bcrypt.hash(data.password, 10);

  await db.user.upsert({
    where: { email: data.email.toLowerCase() },
    update: { passwordHash, name: data.name, role: "TENANT", leaseId },
    create: {
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name,
      role: "TENANT",
      leaseId
    }
  });
  revalidatePath(`/leases/${leaseId}`);
}

export async function revokeTenantAccess(formData: FormData) {
  await requireOwner();
  const userId = formData.get("userId") as string;
  const leaseId = formData.get("leaseId") as string;
  await db.user.delete({ where: { id: userId } });
  revalidatePath(`/leases/${leaseId}`);
}

const FREQUENCY_MONTHS: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, ANNUAL: 12 };

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

const scheduleSchema = z.object({
  totalRent: z.coerce.number().positive(),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]),
  installmentCount: z.coerce.number().int().min(1).max(60),
  firstDueDate: z.string().min(1)
});

/** Generates a rent schedule + its installment plan upfront from a lease. */
export async function generateRentSchedule(leaseId: string, formData: FormData) {
  const data = scheduleSchema.parse({
    totalRent: formData.get("totalRent"),
    frequency: formData.get("frequency"),
    installmentCount: formData.get("installmentCount"),
    firstDueDate: formData.get("firstDueDate")
  });
  const referenceNo = await nextReference("RS");
  const amountPerInstallment = data.totalRent / data.installmentCount;
  const stepMonths = FREQUENCY_MONTHS[data.frequency];
  const firstDue = new Date(data.firstDueDate);

  await db.rentSchedule.create({
    data: {
      referenceNo,
      leaseId,
      totalRent: data.totalRent,
      frequency: data.frequency,
      installmentCount: data.installmentCount,
      firstDueDate: firstDue,
      installments: {
        create: Array.from({ length: data.installmentCount }, (_, i) => ({
          sequence: i + 1,
          dueDate: addMonths(firstDue, i * stepMonths),
          amount: amountPerInstallment
        }))
      }
    }
  });
  revalidatePath(`/leases/${leaseId}`);
}

export async function cancelRentSchedule(formData: FormData) {
  await requireOwner();
  const id = formData.get("id") as string;
  const leaseId = formData.get("leaseId") as string;
  await db.rentSchedule.update({ where: { id }, data: { status: "CANCELLED" } });
  revalidatePath(`/leases/${leaseId}`);
}

const installmentPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  paidDate: z.string().min(1)
});

/** Records a (possibly partial) payment against a specific installment. */
export async function recordInstallmentPayment(leaseId: string, installmentId: string, formData: FormData) {
  const data = installmentPaymentSchema.parse({
    amount: formData.get("amount"),
    paidDate: formData.get("paidDate")
  });
  const installment = await db.installment.findUniqueOrThrow({
    where: { id: installmentId },
    include: { rentPayments: true }
  });
  const paidSoFar = installment.rentPayments.reduce((sum, p) => sum + p.amount, 0);
  if (paidSoFar + data.amount > installment.amount + 0.01) {
    throw new Error(`This would overpay the installment (outstanding: ${(installment.amount - paidSoFar).toFixed(2)}).`);
  }

  const lease = await db.lease.findUniqueOrThrow({ where: { id: leaseId }, select: { currency: true } });
  await db.rentPayment.create({
    data: {
      leaseId,
      installmentId,
      dueDate: installment.dueDate,
      paidDate: new Date(data.paidDate),
      amount: data.amount,
      currency: lease.currency,
      status: "PAID"
    }
  });
  revalidatePath(`/leases/${leaseId}`);
}
