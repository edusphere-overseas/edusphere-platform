/**
 * Indicative eligibility: typical entry requirements for Indian students, by country and
 * study level, and a quick check of a student's marks and English score against them.
 * These are typical ranges, not any one university's rules: the counsellor confirms
 * with each university. Shared by the eligibility check, the apply form and university pages.
 */

export const QUALIFICATIONS = [
  { id: "12th", label: "12th (PUC / higher secondary)" },
  { id: "diploma", label: "Diploma" },
  { id: "bachelor3", label: "Bachelor's (3 years)" },
  { id: "bachelor4", label: "Bachelor's (4 years, e.g. BE / BTech)" },
  { id: "master", label: "Master's" },
] as const;
export type QualificationId = (typeof QUALIFICATIONS)[number]["id"];
export const qualificationLabel = (id: string) => QUALIFICATIONS.find((q) => q.id === id)?.label ?? id;

export const SCORE_SCALES = [
  { id: "percent", label: "Percentage", max: 100, step: "0.1" },
  { id: "cgpa10", label: "CGPA out of 10", max: 10, step: "0.01" },
  { id: "cgpa4", label: "GPA out of 4", max: 4, step: "0.01" },
] as const;

export const ENGLISH_TESTS = [
  { id: "ielts", label: "IELTS", max: 9, step: "0.5" },
  { id: "pte", label: "PTE Academic", max: 90, step: "1" },
  { id: "toefl", label: "TOEFL iBT", max: 120, step: "1" },
  { id: "duolingo", label: "Duolingo English Test", max: 160, step: "5" },
  { id: "none", label: "Not taken yet", max: 0, step: "1" },
] as const;
export const englishLabel = (id: string) => ENGLISH_TESTS.find((t) => t.id === id)?.label ?? id;

/** Portal names for the same things (student_profiles.academic_history and test_scores) */
export const PORTAL_QUALIFICATION: Record<string, string> = {
  "12th": "12th",
  diploma: "Diploma",
  bachelor3: "Bachelor's",
  bachelor4: "Bachelor's",
  master: "Master's",
};
export const PORTAL_TEST: Record<string, string> = { ielts: "IELTS", pte: "PTE", toefl: "TOEFL", duolingo: "Duolingo" };
export const PORTAL_LEVEL: Record<string, string> = {
  foundation: "Foundation or diploma",
  diploma: "Foundation or diploma",
  bachelor: "Undergraduate",
  pgcert: "Postgraduate",
  master: "Postgraduate",
  doctorate: "PhD",
};

type Rule = {
  /** usual minimum, as a percentage */
  min: number;
  /** what the better-known universities usually ask for */
  competitive: number;
  /** IELTS overall */
  ielts: number;
  /** lowest band, IELTS */
  band: number;
  needs: QualificationId[];
  notes?: string[];
};

const UG: QualificationId[] = ["12th", "diploma", "bachelor3", "bachelor4", "master"];
const PG: QualificationId[] = ["bachelor3", "bachelor4", "master"];

