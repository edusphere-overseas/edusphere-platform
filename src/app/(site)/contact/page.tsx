import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import { OfficeCard } from "@/components/home/Contact";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { WhatsAppIcon } from "@/components/icons";
import { PageHero } from "@/components/pages/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { getSiteContent, telHref, whatsappHref } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Book a free study abroad consultation with Edusphere Overseas in Mangaluru or online. Call, WhatsApp, email or send us an enquiry.",
};

export default async function ContactPage() {
  const c = await getSiteContent();
  const phones = c.contacts.filter((x) => x.kind === "phone");
  const emails = c.contacts.filter((x) => x.kind === "email");

  return (
    <>
      <PageHero
        eyebrow="Contact"
        crumbs={[{ href: "/contact", label: "Contact" }]}
        title={
          <>
            Start with a <span className="text-teal-light">conversation</span>
          </>
        }
        intro="Your first consultation is free, in person at our office or online. Students and parents are both welcome."
      />

      <section id="enquiry" className="scroll-mt-20 py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1.4fr_1fr]">
          <Reveal className="rounded-[2rem] border border-white/10 bg-panel/50 p-6 sm:p-10">
            <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-white sm:text-3xl">Send us an enquiry</h2>
            <p className="mt-3 mb-8 text-white/65">Tell us a little about your plans and a counsellor will get back to you, usually within one working day.</p>
            <EnquiryForm
              whatsapp={c.whatsappNumber}
              destinations={c.destinations.map((d) => ({ value: d.id, label: d.name }))}
              offices={c.offices.map((o) => ({ value: o.id, label: o.name }))}
            />
          </Reveal>

          <Reveal delay={0.08} className="grid content-start gap-3">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-white/50">Or reach us directly</h2>
            <a
              href={whatsappHref(c.whatsappNumber, "Hi Edusphere, I'd like to book a free consultation.")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-2xl bg-teal px-5 py-4 text-white transition hover:bg-teal-light"
            >
              <WhatsAppIcon className="h-6 w-6" />
              <span>
                <span className="block font-bold">WhatsApp</span>
                <span className="block text-sm text-white/80">Usually the quickest way to reach us</span>
              </span>
            </a>
            {phones.map((p) => (
              <a key={p.value} href={telHref(p.value)} className="flex items-center gap-4 rounded-2xl border border-white/12 px-5 py-4 transition hover:border-white/30 hover:bg-white/[0.03]">
                <Phone className="h-5.5 w-5.5 text-teal-light" aria-hidden="true" />
                <span>
                  <span className="block font-bold text-white">{p.value}</span>
                  <span className="block text-sm text-white/60">{p.label}</span>
                </span>
              </a>
            ))}
            {emails.map((e) => (
              <a key={e.value} href={`mailto:${e.value}`} className="flex items-center gap-4 rounded-2xl border border-white/12 px-5 py-4 transition hover:border-white/30 hover:bg-white/[0.03]">
                <Mail className="h-5.5 w-5.5 text-teal-light" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block truncate font-bold text-white">{e.value}</span>
                  <span className="block text-sm text-white/60">{e.label}</span>
                </span>
              </a>
            ))}
          </Reveal>
        </div>
      </section>

      {c.offices.length > 0 && (
        <section className="border-t border-white/8 bg-deeper py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <h2 className="text-3xl font-extrabold tracking-[-0.02em] text-white">{c.offices.length > 1 ? "Our offices" : "Visit our office"}</h2>
            <div className={`mt-10 grid gap-6 ${c.offices.length > 1 ? "lg:grid-cols-2" : "lg:max-w-3xl"}`}>
              {c.offices.map((o, i) => (
                <Reveal key={o.id} delay={(i % 2) * 0.08}>
                  <OfficeCard office={o} withMap />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
