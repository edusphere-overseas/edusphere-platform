import type { Metadata } from "next";
import { NoStudent } from "@/components/portal/NoStudent";
import { Thread } from "@/components/portal/Thread";
import { Card, PageTitle } from "@/components/portal/ui";
import { getPortal } from "@/lib/portal/context";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const p = await getPortal();
  if (!p.student) return <NoStudent />;
  const who = p.student.counsellor?.name ?? "our team";
  return (
    <>
      <PageTitle
        title="Messages"
        intro={`Write to ${who}. ${p.role === "parent" ? "Your child and their counsellor see this conversation." : "Linked parents can see and join this conversation."} Messages about a service request are on that request's page.`}
      />
      <Card className="mx-auto max-w-3xl">
        <Thread p={p} studentId={p.student.id} empty="No messages yet. Ask anything about your application." />
      </Card>
    </>
  );
}
