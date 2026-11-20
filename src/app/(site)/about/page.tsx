import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { LogoMark } from "@/components/brand/LogoMark";
import { Reveal } from "@/components/ui/Reveal";
import { SanityImage } from "@/components/ui/SanityImage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getSiteContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "About us",
  description: "Who we are, where to find us, and the team that guides Edusphere students abroad.",
};

const values = [
  { title: "Honest advice", text: "We recommend what fits you, including when that means a different course, country or timeline." },
  { title: "One team, start to finish", text: "The people who counsel you stay with you through applications, visas and pre-departure." },
  { title: "Families included", text: "Parents can follow along, ask questions and see progress in the portal." },
];

export default async function AboutPage() {
  const c = await getSiteContent();
  const showTeam = c.sections.team && c.team.length > 0;
  const galleries = c.sections.gallery ? c.offices.filter((o) => o.photos.length > 0) : [];

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 -right-40 -z-10 h-[34rem] w-[34rem] rounded-full bg-teal/20 blur-[120px]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.24em] text-teal-light">About {c.companyName}</span>
            <h1 className="mt-5 text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl">
              We help students find the right path abroad, and walk it with them.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">{c.description}</p>
          </div>
          <div className="relative mx-auto hidden aspect-square w-full max-w-sm items-center justify-center lg:flex">
            <div className="glow-pulse absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgba(92,192,207,0.3),transparent_70%)] blur-2xl" />
            <LogoMark className="relative w-3/4 drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]" />
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-deeper py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 sm:px-8 md:grid-cols-3">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.08} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-bold text-white">{v.title}</h2>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-white/65">{v.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {showTeam && (
        <section className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <SectionHeading eyebrow="Our team" title="The people beside you" />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {c.team.map((m, i) => (
                <Reveal key={m._id} delay={(i % 4) * 0.06} className="group">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/10 bg-panel">
                    {m.photo ? (
                      <SanityImage
                        photo={m.photo}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-5xl font-extrabold text-white/20">
                          {m.name
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">{m.name}</h3>
                  <p className="text-sm font-semibold text-teal-light">{m.role}</p>
                  {m.office && <p className="mt-1 text-xs text-white/50">{m.office}</p>}
                  {m.bio && <p className="mt-2.5 text-sm leading-relaxed text-white/65">{m.bio}</p>}
                  {m.languages && m.languages.length > 0 && (
                    <p className="mt-2 text-xs text-white/50">Speaks {m.languages.join(", ")}</p>
                  )}
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {galleries.map((o) => (
        <section key={o.id} className="pb-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <SectionHeading eyebrow={`${o.name} office`} title="Come and see us" />
            <div className="mt-10 grid auto-rows-[14rem] grid-cols-2 gap-4 sm:auto-rows-[16rem] lg:grid-cols-4">
              {o.photos.map((p, i) => (
                <Reveal
                  key={p.asset?._id ?? i}
                  delay={(i % 4) * 0.05}
                  className={`relative overflow-hidden rounded-3xl border border-white/10 ${i === 0 ? "col-span-2 row-span-2" : ""}`}
                >
                  <figure className="h-full">
                    <SanityImage photo={p} fill sizes={i === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"} className="object-cover" />
                    {p.caption && (
                      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-sm text-white">
                        {p.caption}
                      </figcaption>
                    )}
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading eyebrow="Where to find us" title={c.offices.length > 1 ? "Our offices" : "Our office"} />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {c.offices.map((o) => (
              <Reveal key={o.id} className="rounded-3xl border border-white/10 bg-panel/60 p-6">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/flags/${o.countryCode}.svg`} alt="" className="h-5 w-7 rounded-[3px] object-cover ring-1 ring-white/20" />
                  <span className="font-bold text-white">
                    {o.name}
                    {o.isHeadOffice && <span className="ml-2 text-xs font-semibold text-teal-light">Head office</span>}
                  </span>
                </div>
                <p className="mt-4 flex items-start gap-2.5 text-sm leading-relaxed text-white/75">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/45" aria-hidden="true" />
                  {o.addressLines.join(", ")}
                </p>
              </Reveal>
            ))}
          </div>
          <Link
            href="/#contact"
            className="group mt-10 inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3.5 font-semibold text-white transition hover:bg-teal-light"
          >
            Book a free consultation
            <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
