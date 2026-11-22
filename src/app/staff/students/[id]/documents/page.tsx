import type { Metadata } from "next";
import { Uploader } from "@/components/portal/Uploader";
import { Card, DocBadge, Notice } from "@/components/portal/ui";
import { StaffFiles } from "@/components/staff/StaffFiles";
import { checklistCountries, checklistWithStatus, loadApplications, loadDocuments, type ChecklistEntry } from "@/lib/portal/data";
import { buildChecklist, destinationName, GROUP_TITLES, type DocGroup } from "@/lib/portal/journey";
import { storageConfigured } from "@/lib/portal/storage";
import { loadPeople } from "@/lib/staff/context";
import { getStudent } from "@/lib/staff/student";

export const metadata: Metadata = { title: "Documents" };

export default async function StaffDocuments({ params }: PageProps<"/staff/students/[id]/documents">) {
  const { id } = await params;
  const { s, details } = await getStudent(id);
  const [docs, apps] = await Promise.all([loadDocuments(s, id), loadApplications(s, id)]);
  const countries = checklistCountries(apps, details.preferred_countries);
  const list = checklistWithStatus(buildChecklist({ countries, level: details.preferred_level }), docs);
  const people = await loadPeople(s, docs.flatMap((d) => [d.uploaded_by, d.reviewed_by]));
  const canUpload = storageConfigured();

  const groups = new Map<DocGroup, ChecklistEntry[]>();
  for (const e of list.entries) groups.set(e.group, [...(groups.get(e.group) ?? []), e]);
  const serviceDocs = docs.filter((d) => d.service_request_id).length;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl text-sm leading-relaxed text-slate">
          {countries.length ? <>Checklist for {countries.map(destinationName).join(", ")}. </> : <>No destination chosen yet, so only the general checklist shows. </>}
          Approving needs no email; asking for a new upload emails the family with your reason. Files you upload here (offer letters, for example) are approved at once.
          {serviceDocs > 0 && <> Documents sent with a service request are on that request&apos;s page.</>}
        </p>
        <div className="flex gap-3">
          <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm ring-1 ring-deep/6">
            <p className="text-2xl font-extrabold text-deep">
              {list.approvedCount}/{list.requiredCount}
            </p>
            <p className="text-xs font-semibold text-slate">key documents approved</p>
          </div>
          {list.reviewCount > 0 && (
            <div className="rounded-2xl bg-[#fff8eb] px-4 py-3 text-right ring-1 ring-[#f5b041]/40">
              <p className="text-2xl font-extrabold text-[#9a5b00]">{list.reviewCount}</p>
              <p className="text-xs font-semibold text-[#9a5b00]">to review</p>
            </div>
          )}
        </div>
      </div>

      {!canUpload && (
        <div className="mb-5">
          <Notice tone="info">Uploads are switched off because document storage isn&apos;t connected on this server.</Notice>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5">
        {[...groups.entries()].map(([group, entries]) => (
          <Card key={group}>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate">{GROUP_TITLES[group]}</h2>
            <ul className="mt-2 divide-y divide-deep/6">
              {entries.map((e) => (
                <li key={e.key} className="py-4 last:pb-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold text-deep">
                      {e.label}
                      {!e.required && <span className="ml-2 text-xs font-semibold text-slate">if it applies</span>}
                    </p>
                    <DocBadge status={e.status} />
                  </div>
                  <StaffFiles files={e.files} people={people} studentId={id} />
                  {canUpload && (
                    <div className="mt-3">
                      <Uploader studentId={id} docType={e.key} text={e.files.length ? "Upload another" : "Upload for the student"} primary={false} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        ))}

        <Card>
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate">{GROUP_TITLES.other}</h2>
          {list.other.files.length ? <StaffFiles files={list.other.files} people={people} studentId={id} /> : <p className="mt-2 text-sm text-slate">Nothing else uploaded.</p>}
          {canUpload && (
            <div className="mt-4">
              <Uploader studentId={id} docType="other" askLabel text="Upload another document" primary={false} />
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
