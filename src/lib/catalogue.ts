import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import { AU_STATES, CATALOGUE_COUNTRIES, FEE_BUCKETS, isCountry, LEVELS, SUBJECTS, US_STATES, type CountryId } from "./catalogue-shared";

/**
 * The course finder catalogue: universities and courses from official open data, built
 * monthly by scripts/catalogue/build.mjs into data/catalogue/. Read from disk on the server
 * and kept in memory, so searches don't touch the database.
 */

export * from "./catalogue-shared";

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
  /** what "size" means for this country, when it's worth showing ("students") */
  students: number;
  currency: string;
  /** Canada: offers programmes eligible for a post-graduation work permit */
  pgwp: boolean;
  type: "public" | "private" | "";
  /** the location filter's value: a state or province, a city, or a European country */
  location: string;
  courses: number;
  /** typical first-year tuition in the local currency (0 = not in the data) */
  feeYear: number;
};

export type Course = {
  university: University;
  title: string;
  level: string;
  subject: string;
  months: number;
  /** total course fee in the local currency (Australia) */
  fee: number;
  url: string;
};

type RawUni = { i: string; n: string; c: string; r?: string; t?: string; w?: string; k?: number; f?: number; cur?: string; p?: number; pub?: number; ty?: string };
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

/** Per university: which levels and subjects it teaches (and how many courses), and fees by level. */
type Stats = { combos: Map<string, number>; feeByLevel: Map<string, number> };

type Store = {
  generatedAt: string | null;
  list: Indexed<University>[];
  byId: Map<string, University>;
  stats: Map<string, Stats>;
  /** rupees per unit of each currency */
  inr: Record<string, number>;
};
let store: Promise<Store> | null = null;
const courseStores = new Map<string, Promise<Indexed<Course>[]>>();

const INR_FALLBACK: Record<string, number> = { USD: 88, GBP: 117, AUD: 58, CAD: 63, EUR: 102, NZD: 51 };
const COUNTRY_CURRENCY = Object.fromEntries(CATALOGUE_COUNTRIES.map((c) => [c.id, c.currency])) as Record<string, string>;

/** Where the location filter looks: the state for big federal countries, otherwise the city */
const locationOf = (country: string, region: string, city: string) =>
  country === "uk" || country === "new-zealand" ? city : region;

export function locationLabel(country: string, value: string) {
  if (country === "australia") return AU_STATES[value] ?? value;
  if (country === "usa") return US_STATES[value] ?? value;
  return value;
}

