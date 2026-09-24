import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { DeleteButton } from "@/components/delete-button";
import { getSignedDownloadUrl, isStorageConfigured } from "@/lib/storage";
import { deleteDocument, uploadDocument } from "@/app/documents/actions";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Reusable "documents" section: attach files to any record, download, delete. */
export async function AttachmentPanel({
  entityType,
  entityId,
  entityLabel,
  revalidatePath
}: {
  entityType: string;
  entityId: string;
  entityLabel: string;
  revalidatePath: string;
}) {
  const configured = isStorageConfigured();
  const attachments = await db.attachment.findMany({
    where: { entityType, entityId },
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" }
  });
  const downloadUrls = configured
    ? await Promise.all(attachments.map((a) => getSignedDownloadUrl(a.storageKey).catch(() => null)))
    : attachments.map(() => null);

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Documents</h2>
      {attachments.length > 0 && (
        <table className="mb-4 w-full text-sm">
          <tbody>
            {attachments.map((a, i) => (
              <tr key={a.id} className="border-b border-[var(--border)] last:border-0">
                <td className="py-2">
                  {downloadUrls[i] ? (
                    <a href={downloadUrls[i]!} className="font-medium text-brand-700 hover:underline" target="_blank" rel="noreferrer">
                      {a.fileName}
                    </a>
                  ) : (
                    <span className="font-medium">{a.fileName}</span>
                  )}
                  {a.description && <p className="text-xs text-[var(--text-muted)]">{a.description}</p>}
                </td>
                <td className="py-2 text-xs text-[var(--text-muted)]">{formatFileSize(a.fileSize)}</td>
                <td className="py-2 text-xs text-[var(--text-muted)]">
                  {a.uploadedBy?.name ?? "—"} · {formatDate(a.createdAt)}
                </td>
                <td className="py-2 text-right">
                  <DeleteButton
                    action={deleteDocument}
                    id={a.id}
                    extraFields={{ storageKey: a.storageKey, revalidate: revalidatePath }}
                    confirmText="Delete this document?"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {attachments.length === 0 && <p className="mb-4 text-sm text-[var(--text-muted)]">No documents attached yet.</p>}

      {configured ? (
        <form action={uploadDocument} encType="multipart/form-data" className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="entityType" value={entityType} />
          <input type="hidden" name="entityId" value={entityId} />
          <input type="hidden" name="entityLabel" value={entityLabel} />
          <input type="hidden" name="revalidate" value={revalidatePath} />
          <input type="file" name="file" required className="text-sm" />
          <input name="description" placeholder="Description (optional)" className="input" />
          <button type="submit" className="rounded-lg bg-brand-950 px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
            Upload
          </button>
        </form>
      ) : (
        <p className="text-xs text-[var(--text-muted)]">
          Document storage isn&apos;t connected yet — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (with an
          &quot;attachments&quot; bucket in your Supabase project) to enable uploads.
        </p>
      )}
    </div>
  );
}
