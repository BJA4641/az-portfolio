"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/rbac";

const compSchema = z.object({
  addressLine: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  areaSqm: z.coerce.number().positive(),
  salePrice: z.coerce.number().optional().nullable(),
  monthlyRent: z.coerce.number().optional().nullable(),
  currency: z.string().min(1),
  observedDate: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export async function createComparable(propertyId: string, formData: FormData) {
  const data = compSchema.parse({
    addressLine: formData.get("addressLine"),
    city: formData.get("city"),
    country: formData.get("country"),
    areaSqm: formData.get("areaSqm"),
    salePrice: formData.get("salePrice") || null,
    monthlyRent: formData.get("monthlyRent") || null,
    currency: formData.get("currency"),
    observedDate: formData.get("observedDate") || null,
    source: formData.get("source") || null,
    notes: formData.get("notes") || null
  });
  await db.comparable.create({
    data: {
      ...data,
      propertyId,
      observedDate: data.observedDate ? new Date(data.observedDate) : null
    }
  });
  revalidatePath(`/properties/${propertyId}/market`);
}

export async function deleteComparable(formData: FormData) {
  await requireOwner();
  const id = formData.get("id") as string;
  const propertyId = formData.get("propertyId") as string;
  await db.comparable.delete({ where: { id } });
  revalidatePath(`/properties/${propertyId}/market`);
}

const assumptionsSchema = z.object({
  areaSqm: z.coerce.number().positive().optional().nullable(),
  appreciationRateOverride: z.coerce.number().optional().nullable(),
  rentGrowthRateOverride: z.coerce.number().optional().nullable()
});

export async function updateForecastAssumptions(propertyId: string, formData: FormData) {
  const raw = {
    areaSqm: formData.get("areaSqm") || null,
    appreciationRateOverride: formData.get("appreciationRateOverride") || null,
    rentGrowthRateOverride: formData.get("rentGrowthRateOverride") || null
  };
  const data = assumptionsSchema.parse(raw);
  await db.property.update({
    where: { id: propertyId },
    data: {
      areaSqm: data.areaSqm,
      appreciationRateOverride: data.appreciationRateOverride != null ? data.appreciationRateOverride / 100 : null,
      rentGrowthRateOverride: data.rentGrowthRateOverride != null ? data.rentGrowthRateOverride / 100 : null
    }
  });
  revalidatePath(`/properties/${propertyId}/market`);
}
