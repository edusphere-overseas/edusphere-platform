import { defineQuery } from "next-sanity";

const scheduled = `active != false && (!defined(startsAt) || startsAt <= now()) && (!defined(endsAt) || endsAt > now())`;
const photoFields = `{ ..., "alt": coalesce(alt, ""), "caption": caption, asset->{ _id, url, metadata { dimensions, lqip } } }`;
const contact = `{ kind, label, value, primary }`;
const postCard = `_id, title, "slug": slug.current, kind, date, eventStart, eventPlace, summary, "upcoming": kind == "event" && eventStart > now(), "image": image${photoFields}`;

/** Everything the site layout and home page need, in one request. */
export const SITE_QUERY = defineQuery(`{
  "settings": *[_id == "siteSettings"][0]{
    companyName, legalName, tagline, description, whatsappNumber, whatsappMessage,
    "contacts": contacts[show != false]${contact},
    "socialLinks": socialLinks[show != false]{ platform, handle, url },
    heroEyebrow, heroTitleLine1, heroTitleLine2, heroIntro, heroNote,
    "stats": stats[]{ value, label },
    intro,
    sections,
    portalServices
  },
  "offices": *[_type == "office" && showOnWebsite == true && count(addressLines) > 0] | order(isHeadOffice desc, order asc){
    _id, name, legalName, isHeadOffice, country, countryCode, addressLines, mapQuery, googleBusinessUrl, googlePlaceId, timeZone, hours,
    "contacts": contacts[show != false]${contact},
    "photos": photos[]${photoFields}
  },
  "ticker": *[_type == "tickerItem" && ${scheduled}] | order(order asc){ tag, text, link },
  "tickerPosts": *[_type == "post" && show != false && showInTicker == true && (kind != "event" || eventStart > now())] | order(date desc)[0...3]{ kind, title, "slug": slug.current },
  "banners": *[_type == "banner" && ${scheduled}] | order(order asc){
    _id, eyebrow, title, subtitle, flag, ctaLabel, ctaLink, "image": image${photoFields}
  },
  "destinations": *[_type == "destination" && show != false] | order(order asc){
    "id": slug.current, name, flag, summary, intakes, tuition, "countries": countries[]{ name, flag }
  },
  "services": *[_type == "service" && show != false] | order(order asc){ title, "slug": slug.current, description, icon },
  "openNow": *[_type == "openNowProgramme" && show == true && (!defined(closesAt) || closesAt > now())] | order(coalesce(closesAt, "9999") asc, order asc){
    _id, title, kind, country, flag, summary, details, opensAt, closesAt, officialLink, lastChecked, ctaLabel
  },
  "onshore": *[_type == "onshoreProgramme" && show != false] | order(order asc){ _id, title, provider, location, summary, intakes },
  "team": *[_type == "teamMember" && show != false] | order(order asc){
    _id, name, role, bio, languages, "office": office->name, "photo": photo${photoFields}
  },
  "stories": *[_type == "testimonial" && show != false && consent == true && featured != false] | order(order asc)[0...6]{
    _id, name, course, university, flag, quote, videoUrl, "photo": photo${photoFields}
  },
  "posts": *[_type == "post" && show != false] | order(date desc)[0...3]{ ${postCard} },
  "nextEvent": *[_type == "post" && show != false && kind == "event" && eventStart > now()] | order(eventStart asc)[0]{ ${postCard} }
}`);

/** Content for the inner pages (destinations, services, stories, news, FAQs, universities, scholarships). */
export const LIBRARY_QUERY = defineQuery(`{
  "destinations": *[_type == "destination" && show != false] | order(order asc){
    "id": slug.current, name, flag, summary, intakes, tuition, livingCosts, intro, highlights, popularCourses,
    "countries": countries[]{ name, flag }, visaSteps, postStudyWork, "officialLinks": officialLinks[]{ label, url }, lastChecked,
    "faqs": faqs[]{ question, answer }, "heroImage": heroImage${photoFields}
  },
  "services": *[_type == "service" && show != false] | order(order asc){ title, "slug": slug.current, description, icon, steps, included },
  "stories": *[_type == "testimonial" && show != false && consent == true] | order(order asc){
    _id, name, course, university, flag, quote, videoUrl, "photo": photo${photoFields}
  },
  "posts": *[_type == "post" && show != false] | order(date desc){ ${postCard} },
  "faqs": *[_type == "faq" && show != false] | order(order asc){ question, answer, category },
  "universities": *[_type == "university" && show != false] | order(name asc){ _id, name, flag, city, website, courses, partner },
  "scholarships": *[_type == "scholarship" && show != false] | order(order asc){
    _id, title, kind, provider, flag, amount, eligibility, deadline, officialLink, lastChecked
  }
}`);

export const POST_QUERY = defineQuery(`*[_type == "post" && show != false && slug.current == $slug][0]{
  ${postCard}, body, sourceLink
}`);
