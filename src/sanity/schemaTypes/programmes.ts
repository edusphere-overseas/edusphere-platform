import { defineArrayMember, defineField, defineType } from "sanity";
import { BadgeCheck, Landmark, Users } from "lucide-react";
import { flagOptions } from "../options";

/** Limited-time visas, schemes and scholarships for the "Open now" section. */
export const openNowProgramme = defineType({
  name: "openNowProgramme",
  title: '"Open now" programme',
  type: "document",
  icon: BadgeCheck,
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required().max(70) }),
    defineField({
      name: "kind",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Visa or work scheme", value: "visa" },
          { title: "Scholarship", value: "scholarship" },
          { title: "Other programme", value: "other" },
        ],
        layout: "radio",
      },
      initialValue: "visa",
      validation: (r) => r.required(),
    }),
    defineField({ name: "country", type: "string" }),
    defineField({ name: "flag", type: "string", options: { list: flagOptions } }),
    defineField({ name: "summary", type: "text", rows: 3, validation: (r) => r.required().max(220) }),
    defineField({
      name: "details",
      title: "Details (eligibility, documents, how we help)",
      type: "array",
      of: [defineArrayMember({ type: "block", styles: [{ title: "Normal", value: "normal" }, { title: "Heading", value: "h3" }] })],
    }),
    defineField({ name: "opensAt", title: "Applications open", type: "datetime" }),
    defineField({ name: "closesAt", title: "Applications close", type: "datetime" }),
    defineField({
      name: "officialLink",
      title: "Official source",
      type: "url",
      description: "The government or scholarship body's own page, so visitors can check the facts.",
    }),
    defineField({
      name: "lastChecked",
      title: "Facts last checked on",
      type: "date",
      description: "Rules change often. Update this each time an expert re-checks the details.",
      validation: (r) => r.required(),
    }),
    defineField({ name: "ctaLabel", title: "Button text", type: "string", initialValue: "Ask an expert" }),
    defineField({ name: "show", title: "Show on website", type: "boolean", initialValue: false }),
    defineField({ name: "order", type: "number", initialValue: 10 }),
  ],
  orderings: [{ title: "Closing soonest", name: "closesAsc", by: [{ field: "closesAt", direction: "asc" }] }],
  preview: {
    select: { title: "title", country: "country", show: "show", closes: "closesAt" },
    prepare: ({ title, country, show, closes }) => ({
      title,
      subtitle: [country, closes ? `closes ${new Date(closes).toLocaleDateString("en-GB")}` : null, show ? null : "hidden"]
        .filter(Boolean)
        .join(" · "),
    }),
  },
});

export const onshoreProgramme = defineType({
  name: "onshoreProgramme",
  title: "UK onshore programme",
  type: "document",
  icon: Landmark,
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "provider", title: "University or college", type: "string" }),
    defineField({ name: "location", type: "string" }),
    defineField({ name: "summary", type: "text", rows: 3, validation: (r) => r.max(200) }),
    defineField({ name: "intakes", type: "string" }),
    defineField({ name: "show", title: "Show on website", type: "boolean", initialValue: true }),
    defineField({ name: "order", type: "number", initialValue: 10 }),
  ],
  preview: { select: { title: "title", subtitle: "provider" } },
});

export const teamMember = defineType({
  name: "teamMember",
  title: "Team member",
  type: "document",
  icon: Users,
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "role", type: "string", validation: (r) => r.required() }),
    defineField({ name: "office", type: "reference", to: [{ type: "office" }] }),
    defineField({ name: "photo", type: "photo", description: "A real, recent photo. Square works best." }),
    defineField({ name: "bio", title: "Short bio", type: "text", rows: 3, validation: (r) => r.max(240) }),
    defineField({ name: "languages", type: "array", of: [{ type: "string" }], options: { layout: "tags" } }),
    defineField({ name: "show", title: "Show on website", type: "boolean", initialValue: true }),
    defineField({ name: "order", type: "number", initialValue: 10 }),
  ],
  orderings: [{ title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "name", subtitle: "role", media: "photo" } },
});
