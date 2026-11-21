import { defineArrayMember, defineField, defineType } from "sanity";
import { CircleHelp, Coins, Newspaper, Quote, School } from "lucide-react";
import { flagOptions } from "../options";

const showAndOrder = [
  defineField({ name: "show", title: "Show on website", type: "boolean", initialValue: true }),
  defineField({ name: "order", type: "number", initialValue: 10 }),
];

/** Student testimonials. Only with the student's written consent. */
export const testimonial = defineType({
  name: "testimonial",
  title: "Success story",
  type: "document",
  icon: Quote,
  fields: [
    defineField({ name: "name", title: "Student name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "course", type: "string" }),
    defineField({ name: "university", type: "string" }),
    defineField({ name: "flag", title: "Country", type: "string", options: { list: flagOptions } }),
    defineField({ name: "quote", type: "text", rows: 4, validation: (r) => r.required().max(400) }),
    defineField({ name: "photo", type: "photo" }),
    defineField({ name: "videoUrl", title: "Video link (YouTube)", type: "url" }),
    defineField({
      name: "consent",
      title: "Written consent received",
      type: "boolean",
      initialValue: false,
      description: "Stories only appear on the website when this is ticked.",
      validation: (r) => r.custom((v) => v === true || "Tick this only when the student has given written consent"),
    }),
    defineField({ name: "featured", title: "Show on home page", type: "boolean", initialValue: true }),
    ...showAndOrder,
  ],
  orderings: [{ title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "name", subtitle: "university", media: "photo" } },
});

export const post = defineType({
  name: "post",
  title: "News or event",
  type: "document",
  icon: Newspaper,
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required().max(100) }),
    defineField({ name: "slug", type: "slug", options: { source: "title" }, validation: (r) => r.required() }),
    defineField({
      name: "kind",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "News or update", value: "news" },
          { title: "Event, fair or webinar", value: "event" },
        ],
        layout: "radio",
      },
      initialValue: "news",
    }),
    defineField({ name: "date", title: "Published on", type: "date", validation: (r) => r.required() }),
    defineField({ name: "eventStart", title: "Event starts", type: "datetime", hidden: ({ parent }) => parent?.kind !== "event" }),
    defineField({ name: "eventPlace", title: "Event place or online link text", type: "string", hidden: ({ parent }) => parent?.kind !== "event" }),
    defineField({ name: "summary", type: "text", rows: 3, validation: (r) => r.required().max(240) }),
    defineField({ name: "image", type: "photo" }),
    defineField({
      name: "body",
      type: "array",
      of: [defineArrayMember({ type: "block", styles: [{ title: "Normal", value: "normal" }, { title: "Heading", value: "h2" }, { title: "Subheading", value: "h3" }] })],
    }),
    defineField({ name: "sourceLink", title: "Official source (optional)", type: "url" }),
    defineField({ name: "showInTicker", title: "Also show in the news ticker", type: "boolean", initialValue: false }),
    defineField({ name: "show", title: "Show on website", type: "boolean", initialValue: true }),
  ],
  orderings: [{ title: "Newest first", name: "dateDesc", by: [{ field: "date", direction: "desc" }] }],
  preview: { select: { title: "title", subtitle: "date", media: "image" } },
});

export const faq = defineType({
  name: "faq",
  title: "FAQ",
  type: "document",
  icon: CircleHelp,
  fields: [
    defineField({ name: "question", type: "string", validation: (r) => r.required() }),
    defineField({ name: "answer", type: "text", rows: 4, validation: (r) => r.required() }),
    defineField({
      name: "category",
      type: "string",
      options: {
        list: [
          { title: "Getting started", value: "start" },
          { title: "Visas", value: "visa" },
          { title: "Costs and funding", value: "costs" },
          { title: "For parents", value: "parents" },
          { title: "After you arrive", value: "arrival" },
        ],
      },
    }),
    ...showAndOrder,
  ],
  orderings: [{ title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "question", subtitle: "category" } },
});

export const university = defineType({
  name: "university",
  title: "University",
  type: "document",
  icon: School,
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "flag", title: "Country", type: "string", options: { list: flagOptions }, validation: (r) => r.required() }),
    defineField({ name: "city", type: "string" }),
    defineField({ name: "website", type: "url" }),
    defineField({ name: "courses", title: "Course areas", type: "array", of: [defineArrayMember({ type: "string" })], options: { layout: "tags" } }),
    defineField({ name: "partner", title: "Partner university", type: "boolean", initialValue: true }),
    ...showAndOrder,
  ],
  orderings: [{ title: "Name", name: "nameAsc", by: [{ field: "name", direction: "asc" }] }],
  preview: { select: { title: "name", subtitle: "city" } },
});

export const scholarship = defineType({
  name: "scholarship",
  title: "Scholarship or loan",
  type: "document",
  icon: Coins,
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "kind",
      title: "Type",
      type: "string",
      options: { list: [{ title: "Scholarship", value: "scholarship" }, { title: "Education loan", value: "loan" }], layout: "radio" },
      initialValue: "scholarship",
    }),
    defineField({ name: "provider", type: "string" }),
    defineField({ name: "flag", title: "Country", type: "string", options: { list: flagOptions } }),
    defineField({ name: "amount", title: "Value or loan amount", type: "string" }),
    defineField({ name: "eligibility", type: "text", rows: 3 }),
    defineField({ name: "deadline", type: "date" }),
    defineField({ name: "officialLink", title: "Official source", type: "url", validation: (r) => r.required() }),
    defineField({ name: "lastChecked", title: "Facts last checked on", type: "date", validation: (r) => r.required() }),
    ...showAndOrder,
  ],
  orderings: [{ title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "title", subtitle: "provider" } },
});

