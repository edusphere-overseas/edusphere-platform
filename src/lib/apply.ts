import "server-only";
import { countryInfo, getUniversity, isCountry, levelLabel, LEVELS } from "@/lib/catalogue";
import {
  ENGLISH_TESTS,
  englishLabel,
  PORTAL_LEVEL,
  PORTAL_QUALIFICATION,
  PORTAL_TEST,
  QUALIFICATIONS,
  qualificationLabel,
  SCORE_SCALES,
} from "@/lib/eligibility";
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

/** The study level and education details from the eligibility and apply forms (all optional here). */
export type Education = {
  level: string;
  qualification: string;
  score: number;
  scale: string;
  passingYear: number;
  test: string;
  testScore: number;
  backlogs: number;
  city: string;
};

const num = (form: FormData, key: string) => {
  const n = Number.parseFloat(one(form, key, 12));
  return Number.isFinite(n) ? n : 0;
};

export function readEducation(form: FormData, thisYear: number): { ok: true; value: Education } | { ok: false; error: string; field: string } {
  const level = one(form, "level", 20);
  const qualification = one(form, "qualification", 20);
  const scale = one(form, "scale", 10) || "percent";
  const test = one(form, "test", 10) || "none";
  const value: Education = {
    level: LEVELS.some((l) => l.id === level) ? level : "",
    qualification: QUALIFICATIONS.some((q) => q.id === qualification) ? qualification : "",
    score: num(form, "score"),
    scale: SCORE_SCALES.some((s) => s.id === scale) ? scale : "percent",
    passingYear: Math.round(num(form, "passing_year")),
    test: ENGLISH_TESTS.some((t) => t.id === test) ? test : "none",
    testScore: num(form, "test_score"),
    backlogs: Math.max(0, Math.min(99, Math.round(num(form, "backlogs")))),
    city: one(form, "city", 80),
  };
  const max = SCORE_SCALES.find((s) => s.id === value.scale)!.max;
  if (value.score < 0 || value.score > max) return { ok: false, error: `Please enter your marks (up to ${max}).`, field: "score" };
  const testMax = ENGLISH_TESTS.find((t) => t.id === value.test)!.max;
  if (value.test !== "none" && (value.testScore < 0 || value.testScore > testMax)) return { ok: false, error: `Please check your ${englishLabel(value.test)} score.`, field: "test_score" };
  if (value.passingYear && (value.passingYear < 1970 || value.passingYear > thisYear + 2)) return { ok: false, error: "Please check the year you finished.", field: "passing_year" };
  return { ok: true, value };
}

/** Lines for the enquiry and the staff email */
export function describeEducation(e: Education) {
  const scale = SCORE_SCALES.find((s) => s.id === e.scale);
  return [
    e.level && `Wants to study: ${levelLabel(e.level)}`,
    e.qualification && `Highest qualification: ${qualificationLabel(e.qualification)}${e.score ? `, ${e.score}${e.scale === "percent" ? "%" : ` (${scale?.label})`}` : ""}${e.passingYear ? `, finished ${e.passingYear}` : ""}`,
    e.test !== "none" && e.testScore ? `English: ${englishLabel(e.test)} ${e.testScore}` : e.qualification ? "English: no test yet" : "",
    e.backlogs ? `Backlogs: ${e.backlogs}` : "",
    e.city && `Lives in: ${e.city}`,
  ].filter(Boolean) as string[];
}

/** The same details in the student portal's own format */
export function educationForProfile(e: Education) {
  const out: Record<string, unknown> = {};
  if (e.level) out.preferred_level = PORTAL_LEVEL[e.level] ?? null;
  if (e.city) out.city = e.city;
  if (e.qualification)
    out.academic_history = [
      {
        level: PORTAL_QUALIFICATION[e.qualification] ?? "Other",
        institution: "",
        board: "",
        year: e.passingYear ? String(e.passingYear) : "",
        score: e.score ? (e.scale === "percent" ? `${e.score}%` : `${e.score} ${e.scale === "cgpa10" ? "CGPA (out of 10)" : "GPA (out of 4)"}`) : "",
      },
    ];
  if (e.test !== "none" && e.testScore) out.test_scores = [{ test: PORTAL_TEST[e.test] ?? "Other", score: String(e.testScore), date: "" }];
  return out;
}
