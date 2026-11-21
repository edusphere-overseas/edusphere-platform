import type { Metadata } from "next";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { Journey } from "@/components/home/Journey";
import { WhatsAppIcon } from "@/components/icons";
import { CtaBand } from "@/components/pages/CtaBand";
import { PageHero } from "@/components/pages/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { ServiceIcon } from "@/components/ui/ServiceIcon";
import { getLibrary, getSiteContent, whatsappHref } from "@/lib/content";

export const metadata: Metadata = {
  title: "Student services",
  description: "Counselling, applications, visas, scholarships, loans, English tests, accommodation, airport pickup and pre-departure support for students going abroad.",
};

export default async function ServicesPage() {
  const [c, lib] = await Promise.all([getSiteContent(), getLibrary()]);
  const services = lib.services;

  return (
    <>
      <PageHero
        eyebrow="Student services"
        crumbs={[{ href: "/services", label: "Services" }]}
        title={
          <>
            Support that goes <span className="text-teal-light">the whole way</span>
          </>
        }
        intro="Admission is one part of the journey. We stay with you through visas, funding, housing and the day you land, and parents are welcome at every step."
      >
        <ul className="flex flex-wrap gap-2" aria-label="Jump to a service">
          {services.map((s) => (
            <li key={s.slug}>
              <a href={`#${s.slug}`} className="inline-flex rounded-full bg-white/[0.06] px-3.5 py-2 text-sm font-medium text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </PageHero>

      <section className="py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 sm:px-8">
          {services.map((s, i) => (
            <Reveal key={s.slug} id={s.slug} className="scroll-mt-24">
              <article className="grid gap-8 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr_1fr] lg:gap-10">
                <div>
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal/30 to-navy/40 text-teal-light ring-1 ring-white/10">
                    <ServiceIcon name={s.icon} className="h-6 w-6" />
                  </span>
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-white/40">{String(i + 1).padStart(2, "0")}</p>
                  <h2 className="mt-1.5 text-2xl font-extrabold tracking-[-0.02em] text-white sm:text-3xl">{s.title}</h2>
                  <p className="mt-3 text-[0.97rem] leading-relaxed text-white/70">{s.description}</p>
                  <a
                    href={whatsappHref(c.whatsappNumber, `Hi Edusphere, I'd like help with: ${s.title}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal px-4.5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-light"
                  >
                    <WhatsAppIcon className="h-4.5 w-4.5" />
                    Ask about this
                  </a>
                </div>
                {s.steps.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-teal-light">How it works</h3>
                    <ol className="mt-4 grid gap-3">
                      {s.steps.map((st, n) => (
                        <li key={st} className="flex gap-3 text-[0.95rem] leading-relaxed text-white/80">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">{n + 1}</span>
                          {st}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {s.included.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-teal-light">What&apos;s included</h3>
                    <ul className="mt-4 grid gap-3">
                      {s.included.map((inc) => (
                        <li key={inc} className="flex gap-3 text-[0.95rem] leading-relaxed text-white/80">
                          <Check className="mt-1 h-4 w-4 shrink-0 text-teal-light" aria-hidden="true" />
                          {inc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            </Reveal>
          ))}

          <Reveal className="flex items-start gap-3 rounded-2xl border border-white/10 p-5 text-sm leading-relaxed text-white/60">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-light" aria-hidden="true" />
            <p>
              In the UK, immigration advice is given only by advisers regulated to provide it. Where the law requires it, we work with appropriately regulated
              advisers. See also <Link href="/scholarships" className="font-semibold text-white underline-offset-2 hover:underline">scholarships and loans</Link> and our{" "}
              <Link href="/faqs" className="font-semibold text-white underline-offset-2 hover:underline">FAQs</Link>.
            </p>
          </Reveal>
        </div>
      </section>

      {c.sections.journey && <Journey />}
      <CtaBand whatsapp={c.whatsappNumber} />
    </>
  );
}
