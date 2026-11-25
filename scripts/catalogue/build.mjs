#!/usr/bin/env node
/**
 * Builds the course finder catalogue from official open data and writes it to data/catalogue/.
 * Run by .github/workflows/catalogue.yml (monthly, or when data/catalogue/REFRESH is committed).
 *
 * Sources (all free to reuse, credited on the course finder page):
 *  - UK: Discover Uni dataset (HESA / OfS), CC BY 4.0: universities and undergraduate courses;
 *    if it can't be downloaded, the Home Office register of student sponsors (OGL): institutions only
 *  - Australia: CRICOS (Department of Education), CC BY: providers and courses for student-visa holders
 *  - USA: College Scorecard (US Department of Education), public domain: colleges and fields of study
 *  - Canada: IRCC list of designated learning institutions (OGL – Canada): institutions only
 *  - New Zealand and Europe: Wikidata, CC0: universities only
 *
 * Each source is independent: if one fails, that country keeps its previous data and the
 * failure is recorded in data/catalogue/sources.json.
 */
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const OUT = path.resolve("data/catalogue");
const TMP = path.resolve(process.env.RUNNER_TEMP || "/tmp", "edusphere-catalogue");
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 EdusphereCatalogue/1.0";
const only = (process.argv[2] || "").split(",").filter(Boolean); // e.g. "uk,usa" to build some sources only

mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

const report = { generatedAt: new Date().toISOString(), sources: {} };
const log = (...a) => console.log("[catalogue]", ...a);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchRetry(url, init = {}, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { redirect: "follow", ...init, headers: { "user-agent": UA, accept: "*/*", ...(init.headers || {}) } });
      if (res.ok) return res;
      last = new Error(`${res.status} ${res.statusText} for ${url}`);
      if (res.status === 404) break;
    } catch (e) {
      last = e;
    }
    await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
  }
  throw last;
}

const getText = async (url, init) => (await fetchRetry(url, init)).text();
const getJson = async (url, init) => JSON.parse(await getText(url, init));

async function download(url, name) {
  const file = path.join(TMP, name);
  const res = await fetchRetry(url);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(file));
  log(`downloaded ${name} (${(statSync(file).size / 1e6).toFixed(1)} MB) from ${url}`);
  return file;
}

function unzip(file, dir) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  execFileSync("unzip", ["-o", "-q", file, "-d", dir]);
  const all = [];
  const walk = (d) => readdirSync(d).forEach((f) => (statSync(path.join(d, f)).isDirectory() ? walk(path.join(d, f)) : all.push(path.join(d, f))));
  walk(dir);
  return all;
}

/** Streams a CSV file, yielding one array of fields per record (handles quotes and newlines in quotes). */
async function* csvRows(file, delimiter = ",") {
  const stream = createReadStream(file, { encoding: "utf8", highWaterMark: 1 << 20 });
  let field = "";
  let row = [];
  let inQuotes = false;
  let quoteSeen = false; // a quote inside a quoted field: either an escaped quote or the end
  let first = true;
  for await (let chunk of stream) {
    if (first) {
      if (chunk.charCodeAt(0) === 0xfeff) chunk = chunk.slice(1);
      first = false;
    }
    for (let i = 0; i < chunk.length; i++) {
      const ch = chunk[i];
      if (inQuotes) {
        if (quoteSeen) {
          quoteSeen = false;
          if (ch === '"') {
            field += '"';
            continue;
          }
          inQuotes = false; // fall through and handle ch normally
        } else if (ch === '"') {
          quoteSeen = true;
          continue;
        } else {
          field += ch;
          continue;
        }
      }
      if (ch === '"' && field === "") inQuotes = true;
      else if (ch === delimiter) {
        row.push(field);
        field = "";
      } else if (ch === "\n") {
        row.push(field);
        field = "";
        yield row;
        row = [];
      } else if (ch !== "\r") field += ch;
    }
  }
  if (quoteSeen) inQuotes = false;
  if (field !== "" || row.length) {
    row.push(field);
    yield row;
  }
}

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** Finds column positions by (normalised) name. `need` lists required keys; others are optional. */
function columns(header, wanted, need, label) {
  const h = header.map(norm);
  const out = {};
  for (const [key, names] of Object.entries(wanted)) {
    out[key] = -1;
    for (const n of names) {
      const i = h.indexOf(norm(n));
      if (i >= 0) {
        out[key] = i;
        break;
      }
    }
    if (out[key] < 0) {
      // fall back to "starts with" for long column names
      for (const n of names) {
        const i = h.findIndex((x) => x.startsWith(norm(n)));
        if (i >= 0) {
          out[key] = i;
          break;
        }
      }
    }
  }
  const missing = need.filter((k) => out[k] < 0);
  if (missing.length) throw new Error(`${label}: missing columns ${missing.join(", ")}. Header: ${header.slice(0, 80).join(" | ")}`);
  return out;
}

