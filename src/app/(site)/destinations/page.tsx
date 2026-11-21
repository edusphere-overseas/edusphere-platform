import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { CtaBand } from "@/components/pages/CtaBand";
import { PageHero } from "@/components/pages/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { getLibrary, getSiteContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Study destinations",
  description: "Study in the UK, Europe, Australia, New Zealand, the USA or Canada: intakes, popular courses, visa steps and post-study work, explained.",
};

export default async function DestinationsPage() {
  const [c, lib] = await Promise.all([getSiteContent(), getLibrary()]);

  return (
    <>
      <PageHero
        eyebrow="Destinations"
        crumbs={[{ href: "/destinations", label: "Destinations" }]}
        title={
          <>
            Where will you <span className="text-teal-light">study?</span>
          </>
        }
        intro="Each country has its own intakes, costs and visa rules. Start with an overview here, then talk it through with us."
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
          {lib.destinations.map((d, i) => (
            <Reveal key={d.id} delay={(i % 3) * 0.06} className="h-full">
              <Link
                href={`/destinations/${d.id}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-panel/70 p-6 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-teal-light/40 hover:shadow-[0_30px_60px_-30px_rgba(92,192,207,0.45)]"
              >
                <span className="block aspect-[4/3] w-20 overflow-hidden rounded-xl shadow-[0_18px_40px_-14px_rgba(0,0,0,0.8)] ring-1 ring-white/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/flags/${d.flag}.svg`} alt="" className="flag-wave h-full w-full object-cover" />
                </span>
                <h2 className="mt-6 text-2xl font-extrabold tracking-[-0.02em] text-white">{d.name}</h2>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-white/65">{d.summary}</p>
                {d.countries && d.countries.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Countries">
                    {d.countries.map((ct) => (
                      <li key={ct.flag} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-white/70">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/flags/${ct.flag}.svg`} alt="" className="h-3 w-4 rounded-[2px] object-cover" />
                        {ct.name}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-auto pt-6">
                  {d.intakes && (
                    <p className="flex items-start gap-2 text-sm text-white/60">
                      <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-teal-light" aria-hidden="true" />
                      {d.intakes}
                    </p>
                  )}
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-light">
                    Explore {d.name}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <CtaBand whatsapp={c.whatsappNumber} title="Torn between two countries?" text="We'll compare them with you honestly: costs, courses, visas and what happens after you graduate." />
    </>
  );
}