/** Typical requirements. Levels: foundation, diploma, bachelor, pgcert, master, doctorate. */
const RULES: Record<string, Record<string, Rule>> = {
  uk: {
    foundation: { min: 50, competitive: 60, ielts: 5.0, band: 4.5, needs: UG },
    diploma: { min: 50, competitive: 60, ielts: 5.5, band: 5.0, needs: UG },
    bachelor: { min: 60, competitive: 80, ielts: 6.0, band: 5.5, needs: UG },
    pgcert: { min: 50, competitive: 60, ielts: 6.0, band: 5.5, needs: PG },
    master: { min: 55, competitive: 65, ielts: 6.5, band: 6.0, needs: PG, notes: ["Many UK universities accept a 3-year bachelor's degree for a master's."] },
    doctorate: { min: 60, competitive: 70, ielts: 6.5, band: 6.0, needs: ["master", "bachelor4"], notes: ["A PhD also needs a research proposal and a supervisor."] },
  },
  australia: {
    foundation: { min: 50, competitive: 60, ielts: 5.5, band: 5.0, needs: UG },
    diploma: { min: 50, competitive: 60, ielts: 5.5, band: 5.0, needs: UG },
    bachelor: { min: 60, competitive: 75, ielts: 6.0, band: 6.0, needs: UG },
    pgcert: { min: 50, competitive: 60, ielts: 6.5, band: 6.0, needs: PG },
    master: { min: 55, competitive: 65, ielts: 6.5, band: 6.0, needs: PG },
    doctorate: { min: 65, competitive: 75, ielts: 6.5, band: 6.0, needs: ["master", "bachelor4"], notes: ["A PhD also needs a research proposal and a supervisor."] },
  },
  usa: {
    foundation: { min: 50, competitive: 60, ielts: 5.5, band: 5.0, needs: UG },
    diploma: { min: 50, competitive: 60, ielts: 6.0, band: 5.5, needs: UG, notes: ["In the USA this is usually an associate degree at a community college."] },
    bachelor: { min: 65, competitive: 85, ielts: 6.5, band: 6.0, needs: UG, notes: ["Some universities ask for the SAT or ACT; many are test-optional."] },
    pgcert: { min: 55, competitive: 65, ielts: 6.5, band: 6.0, needs: PG },
    master: {
      min: 60,
      competitive: 70,
      ielts: 6.5,
      band: 6.0,
      needs: PG,
      notes: ["Most US master's programmes expect 16 years of education (a 4-year bachelor's).", "Some programmes ask for the GRE or GMAT."],
    },
    doctorate: { min: 65, competitive: 75, ielts: 7.0, band: 6.5, needs: ["master", "bachelor4"], notes: ["Most PhD programmes ask for the GRE."] },
  },
  canada: {
    foundation: { min: 50, competitive: 60, ielts: 5.5, band: 5.0, needs: UG },
    diploma: { min: 55, competitive: 65, ielts: 6.0, band: 5.5, needs: UG, notes: ["Colleges in Canada offer diplomas that can lead to a post-graduation work permit."] },
    bachelor: { min: 65, competitive: 80, ielts: 6.5, band: 6.0, needs: UG },
    pgcert: { min: 50, competitive: 60, ielts: 6.5, band: 6.0, needs: PG, notes: ["Postgraduate certificates at colleges are a popular route after a bachelor's."] },
    master: { min: 65, competitive: 75, ielts: 6.5, band: 6.0, needs: PG, notes: ["Many Canadian universities expect a 4-year bachelor's for a master's."] },
    doctorate: { min: 70, competitive: 80, ielts: 7.0, band: 6.5, needs: ["master"] },
  },
  "new-zealand": {
    foundation: { min: 50, competitive: 60, ielts: 5.5, band: 5.0, needs: UG },
    diploma: { min: 50, competitive: 60, ielts: 5.5, band: 5.0, needs: UG },
    bachelor: { min: 60, competitive: 75, ielts: 6.0, band: 5.5, needs: UG },
    pgcert: { min: 55, competitive: 60, ielts: 6.5, band: 6.0, needs: PG },
    master: { min: 60, competitive: 65, ielts: 6.5, band: 6.0, needs: PG },
    doctorate: { min: 65, competitive: 75, ielts: 6.5, band: 6.0, needs: ["master", "bachelor4"] },
  },
  europe: {
    foundation: { min: 50, competitive: 60, ielts: 5.5, band: 5.0, needs: UG },
    diploma: { min: 55, competitive: 65, ielts: 6.0, band: 5.5, needs: UG },
    bachelor: {
      min: 65,
      competitive: 80,
      ielts: 6.0,
      band: 5.5,
      needs: UG,
      notes: ["Public universities in Germany usually ask for a foundation year (Studienkolleg) or a year of university in India after the 12th."],
    },
    pgcert: { min: 55, competitive: 65, ielts: 6.0, band: 5.5, needs: PG },
    master: { min: 60, competitive: 70, ielts: 6.5, band: 6.0, needs: PG, notes: ["Many European master's programmes are taught in English; some ask for the local language."] },
    doctorate: { min: 65, competitive: 75, ielts: 6.5, band: 6.0, needs: ["master"] },
  },
};

export function requirements(country: string, level: string) {
  return RULES[country]?.[level] ?? RULES.uk[level] ?? null;
}

/** "Bachelor's degree with 55 to 65% · IELTS 6.5 (no band below 6.0)" */
export function requirementText(country: string, level: string) {
  const r = requirements(country, level);
  if (!r) return null;
  const needs = r.needs.includes("12th") ? "12th (PUC) or equivalent" : r.needs.length === 1 && r.needs[0] === "master" ? "a master's degree" : "a bachelor's degree";
  return {
    academic: `${needs[0].toUpperCase()}${needs.slice(1)}, usually ${r.min}% or more (${r.competitive}%+ for the better-known universities)`,
    english: `IELTS ${r.ielts.toFixed(1)} overall, no band below ${r.band.toFixed(1)} (or PTE ${toPte(r.ielts)}, TOEFL ${toToefl(r.ielts)}, Duolingo ${toDuolingo(r.ielts)})`,
    notes: r.notes ?? [],
  };
}

