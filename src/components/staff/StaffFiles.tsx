import { CheckCircle2, ExternalLink, FileText, ImageIcon, RotateCcw } from "lucide-react";
import { reviewDocument } from "@/app/staff/_actions";
import { DocBadge, formatDate, input } from "@/components/portal/ui";
import type { DocRow } from "@/lib/portal/data";
import { itemStatus } from "@/lib/portal/journey";
import type { Person } from "@/lib/staff/context";
import { displayName } from "@/lib/staff/context";
import { ActionForm, Submit } from "./ActionForm";

const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const small = "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition disabled:opacity-60";

/** Files for one checklist item (or one service request), with Approve and Ask-for-re-upload. */
export function StaffFiles({ files, people, studentId }: { files: DocRow[]; people: Map<string, Person>; studentId: string }) {
  if (!files.length) return null;
  return (
    <ul className="mt-3 grid grid-cols-1 gap-2.5">
      {files.map((f) => {
        const Icon = f.mime_type === "application/pdf" ? FileText : ImageIcon;
        const by = f.uploaded_by === studentId ? "the student" : displayName(people.get(f.uploaded_by ?? "")) || "a family member";
        return (
          <li key={f.id} id={f.id} className={`scroll-mt-28 rounded-xl px-3.5 py-3 ${f.status === "under_review" ? "bg-[#fff8eb] ring-1 ring-[#f5b041]/40" : "bg-mist/70"}`}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Icon className="h-4.5 w-4.5 shrink-0 text-slate" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-deep">
                  {f.label ? `${f.label}: ` : ""}
                  {f.file_name}
                </p>
                <p className="text-xs text-slate">
                  {formatDate(f.created_at, true)} · {kb(f.size_bytes)} · uploaded by {by}
                  {f.reviewed_at && f.reviewed_by && ` · reviewed by ${displayName(people.get(f.reviewed_by)) || "staff"} ${formatDate(f.reviewed_at)}`}
                </p>
              </div>
              <DocBadge status={itemStatus([f])} />
            </div>
            {f.status === "reupload" && f.reviewer_reason && (
              <p className="mt-2 rounded-lg bg-[#fdecec] px-3 py-2 text-sm text-[#8a1c13]">
                <strong>Asked for a new upload:</strong> {f.reviewer_reason}
              </p>
            )}
            <div className="mt-2.5 flex flex-wrap items-start gap-2">
              <a href={`/portal/files/${f.id}`} target="_blank" rel="noopener" className={`${small} bg-white text-teal ring-1 ring-teal/30 hover:bg-teal/5`}>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Open
              </a>
              {f.status !== "approved" && (
                <ActionForm action={reviewDocument} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="decision" value="approved" />
                  <Submit className={`${small} bg-[#17663a] text-white hover:bg-[#0f4d2b]`} pending="Approving…">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Approve
                  </Submit>
                </ActionForm>
              )}
              {f.status !== "reupload" && (
                <details className="group basis-full sm:basis-auto">
                  <summary className={`${small} cursor-pointer list-none bg-white text-[#b42318] ring-1 ring-[#b42318]/25 hover:bg-[#fef3f2] [&::-webkit-details-marker]:hidden`}>
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Ask for a new upload
                  </summary>
                  <ActionForm action={reviewDocument} className="mt-2 grid grid-cols-1 gap-2 sm:w-96">
                    <input type="hidden" name="id" value={f.id} />
                    <input type="hidden" name="decision" value="reupload" />
                    <label className="grid grid-cols-1 gap-1 text-sm font-semibold text-deep">
                      What should they fix?
                      <input name="reason" required maxLength={500} placeholder="For example: the photo is blurred, please scan it" className={`${input} py-2.5`} />
                    </label>
                    <p className="text-xs text-slate">The family sees this reason and gets an email.</p>
                    <div>
                      <Submit className={`${small} bg-[#b42318] text-white hover:bg-[#8a1c13]`} pending="Sending…">
                        Send request
                      </Submit>
                    </div>
                  </ActionForm>
                </details>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
