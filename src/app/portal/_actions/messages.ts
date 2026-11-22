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

  if (!actor.staff) {
    const contacts = await familyContacts(studentId);
    const to = contacts.counsellorEmail ?? staffInbox();
    if (to) await emails.newMessageForStaff(to, contacts.studentName, `${actor.name}: ${body}`);
  }
  refresh();
  return { sent: Date.now() };
}
