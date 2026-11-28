/**
 * Course finder vocabulary that the browser needs too (filters, the eligibility and apply
 * forms). The data itself is read on the server by src/lib/catalogue.ts.
 */

/** `courses`: the country's source can include courses (whether it does this month is in catalogueSummary()). */
export const CATALOGUE_COUNTRIES = [
  { id: "uk", name: "United Kingdom", short: "UK", flag: "gb", courses: true, regionLabel: "Nation", currency: "GBP" },
  { id: "australia", name: "Australia", short: "Australia", flag: "au", courses: true, regionLabel: "State", currency: "AUD" },
  { id: "usa", name: "United States", short: "USA", flag: "us", courses: true, regionLabel: "State", currency: "USD" },
  { id: "canada", name: "Canada", short: "Canada", flag: "ca", courses: false, regionLabel: "Province", currency: "CAD" },
  { id: "new-zealand", name: "New Zealand", short: "New Zealand", flag: "nz", courses: false, regionLabel: "Region", currency: "NZD" },
  { id: "europe", name: "Europe", short: "Europe", flag: "eu", courses: false, regionLabel: "Country", currency: "EUR" },
] as const;
export type CountryId = (typeof CATALOGUE_COUNTRIES)[number]["id"];
export const isCountry = (v: unknown): v is CountryId => CATALOGUE_COUNTRIES.some((c) => c.id === v);
export const countryInfo = (id: string) => CATALOGUE_COUNTRIES.find((c) => c.id === id);

export const LEVELS = [
  { id: "foundation", label: "Foundation and pathway", short: "Foundation" },
  { id: "diploma", label: "Diploma and associate degree", short: "Diploma" },
  { id: "bachelor", label: "Bachelor's degree", short: "Bachelor's" },
  { id: "pgcert", label: "Graduate certificate or diploma", short: "PG diploma" },
  { id: "master", label: "Master's degree", short: "Master's" },
  { id: "doctorate", label: "Doctorate (PhD)", short: "PhD" },
] as const;

export const SUBJECTS = [
  { id: "business", label: "Business, management and finance", short: "Business" },
  { id: "computing", label: "Computing and IT", short: "Computing and IT" },
  { id: "engineering", label: "Engineering and technology", short: "Engineering" },
  { id: "health", label: "Medicine, nursing and health", short: "Health and nursing" },
  { id: "science", label: "Sciences and mathematics", short: "Sciences" },
  { id: "arts", label: "Art, design and performing arts", short: "Art and design" },
  { id: "humanities", label: "Humanities and languages", short: "Humanities" },
  { id: "social", label: "Social sciences and psychology", short: "Social sciences" },
  { id: "law", label: "Law", short: "Law" },
  { id: "education", label: "Education and teaching", short: "Education" },
  { id: "architecture", label: "Architecture, building and planning", short: "Architecture" },
  { id: "agriculture", label: "Agriculture and environment", short: "Agriculture" },
  { id: "hospitality", label: "Hospitality, tourism and sport", short: "Hospitality" },
  { id: "media", label: "Media and communication", short: "Media" },
  { id: "other", label: "Other and combined", short: "Other" },
] as const;
export const levelLabel = (id: string) => LEVELS.find((l) => l.id === id)?.label ?? id;
export const levelShort = (id: string) => LEVELS.find((l) => l.id === id)?.short ?? id;
export const subjectLabel = (id: string) => SUBJECTS.find((s) => s.id === id)?.label ?? id;

export const AU_STATES: Record<string, string> = {
  NSW: "New South Wales",
  VIC: "Victoria",
  QLD: "Queensland",
  WA: "Western Australia",
  SA: "South Australia",
  TAS: "Tasmania",
  ACT: "Australian Capital Territory",
  NT: "Northern Territory",
};

export const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
  DC: "Washington, DC", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
  KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island",
  SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", PR: "Puerto Rico", GU: "Guam", VI: "US Virgin Islands",
};

/** The intakes most students start in, per country (others exist at many universities) */
export const MAIN_INTAKES: Record<string, string[]> = {
  uk: ["September", "January"],
  australia: ["February", "July"],
  usa: ["September", "January"],
  canada: ["September", "January", "May"],
  "new-zealand": ["February", "July"],
  europe: ["September", "February"],
};

/** Popular searches, for the Study abroad menu */
export const POPULAR_COURSES = [
  { label: "MS in Computer Science", level: "master", subject: "computing", course: "Computer Science" },
  { label: "MBA and Master's in Business", level: "master", subject: "business", course: "MBA" },
  { label: "Master's in Engineering", level: "master", subject: "engineering", course: "Engineering" },
  { label: "Master's in Health and Nursing", level: "master", subject: "health", course: "Nursing" },
  { label: "Bachelor's in Business", level: "bachelor", subject: "business", course: "Business" },
  { label: "Bachelor's in Computing and IT", level: "bachelor", subject: "computing", course: "Information Technology" },
] as const;

/** First-year tuition, in rupees */
export const FEE_BUCKETS = [
  { id: "10", label: "Up to ₹10 lakh", max: 10_00_000 },
  { id: "20", label: "Up to ₹20 lakh", max: 20_00_000 },
  { id: "30", label: "Up to ₹30 lakh", max: 30_00_000 },
  { id: "40", label: "Up to ₹40 lakh", max: 40_00_000 },
  { id: "40+", label: "₹40 lakh and above", min: 40_00_000 },
] as const;

/** 4560000 → "₹45.6 lakh" */
export function lakh(rupees: number) {
  const l = rupees / 1_00_000;
  if (l >= 100) return `₹${(l / 100).toFixed(1).replace(/\.0$/, "")} crore`;
  return `₹${l >= 10 ? Math.round(l) : l.toFixed(1).replace(/\.0$/, "")} lakh`;
}

function query(params: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) p.set(k, k === "course" ? v.slice(0, 200) : v);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** The apply form (creates the portal account and the application), with what's known filled in. */
export const applyHref = ({ university, course, country, level }: { university?: string; course?: string; country?: string; level?: string }) =>
  `/apply${query({ country, u: university, course, level })}`;

/** The eligibility check, with what's known filled in. */
export const eligibilityHref = ({ university, course, country, level }: { university?: string; course?: string; country?: string; level?: string }) =>
  `/check-eligibility${query({ country, u: university, course, level })}`;

export const universityHref = (id: string) => `/universities/${encodeURIComponent(id)}`;
