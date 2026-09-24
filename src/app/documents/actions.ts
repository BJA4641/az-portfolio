"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/rbac";
import { getSessionUserId } from "@/lib/rbac";
import { deleteObject, isStorageConfigured, uploadObject } from "@/lib/storage";

const uploadSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  entityLabel: z.string().min(1),
  description: z.string().optional().nullable(),
  revalidate: z.string().min(1)
});

export async function uploadDocument(formData: FormData) {
  if (!isStorageConfigured()) {
    throw new Error("Document storage is not connected yet (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }
  const data = uploadSchema.parse({
    entityType: formData.get("entityType"),
    entityId: formData.get("entityId"),
    entityLabel: formData.get("entityLabel"),
    description: formData.get("description") || null,
    revalidate: formData.get("revalidate")
  });
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    throw new Error("Choose a file to upload");
  }

  const uploadedById = await getSessionUserId();
  const storageKey = `${data.entityType}/${data.entityId}/${Date.now()}-${file.name}`;
  await uploadObject(storageKey, file);

  await db.attachment.create({
    data: {
      entityType: data.entityType,
      entityId: data.entityId,
      entityLabel: data.entityLabel,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
      storageKey,
      description: data.description,
      uploadedById
    }
  });
  revalidatePath(data.revalidate);
  revalidatePath("/documents");
}

const deleteSchema = z.object({
  id: z.string().min(1),
  storageKey: z.string().min(1),
  revalidate: z.string().min(1)
});

export async function deleteDocument(formData: FormData) {
  await requireOwner();
  const data = deleteSchema.parse({
    id: formData.get("id"),
    storageKey: formData.get("storageKey"),
    revalidate: formData.get("revalidate")
  });
  await deleteObject(data.storageKey).catch(() => {
    // Storage object may already be gone; still remove the metadata row.
  });
  await db.attachment.delete({ where: { id: data.id } });
  revalidatePath(data.revalidate);
  revalidatePath("/documents");
}
