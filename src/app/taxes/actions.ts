"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/rbac";

const taxSchema = z.object({
  propertyId: z.string().min(1),
  taxType: z.string().min(1),
  country: z.string().min(1),
  taxYear: z.coerce.number(),
  amount: z.coerce.number(),
  currency: z.string().min(1),
  dueDate: z.string().min(1),
  status: z.enum(["PENDING", "PAID", "OVERDUE"])
});

export async function createTax(formData: FormData) {
  const data = taxSchema.parse({
    propertyId: formData.get("propertyId"),
    taxType: formData.get("taxType"),
    country: formData.get("country"),
    taxYear: formData.get("taxYear"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    dueDate: formData.get("dueDate"),
    status: formData.get("status")
  });
  await db.tax.create({ data: { ...data, dueDate: new Date(data.dueDate) } });
  revalidatePath("/taxes");
}

export async function markTaxPaid(id: string) {
  await db.tax.update({ where: { id }, data: { status: "PAID", paidDate: new Date() } });
  revalidatePath("/taxes");
}

export async function deleteTax(formData: FormData) {
  await requireOwner();
  const id = formData.get("id") as string;
  await db.tax.delete({ where: { id } });
  revalidatePath("/taxes");
}

const feeSchema = z.object({
  propertyId: z.string().min(1),
  feeType: z.string().min(1),
  amount: z.coerce.number(),
  currency: z.string().min(1),
  dueDate: z.string().min(1),
  status: z.enum(["PENDING", "PAID", "OVERDUE"])
});

export async function createFee(formData: FormData) {
  const data = feeSchema.parse({
    propertyId: formData.get("propertyId"),
    feeType: formData.get("feeType"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    dueDate: formData.get("dueDate"),
    status: formData.get("status")
  });
  await db.fee.create({ data: { ...data, dueDate: new Date(data.dueDate) } });
  revalidatePath("/taxes");
}

export async function markFeePaid(id: string) {
  await db.fee.update({ where: { id }, data: { status: "PAID", paidDate: new Date() } });
  revalidatePath("/taxes");
}

export async function deleteFee(formData: FormData) {
  await requireOwner();
  const id = formData.get("id") as string;
  await db.fee.delete({ where: { id } });
  revalidatePath("/taxes");
}
