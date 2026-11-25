import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, PencilLine, Search } from "lucide-react";
import { UniversityRow } from "@/components/finder/Rows";
import { PageHero } from "@/components/pages/PageHero";
import { applyHref, catalogueSummary, countryInfo, searchUniversities } from "@/lib/catalogue";
import { getLibrary, getSiteContent } from "@/lib/content";
import { shortName } from "@/lib/format";

const PER_PAGE = 24;
const fmt = (n: number) => n.toLocaleString("en-IN");

export async function generateStaticParams() {
  const lib = await getLibrary();
  return lib.destinations.filter((d) => countryInfo(d.id)).map((d) => ({ slug: d.id }));
}

export async function generateMetadata({ params }: PageProps<"/destinations/[slug]/universities">): Promise<Metadata> {
  const { slug } = await params;
  const info = countryInfo(slug);
  if (!info) return {};
  return {
    title: `Universities in ${shortName(info.name)}`,
    description: `Universities and colleges in ${shortName(info.name)}: search the list and apply with free guidance from Edusphere Overseas.`,
  };
}

export default async function CountryUniversitiesPage({ params, searchParams }: PageProps<"/destinations/[slug]/universities">) {
  const { slug } = await params;
  const [lib, c, summary] = await Promise.all([getLibrary(), getSiteContent(), catalogueSummary()]);
  const d = lib.destinations.find((x) => x.id === slug);
  const info = countryInfo(slug);
  if (!d || !info) notFound();
  const name = shortName(d.name);
  const counts = summary.counts[info.id];

  return (
    <>
      <PageHero
        eyebrow="Universities"
        flag={d.flag}
        crumbs={[
          { href: "/destinations", label: "Destinations" },
          { href: `/destinations/${d.id}`, label: d.name },
          { href: `/destinations/${d.id}/universities`, label: "Universities" },
        ]}
        title={
          <>
            Universities in <span className="text-teal-light">{name}</span>
          </>
        }
        intro={`${fmt(counts.universities)} universities and colleges${counts.courses ? ` with ${fmt(counts.courses)} courses` : ""}. Choose one and apply: your counsellor handles the rest, free of charge.`}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={applyHref({ country: info.id })} className="inline-flex items-center justify-center gap-2 rounded-full bg-teal px-6 py-3.5 font-semibold text-white transition hover:bg-teal-light">
            Apply to a university
            <ArrowRight className="h-4.5 w-4.5" aria-hidden="true" />
          </Link>
          {c.sections.courseFinder && counts.courses > 0 && (
            <Link href={`/course-finder?country=${info.id}`} className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/5">
              <Search className="h-4.5 w-4.5" aria-hidden="true" />
              Search courses in {name}
            </Link>
          )}
        </div>
      </PageHero>
      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white/[0.04]" />}>
            <List country={info.id} name={name} searchParams={searchParams} coursesLink={c.sections.courseFinder && counts.courses > 0} />
          </Suspense>
        </div>
      </section>
    </>
  );
}

async function List({
  country,
  name,
  searchParams,
  coursesLink,
}: {
  country: string;
  name: string;
  searchParams: PageProps<"/destinations/[slug]/universities">["searchParams"];
  coursesLink: boolean;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const page = Math.min(Math.max(1, Number.parseInt(typeof sp.page === "string" ? sp.page : "1") || 1), 300);
  const { total, items } = await searchUniversities({ q, country, limit: PER_PAGE, offset: (page - 1) * PER_PAGE });
  const pages = Math.ceil(total / PER_PAGE);
  const base = `/destinations/${country}/universities`;
  const link = (p: number) => `${base}?${new URLSearchParams({ ...(q ? { q } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`;

  return (
    <div>
      <form action={base} method="get" role="search" className="flex flex-col gap-3 sm:flex-row" key={q}>
        <label className="relative flex-1">
          <span className="sr-only">University name or city</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-white/45" aria-hidden="true" />
          <input
            name="q"
            type="search"
            defaultValue={q}
            maxLength={80}
            placeholder={`Search universities in ${name}`}
            className="block w-full rounded-xl border-0 bg-white/[0.06] py-3 pr-4 pl-11 text-white ring-1 ring-white/12 outline-none placeholder:text-white/40 focus:ring-2 focus:ring-teal-light"
          />
        </label>
        <button type="submit" className="rounded-xl bg-teal px-6 py-3 font-semibold text-white hover:bg-teal-light">
          Search
        </button>
      </form>
      <p className="mt-6 text-sm text-white/50" aria-live="polite">
        {total === 0 ? "No matches" : `${fmt(total)} ${total === 1 ? "university" : "universities"}${pages > 1 ? ` · page ${page} of ${pages}` : ""}`}
      </p>
      {total === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-white/15 p-6 leading-relaxed text-white/70">
          Not in the list? We&apos;re partnered with almost every university.{" "}
          <Link href={applyHref({ country })} className="font-semibold text-teal-light hover:underline">
            Apply and type its name
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {items.map((u) => (
            <UniversityRow key={u.id} u={u} coursesLink={coursesLink && u.courses ? `/course-finder?country=${country}&u=${u.id}` : undefined} />
          ))}
        </ul>
      )}
      {pages > 1 && (
        <nav aria-label="Pages" className="mt-8 flex items-center justify-center gap-3">
          {page > 1 && (
            <Link href={link(page - 1)} className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/5">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </Link>
          )}
          <span className="text-sm text-white/55">
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Link href={link(page + 1)} className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/5">
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </nav>
      )}
      <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-3xl bg-gradient-to-br from-teal/25 to-navy/30 p-6 ring-1 ring-white/10 sm:flex-row sm:items-center sm:p-8">
        <div>
          <h2 className="text-xl font-extrabold text-white">University not in the list?</h2>
          <p className="mt-1.5 max-w-2xl leading-relaxed text-white/70">We&apos;re partnered with almost every university. Apply and type its name.</p>
        </div>
        <Link href={applyHref({ country })} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-deep hover:bg-mist">
          <PencilLine className="h-4.5 w-4.5" aria-hidden="true" />
          Apply for another university
        </Link>
      </div>
    </div>
  );
}
