import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Search, Users } from "lucide-react";
import { btnGhost, Card, Empty, formatDate, input, PageTitle, Pill } from "@/components/portal/ui";
import { destinationName } from "@/lib/portal/journey";
import { FINAL_STATUSES } from "@/lib/portal/services";
import { ageFrom, displayName, getStaff, loadTeam } from "@/lib/staff/context";

export const metadata: Metadata = { title: "Students" };

const clean = (q: string) => q.replace(/[^\p{L}\p{N}@.+\-\s]/gu, "").trim().slice(0, 60);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function StudentsPage({ searchParams }: PageProps<"/staff/students">) {
  const s = await getStaff();
  if (!s.allowed) return null;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? clean(sp.q) : "";
  const counsellor = s.isAdmin && typeof sp.counsellor === "string" && (sp.counsellor === "none" || uuid.test(sp.counsellor)) ? sp.counsellor : "";

  let query = s.supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, created_at, onboarded_at, details:student_profiles!student_profiles_user_id_fkey!inner(counsellor_id, office, city, date_of_birth, preferred_countries, preferred_level, preferred_intake)",
    )
    .eq("role", "student")
    .order("created_at", { ascending: false })
    .limit(300);
  if (q) query = query.or(["full_name", "email", "phone"].map((c) => `${c}.ilike."%${q}%"`).join(","));
  if (counsellor === "none") query = query.is("details.counsellor_id", null);
  else if (counsellor) query = query.eq("details.counsellor_id", counsellor);

  const [{ data: students }, team, waitingDocs, openRequests] = await Promise.all([
    query,
    loadTeam(s),
    s.supabase.from("documents").select("student_id").eq("status", "under_review").limit(2000),
    s.supabase.from("service_requests").select("student_id, status").not("status", "in", `(${FINAL_STATUSES.join(",")})`).limit(2000),
  ]);
  const tally = (rows: { student_id: string }[] | null) => (rows ?? []).reduce((m, r) => m.set(r.student_id, (m.get(r.student_id) ?? 0) + 1), new Map<string, number>());
  const docsByStudent = tally(waitingDocs.data);
  const newRequests = tally((openRequests.data ?? []).filter((r) => r.status === "requested"));
  const staffById = new Map(team.map((t) => [t.id, t]));
  const counsellors = team.filter((t) => t.role === "admin" || t.role === "counsellor");

  return (
    <>
      <PageTitle
        title={s.isAdmin ? "Students" : "My students"}
        intro={s.isAdmin ? "Every student with a portal account. New students have no counsellor until you assign one on their record." : "Students assigned to you by an admin."}
      />

      <form className="mb-5 flex flex-wrap gap-2" role="search">
        <label htmlFor="student-search" className="sr-only">
          Search students
        </label>
        <input id="student-search" name="q" defaultValue={q} placeholder="Name, email or phone" className={`${input} max-w-sm flex-1 py-2.5`} />
        {s.isAdmin && (
          <>
            <label htmlFor="student-counsellor" className="sr-only">
              Counsellor
            </label>
            <select id="student-counsellor" name="counsellor" defaultValue={counsellor} className={`${input} w-auto py-2.5`}>
              <option value="">All counsellors</option>
              <option value="none">No counsellor yet</option>
              {counsellors.map((c) => (
                <option key={c.id} value={c.id}>
                  {displayName(c)}
                </option>
              ))}
            </select>
          </>
        )}
        <button type="submit" className={btnGhost}>
          <Search className="h-4 w-4" aria-hidden="true" />
          Search
        </button>
      </form>

      {students?.length ? (
        <Card className="overflow-hidden p-0 sm:p-0">
          <ul className="divide-y divide-deep/6">
            {students.map((st) => {
              const d = st.details;
              const age = ageFrom(d?.date_of_birth);
              const docs = docsByStudent.get(st.id) ?? 0;
              const reqs = newRequests.get(st.id) ?? 0;
              return (
                <li key={st.id}>
                  <Link href={`/staff/students/${st.id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-mist/60 sm:px-6">
                    <span className="grid grid-cols-1 h-10 w-10 shrink-0 place-items-center rounded-full bg-teal/12 text-sm font-bold text-navy">
                      {(st.full_name || st.email).slice(0, 1).toUpperCase()}
                    </span>
                    <span className="grid grid-cols-1 min-w-0 flex-1 gap-0.5 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.9fr)] sm:items-center sm:gap-4">
                      <span className="min-w-0">
                        <span className="block truncate font-bold text-deep">{displayName(st)}</span>
                        <span className="block truncate text-sm text-slate">
                          {[st.phone, age !== null ? `${age} yrs` : null, d?.city].filter(Boolean).join(" · ") || st.email}
                        </span>
                      </span>
                      <span className="truncate text-sm text-slate">
                        {[(d?.preferred_countries ?? []).map(destinationName).join(", "), d?.preferred_level, d?.preferred_intake].filter(Boolean).join(" · ") || "No preferences yet"}
                      </span>
                      <span className="flex flex-wrap items-center gap-1.5 text-sm">
                        {s.isAdmin &&
                          (d?.counsellor_id ? (
                            <span className="truncate text-slate">{displayName(staffById.get(d.counsellor_id)) || "Counsellor"}</span>
                          ) : (
                            <Pill tone="amber">No counsellor</Pill>
                          ))}
                        {!st.onboarded_at && <Pill>Sign-up unfinished</Pill>}
                        {docs > 0 && <Pill tone="amber">{docs} to review</Pill>}
                        {reqs > 0 && <Pill tone="amber">{reqs} new request{reqs > 1 ? "s" : ""}</Pill>}
                        {!s.isAdmin && !docs && !reqs && <span className="text-slate">Joined {formatDate(st.created_at)}</span>}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : (
        <Empty icon={<Users className="h-6 w-6" aria-hidden="true" />} title={q || counsellor ? "No students match" : "No students yet"}>
          {s.isAdmin ? "Students appear here when they create a portal account." : "An admin will assign students to you."}
        </Empty>
      )}
      {(students?.length ?? 0) >= 300 && <p className="mt-3 text-sm text-slate">Showing the newest 300. Search to find others.</p>}
    </>
  );
}
