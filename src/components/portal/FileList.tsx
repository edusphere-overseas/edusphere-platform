import { ExternalLink, FileText, ImageIcon, Trash2 } from "lucide-react";
import { deleteDocument } from "@/app/portal/_actions/documents";
import type { DocRow } from "@/lib/portal/data";
import { itemStatus } from "@/lib/portal/journey";
import { SubmitButton } from "./FormBits";
import { Uploader } from "./Uploader";
import { DocBadge, formatDate } from "./ui";

const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Files already sent for one checklist item, with view, delete and replace. */
export function FileList({ files, me, canUpload, studentId, badges = true }: { files: DocRow[]; me: string; canUpload: boolean; studentId: string; badges?: boolean }) {
  if (!files.length) return null;
  return (
    <ul className="mt-3 grid gap-2">
      {files.map((f) => {
        const Icon = f.mime_type === "application/pdf" ? FileText : ImageIcon;
        return (
          <li key={f.id} className="rounded-xl bg-mist/70 px-3.5 py-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Icon className="h-4.5 w-4.5 shrink-0 text-slate" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-deep">{f.label ? `${f.label}: ` : ""}{f.file_name}</p>
                <p className="text-xs text-slate">
                  {formatDate(f.created_at, true)} · {kb(f.size_bytes)}
                </p>
              </div>
              {badges && <DocBadge status={itemStatus([f])} />}
            </div>
            {f.status === "reupload" && f.reviewer_reason && (
              <p className="mt-2 rounded-lg bg-[#fdecec] px-3 py-2 text-sm text-[#8a1c13]">
                <strong>Reason:</strong> {f.reviewer_reason}
              </p>
            )}
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <a href={`/portal/files/${f.id}`} target="_blank" rel="noopener" className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-teal ring-1 ring-teal/30 hover:bg-white">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                View
              </a>
              {f.status === "under_review" && f.uploaded_by === me && (
                <form action={deleteDocument}>
                  <input type="hidden" name="id" value={f.id} />
                  <SubmitButton className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[#b42318] ring-1 ring-[#b42318]/25 hover:bg-white" pending="Removing…">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Remove
                  </SubmitButton>
                </form>
              )}
              {canUpload && (f.status === "reupload" || f.status === "approved") && (
                <Uploader studentId={studentId} docType={f.doc_type} replaces={f.id} text={f.status === "reupload" ? "Upload new version" : "Replace"} primary={f.status === "reupload"} />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
