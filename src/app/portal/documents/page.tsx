import type { Metadata } from "next";
import Link from "next/link";
import { FileList } from "@/components/portal/FileList";
import { NoStudent } from "@/components/portal/NoStudent";
import { Uploader } from "@/components/portal/Uploader";
import { Card, DocBadge, Notice, PageTitle } from "@/components/portal/ui";
import { getPortal } from "@/lib/portal/context";
import { loadApplications, loadDocuments, studentChecklist, type ChecklistEntry } from "@/lib/portal/data";
import { destinationName, GROUP_TITLES, type DocGroup } from "@/lib/portal/journey";
import { storageConfigured } from "@/lib/portal/storage";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const p = await getPortal();
  if (!p.student) return <NoStudent />;
  const s = p.student;
  const [docs, apps] = await Promise.all([loadDocuments(p, s.id), loadApplications(p, s.id)]);
  const list = studentChecklist(p, apps, docs);
  const canUpload = p.canUpload && storageConfigured();

  const groups = new Map<DocGroup, ChecklistEntry[]>();
  for (const e of list.entries) groups.set(e.group, [...(groups.get(e.group) ?? []), e]);

  return (
    <>
      <PageTitle
        title="Documents"
        intro={
          <>
            PDF, JPG or PNG, up to 10 MB each. Files are stored privately: only {p.role === "parent" ? "your child, linked parents and their" : "you, linked parents and your"} counsellor can open them.
          </>
        }
      >
        <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm ring-1 ring-deep/6">
          <p className="text-2xl font-extrabold text-deep">
            {list.approvedCount}/{list.requiredCount}
          </p>
          <p className="text-xs font-semibold text-slate">key documents approved</p>
        </div>
      </PageTitle>

      <div className="grid gap-4">
        {!storageConfigured() && <Notice tone="info">Uploads switch on once document storage is connected. You can see your checklist already.</Notice>}
        {p.uploadBlock === "under18" && (
          <Notice tone="warn" title="A parent needs to link first">
            You&apos;re under 18, so a parent or guardian must link to your account, and you approve it, before documents are uploaded.{" "}
            <Link href="/portal/family" className="font-semibold underline">
              Share your link code
            </Link>
          </Notice>
        )}
        {p.uploadBlock === "no_dob" && (
          <Notice tone="warn">
            Please add your date of birth in your{" "}
            <Link href="/portal/profile" className="font-semibold underline">
              profile
            </Link>{" "}
            before uploading.
          </Notice>
        )}
        <p className="text-sm text-slate">
          {list.countries.length ? (
            <>Checklist for {list.countries.map(destinationName).join(", ")}.</>
          ) : (
            <>
              Add your preferred countries in your{" "}
              <Link href="/portal/profile" className="font-semibold text-teal underline">
                profile
              </Link>{" "}
              to see country-specific visa documents.
            </>
          )}
        </p>
      </div>

      <div className="mt-6 grid gap-5">
        {[...groups.entries()].map(([group, entries]) => (
          <Card key={group}>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate">{GROUP_TITLES[group]}</h2>
            <ul className="mt-2 divide-y divide-deep/6">
              {entries.map((e) => (
                <li key={e.key} id={e.key} className="py-4 last:pb-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-deep">
                        {e.label}
                        {!e.required && <span className="ml-2 text-xs font-semibold text-slate">if it applies</span>}
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-slate">{e.hint}</p>
                    </div>
                    <DocBadge status={e.status} />
                  </div>
                  <FileList files={e.files} me={p.userId} canUpload={canUpload} studentId={s.id} badges={e.files.length > 1} />
                  {canUpload && (e.files.length === 0 || e.multiple) && (
                    <div className="mt-3">
                      <Uploader studentId={s.id} docType={e.key} text={e.files.length ? "Add another" : "Upload"} primary={e.files.length === 0} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        ))}

        <Card>
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate">{GROUP_TITLES.other}</h2>
          <p className="mt-2 text-sm text-slate">Anything else your counsellor asked for.</p>
          <FileList files={list.other.files} me={p.userId} canUpload={canUpload} studentId={s.id} />
          {canUpload && (
            <div className="mt-4">
              <Uploader studentId={s.id} docType="other" askLabel text="Upload" primary={false} />
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
