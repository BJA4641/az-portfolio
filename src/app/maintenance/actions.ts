"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ForbiddenError, getSessionRole, getSessionUserId, requireOwner } from "@/lib/rbac";
import { nextReference } from "@/lib/reference";

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
  const [role, createdById, referenceNo] = await Promise.all([
    getSessionRole(),
    getSessionUserId(),
    nextReference("WO")
  ]);
  await db.maintenanceVisit.create({
    data: {
      ...data,
      visitDate: new Date(data.visitDate),
      referenceNo,
      createdById,
      // The owner's own entries are self-approved; staff entries need sign-off
      // before an invoice can be raised against them.
      approvalStatus: role === "OWNER" ? "APPROVED" : "OPEN"
    }
  });
  revalidatePath("/maintenance");
}

/** Staff submits an OPEN expense & order for the owner's approval. */
export async function submitForApproval(id: string) {
  const visit = await db.maintenanceVisit.findUniqueOrThrow({ where: { id } });
  if (visit.approvalStatus !== "OPEN") throw new Error("Only open expense & orders can be submitted for approval");
  await db.maintenanceVisit.update({ where: { id }, data: { approvalStatus: "AWAITING_APPROVAL" } });
  revalidatePath("/maintenance");
}

/** Owner approves or rejects an expense & order. Only APPROVED ones can get an invoice. */
export async function setApprovalStatus(id: string, decision: "APPROVED" | "REJECTED") {
  const role = await getSessionRole();
  if (role !== "OWNER") throw new ForbiddenError("Only the portfolio owner can approve expenses.");
  await db.maintenanceVisit.update({ where: { id }, data: { approvalStatus: decision } });
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
  const role = await getSessionRole();
  await db.maintenanceVisit.update({
    where: { id },
    data: {
      ...data,
      visitDate: new Date(data.visitDate),
      status: "SCHEDULED",
      approvalStatus: role === "OWNER" ? "APPROVED" : "OPEN"
    }
  });
  revalidatePath("/maintenance");
}

export async function deleteMaintenanceVisit(formData: FormData) {
  await requireOwner();
  const id = formData.get("id") as string;
  await db.maintenanceVisit.delete({ where: { id } });
  revalidatePath("/maintenance");
}
