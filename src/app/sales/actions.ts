"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/rbac";

const brokerSchema = z.object({
  name: z.string().min(1),
  agencyName: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  defaultCommissionRate: z.coerce.number().optional().nullable(),
  country: z.string().min(1)
});

export async function createBroker(formData: FormData) {
  const data = brokerSchema.parse({
    name: formData.get("name"),
    agencyName: formData.get("agencyName") || null,
    contact: formData.get("contact") || null,
    email: formData.get("email") || null,
    defaultCommissionRate: formData.get("defaultCommissionRate") || null,
    country: formData.get("country")
  });
  await db.broker.create({ data });
  revalidatePath("/sales");
}

export async function deleteBroker(formData: FormData) {
  await requireOwner();
  const id = formData.get("id") as string;
  await db.broker.delete({ where: { id } });
  revalidatePath("/sales");
}

const saleSchema = z.object({
  propertyId: z.string().min(1),
  saleDate: z.string().min(1),
  salePrice: z.coerce.number(),
  currency: z.string().min(1),
  buyerName: z.string().min(1),
  buyerContact: z.string().optional().nullable(),
  brokerId: z.string().optional().nullable(),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"])
});

export async function createSale(formData: FormData) {
  const data = saleSchema.parse({
    propertyId: formData.get("propertyId"),
    saleDate: formData.get("saleDate"),
    salePrice: formData.get("salePrice"),
    currency: formData.get("currency"),
    buyerName: formData.get("buyerName"),
    buyerContact: formData.get("buyerContact") || null,
    brokerId: formData.get("brokerId") || null,
    status: formData.get("status")
  });
  await db.sale.create({
    data: { ...data, saleDate: new Date(data.saleDate) }
  });
  if (data.status === "COMPLETED") {
    await db.property.update({ where: { id: data.propertyId }, data: { status: "SOLD" } });
  }
  revalidatePath("/sales");
  revalidatePath("/properties");
}

export async function deleteSale(formData: FormData) {
  await requireOwner();
  const id = formData.get("id") as string;
  await db.sale.delete({ where: { id } });
  revalidatePath("/sales");
}

const commissionSchema = z.object({
  brokerId: z.string().min(1),
  saleId: z.string().optional().nullable(),
  leaseId: z.string().optional().nullable(),
  amount: z.coerce.number(),
  currency: z.string().min(1),
  rate: z.coerce.number().optional().nullable(),
  status: z.enum(["PENDING", "PAID"])
});

export async function createCommission(formData: FormData) {
  const data = commissionSchema.parse({
    brokerId: formData.get("brokerId"),
    saleId: formData.get("saleId") || null,
    leaseId: formData.get("leaseId") || null,
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    rate: formData.get("rate") || null,
    status: formData.get("status")
  });
  await db.commission.create({ data });
  revalidatePath("/sales");
}

export async function markCommissionPaid(id: string) {
  await db.commission.update({ where: { id }, data: { status: "PAID", paidDate: new Date() } });
  revalidatePath("/sales");
}

export async function deleteCommission(formData: FormData) {
  await requireOwner();
  const id = formData.get("id") as string;
  await db.commission.delete({ where: { id } });
  revalidatePath("/sales");
}
