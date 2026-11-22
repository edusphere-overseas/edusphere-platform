import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { StageBar } from "@/components/portal/Tracker";
import { btnDanger, btnGhost, Card, formatDate, input, Pill } from "@/components/portal/ui";
import { ActionForm, Submit } from "@/components/staff/ActionForm";
import { deleteApplication, saveApplication } from "../../../_actions";
import { loadApplications, type ApplicationRow } from "@/lib/portal/data";
import { DESTINATIONS, destinationName, stageLabel, STAGES } from "@/lib/portal/journey";
import { APPLICATION_STATUSES } from "@/lib/staff/context";
import { getStudent } from "@/lib/staff/student";

export const metadata: Metadata = { title: "Applications" };

const field = "grid gap-1 text-sm font-semibold text-deep";
const box = `${input} py-2.5`;

export default async function StaffApplications({ params }: PageProps<"/staff/students/[id]/applications">) {
  const { id } = await params;
  const { s, details } = await getStudent(id);
  const apps = await loadApplications(s, id);
  const fallbackCountry = details.preferred_countries.length === 1 ? details.preferred_countries[0] : "";

  return (
    <div className="grid grid-cols-1 gap-5">
      <p className="max-w-2xl text-sm leading-relaxed text-slate">
        The student and linked parents see each application in their tracker, with your note. When you move an application to a new stage you can email the family.
      </p>

      {apps.length ? (
        apps.map((a) => (
          <Card key={a.id} className="scroll-mt-28">
            <div id={a.id} className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-deep">{a.university}</h2>
                <p className="text-sm text-slate">{[a.course, destinationName(a.country), a.intake].filter(Boolean).join(" · ") || "No course details yet"}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {a.deadline && <Pill tone="amber">Deadline {formatDate(a.deadline)}</Pill>}
                <Pill tone={a.status === "active" ? "teal" : "slate"}>{a.status === "active" ? stageLabel(a.stage, a.country) : APPLICATION_STATUSES.find((x) => x.key === a.status)?.label}</Pill>
              </div>
            </div>
            <div className="mt-4">
              <StageBar stage={a.stage} country={a.country} muted={a.status !== "active"} />
            </div>
            {a.note && <p className="mt-4 rounded-xl bg-mist/70 px-3.5 py-2.5 text-sm whitespace-pre-wrap text-deep">{a.note}</p>}
            <details className="mt-4 group">
              <summary className={`${btnGhost} min-h-10 cursor-pointer list-none py-2 [&::-webkit-details-marker]:hidden`}>Update</summary>
              <div className="mt-4 rounded-xl bg-mist/60 p-4">
                <ApplicationForm studentId={id} app={a} />
                {s.isAdmin && (
                  <ActionForm action={deleteApplication} className="mt-4 flex flex-wrap items-center gap-3 border-t border-deep/8 pt-4">
                    <input type="hidden" name="id" value={a.id} />
                    <p className="text-xs text-slate">Added by mistake? Remove it. Otherwise mark it withdrawn or unsuccessful, so the history stays.</p>
                    <Submit className={`${btnDanger} min-h-9 py-1.5`} pending="Removing…">
                      Remove application
                    </Submit>
                  </ActionForm>
                )}
              </div>
            </details>
          </Card>
        ))
      ) : (
        <Card>
          <p className="text-sm text-slate">No applications yet. Add the first one below once you&apos;ve shortlisted universities with the student.</p>
        </Card>
      )}

      <Card>
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add an application
        </h2>
        <div className="mt-4">
          <ApplicationForm studentId={id} defaultCountry={fallbackCountry} />
        </div>
      </Card>
    </div>
  );
}

function ApplicationForm({ studentId, app, defaultCountry = "" }: { studentId: string; app?: ApplicationRow; defaultCountry?: string }) {
  return (
    <ActionForm action={saveApplication} className="grid grid-cols-1 gap-3 sm:grid-cols-2" clearOnSave={!app}>
      <input type="hidden" name="student" value={studentId} />
      {app && <input type="hidden" name="id" value={app.id} />}
      <label className={field}>
        University
        <input name="university" required maxLength={160} defaultValue={app?.university} placeholder="For example: University of Leeds" className={box} />
      </label>
      <label className={field}>
        Course
        <input name="course" maxLength={200} defaultValue={app?.course} placeholder="For example: MSc Data Science" className={box} />
      </label>
      <label className={field}>
        Country
        <select name="country" defaultValue={app?.country ?? defaultCountry} className={box}>
          <option value="">Choose…</option>
          {DESTINATIONS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
      <label className={field}>
        Intake
        <input name="intake" maxLength={40} defaultValue={app?.intake ?? ""} placeholder="For example: September 2027" className={box} />
      </label>
      <label className={field}>
        Stage
        <select name="stage" defaultValue={app?.stage ?? "shortlist"} className={box}>
          {STAGES.map((st) => (
            <option key={st.key} value={st.key}>
              {stageLabel(st.key, app?.country)}
            </option>
          ))}
        </select>
      </label>
      <label className={field}>
        Status
        <select name="status" defaultValue={app?.status ?? "active"} className={box}>
          {APPLICATION_STATUSES.map((st) => (
            <option key={st.key} value={st.key}>
              {st.label}
            </option>
          ))}
        </select>
      </label>
      <label className={field}>
        Deadline <span className="font-normal text-slate">(optional)</span>
        <input type="date" name="deadline" defaultValue={app?.deadline ?? ""} className={box} />
      </label>
      <label className={`${field} sm:col-span-2`}>
        Note for the family <span className="font-normal text-slate">(optional, they see this)</span>
        <textarea name="note" rows={2} maxLength={1000} defaultValue={app?.note ?? ""} placeholder="For example: Offer is conditional on IELTS 6.5 overall" className={`${box} resize-y`} />
      </label>
      <label className="flex items-center gap-2.5 text-sm text-deep sm:col-span-2">
        <input type="checkbox" name="notify" defaultChecked className="h-4.5 w-4.5 rounded accent-teal" />
        {app ? "Email the student and parents if the stage changes" : "Email the student and parents about this application"}
      </label>
      <div className="sm:col-span-2">
        <Submit pending="Saving…">{app ? "Save changes" : "Add application"}</Submit>
      </div>
    </ActionForm>
  );
}
