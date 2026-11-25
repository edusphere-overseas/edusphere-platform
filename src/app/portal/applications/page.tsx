import type { Metadata } from "next";
import { connection } from "next/server";
import { CalendarClock, ListChecks, Plus, Trash2 } from "lucide-react";
import { removeUniversity } from "@/app/portal/_actions/applications";
import { AddUniversityForm } from "@/components/apply/AddUniversityForm";
import { StageBar, StageSteps } from "@/components/portal/Tracker";
import { btnGhost, Card, Empty, formatDate, Notice, PageTitle, Pill } from "@/components/portal/ui";
import { CATALOGUE_COUNTRIES } from "@/lib/catalogue";
import { intakeOptions } from "@/lib/intakes";
import { NoStudent } from "@/components/portal/NoStudent";
import { getPortal } from "@/lib/portal/context";
import { loadApplications } from "@/lib/portal/data";
import { DESTINATIONS, destinationName, stageLabel } from "@/lib/portal/journey";

export const metadata: Metadata = { title: "Application tracker" };

const countries = CATALOGUE_COUNTRIES.map(({ id, name, flag }) => ({ id, name, flag }));

export default async function ApplicationsPage({ searchParams }: PageProps<"/portal/applications">) {
  const p = await getPortal();
  if (!p.student) return <NoStudent />;
  const sp = await searchParams;
  await connection(); // the intake list depends on today's date
  const added = typeof sp.added === "string" ? sp.added : "";
  const apps = await loadApplications(p, p.student.id);
  const { data: events } = apps.length
    ? await p.supabase.from("application_events").select("application_id, stage, created_at").in("application_id", apps.map((a) => a.id)).order("created_at")
    : { data: [] };

  return (
    <>
      <PageTitle
        title="Application tracker"
        intro="Each university application moves through these stages. You'll get an email whenever a stage changes."
      />
      {added && apps.some((a) => a.id === added) && (
        <div className="mb-5">
          <Notice tone="ok" title="University added">
            It&apos;s on your list as a shortlist entry, and your counsellor has been told. They&apos;ll check the course and entry requirements with you before applying.
          </Notice>
        </div>
      )}
      {!p.staff && (
        <Card className="mb-5">
          <details className="group" open={apps.length === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span>
                <span className="block font-bold text-deep">Add a university</span>
                <span className="block text-sm text-slate">Choose the country and university you&apos;d like to apply to. Not in our list? Type its name.</span>
              </span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal/12 text-teal transition group-open:rotate-45">
                <Plus className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
            </summary>
            <div className="mt-5 border-t border-deep/8 pt-5">
              <AddUniversityForm countries={countries} intakes={intakeOptions()} submitLabel="Add to my list" />
            </div>
          </details>
        </Card>
      )}
      {apps.length === 0 ? (
        <div className="grid items-start gap-5 lg:grid-cols-[1fr_1.2fr]">
          <Card>
            <h2 className="mb-5 font-bold text-deep">Your journey</h2>
            <StageSteps stage="counselling" reached={{}} />
          </Card>
          <Empty icon={<ListChecks className="h-6 w-6" />} title="No applications yet">
            Add the universities you&apos;re interested in above, or your counsellor adds them after counselling. Their stages appear here, from shortlist to visa.
          </Empty>
        </div>
      ) : (
        <div className="grid gap-5">
          {apps.map((a) => {
            const reached: Record<string, string> = {};
            for (const e of events ?? []) if (e.application_id === a.id && !reached[e.stage]) reached[e.stage] = e.created_at;
            const flag = DESTINATIONS.find((d) => d.id === a.country)?.flag;
            const overdue = a.deadline && a.status === "active" && new Date(a.deadline + "T23:59:59") < new Date();
            return (
              <Card key={a.id} as="article">
                <div className="flex flex-wrap items-start gap-4">
                  {flag && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/flags/${flag}.svg`} alt="" className="mt-1 h-7 w-9 rounded-md object-cover ring-1 ring-deep/10" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-deep">{a.university}</h2>
                    <p className="text-sm text-slate">{[a.course, destinationName(a.country), a.intake].filter(Boolean).join(" · ")}</p>
                  </div>
                  {a.status === "active" ? (
                    <Pill tone="teal">{stageLabel(a.stage, a.country)}</Pill>
                  ) : (
                    <Pill tone="slate">{a.status === "withdrawn" ? "Withdrawn" : "Unsuccessful"}</Pill>
                  )}
                </div>
                <div className="mt-5">
                  <StageBar stage={a.stage} country={a.country} muted={a.status !== "active"} />
                </div>
                {a.stage === "shortlist" && a.created_by === p.userId && (
                  <form action={removeUniversity} className="mt-4">
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className={`${btnGhost} min-h-9 px-3.5 py-1.5 text-xs`}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Remove from my list
                    </button>
                  </form>
                )}
                {(a.deadline || a.note) && (
                  <div className="mt-4 grid gap-2 text-sm">
                    {a.deadline && (
                      <p className={`flex items-center gap-2 ${overdue ? "font-semibold text-[#b42318]" : "text-slate"}`}>
                        <CalendarClock className="h-4 w-4" aria-hidden="true" />
                        Next deadline: {formatDate(a.deadline)}
                        {overdue && " (passed)"}
                      </p>
                    )}
                    {a.note && <p className="rounded-xl bg-mist px-3.5 py-2.5 leading-relaxed text-deep">{a.note}</p>}
                  </div>
                )}
                <details className="group mt-4">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-teal hover:text-navy">
                    <span className="group-open:hidden">Show all stages</span>
                    <span className="hidden group-open:inline">Hide stages</span>
                  </summary>
                  <div className="mt-4">
                    <StageSteps stage={a.stage} country={a.country} reached={reached} />
                  </div>
                </details>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
