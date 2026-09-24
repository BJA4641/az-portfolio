"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/rbac";

const assetSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  propertyId: z.string().min(1),
  purchaseDate: z.string().optional().nullable(),
  value: z.coerce.number().optional().nullable(),
  currency: z.string().min(1),
  status: z.enum(["IN_USE", "STORED", "DISPOSED"])
});

export async function createAsset(formData: FormData) {
  const data = assetSchema.parse({
    name: formData.get("name"),
    category: formData.get("category"),
    propertyId: formData.get("propertyId"),
    purchaseDate: formData.get("purchaseDate") || null,
    value: formData.get("value") || null,
    currency: formData.get("currency"),
    status: formData.get("status")
  });
  await db.asset.create({
    data: { ...data, purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null }
  });
  revalidatePath("/assets");
}

export async function deleteAsset(formData: FormData) {
  await requireOwner();
  const id = formData.get("id") as string;
  await db.asset.delete({ where: { id } });
  revalidatePath("/assets");
}
