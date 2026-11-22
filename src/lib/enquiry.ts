"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { portalConfigured } from "@/lib/supabase/env";
import { sendEmail, staffInbox } from "@/lib/portal/email";

/**
 * Website enquiry form. Saves the enquiry to the Supabase enquiry inbox (table "leads",
 * source "website_enquiry") and emails the team. Works on any host.
 * Until Supabase is connected it answers "unavailable" and the form offers WhatsApp.
 */

export type EnquiryResult = { ok: true } | { ok: false; reason: "invalid" | "unavailable" | "busy" };

const text = (form: FormData, key: string, max: number) =>
  String(form.get(key) ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

export async function submitEnquiry(form: FormData): Promise<EnquiryResult> {
  // Bots fill the hidden field; pretend it worked and keep nothing.
  if (text(form, "bot-field", 200)) return { ok: true };

  const name = text(form, "name", 120);
  const phone = text(form, "phone", 30);
  const email = text(form, "email", 254).toLowerCase();
  const message = String(form.get("message") ?? "").trim().slice(0, 3500);
  const page = text(form, "page", 200);
  const details = ["destination", "level", "intake", "office"].map((k) => text(form, k, 80)).filter(Boolean);

  if (
    !name ||
    !/^[0-9+()\-\s]{7,30}$/.test(phone) ||
    (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
    form.get("consent") !== "yes"
  ) {
    return { ok: false, reason: "invalid" };
  }

  if (!portalConfigured || !(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    return { ok: false, reason: "unavailable" };
  }

  try {
    const db = createAdminClient();

    // Flood guard: at most 3 enquiries from the same phone number in 10 minutes.
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await db
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("source", "website_enquiry")
      .eq("phone", phone)
      .gte("created_at", since);
    if ((count ?? 0) >= 3) return { ok: false, reason: "busy" };

    const interest = details.join(" · ").slice(0, 200) || null;
    const { error } = await db.from("leads").insert({
      source: "website_enquiry",
      name,
      phone,
      email: email || null,
      interest,
      message: [message, page && `Sent from ${page}`].filter(Boolean).join("\n\n") || null,
    });
    if (error) {
      console.error("[enquiry] could not save:", error.message);
      return { ok: false, reason: "unavailable" };
    }

    await sendEmail({
      to: staffInbox(),
      replyTo: email || undefined,
      subject: `New website enquiry: ${name}`,
      heading: "New website enquiry",
      lines: [
        `${name} · ${phone}${email ? ` · ${email}` : ""}`,
        interest ?? "",
        message ? (message.length > 600 ? message.slice(0, 597) + "…" : message) : "",
        "It is saved in the enquiry inbox (Supabase → Table Editor → leads).",
      ].filter(Boolean),
    });
    return { ok: true };
  } catch (error) {
    console.error("[enquiry] failed:", error instanceof Error ? error.message : error);
    return { ok: false, reason: "unavailable" };
  }
}
