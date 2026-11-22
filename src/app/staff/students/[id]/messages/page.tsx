import type { Metadata } from "next";
import { Card } from "@/components/portal/ui";
import { Thread } from "@/components/portal/Thread";
import { getStudent } from "@/lib/staff/student";

export const metadata: Metadata = { title: "Messages" };

export default async function StaffMessages({ params }: PageProps<"/staff/students/[id]/messages">) {
  const { id } = await params;
  const { s } = await getStudent(id);
  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-4 text-sm leading-relaxed text-slate">
        The general conversation with the student and linked parents. They get an email when you write, and reply in the portal. Messages about a service request are on that request.
      </p>
      <Card>
        <Thread p={s} studentId={id} empty="No messages yet. Say hello and introduce yourself." placeholder="Write to the student and parents…" />
      </Card>
    </div>
  );
}
