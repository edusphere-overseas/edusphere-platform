/**
 * Site-wide settings for Step 1.
 *
 * In Step 2 these values move into Sanity (Content area of the admin portal):
 * Offices, Contact details and Site settings. Until then, edit them here.
 */

export type Office = {
  id: string;
  name: string;
  legalName: string;
  countryCode: string; // flag file in /public/flags
  country: string;
  addressLines: string[];
  mapQuery: string;
  googleBusinessUrl?: string;
  timeZone: string;
  phones: { label: string; display: string; tel: string }[];
  emails: { label: string; address: string }[];
  showOnWebsite: boolean;
};

const MANGALORE_ADDRESS =
  "1st Floor, Empire Mall, MG Rd, Kodailbail, Mangaluru, Karnataka 575003";

export const site = {
  name: "Edusphere Overseas",
  legalName: "Edusphere Overseas Pvt. Ltd.",
  tagline: "Your Guide to Study Abroad",
  url: "https://www.edusphereoverseas.com",
  description:
    "Personal study abroad guidance for the UK, Europe, Australia, New Zealand, the USA and Canada, from your first question to your first day on campus.",
  whatsapp: {
    number: "918129440282",
    defaultMessage:
      "Hi Edusphere, I'd like to know more about studying abroad.",
  },
  social: [
    {
      id: "instagram",
      label: "Instagram",
      handle: "@edusphere_overseas",
      url: "https://www.instagram.com/edusphere_overseas/",
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      handle: "Edusphere Overseas",
      url: "https://www.linkedin.com/company/edusphere-overseas",
    },
  ],
} as const;

export const offices: Office[] = [
  {
    id: "mangalore",
    name: "Mangaluru",
    legalName: "Edusphere Overseas Pvt. Ltd.",
    countryCode: "in",
    country: "India",
    addressLines: [
      "1st Floor, Empire Mall, MG Rd",
      "Kodailbail, Mangaluru",
      "Karnataka 575003",
    ],
    mapQuery: `Edusphere Overseas Pvt. Ltd., ${MANGALORE_ADDRESS}`,
    googleBusinessUrl: "https://www.google.com/search?kgmid=%2Fg%2F11kh_rb7qt",
    timeZone: "Asia/Kolkata",
    phones: [{ label: "Admissions", display: "+91 81294 40282", tel: "+918129440282" }],
    emails: [{ label: "General enquiries", address: "edusphereoverseas@gmail.com" }],
    showOnWebsite: true,
  },
];

export const visibleOffices = offices.filter((o) => o.showOnWebsite);

export function whatsappLink(message: string = site.whatsapp.defaultMessage) {
  return `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(message)}`;
}