async function readTable(file, wanted, need, label, delimiter = ",") {
  const rows = [];
  let cols;
  let header;
  for await (const r of csvRows(file, delimiter)) {
    if (!cols) {
      header = r;
      cols = columns(r, wanted, need, label);
      continue;
    }
    if (r.length === 1 && r[0] === "") continue;
    const o = {};
    for (const [k, i] of Object.entries(cols)) o[k] = i >= 0 ? (r[i] ?? "").trim() : "";
    rows.push(o);
  }
  return { rows, header: header || [] };
}

const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();
const titleCase = (s) =>
  clean(s)
    .toLowerCase()
    .replace(/(^|[\s(/&-])([a-z])/g, (m, p, c) => p + c.toUpperCase())
    .replace(/\b(Of|And|For|In|The|At|On|To|With|De|Du|La|Le|Des|Und|Der|Di)\b/g, (w, _1, off) => (off === 0 ? w : w.toLowerCase()));
const website = (s) => {
  const v = clean(s);
  if (!v || v === "NULL") return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v.replace(/^\/+/, "")}`;
};
const num = (s) => {
  const v = Number(String(s || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(v) && v > 0 ? v : 0;
};

// ---------------------------------------------------------------------------
// Subjects and levels (one vocabulary for every country)
// ---------------------------------------------------------------------------

export const SUBJECTS = {
  business: "Business, management and finance",
  computing: "Computing and IT",
  engineering: "Engineering and technology",
  health: "Medicine, nursing and health",
  science: "Sciences and mathematics",
  arts: "Art, design and performing arts",
  humanities: "Humanities and languages",
  social: "Social sciences and psychology",
  law: "Law",
  education: "Education and teaching",
  architecture: "Architecture, building and planning",
  agriculture: "Agriculture and environment",
  hospitality: "Hospitality, tourism and sport",
  media: "Media and communication",
  other: "Other and combined",
};

const KEYWORDS = [
  ["law", /\b(law|legal|llb|criminolog)/i],
  ["computing", /(comput|software|information tech|\bit\b|data sci|cyber|artificial intel|machine learn|informatic|games dev|programming|network)/i],
  ["health", /(medic|nurs|health|pharma|dent|physio|midwif|paramed|occupational ther|radiograph|nutrition|optom|biomed|public health|vet)/i],
  ["engineering", /(engineer|mechatron|robotic|aeronaut|aerospace|electrical|electronic|mechanical|civil|chemical eng|automotive|technolog)/i],
  ["architecture", /(architect|construction|building|surveying|urban|planning|property|real estate|interior design)/i],
  ["business", /(business|management|account|financ|econom|marketing|commerce|mba|banking|human resource|logistic|supply chain|entrepreneur|actuar)/i],
  ["media", /(journalis|media|communication|film|broadcast|public relations|advertising)/i],
  ["arts", /(art\b|arts\b|design|fashion|music|drama|theatre|dance|animation|photograph|fine art|illustrat|creative)/i],
  ["education", /(educat|teach|pedagog|early childhood)/i],
  ["hospitality", /(hospitality|hotel|tourism|event|culinary|cookery|sport|leisure|recreation)/i],
  ["agriculture", /(agricult|environment|ecolog|forestry|marine|geograph|sustainab|food sci|horticult|animal sci|earth sci|geolog)/i],
  ["social", /(psycholog|sociolog|social|politic|international relations|anthropolog|social work|policy|criminolog)/i],
  ["science", /(science|biolog|chemis|physic|math|statistic|biochem|genetic|astronom|neuroscience|zoolog)/i],
  ["humanities", /(histor|philosoph|english|literature|language|linguist|classics|theolog|religio|french|german|spanish|chinese|japanese|archaeolog)/i],
];
export function subjectFromTitle(title) {
  for (const [key, re] of KEYWORDS) if (re.test(title)) return key;
  return "other";
}

// Australian broad fields of education (ASCED)
function subjectFromAsced(broad, narrow, title) {
  const b = norm(broad);
  if (/law/i.test(narrow)) return "law";
  if (b.startsWith("naturalandphysical")) return "science";
  if (b.startsWith("informationtech")) return "computing";
  if (b.startsWith("engineering")) return "engineering";
  if (b.startsWith("architecture")) return "architecture";
  if (b.startsWith("agriculture")) return "agriculture";
  if (b.startsWith("health")) return "health";
  if (b.startsWith("education")) return "education";
  if (b.startsWith("managementandcommerce")) return "business";
  if (b.startsWith("societyandculture")) return /journalis|communication|media/i.test(narrow) ? "media" : /language|literature|philosoph|religio|histor/i.test(narrow) ? "humanities" : "social";
  if (b.startsWith("creativearts")) return /communication|media|journalis/i.test(narrow) ? "media" : "arts";
  if (b.startsWith("foodhospitality")) return "hospitality";
  return subjectFromTitle(title);
}

// US CIP 2-digit families
function subjectFromCip(cip, title) {
  const f = Number(String(cip).padStart(4, "0").slice(0, 2));
  const map = {
    52: "business", 11: "computing", 14: "engineering", 15: "engineering", 51: "health", 26: "science", 27: "science", 40: "science", 41: "science",
    50: "arts", 23: "humanities", 24: "humanities", 38: "humanities", 39: "humanities", 54: "humanities", 16: "humanities", 5: "humanities",
    42: "social", 45: "social", 44: "social", 43: "social", 22: "law", 13: "education", 4: "architecture", 1: "agriculture", 3: "agriculture",
    12: "hospitality", 31: "hospitality", 36: "hospitality", 9: "media", 10: "media",
  };
  return map[f] || subjectFromTitle(title);
}

export const LEVELS = {
  foundation: "Foundation and pathway",
  diploma: "Diploma and associate degree",
  bachelor: "Bachelor's degree",
  pgcert: "Graduate certificate or diploma",
  master: "Master's degree",
  doctorate: "Doctorate (PhD)",
};

// ---------------------------------------------------------------------------
// Output collectors
// ---------------------------------------------------------------------------

/** universities[country] = [{ i, n, r, t, w, k, ...extra }] ; courses[country] = [[uniId, title, level, subject, months, fee, url]] */
const universities = {};
const courses = {};
const previous = (file) => (existsSync(path.join(OUT, file)) ? JSON.parse(readFileSync(path.join(OUT, file), "utf8")) : null);

function keepPrevious(country, withCourses) {
  const prev = previous("universities.json");
  universities[country] = prev?.items?.filter((u) => u.c === country) ?? [];
  if (withCourses) courses[country] = previous(`courses-${country}.json`)?.items ?? [];
}

async function source(key, countries, withCourses, fn) {
  if (only.length && !only.includes(key)) {
    countries.forEach((c) => keepPrevious(c, withCourses));
    report.sources[key] = previous("sources.json")?.sources?.[key] ?? { ok: false, skipped: true };
    return;
  }
  const started = Date.now();
  try {
    const info = await fn();
    report.sources[key] = { ok: true, ...info, seconds: Math.round((Date.now() - started) / 1000) };
    log(key, "ok", JSON.stringify(info));
  } catch (error) {
    console.error(`[catalogue] ${key} FAILED:`, error);
    countries.forEach((c) => keepPrevious(c, withCourses));
    report.sources[key] = { ok: false, error: String(error?.message || error).slice(0, 2000), keptPrevious: true };
  }
}

// ---------------------------------------------------------------------------
// Australia: CRICOS
// ---------------------------------------------------------------------------

async function australia() {
  const pkg = await getJson("https://data.gov.au/data/api/3/action/package_show?id=cricos");
  const resources = pkg.result.resources;
  const pick = (re) => {
    const list = resources.filter((r) => re.test(r.name || "") && /csv/i.test(`${r.format} ${r.url}`));
    list.sort((a, b) => String(b.last_modified || b.created).localeCompare(String(a.last_modified || a.created)));
    if (!list.length) throw new Error(`CRICOS: no resource matching ${re}. Resources: ${resources.map((r) => r.name).join(" | ")}`);
    return list[0].url;
  };
  const [instFile, courseFile, locFile] = await Promise.all([
    download(pick(/^CRICOS Institutions/i), "cricos-institutions.csv"),
    download(pick(/^CRICOS Courses/i), "cricos-courses.csv"),
    download(pick(/^CRICOS Locations/i), "cricos-locations.csv"),
  ]);

  const inst = await readTable(
    instFile,
    { code: ["CRICOS Provider Code"], trading: ["Trading Name"], name: ["Institution Name"], type: ["Institution Type"], web: ["Website"] },
    ["code", "name"],
    "CRICOS institutions",
  );
  const locs = await readTable(
    locFile,
    { code: ["CRICOS Provider Code"], state: ["State", "Location State", "Address State"] },
    ["code"],
    "CRICOS locations",
  );
  const crs = await readTable(
    courseFile,
    {
      code: ["CRICOS Provider Code"],
      course: ["CRICOS Course Code"],
      name: ["Course Name"],
      level: ["Course Level"],
      foundation: ["Foundation Studies"],
      broad: ["Field of Education 1 Broad Field", "Field of Education Broad Field", "Broad Field"],
      narrow: ["Field of Education 1 Narrow Field", "Field of Education Narrow Field", "Narrow Field"],
      weeks: ["Duration (Weeks)", "Duration Weeks", "Duration"],
      cost: ["Estimated Total Course Cost", "Tuition Fee"],
      expired: ["Expired"],
    },
    ["code", "name", "level"],
    "CRICOS courses",
  );

  const levelOf = (l, foundation) => {
    const v = l.toLowerCase();
    if (/doctor/.test(v)) return "doctorate";
    if (/master/.test(v)) return "master";
    if (/graduate (certificate|diploma)/.test(v)) return "pgcert";
    if (/bachelor/.test(v)) return "bachelor";
    if (/associate degree|advanced diploma/.test(v)) return "diploma";
    if (/^yes|true|y$/i.test(foundation) || /foundation/.test(v)) return "foundation";
    if (/^diploma/.test(v)) return "diploma";
    return null; // certificates, English language, school
  };

  // Campus suburbs can mislead (a farm campus, a language centre), so only the state is shown
  const stateOf = new Map();
  for (const l of locs.rows) if (!stateOf.has(l.code) && l.state) stateOf.set(l.code, l.state.toUpperCase());
  const providerName = (i) => {
    const pick = i.trading && !/[,;]/.test(i.trading) && i.trading.length <= 80 ? i.trading : i.name;
    const n = clean(pick)
      .replace(/\s+(Pty\.?\s+)?(Limited|Ltd\.?)$/i, "")
      // "Macquarie University (Macquarie)" -> "Macquarie University"; keeps tags like "(RMIT)"
      .replace(/\s+\(([^)]{1,30})\)$/, (m, tag, _o, whole) => (whole.slice(0, -m.length).toLowerCase().includes(tag.toLowerCase()) ? "" : m));
    return n === n.toUpperCase() ? titleCase(n) : n;
  };

  const list = [];
  const count = new Map();
  for (const c of crs.rows) {
    if (/^(yes|true|y)$/i.test(c.expired)) continue;
    const level = levelOf(c.level, c.foundation);
    if (!level) continue;
    const id = `au-${c.code}`;
    const title = clean(c.name);
    list.push([id, title, level, subjectFromAsced(c.broad, c.narrow, title), c.weeks ? Math.round(num(c.weeks) / 4.345) : 0, Math.round(num(c.cost)), ""]);
    count.set(id, (count.get(id) || 0) + (level === "bachelor" || level === "master" || level === "doctorate" ? 1 : 0.2));
  }
  // Keep providers that offer degree-level study
  const uni = [];
  for (const i of inst.rows) {
    const id = `au-${i.code}`;
    const n = count.get(id) || 0;
    if (n < 1) continue;
    uni.push({ i: id, n: providerName(i), c: "australia", r: stateOf.get(i.code) || "", t: "", w: website(i.web), k: Math.round(n), cur: "AUD" });
  }
  const keep = new Set(uni.map((u) => u.i));
  universities.australia = uni;
  courses.australia = list.filter((c) => keep.has(c[0]));
  return { universities: uni.length, courses: courses.australia.length, header: crs.header.slice(0, 40) };
}

// ---------------------------------------------------------------------------
// USA: College Scorecard
// ---------------------------------------------------------------------------

// Last known download links (Nov 2026), used if the data page can't be read
const SCORECARD_FALLBACK = {
  inst: "https://ed-public-download.scorecard.network/downloads/Most-Recent-Cohorts-Institution_11022026.zip",
  fos: "https://ed-public-download.scorecard.network/downloads/Most-Recent-Cohorts-Field-of-Study_10152026.zip",
};

async function scorecardUrls() {
  const found = {};
  const scan = (text) => {
    for (const m of text.matchAll(/https?:[^"'\s<>]+?Most-Recent-Cohorts-(Institution|Field-of-Study)[^"'\s<>]*?\.zip/gi)) {
      const u = m[0].replace(/\\u002F/gi, "/").replace(/\\\//g, "/");
      if (/Institution/i.test(m[1])) found.inst ??= u;
      else found.fos ??= u;
    }
  };
  for (const page of ["https://collegescorecard.ed.gov/data/", "https://collegescorecard.ed.gov/data/_payload.json"]) {
    if (found.inst && found.fos) break;
    try {
      scan(await getText(page, { headers: { accept: "text/html,application/json" } }));
    } catch (e) {
      log("scorecard page:", e.message);
    }
  }
  found.inst ??= SCORECARD_FALLBACK.inst;
  found.fos ??= SCORECARD_FALLBACK.fos;
  return found;
}

async function usa() {
  try {
    return await usaBulk();
  } catch (error) {
    log("College Scorecard download unavailable, using its API:", error.message);
    return { ...(await usaApi()), bulkError: String(error.message).slice(0, 300) };
  }
}

/**
 * The same College Scorecard data through its official API (api.data.gov). Uses the free
 * SCORECARD_API_KEY secret when set (get one at https://api.data.gov/signup), else the public
 * DEMO_KEY, which allows about 30 requests an hour: this needs about 15.
 */
async function usaApi() {
  const key = process.env.SCORECARD_API_KEY || "DEMO_KEY";
  const p = "latest.programs.cip_4_digit";
  const fields = [
    "id", "school.name", "school.city", "school.state", "school.school_url", "latest.student.size", "latest.cost.tuition.out_of_state",
    `${p}.code`, `${p}.title`, `${p}.credential.level`, `${p}.counts.ipeds_awards1`, `${p}.counts.ipeds_awards2`,
  ].join(",");
  const levels = { 3: "bachelor", 5: "master", 6: "doctorate" };
  const uni = [];
  const list = [];
  const seen = new Set();
  let partial = "";
  for (let page = 0; page < 40; page++) {
    const q = new URLSearchParams({
      api_key: key, per_page: "100", page: String(page), fields, sort: "latest.student.size:desc",
      "school.operating": "1", "school.ownership": "1,2", "school.degrees_awarded.highest": "3,4", "latest.student.size__range": "1000..",
    });
    // Largest first, so if the hourly limit is reached we still have the biggest universities
    const resp = await fetch(`https://api.data.gov/ed/collegescorecard/v1/schools?${q}`, { headers: { "user-agent": UA, accept: "application/json" } });
    if (!resp.ok) {
      if (uni.length >= 300) {
        partial = `stopped at page ${page}: ${resp.status}`;
        break;
      }
      throw new Error(`College Scorecard API: ${resp.status} ${resp.statusText} on page ${page}`);
    }
    const res = await resp.json();
    for (const r of res.results ?? []) {
      const id = `us-${r.id}`;
      const name = clean(r["school.name"]);
      if (!name) continue;
      uni.push({ i: id, n: name, c: "usa", r: clean(r["school.state"]), t: titleCase(r["school.city"]), w: website(r["school.school_url"]), k: Math.round(num(r["latest.student.size"])), f: Math.round(num(r["latest.cost.tuition.out_of_state"])) || undefined, cur: "USD" });
      for (const pr of r[p] ?? []) {
        const level = levels[pr.credential?.level];
        if (!level) continue;
        if (pr.counts?.ipeds_awards1 === 0 && pr.counts?.ipeds_awards2 === 0) continue; // nobody graduated in two years: likely closed
        const title = clean(pr.title).replace(/\.$/, "");
        const key2 = `${id}|${title}|${level}`;
        if (!title || seen.has(key2)) continue;
        seen.add(key2);
        list.push([id, title, level, subjectFromCip(pr.code, title), 0, 0, ""]);
      }
    }
    if ((page + 1) * 100 >= (res.metadata?.total ?? 0)) break;
    await new Promise((r) => setTimeout(r, 1500));
  }
  if (uni.length < 300) throw new Error(`College Scorecard API: only ${uni.length} institutions`);
  universities.usa = uni;
  courses.usa = list;
  return { universities: uni.length, courses: list.length, via: key === "DEMO_KEY" ? "api (DEMO_KEY)" : "api", ...(partial ? { partial } : {}) };
}

