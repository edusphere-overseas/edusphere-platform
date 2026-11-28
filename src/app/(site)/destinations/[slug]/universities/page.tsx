import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import { Listing, ListingSkeleton } from "@/components/finder/Listing";
import { PageHero } from "@/components/pages/PageHero";
import { applyHref, catalogueSummary, countryInfo, eligibilityHref } from "@/lib/catalogue";
import { getLibrary } from "@/lib/content";
import { shortName } from "@/lib/format";

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
    description: `Universities and colleges in ${shortName(info.name)}: compare tuition in rupees, check your eligibility and apply with free guidance from Edusphere Overseas.`,
  };
}

export default async function CountryUniversitiesPage({ params, searchParams }: PageProps<"/destinations/[slug]/universities">) {
  const { slug } = await params;
  const [lib, summary] = await Promise.all([getLibrary(), catalogueSummary()]);
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
        intro={`${fmt(counts.universities)} universities and colleges${counts.courses ? ` with ${fmt(counts.courses)} courses` : ""}. Check your eligibility, then apply: your counsellor handles the rest, free of charge.`}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={eligibilityHref({ country: info.id })} className="inline-flex items-center justify-center gap-2 rounded-full bg-teal px-6 py-3.5 font-semibold text-white transition hover:bg-teal-light">
            <ClipboardCheck className="h-4.5 w-4.5" aria-hidden="true" />
            Check my eligibility
          </Link>
          <Link href={applyHref({ country: info.id })} className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/5">
            Apply to a university
            <ArrowRight className="h-4.5 w-4.5" aria-hidden="true" />
          </Link>
        </div>
      </PageHero>
      <section className="bg-mist py-10 text-ink scheme-light sm:py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Suspense fallback={<ListingSkeleton />}>
            <List country={info.id} searchParams={searchParams} />
          </Suspense>
        </div>
      </section>
    </>
  );
}

async function List({ country, searchParams }: { country: string; searchParams: PageProps<"/destinations/[slug]/universities">["searchParams"] }) {
  return <Listing sp={await searchParams} basePath={`/destinations/${country}/universities`} fixedCountry={country} />;
}
