import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LifeBuoy } from "lucide-react";
import { NoStudent } from "@/components/portal/NoStudent";
import { PortalServiceIcon } from "@/components/portal/ServiceIcon";
import { Card, Empty, formatDate, PageTitle, Pill } from "@/components/portal/ui";
import { getSiteContent } from "@/lib/content";
import { getPortal } from "@/lib/portal/context";
import { loadRequests } from "@/lib/portal/data";
import { FINAL_STATUSES, serviceByKey, services, statusLabel } from "@/lib/portal/services";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesPage() {
  const p = await getPortal();
  if (!p.student) return <NoStudent />;
  const [requests, { portalServices }] = await Promise.all([loadRequests(p, p.student.id), getSiteContent()]);
  const available = services.filter((s) => portalServices[s.settingsKey].show);

  return (
    <>
      <PageTitle title="Services" intro="Request support beyond admissions and follow each request step by step, with its own message thread." />

      <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate">Your requests</h2>
      {requests.length ? (
        <ul className="grid gap-3">
          {requests.map((r) => {
            const def = serviceByKey(r.service)!;
            const closed = FINAL_STATUSES.includes(r.status);
            return (
              <li key={r.id}>
                <Link href={`/portal/services/${r.id}`} className="group block">
                  <Card as="div" className="flex items-center gap-4 transition group-hover:ring-teal/40">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${closed ? "bg-mist text-slate" : "bg-teal/10 text-teal"}`}>
                      <PortalServiceIcon icon={def.icon} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-deep">{def.title}</p>
                      <p className="truncate text-sm text-slate">
                        {def.describe(r.details as Record<string, string>) || `Requested ${formatDate(r.created_at)}`}
                      </p>
                    </div>
                    <Pill tone={r.status === "cancelled" ? "slate" : closed ? "green" : "teal"}>{statusLabel(r.service, r.status)}</Pill>
                    <ArrowRight className="hidden h-4.5 w-4.5 text-slate sm:block" aria-hidden="true" />
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty icon={<LifeBuoy className="h-6 w-6" />} title="No requests yet">
          Choose a service below. You&apos;ll see each step here and get an email when it changes.
        </Empty>
      )}

      <h2 className="mt-10 mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate">Request a service</h2>
      {available.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {available.map((s) => {
            const setting = portalServices[s.settingsKey];
            return (
              <Card key={s.key} className="flex flex-col">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal/10 text-teal">
                  <PortalServiceIcon icon={s.icon} />
                </span>
                <h3 className="mt-4 font-bold text-deep">{s.title}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-slate">{s.summary}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  {setting.price ? <Pill tone="amber">{setting.price}</Pill> : <span />}
                  <Link href={`/portal/services/new/${s.key}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:text-navy">
                    Request
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate">No services can be requested online right now. Please message us.</p>
      )}
    </>
  );
}
