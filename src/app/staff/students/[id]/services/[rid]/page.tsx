import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { PortalServiceIcon } from "@/components/portal/ServiceIcon";
import { Thread } from "@/components/portal/Thread";
import { Uploader } from "@/components/portal/Uploader";
import { Card, formatDate, input, Pill } from "@/components/portal/ui";
import { ActionForm, Submit } from "@/components/staff/ActionForm";
import { StaffFiles } from "@/components/staff/StaffFiles";
import { updateServiceRequest } from "../../../../_actions";
import { serviceByKey, statusLabel } from "@/lib/portal/services";
import { storageConfigured } from "@/lib/portal/storage";
import { displayName, loadPeople, loadTeam, PAYMENT_STATUSES } from "@/lib/staff/context";
import { getStudent } from "@/lib/staff/student";

export const metadata: Metadata = { title: "Service request" };

const box = `${input} py-2.5`;

export default async function StaffServiceRequest({ params }: PageProps<"/staff/students/[id]/services/[rid]">) {
  const { id, rid } = await params;
  const { s } = await getStudent(id);
  if (!/^[0-9a-f-]{36}$/i.test(rid)) notFound();
  const { data: r } = await s.supabase.from("service_requests").select("*").eq("id", rid).eq("student_id", id).maybeSingle();
  if (!r) notFound();
  const def = serviceByKey(r.service);
  if (!def) notFound();

  const [{ data: events }, { data: files }, team] = await Promise.all([
    s.supabase.from("service_request_events").select("status, created_at, changed_by").eq("request_id", r.id).order("created_at"),
    s.supabase.from("documents").select("*").eq("service_request_id", r.id).not("status", "in", "(uploading,replaced)").order("created_at"),
    loadTeam(s),
  ]);
  const people = await loadPeople(s, [r.requested_by, ...(events ?? []).map((e) => e.changed_by), ...(files ?? []).flatMap((f) => [f.uploaded_by, f.reviewed_by])]);
  const reached: Record<string, { at: string; by: string | null }> = {};
  for (const e of events ?? []) reached[e.status] ??= { at: e.created_at, by: e.changed_by };
  const at = def.steps.findIndex((st) => st.key === r.status);
  const details = r.details as Record<string, string>;
  const staff = team.filter((t) => t.role === "admin" || t.role === "counsellor");

  return (
    <div>
      <Link href={`/staff/students/${id}/services`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-deep">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All requests
      </Link>
      <div className="mt-4 mb-6 flex flex-wrap items-start gap-4">
        <span className="grid grid-cols-1 h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal/10 text-teal">
          <PortalServiceIcon icon={def.icon} className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold tracking-[-0.02em] text-deep sm:text-2xl">{def.title}</h2>
          <p className="mt-1 text-sm text-slate">
            Requested {formatDate(r.created_at, true)}
            {r.requested_by ? ` by ${r.requested_by === id ? "the student" : displayName(people.get(r.requested_by)) || "a parent"}` : ""}
          </p>
        </div>
        <Pill tone={r.status === "cancelled" ? "slate" : r.status === "requested" ? "amber" : "teal"}>{statusLabel(r.service, r.status)}</Pill>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="grid grid-cols-1 gap-5">
          <Card>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate">Update</h3>
            <ActionForm action={updateServiceRequest} className="mt-3 grid grid-cols-1 gap-3">
              <input type="hidden" name="id" value={r.id} />
              <label className="grid grid-cols-1 gap-1 text-sm font-semibold text-deep">
                Status
                <select name="status" defaultValue={r.status} className={box}>
                  {def.steps.map((st) => (
                    <option key={st.key} value={st.key}>
                      {st.label}
                    </option>
                  ))}
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              <label className="grid grid-cols-1 gap-1 text-sm font-semibold text-deep">
                Looked after by
                <select name="assigned_to" defaultValue={r.assigned_to ?? ""} className={box}>
                  <option value="">Nobody yet</option>
                  {staff.map((t) => (
                    <option key={t.id} value={t.id}>
                      {displayName(t)}
                    </option>
                  ))}
                </select>
              </label>
              {r.price ? (
                <label className="grid grid-cols-1 gap-1 text-sm font-semibold text-deep">
                  Payment ({r.price})
                  <select name="payment" defaultValue={r.payment_status} className={box}>
                    {PAYMENT_STATUSES.filter((p) => p.key !== "not_required").map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <input type="hidden" name="payment" value="not_required" />
              )}
              <label className="flex items-center gap-2.5 text-sm text-deep">
                <input type="checkbox" name="notify" defaultChecked className="h-4.5 w-4.5 rounded accent-teal" />
                Email the family if the status changes
              </label>
              <div>
                <Submit pending="Saving…">Save</Submit>
              </div>
            </ActionForm>
          </Card>

          <Card>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate">Progress</h3>
            {r.status === "cancelled" ? (
              <p className="mt-3 text-sm text-slate">Cancelled{r.closed_at ? ` on ${formatDate(r.closed_at)}` : ""}.</p>
            ) : (
              <ol className="mt-4 grid grid-cols-1 gap-3">
                {def.steps.map((st, i) => (
                  <li key={st.key} className="flex items-center gap-3">
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                        i < at || (i === at && i === def.steps.length - 1) ? "bg-teal text-white" : i === at ? "text-teal ring-2 ring-teal" : "text-slate/60 ring-1 ring-slate/25"
                      }`}
                    >
                      {i < at || (i === at && i === def.steps.length - 1) ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${i <= at ? "text-deep" : "text-slate/70"}`}>{st.label}</p>
                      {reached[st.key] && i <= at && (
                        <p className="text-xs text-slate">
                          {formatDate(reached[st.key].at, true)}
                          {reached[st.key].by && people.get(reached[st.key].by!) ? ` · ${displayName(people.get(reached[st.key].by!))}` : ""}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate">What they asked for</h3>
            <dl className="mt-3 grid grid-cols-1 gap-3 text-sm">
              {def.fields
                .filter((f) => details[f.name])
                .map((f) => (
                  <div key={f.name}>
                    <dt className="text-slate">{f.label}</dt>
                    <dd className="font-semibold whitespace-pre-wrap text-deep">{f.type === "date" ? formatDate(details[f.name]) : details[f.name]}</dd>
                  </div>
                ))}
            </dl>
          </Card>

          <Card>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate">Documents for this request</h3>
            {files?.length ? <StaffFiles files={files} people={people} studentId={id} /> : <p className="mt-2 text-sm text-slate">None yet.</p>}
            {storageConfigured() && r.status !== "cancelled" && (
              <div className="mt-4">
                <Uploader studentId={id} docType="service" serviceRequestId={r.id} askLabel text="Upload a document (ticket, booking…)" primary={false} />
              </div>
            )}
          </Card>
        </div>

        <Card>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-slate">Messages about this request</h3>
          <Thread p={s} studentId={id} requestId={r.id} empty="No messages yet. Write to the family about this request; they get an email." placeholder="Write to the student and parents…" />
        </Card>
      </div>
    </div>
  );
}
