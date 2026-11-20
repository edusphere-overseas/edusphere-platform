import { defineField, defineType } from "sanity";
import { GalleryHorizontal, Globe2, HandHelping, Megaphone } from "lucide-react";
import { flagOptions, serviceIconOptions } from "../options";

const scheduleFields = [
  defineField({ name: "active", title: "Switched on", type: "boolean", initialValue: true }),
  defineField({ name: "startsAt", title: "Show from (optional)", type: "datetime" }),
  defineField({
    name: "endsAt",
    title: "Hide after (optional)",
    type: "datetime",
    validation: (r) =>
      r.custom((end, ctx) => {
        const start = (ctx.parent as { startsAt?: string })?.startsAt;
        return !end || !start || end > start || "Must be after the start date";
      }),
  }),
  defineField({ name: "order", type: "number", initialValue: 10 }),
];

export const tickerItem = defineType({
  name: "tickerItem",
  title: "News ticker item",
  type: "document",
  icon: Megaphone,
  fields: [
    defineField({ name: "tag", title: "Label", type: "string", description: 'Short, e.g. "Visa update".', validation: (r) => r.required().max(18) }),
    defineField({ name: "text", title: "Message", type: "string", validation: (r) => r.required().max(110) }),
    defineField({ name: "link", title: "Link (optional)", type: "url", validation: (r) => r.uri({ allowRelative: true }) }),
    ...scheduleFields,
  ],
  orderings: [{ title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "text", tag: "tag", active: "active" },
    prepare: ({ title, tag, active }) => ({ title, subtitle: `${tag ?? ""}${active === false ? " · off" : ""}` }),
  },
});

export const banner = defineType({
  name: "banner",
  title: "Banner",
  type: "document",
  icon: GalleryHorizontal,
  fields: [
    defineField({ name: "eyebrow", title: "Small label", type: "string" }),
    defineField({ name: "title", type: "string", validation: (r) => r.required().max(70) }),
    defineField({ name: "subtitle", type: "text", rows: 2, validation: (r) => r.max(180) }),
    defineField({ name: "image", type: "photo", description: "Wide photo, at least 1600 × 900. Optional." }),
    defineField({ name: "flag", title: "Flag (optional)", type: "string", options: { list: flagOptions } }),
    defineField({ name: "ctaLabel", title: "Button text", type: "string" }),
    defineField({
      name: "ctaLink",
      title: "Button link",
      type: "url",
      description: "A page on this site (e.g. /#contact) or a full link. Leave empty to open WhatsApp.",
      validation: (r) => r.uri({ allowRelative: true }),
    }),
    ...scheduleFields,
  ],
  orderings: [{ title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "title", subtitle: "eyebrow", media: "image", active: "active" },
    prepare: ({ title, subtitle, media, active }) => ({ title, media, subtitle: `${subtitle ?? ""}${active === false ? " · off" : ""}` }),
  },
});

export const destination = defineType({
  name: "destination",
  title: "Destination",
  type: "document",
  icon: Globe2,
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", options: { source: "name" }, validation: (r) => r.required() }),
    defineField({ name: "flag", type: "string", options: { list: flagOptions }, validation: (r) => r.required() }),
    defineField({ name: "summary", title: "One-line summary", type: "string", validation: (r) => r.required().max(90) }),
    defineField({ name: "intakes", title: "Intakes", type: "string", description: 'e.g. "Main intakes: September and January"' }),
    defineField({ name: "show", title: "Show on website", type: "boolean", initialValue: true }),
    defineField({ name: "order", type: "number", initialValue: 10 }),
  ],
  orderings: [{ title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "name", subtitle: "summary" } },
});

export const service = defineType({
  name: "service",
  title: "Student service",
  type: "document",
  icon: HandHelping,
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required().max(40) }),
    defineField({ name: "description", type: "text", rows: 3, validation: (r) => r.required().max(180) }),
    defineField({ name: "icon", type: "string", options: { list: serviceIconOptions }, initialValue: "globe" }),
    defineField({ name: "show", title: "Show on website", type: "boolean", initialValue: true }),
    defineField({ name: "order", type: "number", initialValue: 10 }),
  ],
  orderings: [{ title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "title", subtitle: "description", show: "show" },
    prepare: ({ title, subtitle, show }) => ({ title: `${title}${show === false ? " (hidden)" : ""}`, subtitle }),
  },
});
