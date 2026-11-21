import { banner, destination, service, tickerItem } from "./homeContent";
import { faqItem, linkItem, stat, contactPoint, photo, socialLink } from "./objects";
import { faq, post, scholarship, testimonial, university } from "./library";
import { office } from "./office";
import { onshoreProgramme, openNowProgramme, teamMember } from "./programmes";
import { siteSettings } from "./siteSettings";

export const schemaTypes = [
  // objects
  contactPoint,
  socialLink,
  photo,
  linkItem,
  faqItem,
  stat,
  // documents
  siteSettings,
  office,
  tickerItem,
  banner,
  destination,
  service,
  openNowProgramme,
  onshoreProgramme,
  teamMember,
  testimonial,
  post,
  faq,
  university,
  scholarship,
];

/** Document types that exist once only. */
export const singletonTypes = new Set(["siteSettings"]);