/** Rough conversions to a percentage (CBSE's ×9.5 for a 10-point CGPA) */
export function toPercent(score: number, scale: string) {
  if (!(score > 0)) return 0;
  if (scale === "cgpa10") return Math.min(100, score * 9.5);
  if (scale === "cgpa4") return Math.min(100, score * 25);
  return Math.min(100, score);
}

/** Approximate IELTS equivalents, from the test makers' published comparison tables */
const PTE = [[36, 5.0], [42, 5.5], [50, 6.0], [58, 6.5], [65, 7.0], [73, 7.5], [79, 8.0], [84, 8.5]] as const;
const TOEFL = [[35, 5.0], [46, 5.5], [60, 6.0], [79, 6.5], [94, 7.0], [102, 7.5], [110, 8.0], [115, 8.5]] as const;
const DUOLINGO = [[75, 5.0], [85, 5.5], [95, 6.0], [105, 6.5], [120, 7.0], [130, 7.5], [140, 8.0], [150, 8.5]] as const;
const fromTable = (score: number, table: readonly (readonly [number, number])[]) => {
  let out = 0;
  for (const [min, band] of table) if (score >= min) out = band;
  return out;
};
const toTable = (ielts: number, table: readonly (readonly [number, number])[]) => table.find(([, band]) => band >= ielts)?.[0] ?? table[table.length - 1][0];
const toPte = (ielts: number) => toTable(ielts, PTE);
const toToefl = (ielts: number) => toTable(ielts, TOEFL);
const toDuolingo = (ielts: number) => toTable(ielts, DUOLINGO);

export function toIelts(test: string, score: number) {
  if (!(score > 0)) return 0;
  if (test === "ielts") return Math.min(9, score);
  if (test === "pte") return fromTable(score, PTE);
  if (test === "toefl") return fromTable(score, TOEFL);
  if (test === "duolingo") return fromTable(score, DUOLINGO);
  return 0;
}

export type EligibilityInput = {
  country: string;
  level: string;
  qualification: string;
  score: number;
  scale: string;
  passingYear: number;
  test: string;
  testScore: number;
  backlogs: number;
};

export type Verdict = "strong" | "good" | "possible" | "pathway" | "not_yet";
export type EligibilityResult = {
  verdict: Verdict;
  headline: string;
  summary: string;
  points: { ok: boolean | null; text: string }[];
  /** a better-fitting level to suggest, when the chosen one doesn't fit */
  suggestLevel?: string;
};

const LEVEL_NAMES: Record<string, string> = {
  foundation: "a foundation programme",
  diploma: "a diploma",
  bachelor: "a bachelor's degree",
  pgcert: "a postgraduate diploma",
  master: "a master's degree",
  doctorate: "a PhD",
};

