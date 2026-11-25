import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Info, PencilLine, SearchX, X } from "lucide-react";
import { FinderForm } from "@/components/finder/FinderForm";
import { CourseRow, UniversityRow } from "@/components/finder/Rows";
import { PageHero } from "@/components/pages/PageHero";
import {
  applyHref,
  CATALOGUE_COUNTRIES,
  catalogueSummary,
  countryInfo,
  getUniversity,
  isCountry,
  LEVELS,
  searchCourses,
  searchUniversities,
  SOURCES,
  SUBJECTS,
} from "@/lib/catalogue";
import { getSiteContent } from "@/lib/content";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Course finder",
  description:
    "Search courses and universities in the UK, Australia, the USA, Canada, New Zealand and Europe, and apply with free guidance from Edusphere Overseas.",
};

const PER_PAGE = 20;
const fmt = (n: number) => n.toLocaleString("en-IN");

export default async function CourseFinderPage({ searchParams }: PageProps<"/course-finder">) {
  const c = await getSiteContent();
  if (!c.sections.courseFinder) notFound();
  const { total, updated, counts } = await catalogueSummary();
  const sources = SOURCES.filter((s) => !s.ifCoursesIn || (counts[s.ifCoursesIn]?.courses ?? 0) > 0);

  return (
    <>
      <PageHero
        eyebrow="Course finder"
        crumbs={[{ href: "/course-finder", label: "Course finder" }]}
        title={
          <>
            Find your <span className="text-teal-light">course</span>
          </>
        }
        intro={`Search ${fmt(total.courses)} courses and ${fmt(total.universities)} universities and colleges, from official open data. Found the one? Apply in two minutes, and your counsellor takes it from there.`}
      />
      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Suspense fallback={<FinderSkeleton />}>
            <Finder searchParams={searchParams} />
          </Suspense>
        </div>
      </section>
      <section className="border-t border-white/8 bg-deeper py-10">
        <div className="mx-auto max-w-7xl px-5 text-sm leading-relaxed text-white/55 sm:px-8">
          <h2 className="font-bold text-white/80">Where this data comes from</h2>
          <p className="mt-2 max-w-3xl">
            Course and university details come from official open data, refreshed every month{updated ? ` (last update ${formatDate(updated)})` : ""}. Courses, fees and
            entry requirements change, so your counsellor confirms the details with the university before you apply.
          </p>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {sources.map((s) => (
              <li key={s.name}>
                {s.country}:{" "}
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-white/75 underline-offset-2 hover:underline">
                  {s.name}
                </a>
                , {s.publisher} ({s.licence})
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

function FinderSkeleton() {
  return (
    <div className="grid gap-4" aria-hidden="true">
      <div className="h-20 animate-pulse rounded-3xl bg-white/[0.05]" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/[0.04]" />
      ))}
    </div>
  );
}

async function Finder({ searchParams }: { searchParams: PageProps<"/course-finder">["searchParams"] }) {
  const sp = await searchParams;
  const one = (k: string, max = 80) => (typeof sp[k] === "string" ? (sp[k] as string).trim().slice(0, max) : "");
  const q = one("q");
  const country = isCountry(one("country")) ? one("country") : "";
  const level = LEVELS.some((l) => l.id === one("level")) ? one("level") : "";
  const subject = SUBJECTS.some((s) => s.id === one("subject")) ? one("subject") : "";
  const uni = one("u", 40) ? await getUniversity(one("u", 40)) : null;
  const info = country ? countryInfo(country) : null;
  const { counts } = await catalogueSummary();
  const hasCourses = (id: string) => (counts[id]?.courses ?? 0) > 0;
  const coursesHere = country ? hasCourses(country) : Object.keys(counts).some(hasCourses);
  const view = !coursesHere || one("view") === "universities" ? "universities" : "courses";
  const page = Math.min(Math.max(1, Number.parseInt(one("page", 4)) || 1), 500);
  const offset = (page - 1) * PER_PAGE;

  const [courses, universities] = await Promise.all([
    coursesHere ? searchCourses({ q, country: country || undefined, level, subject, university: uni?.id, limit: view === "courses" ? PER_PAGE : 0, offset }) : { total: 0, items: [] },
    searchUniversities({ q, country: country || undefined, limit: view === "universities" ? PER_PAGE : 0, offset }),
  ]);
  const result = view === "courses" ? courses : universities;
  const pages = Math.ceil(result.total / PER_PAGE);

  const link = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const all = { q, country, level, subject, u: uni?.id, view, page: undefined, ...over } as Record<string, string | number | undefined>;
    for (const [k, v] of Object.entries(all)) if (v !== undefined && v !== "" && !(k === "view" && v === "courses") && !(k === "page" && v === 1)) p.set(k, String(v));
    const s = p.toString();
    return `/course-finder${s ? `?${s}` : ""}`;
  };

  return (
    <div>
      <FinderForm
        key={JSON.stringify([q, country, level, subject, view, uni?.id])}
        view={view}
        q={q}
        country={country}
        level={level}
        subject={subject}
        university={uni?.id}
        countries={CATALOGUE_COUNTRIES.map((c) => ({ id: c.id, label: c.name, courses: hasCourses(c.id) }))}
        levels={LEVELS.map((l) => ({ id: l.id, label: l.label }))}
        subjects={SUBJECTS.map((s) => ({ id: s.id, label: s.label }))}
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Show courses or universities" className="flex gap-1.5 rounded-full bg-white/[0.05] p-1 ring-1 ring-white/10">
          {coursesHere && (
            <Link
              href={link({ view: "courses", u: uni?.id })}
              aria-current={view === "courses" ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${view === "courses" ? "bg-white text-deep" : "text-white/75 hover:text-white"}`}
            >
              Courses <span className="opacity-60">{fmt(courses.total)}</span>
            </Link>
          )}
          <Link
            href={link({ view: "universities", u: undefined, level: undefined, subject: undefined })}
            aria-current={view === "universities" ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${view === "universities" ? "bg-white text-deep" : "text-white/75 hover:text-white"}`}
          >
            Universities <span className="opacity-60">{fmt(universities.total)}</span>
          </Link>
        </nav>
        {uni && view === "courses" && (
          <Link href={link({ u: undefined })} className="inline-flex items-center gap-1.5 rounded-full bg-teal/20 px-3.5 py-1.5 text-sm font-semibold text-teal-light hover:bg-teal/30">
            Courses at {uni.name}
            <X className="h-4 w-4" aria-label="Show all universities" />
          </Link>
        )}
      </div>

      {info && !coursesHere && (
        <p className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-white/70">
          <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-teal-light" aria-hidden="true" />
          We don&apos;t have an open course list for {info.name} yet, so we show its universities and colleges. Choose one and tell us your course when you apply.
        </p>
      )}

      <p className="mt-6 text-sm text-white/50" aria-live="polite">
        {result.total === 0
          ? "No matches"
          : `${fmt(result.total)} ${view === "courses" ? (result.total === 1 ? "course" : "courses") : result.total === 1 ? "university" : "universities"}${pages > 1 ? ` · page ${page} of ${fmt(pages)}` : ""}`}
      </p>

      {result.total === 0 ? (
        <div className="mt-4 flex flex-col items-start gap-4 rounded-3xl border border-dashed border-white/15 p-8">
          <SearchX className="h-8 w-8 text-teal-light/70" aria-hidden="true" />
          <h2 className="text-2xl font-extrabold text-white">Nothing matches that search</h2>
          <p className="max-w-2xl leading-relaxed text-white/65">
            Try fewer or different words, or another country. We&apos;re partnered with almost every university, including many that aren&apos;t in these lists, so you can
            also apply and type the university&apos;s name.
          </p>
          <Link href={applyHref({ country, course: view === "courses" ? q : undefined })} className="inline-flex items-center gap-2 rounded-full bg-teal px-5 py-3 font-semibold text-white hover:bg-teal-light">
            Apply anyway
            <ArrowRight className="h-4.5 w-4.5" aria-hidden="true" />
          </Link>
        </div>
      ) : view === "courses" ? (
        <ul className="mt-4 grid gap-3">
          {courses.items.map((c, i) => (
            <CourseRow key={`${c.university.id}-${c.title}-${i}`} c={c} />
          ))}
        </ul>
      ) : (
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {universities.items.map((u) => (
            <UniversityRow key={u.id} u={u} coursesLink={coursesHere && u.courses ? link({ view: "courses", u: u.id, q: "", country: u.country }) : undefined} />
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-8 flex items-center justify-center gap-3">
          {page > 1 ? (
            <Link href={link({ page: page - 1 })} className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/5">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-white/55">
            Page {page} of {fmt(pages)}
          </span>
          {page < pages && (
            <Link href={link({ page: page + 1 })} className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/5">
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </nav>
      )}

      <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-3xl bg-gradient-to-br from-teal/25 to-navy/30 p-6 ring-1 ring-white/10 sm:flex-row sm:items-center sm:p-8">
        <div>
          <h2 className="text-xl font-extrabold text-white">University not in the list?</h2>
          <p className="mt-1.5 max-w-2xl leading-relaxed text-white/70">We&apos;re partnered with almost every university. Apply and type its name: your counsellor does the rest.</p>
        </div>
        <Link href={applyHref({ country })} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-deep hover:bg-mist">
          <PencilLine className="h-4.5 w-4.5" aria-hidden="true" />
          Apply for another university
        </Link>
      </div>
    </div>
  );
}
