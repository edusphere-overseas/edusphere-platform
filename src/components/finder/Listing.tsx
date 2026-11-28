import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Info, PencilLine, Search, SearchX, Sparkles, X } from "lucide-react";
import { CourseCard, Flag, UniversityCard } from "@/components/finder/Cards";
import { FilterForm, MobileFilters } from "@/components/finder/FilterForm";
import {
  applyHref,
  CATALOGUE_COUNTRIES,
  countryInfo,
  eligibilityHref,
  FEE_BUCKETS,
  FINDER_SORTS,
  getUniversity,
  LEVELS,
  levelShort,
  listCourses,
  listUniversities,
  locationLabel,
  normaliseFilters,
  SUBJECTS,
  type Facets,
  type FinderSort,
} from "@/lib/catalogue";
import { countryShort } from "@/lib/eligibility";

const PER_PAGE = 20;
const fmt = (n: number) => n.toLocaleString("en-IN");
type Params = Record<string, string | string[] | undefined>;

const many = (sp: Params, k: string, max = 12) =>
  ([] as string[])
    .concat(sp[k] ?? [])
    .flatMap((v) => v.split(","))
    .map((v) => v.trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, max);
const one = (sp: Params, k: string, max = 80) => (many(sp, k, 1)[0] ?? "").slice(0, max);

const LOCATION_WORD: Record<string, string> = { uk: "City", "new-zealand": "City", europe: "Country", canada: "Province", usa: "State", australia: "State" };

/**
 * The finder's listing: a filter column, then cards with "Know more", "Check eligibility" and
 * "Apply". Used by the course finder and each country's universities page (`fixedCountry`).
 */
