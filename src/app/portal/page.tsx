import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, LifeBuoy, ListChecks, MessageCircle, UserRound } from "lucide-react";
import { LinkChildForm } from "@/components/portal/Family";
import { LinkedPeople, PendingRequests } from "@/components/portal/LinkLists";
import { StageBar } from "@/components/portal/Tracker";
import { btnGhost, btnPrimary, Card, Notice, Pill } from "@/components/portal/ui";
import { getPortal } from "@/lib/portal/context";
import { loadApplications, loadDocuments, loadRequests, studentChecklist } from "@/lib/portal/data";
import { destinationName, stageIndex, stageLabel } from "@/lib/portal/journey";
import { FINAL_STATUSES, serviceByKey, statusLabel } from "@/lib/portal/services";

export const metadata: Metadata = { title: "Home" };

export default async function PortalHome({ searchParams }: PageProps<"/portal">) {
  const p = await getPortal();
  const verified = (await searchParams).verified === "1";

  // A parent who hasn't linked to a child yet
  if (p.role === "parent" && !p.student) {
    return (
      <>
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-deep sm:text-3xl">Welcome, {p.firstName}</h1>
        <p className="mt-2 max-w-2xl leading-relaxed text-slate">
          Link to your child&apos;s account to see their documents, application stages and services. They approve the request from their portal.
        </p>
        {verified && <div className="mt-5"><Notice tone="ok">Your email is verified. Welcome to the portal.</Notice></div>}
        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[1.1fr_1fr]">
          <Card>
            <h2 className="text-lg font-bold text-deep">Link to your child</h2>
            <div className="mt-4">
              <LinkChildForm />
            </div>
          </Card>
          {p.links.length > 0 && (
            <Card>
              <h2 className="text-lg font-bold text-deep">Requests</h2>
              <div className="mt-4">
                <LinkedPeople links={p.links} viewer="parent" />
              </div>
            </Card>
          )}
        </div>
      </>
    );
  }

  // Staff are sent to the staff dashboard by the layout; nothing to show here
  if (!p.student) return null;
  const s = p.student;
  const [docs, apps, requests] = await Promise.all([loadDocuments(p, s.id), loadApplications(p, s.id), loadRequests(p, s.id)]);
  const list = studentChecklist(p, apps, docs);
  const activeApps = apps.filter((a) => a.status === "active");
  const leading = [...activeApps].sort((a, b) => stageIndex(b.stage) - stageIndex(a.stage))[0];
  const openRequests = requests.filter((r) => !FINAL_STATUSES.includes(r.status));
  const profileIncomplete = p.role === "student" && !(s.details?.preferred_countries?.length && s.details.preferred_intake);
  const pct = list.requiredCount ? Math.round((list.approvedCount / list.requiredCount) * 100) : 0;

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-deep sm:text-3xl">
        {p.role === "parent" ? `${s.name.split(" ")[0]}'s progress` : `Hi ${p.firstName}`}
      </h1>
      <p className="mt-1.5 text-slate">
        {p.role === "parent" ? "Everything your child shares with Edusphere, in one place." : "Here's where things stand with your application."}
      </p>

      <div className="mt-6 grid gap-4">
        {verified && <Notice tone="ok">Your email is verified. Welcome to the portal.</Notice>}
        {p.role === "student" && <PendingRequests links={p.links} />}
        {p.uploadBlock === "under18" && (
          <Notice tone="warn" title="A parent needs to link before you upload documents">
            You&apos;re under 18, so a parent or guardian must link to your account and you approve it.{" "}
            <Link href="/portal/family" className="font-semibold underline">
              Share your link code
            </Link>
          </Notice>
        )}
        {profileIncomplete && (
          <Notice tone="info" title="Complete your profile">
            Add your preferred countries and intake so we can tailor your document checklist.{" "}
            <Link href="/portal/profile" className="font-semibold underline">
              Complete profile
            </Link>
          </Notice>
        )}
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Card>
          <Heading icon={<FileText className="h-5 w-5" />} title="Documents" href="/portal/documents" />
          <div className="mt-5 flex items-end justify-between gap-3">
            <p className="text-4xl font-extrabold text-deep">
              {list.approvedCount}
              <span className="text-lg font-bold text-slate"> / {list.requiredCount}</span>
            </p>
            <p className="pb-1 text-sm text-slate">key documents approved</p>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-mist" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Documents approved">
            <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {list.reuploadCount > 0 && <Pill tone="red">{list.reuploadCount} need a re-upload</Pill>}
            {list.reviewCount > 0 && <Pill tone="amber">{list.reviewCount} under review</Pill>}
            {list.reuploadCount === 0 && list.reviewCount === 0 && docs.length === 0 && <Pill>Nothing uploaded yet</Pill>}
          </div>
          <Link href="/portal/documents" className={`${btnPrimary} mt-5 w-full sm:w-auto`}>
            {docs.length ? "Open documents" : "Upload documents"}
          </Link>
        </Card>

        <Card>
          <Heading icon={<ListChecks className="h-5 w-5" />} title="Applications" href="/portal/applications" />
          {leading ? (
            <>
              <p className="mt-5 font-bold text-deep">{leading.university}</p>
              <p className="text-sm text-slate">{[leading.course, destinationName(leading.country), leading.intake].filter(Boolean).join(" · ")}</p>
              <div className="mt-4">
                <StageBar stage={leading.stage} country={leading.country} />
              </div>
              <p className="mt-3 text-sm text-slate">
                Now: <strong className="text-deep">{stageLabel(leading.stage, leading.country)}</strong>
                {activeApps.length > 1 && ` · ${activeApps.length} applications`}
              </p>
            </>
          ) : (
            <>
              <div className="mt-5">
                <StageBar stage="counselling" />
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate">
                You&apos;re at the start: counselling. Your counsellor adds each university application here, and you&apos;ll see every stage as it happens.
              </p>
            </>
          )}
          <Link href="/portal/applications" className={`${btnGhost} mt-5 w-full sm:w-auto`}>
            Open tracker
          </Link>
        </Card>

        <Card>
          <Heading icon={<LifeBuoy className="h-5 w-5" />} title="Services" href="/portal/services" />
          {openRequests.length ? (
            <ul className="mt-4 divide-y divide-deep/6">
              {openRequests.slice(0, 3).map((r) => (
                <li key={r.id}>
                  <Link href={`/portal/services/${r.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-teal">
                    <span className="min-w-0 truncate font-semibold text-deep">{serviceByKey(r.service)?.title}</span>
                    <Pill tone="teal">{statusLabel(r.service, r.status)}</Pill>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-slate">Airport pickup, accommodation, scholarships and more: request them here and follow each one.</p>
          )}
          <Link href="/portal/services" className={`${btnGhost} mt-5 w-full sm:w-auto`}>
            {openRequests.length ? "All requests" : "Request a service"}
          </Link>
        </Card>

        <Card>
          <Heading icon={<UserRound className="h-5 w-5" />} title="Your counsellor" />
          {s.counsellor ? (
            <>
              <p className="mt-5 text-lg font-bold text-deep">{s.counsellor.name}</p>
              <p className="text-sm text-slate">{s.counsellor.email}</p>
            </>
          ) : (
            <p className="mt-5 text-sm leading-relaxed text-slate">A counsellor will be assigned to you shortly. You can already send us a message.</p>
          )}
          <Link href="/portal/messages" className={`${btnGhost} mt-5 w-full sm:w-auto`}>
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Send a message
          </Link>
        </Card>
      </div>
    </>
  );
}

function Heading({ icon, title, href }: { icon: React.ReactNode; title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2.5 text-base font-bold text-deep">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal/10 text-teal">{icon}</span>
        {title}
      </h2>
      {href && (
        <Link href={href} className="rounded-full p-2 text-slate transition hover:bg-mist hover:text-deep" aria-label={`Open ${title.toLowerCase()}`}>
          <ArrowRight className="h-4.5 w-4.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
