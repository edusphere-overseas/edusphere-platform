import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { Reveal } from "@/components/ui/Reveal";
import { whatsappHref } from "@/lib/links";

/** "Not sure what to study?" card. Points to the course finder when it is switched on, otherwise to a counsellor. */
export function CourseCta({ finderOn, whatsapp }: { finderOn: boolean; whatsapp: string }) {
  return (
    <section className="pb-20 sm:pb-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="grid items-center gap-6 rounded-[2rem] border border-white/10 bg-white/[0.03] p-7 sm:p-10 md:grid-cols-[auto_1fr_auto]">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal/35 to-navy/45 text-teal-light ring-1 ring-white/10">
            <Compass className="h-6.5 w-6.5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-white">Not sure which course is right for you?</h2>
            <p className="mt-2 leading-relaxed text-white/65">
              {finderOn
                ? "Search courses by subject, country and budget, then save a shortlist to discuss with a counsellor."
                : "Tell us your interests, grades and budget, and a counsellor will put together a shortlist of courses that fit."}
            </p>
          </div>
          {finderOn ? (
            <Link href="/course-finder" className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-deep transition hover:bg-mist">
              Open the course finder
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          ) : (
            <a
              href={whatsappHref(whatsapp, "Hi Edusphere, I'd like help choosing a course.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-deep transition hover:bg-mist"
            >
              <WhatsAppIcon className="h-4.5 w-4.5 text-[#128c4a]" />
              Get a course shortlist
            </a>
          )}
        </Reveal>
      </div>
    </section>
  );
}
