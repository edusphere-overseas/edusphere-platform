"use client";

import { useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Card, Flex, Heading, Stack, Text } from "@sanity/ui";
import { defaultBanners, defaultHero, destinations, offices, site, tickerItems } from "@/config/site";
import { defaultFaqs, defaultStats, destinationDetails, serviceDetails } from "@/config/defaults";
import { apiVersion } from "../env";

const key = (prefix: string, i: number) => `${prefix}${i}`;

/** Fixed IDs, so running the tool again never duplicates anything. */
const serviceIds: Record<string, { id: string; order: number }> = {
  counselling: { id: "service-1", order: 10 },
  applications: { id: "service-2", order: 20 },
  "english-tests": { id: "service-9", order: 25 },
  visa: { id: "service-3", order: 30 },
  scholarships: { id: "service-4", order: 40 },
  "education-loans": { id: "service-10", order: 45 },
  accommodation: { id: "service-5", order: 50 },
  "airport-pickup": { id: "service-6", order: 60 },
  "pre-departure": { id: "service-11", order: 65 },
  "post-study-work": { id: "service-7", order: 70 },
  "uk-onshore": { id: "service-8", order: 80 },
};

const faqCategories = ["start", "parents", "start", "start", "visa", "arrival"];

/**
 * Fields added in November 2026. On items that already exist, only these are
 * filled in, and only where they are still empty.
 */
const newFields: Record<string, string[]> = {
  siteSettings: ["intro", "stats", "sections.trust", "sections.reviews", "sections.stories", "sections.news", "sections.instagram"],
  destination: ["intro", "highlights", "popularCourses", "countries", "visaSteps", "postStudyWork"],
  service: ["slug", "steps", "included"],
};

const pick = (doc: Record<string, unknown>, paths: string[]) => {
  const out: Record<string, unknown> = {};
  for (const p of paths) {
    const [a, b] = p.split(".");
    const v = b ? (doc[a] as Record<string, unknown> | undefined)?.[b] : doc[a];
    if (v !== undefined) out[p] = v;
  }
  return out;
};

function buildDocuments() {
  const head = offices[0];
  const docs: Record<string, unknown>[] = [];

  docs.push({
    _id: "siteSettings",
    _type: "siteSettings",
    companyName: site.name,
    legalName: site.legalName,
    tagline: site.tagline,
    description: site.description,
    whatsappNumber: "+91 81294 40282",
    whatsappMessage: site.whatsapp.defaultMessage,
    contacts: [
      { _key: "c0", _type: "contactPoint", kind: "phone", label: "Admissions", value: "+91 81294 40282", primary: true, show: true },
      { _key: "c1", _type: "contactPoint", kind: "whatsapp", label: "WhatsApp", value: "+91 81294 40282", primary: true, show: true },
      { _key: "c2", _type: "contactPoint", kind: "email", label: "General enquiries", value: "edusphereoverseas@gmail.com", primary: true, show: true },
    ],
    socialLinks: [
      ...site.social.map((s, i) => ({ _key: key("s", i), _type: "socialLink", platform: s.id, handle: s.handle, url: s.url, show: true })),
      { _key: "s9", _type: "socialLink", platform: "google", handle: "Edusphere Overseas", url: head.googleBusinessUrl, show: true },
    ],
    heroEyebrow: defaultHero.eyebrow,
    heroTitleLine1: defaultHero.titleLine1,
    heroTitleLine2: defaultHero.titleLine2,
    heroIntro: defaultHero.intro,
    heroNote: defaultHero.note,
    sections: {
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
    },
    intro: { show: true, seconds: 2.5, replayMinutes: 30 },
    stats: defaultStats(destinations.length, serviceDetails.length).map((st, i) => ({ _key: key("n", i), _type: "stat", ...st })),
  });

  docs.push({
    _id: "office-mangaluru",
    _type: "office",
    name: head.name,
    legalName: head.legalName,
    isHeadOffice: true,
    country: head.country,
    countryCode: head.countryCode,
    addressLines: head.addressLines,
    mapQuery: head.mapQuery,
    googleBusinessUrl: head.googleBusinessUrl,
    timeZone: head.timeZone,
    contacts: [
      ...head.phones.map((p, i) => ({ _key: key("p", i), _type: "contactPoint", kind: "phone", label: p.label, value: p.display, primary: i === 0, show: true })),
      ...head.emails.map((e, i) => ({ _key: key("e", i), _type: "contactPoint", kind: "email", label: e.label, value: e.address, primary: i === 0, show: true })),
    ],
    showOnWebsite: true,
    order: 1,
  });
  // Offices to complete later: hidden until an address is added and "Show on website" is ticked.
  docs.push({ _id: "office-london", _type: "office", name: "London", country: "United Kingdom", countryCode: "gb", timeZone: "Europe/London", showOnWebsite: false, order: 2 });
  docs.push({ _id: "office-dubai", _type: "office", name: "Dubai", country: "United Arab Emirates", countryCode: "ae", timeZone: "Asia/Dubai", showOnWebsite: false, order: 3 });
  docs.push({ _id: "office-bengaluru", _type: "office", name: "Bengaluru", country: "India", countryCode: "in", timeZone: "Asia/Kolkata", showOnWebsite: false, order: 4 });

  tickerItems.forEach((t, i) =>
    docs.push({ _id: `ticker-${i + 1}`, _type: "tickerItem", tag: t.tag, text: t.text, link: t.href, active: true, order: (i + 1) * 10 }),
  );
  defaultBanners.forEach((b, i) =>
    docs.push({ _id: `banner-${i + 1}`, _type: "banner", ...b, active: true, order: (i + 1) * 10 }),
  );
  destinations.forEach((d, i) =>
    docs.push({
      _id: `destination-${d.id}`,
      _type: "destination",
      name: d.name,
      slug: { _type: "slug", current: d.id },
      flag: d.flag,
      summary: d.line,
      intakes: d.intakes,
      intro: destinationDetails[d.id]?.intro,
      highlights: destinationDetails[d.id]?.highlights,
      popularCourses: destinationDetails[d.id]?.popularCourses,
      countries: destinationDetails[d.id]?.countries?.map((c, n) => ({ _key: key("c", n), ...c })),
      visaSteps: destinationDetails[d.id]?.visaSteps,
      postStudyWork: destinationDetails[d.id]?.postStudyWork,
      show: true,
      order: (i + 1) * 10,
    }),
  );
  serviceDetails.forEach((sv) => {
    const { id, order } = serviceIds[sv.slug];
    docs.push({
      _id: id,
      _type: "service",
      title: sv.title,
      slug: { _type: "slug", current: sv.slug },
      description: sv.description,
      icon: sv.icon,
      steps: sv.steps,
      included: sv.included,
      show: true,
      order,
    });
  });
  defaultFaqs.forEach((f, i) =>
    docs.push({ _id: `faq-${i + 1}`, _type: "faq", ...f, category: faqCategories[i], show: true, order: (i + 1) * 10 }),
  );
  return docs;
}

