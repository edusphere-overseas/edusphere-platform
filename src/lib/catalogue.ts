import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";

/**
 * The course finder catalogue: universities and courses from official open data, built
 * monthly by scripts/catalogue/build.mjs into data/catalogue/. Read from disk on the server
 * and kept in memory, so searches don't touch the database.
 */

/** `courses`: the country's source can include courses (whether it does this month is in catalogueSummary()). */
export const CATALOGUE_COUNTRIES = [
  { id: "uk", name: "United Kingdom", flag: "gb", courses: true, regionLabel: "Nation" },
  { id: "australia", name: "Australia", flag: "au", courses: true, regionLabel: "State" },
  { id: "usa", name: "United States", flag: "us", courses: true, regionLabel: "State" },
  { id: "canada", name: "Canada", flag: "ca", courses: false, regionLabel: "Province" },
  { id: "new-zealand", name: "New Zealand", flag: "nz", courses: false, regionLabel: "Region" },
  { id: "europe", name: "Europe", flag: "eu", courses: false, regionLabel: "Country" },
] as const;
export type CountryId = (typeof CATALOGUE_COUNTRIES)[number]["id"];
export const isCountry = (v: unknown): v is CountryId => CATALOGUE_COUNTRIES.some((c) => c.id === v);
export const countryInfo = (id: string) => CATALOGUE_COUNTRIES.find((c) => c.id === id);

export const LEVELS = [
  { id: "foundation", label: "Foundation and pathway" },
  { id: "diploma", label: "Diploma and associate degree" },
  { id: "bachelor", label: "Bachelor's degree" },
  { id: "pgcert", label: "Graduate certificate or diploma" },
  { id: "master", label: "Master's degree" },
  { id: "doctorate", label: "Doctorate (PhD)" },
] as const;

export const SUBJECTS = [
  { id: "business", label: "Business, management and finance" },
  { id: "computing", label: "Computing and IT" },
  { id: "engineering", label: "Engineering and technology" },
  { id: "health", label: "Medicine, nursing and health" },
  { id: "science", label: "Sciences and mathematics" },
  { id: "arts", label: "Art, design and performing arts" },
  { id: "humanities", label: "Humanities and languages" },
  { id: "social", label: "Social sciences and psychology" },
  { id: "law", label: "Law" },
  { id: "education", label: "Education and teaching" },
  { id: "architecture", label: "Architecture, building and planning" },
  { id: "agriculture", label: "Agriculture and environment" },
  { id: "hospitality", label: "Hospitality, tourism and sport" },
  { id: "media", label: "Media and communication" },
  { id: "other", label: "Other and combined" },
] as const;
export const levelLabel = (id: string) => LEVELS.find((l) => l.id === id)?.label ?? id;
export const subjectLabel = (id: string) => SUBJECTS.find((s) => s.id === id)?.label ?? id;

/** Where each country's data comes from, credited on the course finder (licences allow reuse with credit). */
export const SOURCES: { country: string; name: string; publisher: string; licence: string; url: string; ifCoursesIn?: string }[] = [
  {
    country: "United Kingdom",
    name: "Register of licensed student sponsors",
    publisher: "UK Home Office",
    licence: "Open Government Licence v3.0",
    url: "https://www.gov.uk/government/publications/register-of-licensed-sponsors-students",
  },
  { country: "United Kingdom", name: "Discover Uni dataset", publisher: "HESA and the Office for Students", licence: "CC BY 4.0", url: "https://www.hesa.ac.uk/support/tools-and-downloads/unistats", ifCoursesIn: "uk" },
  { country: "Australia", name: "CRICOS", publisher: "Australian Government Department of Education", licence: "CC BY 4.0", url: "https://data.gov.au/data/dataset/cricos" },
  { country: "United States", name: "College Scorecard", publisher: "US Department of Education", licence: "Public domain", url: "https://collegescorecard.ed.gov/data/" },
  { country: "Canada", name: "Designated learning institutions list", publisher: "Immigration, Refugees and Citizenship Canada", licence: "Open Government Licence – Canada", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/prepare/designated-learning-institutions-list.html" },
  { country: "New Zealand and Europe", name: "Wikidata", publisher: "Wikimedia community", licence: "CC0", url: "https://www.wikidata.org" },
];

export type University = {
  id: string;
  name: string;
  country: CountryId;
  region: string;
  city: string;
  website: string;
  /** relative size, used for ordering (enrolment, or number of courses) */
  size: number;
  fee: number;
  currency: string;
  /** Canada: offers programmes eligible for a post-graduation work permit */
  pgwp: boolean;
  public: boolean;
  courses: number;
};

export type Course = {
  university: University;
  title: string;
  level: string;
  subject: string;
  months: number;
  fee: number;
  url: string;
};

type RawUni = { i: string; n: string; c: string; r?: string; t?: string; w?: string; k?: number; f?: number; cur?: string; p?: number; pub?: number };
type RawCourse = [string, string, string, string, number, number, string];
type Indexed<T> = { item: T; hay: string };

/** Lower case, no accents or punctuation: "Université Côte d'Azur" → "universite cote d azur" */
export const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const dir = () => path.join(process.cwd(), "data", "catalogue");

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path.join(dir(), file), "utf8")) as T;
  } catch {
    return null;
  }
}

