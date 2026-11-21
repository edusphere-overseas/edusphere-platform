import { defineField, defineType } from "sanity";

/** One phone number, WhatsApp number or email address, with a label. */
export const contactPoint = defineType({
  name: "contactPoint",
  title: "Contact detail",
  type: "object",
  fields: [
    defineField({
      name: "kind",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Phone", value: "phone" },
          { title: "WhatsApp", value: "whatsapp" },
          { title: "Email", value: "email" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "phone",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      description: 'Shown next to the number, e.g. "Admissions", "UK desk", "General enquiries".',
      validation: (r) => r.required().max(40),
    }),
    defineField({
      name: "value",
      title: "Number or email",
      type: "string",
      description: "Phone and WhatsApp: include the country code, e.g. +91 81294 40282.",
      validation: (r) =>
        r.required().custom((value, ctx) => {
          const kind = (ctx.parent as { kind?: string })?.kind;
          if (!value) return true;
          if (kind === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || "Enter a valid email address";
          return /^\+\d[\d\s-]{6,}$/.test(value) || "Start with + and the country code, e.g. +91 81294 40282";
        }),
    }),
    defineField({ name: "primary", title: "Main contact of this type", type: "boolean", initialValue: false }),
    defineField({ name: "show", title: "Show on website", type: "boolean", initialValue: true }),
  ],
  preview: {
    select: { kind: "kind", label: "label", value: "value", show: "show" },
    prepare: ({ kind, label, value, show }) => ({
      title: `${label ?? ""}: ${value ?? ""}`,
      subtitle: `${kind === "email" ? "Email" : kind === "whatsapp" ? "WhatsApp" : "Phone"}${show === false ? " · hidden" : ""}`,
    }),
  },
});

export const socialLink = defineType({
  name: "socialLink",
  title: "Social link",
  type: "object",
  fields: [
    defineField({
      name: "platform",
      type: "string",
      options: {
        list: [
          { title: "Instagram", value: "instagram" },
          { title: "LinkedIn", value: "linkedin" },
          { title: "Facebook", value: "facebook" },
          { title: "YouTube", value: "youtube" },
          { title: "X (Twitter)", value: "x" },
          { title: "Google Business", value: "google" },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({ name: "handle", title: "Handle or name", type: "string", description: "e.g. @edusphere_overseas" }),
    defineField({ name: "url", title: "Link", type: "url", validation: (r) => r.required() }),
    defineField({ name: "show", title: "Show on website", type: "boolean", initialValue: true }),
  ],
  preview: {
    select: { title: "platform", subtitle: "handle", show: "show" },
    prepare: ({ title, subtitle, show }) => ({
      title: title ? title[0].toUpperCase() + title.slice(1) : "Social link",
      subtitle: `${subtitle ?? ""}${show === false ? " · hidden" : ""}`,
    }),
  },
});

/** Image with alt text and an optional caption. */
export const photo = defineType({
  name: "photo",
  title: "Photo",
  type: "image",
  options: { hotspot: true },
  fields: [
    defineField({
      name: "alt",
      title: "Description (for screen readers)",
      type: "string",
      validation: (r) => r.required().warning("Describe the photo in a few words"),
    }),
    defineField({ name: "caption", type: "string" }),
  ],
});

export const linkItem = defineType({
  name: "linkItem",
  title: "Link",
  type: "object",
  fields: [
    defineField({ name: "label", type: "string", validation: (r) => r.required() }),
    defineField({ name: "url", type: "url", validation: (r) => r.required() }),
  ],
});

export const faqItem = defineType({
  name: "faqItem",
  title: "Question",
  type: "object",
  fields: [
    defineField({ name: "question", type: "string", validation: (r) => r.required() }),
    defineField({ name: "answer", type: "text", rows: 3, validation: (r) => r.required() }),
  ],
  preview: { select: { title: "question", subtitle: "answer" } },
});

export const stat = defineType({
  name: "stat",
  title: "Number",
  type: "object",
  fields: [
    defineField({ name: "value", type: "string", description: 'A number such as "9" or "500+", or a word such as "Free".', validation: (r) => r.required().max(8) }),
    defineField({ name: "label", type: "string", validation: (r) => r.required().max(40) }),
  ],
  preview: { select: { title: "value", subtitle: "label" } },
});
