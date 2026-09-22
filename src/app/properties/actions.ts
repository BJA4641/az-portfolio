"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/rbac";

const propertySchema = z.object({
  name: z.string().min(1),
  addressLine: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  propertyType: z.enum(["HOUSE", "APARTMENT", "COMMERCIAL", "LAND", "OTHER"]),
  status: z.enum(["OWNED", "FOR_SALE", "SOLD"]),
  currency: z.string().min(1),
  purchasePrice: z.coerce.number().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  currentValue: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable()
});

function parseFormData(formData: FormData) {
  return propertySchema.parse({
    name: formData.get("name"),
    addressLine: formData.get("addressLine"),
    city: formData.get("city"),
    country: formData.get("country"),
    propertyType: formData.get("propertyType"),
    status: formData.get("status"),
    currency: formData.get("currency"),
    purchasePrice: formData.get("purchasePrice") || null,
    purchaseDate: formData.get("purchaseDate") || null,
    currentValue: formData.get("currentValue") || null,
    notes: formData.get("notes") || null
  });
}

export async function createProperty(formData: FormData) {
  const data = parseFormData(formData);
  await db.property.create({
    data: {
      ...data,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null
    }
  });
  revalidatePath("/properties");
  redirect("/properties");
}

export async function updateProperty(id: string, formData: FormData) {
  const data = parseFormData(formData);
  await db.property.update({
    where: { id },
    data: {
      ...data,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null
    }
  });
  revalidatePath("/properties");
  redirect("/properties");
}

export async function deleteProperty(formData: FormData) {
  await requireOwner();
  const id = formData.get("id") as string;
  await db.property.delete({ where: { id } });
  revalidatePath("/properties");
}