export function checkEligibilityRules(input: EligibilityInput, thisYear: number): EligibilityResult | null {
  const r = requirements(input.country, input.level);
  if (!r) return null;
  const pct = Math.round(toPercent(input.score, input.scale) * 10) / 10;
  const ielts = input.test === "none" ? 0 : toIelts(input.test, input.testScore);
  const points: EligibilityResult["points"] = [];
  const wants = LEVEL_NAMES[input.level] ?? "this level";

  // Wrong starting point: e.g. a master's straight after the 12th
  if (!r.needs.includes(input.qualification as QualificationId)) {
    const suggest = r.needs.includes("master") && !r.needs.includes("bachelor3") ? (input.qualification === "12th" || input.qualification === "diploma" ? "bachelor" : "master") : "bachelor";
    return {
      verdict: "not_yet",
      headline: `${wants[0].toUpperCase()}${wants.slice(1)} needs a different qualification`,
      summary: `For ${wants} you usually need ${r.needs.includes("12th") ? "the 12th" : r.needs.length === 1 ? "a master's degree" : "a bachelor's degree"} first. Your counsellor can suggest the right route.`,
      points: [{ ok: false, text: `Your highest qualification: ${qualificationLabel(input.qualification)}` }],
      suggestLevel: suggest !== input.level ? suggest : undefined,
    };
  }

  if (pct >= r.competitive) points.push({ ok: true, text: `Your ${pct}% meets what the better-known universities usually ask for (${r.competitive}%+).` });
  else if (pct >= r.min) points.push({ ok: true, text: `Your ${pct}% meets the usual minimum (${r.min}%). Some top universities ask for ${r.competitive}% or more.` });
  else if (pct >= r.min - 5) points.push({ ok: null, text: `Your ${pct}% is just under the usual minimum (${r.min}%). Some universities accept it, especially with good English scores or work experience.` });
  else points.push({ ok: false, text: `Your ${pct}% is under the usual minimum (${r.min}%).` });

  if (!ielts) points.push({ ok: null, text: `You'll need an English test: usually IELTS ${r.ielts.toFixed(1)} overall (or PTE ${toPte(r.ielts)}). We can help you prepare.` });
  else if (ielts >= r.ielts) points.push({ ok: true, text: `Your English score (about IELTS ${ielts.toFixed(1)}) meets the usual ${r.ielts.toFixed(1)}. Check that no band is below ${r.band.toFixed(1)}.` });
  else if (ielts >= r.ielts - 0.5) points.push({ ok: null, text: `Your English score (about IELTS ${ielts.toFixed(1)}) is just under the usual ${r.ielts.toFixed(1)}. Some universities accept it, or offer a short English course first.` });
  else points.push({ ok: false, text: `Your English score (about IELTS ${ielts.toFixed(1)}) is under the usual ${r.ielts.toFixed(1)}. A retake or a pre-sessional English course would help.` });

  const pg = ["pgcert", "master", "doctorate"].includes(input.level);
  if (input.backlogs > 0) {
    const limit = input.country === "uk" ? 10 : input.country === "usa" ? 8 : 5;
    points.push(
      input.backlogs <= limit
        ? { ok: true, text: `${input.backlogs} backlog${input.backlogs === 1 ? "" : "s"}: accepted by many universities in ${countryShort(input.country)}.` }
        : { ok: null, text: `${input.backlogs} backlogs: some universities limit backlogs, so we'll shortlist ones that accept your record.` },
    );
  }

  const gap = input.passingYear ? thisYear - input.passingYear : 0;
  if (gap > (pg ? 5 : 2)) points.push({ ok: null, text: `A ${gap}-year gap since you finished: work experience or other activity helps explain it.` });
  if (input.country === "usa" && input.level === "master" && input.qualification === "bachelor3")
    points.push({ ok: null, text: "A 3-year bachelor's: some US universities accept it, others ask for 16 years of education." });

  const academic = pct >= r.competitive ? 2 : pct >= r.min ? 1 : pct >= r.min - 5 ? 0 : -1;
  const english = !ielts ? 1 : ielts >= r.ielts ? 2 : ielts >= r.ielts - 0.5 ? 0 : -1;
  let verdict: Verdict;
  if (academic === 2 && english >= 1) verdict = "strong";
  else if (academic >= 1 && english >= 0) verdict = "good";
  else if (academic >= 0) verdict = "possible";
  else verdict = "pathway";

  const where = countryShort(input.country);
  const copy: Record<Verdict, [string, string]> = {
    strong: [`You look a strong fit for ${wants} in ${where}`, "Your marks fit a wide range of universities, including better-known ones."],
    good: [`You look eligible for ${wants} in ${where}`, "Your profile fits the usual requirements at many universities."],
    possible: [`You could be eligible for ${wants} in ${where}`, "Some universities would consider your profile. Your counsellor can shortlist the ones that fit."],
    pathway: [`${where} is possible with the right route`, "A foundation, diploma or pathway programme can lead to the degree you want."],
    not_yet: ["", ""],
  };
  return {
    verdict,
    headline: copy[verdict][0],
    summary: `${copy[verdict][1]}${!ielts ? " You'll also need an English test score." : ""}`,
    points: [...points, ...(r.notes ?? []).map((text) => ({ ok: null, text }))],
    suggestLevel: verdict === "pathway" ? (pg ? "pgcert" : "foundation") : undefined,
  };
}

const SHORT: Record<string, string> = { uk: "the UK", usa: "the USA", australia: "Australia", canada: "Canada", "new-zealand": "New Zealand", europe: "Europe" };
export const countryShort = (id: string) => SHORT[id] ?? id;
