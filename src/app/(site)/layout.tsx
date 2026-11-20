import type { Metadata } from "next";
import { Intro } from "@/components/brand/Intro";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Ticker } from "@/components/layout/Ticker";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
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
    { href: "/#destinations", label: "Destinations", show: c.sections.destinations && c.destinations.length > 0 },
    { href: "/#services", label: "Services", show: c.sections.services && c.services.length > 0 },
    { href: "/#open-now", label: "Open now", show: c.sections.openNow && c.openNow.length > 0 },
    { href: "/course-finder", label: "Course finder", show: c.sections.courseFinder },
    { href: "/#uk-onshore", label: "UK onshore", show: c.sections.ukOnshore },
    { href: "/about", label: "About", show: true },
    { href: "/#contact", label: "Contact", show: true },
  ]
    .filter((n) => n.show)
    .map(({ href, label }) => ({ href, label }));

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-deep"
      >
        Skip to content
      </a>
      <Intro />
      {c.sections.ticker && <Ticker items={c.ticker} />}
      <Header nav={nav} />
      <main id="main">{children}</main>
      <Footer content={c} />
      <WhatsAppButton href={whatsappHref(c.whatsappNumber, c.whatsappMessage)} />
    </>
  );
}
