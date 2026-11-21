import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PostCard } from "@/components/pages/PostCard";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { PostCard as Post } from "@/lib/content";

/** Next event plus the latest news. Hidden until something is published. */
export function NewsTeaser({ posts, nextEvent }: { posts: Post[]; nextEvent: Post | null }) {
  const list = [...(nextEvent ? [nextEvent] : []), ...posts.filter((p) => p._id !== nextEvent?._id)].slice(0, 3);
  if (list.length === 0) return null;
  return (
    <section id="news" className="relative scroll-mt-20 border-t border-white/8 bg-deeper py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading eyebrow="News and events" title="Latest from Edusphere" />
          <Reveal delay={0.1}>
            <Link href="/news" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-teal-light hover:underline">
              All news and events
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => (
            <Reveal key={p._id} delay={(i % 3) * 0.06} className="h-full">
              <PostCard p={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
