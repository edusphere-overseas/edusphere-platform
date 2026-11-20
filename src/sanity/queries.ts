import { defineQuery } from "next-sanity";

const scheduled = `active != false && (!defined(startsAt) || startsAt <= now()) && (!defined(endsAt) || endsAt > now())`;
const photoFields = `{ ..., "alt": coalesce(alt, ""), "caption": caption, asset->{ _id, url, metadata { dimensions, lqip } } }`;
const contact = `{ kind, label, value, primary }`;

/** Everything the site layout and home page need, in one request. */
export const SITE_QUERY = defineQuery(`{
  "settings": *[_id == "siteSettings"][0]{
    companyName, legalName, tagline, description, whatsappNumber, whatsappMessage,
    "contacts": contacts[show != false]${contact},
    "socialLinks": socialLinks[show != false]{ platform, handle, url },
    heroEyebrow, heroTitleLine1, heroTitleLine2, heroIntro, heroNote,
    sections
  },
  "offices": *[_type == "office" && showOnWebsite == true && count(addressLines) > 0] | order(isHeadOffice desc, order asc){
    _id, name, legalName, isHeadOffice, country, countryCode, addressLines, mapQuery, googleBusinessUrl, timeZone,
    "contacts": contacts[show != false]${contact},
    "photos": photos[]${photoFields}
  },
  "ticker": *[_type == "tickerItem" && ${scheduled}] | order(order asc){ tag, text, link },
  "banners": *[_type == "banner" && ${scheduled}] | order(order asc){
    _id, eyebrow, title, subtitle, flag, ctaLabel, ctaLink, "image": image${photoFields}
  },
  "destinations": *[_type == "destination" && show != false] | order(order asc){
    "id": slug.current, name, flag, summary, intakes
  },
  "services": *[_type == "service" && show != false] | order(order asc){ title, description, icon },
  "openNow": *[_type == "openNowProgramme" && show == true && (!defined(closesAt) || closesAt > now())] | order(coalesce(closesAt, "9999") asc, order asc){
    _id, title, kind, country, flag, summary, details, opensAt, closesAt, officialLink, lastChecked, ctaLabel
  },
  "onshore": *[_type == "onshoreProgramme" && show != false] | order(order asc){ _id, title, provider, location, summary, intakes },
  "team": *[_type == "teamMember" && show != false] | order(order asc){
    _id, name, role, bio, languages, "office": office->name, "photo": photo${photoFields}
  }
}`);
