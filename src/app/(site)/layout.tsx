import type { Metadata } from "next";
import { Intro } from "@/components/brand/Intro";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Ticker } from "@/components/layout/Ticker";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { site } from "@/config/site";
import { getSiteContent, whatsappHref } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getSiteContent();
  return {
    title: { default: `${c.companyName} | ${c.tagline}`, template: `%s | ${c.companyName}` },
    description: c.description,
  };
}

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const c = await getSiteContent();
  const nav = [
    { href: "/services", label: "Services", show: c.sections.services && c.services.length > 0 },
    { href: "/course-finder", label: "Course finder", show: c.sections.courseFinder },
    { href: "/success-stories", label: "Success stories", show: c.sections.stories || c.sections.reviews },
    { href: "/news", label: "News", show: c.sections.news },
    { href: "/about", label: "About", show: true },
    { href: "/contact", label: "Contact", show: true },
  ]
    .filter((n) => n.show)
    .map(({ href, label }) => ({ href, label }));
  const destinations = c.sections.destinations ? c.destinations.map(({ id, name, flag, summary }) => ({ id, name, flag, summary })) : [];

  const sameAs = c.socialLinks.map((l) => l.url).filter((u) => u.startsWith("https://"));
  const organization = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${site.url}/#organization`,
    name: c.companyName,
    legalName: c.legalName,
    url: site.url,
    logo: `${site.url}/icon.svg`,
    description: c.description,
    sameAs,
    contactPoint: c.contacts
      .filter((x) => x.kind !== "email")
      .map((x) => ({ "@type": "ContactPoint", telephone: x.value, contactType: x.label || "customer service" })),
    department: c.offices.map((o) => ({
      "@type": "LocalBusiness",
      name: `${c.companyName}, ${o.name}`,
      address: { "@type": "PostalAddress", streetAddress: o.addressLines.join(", "), addressCountry: o.countryCode.toUpperCase() },
      telephone: o.contacts.find((x) => x.kind === "phone")?.value,
      hasMap: o.googleBusinessUrl ?? undefined,
    })),
  };

  return (
    <>
      <JsonLd data={organization} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-deep"
      >
        Skip to content
      </a>
      <Intro />
      {c.sections.ticker && <Ticker items={c.ticker} />}
      <Header nav={nav} destinations={destinations} />
      <main id="main">{children}</main>
      <Footer content={c} />
      <WhatsAppButton href={whatsappHref(c.whatsappNumber, c.whatsappMessage)} />
    </>
  );
}