async function usaBulk() {
  const urls = await scorecardUrls();
  const instFiles = unzip(await download(urls.inst, "scorecard-inst.zip"), path.join(TMP, "scorecard-inst"));
  const fosFiles = unzip(await download(urls.fos, "scorecard-fos.zip"), path.join(TMP, "scorecard-fos"));
  const instCsv = instFiles.filter((f) => /\.csv$/i.test(f)).sort((a, b) => statSync(b).size - statSync(a).size)[0];
  const fosCsv = fosFiles.filter((f) => /\.csv$/i.test(f)).sort((a, b) => statSync(b).size - statSync(a).size)[0];

  const inst = await readTable(
    instCsv,
    {
      id: ["UNITID"], name: ["INSTNM"], city: ["CITY"], state: ["STABBR"], url: ["INSTURL"], control: ["CONTROL"], iclevel: ["ICLEVEL"],
      oper: ["CURROPER"], ugds: ["UGDS"], fee: ["TUITIONFEE_OUT"], highdeg: ["HIGHDEG"], preddeg: ["PREDDEG"],
    },
    ["id", "name", "state", "control", "ugds"],
    "Scorecard institutions",
  );
  const uni = [];
  for (const r of inst.rows) {
    if (r.oper && r.oper !== "1") continue;
    if (!["1", "2"].includes(r.control)) continue; // public and private non-profit
    if (r.iclevel && r.iclevel !== "1") continue; // four-year
    if (r.highdeg && Number(r.highdeg) < 3) continue;
    const size = num(r.ugds);
    if (size < 1000) continue;
    uni.push({ i: `us-${r.id}`, n: clean(r.name), c: "usa", r: r.state, t: titleCase(r.city), w: website(r.url), k: Math.round(size), f: Math.round(num(r.fee)) || undefined, cur: "USD" });
  }
  const keep = new Set(uni.map((u) => u.i));

  const fos = await readTable(
    fosCsv,
    { id: ["UNITID"], cip: ["CIPCODE"], desc: ["CIPDESC"], lev: ["CREDLEV"], c1: ["IPEDSCOUNT1"], c2: ["IPEDSCOUNT2"] },
    ["id", "cip", "desc", "lev"],
    "Scorecard fields of study",
  );
  const levels = { 3: "bachelor", 5: "master", 6: "doctorate" };
  const seen = new Set();
  const list = [];
  for (const r of fos.rows) {
    const id = `us-${r.id}`;
    const level = levels[r.lev];
    if (!level || !keep.has(id)) continue;
    if (r.c1 === "0" && r.c2 === "0") continue; // nobody graduated in two years: likely closed
    const title = clean(r.desc).replace(/\.$/, "");
    const key = `${id}|${title}|${level}`;
    if (seen.has(key)) continue;
    seen.add(key);
    list.push([id, title, level, subjectFromCip(r.cip, title), 0, 0, ""]);
  }
  universities.usa = uni;
  courses.usa = list;
  return { universities: uni.length, courses: list.length, files: urls };
}

