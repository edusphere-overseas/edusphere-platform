import type { Metadata } from "next";
import { Card, formatDate, input, Pill } from "@/components/portal/ui";
import { ActionForm, Submit } from "@/components/staff/ActionForm";
import { assignStudent } from "../../_actions";
import { destinationName } from "@/lib/portal/journey";
import { ACTION_LABEL, displayName, LEAD_SOURCES, loadPeople, loadTeam, OFFICES } from "@/lib/staff/context";
import { getStudent } from "@/lib/staff/student";

export async function generateMetadata({ params }: PageProps<"/staff/students/[id]">): Promise<Metadata> {
  const { name } = await getStudent((await params).id);
  return { title: name };
}

type Row = Record<string, string>;
const rows = (v: unknown) => (Array.isArray(v) ? (v as Row[]).filter((r) => r && typeof r === "object") : []);

export default async function StudentOverview({ params }: PageProps<"/staff/students/[id]">) {
  const { id } = await params;
  const { s, student, details } = await getStudent(id);
  const [{ data: links }, { data: consents }, { data: lead }, { data: activity }, team] = await Promise.all([
    s.supabase.from("parent_links").select("id, parent_id, relationship, status, requested_via, created_at, decided_at").eq("student_id", id).order("created_at"),
    s.supabase.from("consents").select("id, user_id, kind, version, given_at").or(`user_id.eq.${id},student_id.eq.${id}`).order("given_at"),
    s.supabase.from("leads").select("source, interest, message, created_at, status").eq("profile_id", id).maybeSingle(),
    s.supabase.from("activity_log").select("id, actor_id, action, details, created_at").eq("student_id", id).order("created_at", { ascending: false }).limit(40),
    s.isAdmin ? loadTeam(s) : Promise.resolve([]),
  ]);
  const people = await loadPeople(s, [...(links ?? []).map((l) => l.parent_id), ...(consents ?? []).map((c) => c.user_id), ...(activity ?? []).map((a) => a.actor_id), student.invited_by]);
  const education = rows(details.academic_history);
  const tests = rows(details.test_scores);
  const counsellors = team.filter((t) => t.role === "admin" || t.role === "counsellor");

  const facts: [string, string | null | undefined][] = [
    ["Email", student.email],
    ["Phone", student.phone],
    ["Date of birth", details.date_of_birth ? formatDate(details.date_of_birth) : null],
    ["City", details.city],
    ["Countries", details.preferred_countries.map(destinationName).join(", ")],
    ["Level", details.preferred_level],
    ["Course", details.preferred_course],
    ["Intake", details.preferred_intake],
    ["Funding", details.funding],
    ["Joined", formatDate(student.created_at, true)],
  ];

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="grid grid-cols-1 gap-5">
        <Card>
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate">Profile</h2>
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {facts.map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-slate">{k}</dt>
                <dd className="truncate font-semibold text-deep">{v || <span className="font-normal text-slate/70">Not given</span>}</dd>
              </div>
            ))}
          </dl>
          {details.work_experience && (
            <div className="mt-4 text-sm">
              <p className="text-slate">Work experience</p>
              <p className="font-semibold whitespace-pre-wrap text-deep">{details.work_experience}</p>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate">Education and tests</h2>
          {education.length || tests.length ? (
            <div className="mt-3 grid grid-cols-1 gap-4 text-sm">
              {education.length > 0 && (
                <ul className="grid grid-cols-1 gap-2">
                  {education.map((e, i) => (
                    <li key={i} className="rounded-xl bg-mist/70 px-3.5 py-2.5">
                      <p className="font-semibold text-deep">{[e.level, e.institution].filter(Boolean).join(", ") || "Qualification"}</p>
                      <p className="text-slate">{[e.board, e.year, e.score && `Score ${e.score}`].filter(Boolean).join(" · ")}</p>
                    </li>
                  ))}
                </ul>
              )}
              {tests.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {tests.map((t, i) => (
                    <li key={i} className="rounded-xl bg-mist/70 px-3.5 py-2.5">
                      <span className="font-semibold text-deep">
                        {t.test} {t.score}
                      </span>
                      {t.date && <span className="text-slate"> · {formatDate(t.date)}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate">The student hasn&apos;t added any yet. They add these on their Profile page in the portal.</p>
          )}
        </Card>

        <Card>
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate">Activity</h2>
          {activity?.length ? (
            <ol className="mt-3 grid grid-cols-1 gap-2.5 text-sm">
              {activity.map((a) => {
                const d = (a.details ?? {}) as Record<string, string | null>;
                const extra = d.university ?? d.file ?? (d.service ? d.service.replace(/_/g, " ") : null);
                return (
                  <li key={a.id} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" aria-hidden="true" />
                    <span>
                      <span className="text-deep">
                        <strong>{a.actor_id === id ? "Student" : displayName(people.get(a.actor_id ?? "")) || "System"}</strong>: {ACTION_LABEL[a.action] ?? a.action.replace(/_/g, " ")}
                        {extra ? ` (${extra})` : ""}
                        {d.reason ? `: "${d.reason}"` : ""}
                      </span>
                      <span className="block text-xs text-slate">{formatDate(a.created_at, true)}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-2 text-sm text-slate">Nothing yet.</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {s.isAdmin && (
          <Card>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate">Counsellor</h2>
            <ActionForm action={assignStudent} className="mt-3 grid grid-cols-1 gap-3">
              <input type="hidden" name="student" value={id} />
              <label className="grid grid-cols-1 gap-1 text-sm font-semibold text-deep">
                Looked after by
                <select name="counsellor" defaultValue={details.counsellor_id ?? ""} className={`${input} py-2.5`}>
                  <option value="">Nobody yet</option>
                  {counsellors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {displayName(c)}
                      {c.role === "admin" ? " (admin)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              {OFFICES.length > 1 ? (
                <label className="grid grid-cols-1 gap-1 text-sm font-semibold text-deep">
                  Office
                  <select name="office" defaultValue={details.office} className={`${input} py-2.5`}>
                    {OFFICES.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <input type="hidden" name="office" value={details.office} />
              )}
              <p className="text-xs leading-relaxed text-slate">The counsellor sees this student, gets their messages and requests, and is emailed when you assign them.</p>
              <div>
                <Submit pending="Saving…">Save</Submit>
              </div>
            </ActionForm>
          </Card>
        )}

        <Card>
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate">Family</h2>
          {links?.length ? (
            <ul className="mt-3 grid grid-cols-1 gap-2.5">
              {links.map((l) => {
                const parent = people.get(l.parent_id);
                return (
                  <li key={l.id} className="rounded-xl bg-mist/70 px-3.5 py-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-deep">
                        {displayName(parent) || "Parent"} <span className="font-normal text-slate">({l.relationship})</span>
                      </p>
                      <Pill tone={l.status === "approved" ? "green" : l.status === "pending" ? "amber" : "slate"}>
                        {l.status === "approved" ? "Linked" : l.status === "pending" ? "Waiting for student" : l.status === "declined" ? "Declined" : "Removed"}
                      </Pill>
                    </div>
                    {parent && (
                      <p className="mt-1 text-slate">
                        <a href={`mailto:${parent.email}`} className="hover:text-teal">
                          {parent.email}
                        </a>
                        {parent.phone && (
                          <>
                            {" · "}
                            <a href={`tel:${parent.phone.replace(/[^\d+]/g, "")}`} className="hover:text-teal">
                              {parent.phone}
                            </a>
                          </>
                        )}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate">No parent linked. Students share a link code from their Family page.</p>
          )}
          {student.invited_by && <p className="mt-3 text-xs text-slate">Account created by {displayName(people.get(student.invited_by)) || "a parent"}.</p>}
        </Card>

        <Card>
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate">Consent records</h2>
          {consents?.length ? (
            <ul className="mt-3 grid grid-cols-1 gap-2 text-sm">
              {consents.map((c) => (
                <li key={c.id} className="text-deep">
                  <strong>{c.user_id === id ? "Student" : displayName(people.get(c.user_id)) || "Parent"}</strong>:{" "}
                  {c.kind === "guardian" ? "confirmed they are the parent or guardian" : "agreed to data processing"}
                  <span className="block text-xs text-slate">
                    {formatDate(c.given_at, true)} · version {c.version}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate">No consent recorded yet: the student hasn&apos;t finished signing up.</p>
          )}
        </Card>

        {lead && (
          <Card>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate">How they found us</h2>
            <p className="mt-2 text-sm text-deep">
              {LEAD_SOURCES[lead.source] ?? lead.source} · {formatDate(lead.created_at)}
            </p>
            {lead.interest && <p className="mt-1 text-sm font-semibold text-deep">{lead.interest}</p>}
            {lead.message && <p className="mt-1 text-sm whitespace-pre-wrap text-slate">{lead.message}</p>}
          </Card>
        )}
      </div>
    </div>
  );
}
