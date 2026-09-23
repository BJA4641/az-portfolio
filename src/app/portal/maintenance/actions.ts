"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/rbac";

const requestSchema = z.object({
  description: z.string().min(1)
});

export async function createMaintenanceRequest(formData: FormData) {
  const leaseId = await requireTenant();
  const data = requestSchema.parse({ description: formData.get("description") });

  const lease = await db.lease.findUniqueOrThrow({ where: { id: leaseId }, select: { propertyId: true } });

  await db.maintenanceVisit.create({
    data: {
      propertyId: lease.propertyId,
      visitDate: new Date(),
      description: data.description,
      status: "REQUESTED"
    }
  });
  revalidatePath("/portal/maintenance");
}
