"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

const schema = z.object({
  propertyId: z.string().min(1),
  visitDate: z.string().min(1),
  vendorName: z.string().min(1),
  description: z.string().min(1),
  cost: z.coerce.number().optional().nullable(),
  currency: z.string().min(1),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"])
});

export async function createMaintenanceVisit(formData: FormData) {
  const data = schema.parse({
    propertyId: formData.get("propertyId"),
    visitDate: formData.get("visitDate"),
    vendorName: formData.get("vendorName"),
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

export async function deleteMaintenanceVisit(formData: FormData) {
  const id = formData.get("id") as string;
  await db.maintenanceVisit.delete({ where: { id } });
  revalidatePath("/maintenance");
}
