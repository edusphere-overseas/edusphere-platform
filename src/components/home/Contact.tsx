import { Mail, MapPin, Navigation, Phone } from "lucide-react";
import {
  appleDirections,
  googleDirections,
  googleMapEmbed,
  visibleOffices,
  whatsappLink,
} from "@/config/site";
import { WhatsAppIcon } from "@/components/icons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Contact() {
  const head = visibleOffices[0];
  const phone = head?.phones[0];
  const email = head?.emails[0];

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
              href={whatsappLink("Hi Edusphere, I'd like to book a free consultation.")}
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
                href={`tel:${phone.tel}`}
                className="flex items-center gap-4 rounded-2xl border border-white/12 px-5 py-4 transition hover:border-white/30 hover:bg-white/[0.03]"
              >
                <Phone className="h-5.5 w-5.5 text-teal-light" aria-hidden="true" />
                <span>
                  <span className="block font-bold text-white">{phone.display}</span>
                  <span className="block text-sm text-white/60">Call the {head.name} office</span>
                </span>
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email.address}`}
                className="flex items-center gap-4 rounded-2xl border border-white/12 px-5 py-4 transition hover:border-white/30 hover:bg-white/[0.03]"
              >
                <Mail className="h-5.5 w-5.5 text-teal-light" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block truncate font-bold text-white">{email.address}</span>
                  <span className="block text-sm text-white/60">{email.label}</span>
                </span>
              </a>
            )}
          </Reveal>
          <p className="mt-6 text-sm text-white/45">Online booking with live counsellor availability arrives with the student portal.</p>
        </div>

        {head && (
          <Reveal delay={0.15} className="overflow-hidden rounded-[2rem] border border-white/10 bg-panel/60">
            <div className="relative aspect-[16/10] w-full bg-panel">
              <iframe
                title={`Map of ${head.legalName}, ${head.name}`}
                src={googleMapEmbed(head.mapQuery)}
                className="absolute inset-0 h-full w-full border-0 [filter:invert(0.9)_hue-rotate(180deg)_saturate(0.6)_brightness(0.95)]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/flags/${head.countryCode}.svg`} alt="" className="h-5 w-7 rounded-[3px] object-cover ring-1 ring-white/20" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-teal-light">Head office · {head.name}</span>
              </div>
              <p className="mt-4 flex items-start gap-3 text-white/85">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-white/50" aria-hidden="true" />
                <span>
                  <span className="block font-bold text-white">{head.legalName}</span>
                  {head.addressLines.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </span>
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <a
                  href={googleDirections(head.mapQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-deep transition hover:bg-mist"
                >
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                  Google Maps
                </a>
                <a
                  href={appleDirections(head.mapQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/5"
                >
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                  Apple Maps
                </a>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