type Store = {
  generatedAt: string | null;
  list: Indexed<University>[];
  byId: Map<string, University>;
};
let store: Promise<Store> | null = null;
const courseStores = new Map<string, Promise<Indexed<Course>[]>>();

function loadStore() {
  store ??= (async () => {
    const raw = await readJson<{ generatedAt: string; items: RawUni[] }>("universities.json");
    const list: Indexed<University>[] = [];
    const byId = new Map<string, University>();
    for (const u of raw?.items ?? []) {
      if (!isCountry(u.c) || !u.n) continue;
      const item: University = {
        id: u.i,
        name: u.n,
        country: u.c,
        region: u.r ?? "",
        city: u.t ?? "",
        website: u.w ?? "",
        size: u.k ?? 0,
        fee: u.f ?? 0,
        currency: u.cur ?? "",
        pgwp: !!u.p,
        public: !!u.pub,
        courses: 0,
      };
      list.push({ item, hay: fold(`${item.name} ${item.city} ${item.region}`) });
      byId.set(item.id, item);
    }
    // Number of courses per university, for the countries that have course data
    await Promise.all(
      CATALOGUE_COUNTRIES.filter((c) => c.courses).map(async (c) => {
        for (const row of await loadCourses(c.id, byId)) row.item.university.courses += 1;
      }),
    );
    return { generatedAt: raw?.generatedAt ?? null, list, byId };
  })();
  return store;
}

function loadCourses(country: string, byId: Map<string, University>) {
  let p = courseStores.get(country);
  if (!p) {
    p = (async () => {
      const raw = await readJson<{ items: RawCourse[] }>(`courses-${country}.json`);
      const out: Indexed<Course>[] = [];
      for (const [uid, title, level, subject, months, fee, url] of raw?.items ?? []) {
        const university = byId.get(uid);
        if (!university || !title) continue;
        out.push({ item: { university, title, level, subject, months: months || 0, fee: fee || 0, url: url || "" }, hay: fold(`${title} ${university.name} ${university.city} ${university.region}`) });
      }
      return out;
    })();
    courseStores.set(country, p);
  }
  return p;
}

export async function catalogueUpdated() {
  return (await loadStore()).generatedAt;
}

export async function getUniversity(id: string) {
  return (await loadStore()).byId.get(id) ?? null;
}

const tokens = (q: string) => fold(q).split(" ").filter(Boolean).slice(0, 8);

/** `startBonus`: rank titles that start with the search first (courses); for universities a name
 * match is enough, and size decides, so "University of Toronto" isn't buried under "Toronto …" colleges. */
function score(hay: string, name: string, words: string[], phrase: string, startBonus = true) {
  if (!words.length) return 1;
  // whole words count more than parts of words
  let s = 0;
  for (const w of words) {
    const at = hay.indexOf(w);
    if (at < 0) return 0;
    s += at === 0 || hay[at - 1] === " " ? 2 : 1;
  }
  if (phrase.length > 2) {
    if (startBonus && name.startsWith(phrase)) s += 6;
    else if (name.includes(phrase)) s += 3;
  }
  return s;
}

export type UniversitySearch = { q?: string; country?: string; limit?: number; offset?: number };