export function googleDirections(query: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export function appleDirections(query: string) {
  return `https://maps.apple.com/?daddr=${encodeURIComponent(query)}`;
}

export function googleMapEmbed(query: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;
}

export type Destination = {
  id: string;
  name: string;
  flag: string;
  intakes: string;
  line: string;
};

/** Destination cards on the home page. Country pages arrive in Step 2. */
export const destinations: Destination[] = [
  {
    id: "uk",
    name: "United Kingdom",
    flag: "gb",
    intakes: "Main intakes: September and January",
    line: "World-ranked universities and one-year master's degrees.",
  },
  {
    id: "europe",
    name: "Europe",
    flag: "eu",
    intakes: "Main intake: September and October",
    line: "Germany, France, Ireland, the Netherlands and more.",
  },
  {
    id: "australia",
    name: "Australia",
    flag: "au",
    intakes: "Main intakes: February and July",
    line: "Practical degrees and a welcoming student life.",
  },
  {
    id: "new-zealand",
    name: "New Zealand",
    flag: "nz",
    intakes: "Main intakes: February and July",
    line: "Small classes, safe cities and stunning landscapes.",
  },
  {
    id: "usa",
    name: "United States",
    flag: "us",
    intakes: "Main intakes: Fall (August) and Spring (January)",
    line: "Flexible programmes across thousands of institutions.",
  },
  {
    id: "canada",
    name: "Canada",
    flag: "ca",
    intakes: "Main intakes: September, January and May",
    line: "Respected qualifications in a diverse, friendly country.",
  },
];

/** Flags that loop along the bottom of the hero. */
export const flagStrip: { code: string; name: string }[] = [
  { code: "gb", name: "United Kingdom" },
  { code: "ie", name: "Ireland" },
  { code: "de", name: "Germany" },
  { code: "fr", name: "France" },
  { code: "nl", name: "Netherlands" },
  { code: "es", name: "Spain" },
  { code: "it", name: "Italy" },
  { code: "au", name: "Australia" },
  { code: "nz", name: "New Zealand" },
  { code: "us", name: "United States" },
  { code: "ca", name: "Canada" },
];

/** News ticker. In Step 2 these come from Sanity with start and end dates. */
export const tickerItems: { tag: string; text: string; href?: string }[] = [
  { tag: "Counselling", text: "Free one-to-one counselling sessions in Mangaluru, online or in person" },
  { tag: "Destinations", text: "Personal guidance for the UK, Europe, Australia, New Zealand, the USA and Canada" },
  { tag: "UK onshore", text: "Already studying in the UK? Ask us about onshore programmes" },
  { tag: "Instagram", text: "Follow @edusphere_overseas for admission and visa updates", href: "https://www.instagram.com/edusphere_overseas/" },
];

export const journeySteps = [
  { title: "Counselling", text: "A free conversation about your goals, budget and timeline." },
  { title: "Shortlist", text: "Countries, universities and courses that genuinely fit you." },
  { title: "Apply", text: "Applications, statements and documents prepared with care." },
  { title: "Offer", text: "We help you compare offers and secure your place." },
  { title: "Visa", text: "A clear checklist and guidance through every visa step." },
  { title: "Fly", text: "Pre-departure support, accommodation and airport pickup." },
];

/** Student services. Icons map to the pick-list in the Content area. */
export const defaultServices: { title: string; description: string; icon: string }[] = [
  {
    title: "Counselling and shortlisting",
    description: "An honest conversation about your goals, then a shortlist of courses and universities that genuinely suit you.",
    icon: "messages",
  },
  {
    title: "University applications",
    description: "Applications, statements of purpose and references prepared carefully, and submitted on time.",
    icon: "graduation",
  },
  {
    title: "Visa guidance",
    description: "A clear document checklist, financial planning and interview preparation for your student visa.",
    icon: "file-check",
  },
  {
    title: "Scholarship assistance",
    description: "We look for scholarships and fee awards you may qualify for and help you put your best case forward.",
    icon: "award",
  },
  {
    title: "Accommodation abroad",
    description: "Help finding safe, well-located student housing before you leave home.",
    icon: "bed",
  },
  {
    title: "Airport pickup and drop",
    description: "A friendly face when you land, and a smooth start to your first week.",
    icon: "plane",
  },
  {
    title: "Post-study work visa",
    description: "Guidance on staying on to work after your degree, through appropriately regulated advisers where required.",
    icon: "briefcase",
  },
  {
    title: "UK onshore programmes",
    description: "Already in the UK? Onshore admission options alongside your post-study plans.",
    icon: "landmark",
  },
];

export const defaultHero = {
  eyebrow: "Study abroad consultancy · Head office in Mangaluru",
  titleLine1: "Your future,",
  titleLine2: "mapped out.",
  intro:
    "Personal guidance for studying in the UK, Europe, Australia, New Zealand, the USA and Canada. From your first question to your first day on campus, one team walks the whole way with you.",
  note: "Free first consultation · In person in Mangaluru or online, wherever you are",
};

export const defaultBanners: { eyebrow: string; title: string; subtitle: string; flag?: string; ctaLabel: string; ctaLink: string }[] = [
  {
    eyebrow: "Free consultation",
    title: "Plan your study abroad journey with us",
    subtitle: "One-to-one guidance on countries, courses, costs and visas, in Mangaluru or online.",
    ctaLabel: "Book a free consultation",
    ctaLink: "/#contact",
  },
  {
    eyebrow: "UK onshore",
    title: "Already studying in the UK?",
    subtitle: "Ask us about onshore admission programmes and planning your next step after your course.",
    flag: "gb",
    ctaLabel: "Find out more",
    ctaLink: "/#uk-onshore",
  },
];
