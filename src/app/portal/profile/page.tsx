import type { Metadata } from "next";
import { AccountForm, StudentDetailsForm } from "@/components/portal/ProfileForms";
import { Card, formatDate, PageTitle } from "@/components/portal/ui";
import { getPortal } from "@/lib/portal/context";
import { destinationName } from "@/lib/portal/journey";

export const metadata: Metadata = { title: "Profile" };

type Row = Record<string, string>;

export default async function ProfilePage() {
  const p = await getPortal();
  const d = p.student?.details;
  const { data: consents } = await p.supabase.from("consents").select("kind, version, given_at").eq("user_id", p.userId).order("given_at", { ascending: false });

  return (
    <>
      <PageTitle title="Profile" intro={p.role === "student" ? "Your details help your counsellor shortlist courses and prepare your checklist." : undefined} />
      <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        {p.role === "student" && d ? (
          <Card>
            <h2 className="mb-5 text-lg font-bold text-deep">Study plans and background</h2>
            <StudentDetailsForm
              d={{
                date_of_birth: d.date_of_birth,
                city: d.city,
                preferred_countries: d.preferred_countries,
                preferred_level: d.preferred_level,
                preferred_course: d.preferred_course,
                preferred_intake: d.preferred_intake,
                academic_history: (d.academic_history as Row[]) ?? [],
                test_scores: (d.test_scores as Row[]) ?? [],
                work_experience: d.work_experience,
                funding: d.funding,
              }}
            />
          </Card>
        ) : p.student && d ? (
          <Card>
            <h2 className="text-lg font-bold text-deep">{p.student.name}</h2>
            <p className="text-sm text-slate">{[p.student.email, p.student.phone].filter(Boolean).join(" · ")}</p>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <Item k="Countries" v={d.preferred_countries.map(destinationName).join(", ")} />
              <Item k="Level" v={d.preferred_level} />
              <Item k="Course" v={d.preferred_course} />
              <Item k="Intake" v={d.preferred_intake} />
              <Item k="Funding" v={d.funding} />
              <Item k="Home city" v={d.city} />
            </dl>
            {((d.academic_history as Row[]) ?? []).length > 0 && (
              <div className="mt-5">
                <p className="text-sm text-slate">Education</p>
                <ul className="mt-1 grid gap-1 text-sm font-semibold text-deep">
                  {(d.academic_history as Row[]).map((r, i) => (
                    <li key={i}>{[r.level, r.institution, r.year, r.score].filter(Boolean).join(" · ")}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-5 text-xs text-slate">Only {p.student.name.split(" ")[0]} can edit these details.</p>
          </Card>
        ) : null}

        <div className="grid gap-5">
          <Card>
            <h2 className="mb-5 text-lg font-bold text-deep">Your account</h2>
            <AccountForm name={p.profile.full_name} phone={p.profile.phone ?? ""} email={p.profile.email} />
          </Card>
          <Card>
            <h2 className="text-lg font-bold text-deep">Consent</h2>
            <ul className="mt-3 grid gap-2 text-sm text-slate">
              {(consents ?? []).map((c, i) => (
                <li key={i}>
                  {c.kind === "guardian" ? "Confirmed you are the parent or guardian" : "Agreed to the use of your details"} · {formatDate(c.given_at)}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-slate">To withdraw consent or ask for your data to be deleted, message your counsellor.</p>
          </Card>
        </div>
      </div>
    </>
  );
}

function Item({ k, v }: { k: string; v?: string | null }) {
  return (
    <div>
      <dt className="text-slate">{k}</dt>
      <dd className="font-semibold text-deep">{v || "Not added yet"}</dd>
    </div>
  );
}
