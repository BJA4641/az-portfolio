"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/rbac";
import { nextReference } from "@/lib/reference";

const requestSchema = z.object({
  description: z.string().min(1)
});

export async function createMaintenanceRequest(formData: FormData) {
  const leaseId = await requireTenant();
  const data = requestSchema.parse({ description: formData.get("description") });

  const lease = await db.lease.findUniqueOrThrow({ where: { id: leaseId }, select: { propertyId: true } });
  const referenceNo = await nextReference("WO");

  await db.maintenanceVisit.create({
    data: {
      propertyId: lease.propertyId,
      visitDate: new Date(),
      description: data.description,
      status: "REQUESTED",
      referenceNo,
      // Undetermined cost yet - needs triage and an explicit approval once estimated.
      approvalStatus: "OPEN"
    }
  });
  revalidatePath("/portal/maintenance");
}
