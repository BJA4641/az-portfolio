"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

const listingSchema = z.object({
  isListed: z.coerce.boolean(),
  askingRent: z.coerce.number().optional().nullable(),
  listingDescription: z.string().optional().nullable()
});

export async function updateListing(propertyId: string, formData: FormData) {
  const data = listingSchema.parse({
    isListed: formData.get("isListed") === "on",
    askingRent: formData.get("askingRent") || null,
    listingDescription: formData.get("listingDescription") || null
  });
  await db.property.update({ where: { id: propertyId }, data });
  revalidatePath("/listings");
  revalidatePath(`/listing/${propertyId}`);
}