export async function Listing({ sp, basePath, fixedCountry }: { sp: Params; basePath: string; fixedCountry?: string }) {
  const uni = one(sp, "u", 40) ? await getUniversity(one(sp, "u", 40)) : null;
  const f = await normaliseFilters({
    q: one(sp, "q"),
    country: fixedCountry ?? one(sp, "country"),
    levels: many(sp, "level"),
    subjects: many(sp, "subject"),
    locations: many(sp, "loc", 20),
    fee: one(sp, "fee"),
    types: many(sp, "type"),
  });
  const sort = (FINDER_SORTS.some((s) => s.id === one(sp, "sort")) ? one(sp, "sort") : "recommended") as FinderSort;
  const view = f.courseData && (one(sp, "view") === "courses" || uni) ? "courses" : "universities";
  const page = Math.min(Math.max(1, Number.parseInt(one(sp, "page")) || 1), 500);
  const offset = (page - 1) * PER_PAGE;

  const res =
    view === "courses"
      ? await listCourses({ ...f, university: uni?.id }, { sort, offset, limit: PER_PAGE })
      : await listUniversities(f, { sort, offset, limit: PER_PAGE });
  const pages = Math.ceil(res.total / PER_PAGE);
  const facets = res.facets;
  const info = f.country ? countryInfo(f.country) : null;

  // Links that keep the current filters
  const state: Record<string, string | string[]> = {
    q: f.q,
    country: fixedCountry ? "" : f.country,
    level: f.levels,
    subject: f.subjects,
    loc: f.locations,
    fee: f.fee,
    type: f.types,
    sort: sort === "recommended" ? "" : sort,
    view: view === "courses" ? "courses" : "",
    u: uni && view === "courses" ? uni.id : "",
  };
  const link = (over: Record<string, string | string[] | number | undefined> = {}) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...state, ...over })) for (const x of ([] as (string | number | undefined)[]).concat(v)) if (x !== undefined && x !== "") p.append(k, String(x));
    const s = p.toString();
    return `${basePath}${s ? `?${s}` : ""}`;
  };
  const without = (k: string, v?: string) => link({ [k]: v === undefined ? "" : ([] as string[]).concat(state[k]).filter((x) => x !== v), page: undefined });

  const chips: { label: string; href: string }[] = [
    ...(f.country && !fixedCountry ? [{ label: info!.short, href: without("country") }] : []),
    ...f.levels.map((l) => ({ label: levelShort(l), href: without("level", l) })),
    ...f.subjects.map((s) => ({ label: SUBJECTS.find((x) => x.id === s)?.short ?? s, href: without("subject", s) })),
    ...f.locations.map((l) => ({ label: locationLabel(f.country, l), href: without("loc", l) })),
    ...(f.fee ? [{ label: FEE_BUCKETS.find((b) => b.id === f.fee)!.label, href: without("fee") }] : []),
    ...f.types.map((t) => ({ label: t === "public" ? "Public" : "Private", href: without("type", t) })),
    ...(uni && view === "courses" ? [{ label: `At ${uni.name}`, href: without("u") }] : []),
  ];
  const clearAll = fixedCountry ? basePath : f.country ? `${basePath}?country=${f.country}` : basePath;

  const where = f.locations.length === 1 ? `${locationLabel(f.country, f.locations[0])}, ${info?.short}` : info ? countryShort(info.id) : "abroad";
  const heading = `${view === "courses" ? "Courses" : "Universities"} in ${where}${f.levels.length === 1 ? ` for ${levelShort(f.levels[0])}` : ""}${
    f.subjects.length === 1 ? ` in ${SUBJECTS.find((s) => s.id === f.subjects[0])?.short}` : ""
  }`;
  const level = f.levels.length === 1 ? f.levels[0] : undefined;
  // Inputs start from the address each time it changes (a removed chip unticks its box)
  const key = JSON.stringify(state);

  return (
    <FilterForm action={basePath} defaults={{ sort: "recommended", view: "universities" }}>
      {view === "courses" && <input type="hidden" name="view" value="courses" />}
      {uni && view === "courses" && <input type="hidden" name="u" value={uni.id} />}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-deep sm:text-3xl">{heading}</h2>
          <p className="mt-1.5 text-sm text-slate" aria-live="polite">
            {fmt(res.total)} {view === "courses" ? (res.total === 1 ? "course" : "courses") : res.total === 1 ? "university" : "universities"}
            {pages > 1 && ` · page ${page} of ${fmt(pages)}`}
          </p>
        </div>
        {f.courseData && (
          <nav aria-label="Show universities or courses" className="flex gap-1 rounded-full bg-white p-1 ring-1 ring-deep/10">
            {(["universities", "courses"] as const).map((v) => (
              <Link
                key={v}
                href={link({ view: v === "courses" ? "courses" : "", u: undefined, page: undefined, sort: v === view ? state.sort : "" })}
                aria-current={view === v ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${view === v ? "bg-deep text-white" : "text-slate hover:text-deep"}`}
              >
                {v}
              </Link>
            ))}
          </nav>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8">
        <aside aria-label="Filters" className="lg:sticky lg:top-24">
          <MobileFilters count={chips.length}>
            <Filters key={key} f={f} facets={facets} fixedCountry={fixedCountry} chips={chips} clearAll={clearAll} view={view} />
          </MobileFilters>
        </aside>

        <div className="min-w-0 transition-opacity group-data-[pending]/finder:opacity-50">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative min-w-0 flex-1 basis-64">
              <span className="sr-only">{view === "courses" ? "Search courses" : "Search universities"}</span>
              <Search className="pointer-events-none absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-slate" aria-hidden="true" />
              <input
                key={key}
                type="search"
                name="q"
                defaultValue={f.q}
                maxLength={80}
                placeholder={view === "courses" ? "Search courses, e.g. data science" : "Search by university or city"}
                className="w-full rounded-full border border-slate/25 bg-white py-3 pr-24 pl-11 text-[0.95rem] text-ink outline-none placeholder:text-slate/60 focus:border-teal focus:ring-3 focus:ring-teal/20"
              />
              <button type="submit" className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-navy">
                Search
              </button>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate">
              <span className="whitespace-nowrap">Sort by</span>
              <select key={key} name="sort" defaultValue={sort} className="rounded-full border border-slate/25 bg-white py-2.5 pr-8 pl-4 text-sm font-semibold text-deep outline-none focus:border-teal">
                {FINDER_SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {chips.length > 0 && (
            <ul className="mt-4 flex flex-wrap items-center gap-2" aria-label="Filters in use">
              {chips.map((c) => (
                <li key={c.href + c.label}>
                  <Link href={c.href} scroll={false} className="inline-flex items-center gap-1.5 rounded-full bg-deep/6 py-1.5 pr-2.5 pl-3.5 text-sm font-semibold text-deep hover:bg-deep/10">
                    {c.label}
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">(remove)</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link href={clearAll} scroll={false} className="px-2 text-sm font-semibold text-teal hover:text-navy">
                  Clear all
                </Link>
              </li>
            </ul>
          )}

          {info && !f.courseData && (
            <p className="mt-4 flex items-start gap-3 rounded-2xl bg-white p-4 text-sm leading-relaxed text-slate ring-1 ring-deep/8">
              <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-teal" aria-hidden="true" />
              The official open data for {countryShort(info.id)} lists universities and colleges but not their courses yet. Choose a university, then check your eligibility or
              apply and tell us your course.
            </p>
          )}

          <Link
            href={eligibilityHref({ country: f.country || undefined, level })}
            className="mt-4 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-deep to-navy p-4 text-white transition hover:to-teal sm:p-5"
          >
            <Sparkles className="h-6 w-6 shrink-0 text-teal-light" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block font-bold">Not sure where you&apos;d get in?</span>
              <span className="block text-sm text-white/75">Check your eligibility in two minutes, free.</span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
          </Link>

          {res.total === 0 ? (
            <div className="mt-6 flex flex-col items-start gap-4 rounded-3xl border border-dashed border-slate/30 bg-white p-8">
              <SearchX className="h-8 w-8 text-teal" aria-hidden="true" />
              <h3 className="text-xl font-extrabold text-deep">Nothing matches these filters</h3>
              <p className="max-w-2xl leading-relaxed text-slate">
                Try removing a filter or searching for something else. We&apos;re partnered with almost every university, including many that aren&apos;t in these lists, so you can
                also apply and type the university&apos;s name.
              </p>
              <Link href={applyHref({ country: f.country || undefined, level })} className="inline-flex items-center gap-2 rounded-full bg-teal px-5 py-3 font-semibold text-white hover:bg-navy">
                Apply anyway
                <ArrowRight className="h-4.5 w-4.5" aria-hidden="true" />
              </Link>
            </div>
          ) : view === "courses" ? (
            <ul className="mt-6 grid grid-cols-1 gap-3">
              {res.items.map((h, i) =>
                "c" in h ? <CourseCard key={`${h.c.university.id}-${h.c.title}-${h.c.level}-${i}`} hit={h} /> : null,
              )}
            </ul>
          ) : (
            <ul className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
              {res.items.map((h) => ("u" in h ? <UniversityCard key={h.u.id} hit={h} level={level} /> : null))}
            </ul>
          )}

          {pages > 1 && <Pagination page={page} pages={pages} href={(p) => link({ page: p === 1 ? undefined : p })} />}

          <p className="mt-8 text-xs leading-relaxed text-slate">
            Tuition is indicative: the typical first-year fee in the official data, in rupees at this month&apos;s exchange rate. For the USA it is the published out-of-state
            undergraduate tuition; graduate fees differ. Your counsellor confirms fees and entry requirements with the university.
          </p>

          <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-3xl bg-white p-6 ring-1 ring-deep/8 sm:flex-row sm:items-center sm:p-8">
            <div>
              <h3 className="text-xl font-extrabold text-deep">University not in the list?</h3>
              <p className="mt-1.5 max-w-2xl leading-relaxed text-slate">We&apos;re partnered with almost every university. Apply and type its name: your counsellor does the rest.</p>
            </div>
            <Link href={applyHref({ country: f.country || undefined })} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-deep px-5 py-3 font-semibold text-white hover:bg-navy">
              <PencilLine className="h-4.5 w-4.5" aria-hidden="true" />
              Apply for another university
            </Link>
          </div>
        </div>
      </div>
    </FilterForm>
  );
}

function Filters({
  f,
  facets,
  fixedCountry,
  chips,
  clearAll,
  view,
}: {
  f: Awaited<ReturnType<typeof normaliseFilters>>;
  facets: Facets;
  fixedCountry?: string;
  chips: unknown[];
  clearAll: string;
  view: string;
}) {
  const unit = view === "courses" ? "courses" : "universities";
  const locations = Object.entries(facets.location)
    .sort((a, b) => b[1] - a[1])
    .map(([value, n]) => ({ value, n, label: locationLabel(f.country, value) }));
  const selectedLoc = new Set(f.locations);
  const shownLoc = [...locations.filter((l) => selectedLoc.has(l.value)), ...locations.filter((l) => !selectedLoc.has(l.value))];
  const hasFees = Object.values(facets.fee).some((n) => n > 0) || !!f.fee;
  const hasTypes = (facets.type.public ?? 0) + (facets.type.private ?? 0) > 0 || f.types.length > 0;

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 ring-1 ring-deep/8">
        <p className="font-extrabold text-deep">Filters</p>
        {chips.length > 0 && (
          <Link href={clearAll} scroll={false} className="text-sm font-semibold text-teal hover:text-navy">
            Clear all
          </Link>
        )}
      </div>

      {!fixedCountry && (
        <Group title="Country">
          <Option type="radio" name="country" value="" checked={!f.country} label="All countries" />
          {CATALOGUE_COUNTRIES.map((c) => (
            <Option key={c.id} type="radio" name="country" value={c.id} checked={f.country === c.id} label={c.name} count={facets.country[c.id] ?? 0} unit={unit} flag={c.id} />
          ))}
        </Group>
      )}

      {f.courseData && (
        <Group title="Degree">
          {LEVELS.map((l) => (
            <Option key={l.id} type="checkbox" name="level" value={l.id} checked={f.levels.includes(l.id)} label={l.short} count={facets.level[l.id] ?? 0} unit={unit} />
          ))}
        </Group>
      )}

      {f.courseData && (
        <Group title="Subject" scroll>
          {SUBJECTS.map((s) => (
            <Option key={s.id} type="checkbox" name="subject" value={s.id} checked={f.subjects.includes(s.id)} label={s.short} count={facets.subject[s.id] ?? 0} unit={unit} />
          ))}
        </Group>
      )}

      {f.country && shownLoc.length > 1 && (
        <Group title={LOCATION_WORD[f.country] ?? "Location"} scroll>
          {shownLoc.slice(0, 60).map((l) => (
            <Option key={l.value} type="checkbox" name="loc" value={l.value} checked={selectedLoc.has(l.value)} label={l.label} count={l.n} unit={unit} />
          ))}
        </Group>
      )}

      {hasFees && (
        <Group title="First-year tuition">
          <Option type="radio" name="fee" value="" checked={!f.fee} label="Any" />
          {FEE_BUCKETS.map((b) => (
            <Option key={b.id} type="radio" name="fee" value={b.id} checked={f.fee === b.id} label={b.label} count={facets.fee[b.id] ?? 0} unit={unit} />
          ))}
        </Group>
      )}

      {hasTypes && (
        <Group title="Type">
          {(["public", "private"] as const).map((t) => (
            <Option key={t} type="checkbox" name="type" value={t} checked={f.types.includes(t)} label={t === "public" ? "Public" : "Private"} count={facets.type[t] ?? 0} unit={unit} />
          ))}
        </Group>
      )}

      <noscript>
        <button type="submit" className="w-full rounded-full bg-teal px-5 py-3 font-semibold text-white">
          Apply filters
        </button>
      </noscript>
    </div>
  );
}

function Group({ title, scroll, children }: { title: string; scroll?: boolean; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-2xl bg-white px-4 py-3.5 ring-1 ring-deep/8">
      <legend className="sr-only">{title}</legend>
      <p aria-hidden="true" className="mb-2 text-sm font-extrabold text-deep">
        {title}
      </p>
      <div className={`grid gap-0.5 ${scroll ? "max-h-64 overflow-y-auto overscroll-contain pr-1" : ""}`}>{children}</div>
    </fieldset>
  );
}

function Option({
  type,
  name,
  value,
  checked,
  label,
  count,
  unit,
  flag,
}: {
  type: "radio" | "checkbox";
  name: string;
  value: string;
  checked: boolean;
  label: string;
  count?: number;
  unit?: string;
  flag?: string;
}) {
  const empty = count === 0 && !checked;
  return (
    <label className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm hover:bg-mist ${empty ? "text-slate/60" : "text-deep"}`}>
      <input type={type} name={name} value={value} defaultChecked={checked} className="h-4 w-4 shrink-0 accent-teal" />
      {flag && <Flag country={flag} />}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-slate tabular-nums">
          {fmt(count)}
          <span className="sr-only"> {unit}</span>
        </span>
      )}
    </label>
  );
}

function Pagination({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  const nums = [...new Set([1, page - 1, page, page + 1, pages].filter((p) => p >= 1 && p <= pages))].sort((a, b) => a - b);
  const item = "grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-semibold";
  return (
    <nav aria-label="Pages" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 && (
        <Link href={href(page - 1)} className={`${item} text-deep ring-1 ring-slate/25 hover:bg-white`} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
      {nums.map((p, i) => (
        <span key={p} className="contents">
          {i > 0 && p - nums[i - 1] > 1 && <span className="px-1 text-slate">…</span>}
          {p === page ? (
            <span aria-current="page" className={`${item} bg-deep text-white`}>
              {fmt(p)}
            </span>
          ) : (
            <Link href={href(p)} className={`${item} text-deep ring-1 ring-slate/25 hover:bg-white`}>
              {fmt(p)}
            </Link>
          )}
        </span>
      ))}
      {page < pages && (
        <Link href={href(page + 1)} className={`${item} text-deep ring-1 ring-slate/25 hover:bg-white`} aria-label="Next page">
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
}

export function ListingSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="h-9 w-2/3 animate-pulse rounded-xl bg-deep/8" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[17rem_1fr]">
        <div className="hidden h-[32rem] animate-pulse rounded-2xl bg-white lg:block" />
        <div className="grid gap-4 xl:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-60 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}
