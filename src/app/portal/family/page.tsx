import type { Metadata } from "next";
import { LinkChildForm, LinkCode } from "@/components/portal/Family";
import { LinkedPeople, PendingRequests } from "@/components/portal/LinkLists";
import { Card, Notice, PageTitle } from "@/components/portal/ui";
import { getPortal } from "@/lib/portal/context";
import { siteOrigin } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Family" };

export default async function FamilyPage() {
  const p = await getPortal();

  if (p.role === "parent") {
    return (
      <>
        <PageTitle title="My children" intro="Link to your child's account to follow their documents, applications and services. They approve each request." />
        <div className="grid items-start gap-5 lg:grid-cols-[1.1fr_1fr]">
          <Card>
            <h2 className="text-lg font-bold text-deep">Link to your child</h2>
            <div className="mt-4">
              <LinkChildForm />
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-bold text-deep">Your links</h2>
            <div className="mt-4">
              {p.links.length ? <LinkedPeople links={p.links} viewer="parent" /> : <p className="text-sm text-slate">No links yet.</p>}
            </div>
          </Card>
        </div>
      </>
    );
  }

  const code = p.student?.details?.link_code ?? "";
  const approved = p.links.filter((l) => l.status === "approved");
  return (
    <>
      <PageTitle title="Family" intro="Parents and guardians can follow your application once you approve them. You decide who sees your records." />
      <div className="grid gap-5">
        <PendingRequests links={p.links} />
        {p.uploadBlock === "under18" && (
          <Notice tone="warn" title="A parent needs to link first">
            Because you&apos;re under 18, a parent or guardian must link to your account, and you approve it, before documents are uploaded. Send them your code below.
          </Notice>
        )}
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <Card>
            <h2 className="text-lg font-bold text-deep">Your link code</h2>
            <p className="mt-1 mb-5 text-sm leading-relaxed text-slate">
              Your parent creates a parent account and enters this code. You&apos;ll still be asked to approve them.
            </p>
            <LinkCode code={code} signUpUrl={`${siteOrigin()}/sign-up?role=parent`} />
          </Card>
          <Card>
            <h2 className="text-lg font-bold text-deep">Linked parents</h2>
            <div className="mt-4">
              {approved.length ? (
                <LinkedPeople links={p.links} viewer="student" />
              ) : (
                <p className="text-sm leading-relaxed text-slate">No one is linked yet. Parents you approve can see your documents, stages and requests, upload documents and message your counsellor.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
