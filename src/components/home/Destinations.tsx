"use client";

import { useState } from "react";
import { ArrowUpRight, CalendarDays, RotateCcw } from "lucide-react";
import { destinations, whatsappLink, type Destination } from "@/config/site";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

function DestinationCard({ d }: { d: Destination }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div id={`dest-${d.id}`} className={`flip group h-full scroll-mt-28 ${flipped ? "is-flipped" : ""}`}>
      <div className="flip-inner h-full">
        {/* front */}
        <button
          type="button"
          onClick={() => setFlipped(true)}
          tabIndex={flipped ? -1 : 0}
          aria-hidden={flipped || undefined}
          aria-label={`${d.name}: show intakes and options`}
          className="flip-face relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-panel/70 p-6 text-left transition-[border-color,box-shadow] duration-300 hover:border-teal-light/40 hover:shadow-[0_30px_60px_-30px_rgba(92,192,207,0.45)]"
        >
          <span className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-teal/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
          <span className="relative block aspect-[4/3] w-24 overflow-hidden rounded-xl shadow-[0_18px_40px_-14px_rgba(0,0,0,0.8)] ring-1 ring-white/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/flags/${d.flag}.svg`} alt="" className="flag-wave h-full w-full object-cover" draggable={false} />
          </span>
          <span className="relative mt-6 block text-2xl font-extrabold tracking-[-0.02em] text-white">{d.name}</span>
          <span className="relative mt-2 block flex-1 text-[0.95rem] leading-relaxed text-white/65">{d.line}</span>
          <span className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold text-teal-light">
            <RotateCcw className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-180" aria-hidden="true" />
            Intakes and next steps
          </span>
        </button>

        {/* back */}
        <div
          className="flip-face flip-back flex flex-col rounded-3xl border border-teal-light/30 bg-[linear-gradient(150deg,#16405f,#0f2a43)] p-6"
          aria-hidden={!flipped}
        >
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/flags/${d.flag}.svg`} alt="" className="h-7 w-10 rounded-md object-cover ring-1 ring-white/25" />
            <span className="text-lg font-extrabold text-white">{d.name}</span>
          </div>
          <p className="mt-5 flex items-start gap-2.5 text-[0.95rem] leading-relaxed text-white/80">
            <CalendarDays className="mt-0.5 h-4.5 w-4.5 shrink-0 text-teal-light" aria-hidden="true" />
            {d.intakes}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            Tell us your course and budget and we&apos;ll shortlist universities that fit.
          </p>
          <div className="mt-auto flex items-center justify-between gap-3 pt-6">
            <a
              href={whatsappLink(`Hi Edusphere, I'm interested in studying in ${d.name}.`)}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={flipped ? 0 : -1}
              className="inline-flex items-center gap-1.5 rounded-full bg-teal px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-light"
            >
              Ask about {d.name === "United Kingdom" ? "the UK" : d.name === "United States" ? "the USA" : d.name}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={() => setFlipped(false)}
              tabIndex={flipped ? 0 : -1}
              className="rounded-full p-2.5 text-white/70 ring-1 ring-white/20 transition hover:text-white"
              aria-label="Back"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Destinations() {
  return (
    <section id="destinations" className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="Destinations"
            title={
              <>
                Where will you
                <span className="text-teal-light"> study?</span>
              </>
            }
            intro="Six destinations, each with its own rhythm of intakes, costs and visas. We know them well, and we'll help you weigh them honestly."
          />
          <Reveal delay={0.1} className="text-sm text-white/50">
            Tap a card for intakes
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d, i) => (
            <Reveal key={d.id} delay={(i % 3) * 0.08} className="h-full">
              <DestinationCard d={d} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
