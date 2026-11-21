import type { PortableTextBlock } from "next-sanity";
import {
  defaultBanners,
  defaultHero,
  destinations as defaultDestinations,
  offices as defaultOffices,
  site,
  tickerItems as defaultTicker,
} from "@/config/site";
import {
  defaultFaqs,
  defaultStats,
  destinationDetails,
  destinationFaqs,
  serviceDetails,
  slugify,
} from "@/config/defaults";
import { sanityQuery } from "@/sanity/fetch";
import { defaultIntro, introSettings, type IntroSettings } from "./intro";
import { LIBRARY_QUERY, POST_QUERY, SITE_QUERY } from "@/sanity/queries";

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
  googlePlaceId?: string | null;
  hours: string[];
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
  trust: boolean;
  reviews: boolean;
  stories: boolean;
  news: boolean;
  instagram: boolean;
};

export type DestinationCard = {
  id: string;
  name: string;
  flag: string;
  summary: string;
  intakes?: string | null;
  tuition?: string | null;
  countries?: { name: string; flag: string }[] | null;
};

export type Story = {
  _id: string;
  name: string;
  course?: string | null;
  university?: string | null;
  flag?: string | null;
  quote: string;
  videoUrl?: string | null;
  photo?: SanityPhoto | null;
};

export type PostCard = {
  _id: string;
  title: string;
  slug: string;
  kind?: "news" | "event" | null;
  date: string;
  eventStart?: string | null;
  eventPlace?: string | null;
  summary: string;
  upcoming?: boolean | null;
  image?: SanityPhoto | null;
};

export type Service = { title: string; slug: string; description: string; icon?: string | null };

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
  stats: { value: string; label: string }[];
  intro: IntroSettings;
  sections: Sections;
  offices: Office[];
  ticker: { tag: string; text: string; link?: string | null }[];
  banners: Banner[];
  destinations: DestinationCard[];
  services: Service[];
  openNow: OpenNowItem[];
  onshore: { _id: string; title: string; provider?: string | null; location?: string | null; summary?: string | null; intakes?: string | null }[];
  team: { _id: string; name: string; role: string; bio?: string | null; languages?: string[] | null; office?: string | null; photo?: SanityPhoto | null }[];
  stories: Story[];
  posts: PostCard[];
  nextEvent: PostCard | null;
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
  trust: true,
  reviews: true,
  stories: true,
  news: true,
  instagram: true,
};

const digits = (v: string) => v.replace(/\D/g, "");
const hasPhoto = <T extends { photo?: SanityPhoto | null }>(x: T) => ({ ...x, photo: x.photo?.asset?.url ? x.photo : null });
const hasImage = <T extends { image?: SanityPhoto | null }>(x: T) => ({ ...x, image: x.image?.asset?.url ? x.image : null });

