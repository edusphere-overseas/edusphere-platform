import { Mail, MapPin, Navigation, Phone } from "lucide-react";
import { appleDirections, googleDirections, googleMapEmbed } from "@/config/site";
import { WhatsAppIcon } from "@/components/icons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { telHref, whatsappHref, type ContactPoint, type Office } from "@/lib/content";

function OfficeCard({ office: o, withMap }: { office: Office; withMap: boolean }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-panel/60">
      {withMap && (
        <div className="relative aspect-[16/10] w-full bg-panel">
          <iframe
            title={`Map of ${o.legalName || o.name}`}
            src={googleMapEmbed(o.mapQuery)}
            className="absolute inset-0 h-full w-full border-0 [filter:invert(0.9)_hue-rotate(180deg)_saturate(0.6)_brightness(0.95)]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/flags/${o.countryCode}.svg`} alt="" className="h-5 w-7 rounded-[3px] object-cover ring-1 ring-white/20" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-teal-light">
            {o.isHeadOffice ? "Head office · " : ""}
            {o.name}
          </span>
        </div>
        <p className="mt-4 flex items-start gap-3 text-white/85">
          <MapPin className="mt-1 h-5 w-5 shrink-0 text-white/50" aria-hidden="true" />
          <span>
            {o.legalName && <span className="block font-bold text-white">{o.legalName}</span>}
            {o.addressLines.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </span>
        </p>
        {o.contacts.length > 0 && (
          <ul className="mt-4 grid gap-1.5 text-sm">
            {o.contacts.map((ct) => (
              <li key={`${ct.kind}-${ct.value}`}>
                <a
                  href={ct.kind === "email" ? `mailto:${ct.value}` : ct.kind === "whatsapp" ? whatsappHref(ct.value) : telHref(ct.value)}
                  className="text-white/75 transition hover:text-white"
                >
                  <span className="text-white/45">{ct.label}: </span>
                  {ct.value}
                </a>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 flex flex-wrap gap-2.5">
          <a
            href={googleDirections(o.mapQuery)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-deep transition hover:bg-mist"
          >
            <Navigation className="h-4 w-4" aria-hidden="true" />
            Google Maps
          </a>
          <a
            href={appleDirections(o.mapQuery)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/5"
          >
            <Navigation className="h-4 w-4" aria-hidden="true" />
            Apple Maps
          </a>
        </div>
      </div>
    </div>
  );
}

export function Contact({
  offices,
  contacts,
  whatsapp,
}: {
  offices: Office[];
  contacts: ContactPoint[];
  whatsapp: string;
}) {
  const phone = contacts.find((c) => c.kind === "phone" && c.primary) ?? contacts.find((c) => c.kind === "phone");
  const email = contacts.find((c) => c.kind === "email" && c.primary) ?? contacts.find((c) => c.kind === "email");
  const [head, ...others] = offices;

  return (
    <section id="contact" className="relative scroll-mt-20 overflow-hidden bg-deeper py-24 sm:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 left-1/3 h-[30rem] w-[30rem] rounded-full bg-navy/30 blur-[120px]" />

      <div className="relative mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <div>
          <SectionHeading
            eyebrow="Free consultation"
            title={
              <>
                Start with a<span className="text-teal-light"> conversation.</span>
              </>
            }
            intro="Tell us where you are and where you'd like to be. Your first consultation is free, in person at our office or online, for students and parents alike."
          />

          <Reveal delay={0.1} className="mt-10 grid gap-3 sm:max-w-md">
            <a
              href={whatsappHref(whatsapp, "Hi Edusphere, I'd like to book a free consultation.")}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl bg-teal px-5 py-4 text-white transition hover:bg-teal-light"
            >
              <WhatsAppIcon className="h-6 w-6" />
              <span className="flex-1">
                <span className="block font-bold">Book on WhatsApp</span>
                <span className="block text-sm text-white/80">Usually the quickest way to reach us</span>
              </span>
            </a>
            {phone && (
              <a
                href={telHref(phone.value)}
                className="flex items-center gap-4 rounded-2xl border border-white/12 px-5 py-4 transition hover:border-white/30 hover:bg-white/[0.03]"
              >
                <Phone className="h-5.5 w-5.5 text-teal-light" aria-hidden="true" />
                <span>
                  <span className="block font-bold text-white">{phone.value}</span>
                  <span className="block text-sm text-white/60">{phone.label}</span>
                </span>
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email.value}`}
                className="flex items-center gap-4 rounded-2xl border border-white/12 px-5 py-4 transition hover:border-white/30 hover:bg-white/[0.03]"
              >
                <Mail className="h-5.5 w-5.5 text-teal-light" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block truncate font-bold text-white">{email.value}</span>
                  <span className="block text-sm text-white/60">{email.label}</span>
                </span>
              </a>
            )}
          </Reveal>
          <p className="mt-6 text-sm text-white/45">Online booking with live counsellor availability arrives with the student portal.</p>
        </div>

        {head && (
          <Reveal delay={0.15} className="grid gap-5">
            <OfficeCard office={head} withMap />
            {others.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2">
                {others.map((o) => (
                  <OfficeCard key={o.id} office={o} withMap={false} />
                ))}
              </div>
            )}
          </Reveal>
        )}
      </div>
    </section>
  );
}
