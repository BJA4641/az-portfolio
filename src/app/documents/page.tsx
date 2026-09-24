import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/delete-button";
import { EntityPicker } from "@/components/documents/entity-picker";
import { formatDate } from "@/lib/format";
import { getSignedDownloadUrl, isStorageConfigured } from "@/lib/storage";
import { deleteDocument, uploadDocument } from "./actions";

export const dynamic = "force-dynamic";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function DocumentsPage() {
  const configured = isStorageConfigured();

  const [attachments, properties, leases, visits, invoices, vendors] = await Promise.all([
    db.attachment.findMany({ include: { uploadedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
    db.property.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.lease.findMany({ select: { id: true, tenantName: true }, orderBy: { tenantName: "asc" } }),
    db.maintenanceVisit.findMany({ select: { id: true, referenceNo: true, description: true }, orderBy: { createdAt: "desc" } }),
    db.invoice.findMany({ select: { id: true, referenceNo: true }, orderBy: { createdAt: "desc" } }),
    db.vendor.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
  ]);

  const entities: Record<string, { id: string; label: string }[]> = {
    Property: properties.map((p) => ({ id: p.id, label: p.name })),
    Lease: leases.map((l) => ({ id: l.id, label: l.tenantName })),
    MaintenanceVisit: visits.map((v) => ({ id: v.id, label: `${v.referenceNo ?? "—"} · ${v.description}` })),
    Invoice: invoices.map((i) => ({ id: i.id, label: i.referenceNo })),
    Vendor: vendors.map((v) => ({ id: v.id, label: v.name }))
  };

  const downloadUrls = configured
    ? await Promise.all(attachments.map((a) => getSignedDownloadUrl(a.storageKey).catch(() => null)))
    : attachments.map(() => null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Documents"
        subtitle="Central repository for every file attached to a property, lease, expense & order, invoice, or vendor"
      />

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Attach a document</h2>
        {configured ? (
          <form action={uploadDocument} encType="multipart/form-data" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <EntityPicker entities={entities} />
            <input type="hidden" name="revalidate" value="/documents" />
            <input type="file" name="file" required className="text-sm" />
            <input name="description" placeholder="Description (optional)" className="input" />
            <button type="submit" className="rounded-lg bg-brand-950 px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
              Upload
            </button>
          </form>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            Document storage isn&apos;t connected yet — set <code>SUPABASE_URL</code> and{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> (with an &quot;attachments&quot; bucket created in your Supabase
            project) to enable uploads.
          </p>
        )}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Linked to</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Uploaded</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {attachments.map((a, i) => (
              <tr key={a.id} className="table-row-hover border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 font-medium">
                  {downloadUrls[i] ? (
                    <a href={downloadUrls[i]!} className="text-brand-700 hover:underline" target="_blank" rel="noreferrer">
                      {a.fileName}
                    </a>
                  ) : (
                    a.fileName
                  )}
                  {a.description && <p className="text-xs text-[var(--text-muted)]">{a.description}</p>}
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  {a.entityType} · {a.entityLabel}
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{formatFileSize(a.fileSize)}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  {a.uploadedBy?.name ?? "—"} · {formatDate(a.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <DeleteButton
                    action={deleteDocument}
                    id={a.id}
                    extraFields={{ storageKey: a.storageKey, revalidate: "/documents" }}
                    confirmText="Delete this document?"
                  />
                </td>
              </tr>
            ))}
            {attachments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  No documents uploaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
