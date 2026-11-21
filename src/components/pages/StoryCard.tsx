import { PlayCircle, Quote } from "lucide-react";
import { SanityImage } from "@/components/ui/SanityImage";
import type { Story } from "@/lib/content";

/** A student's own words, published only with their written consent. */
export function StoryCard({ s }: { s: Story }) {
  return (
    <figure className="flex h-full flex-col rounded-3xl border border-white/10 bg-panel/60 p-6 sm:p-7">
      <Quote className="h-8 w-8 text-teal-light/60" aria-hidden="true" />
      <blockquote className="mt-4 flex-1 text-[1.02rem] leading-relaxed text-white/85">{s.quote}</blockquote>
      <figcaption className="mt-6 flex items-center gap-3.5">
        {s.photo ? (
          <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-white/15">
            <SanityImage photo={s.photo} fill sizes="48px" className="object-cover" />
          </span>
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal/50 to-navy/60 text-lg font-bold text-white">
            {s.name.charAt(0)}
          </span>
        )}
        <span className="min-w-0">
          <span className="flex items-center gap-2 font-bold text-white">
            {s.name}
            {s.flag && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/flags/${s.flag}.svg`} alt="" className="h-3.5 w-5 rounded-[2px] object-cover" />
            )}
          </span>
          {(s.course || s.university) && (
            <span className="block text-sm text-white/55">{[s.course, s.university].filter(Boolean).join(" · ")}</span>
          )}
        </span>
      </figcaption>
      {s.videoUrl && (
        <a href={s.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-light hover:underline">
          <PlayCircle className="h-4.5 w-4.5" aria-hidden="true" />
          Watch {s.name.split(" ")[0]}&apos;s story
        </a>
      )}
    </figure>
  );
}
