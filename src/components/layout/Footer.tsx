import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { GoogleIcon, InstagramIcon, LinkedInIcon, WhatsAppIcon } from "@/components/icons";
import { site, visibleOffices, whatsappLink } from "@/config/site";

const COPYRIGHT_YEAR = 2026;

const explore = [
  { href: "/#destinations", label: "Destinations" },
  { href: "/#services", label: "Student services" },
  { href: "/#journey", label: "How it works" },
  { href: "/#uk-onshore", label: "UK onshore" },
  { href: "/portal", label: "Student login" },
];

const socialIcon = { instagram: InstagramIcon, linkedin: LinkedInIcon } as const;

export function Footer() {
  const head = visibleOffices[0];
  return (
    <footer className="relative border-t border-white/10 bg-deep">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">{site.description}</p>
          <div className="mt-6 flex gap-2.5">
            {site.social.map((s) => {
              const Icon = socialIcon[s.id as keyof typeof socialIcon];
              return (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${s.label}: ${s.handle}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 ring-1 ring-white/15 transition hover:bg-white/5 hover:text-white hover:ring-white/35"
                >
                  {Icon && <Icon className="h-4.5 w-4.5" />}
                </a>
              );
            })}
            {head?.googleBusinessUrl && (
              <a
                href={head.googleBusinessUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Edusphere Overseas on Google"
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 ring-1 ring-white/15 transition hover:bg-white/5 hover:text-white hover:ring-white/35"
              >
                <GoogleIcon className="h-4.5 w-4.5" />
              </a>
            )}
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 ring-1 ring-white/15 transition hover:bg-white/5 hover:text-white hover:ring-white/35"
            >
              <WhatsAppIcon className="h-4.5 w-4.5" />
            </a>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Explore</h2>
          <ul className="mt-5 grid gap-3 text-sm">
            {explore.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-white/75 transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {head && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Contact</h2>
            <ul className="mt-5 grid gap-3 text-sm">
              {head.phones.map((p) => (
                <li key={p.tel}>
                  <a href={`tel:${p.tel}`} className="text-white/75 transition hover:text-white">
                    {p.display}
                  </a>
                </li>
              ))}
              {head.emails.map((e) => (
                <li key={e.address}>
                  <a href={`mailto:${e.address}`} className="break-all text-white/75 transition hover:text-white">
                    {e.address}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Offices</h2>
          <ul className="mt-5 grid gap-5 text-sm">
            {visibleOffices.map((o) => (
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
            © {COPYRIGHT_YEAR} {site.legalName} All rights reserved.
          </p>
          <p>{site.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