/** Built-in content used until the Content area has been set up. */
function defaults(): SiteContent {
  return {
    fromCms: false,
    companyName: site.name,
    legalName: site.legalName,
    tagline: site.tagline,
    description: site.description,
    whatsappNumber: site.whatsapp.number,
    whatsappMessage: site.whatsapp.defaultMessage,
    contacts: [
      { kind: "phone", label: "Admissions", value: "+91 81294 40282", primary: true },
      { kind: "email", label: "General enquiries", value: "edusphereoverseas@gmail.com", primary: true },
    ],
    socialLinks: [
      ...site.social.map((s) => ({ platform: s.id, handle: s.handle, url: s.url })),
      { platform: "google", handle: "Edusphere Overseas", url: defaultOffices[0].googleBusinessUrl ?? "" },
    ],
    hero: defaultHero,
    stats: defaultStats(defaultDestinations.length, serviceDetails.length),
    intro: defaultIntro,
    sections: defaultSections,
    offices: defaultOffices
      .filter((o) => o.showOnWebsite)
      .map((o) => ({
        id: o.id,
        name: o.name,
        legalName: o.legalName,
        isHeadOffice: true,
        country: o.country,
        countryCode: o.countryCode,
        addressLines: o.addressLines,
        mapQuery: o.mapQuery,
        googleBusinessUrl: o.googleBusinessUrl,
        hours: [],
        contacts: [
          ...o.phones.map((p) => ({ kind: "phone" as const, label: p.label, value: p.display })),
          ...o.emails.map((e) => ({ kind: "email" as const, label: e.label, value: e.address })),
        ],
        photos: [],
      })),
    ticker: defaultTicker.map((t) => ({ tag: t.tag, text: t.text, link: t.href })),
    banners: defaultBanners.map((b, i) => ({ id: `default-${i}`, ...b })),
    destinations: defaultDestinations.map((d) => ({
      id: d.id,
      name: d.name,
      flag: d.flag,
      summary: d.line,
      intakes: d.intakes,
      countries: destinationDetails[d.id]?.countries ?? null,
    })),
    services: serviceDetails.map(({ title, slug, description, icon }) => ({ title, slug, description, icon })),
    openNow: [],
    onshore: [],
    team: [],
    stories: [],
    posts: [],
    nextEvent: null,
  };
}

type Raw<T> = T & { [k: string]: unknown };
type QueryResult = {
  settings: Raw<{
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
    stats?: { value: string; label: string }[] | null;
    intro?: Partial<IntroSettings> | null;
    sections?: Partial<Sections> | null;
  }> | null;
  offices: (Omit<Office, "id" | "contacts" | "photos" | "mapQuery" | "hours"> & {
    _id: string;
    mapQuery?: string | null;
    hours?: string[] | null;
    contacts?: ContactPoint[] | null;
    photos?: SanityPhoto[] | null;
  })[];
  ticker: SiteContent["ticker"];
  tickerPosts?: { kind?: string | null; title: string; slug: string }[] | null;
  banners: (Omit<Banner, "id"> & { _id: string })[];
  destinations: DestinationCard[];
  services: (Omit<Service, "slug"> & { slug?: string | null })[];
  openNow: OpenNowItem[];
  onshore: SiteContent["onshore"];
  team: SiteContent["team"];
  stories: Story[] | null;
  posts: PostCard[] | null;
  nextEvent: PostCard | null;
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
    stats: s.stats?.length ? s.stats : defaultStats((data.destinations ?? []).length || fallback.destinations.length, (data.services ?? []).length || fallback.services.length),
    intro: introSettings(s.intro),
    sections: { ...defaultSections, ...(s.sections ?? {}) },
    offices: (data.offices ?? []).map((o) => ({
      ...o,
      id: o._id,
      mapQuery: o.mapQuery || [o.legalName, ...o.addressLines].filter(Boolean).join(", "),
      hours: o.hours ?? [],
      contacts: o.contacts ?? [],
      photos: (o.photos ?? []).filter((p) => p?.asset?.url),
    })),
    ticker: [
      ...(data.tickerPosts ?? []).map((p) => ({ tag: p.kind === "event" ? "Event" : "News", text: p.title, link: `/news/${p.slug}` })),
      ...(data.ticker ?? []),
    ],
    banners: (data.banners ?? []).map((b) => ({ ...hasImage(b), id: b._id })),
    destinations: (data.destinations ?? [])
      .filter((d) => d.id)
      .map((d) => ({ ...d, countries: d.countries?.length ? d.countries : (destinationDetails[d.id]?.countries ?? null) })),
    services: (data.services ?? []).map((sv) => ({ ...sv, slug: sv.slug || slugify(sv.title) })),
    openNow: data.openNow ?? [],
    onshore: data.onshore ?? [],
    team: (data.team ?? []).map(hasPhoto),
    stories: (data.stories ?? []).map(hasPhoto),
    posts: (data.posts ?? []).map(hasImage),
    nextEvent: data.nextEvent ? hasImage(data.nextEvent) : null,
  };
}

