import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { cancelServiceRequest } from "@/app/portal/_actions/services";
import { FileList } from "@/components/portal/FileList";
import { SubmitButton } from "@/components/portal/FormBits";
import { PortalServiceIcon } from "@/components/portal/ServiceIcon";
import { Thread } from "@/components/portal/Thread";
import { Uploader } from "@/components/portal/Uploader";
import { btnDanger, Card, formatDate, Notice, Pill } from "@/components/portal/ui";
import { getPortal } from "@/lib/portal/context";
import { serviceByKey, statusLabel } from "@/lib/portal/services";
import { storageConfigured } from "@/lib/portal/storage";

export const metadata: Metadata = { title: "Service request" };

export default async function ServiceRequestPage({ params, searchParams }: PageProps<"/portal/services/[id]">) {
  const p = await getPortal();
  const { id } = await params;
  const isNew = (await searchParams).new === "1";
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: r } = await p.supabase.from("service_requests").select("*").eq("id", id).maybeSingle();
  if (!r) notFound();
  const def = serviceByKey(r.service)!;
  const [{ data: events }, { data: files }] = await Promise.all([
    p.supabase.from("service_request_events").select("status, created_at").eq("request_id", r.id).order("created_at"),
    p.supabase.from("documents").select("*").eq("service_request_id", r.id).not("status", "in", "(uploading,replaced)").order("created_at"),
  ]);
  const reached: Record<string, string> = {};
  for (const e of events ?? []) reached[e.status] ??= e.created_at;
  const at = def.steps.findIndex((s) => s.key === r.status);
  const details = r.details as Record<string, string>;
  const canUpload = p.canUpload && storageConfigured() && r.status !== "cancelled";

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/portal/services" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-deep">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Services
      </Link>
      <div className="mt-4 mb-6 flex flex-wrap items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal/10 text-teal">
          <PortalServiceIcon icon={def.icon} className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-deep sm:text-3xl">{def.title}</h1>
          <p className="mt-1 text-sm text-slate">Requested {formatDate(r.created_at, true)}</p>
        </div>
        <Pill tone={r.status === "cancelled" ? "slate" : "teal"}>{statusLabel(r.service, r.status)}</Pill>
      </div>

      {isNew && (
        <div className="mb-5">
          <Notice tone="ok" title="Request sent">
            We&apos;ve emailed a confirmation. Our team will be in touch; you&apos;ll get an email each time the status changes.
          </Notice>
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_1.3fr]">
        <div className="grid gap-5">
          <Card>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate">Progress</h2>
            {r.status === "cancelled" ? (
              <p className="mt-3 text-sm text-slate">This request was cancelled{r.closed_at ? ` on ${formatDate(r.closed_at)}` : ""}.</p>
            ) : (
              <ol className="mt-4 grid gap-3">
                {def.steps.map((s, i) => (
                  <li key={s.key} className="flex items-center gap-3">
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                        i < at || (i === at && i === def.steps.length - 1) ? "bg-teal text-white" : i === at ? "ring-2 ring-teal text-teal" : "ring-1 ring-slate/25 text-slate/60"
                      }`}
                    >
                      {i < at || (i === at && i === def.steps.length - 1) ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${i <= at ? "text-deep" : "text-slate/70"}`}>{s.label}</p>
                      {reached[s.key] && i <= at && <p className="text-xs text-slate">{formatDate(reached[s.key], true)}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {r.price && (
              <p className="mt-5 rounded-xl bg-mist px-3.5 py-2.5 text-sm text-deep">
                Price {r.price} ·{" "}
                {r.payment_status === "confirmed" ? <strong className="text-[#17663a]">payment confirmed</strong> : "our team will confirm payment with you"}
              </p>
            )}
            {r.status === "requested" && (
              <form action={cancelServiceRequest} className="mt-5">
                <input type="hidden" name="id" value={r.id} />
                <SubmitButton className={btnDanger} pending="Cancelling…">
                  Cancel request
                </SubmitButton>
              </form>
            )}
          </Card>

          <Card>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate">Details</h2>
            <dl className="mt-3 grid gap-3 text-sm">
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
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate">Documents for this request</h2>
            {files?.length ? (
              <FileList files={files} me={p.userId} canUpload={canUpload} studentId={r.student_id} />
            ) : (
              <p className="mt-2 text-sm text-slate">Tickets, visas or anything our team asks for.</p>
            )}
            {canUpload && (
              <div className="mt-4">
                <Uploader studentId={r.student_id} docType="service" serviceRequestId={r.id} askLabel text="Upload" primary={false} />
              </div>
            )}
          </Card>
        </div>

        <Card>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-slate">Messages about this request</h2>
          <Thread p={p} studentId={r.student_id} requestId={r.id} empty="Questions about this request? Write to our team here." />
        </Card>
      </div>
    </div>
  );
}