// ---------------------------------------------------------------------------
// UK: Discover Uni dataset
// ---------------------------------------------------------------------------

async function uk() {
  try {
    return await discoverUni();
  } catch (error) {
    log("Discover Uni unavailable, using the register of student sponsors:", error.message);
    const info = await ukSponsors();
    return { ...info, coursesFrom: "none", discoverUniError: String(error.message).slice(0, 300) };
  }
}

/** UK universities and colleges licensed to teach international students (GOV.UK, Open Government Licence). */
async function ukSponsors() {
  const page = await getJson("https://www.gov.uk/api/content/government/publications/register-of-licensed-sponsors-students");
  const att = (page.details?.attachments ?? []).find((a) => /csv/i.test(a.content_type || a.url));
  if (!att) throw new Error("Student sponsor register: no CSV attachment");
  const file = await download(att.url, "uk-sponsors.csv");
  const { rows } = await readTable(
    file,
    { name: ["Sponsor Name", "Organisation Name"], city: ["Town/City"], type: ["Sponsor Type"], route: ["Route"], status: ["Status"] },
    ["name", "type", "route"],
    "Student sponsor register",
  );
  const rank = { "higher education institution (hei)": 3, "embedded college offering pathway courses": 2, "publicly funded college": 1, "private provider": 1 };
  const byId = new Map();
  for (const r of rows) {
    if (r.route.toLowerCase() !== "student") continue;
    const k = rank[r.type.toLowerCase()];
    if (!k) continue; // schools and overseas universities
    const name = clean(r.name);
    const id = `uk-s-${norm(name).slice(0, 34)}`;
    if (byId.has(id)) continue;
    const city = clean(r.city);
    byId.set(id, { i: id, n: name, c: "uk", r: "", t: /^various$/i.test(city) ? "" : titleCase(city), w: "", k: k * 1000 + (/universit/i.test(name) ? 500 : 0) });
  }
  if (byId.size < 100) throw new Error(`Student sponsor register: only ${byId.size} sponsors`);
  universities.uk = [...byId.values()];
  courses.uk = [];
  return { universities: byId.size, courses: 0, file: att.url };
}