export async function searchUniversities({ q = "", country, limit = 20, offset = 0 }: UniversitySearch) {
  const { list } = await loadStore();
  const words = tokens(q);
  const phrase = words.join(" ");
  const hits: { u: University; s: number }[] = [];
  for (const { item, hay } of list) {
    if (country && item.country !== country) continue;
    const s = score(hay, fold(item.name), words, phrase, false);
    if (s) hits.push({ u: item, s });
  }
  hits.sort((a, b) => b.s - a.s || b.u.size - a.u.size || a.u.name.localeCompare(b.u.name));
  return { total: hits.length, items: hits.slice(offset, offset + limit).map((h) => h.u) };
}

export type CourseSearch = { q?: string; country?: string; level?: string; subject?: string; university?: string; limit?: number; offset?: number };

export async function searchCourses({ q = "", country, level, subject, university, limit = 20, offset = 0 }: CourseSearch) {
  const { byId } = await loadStore();
  const countries = CATALOGUE_COUNTRIES.filter((c) => c.courses && (!country || c.id === country));
  const words = tokens(q);
  const phrase = words.join(" ");
  const hits: { c: Course; s: number }[] = [];
  for (const ct of countries) {
    for (const { item, hay } of await loadCourses(ct.id, byId)) {
      if (level && item.level !== level) continue;
      if (subject && item.subject !== subject) continue;
      if (university && item.university.id !== university) continue;
      const s = score(hay, fold(item.title), words, phrase);
      if (s) hits.push({ c: item, s });
    }
  }
  hits.sort(
    (a, b) =>
      b.s - a.s ||
      b.c.university.size - a.c.university.size ||
      a.c.university.name.localeCompare(b.c.university.name) ||
      a.c.title.localeCompare(b.c.title),
  );
  return { total: hits.length, items: hits.slice(offset, offset + limit).map((h) => h.c) };
}

/** Number of universities and courses per country, for the course finder's country picker. */
export async function catalogueCounts() {
  const { list, byId } = await loadStore();
  const out: Record<string, { universities: number; courses: number }> = {};
  for (const c of CATALOGUE_COUNTRIES) out[c.id] = { universities: 0, courses: 0 };
  for (const { item } of list) out[item.country].universities += 1;
  for (const c of CATALOGUE_COUNTRIES.filter((x) => x.courses)) out[c.id].courses = (await loadCourses(c.id, byId)).length;
  return out;
}

/** "AUD 45,000": the currency code is clearer than "A$" for students comparing countries */
const money = (n: number, currency: string) =>
  n ? new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "USD", currencyDisplay: "code", maximumFractionDigits: 0 }).format(n).replace(/\u00a0/g, " ") : "";

/** "AUD 45,000 total" / "USD 38,000 a year" */
export function feeText(c: Course) {
  if (c.fee && c.university.country === "australia") return `${money(c.fee, "AUD")} total`;
  return "";
}
export function universityFee(u: University) {
  if (u.fee && u.country === "usa") return `${money(u.fee, "USD")} a year (out-of-state tuition)`;
  return "";
}

export function durationText(months: number) {
  if (!months) return "";
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.round((months / 12) * 2) / 2;
  return `${years} year${years === 1 ? "" : "s"}`;
}

/** Link to the apply form, with the university (and course) filled in. */
export function applyHref({ university, course, country }: { university?: string; course?: string; country?: string }) {
  const p = new URLSearchParams();
  if (country) p.set("country", country);
  if (university) p.set("u", university);
  if (course) p.set("course", course.slice(0, 200));
  const s = p.toString();
  return `/apply${s ? `?${s}` : ""}`;
}

// ---------------------------------------------------------------------------
// Cached views for pages that are built ahead (rebuilt when the catalogue changes,
// because every catalogue update is a new commit and so a new deployment)
// ---------------------------------------------------------------------------

export async function catalogueSummary() {
  "use cache";
  cacheLife("days");
  const counts = await catalogueCounts();
  const total = Object.values(counts).reduce((a, c) => ({ universities: a.universities + c.universities, courses: a.courses + c.courses }), { universities: 0, courses: 0 });
  return { counts, total, updated: await catalogueUpdated() };
}

export async function topUniversities(country: string, limit = 12) {
  "use cache";
  cacheLife("days");
  return searchUniversities({ country: isCountry(country) ? country : "__none__", limit });
}
