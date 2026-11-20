import type { PortableTextBlock } from "next-sanity";
import {
  defaultBanners,
  defaultHero,
  defaultServices,
  destinations as defaultDestinations,
  offices as defaultOffices,
  site,
  tickerItems as defaultTicker,
} from "@/config/site";
import { sanityQuery } from "@/sanity/fetch";
import { SITE_QUERY } from "@/sanity/queries";

export type ContactPoint = { kind: "phone" | "whatsapp" | "email"; label: string; value: string; primary?: boolean };
export type SocialLink = { platform: string; handle?: string; url: string };
export type SanityPhoto = {
  _type?: string;
  alt: string;
  caption?: string | null;
  asset?: { _id: string; url: string; metadata?: { dimensions?: { width: number; height: number }; lqip?: string } } | null;
  crop?: unknown;
  hotspot?: unknown;
};

export type Office = {
  id: string;
  name: string;
  legalName?: string | null;
  isHeadOffice?: boolean | null;
  country: string;
  countryCode: string;
  addressLines: string[];
  mapQuery: string;
  googleBusinessUrl?: string | null;
  contacts: ContactPoint[];
  photos: SanityPhoto[];
};

export type Banner = {
  id: string;
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  flag?: string | null;
  ctaLabel?: string | null;
  ctaLink?: string | null;
  image?: SanityPhoto | null;
};

export type OpenNowItem = {
  _id: string;
  title: string;
  kind: "visa" | "scholarship" | "other";
  country?: string | null;
  flag?: string | null;
  summary: string;
  details?: PortableTextBlock[] | null;
  opensAt?: string | null;
  closesAt?: string | null;
  officialLink?: string | null;
  lastChecked?: string | null;
  ctaLabel?: string | null;
};

export type Sections = {
  ticker: boolean;
  banners: boolean;
  openNow: boolean;
  destinations: boolean;
  services: boolean;
  journey: boolean;
  ukOnshore: boolean;
  courseFinder: boolean;
  team: boolean;
  gallery: boolean;
};

export type SiteContent = {
  fromCms: boolean;
  companyName: string;
  legalName: string;
  tagline: string;
  description: string;
  whatsappNumber: string; // digits only, for wa.me links
  whatsappMessage: string;
  contacts: ContactPoint[];
  socialLinks: SocialLink[];
  hero: typeof defaultHero;
  sections: Sections;
  offices: Office[];
  ticker: { tag: string; text: string; link?: string | null }[];
  banners: Banner[];
  destinations: { id: string; name: string; flag: string; summary: string; intakes?: string | null }[];
  services: { title: string; description: string; icon?: string | null }[];
  openNow: OpenNowItem[];
  onshore: { _id: string; title: string; provider?: string | null; location?: string | null; summary?: string | null; intakes?: string | null }[];
  team: { _id: string; name: string; role: string; bio?: string | null; languages?: string[] | null; office?: string | null; photo?: SanityPhoto | null }[];
};

const defaultSections: Sections = {
  ticker: true,
  banners: true,
  openNow: false,
  destinations: true,
  services: true,
  journey: true,
  ukOnshore: true,
  courseFinder: false,
  team: true,
  gallery: true,
};

const digits = (v: string) => v.replace(/\D/g, "");

/** Built-in content used until the Content area has been set up. */
function defaults(): SiteContent {
  const head = defaultOffices[0];
  return {
    fromCms: false,
    companyName: site.name,
    legalName: site.legalName,
    tagline: site.tagline,
    description: site.description,
    whatsappNumber: site.whatsapp.number,
    whatsappMessage: site.whatsapp.defaultMessage,
    contacts: [
      ...head.phones.map((p) => ({ kind: "phone" as const, label: p.label, value: p.display, primary: true })),
      ...head.emails.map((e) => ({ kind: "email" as const, label: e.label, value: e.address, primary: true })),
    ],
    socialLinks: [
      ...site.social.map((s) => ({ platform: s.id, handle: s.handle, url: s.url })),
      { platform: "google", handle: "Edusphere Overseas", url: head.googleBusinessUrl ?? "" },
    ],
    hero: defaultHero,
    sections: defaultSections,
    offices: defaultOffices
      .filter((o) => o.showOnWebsite)
      .map((o) => ({
        id: o.id,
        name: o.name,
        legalName: o.legalName,
        isHeadOffice: o.id === "mangalore",
        country: o.country,
        countryCode: o.countryCode,
        addressLines: o.addressLines,
        mapQuery: o.mapQuery,
        googleBusinessUrl: o.googleBusinessUrl,
        contacts: [
          ...o.phones.map((p) => ({ kind: "phone" as const, label: p.label, value: p.display })),
          ...o.emails.map((e) => ({ kind: "email" as const, label: e.label, value: e.address })),
        ],
        photos: [],
      })),
    ticker: defaultTicker.map((t) => ({ tag: t.tag, text: t.text, link: t.href })),
    banners: defaultBanners.map((b, i) => ({ id: `default-${i}`, ...b })),
    destinations: defaultDestinations.map((d) => ({ id: d.id, name: d.name, flag: d.flag, summary: d.line, intakes: d.intakes })),
    services: defaultServices,
    openNow: [],
    onshore: [],
    team: [],
  };
}