async function discoverUni() {
  const page = await getText("https://www.hesa.ac.uk/kisdata", { headers: { accept: "text/html" } });
  const zips = [...page.matchAll(/href="([^"]+\.zip)"/gi)].map((m) => new URL(m[1], "https://www.hesa.ac.uk/").toString());
  if (!zips.length) throw new Error("Discover Uni: no zip link on hesa.ac.uk/kisdata");
  const files = unzip(await download(zips[0], "discover-uni.zip"), path.join(TMP, "discover-uni"));
  const find = (name) => files.find((f) => path.basename(f).toUpperCase() === name);
  const instCsv = find("INSTITUTION.CSV");
  const courseCsv = find("KISCOURSE.CSV");
  const aimCsv = find("KISAIM.CSV");
  if (!instCsv || !courseCsv) throw new Error(`Discover Uni: files not found. Got ${files.map((f) => path.basename(f)).join(", ")}`);

  const inst = await readTable(
    instCsv,
    { ukprn: ["PUBUKPRN", "UKPRN"], legal: ["LEGAL_NAME"], trading: ["FIRST_TRADING_NAME"], url: ["PROVURL"], country: ["COUNTRY"] },
    ["ukprn"],
    "Discover Uni institutions",
  );
  const aims = new Map();
  if (aimCsv) {
    const a = await readTable(aimCsv, { code: ["KISAIMCODE", "KISAIM"], label: ["KISAIMLABEL"] }, ["code", "label"], "Discover Uni aims");
    a.rows.forEach((r) => aims.set(r.code, r.label));
  }
  const crs = await readTable(
    courseCsv,
    {
      ukprn: ["PUBUKPRN"], id: ["KISCOURSEID"], mode: ["KISMODE"], title: ["TITLE"], aim: ["KISAIMCODE", "KISAIM"], label: ["KISAIMLABEL"],
      stages: ["NUMSTAGE"], url: ["CRSEURL"], distance: ["DISTANCE"], honours: ["HONOURS"],
    },
    ["ukprn", "title"],
    "Discover Uni courses",
  );
  const nations = { XF: "England", XG: "Northern Ireland", XH: "Scotland", XI: "Wales", E: "England", N: "Northern Ireland", S: "Scotland", W: "Wales" };
  const levelOf = (label) => {
    const l = String(label || "").trim();
    if (/^M/i.test(l)) return "master"; // integrated master's, e.g. MEng, MSci
    if (/^(Fd|HND|HNC|DipHE|CertHE|Dip|Cert)/i.test(l)) return "diploma";
    return "bachelor";
  };
  const list = [];
  const count = new Map();
  const seen = new Set();
  for (const c of crs.rows) {
    if (c.mode && !["1", "3"].includes(c.mode)) continue; // full-time (or full and part time)
    if (c.distance === "1") continue; // distance learning only
    const id = `uk-${c.ukprn}`;
    const label = c.label || aims.get(c.aim) || "";
    const title = clean(`${clean(c.title)}${label ? ` ${label}${c.honours === "1" && !/hons/i.test(label) ? " (Hons)" : ""}` : ""}`);
    const key = `${id}|${title}`;
    if (!clean(c.title) || seen.has(key)) continue;
    seen.add(key);
    const years = num(c.stages);
    list.push([id, title, levelOf(label), subjectFromTitle(c.title), years ? Math.round(years * 12) : 0, 0, website(c.url)]);
    count.set(id, (count.get(id) || 0) + 1);
  }
  const uni = [];
  for (const i of inst.rows) {
    const id = `uk-${i.ukprn}`;
    if (!count.get(id)) continue;
    uni.push({ i: id, n: clean(i.trading || i.legal), c: "uk", r: nations[i.country] || "", t: "", w: website(i.url), k: count.get(id), cur: "GBP" });
  }
  // A provider can appear more than once; keep the first
  const byId = new Map();
  uni.forEach((u) => byId.has(u.i) || byId.set(u.i, u));
  universities.uk = [...byId.values()];
  courses.uk = list.filter((c) => byId.has(c[0]));
  return { universities: universities.uk.length, courses: courses.uk.length, file: zips[0], header: crs.header.slice(0, 40) };
}

