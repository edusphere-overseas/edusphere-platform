import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { getSiteContent, whatsappHref } from "@/lib/content";

export const metadata: Metadata = { title: "Course finder" };

/**
 * Course finder. Only reachable when switched on in Content → Website settings → Section switches.
 * The search itself is built in Step 3 of the plan.
 */
export default async function CourseFinderPage() {
  const c = await getSiteContent();
  if (!c.sections.courseFinder) notFound();

  return (
    <section className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8 sm:py-32">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/20 text-teal-light">
        <Search className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-4xl font-extrabold tracking-[-0.03em] text-white sm:text-5xl">Course finder</h1>
      <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/70">
        We&apos;re adding our partner universities and courses. Until the search is ready, tell us what you&apos;d like
        to study and we&apos;ll send you a shortlist.
      </p>
      <a
        href={whatsappHref(c.whatsappNumber, "Hi Edusphere, please help me find a course. I'd like to study: ")}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3.5 font-semibold text-white transition hover:bg-teal-light"
      >
        <WhatsAppIcon className="h-5 w-5" />
        Ask for a shortlist
      </a>
    </section>
  );
}
