import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PortalServiceIcon } from "@/components/portal/ServiceIcon";
import { Card, formatDate, Pill } from "@/components/portal/ui";
import { loadRequests } from "@/lib/portal/data";
import { FINAL_STATUSES, serviceByKey, statusLabel } from "@/lib/portal/services";
import { displayName, loadPeople } from "@/lib/staff/context";
import { getStudent } from "@/lib/staff/student";

export const metadata: Metadata = { title: "Services" };

export default async function StaffServices({ params }: PageProps<"/staff/students/[id]/services">) {
  const { id } = await params;
  const { s } = await getStudent(id);
  const requests = await loadRequests(s, id);
  const people = await loadPeople(s, requests.map((r) => r.assigned_to));

  if (!requests.length) {
    return (
      <Card>
        <p className="text-sm text-slate">No service requests yet. Families request airport pickup, accommodation and other services from the Services page in the portal.</p>
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden p-0 sm:p-0">
      <ul className="divide-y divide-deep/6">
        {requests.map((r) => {
          const def = serviceByKey(r.service);
          const open = !FINAL_STATUSES.includes(r.status);
          return (
            <li key={r.id}>
              <Link href={`/staff/students/${id}/services/${r.id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-mist/60 sm:px-6">
                <span className="grid grid-cols-1 h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal/10 text-teal">{def && <PortalServiceIcon icon={def.icon} />}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-deep">{def?.title ?? r.service}</span>
                  <span className="block truncate text-sm text-slate">
                    {def?.describe(r.details as Record<string, string>) || "No details"} · requested {formatDate(r.created_at)}
                    {r.assigned_to ? ` · ${displayName(people.get(r.assigned_to))}` : ""}
                  </span>
                </span>
                <span className="flex flex-wrap justify-end gap-1.5">
                  {r.price && r.payment_status === "awaiting" && open && <Pill tone="amber">Payment due</Pill>}
                  <Pill tone={r.status === "requested" ? "amber" : open ? "teal" : "slate"}>{r.status === "requested" ? "New" : statusLabel(r.service, r.status)}</Pill>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
