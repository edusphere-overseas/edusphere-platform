import { CalendarClock, ExternalLink, ShieldCheck } from "lucide-react";
import { PortableText } from "next-sanity";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WhatsAppIcon } from "@/components/icons";
import { whatsappHref, type OpenNowItem } from "@/lib/content";

const kindLabel = { visa: "Visa or scheme", scholarship: "Scholarship", other: "Programme" } as const;

const fmt = (iso: string, withTime = false) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London", timeZoneName: "short" } : { timeZone: "UTC" }),
  }).format(new Date(iso));

/** Limited-time visas, schemes and scholarships. Managed in Content → "Open now". */
export function OpenNow({ items, whatsapp }: { items: OpenNowItem[]; whatsapp: string }) {
  if (items.length === 0) return null;

  return (
    <section id="open-now" className="relative scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Open now"
          title={
            <>
              Opportunities with a <span className="text-teal-light">closing date</span>
            </>
          }
          intro="Visas, work schemes and scholarships that are accepting applications right now. Our experts check every detail against the official source."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => (
            <Reveal key={p._id} delay={(i % 3) * 0.08} className="h-full">
              <article className="flex h-full flex-col rounded-3xl border border-white/10 bg-panel/70 p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-light">
                    {p.flag && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/flags/${p.flag}.svg`} alt="" className="h-4 w-6 rounded-[2px] object-cover ring-1 ring-white/20" />
                    )}
                    {p.country || kindLabel[p.kind]}
                  </span>
                  <span className="rounded-full bg-white/8 px-2.5 py-1 text-[0.68rem] font-semibold text-white/70">{kindLabel[p.kind]}</span>
                </div>

                <h3 className="mt-5 text-xl font-extrabold tracking-[-0.01em] text-white">{p.title}</h3>
                <p className="mt-2.5 text-[0.95rem] leading-relaxed text-white/70">{p.summary}</p>

                {p.closesAt && (
                  <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-white">
                    <CalendarClock className="h-4.5 w-4.5 text-teal-light" aria-hidden="true" />
                    Applications close {fmt(p.closesAt, true)}
                  </p>
                )}

                {p.details && p.details.length > 0 && (
                  <details className="group mt-4 rounded-2xl border border-white/10 bg-deep/40 open:bg-deep/60">
                    <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-white/85 marker:hidden">
                      <span className="group-open:hidden">Eligibility and how we help</span>
                      <span className="hidden group-open:inline">Hide details</span>
                    </summary>
                    <div className="space-y-3 px-4 pb-4 text-sm leading-relaxed text-white/75 [&_h3]:mt-4 [&_h3]:font-bold [&_h3]:text-white">
                      <PortableText value={p.details} />
                    </div>
                  </details>
                )}

                <div className="mt-auto pt-6">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/50">
                    {p.lastChecked && (
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        Checked {fmt(p.lastChecked)}
                      </span>
                    )}
                    {p.officialLink && (
                      <a
                        href={p.officialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 underline-offset-2 hover:text-white hover:underline"
                      >
                        Official source
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                  <a
                    href={whatsappHref(whatsapp, `Hi Edusphere, I'd like to know more about: ${p.title}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal px-4.5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-light"
                  >
                    <WhatsAppIcon className="h-4.5 w-4.5" />
                    {p.ctaLabel || "Ask an expert"}
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
