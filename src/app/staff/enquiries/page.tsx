import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, Mail, MessageCircle, Phone, Search } from "lucide-react";
import { btnGhost, Card, Empty, formatDate, input, PageTitle, Pill } from "@/components/portal/ui";
import { ActionForm, Submit } from "@/components/staff/ActionForm";
import { updateLead } from "../_actions";
import { displayName, getStaff, LEAD_SOURCES, LEAD_STATUSES, loadPeople, loadTeam, officeLabel, OFFICES } from "@/lib/staff/context";

export const metadata: Metadata = { title: "Enquiries" };

const select = `${input} py-2.5`;
const clean = (q: string) => q.replace(/[^\p{L}\p{N}@.+\-\s]/gu, "").trim().slice(0, 60);
const digits = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return d.length === 10 ? `91${d}` : d.replace(/^0+/, "");
};
const tone = { new: "amber", contacted: "teal", converted: "green", closed: "slate" } as const;

export default async function EnquiriesPage({ searchParams }: PageProps<"/staff/enquiries">) {
  const s = await getStaff();
  if (!s.allowed) return null;
  const sp = await searchParams;
  const status = typeof sp.status === "string" && LEAD_STATUSES.some((x) => x.key === sp.status) ? sp.status : sp.status === "all" ? "all" : "open";
  const q = typeof sp.q === "string" ? clean(sp.q) : "";

  let query = s.supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(200);
  if (status === "open") query = query.in("status", ["new", "contacted"]);
  else if (status !== "all") query = query.eq("status", status);
  if (q) query = query.or(["name", "email", "phone", "interest"].map((c) => `${c}.ilike."%${q}%"`).join(","));

  const [{ data: leads }, team, counts] = await Promise.all([
    query,
    s.isAdmin ? loadTeam(s) : Promise.resolve([]),
    s.supabase.from("leads").select("status").limit(5000),
  ]);
  const people = await loadPeople(s, [...(leads ?? []).flatMap((l) => [l.assigned_to, l.profile_id])]);
  const countOf = (k: string) => (counts.data ?? []).filter((l) => (k === "open" ? l.status === "new" || l.status === "contacted" : k === "all" || l.status === k)).length;
  const counsellors = team.filter((t) => t.role === "admin" || t.role === "counsellor");

  const tabs = [{ key: "open", label: "Open" }, ...LEAD_STATUSES.map((x) => ({ key: x.key as string, label: x.label })), { key: "all", label: "All" }];

  return (
    <>
      <PageTitle
        title="Enquiries"
        intro={
          s.isAdmin
            ? "Website enquiries and new portal sign-ups. Give each one to a counsellor, and mark it once you've been in touch."
            : "Enquiries an admin has given to you. Mark each one once you've been in touch."
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter enquiries" className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/staff/enquiries?status=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              aria-current={status === t.key ? "page" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${status === t.key ? "bg-deep text-white" : "bg-white text-slate ring-1 ring-deep/8 hover:text-deep"}`}
            >
              {t.label} <span className="opacity-70">{countOf(t.key)}</span>
            </Link>
          ))}
        </nav>
        <form className="flex w-full gap-2 sm:w-auto" role="search">
          <input type="hidden" name="status" value={status} />
          <label htmlFor="lead-search" className="sr-only">
            Search enquiries
          </label>
          <input id="lead-search" name="q" defaultValue={q} placeholder="Name, email, phone or interest" className={`${input} py-2.5 sm:w-72`} />
          <button type="submit" className={btnGhost} aria-label="Search">
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </div>

      {leads?.length ? (
        <ul className="grid grid-cols-1 gap-4">
          {leads.map((l) => {
            const account = l.profile_id ? people.get(l.profile_id) : null;
            return (
              <Card as="li" key={l.id} className="scroll-mt-24">
                <div id={l.id} className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-deep">{l.name || l.email || "No name given"}</h2>
                      <Pill tone={tone[l.status as keyof typeof tone] ?? "slate"}>{LEAD_STATUSES.find((x) => x.key === l.status)?.label ?? l.status}</Pill>
                    </div>
                    <p className="mt-0.5 text-sm text-slate">
                      {LEAD_SOURCES[l.source] ?? l.source} · {formatDate(l.created_at, true)}
                      {OFFICES.length > 1 ? ` · ${officeLabel(l.office)}` : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {l.phone && (
                        <>
                          <a href={`tel:${l.phone.replace(/[^\d+]/g, "")}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-deep ring-1 ring-deep/12 hover:bg-mist">
                            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                            {l.phone}
                          </a>
                          <a
                            href={`https://wa.me/${digits(l.phone)}`}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[#17663a] ring-1 ring-[#17663a]/25 hover:bg-[#e7f6ee]"
                          >
                            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            WhatsApp
                          </a>
                        </>
                      )}
                      {l.email && (
                        <a href={`mailto:${l.email}`} className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-deep ring-1 ring-deep/12 hover:bg-mist">
                          <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">{l.email}</span>
                        </a>
                      )}
                    </div>
                    {l.interest && <p className="mt-3 text-sm font-semibold text-deep">{l.interest}</p>}
                    {l.message && <p className="mt-1.5 line-clamp-6 text-sm whitespace-pre-wrap text-slate">{l.message}</p>}
                    {account && (
                      <p className="mt-3 text-sm">
                        {account.role === "student" ? (
                          <Link href={`/staff/students/${account.id}`} className="font-semibold text-teal hover:text-navy">
                            Open {displayName(account)}&apos;s student record
                          </Link>
                        ) : (
                          <span className="text-slate">Portal account: {account.role ? account.role : "hasn't finished signing up"}</span>
                        )}
                      </p>
                    )}
                  </div>

                  <ActionForm action={updateLead} className="grid grid-cols-1 content-start gap-3 rounded-xl bg-mist/70 p-4">
                    <input type="hidden" name="id" value={l.id} />
                    <label className="grid grid-cols-1 gap-1 text-sm font-semibold text-deep">
                      Status
                      <select name="status" defaultValue={l.status} className={select}>
                        {LEAD_STATUSES.map((x) => (
                          <option key={x.key} value={x.key}>
                            {x.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {s.isAdmin ? (
                      <>
                        <label className="grid grid-cols-1 gap-1 text-sm font-semibold text-deep">
                          Counsellor
                          <select name="assigned_to" defaultValue={l.assigned_to ?? ""} className={select}>
                            <option value="">Not assigned</option>
                            {counsellors.map((c) => (
                              <option key={c.id} value={c.id}>
                                {displayName(c)}
                              </option>
                            ))}
                          </select>
                        </label>
                        {OFFICES.length > 1 && (
                          <label className="grid grid-cols-1 gap-1 text-sm font-semibold text-deep">
                            Office
                            <select name="office" defaultValue={l.office} className={select}>
                              {OFFICES.map((o) => (
                                <option key={o.key} value={o.key}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-slate">Assigned to you</p>
                    )}
                    <div>
                      <Submit pending="Saving…">Save</Submit>
                    </div>
                  </ActionForm>
                </div>
              </Card>
            );
          })}
        </ul>
      ) : (
        <Empty icon={<Inbox className="h-6 w-6" aria-hidden="true" />} title={q ? "No enquiries match your search" : "No enquiries here"}>
          {s.isAdmin ? "Website enquiries and portal sign-ups appear here as they arrive." : "An admin will give you enquiries to follow up."}
        </Empty>
      )}
    </>
  );
}
