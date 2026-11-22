"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { familyContacts, getActor } from "@/lib/portal/actor";
import { emails, staffInbox } from "@/lib/portal/email";
import { serviceByKey, validateServiceForm } from "@/lib/portal/services";
import { getSiteContent } from "@/lib/content";

export type ServiceFormState = { error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> } | null;

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function requestService(_: ServiceFormState, form: FormData): Promise<ServiceFormState> {
  const actor = await getActor();
  if (!actor) return { error: "Please sign in again." };
  const def = serviceByKey(String(form.get("service") ?? ""));
  const studentId = String(form.get("student") ?? "");
  if (!def || !uuid.test(studentId)) return { error: "Something went wrong. Please refresh the page." };

  const { portalServices } = await getSiteContent();
  const setting = portalServices[def.settingsKey];
  if (!setting.show) return { error: "This service isn't available in the portal right now. Please message us instead." };

  const input: Record<string, string> = {};
  for (const f of def.fields) input[f.name] = String(form.get(f.name) ?? "");
  const { values, errors, ok } = validateServiceForm(def, input);
  if (!ok) return { error: "Please check the highlighted fields.", fieldErrors: errors, values: input };
  if (setting.price && form.get("accept_price") !== "on") {
    return { error: "Please confirm you've seen the price.", values: input };
  }

  const { data, error } = await actor.supabase
    .from("service_requests")
    .insert({ student_id: studentId, service: def.key, details: values, price: setting.price || null })
    .select("id")
    .single();
  if (error || !data) {
    return { error: error?.code === "42501" ? "You can't request services for this student." : "Something went wrong. Please try again.", values: input };
  }

  const contacts = await familyContacts(studentId);
  await emails.serviceRequested(contacts.family, def.title, contacts.studentName);
  const staff = contacts.counsellorEmail ?? staffInbox();
  if (staff) await emails.staffServiceRequested(staff, def.title, contacts.studentName, def.describe(values));

  redirect(`/portal/services/${data.id}?new=1`);
}

export async function cancelServiceRequest(form: FormData) {
  const actor = await getActor();
  const id = String(form.get("id") ?? "");
  if (!actor || !uuid.test(id)) return;
  await actor.supabase.from("service_requests").update({ status: "cancelled" }).eq("id", id).eq("status", "requested");
  refresh();
}