/** First-year fee of a course: the whole fee for courses shorter than a year */
const firstYear = (c: Course) => (!c.fee ? 0 : c.months >= 12 ? (c.fee * 12) / c.months : c.fee);

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function loadStore() {
  store ??= (async () => {
    const raw = await readJson<{ generatedAt: string; inr?: Record<string, number | string>; items: RawUni[] }>("universities.json");
    const list: Indexed<University>[] = [];
    const byId = new Map<string, University>();
    for (const u of raw?.items ?? []) {
      if (!isCountry(u.c) || !u.n) continue;
      const region = u.r ?? "";
      const city = u.t ?? "";
      const item: University = {
        id: u.i,
        name: u.n,
        country: u.c,
        region,
        city,
        website: u.w ?? "",
        size: u.k ?? 0,
        students: u.c === "usa" || u.c === "europe" || u.c === "new-zealand" ? (u.k ?? 0) : 0,
        currency: u.cur || COUNTRY_CURRENCY[u.c] || "",
        pgwp: !!u.p,
        type: u.ty === "public" || u.ty === "private" ? u.ty : u.c === "canada" ? (u.pub ? "public" : "private") : "",
        location: locationOf(u.c, region, city),
        courses: 0,
        feeYear: u.f ?? 0,
      };
      list.push({ item, hay: fold(`${item.name} ${item.city} ${item.region} ${locationLabel(item.country, item.region)}`) });
      byId.set(item.id, item);
    }
    const inr: Record<string, number> = { ...INR_FALLBACK };
    for (const [k, v] of Object.entries(raw?.inr ?? {})) if (typeof v === "number" && v > 0) inr[k] = v;

    // Course counts, levels, subjects and typical fees per university, from the course lists
    const stats = new Map<string, Stats>();
    const fees = new Map<string, Map<string, number[]>>();
    await Promise.all(
      CATALOGUE_COUNTRIES.filter((c) => c.courses).map(async (c) => {
        for (const { item: course } of await loadCourses(c.id, byId)) {
          const u = course.university;
          u.courses += 1;
          let st = stats.get(u.id);
          if (!st) stats.set(u.id, (st = { combos: new Map(), feeByLevel: new Map() }));
          const key = `${course.level}|${course.subject}`;
          st.combos.set(key, (st.combos.get(key) ?? 0) + 1);
          const fy = firstYear(course);
          if (fy) {
            let byLevel = fees.get(u.id);
            if (!byLevel) fees.set(u.id, (byLevel = new Map()));
            byLevel.set(course.level, [...(byLevel.get(course.level) ?? []), fy]);
            byLevel.set("*", [...(byLevel.get("*") ?? []), fy]);
          }
        }
      }),
    );
    for (const [id, byLevel] of fees) {
      const st = stats.get(id)!;
      for (const [level, xs] of byLevel) st.feeByLevel.set(level, Math.round(median(xs)));
      const u = byId.get(id)!;
      if (!u.feeYear) u.feeYear = st.feeByLevel.get("*") ?? 0;
    }
    return { generatedAt: raw?.generatedAt ?? null, list, byId, stats, inr };
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

// ---------------------------------------------------------------------------
// The finder's listing: filters with counts, fees in rupees, sorting and pages
// ---------------------------------------------------------------------------

export type FinderFilters = {
  q: string;
  country: string;
  levels: string[];
  subjects: string[];
  locations: string[];
  /** a FEE_BUCKETS id */
  fee: string;
  types: string[];
  /** courses at one university only (the courses view) */
  university?: string;
};
export type FinderSort = "recommended" | "fee-asc" | "fee-desc" | "name";
export const FINDER_SORTS: { id: FinderSort; label: string }[] = [
  { id: "recommended", label: "Recommended" },
  { id: "fee-asc", label: "Tuition: low to high" },
  { id: "fee-desc", label: "Tuition: high to low" },
  { id: "name", label: "Name (A to Z)" },
];
export type Facets = Record<"country" | "level" | "subject" | "location" | "fee" | "type", Record<string, number>>;
export type UniversityHit = { u: University; feeInr: number; matching: number };
export type CourseHit = { c: Course; feeInr: number };

type Dim = keyof Facets;
const DIMS: Dim[] = ["country", "level", "subject", "location", "fee", "type"];

function feeOk(inr: number, bucket: string) {
  const b = FEE_BUCKETS.find((x) => x.id === bucket);
  if (!b) return true;
  if (!inr) return false;
  return "max" in b ? inr <= b.max : inr >= b.min;
}
const feeBucketsOf = (inr: number) => (inr ? FEE_BUCKETS.filter((b) => feeOk(inr, b.id)).map((b) => b.id) : []);
const roundInr = (n: number) => (n ? Math.round(n / 1000) * 1000 : 0);

/** Which countries have course lists this month */
async function courseCountries() {
  const { byId } = await loadStore();
  const out = new Set<string>();
  for (const c of CATALOGUE_COUNTRIES.filter((x) => x.courses)) if ((await loadCourses(c.id, byId)).length) out.add(c.id);
  return out;
}

/** Drops filters that don't apply: degree and subject where there are no course lists, places of another country. */
export async function normaliseFilters(f: FinderFilters): Promise<FinderFilters & { courseData: boolean }> {
  const withCourses = await courseCountries();
  const courseData = f.country ? withCourses.has(f.country) : withCourses.size > 0;
  return {
    ...f,
    country: isCountry(f.country) ? f.country : "",
    levels: courseData ? f.levels.filter((l) => LEVELS.some((x) => x.id === l)) : [],
    subjects: courseData ? f.subjects.filter((s) => SUBJECTS.some((x) => x.id === s)) : [],
    locations: f.country ? f.locations : [],
    fee: FEE_BUCKETS.some((b) => b.id === f.fee) ? f.fee : "",
    types: f.types.filter((t) => t === "public" || t === "private"),
    courseData,
  };
}

type Row = { s: number; values: Record<Dim, string[]>; pass: Record<Dim, boolean> };

/** Counts for each filter option, given the other filters (so the counts say what a click would show). */
function facetCounts(rows: Row[]) {
  const facets = Object.fromEntries(DIMS.map((d) => [d, {}])) as Facets;
  for (const r of rows) {
    if (!r.s) continue;
    for (const d of DIMS) {
      if (!DIMS.every((o) => o === d || r.pass[o])) continue;
      for (const v of r.values[d]) facets[d][v] = (facets[d][v] ?? 0) + 1;
    }
  }
  return facets;
}

function universityRow(u: University, st: Stats | undefined, f: FinderFilters, inr: Record<string, number>, s: number) {
  const levelsFor = new Set<string>();
  const subjectsFor = new Set<string>();
  let matching = 0;
  for (const [key, n] of st?.combos ?? []) {
    const [l, sub] = key.split("|");
    const lOk = !f.levels.length || f.levels.includes(l);
    const sOk = !f.subjects.length || f.subjects.includes(sub);
    if (sOk) levelsFor.add(l);
    if (lOk) subjectsFor.add(sub);
    if (lOk && sOk) matching += n;
  }
  const native = (f.levels.length && Math.min(...f.levels.map((l) => st?.feeByLevel.get(l) || Infinity))) || u.feeYear;
  const feeInr = roundInr((Number.isFinite(native) ? native : u.feeYear) * (inr[u.currency] ?? 0));
  const courseFilter = f.levels.length || f.subjects.length;
  const row: Row = {
    s,
    values: {
      country: [u.country],
      level: [...levelsFor],
      subject: [...subjectsFor],
      location: u.location ? [u.location] : [],
      fee: feeBucketsOf(feeInr),
      type: u.type ? [u.type] : [],
    },
    pass: {
      country: !f.country || u.country === f.country,
      level: !f.levels.length || f.levels.some((l) => levelsFor.has(l)),
      subject: !f.subjects.length || f.subjects.some((x) => subjectsFor.has(x)),
      location: !f.locations.length || f.locations.includes(u.location),
      fee: feeOk(feeInr, f.fee),
      type: !f.types.length || f.types.includes(u.type),
    },
  };
  return { row, hit: { u, feeInr, matching: courseFilter ? matching : u.courses } };
}

function sortHits<T extends { feeInr: number }>(hits: { h: T; s: number; size: number; name: string }[], sort: FinderSort) {
  const known = (a: number) => (a ? 0 : 1);
  hits.sort((a, b) => {
    if (sort === "fee-asc") return known(a.h.feeInr) - known(b.h.feeInr) || a.h.feeInr - b.h.feeInr || b.size - a.size;
    if (sort === "fee-desc") return known(a.h.feeInr) - known(b.h.feeInr) || b.h.feeInr - a.h.feeInr || b.size - a.size;
    if (sort === "name") return a.name.localeCompare(b.name);
    return b.s - a.s || b.size - a.size || a.name.localeCompare(b.name);
  });
}

export async function listUniversities(f: FinderFilters, { sort = "recommended", offset = 0, limit = 20 }: { sort?: FinderSort; offset?: number; limit?: number } = {}) {
  const { list, stats, inr } = await loadStore();
  const words = tokens(f.q);
  const phrase = words.join(" ");
  const rows: Row[] = [];
  const hits: { h: UniversityHit; s: number; size: number; name: string }[] = [];
  for (const { item: u, hay } of list) {
    const s = score(hay, fold(u.name), words, phrase, false);
    if (!s) continue;
    const { row, hit } = universityRow(u, stats.get(u.id), f, inr, s);
    rows.push(row);
    if (DIMS.every((d) => row.pass[d])) hits.push({ h: hit, s, size: u.size, name: u.name });
  }
  sortHits(hits, sort);
  return { total: hits.length, items: hits.slice(offset, offset + limit).map((x) => x.h), facets: facetCounts(rows) };
}

export async function listCourses(f: FinderFilters, { sort = "recommended", offset = 0, limit = 20 }: { sort?: FinderSort; offset?: number; limit?: number } = {}) {
  const { byId, inr } = await loadStore();
  const words = tokens(f.q);
  const phrase = words.join(" ");
  const rows: Row[] = [];
  const hits: { h: CourseHit; s: number; size: number; name: string }[] = [];
  for (const ct of CATALOGUE_COUNTRIES.filter((c) => c.courses)) {
    for (const { item: c, hay } of await loadCourses(ct.id, byId)) {
      if (f.university && c.university.id !== f.university) continue;
      const s = score(hay, fold(c.title), words, phrase);
      if (!s) continue;
      const u = c.university;
      const feeInr = roundInr((firstYear(c) || u.feeYear) * (inr[u.currency] ?? 0));
      const row: Row = {
        s,
        values: { country: [u.country], level: [c.level], subject: [c.subject], location: u.location ? [u.location] : [], fee: feeBucketsOf(feeInr), type: u.type ? [u.type] : [] },
        pass: {
          country: !f.country || u.country === f.country,
          level: !f.levels.length || f.levels.includes(c.level),
          subject: !f.subjects.length || f.subjects.includes(c.subject),
          location: !f.locations.length || f.locations.includes(u.location),
          fee: feeOk(feeInr, f.fee),
          type: !f.types.length || f.types.includes(u.type),
        },
      };
      rows.push(row);
      if (DIMS.every((d) => row.pass[d])) hits.push({ h: { c, feeInr }, s, size: u.size, name: `${c.title} ${u.name}` });
    }
  }
  sortHits(hits, sort);
  return { total: hits.length, items: hits.slice(offset, offset + limit).map((x) => x.h), facets: facetCounts(rows) };
}

/** Rupees for a fee in a local currency, rounded to the nearest thousand */
export async function toInr(amount: number, currency: string) {
  const { inr } = await loadStore();
  return roundInr(amount * (inr[currency] ?? 0));
}

/** "AUD 45,000": the currency code is clearer than "A$" for students comparing countries */
export const money = (n: number, currency: string) =>
  n ? new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "USD", currencyDisplay: "code", maximumFractionDigits: 0 }).format(n).replace(/\u00a0/g, " ") : "";

/** "AUD 45,000 total" / "USD 38,000 a year" */
export function feeText(c: Course) {
  if (c.fee && c.university.country === "australia") return `${money(c.fee, "AUD")} total`;
  return "";
}
export function universityFee(u: University) {
  if (u.feeYear && u.country === "usa") return `${money(u.feeYear, "USD")} a year (out-of-state tuition)`;
  return "";
}

export function durationText(months: number) {
  if (!months) return "";
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.round((months / 12) * 2) / 2;
  return `${years} year${years === 1 ? "" : "s"}`;
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

/** Well-known universities our students ask about, for the Study abroad menu (ids from the catalogue). */
const FEATURED: Record<string, string[]> = {
  uk: ["uk-s-universityofmanchester", "uk-s-universityofleeds", "uk-s-universityofbirmingham", "uk-s-universityofglasgow", "uk-s-kingscollegelondon", "uk-s-coventryuniversity"],
  australia: ["au-00008C", "au-00116K", "au-00026A", "au-00113B", "au-00122A", "au-00025B"],
  usa: ["us-104151", "us-167358", "us-123961", "us-193900", "us-228787", "us-164988"],
  canada: ["ca-O19332746152", "ca-O19330231062", "ca-O19359011033", "ca-O19376943122", "ca-O19376158572", "ca-O19395536013"],
  "new-zealand": ["nz-Q492467", "nz-Q1201513", "nz-Q1150437", "nz-Q432475", "nz-Q1134606", "nz-Q758659"],
  europe: ["eu-Q157808", "eu-Q258464", "eu-Q214341", "eu-Q151510", "eu-Q1068258", "eu-Q41497113"],
};

export type StudyMenuCountry = {
  id: string;
  name: string;
  flag: string;
  universities: number;
  courses: number;
  regionLabel: string;
  locations: { value: string; label: string }[];
  top: { id: string; name: string }[];
};

/** The header's "Study abroad" menu: per country, its biggest locations and well-known universities. */
export async function studyMenu(): Promise<StudyMenuCountry[]> {
  "use cache";
  cacheLife("days");
  const { list, byId } = await loadStore();
  const counts = await catalogueCounts();
  return CATALOGUE_COUNTRIES.map((c) => {
    const places = new Map<string, number>();
    for (const { item } of list) if (item.country === c.id && item.location) places.set(item.location, (places.get(item.location) ?? 0) + 1);
    const featured = (FEATURED[c.id] ?? []).map((id) => byId.get(id)).filter((u): u is University => !!u);
    const top = featured.length >= 4 ? featured : list.filter((x) => x.item.country === c.id).map((x) => x.item).sort((a, b) => b.size - a.size).slice(0, 6);
    return {
      id: c.id,
      name: c.name,
      flag: c.flag,
      universities: counts[c.id].universities,
      courses: counts[c.id].courses,
      regionLabel: c.id === "uk" || c.id === "new-zealand" ? "cities" : c.id === "europe" ? "countries" : c.id === "canada" ? "provinces" : "states",
      locations: [...places.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([value]) => ({ value, label: locationLabel(c.id, value) })),
      top: top.slice(0, 6).map((u) => ({ id: u.id, name: u.name.replace(/\s+\([^)]*\)$/, "") })),
    };
  });
}

/** For a country page: the well-known universities first, then the biggest. */
export async function topUniversities(country: string, limit = 6): Promise<UniversityHit[]> {
  "use cache";
  cacheLife("days");
  if (!isCountry(country)) return [];
  const all = (await listUniversities({ q: "", country, levels: [], subjects: [], locations: [], fee: "", types: [] }, { limit: 5000 })).items;
  const featured = FEATURED[country] ?? [];
  const rank = (id: string) => (featured.includes(id) ? featured.indexOf(id) : featured.length);
  return [...all].sort((a, b) => rank(a.u.id) - rank(b.u.id)).slice(0, limit);
}

/** Everything the university page shows, cached per university. */
export async function universityDetails(id: string) {
  "use cache";
  cacheLife("days");
  const { byId, stats, inr } = await loadStore();
  const u = byId.get(id);
  if (!u) return null;
  const courses = u.courses ? (await loadCourses(u.country, byId)).filter((x) => x.item.university.id === id).map((x) => x.item) : [];
  const levels = LEVELS.filter((l) => courses.some((c) => c.level === l.id)).map((l) => l.id);
  const st = stats.get(id);
  const feeInr = roundInr(u.feeYear * (inr[u.currency] ?? 0));
  const feeByLevel = Object.fromEntries([...(st?.feeByLevel ?? [])].filter(([l]) => l !== "*").map(([l, v]) => [l, roundInr(v * (inr[u.currency] ?? 0))]));
  const base: FinderFilters = { q: "", country: u.country, levels: [], subjects: [], locations: [], fee: "", types: [] };
  let similar = u.location ? (await listUniversities({ ...base, locations: [u.location] }, { limit: 5 })).items.filter((h) => h.u.id !== id) : [];
  if (similar.length < 2) similar = (await listUniversities(base, { limit: 5 })).items.filter((h) => h.u.id !== id);
  similar = similar.slice(0, 4);
  return {
    university: u,
    feeInr,
    feeByLevel,
    levels,
    rate: inr[u.currency] ?? 0,
    courses: courses
      .sort((a, b) => LEVELS.findIndex((l) => l.id === a.level) - LEVELS.findIndex((l) => l.id === b.level) || a.title.localeCompare(b.title))
      .slice(0, 600)
      .map((c) => ({ title: c.title, level: c.level, subject: c.subject, months: c.months, fee: c.fee, feeYearInr: roundInr(firstYear(c) * (inr[u.currency] ?? 0)), url: c.url })),
    similar,
  };
}

/** University pages built ahead: the well-known ones, plus the biggest in each country. */
export async function prebuiltUniversityIds() {
  const { list } = await loadStore();
  const ids = new Set(Object.values(FEATURED).flat());
  for (const c of CATALOGUE_COUNTRIES)
    list
      .filter((x) => x.item.country === c.id)
      .sort((a, b) => b.item.size - a.item.size)
      .slice(0, 10)
      .forEach((x) => ids.add(x.item.id));
  return [...ids].filter((id) => list.some((x) => x.item.id === id));
}
