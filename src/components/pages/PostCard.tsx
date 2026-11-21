import Link from "next/link";
import { ArrowRight, CalendarClock, MapPin } from "lucide-react";
import { SanityImage } from "@/components/ui/SanityImage";
import type { PostCard as Post } from "@/lib/content";
import { formatDate, formatDateTime } from "@/lib/format";

export function PostCard({ p, featured = false }: { p: Post; featured?: boolean }) {
  const event = p.kind === "event";
  return (
    <Link
      href={`/news/${p.slug}`}
      className={`group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-panel/60 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-teal-light/40 ${featured ? "lg:flex-row" : ""}`}
    >
      {p.image && (
        <span className={`relative block aspect-[16/9] w-full shrink-0 overflow-hidden ${featured ? "lg:aspect-auto lg:w-1/2" : ""}`}>
          <SanityImage photo={p.image} fill sizes={featured ? "(min-width: 1024px) 40vw, 100vw" : "(min-width: 1024px) 30vw, 100vw"} className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        </span>
      )}
      <span className="flex flex-1 flex-col p-6">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]">
          <span className={event ? "text-[#f5c26b]" : "text-teal-light"}>{event ? "Event" : "News"}</span>
          <span className="text-white/35">·</span>
          <time dateTime={p.date} className="text-white/50">
            {formatDate(p.date)}
          </time>
        </span>
        <span className={`mt-3 block font-extrabold tracking-[-0.01em] text-white ${featured ? "text-2xl sm:text-3xl" : "text-xl"}`}>{p.title}</span>
        <span className="mt-2.5 block flex-1 text-[0.95rem] leading-relaxed text-white/65">{p.summary}</span>
        {event && p.eventStart && (
          <span className="mt-4 grid gap-1.5 text-sm text-white/80">
            <span className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-teal-light" aria-hidden="true" />
              {formatDateTime(p.eventStart)}
            </span>
            {p.eventPlace && (
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-teal-light" aria-hidden="true" />
                {p.eventPlace}
              </span>
            )}
          </span>
        )}
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-light">
          Read more
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}