// ---------------------------------------------------------------------------
// Canada: IRCC designated learning institutions (post-secondary)
// ---------------------------------------------------------------------------

const decode = (s) =>
  String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;|&#8217;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/&ocirc;/g, "ô")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/\s+/g, " ")
    .trim();

async function canada() {
  const json = await getJson("https://www.canada.ca/content/dam/ircc/documents/json/dli/dli-full-list.json", { headers: { accept: "application/json" } });
  const rows = json.data ?? json;
  const byKey = new Map();
  for (const r of rows) {
    const name = decode(r.Institution);
    const dli = clean(r["DLI #"]).toUpperCase();
    if (!name || !/^O\d+/.test(dli)) continue;
    const u = byKey.get(dli) || { i: `ca-${dli}`, n: name, c: "canada", r: clean(r.Province), t: decode(r.City), w: "", k: 0 };
    u.k += 1; // campuses
    if (/^yes/i.test(r.PGWP || "")) u.p = 1;
    if (/public/i.test(r["Public/Private"] || "")) u.pub = 1;
    byKey.set(dli, u);
  }
  if (byKey.size < 100) throw new Error(`IRCC DLI list: only ${byKey.size} institutions`);
  // Public institutions and those with work-permit-eligible programmes first
  universities.canada = [...byKey.values()].map((u) => ({ ...u, k: (u.pub ? 1000 : 0) + (u.p ? 500 : 0) + u.k }));
  return { universities: byKey.size };
}