export function StarterContent() {
  const client = useClient({ apiVersion });
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const docs = buildDocuments();

  async function run() {
    setState("working");
    try {
      const existing: { _id: string; [k: string]: unknown }[] = await client.fetch(`*[_id in $ids]`, { ids: docs.map((d) => d._id) });
      const byId = new Map(existing.map((e) => [e._id, e]));
      const tx = client.transaction();
      let filled = 0;
      for (const d of docs) {
        const current = byId.get(d._id as string);
        if (!current) {
          tx.createIfNotExists(d as { _id: string; _type: string });
          continue;
        }
        // Existing item: fill only new fields that are still empty.
        const fill = pick(d, newFields[d._type as string] ?? []);
        const missing = Object.fromEntries(Object.entries(fill).filter(([p]) => pick(current, [p])[p] === undefined));
        if (Object.keys(missing).length) {
          if (Object.keys(missing).some((p) => p.startsWith("sections."))) tx.patch(d._id as string, (pt) => pt.setIfMissing({ sections: {} }));
          tx.patch(d._id as string, (pt) => pt.setIfMissing(missing));
          filled++;
        }
      }
      await tx.commit();
      const added = docs.length - existing.length;
      setMessage(
        added === 0 && filled === 0
          ? "Everything was already there. Nothing was changed."
          : [
              added ? `Added ${added} new item${added === 1 ? "" : "s"}.` : "",
              filled ? `Filled in new, empty fields on ${filled} existing item${filled === 1 ? "" : "s"}.` : "",
              "Nothing you had written was changed.",
            ]
              .filter(Boolean)
              .join(" "),
      );
      setState("done");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
      setState("error");
    }
  }

  return (
    <Box padding={5} style={{ maxWidth: 720 }}>
      <Stack gap={5}>
        <Heading size={3}>Starter content</Heading>
        <Text muted size={2}>
          Adds Edusphere&apos;s current website content so you can edit it here instead of starting from blank pages:
          website settings, the Mangaluru office (plus hidden London, Dubai and Bengaluru offices to complete),
          news ticker items, two banners, six destinations with their country-page text, eleven student services and
          six FAQs.
        </Text>
        <Text muted size={2}>
          It never overwrites anything. On items that already exist it only fills in fields added in November 2026
          (country-page text, service steps, numbers and new section switches) where they are still empty. It is safe
          to run more than once.
        </Text>
        <Card padding={4} radius={3} tone="primary" border>
          <Flex align="center" gap={4} wrap="wrap">
            <Box flex={1}>
              <Text size={2} weight="semibold">
                {docs.length} items ready to add or complete
              </Text>
            </Box>
            <Button
              text={state === "working" ? "Working…" : "Add starter content"}
              tone="primary"
              disabled={state === "working"}
              onClick={run}
            />
          </Flex>
        </Card>
        {state === "done" && (
          <Card padding={4} radius={3} tone="positive" border>
            <Text size={2}>{message} Open “Content” in the top bar to review and edit.</Text>
          </Card>
        )}
        {state === "error" && (
          <Card padding={4} radius={3} tone="critical" border>
            <Text size={2}>Something went wrong: {message}</Text>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
