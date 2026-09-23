"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/rbac";

const vendorSchema = z.object({
  name: z.string().min(1),
  contact: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  country: z.string().min(1)
});

export async function createVendor(formData: FormData) {
  const data = vendorSchema.parse({
    name: formData.get("name"),
    contact: formData.get("contact") || null,
    email: formData.get("email") || null,
    taxId: formData.get("taxId") || null,
    country: formData.get("country")
  });
  await db.vendor.create({ data });
  revalidatePath("/vendors");
}

export async function deleteVendor(formData: FormData) {
  await requireOwner();
  const id = formData.get("id") as string;
  await db.vendor.delete({ where: { id } });
  revalidatePath("/vendors");
}
