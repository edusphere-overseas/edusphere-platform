import { banner, destination, service, tickerItem } from "./homeContent";
import { contactPoint, photo, socialLink } from "./objects";
import { office } from "./office";
import { onshoreProgramme, openNowProgramme, teamMember } from "./programmes";
import { siteSettings } from "./siteSettings";

export const schemaTypes = [
  // objects
  contactPoint,
  socialLink,
  photo,
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
];

/** Document types that exist once only. */
export const singletonTypes = new Set(["siteSettings"]);
