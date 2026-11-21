import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { InstagramIcon } from "@/components/icons";
import { CtaBand } from "@/components/pages/CtaBand";
import { PageHero } from "@/components/pages/PageHero";
import { PostCard } from "@/components/pages/PostCard";
import { Reveal } from "@/components/ui/Reveal";
import { getLibrary, getSiteContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "News and events",
  description: "Admission and visa updates, university fairs, webinars and events from Edusphere Overseas.",
};

export default async function NewsPage() {
  const [c, lib] = await Promise.all([getSiteContent(), getLibrary()]);
  const upcoming = lib.posts.filter((p) => p.upcoming).sort((a, b) => (a.eventStart ?? "").localeCompare(b.eventStart ?? ""));
  const rest = lib.posts.filter((p) => !p.upcoming);
  const instagram = c.socialLinks.find((l) => l.platform === "instagram");

  return (
    <>
      <PageHero
        eyebrow="News and events"
        crumbs={[{ href: "/news", label: "News and events" }]}
        title={
          <>
            What&apos;s <span className="text-teal-light">new</span>
          </>
        }
        intro="Admission and visa updates, university fairs, webinars and events. We link to the official source for every rule change."
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          {upcoming.length > 0 && (
            <div className="mb-16">
              <h2 className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-[#f5c26b]">Coming up</h2>
              <div className="grid gap-5 lg:grid-cols-2">
                {upcoming.map((p) => (
                  <Reveal key={p._id} className="h-full">
                    <PostCard p={p} />
                  </Reveal>
                ))}
              </div>
            </div>
          )}

          {rest.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((p, i) => (
                <Reveal key={p._id} delay={(i % 3) * 0.06} className={`h-full ${i === 0 && !upcoming.length ? "md:col-span-2 lg:col-span-3" : ""}`}>
                  <PostCard p={p} featured={i === 0 && !upcoming.length && !!p.image} />
                </Reveal>
              ))}
            </div>
          ) : (
            upcoming.length === 0 && (
              <Reveal className="flex flex-col items-start gap-4 rounded-3xl border border-dashed border-white/15 p-8 sm:p-10">
                <Newspaper className="h-8 w-8 text-teal-light/60" aria-hidden="true" />
                <h2 className="text-2xl font-extrabold text-white">News is coming soon</h2>
                <p className="max-w-2xl leading-relaxed text-white/65">
                  We&apos;ll post admission and visa updates and upcoming events here.
                  {instagram ? " Meanwhile, follow us on Instagram for the latest." : ""}
                </p>
                {instagram && (
                  <a
                    href={instagram.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/5"
                  >
                    <InstagramIcon className="h-4.5 w-4.5" />
                    {instagram.handle || "Instagram"}
                  </a>
                )}
              </Reveal>
            )
          )}
        </div>
      </section>

      <CtaBand whatsapp={c.whatsappNumber} />
    </>
  );
}