// ---------------------------------------------------------------------------
// New Zealand and Europe: Wikidata (CC0)
// ---------------------------------------------------------------------------

const EUROPE = {
  Q183: "Germany", Q142: "France", Q27: "Ireland", Q55: "Netherlands", Q29: "Spain", Q38: "Italy", Q34: "Sweden", Q33: "Finland", Q35: "Denmark",
  Q20: "Norway", Q36: "Poland", Q40: "Austria", Q31: "Belgium", Q39: "Switzerland", Q45: "Portugal", Q213: "Czech Republic", Q28: "Hungary",
  Q37: "Lithuania", Q211: "Latvia", Q191: "Estonia", Q233: "Malta", Q229: "Cyprus", Q41: "Greece", Q214: "Slovakia", Q215: "Slovenia",
  Q224: "Croatia", Q218: "Romania", Q219: "Bulgaria", Q32: "Luxembourg", Q189: "Iceland",
};

async function wikidata(countryQid, classes) {
  const query = `SELECT ?u ?uLabel ?cityLabel ?website ?students WHERE {
  VALUES ?class { ${classes.map((c) => `wd:${c}`).join(" ")} }
  ?u wdt:P31 ?type . ?type wdt:P279* ?class .
  ?u wdt:P17 wd:${countryQid} .
  ?u wdt:P856 ?website .
  FILTER NOT EXISTS { ?u wdt:P576 ?ended }
  OPTIONAL { ?u wdt:P131 ?city }
  OPTIONAL { ?u wdt:P2196 ?students }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;
  const res = await getJson(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`, { headers: { accept: "application/sparql-results+json" } });
  const byId = new Map();
  for (const b of res.results.bindings) {
    const qid = b.u.value.split("/").pop();
    const name = b.uLabel?.value || "";
    if (!name || /^Q\d+$/.test(name)) continue;
    const u = byId.get(qid) || { qid, n: name, t: "", w: "", k: 0 };
    if (!u.t && b.cityLabel?.value && !/^Q\d+$/.test(b.cityLabel.value)) u.t = b.cityLabel.value;
    if (!u.w && b.website?.value) u.w = b.website.value;
    u.k = Math.max(u.k, Math.round(num(b.students?.value)));
    byId.set(qid, u);
  }
  return [...byId.values()];
}

