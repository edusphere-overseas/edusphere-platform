"use server";

import { refresh } from "next/cache";
import { getActor } from "@/lib/portal/actor";
import { DESTINATIONS, FUNDING, LEVELS } from "@/lib/portal/journey";

export type ProfileState = { error?: string; saved?: number } | null;

const str = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").trim().slice(0, max);

export async function updateAccount(_: ProfileState, form: FormData): Promise<ProfileState> {
  const actor = await getActor();
  if (!actor) return { error: "Please sign in again." };
  const full_name = str(form, "full_name", 120);
  if (!full_name) return { error: "Please enter your full name." };
  const phone = str(form, "phone", 30) || null;
  const { error } = await actor.supabase.from("profiles").update({ full_name, phone }).eq("id", actor.uid);
  if (error) return { error: "Couldn't save. Please try again." };
  refresh();
  return { saved: Date.now() };
}

type Row = Record<string, string>;

/** Rows from the repeatable sections (education, tests), cleaned and limited. */
function rows(raw: FormDataEntryValue | null, keys: string[], max = 8): Row[] {
  try {
    const parsed = JSON.parse(String(raw ?? "[]"));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .slice(0, max)
      .map((r) => Object.fromEntries(keys.map((k) => [k, String(r?.[k] ?? "").trim().slice(0, 120)])))
      .filter((r) => Object.values(r).some(Boolean));
  } catch {
    return [];
  }
}

export async function updateStudentDetails(_: ProfileState, form: FormData): Promise<ProfileState> {
  const actor = await getActor();
  if (!actor || actor.profile.role !== "student") return { error: "Only the student can edit these details." };
  const countries = form.getAll("countries").map(String).filter((c) => DESTINATIONS.some((d) => d.id === c));
  const level = str(form, "level", 60);
  const funding = str(form, "funding", 60);
  const update = {
    city: str(form, "city", 80) || null,
    preferred_countries: countries,
    preferred_level: LEVELS.includes(level) ? level : null,
    preferred_course: str(form, "course", 160) || null,
    preferred_intake: str(form, "intake", 40) || null,
    work_experience: str(form, "work", 2000) || null,
    funding: FUNDING.includes(funding) ? funding : null,
    academic_history: rows(form.get("education"), ["level", "institution", "board", "year", "score"]),
    test_scores: rows(form.get("tests"), ["test", "score", "date"]),
  };
  const dob = str(form, "date_of_birth", 10);
  const { error } = await actor.supabase
    .from("student_profiles")
    .update(/^\d{4}-\d{2}-\d{2}$/.test(dob) ? { ...update, date_of_birth: dob } : update)
    .eq("user_id", actor.uid);
  if (error) return { error: error.code === "42501" ? error.message : "Couldn't save. Please try again." };
  refresh();
  return { saved: Date.now() };
}
