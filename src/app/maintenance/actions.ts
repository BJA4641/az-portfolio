"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/rbac";

const schema = z.object({
  propertyId: z.string().min(1),
  visitDate: z.string().min(1),
  vendorId: z.string().optional().nullable(),
  vendorName: z.string().optional().nullable(),
  description: z.string().min(1),
  cost: z.coerce.number().optional().nullable(),
  currency: z.string().min(1),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"])
});

export async function createMaintenanceVisit(formData: FormData) {
  const data = schema.parse({
    propertyId: formData.get("propertyId"),
    visitDate: formData.get("visitDate"),
    vendorId: formData.get("vendorId") || null,
    vendorName: formData.get("vendorName") || null,
    description: formData.get("description"),
    cost: formData.get("cost") || null,
    currency: formData.get("currency"),
    status: formData.get("status")
  });
  await db.maintenanceVisit.create({
    data: { ...data, visitDate: new Date(data.visitDate) }
  });
  revalidatePath("/maintenance");
}

export async function updateMaintenanceStatus(id: string, status: "SCHEDULED" | "COMPLETED" | "CANCELLED") {
  await db.maintenanceVisit.update({ where: { id }, data: { status } });
  revalidatePath("/maintenance");
}

const assignSchema = z.object({
  visitDate: z.string().min(1),
  vendorId: z.string().optional().nullable(),
  vendorName: z.string().optional().nullable(),
  cost: z.coerce.number().optional().nullable(),
  currency: z.string().min(1)
});

/** Triages a tenant-submitted REQUESTED item into a scheduled visit with a vendor assigned. */
export async function assignMaintenanceVisit(id: string, formData: FormData) {
  const data = assignSchema.parse({
    visitDate: formData.get("visitDate"),
    vendorId: formData.get("vendorId") || null,
    vendorName: formData.get("vendorName") || null,
    cost: formData.get("cost") || null,
    currency: formData.get("currency")
  });
  await db.maintenanceVisit.update({
    where: { id },
    data: { ...data, visitDate: new Date(data.visitDate), status: "SCHEDULED" }
  });
  revalidatePath("/maintenance");
}

export async function deleteMaintenanceVisit(formData: FormData) {
  await requireOwner();
  const id = formData.get("id") as string;
  await db.maintenanceVisit.delete({ where: { id } });
  revalidatePath("/maintenance");
}
