import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText } from "next-sanity";
import { ArrowLeft, CalendarClock, ExternalLink, MapPin } from "lucide-react";
import { CtaBand } from "@/components/pages/CtaBand";
import { PageHero } from "@/components/pages/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { SanityImage } from "@/components/ui/SanityImage";
import { getLibrary, getPost, getSiteContent } from "@/lib/content";
import { formatDate, formatDateTime } from "@/lib/format";
import { site } from "@/config/site";

export async function generateStaticParams() {
  const lib = await getLibrary();
  // At least one entry is needed to prerender; an unknown slug shows the 404 page.
  return lib.posts.length ? lib.posts.map((p) => ({ slug: p.slug })) : [{ slug: "welcome" }];
}

export async function generateMetadata({ params }: PageProps<"/news/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPost(slug);
  return p ? { title: p.title, description: p.summary } : {};
}

export default async function PostPage({ params }: PageProps<"/news/[slug]">) {
  const { slug } = await params;
  const [p, c] = await Promise.all([getPost(slug), getSiteContent()]);
  if (!p) notFound();
  const event = p.kind === "event";

  const ld = event
    ? {
        "@context": "https://schema.org",
        "@type": "Event",
        name: p.title,
        description: p.summary,
        startDate: p.eventStart,
        location: p.eventPlace ? { "@type": "Place", name: p.eventPlace } : undefined,
        organizer: { "@type": "Organization", name: c.companyName, url: site.url },
      }
    : {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: p.title,
        description: p.summary,
        datePublished: p.date,
        publisher: { "@type": "Organization", name: c.companyName, url: site.url },
      };

  return (
    <>
      <JsonLd data={ld} />
      <PageHero
        eyebrow={`${event ? "Event" : "News"} · ${formatDate(p.date)}`}
        crumbs={[
          { href: "/news", label: "News and events" },
          { href: `/news/${p.slug}`, label: p.title },
        ]}
        title={p.title}
        intro={p.summary}
      >
        {event && p.eventStart && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-white/85">
            <span className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-teal-light" aria-hidden="true" />
              {formatDateTime(p.eventStart)}
            </span>
            {p.eventPlace && (
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-teal-light" aria-hidden="true" />
                {p.eventPlace}
              </span>
            )}
          </div>
        )}
      </PageHero>

      <article className="py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          {p.image && (
            <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-3xl border border-white/10">
              <SanityImage photo={p.image} fill priority sizes="(min-width: 768px) 720px, 100vw" className="object-cover" />
            </div>
          )}
          {p.body && p.body.length > 0 && (
            <div className="space-y-5 text-[1.05rem] leading-[1.8] text-white/80 [&_a]:font-semibold [&_a]:text-teal-light [&_a]:underline [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-white [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-white [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc">
              <PortableText value={p.body} />
            </div>
          )}
          {p.sourceLink && (
            <a href={p.sourceLink} target="_blank" rel="noopener noreferrer" className="mt-10 inline-flex items-center gap-2 rounded-full px-4.5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/5">
              Official source
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
          <div className="mt-12 border-t border-white/10 pt-6">
            <Link href="/news" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-light hover:underline">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              All news and events
            </Link>
          </div>
        </div>
      </article>

      <CtaBand whatsapp={c.whatsappNumber} message={`Hi Edusphere, I read "${p.title}" on your website and have a question.`} />
    </>
  );
}
