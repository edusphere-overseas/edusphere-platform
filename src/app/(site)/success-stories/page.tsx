import type { Metadata } from "next";
import { ArrowUpRight, Quote } from "lucide-react";
import { GoogleIcon } from "@/components/icons";
import { CtaBand } from "@/components/pages/CtaBand";
import { PageHero } from "@/components/pages/PageHero";
import { StoryCard } from "@/components/pages/StoryCard";
import { GoogleReviews } from "@/components/reviews/GoogleReviews";
import { Reveal } from "@/components/ui/Reveal";
import { getLibrary, getSiteContent } from "@/lib/content";
import { getPlaceReviews } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Success stories and reviews",
  description: "Students who studied abroad with Edusphere Overseas, in their own words, and our reviews on Google.",
};

export default async function StoriesPage() {
  const [c, lib] = await Promise.all([getSiteContent(), getLibrary()]);
  const head = c.offices[0];
  const reviews = c.sections.reviews ? await getPlaceReviews(head) : null;
  const google = head?.googleBusinessUrl || c.socialLinks.find((l) => l.platform === "google")?.url;

  return (
    <>
      <PageHero
        eyebrow="Success stories"
        crumbs={[{ href: "/success-stories", label: "Success stories" }]}
        title={
          <>
            In our students&apos; <span className="text-teal-light">own words</span>
          </>
        }
        intro="Every story here is shared with the student's written permission. Our Google reviews are shown exactly as they appear on Google."
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          {lib.stories.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {lib.stories.map((s, i) => (
                <Reveal key={s._id} delay={(i % 3) * 0.06} className="h-full">
                  <StoryCard s={s} />
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal className="flex flex-col items-start gap-4 rounded-3xl border border-dashed border-white/15 p-8 sm:p-10">
              <Quote className="h-8 w-8 text-teal-light/60" aria-hidden="true" />
              <h2 className="text-2xl font-extrabold text-white">Student stories are on their way</h2>
              <p className="max-w-2xl leading-relaxed text-white/65">
                We only publish a story when the student has agreed to it in writing. In the meantime, you can read what students and parents say about us on Google.
              </p>
            </Reveal>
          )}
        </div>
      </section>

      {reviews ? (
        <section className="border-t border-white/8 bg-deeper py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <h2 className="mb-8 text-3xl font-extrabold tracking-[-0.02em] text-white">What people say on Google</h2>
            <GoogleReviews data={reviews} />
          </div>
        </section>
      ) : (
        google && (
          <section className="pb-4">
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
              <a
                href={google}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/25"
              >
                <span className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
                    <GoogleIcon className="h-6 w-6 text-deep" />
                  </span>
                  <span>
                    <span className="block font-bold text-white">Read our reviews on Google</span>
                    <span className="block text-sm text-white/55">Opens our Google Business listing</span>
                  </span>
                </span>
                <ArrowUpRight className="h-5 w-5 text-white/60 transition group-hover:text-white" aria-hidden="true" />
              </a>
            </div>
          </section>
        )
      )}

      <CtaBand whatsapp={c.whatsappNumber} title="Write your own story" text="Tell us where you'd like to study. We'll help you plan every step, from the first conversation to your first day on campus." />
    </>
  );
}
