"use server";

import { refresh } from "next/cache";
import { familyContacts, getActor } from "@/lib/portal/actor";
import { emails, staffInbox } from "@/lib/portal/email";

export type MessageState = { error?: string; sent?: number } | null;

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function sendMessage(_: MessageState, form: FormData): Promise<MessageState> {
  const actor = await getActor();
  if (!actor) return { error: "Please sign in again." };
  const studentId = String(form.get("student") ?? "");
  const requestId = String(form.get("request") ?? "") || null;
  const body = String(form.get("body") ?? "").trim();
  if (!uuid.test(studentId) || (requestId && !uuid.test(requestId))) return { error: "Something went wrong. Please refresh the page." };
  if (!body) return { error: "Please write a message." };
  if (body.length > 4000) return { error: "Please keep messages under 4,000 characters." };

  const { error } = await actor.supabase.from("messages").insert({ student_id: studentId, service_request_id: requestId, sender_id: actor.uid, body });
  if (error) return { error: "Your message couldn't be sent. Please try again." };

  const contacts = await familyContacts(studentId);
  if (actor.staff) {
    // Tell the student and linked parents; they reply in the portal
    const family = contacts.family.filter((e) => e !== actor.profile.email);
    const first = actor.name.split(/[\s@]/)[0] || "Your counsellor";
    if (family.length) await emails.newMessageForFamily(family, first, body, requestId ? `/portal/services/${requestId}` : "/portal/messages");
  } else {
    const to = contacts.counsellorEmail ?? staffInbox();
    const path = `/staff/students/${studentId}/${requestId ? `services/${requestId}` : "messages"}`;
    if (to) await emails.newMessageForStaff(to, contacts.studentName, `${actor.name}: ${body}`, path);
  }
  refresh();
  return { sent: Date.now() };
}
