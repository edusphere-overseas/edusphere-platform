"use server";

import { describeEducation, readEducation } from "@/lib/apply";
import { countryInfo, getUniversity, isCountry, levelLabel, listUniversities, locationLabel, normaliseFilters } from "@/lib/catalogue";
import { checkEligibilityRules, countryShort, requirementText, type EligibilityResult } from "@/lib/eligibility";
import { isIntake } from "@/lib/intakes";
import { sendEmail, staffInbox } from "@/lib/portal/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { portalConfigured } from "@/lib/supabase/env";

/**
 * The eligibility check: an indicative result from typical entry requirements, saved to the
 * enquiry inbox (source "eligibility_check") so a counsellor can follow up. The result screen
 * then offers "Apply", which creates the portal account and the application (see apply/actions).
 */

export type Suggestion = { id: string; name: string; place: string; feeInr: number; type: string };
export type EligibilityState = {
  error?: string;
  field?: string;
  result?: EligibilityResult & {
    requirements: { academic: string; english: string; notes: string[] } | null;
    university: { id: string; name: string } | null;
    typed: string;
    suggestions: Suggestion[];
  };
} | null;

const str = (f: FormData, k: string, max = 200) =>
  String(f.get(k) ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

export async function checkEligibility(_: EligibilityState, form: FormData): Promise<EligibilityState> {
  const country = str(form, "country", 40);
  const name = str(form, "full_name", 120);
  const email = str(form, "email", 254).toLowerCase();
  const phone = str(form, "phone", 30);
  const ref = str(form, "university_ref", 40);
  const typed = str(form, "university", 160);
  const course = str(form, "course");
  const intake = str(form, "intake", 40);
  const thisYear = new Date().getUTCFullYear();

  if (!isCountry(country)) return { error: "Please choose a country.", field: "country" };
  const edu = readEducation(form, thisYear);
  if (!edu.ok) return { error: edu.error, field: edu.field };
  const e = edu.value;
  if (!e.level) return { error: "Please choose what you'd like to study.", field: "level" };
  if (!e.qualification) return { error: "Please choose your highest qualification.", field: "qualification" };
  if (!e.score) return { error: "Please enter your marks.", field: "score" };
  if (!isIntake(intake)) return { error: "Please choose an intake.", field: "intake" };
  if (!name) return { error: "Please enter your full name.", field: "full_name" };
  if (!/^[0-9+()\-\s]{7,30}$/.test(phone)) return { error: "Please enter your mobile number.", field: "phone" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: "Please enter a valid email address.", field: "email" };
  if (form.get("consent") !== "on") return { error: "Please tick the consent box to see your result.", field: "consent" };

  const uni = ref ? await getUniversity(ref) : null;
  const universityName = uni && uni.country === country ? uni.name : typed;
  const rules = checkEligibilityRules(
    { country, level: e.level, qualification: e.qualification, score: e.score, scale: e.scale, passingYear: e.passingYear, test: e.test, testScore: e.testScore, backlogs: e.backlogs },
    thisYear,
  );
  if (!rules) return { error: "Please choose what you'd like to study.", field: "level" };

  // Universities that fit: the biggest ones in the country teaching this level (and nearby fees)
  const filters = await normaliseFilters({ q: "", country, levels: [rules.suggestLevel ?? e.level], subjects: [], locations: [], fee: "", types: [] });
  const list = await listUniversities(filters, { limit: 5 });
  const suggestions = list.items
    .filter((h) => h.u.id !== uni?.id)
    .slice(0, 4)
    .map((h) => ({
      id: h.u.id,
      name: h.u.name,
      place: [h.u.city, locationLabel(h.u.country, h.u.region)].filter(Boolean).join(", "),
      feeInr: h.feeInr,
      type: h.u.type,
    }));

  const result = {
    ...rules,
    requirements: requirementText(country, e.level),
    university: uni && uni.country === country ? { id: uni.id, name: uni.name } : null,
    typed: uni ? "" : typed,
    suggestions,
  };

  if (str(form, "bot-field")) return { result };
  if (!portalConfigured || !(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) return { result };

  try {
    const admin = createAdminClient();
    // Flood guard: at most 5 checks from the same email or phone in 10 minutes (the result still shows)
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const recent = (column: "email" | "phone", value: string) =>
      admin.from("leads").select("id", { count: "exact", head: true }).eq("source", "eligibility_check").eq(column, value).gte("created_at", since);
    const [byEmail, byPhone] = await Promise.all([recent("email", email), recent("phone", phone)]);
    if (Math.max(byEmail.count ?? 0, byPhone.count ?? 0) >= 5) return { result };

    const interest = [levelLabel(e.level), countryInfo(country)?.name, universityName].filter(Boolean).join(" · ").slice(0, 200);
    const lines = [
      `Result: ${rules.headline}`,
      universityName && `University: ${universityName}`,
      course && `Course: ${course}`,
      intake && `Intake: ${intake}`,
      ...describeEducation(e),
    ].filter(Boolean) as string[];
    const { error } = await admin.from("leads").insert({
      source: "eligibility_check",
      name,
      email,
      phone,
      interest,
      message: `${lines.join("\n")}\n\nFrom the eligibility check on the website. They haven't applied yet.`,
    });
    if (error) console.error("[eligibility] could not save:", error.message);
    else {
      const staff = staffInbox();
      if (staff)
        await sendEmail({
          to: staff,
          replyTo: email,
          subject: `Eligibility check: ${name} for ${levelLabel(e.level)} in ${countryShort(country)}`,
          heading: "New eligibility check",
          lines: [`${name} · ${phone} · ${email}`, ...lines, "It's in the enquiry inbox of the staff dashboard."],
          button: { label: "Open enquiries", path: "/staff/enquiries" },
        });
    }
  } catch (err) {
    console.error("[eligibility] failed:", err instanceof Error ? err.message : err);
  }
  return { result };
}
