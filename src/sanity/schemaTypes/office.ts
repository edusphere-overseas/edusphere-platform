import { defineField, defineType } from "sanity";
import { Building2 } from "lucide-react";
import { flagOptions, timeZoneOptions } from "../options";

export const office = defineType({
  name: "office",
  title: "Office",
  type: "document",
  icon: Building2,
  fields: [
    defineField({ name: "name", title: "City / office name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "legalName", title: "Company name at this office", type: "string" }),
    defineField({ name: "isHeadOffice", title: "Head office", type: "boolean", initialValue: false }),
    defineField({ name: "country", type: "string", validation: (r) => r.required() }),
    defineField({ name: "countryCode", title: "Flag", type: "string", options: { list: flagOptions }, validation: (r) => r.required() }),
    defineField({
      name: "addressLines",
      title: "Address",
      type: "array",
      of: [{ type: "string" }],
      description: "One line per row. An office without an address is never shown.",
    }),
    defineField({
      name: "mapQuery",
      title: "Map search text",
      type: "string",
      description: "What to search for in Google and Apple Maps. Usually the company name and full address.",
    }),
    defineField({ name: "googleBusinessUrl", title: "Google Business link", type: "url" }),
    defineField({
      name: "googlePlaceId",
      title: "Google Place ID",
      type: "string",
      description: "Used later to show this office's Google reviews.",
    }),
    defineField({ name: "timeZone", type: "string", options: { list: timeZoneOptions }, initialValue: "Asia/Kolkata" }),
    defineField({ name: "contacts", title: "Contact details", type: "array", of: [{ type: "contactPoint" }] }),
    defineField({
      name: "photos",
      title: "Office photos",
      type: "array",
      of: [{ type: "photo" }],
      options: { layout: "grid" },
      description: "Real photos of the office. The gallery stays hidden until there are photos.",
    }),
    defineField({ name: "showOnWebsite", title: "Show on website", type: "boolean", initialValue: false }),
    defineField({ name: "order", title: "Order", type: "number", initialValue: 10 }),
  ],
  orderings: [{ title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "name", country: "country", show: "showOnWebsite", head: "isHeadOffice" },
    prepare: ({ title, country, show, head }) => ({
      title: `${title}${head ? " (head office)" : ""}`,
      subtitle: `${country ?? ""}${show ? "" : " · hidden"}`,
    }),
  },
});
