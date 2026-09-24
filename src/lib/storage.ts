import { createClient } from "@supabase/supabase-js";

// Document storage for attachments, backed by Supabase Storage (already in
// this app's stack alongside the Postgres database). Requires SUPABASE_URL
// and SUPABASE_SERVICE_ROLE_KEY, plus a storage bucket named ATTACHMENTS_BUCKET
// to exist in that Supabase project. Callers should check isStorageConfigured()
// before offering upload UI.

const ATTACHMENTS_BUCKET = "attachments";
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export function isStorageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Document storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }
  return createClient(url, key);
}

export { MAX_FILE_SIZE_BYTES };

export async function uploadObject(storageKey: string, file: File): Promise<void> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File is too large (max ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB)`);
  }
  const bytes = await file.arrayBuffer();
  const { error } = await client()
    .storage.from(ATTACHMENTS_BUCKET)
    .upload(storageKey, bytes, { contentType: file.type || "application/octet-stream" });
  if (error) throw new Error(`Upload failed: ${error.message}`);
}

export async function deleteObject(storageKey: string): Promise<void> {
  const { error } = await client().storage.from(ATTACHMENTS_BUCKET).remove([storageKey]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

export async function getSignedDownloadUrl(storageKey: string): Promise<string> {
  const { data, error } = await client()
    .storage.from(ATTACHMENTS_BUCKET)
    .createSignedUrl(storageKey, 60 * 5);
  if (error || !data) throw new Error(`Could not create download link: ${error?.message}`);
  return data.signedUrl;
}
