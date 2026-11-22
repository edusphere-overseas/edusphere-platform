import type { Metadata } from "next";
import { CalendarClock, ListChecks } from "lucide-react";
import { StageBar, StageSteps } from "@/components/portal/Tracker";
import { Card, Empty, formatDate, PageTitle, Pill } from "@/components/portal/ui";
import { NoStudent } from "@/components/portal/NoStudent";
import { getPortal } from "@/lib/portal/context";
import { loadApplications } from "@/lib/portal/data";
import { DESTINATIONS, destinationName, stageLabel } from "@/lib/portal/journey";

export const metadata: Metadata = { title: "Application tracker" };

export default async function ApplicationsPage() {
  const p = await getPortal();
  if (!p.student) return <NoStudent />;
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
      {apps.length === 0 ? (
        <div className="grid items-start gap-5 lg:grid-cols-[1fr_1.2fr]">
          <Card>
            <h2 className="mb-5 font-bold text-deep">Your journey</h2>
            <StageSteps stage="counselling" reached={{}} />
          </Card>
          <Empty icon={<ListChecks className="h-6 w-6" />} title="No applications yet">
            After counselling, your counsellor adds each university you apply to. Their stages appear here, from shortlist to visa.
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