const UNIVERSITY = "Q3918";
const APPLIED_SCIENCES = "Q1371037";

async function newZealand() {
  const list = await wikidata("Q664", [UNIVERSITY]);
  universities["new-zealand"] = list.map((u) => ({ i: `nz-${u.qid}`, n: u.n, c: "new-zealand", r: "", t: u.t, w: u.w, k: u.k }));
  return { universities: list.length };
}

async function europe() {
  const out = [];
  const counts = {};
  for (const [qid, name] of Object.entries(EUROPE)) {
    try {
      const list = await wikidata(qid, [UNIVERSITY, APPLIED_SCIENCES]);
      counts[name] = list.length;
      list.forEach((u) => out.push({ i: `eu-${u.qid}`, n: u.n, c: "europe", r: name, t: u.t, w: u.w, k: u.k }));
    } catch (e) {
      counts[name] = `failed: ${e.message}`;
    }
    await new Promise((r) => setTimeout(r, 1200)); // be polite to the public endpoint
  }
  const byId = new Map();
  out.forEach((u) => byId.has(u.i) || byId.set(u.i, u));
  if (byId.size < 100) throw new Error(`Wikidata Europe: only ${byId.size} universities`);
  universities.europe = [...byId.values()];
  return { universities: byId.size, byCountry: counts };
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

await source("australia", ["australia"], true, australia);
await source("usa", ["usa"], true, usa);
await source("uk", ["uk"], true, uk);
await source("canada", ["canada"], false, canada);
await source("new-zealand", ["new-zealand"], false, newZealand);
await source("europe", ["europe"], false, europe);

const all = Object.values(universities)
  .flat()
  .filter((u) => u.n)
  .map((u) => Object.fromEntries(Object.entries(u).filter(([, v]) => v !== undefined && v !== "" && v !== 0)));
all.sort((a, b) => a.c.localeCompare(b.c) || (b.k || 0) - (a.k || 0) || a.n.localeCompare(b.n));

const ok = Object.values(report.sources).some((s) => s.ok);
if (!ok) {
  console.error("[catalogue] every source failed; leaving the catalogue unchanged");
  writeFileSync(path.join(OUT, "last-run.json"), JSON.stringify(report, null, 2) + "\n");
  process.exit(1);
}

writeFileSync(path.join(OUT, "universities.json"), JSON.stringify({ generatedAt: report.generatedAt, items: all }) + "\n");
for (const [country, list] of Object.entries(courses)) {
  list.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
  writeFileSync(path.join(OUT, `courses-${country}.json`), JSON.stringify({ generatedAt: report.generatedAt, items: list }) + "\n");
}
report.counts = Object.fromEntries(
  Object.keys(universities).map((c) => [c, { universities: all.filter((u) => u.c === c).length, courses: courses[c]?.length ?? 0 }]),
);
writeFileSync(path.join(OUT, "sources.json"), JSON.stringify(report, null, 2) + "\n");
writeFileSync(path.join(OUT, "last-run.json"), JSON.stringify(report, null, 2) + "\n");
log("done", JSON.stringify(report.counts));
