"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/rbac";

const countrySchema = z.object({
  name: z.string().min(1),
  isoCode: z.string().min(2).max(3),
  defaultCurrency: z.string().min(1),
  taxRate: z.coerce.number().optional().nullable(),
  timezone: z.string().optional().nullable()
});

export async function createCountry(formData: FormData) {
  const data = countrySchema.parse({
    name: formData.get("name"),
    isoCode: (formData.get("isoCode") as string)?.toUpperCase(),
    defaultCurrency: formData.get("defaultCurrency"),
    taxRate: formData.get("taxRate") || null,
    timezone: formData.get("timezone") || null
  });
  await db.country.create({ data });
  revalidatePath("/countries");
}

export async function deleteCountry(formData: FormData) {
  await requireOwner();
  const id = formData.get("id") as string;
  await db.country.delete({ where: { id } });
  revalidatePath("/countries");
}