/* ------------------------------------------------------------------ */
/* Inner pages                                                         */
/* ------------------------------------------------------------------ */

export type Destination = DestinationCard & {
  livingCosts?: string | null;
  intro: string;
  highlights: string[];
  popularCourses: string[];
  visaSteps: string[];
  postStudyWork: string;
  officialLinks: { label: string; url: string }[];
  lastChecked?: string | null;
  faqs: { question: string; answer: string }[];
  heroImage?: SanityPhoto | null;
};

export type ServiceFull = Service & { steps: string[]; included: string[] };

export type Library = {
  destinations: Destination[];
  services: ServiceFull[];
  stories: Story[];
  posts: PostCard[];
  faqs: { question: string; answer: string; category?: string | null }[];
  universities: { _id: string; name: string; flag: string; city?: string | null; website?: string | null; courses?: string[] | null; partner?: boolean | null }[];
  scholarships: {
    _id: string;
    title: string;
    kind?: "scholarship" | "loan" | null;
    provider?: string | null;
    flag?: string | null;
    amount?: string | null;
    eligibility?: string | null;
    deadline?: string | null;
    officialLink: string;
    lastChecked: string;
  }[];
};

const orList = <T,>(v: T[] | null | undefined, fb: T[]) => (v && v.length ? v : fb);

function fullDestination(d: Partial<Destination> & DestinationCard): Destination {
  const fb = destinationDetails[d.id];
  return {
    ...d,
    intro: d.intro || fb?.intro || d.summary,
    highlights: orList(d.highlights, fb?.highlights ?? []),
    popularCourses: orList(d.popularCourses, fb?.popularCourses ?? []),
    countries: orList(d.countries ?? null, fb?.countries ?? []),
    visaSteps: orList(d.visaSteps, fb?.visaSteps ?? []),
    postStudyWork: d.postStudyWork || fb?.postStudyWork || "",
    officialLinks: d.officialLinks ?? [],
    faqs: orList(d.faqs, destinationFaqs(d.name === "United Kingdom" ? "the UK" : d.name === "United States" ? "the USA" : d.name)),
    heroImage: d.heroImage?.asset?.url ? d.heroImage : null,
  };
}

function fullService(sv: Partial<ServiceFull> & { title: string; description: string }): ServiceFull {
  const slug = sv.slug || slugify(sv.title);
  const fb = serviceDetails.find((x) => x.slug === slug || x.title === sv.title);
  return {
    title: sv.title,
    slug,
    description: sv.description,
    icon: sv.icon ?? fb?.icon,
    steps: orList(sv.steps, fb?.steps ?? []),
    included: orList(sv.included, fb?.included ?? []),
  };
}

export async function getLibrary(): Promise<Library> {
  const data = await sanityQuery<Partial<Library> & { destinations?: (Partial<Destination> & DestinationCard)[] }>(LIBRARY_QUERY);
  const site = await getSiteContent();
  const destinations = data?.destinations?.length
    ? data.destinations.filter((d) => d.id).map(fullDestination)
    : site.destinations.map((d) => fullDestination(d));
  const services = data?.services?.length ? data.services.map(fullService) : serviceDetails.map(fullService);
  return {
    destinations,
    services,
    stories: (data?.stories ?? []).map(hasPhoto),
    posts: (data?.posts ?? []).map(hasImage),
    faqs: data?.faqs?.length ? data.faqs : defaultFaqs,
    universities: data?.universities ?? [],
    scholarships: data?.scholarships ?? [],
  };
}

export type Post = PostCard & { body?: PortableTextBlock[] | null; sourceLink?: string | null };

export async function getPost(slug: string): Promise<Post | null> {
  const p = await sanityQuery<Post | null>(POST_QUERY, { slug });
  return p ? hasImage(p) : null;
}

export { telHref, whatsappHref } from "./links";
