import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { SocialIcon } from "@/components/icons";
import { telHref, whatsappHref, type SiteContent } from "@/lib/content";

const COPYRIGHT_YEAR = 2026;

export function Footer({ content: c }: { content: SiteContent }) {
  const explore = [
    { href: "/destinations", label: "Destinations", show: c.sections.destinations },
    { href: "/services", label: "Student services", show: c.sections.services },
    { href: "/universities", label: "Universities", show: true },
    { href: "/scholarships", label: "Scholarships and loans", show: true },
    { href: "/course-finder", label: "Course finder", show: c.sections.courseFinder },
    { href: "/#uk-onshore", label: "UK onshore", show: c.sections.ukOnshore },
  ].filter((l) => l.show);
  const company = [
    { href: "/about", label: "About us", show: true },
    { href: "/success-stories", label: "Success stories", show: c.sections.stories || c.sections.reviews },
    { href: "/news", label: "News and events", show: c.sections.news },
    { href: "/faqs", label: "FAQs", show: true },
    { href: "/contact", label: "Contact", show: true },
    { href: "/portal", label: "Student login", show: true },
  ].filter((l) => l.show);

  const phones = c.contacts.filter((x) => x.kind !== "email");
  const emails = c.contacts.filter((x) => x.kind === "email");
  const legal = c.legalName.replace(/\.$/, "");

  return (
    <footer className="relative border-t border-white/10 bg-deep">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.1fr_1.1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">{c.description}</p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {c.socialLinks.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${s.platform}${s.handle ? `: ${s.handle}` : ""}`}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 ring-1 ring-white/15 transition hover:bg-white/5 hover:text-white hover:ring-white/35"
              >
                <SocialIcon platform={s.platform} className="h-4.5 w-4.5" />
              </a>
            ))}
            <a
              href={whatsappHref(c.whatsappNumber, c.whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 ring-1 ring-white/15 transition hover:bg-white/5 hover:text-white hover:ring-white/35"
            >
              <SocialIcon platform="whatsapp" className="h-4.5 w-4.5" />
            </a>
          </div>
        </div>

        {[
          { title: "Study abroad", links: explore },
          { title: "Edusphere", links: company },
        ].map((col) => (
          <div key={col.title}>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">{col.title}</h2>
            <ul className="mt-5 grid gap-3 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/75 transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Contact</h2>
          <ul className="mt-5 grid gap-3 text-sm">
            {phones.map((p) => (
              <li key={`${p.kind}-${p.value}`}>
                <a
                  href={p.kind === "whatsapp" ? whatsappHref(p.value) : telHref(p.value)}
                  target={p.kind === "whatsapp" ? "_blank" : undefined}
                  rel={p.kind === "whatsapp" ? "noopener noreferrer" : undefined}
                  className="text-white/75 transition hover:text-white"
                >
                  <span className="block text-[0.7rem] uppercase tracking-[0.14em] text-white/40">{p.label}</span>
                  {p.value}
                </a>
              </li>
            ))}
            {emails.map((e) => (
              <li key={e.value}>
                <a href={`mailto:${e.value}`} className="break-all text-white/75 transition hover:text-white">
                  <span className="block text-[0.7rem] uppercase tracking-[0.14em] text-white/40">{e.label}</span>
                  {e.value}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Offices</h2>
          <ul className="mt-5 grid gap-5 text-sm">
            {c.offices.map((o) => (
              <li key={o.id} className="text-white/75">
                <span className="flex items-center gap-2 font-semibold text-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/flags/${o.countryCode}.svg`} alt="" className="h-3.5 w-5 rounded-[2px] object-cover" />
                  {o.name}
                </span>
                <span className="mt-1.5 block leading-relaxed">{o.addressLines.join(", ")}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            © {COPYRIGHT_YEAR} {legal}. All rights reserved.
          </p>
          <p>{c.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
