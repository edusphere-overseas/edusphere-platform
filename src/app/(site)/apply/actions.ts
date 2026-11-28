"use server";

import { randomBytes } from "node:crypto";
import { describeChoice, describeEducation, educationForProfile, readEducation, readUniversityChoice } from "@/lib/apply";
import { CONSENT_VERSION } from "@/lib/portal/consent";
import { sendEmail, staffInbox } from "@/lib/portal/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { portalConfigured, siteOrigin } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/**
 * "Apply" from the course finder, the university pages and the eligibility check, for visitors
 * without an account. One form:
 *  1. creates their portal account (they verify their email, then choose a password),
 *  2. adds the university to their application tracker (stage "shortlist") and saves their
 *     education and English test to their profile,
 *  3. puts the request in the enquiry inbox (source "course_finder") and emails the team.
 */

export type ApplyState = {
  error?: string;
  field?: string;
  values?: Record<string, string>;
  done?: { email: string; university: string };
} | null;

const str = (f: FormData, k: string, max = 200) =>
  String(f.get(k) ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

function friendly(message: string) {
  if (/captcha/i.test(message)) return "The spam check didn't finish. Please wait a moment and try again.";
  if (/rate limit|too many/i.test(message)) return "Too many attempts. Please wait a few minutes and try again.";
  return "Something went wrong. Please try again, or message us on WhatsApp.";
}

export async function applyForUniversity(_: ApplyState, form: FormData): Promise<ApplyState> {
  const values = {
    country: str(form, "country", 40),
    university_ref: str(form, "university_ref", 40),
    university: str(form, "university", 160),
    course: str(form, "course"),
    intake: str(form, "intake", 40),
    full_name: str(form, "full_name", 120),
    date_of_birth: str(form, "date_of_birth", 10),
    email: str(form, "email", 254).toLowerCase(),
    phone: str(form, "phone", 30),
  };
  if (str(form, "bot-field")) return { done: { email: values.email, university: values.university } };

  const choice = await readUniversityChoice(form);
  if (!choice.ok) return { error: choice.error, field: choice.field, values };
  const edu = readEducation(form, new Date().getUTCFullYear());
  if (!edu.ok) return { error: edu.error, field: edu.field, values };
  const education = edu.value;
  const checked = str(form, "eligibility", 160);
  if (!values.full_name) return { error: "Please enter your full name.", field: "full_name", values };
  const dob = new Date(values.date_of_birth + "T00:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date_of_birth) || isNaN(+dob) || dob > new Date() || dob < new Date("1940-01-02")) {
    return { error: "Please enter your date of birth.", field: "date_of_birth", values };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) return { error: "Please enter a valid email address.", field: "email", values };
  if (!/^[0-9+()\-\s]{7,30}$/.test(values.phone)) return { error: "Please enter your mobile number.", field: "phone", values };
  if (form.get("consent") !== "on") return { error: "Please tick the consent box to send your application.", field: "consent", values };
  if (!portalConfigured || !(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) return { error: "Applications are switched off right now. Please message us on WhatsApp.", values };

  const c = choice.value;
  const admin = createAdminClient();

  // Flood guard: at most 3 requests from the same email or phone in 10 minutes
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const recent = (column: "email" | "phone", value: string) =>
    admin.from("leads").select("id", { count: "exact", head: true }).eq("source", "course_finder").eq(column, value).gte("created_at", since);
  const [byEmail, byPhone] = await Promise.all([recent("email", values.email), recent("phone", values.phone)]);
  if (Math.max(byEmail.count ?? 0, byPhone.count ?? 0) >= 3) return { error: "We've already received your request. Please check your inbox, or wait a few minutes.", values };

  // The account gets a random password: the student chooses their own after verifying their email
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password: `${randomBytes(24).toString("base64url")}a1`,
    options: {
      emailRedirectTo: `${siteOrigin()}/auth/confirm`,
      captchaToken: str(form, "cf-turnstile-response", 4096) || undefined,
      data: {
        role: "student",
        full_name: values.full_name,
        phone: values.phone,
        date_of_birth: values.date_of_birth,
        consent_version: CONSENT_VERSION,
        needs_password: true,
      },
    },
  });
  if (error && error.code !== "user_already_exists") {
    console.error("[apply] sign-up failed:", error.code, error.message);
    return { error: friendly(error.message), values };
  }
  // An existing, verified account comes back without identities (Supabase hides that it exists)
  const user = data?.user;
  const isNew = !!user && (user.identities?.length ?? 0) > 0;

  const interest = `${c.university} (${c.countryName})`.slice(0, 200);
  const details = [
    c.course && `Course: ${c.course}`,
    c.intake && `Intake: ${c.intake}`,
    `Date of birth: ${values.date_of_birth}`,
    ...describeEducation(education),
    checked && `Eligibility check: ${checked}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    if (isNew && user) {
      const [app] = await Promise.all([
        admin.from("applications").insert({
          student_id: user.id,
          university: c.university,
          university_ref: c.universityRef,
          country: c.country,
          course: c.course,
          intake: c.intake || null,
          stage: "shortlist",
          created_by: user.id,
        }),
        admin
          .from("student_profiles")
          .update({ preferred_countries: [c.country], preferred_course: c.course || null, preferred_intake: c.intake || null, ...educationForProfile(education) })
          .eq("user_id", user.id),
      ]);
      if (app.error) console.error("[apply] could not add the application:", app.error.message);
      const lead = { source: "course_finder", name: values.full_name, email: values.email, phone: values.phone, interest };
      const message = `${details}\n\nApplied through the website. A portal account was created (email not verified yet) and the university is on their application tracker.`;
      const { error: leadError } = await admin.from("leads").insert({ ...lead, profile_id: user.id, message });
      // Applied before without verifying: their account already has an enquiry
      if (leadError?.code === "23505") await admin.from("leads").insert({ ...lead, message });
      else if (leadError) console.error("[apply] could not save the enquiry:", leadError.message);
    } else {
      const { data: existing } = await admin.from("profiles").select("id, role").eq("email", values.email).maybeSingle();
      await admin.from("leads").insert({
        source: "course_finder",
        name: values.full_name,
        email: values.email,
        phone: values.phone,
        interest,
        message: `${details}\n\nApplied through the website. This email already has a portal account${
          existing ? ` (${existing.role ?? "no role yet"})` : ""
        }: add the university to their application tracker if the request is theirs.`,
      });
    }

    const staff = staffInbox();
    if (staff) {
      await sendEmail({
        to: staff,
        replyTo: values.email,
        subject: `New application request: ${values.full_name} for ${c.university}`,
        heading: "New application request from the website",
        lines: [
          `${values.full_name} · ${values.phone} · ${values.email}`,
          describeChoice(c),
          ...describeEducation(education),
          checked ? `Eligibility check: ${checked}` : "",
          isNew ? "Their portal account has been created and the university is on their application tracker." : "This email already had a portal account.",
          "It's in the enquiry inbox of the staff dashboard.",
        ].filter(Boolean),
        button: { label: "Open enquiries", path: "/staff/enquiries" },
      });
    }
  } catch (e) {
    console.error("[apply] failed:", e instanceof Error ? e.message : e);
    return { error: friendly(""), values };
  }

  return { done: { email: values.email, university: c.university } };
}
