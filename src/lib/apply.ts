import "server-only";
import { countryInfo, getUniversity, isCountry } from "@/lib/catalogue";
import { isIntake } from "@/lib/intakes";

/** The university a student picked (from the catalogue, or typed in), read from a form. */
export type UniversityChoice = {
  country: string;
  countryName: string;
  university: string;
  universityRef: string | null;
  course: string;
  intake: string;
};

const one = (form: FormData, key: string, max: number) =>
  String(form.get(key) ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

export async function readUniversityChoice(form: FormData): Promise<{ ok: true; value: UniversityChoice } | { ok: false; error: string; field: string }> {
  const country = one(form, "country", 40);
  if (!isCountry(country)) return { ok: false, error: "Please choose a country.", field: "country" };
  const ref = one(form, "university_ref", 40);
  const typed = one(form, "university", 160);
  const course = one(form, "course", 200);
  const intake = one(form, "intake", 40);

  let university = "";
  let universityRef: string | null = null;
  if (ref) {
    // The name always comes from the catalogue, never from the form
    const u = await getUniversity(ref);
    if (!u || u.country !== country) return { ok: false, error: "Please choose the university again.", field: "university" };
    university = u.name;
    universityRef = u.id;
  } else {
    if (typed.length < 2) return { ok: false, error: "Choose a university from the list, or type its name.", field: "university" };
    university = typed;
  }
  if (!isIntake(intake)) return { ok: false, error: "Please choose an intake.", field: "intake" };
  return { ok: true, value: { country, countryName: countryInfo(country)!.name, university, universityRef, course, intake } };
}

export const describeChoice = (c: UniversityChoice) =>
  [c.university, c.course, c.countryName, c.intake && `${c.intake} intake`].filter(Boolean).join(" · ");
