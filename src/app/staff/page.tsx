import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, FileText, Inbox, LifeBuoy, MessageCircle, UserRoundX, Users } from "lucide-react";
import { Card, formatDate, Pill } from "@/components/portal/ui";
import { checklistLabel, DESTINATIONS } from "@/lib/portal/journey";
import { FINAL_STATUSES, serviceByKey, statusLabel } from "@/lib/portal/services";
import { ACTION_LABEL, displayName, getStaff, LEAD_SOURCES, loadPeople } from "@/lib/staff/context";

export const metadata: Metadata = { title: "Overview" };

const ALL_COUNTRIES = DESTINATIONS.map((d) => d.id);
const day = 24 * 60 * 60 * 1000;
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export default async function StaffHome() {
  const s = await getStaff();
  if (!s.allowed) return null;
  const db = s.supabase;
  const today = new Date();

  const [docs, requests, leads, deadlines, recentMessages, students, unassigned, activity] = await Promise.all([
    db.from("documents").select("id, student_id, doc_type, label, file_name, created_at", { count: "exact" }).eq("status", "under_review").order("created_at").limit(8),
    db
      .from("service_requests")
      .select("id, student_id, service, status, created_at, assigned_to", { count: "exact" })
      .not("status", "in", `(${FINAL_STATUSES.join(",")})`)
      .order("created_at")
      .limit(8),
    db.from("leads").select("id, name, email, phone, interest, source, created_at", { count: "exact" }).eq("status", "new").order("created_at", { ascending: false }).limit(6),
    db
      .from("applications")
      .select("id, student_id, university, deadline, stage, country")
      .eq("status", "active")
      .gte("deadline", isoDate(today))
      .lte("deadline", isoDate(new Date(+today + 30 * day)))
      .order("deadline")
      .limit(8),
    db.from("messages").select("id, student_id, service_request_id, body, sender_name, sender_role, created_at").order("created_at", { ascending: false }).limit(120),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    s.isAdmin
      ? db.from("profiles").select("id, details:student_profiles!student_profiles_user_id_fkey!inner(counsellor_id)", { count: "exact", head: true }).eq("role", "student").is("details.counsellor_id", null)
      : Promise.resolve({ count: 0 }),
    db.from("activity_log").select("id, actor_id, student_id, action, details, created_at").not("action", "in", "(document_viewed,document_downloaded)").order("created_at", { ascending: false }).limit(10),
  ]);

  // Conversations where the family wrote last: waiting for a reply
  const seen = new Set<string>();
  const waiting = [];
  for (const m of recentMessages.data ?? []) {
    const key = `${m.student_id}:${m.service_request_id ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (m.sender_role === "student" || m.sender_role === "parent") waiting.push(m);
  }

  const people = await loadPeople(s, [
    ...(docs.data ?? []).map((d) => d.student_id),
    ...(requests.data ?? []).flatMap((r) => [r.student_id, r.assigned_to]),
    ...(deadlines.data ?? []).map((a) => a.student_id),
    ...waiting.map((m) => m.student_id),
    ...(activity.data ?? []).flatMap((a) => [a.actor_id, a.student_id]),
  ]);
  const who = (id: string | null) => displayName(people.get(id ?? "")) || "A student";

  const stats = [
    { href: "#documents", label: "Documents to review", value: docs.count ?? 0, Icon: FileText, warn: (docs.count ?? 0) > 0 },
    { href: "#services", label: "Open service requests", value: requests.count ?? 0, Icon: LifeBuoy, warn: (requests.data ?? []).some((r) => r.status === "requested") },
    { href: "/staff/enquiries", label: "New enquiries", value: leads.count ?? 0, Icon: Inbox, warn: (leads.count ?? 0) > 0 },
    s.isAdmin && (unassigned.count ?? 0) > 0
      ? { href: "/staff/students?counsellor=none", label: "Students without a counsellor", value: unassigned.count ?? 0, Icon: UserRoundX, warn: true }
      : { href: "/staff/students", label: s.isAdmin ? "Students" : "My students", value: students.count ?? 0, Icon: Users, warn: false },
  ];

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-deep sm:text-3xl">Hello {s.firstName}</h1>
        <p className="mt-2 text-slate">
          {s.isAdmin ? "Everything waiting across Edusphere." : "Everything waiting for your students."} Newest enquiries and the oldest waiting items come first.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map(({ href, label, value, Icon, warn }) => (
          <Link key={label} href={href} className="group rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(13,34,54,0.06)] ring-1 ring-deep/6 transition hover:ring-teal/40 sm:p-5">
            <Icon className={`h-5 w-5 ${warn ? "text-[#c77700]" : "text-teal"}`} aria-hidden="true" />
            <p className="mt-3 text-3xl font-extrabold text-deep">{value}</p>
            <p className="mt-0.5 text-sm font-semibold text-slate group-hover:text-deep">{label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle id="documents" title="Documents waiting for review" />
          {docs.data?.length ? (
            <ul className="divide-y divide-deep/6">
              {docs.data.map((d) => (
                <li key={d.id}>
                  <Link href={`/staff/students/${d.student_id}/documents#${d.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-teal">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-deep">{checklistLabel(d.doc_type, ALL_COUNTRIES, d.label)}</span>
                      <span className="block truncate text-sm text-slate">
                        {who(d.student_id)} · {formatDate(d.created_at, true)}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Nothing>No documents waiting. Well done.</Nothing>
          )}
          {(docs.count ?? 0) > (docs.data?.length ?? 0) && <p className="mt-3 text-sm text-slate">and {(docs.count ?? 0) - (docs.data?.length ?? 0)} more, oldest first.</p>}
        </Card>

        <Card>
          <SectionTitle title="Messages waiting for a reply" Icon={MessageCircle} />
          {waiting.length ? (
            <ul className="divide-y divide-deep/6">
              {waiting.slice(0, 6).map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/staff/students/${m.student_id}/${m.service_request_id ? `services/${m.service_request_id}` : "messages"}`}
                    className="block py-3 hover:text-teal"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate font-semibold text-deep">{who(m.student_id)}</span>
                      <span className="shrink-0 text-xs text-slate">{formatDate(m.created_at, true)}</span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-sm text-slate">
                      {m.sender_name}: {m.body}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Nothing>No one is waiting for a reply.</Nothing>
          )}
        </Card>

        <Card>
          <SectionTitle id="services" title="Open service requests" />
          {requests.data?.length ? (
            <ul className="divide-y divide-deep/6">
              {requests.data.map((r) => (
                <li key={r.id}>
                  <Link href={`/staff/students/${r.student_id}/services/${r.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-teal">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-deep">{serviceByKey(r.service)?.title ?? r.service}</span>
                      <span className="block truncate text-sm text-slate">
                        {who(r.student_id)} · {r.assigned_to ? `with ${displayName(people.get(r.assigned_to))}` : "not assigned"}
                      </span>
                    </span>
                    <Pill tone={r.status === "requested" ? "amber" : "teal"}>{r.status === "requested" ? "New" : statusLabel(r.service, r.status)}</Pill>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Nothing>No open requests.</Nothing>
          )}
        </Card>

        <Card>
          <SectionTitle title="New enquiries" href="/staff/enquiries" />
          {leads.data?.length ? (
            <ul className="divide-y divide-deep/6">
              {leads.data.map((l) => (
                <li key={l.id}>
                  <Link href={`/staff/enquiries#${l.id}`} className="block py-3 hover:text-teal">
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate font-semibold text-deep">{l.name || l.email || l.phone}</span>
                      <span className="shrink-0 text-xs text-slate">{formatDate(l.created_at, true)}</span>
                    </span>
                    <span className="block truncate text-sm text-slate">
                      {LEAD_SOURCES[l.source] ?? l.source}
                      {l.interest ? ` · ${l.interest}` : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Nothing>{s.isAdmin ? "No new enquiries." : "No new enquiries assigned to you."}</Nothing>
          )}
        </Card>

        <Card>
          <SectionTitle title="Deadlines in the next 30 days" Icon={CalendarClock} />
          {deadlines.data?.length ? (
            <ul className="divide-y divide-deep/6">
              {deadlines.data.map((a) => {
                const days = Math.round((+new Date(a.deadline + "T00:00:00Z") - +new Date(isoDate(today) + "T00:00:00Z")) / day);
                return (
                  <li key={a.id}>
                    <Link href={`/staff/students/${a.student_id}/applications#${a.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-teal">
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-deep">{a.university}</span>
                        <span className="block truncate text-sm text-slate">
                          {who(a.student_id)} · {formatDate(a.deadline)}
                        </span>
                      </span>
                      <Pill tone={days <= 7 ? "red" : "amber"}>{days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days`}</Pill>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Nothing>No deadlines coming up. Add deadlines on each application.</Nothing>
          )}
        </Card>

        <Card>
          <SectionTitle title="Recent activity" />
          {activity.data?.length ? (
            <ul className="grid grid-cols-1 gap-3">
              {activity.data.map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="text-deep">
                    <strong>{displayName(people.get(a.actor_id ?? "")) || "System"}</strong>: {ACTION_LABEL[a.action] ?? a.action.replace(/_/g, " ")}
                    {a.student_id && a.student_id !== a.actor_id && (
                      <>
                        {" for "}
                        <Link href={`/staff/students/${a.student_id}`} className="font-semibold text-teal hover:text-navy">
                          {who(a.student_id)}
                        </Link>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-slate">{formatDate(a.created_at, true)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <Nothing>Nothing yet.</Nothing>
          )}
        </Card>
      </div>
    </>
  );
}

function SectionTitle({ title, id, href, Icon }: { title: string; id?: string; href?: string; Icon?: typeof FileText }) {
  return (
    <div id={id} className="mb-2 flex scroll-mt-24 items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate">
        {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
        {title}
      </h2>
      {href && (
        <Link href={href} className="text-sm font-semibold text-teal hover:text-navy">
          See all
        </Link>
      )}
    </div>
  );
}

function Nothing({ children }: { children: React.ReactNode }) {
  return <p className="py-3 text-sm text-slate">{children}</p>;
}