type QueryResult = {
  settings: {
    companyName?: string;
    legalName?: string;
    tagline?: string;
    description?: string;
    whatsappNumber?: string;
    whatsappMessage?: string;
    contacts?: ContactPoint[] | null;
    socialLinks?: SocialLink[] | null;
    heroEyebrow?: string;
    heroTitleLine1?: string;
    heroTitleLine2?: string;
    heroIntro?: string;
    heroNote?: string;
    sections?: Partial<Sections> | null;
  } | null;
  offices: (Omit<Office, "id" | "contacts" | "photos" | "mapQuery"> & {
    _id: string;
    mapQuery?: string | null;
    contacts?: ContactPoint[] | null;
    photos?: SanityPhoto[] | null;
  })[];
  ticker: SiteContent["ticker"];
  banners: (Omit<Banner, "id"> & { _id: string })[];
  destinations: SiteContent["destinations"];
  services: SiteContent["services"];
  openNow: OpenNowItem[];
  onshore: SiteContent["onshore"];
  team: SiteContent["team"];
};

/**
 * All site content. Comes from the Content area (Sanity) once "Website settings"
 * exists there; until then the built-in defaults keep the site complete.
 */
export async function getSiteContent(): Promise<SiteContent> {
  const data = await sanityQuery<QueryResult>(SITE_QUERY);
  if (!data?.settings) return defaults();

  const fallback = defaults();
  const s = data.settings;
  return {
    fromCms: true,
    companyName: s.companyName || fallback.companyName,
    legalName: s.legalName || s.companyName || fallback.legalName,
    tagline: s.tagline || fallback.tagline,
    description: s.description || fallback.description,
    whatsappNumber: s.whatsappNumber ? digits(s.whatsappNumber) : fallback.whatsappNumber,
    whatsappMessage: s.whatsappMessage || fallback.whatsappMessage,
    contacts: s.contacts ?? [],
    socialLinks: (s.socialLinks ?? []).filter((l) => l.url),
    hero: {
      eyebrow: s.heroEyebrow ?? fallback.hero.eyebrow,
      titleLine1: s.heroTitleLine1 || fallback.hero.titleLine1,
      titleLine2: s.heroTitleLine2 ?? fallback.hero.titleLine2,
      intro: s.heroIntro ?? fallback.hero.intro,
      note: s.heroNote ?? fallback.hero.note,
    },
    sections: { ...defaultSections, ...(s.sections ?? {}) },
    offices: (data.offices ?? []).map((o) => ({
      ...o,
      id: o._id,
      mapQuery: o.mapQuery || [o.legalName, ...o.addressLines].filter(Boolean).join(", "),
      contacts: o.contacts ?? [],
      photos: (o.photos ?? []).filter((p) => p?.asset?.url),
    })),
    ticker: data.ticker ?? [],
    banners: (data.banners ?? []).map((b) => ({ ...b, id: b._id, image: b.image?.asset?.url ? b.image : null })),
    destinations: (data.destinations ?? []).filter((d) => d.id),
    services: data.services ?? [],
    openNow: data.openNow ?? [],
    onshore: data.onshore ?? [],
    team: (data.team ?? []).map((t) => ({ ...t, photo: t.photo?.asset?.url ? t.photo : null })),
  };
}

export { telHref, whatsappHref } from "./links";
