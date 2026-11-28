import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import { Listing, ListingSkeleton } from "@/components/finder/Listing";
import { PageHero } from "@/components/pages/PageHero";
import { catalogueSummary, SOURCES } from "@/lib/catalogue";
import { getSiteContent } from "@/lib/content";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Course finder: universities and courses abroad",
  description:
    "Compare universities and courses in the UK, Australia, the USA, Canada, New Zealand and Europe by degree, subject, location and tuition in rupees. Check your eligibility and apply free with Edusphere Overseas.",
};

const fmt = (n: number) => n.toLocaleString("en-IN");

export default async function CourseFinderPage({ searchParams }: PageProps<"/course-finder">) {
  const c = await getSiteContent();
  if (!c.sections.courseFinder) notFound();
  const { total, updated, counts } = await catalogueSummary();
  const sources = SOURCES.filter((s) => !s.ifCoursesIn || (counts[s.ifCoursesIn]?.courses ?? 0) > 0);

  return (
    <>
      <PageHero
        eyebrow="Study abroad"
        crumbs={[{ href: "/course-finder", label: "Course finder" }]}
        title={
          <>
            Find your <span className="text-teal-light">university</span>
          </>
        }
        intro={`Compare ${fmt(total.universities)} universities and colleges and ${fmt(total.courses)} courses by degree, subject, location and tuition in rupees. Check your eligibility, then apply free: your counsellor takes it from there.`}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/check-eligibility" className="inline-flex items-center justify-center gap-2 rounded-full bg-teal px-6 py-3.5 font-semibold text-white transition hover:bg-teal-light">
            <ClipboardCheck className="h-4.5 w-4.5" aria-hidden="true" />
            Check my eligibility
          </Link>
          <Link href="/apply" className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/5">
            Apply to a university
            <ArrowRight className="h-4.5 w-4.5" aria-hidden="true" />
          </Link>
        </div>
      </PageHero>
      <section className="bg-mist py-10 text-ink scheme-light sm:py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Suspense fallback={<ListingSkeleton />}>
            <Results searchParams={searchParams} />
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
            <li>Exchange rates: European Central Bank reference rates, via Frankfurter</li>
          </ul>
        </div>
      </section>
    </>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/course-finder">["searchParams"] }) {
  return <Listing sp={await searchParams} basePath="/course-finder" />;
}
