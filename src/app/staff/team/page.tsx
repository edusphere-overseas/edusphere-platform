import type { Metadata } from "next";
import { ShieldCheck, UserPlus } from "lucide-react";
import { Card, input, Notice, PageTitle, Pill } from "@/components/portal/ui";
import { ActionForm, Submit } from "@/components/staff/ActionForm";
import { setRole } from "../_actions";
import { FINAL_STATUSES } from "@/lib/portal/services";
import { displayName, getStaff, loadTeam, ROLE_LABEL } from "@/lib/staff/context";

export const metadata: Metadata = { title: "Team" };

const box = `${input} py-2.5`;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const ROLE_HELP = [
  { role: "Counsellor", text: "Sees the students and enquiries assigned to them. Reviews documents, updates applications and services, and messages families." },
  { role: "Admin", text: "Everything a counsellor can do, for every student, plus assigning students and enquiries and managing this team." },
  { role: "Content editor", text: "No student records. Edits the website in Content (with their Sanity login)." },
];

export default async function TeamPage() {
  const s = await getStaff("/staff/team");
  if (!s.allowed) return null;
  if (!s.isAdmin) {
    return (
      <div className="mx-auto max-w-xl">
        <Notice tone="info" title="Only admins manage the team">
          Ask an admin if someone needs access or should take over your students.
        </Notice>
      </div>
    );
  }

  const [team, students, requests, leads] = await Promise.all([
    loadTeam(s),
    s.supabase.from("student_profiles").select("counsellor_id").not("counsellor_id", "is", null).limit(5000),
    s.supabase.from("service_requests").select("assigned_to").not("assigned_to", "is", null).not("status", "in", `(${FINAL_STATUSES.join(",")})`).limit(5000),
    s.supabase.from("leads").select("assigned_to").not("assigned_to", "is", null).in("status", ["new", "contacted"]).limit(5000),
  ]);
  const count = (rows: { [k: string]: string | null }[] | null, key: string, id: string) => (rows ?? []).filter((r) => r[key] === id).length;

  return (
    <>
      <PageTitle title="Team" intro="Who can open student records. Everyone signs in at the same portal sign-in page; staff land on this dashboard." />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden p-0 sm:p-0">
          <ul className="divide-y divide-deep/6">
            {team.map((t) => {
              const me = t.id === s.userId;
              return (
                <li key={t.id} className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-bold text-deep">
                      <span className="truncate">{displayName(t)}</span>
                      <Pill tone={t.role === "admin" ? "teal" : "slate"}>{ROLE_LABEL[t.role ?? ""]}</Pill>
                      {me && <span className="text-xs font-semibold text-slate">(you)</span>}
                    </p>
                    <p className="truncate text-sm text-slate">{t.email}</p>
                    {t.role !== "editor" && (
                      <p className="mt-0.5 text-xs text-slate">
                        {plural(count(students.data, "counsellor_id", t.id), "student")} · {plural(count(requests.data, "assigned_to", t.id), "open request")} ·{" "}
                        {plural(count(leads.data, "assigned_to", t.id), "open enquiry", "open enquiries")}
                      </p>
                    )}
                  </div>
                  {!me && (
                    <ActionForm action={setRole} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="email" value={t.email} />
                      <label htmlFor={`role-${t.id}`} className="sr-only">
                        Role for {displayName(t)}
                      </label>
                      <select id={`role-${t.id}`} name="role" defaultValue={t.role ?? ""} className={`${box} w-auto`}>
                        <option value="counsellor">Counsellor</option>
                        <option value="admin">Admin</option>
                        <option value="editor">Content editor</option>
                        <option value="none">Remove staff access</option>
                      </select>
                      <Submit className="inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-deep ring-1 ring-slate/25 hover:bg-mist" pending="Saving…">
                        Save
                      </Submit>
                    </ActionForm>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="grid grid-cols-1 gap-5">
          <Card>
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate">
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Add someone
            </h2>
            <ol className="mt-3 grid grid-cols-1 list-decimal gap-1 pl-5 text-sm leading-relaxed text-slate">
              <li>They create a portal account (Sign up, or Continue with Google) with their work email.</li>
              <li>You enter that email here and choose their role.</li>
              <li>Next time they sign in, they land on this dashboard.</li>
            </ol>
            <ActionForm action={setRole} className="mt-4 grid grid-cols-1 gap-3" clearOnSave>
              <label className="grid grid-cols-1 gap-1 text-sm font-semibold text-deep">
                Their email
                <input type="email" name="email" required maxLength={254} placeholder="name@example.com" className={box} />
              </label>
              <label className="grid grid-cols-1 gap-1 text-sm font-semibold text-deep">
                Role
                <select name="role" defaultValue="counsellor" className={box}>
                  <option value="counsellor">Counsellor</option>
                  <option value="admin">Admin</option>
                  <option value="editor">Content editor</option>
                </select>
              </label>
              <label className="flex items-start gap-2.5 text-sm text-deep">
                <input type="checkbox" name="confirm" className="mt-0.5 h-4.5 w-4.5 shrink-0 rounded accent-teal" />
                If they signed up as a student or parent, I confirm this account should become a staff account
              </label>
              <div>
                <Submit pending="Saving…">Give access</Submit>
              </div>
            </ActionForm>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              What each role can do
            </h2>
            <dl className="mt-3 grid grid-cols-1 gap-3 text-sm">
              {ROLE_HELP.map((r) => (
                <div key={r.role}>
                  <dt className="font-bold text-deep">{r.role}</dt>
                  <dd className="leading-relaxed text-slate">{r.text}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-slate">
              Removing someone&apos;s access hands their students, enquiries and requests back to the admins to reassign. Every view, download and change is kept in each student&apos;s activity log.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
