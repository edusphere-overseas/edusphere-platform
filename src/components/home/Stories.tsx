import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { GoogleIcon } from "@/components/icons";
import { StoryCard } from "@/components/pages/StoryCard";
import { GoogleReviews } from "@/components/reviews/GoogleReviews";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Story } from "@/lib/content";
import type { PlaceReviews } from "@/lib/reviews";

/** Student stories (with consent) and live Google reviews. Hidden when there is neither. */
export function Stories({ stories, reviews, googleUrl }: { stories: Story[]; reviews: PlaceReviews | null; googleUrl?: string | null }) {
  if (stories.length === 0 && !reviews) {
    if (!googleUrl) return null;
    return (
      <section className="pb-20 sm:pb-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/25">
              <span className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
                  <GoogleIcon className="h-6 w-6 text-deep" />
                </span>
                <span>
                  <span className="block font-bold text-white">See what students and parents say</span>
                  <span className="block text-sm text-white/55">Read our reviews on Google</span>
                </span>
              </span>
              <ArrowUpRight className="h-5 w-5 text-white/60 transition group-hover:text-white" aria-hidden="true" />
            </a>
          </Reveal>
        </div>
      </section>
    );
  }

  return (
    <section id="stories" className="relative scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="Success stories"
            title={
              <>
                Students who <span className="text-teal-light">made the move</span>
              </>
            }
            intro="In their own words, shared with their permission."
          />
          <Reveal delay={0.1}>
            <Link href="/success-stories" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-teal-light hover:underline">
              All stories and reviews
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
        {stories.length > 0 && (
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {stories.slice(0, 3).map((s, i) => (
              <Reveal key={s._id} delay={(i % 3) * 0.06} className="h-full">
                <StoryCard s={s} />
              </Reveal>
            ))}
          </div>
        )}
        {reviews && (
          <Reveal className="mt-10">
            <GoogleReviews data={reviews} limit={3} clamp />
          </Reveal>
        )}
      </div>
    </section>
  );
}
