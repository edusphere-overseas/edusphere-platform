import type { StructureResolver } from "sanity/structure";
import { FileText, Home, Settings } from "lucide-react";

type S = Parameters<StructureResolver>[0];

const ordered = (S: S, type: string, title: string, field = "order", direction: "asc" | "desc" = "asc") =>
  S.listItem()
    .title(title)
    .schemaType(type)
    .child(S.documentTypeList(type).title(title).defaultOrdering([{ field, direction }]));

/** The left-hand menu of the Content area, in plain words for the team. */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Website settings")
        .id("siteSettings")
        .icon(Settings)
        .child(S.document().schemaType("siteSettings").documentId("siteSettings").title("Website settings")),
      S.divider(),
      S.listItem()
        .title("Home page")
        .icon(Home)
        .child(
          S.list()
            .title("Home page")
            .items([
              ordered(S, "banner", "Banners"),
              ordered(S, "tickerItem", "News ticker"),
              ordered(S, "destination", "Destinations and country pages"),
              ordered(S, "service", "Student services"),
              ordered(S, "onshoreProgramme", "UK onshore programmes"),
            ]),
        ),
      ordered(S, "openNowProgramme", '"Open now" visas and scholarships', "closesAt"),
      S.listItem()
        .title("Pages")
        .icon(FileText)
        .child(
          S.list()
            .title("Pages")
            .items([
              ordered(S, "testimonial", "Success stories"),
              ordered(S, "post", "News and events", "date", "desc"),
              ordered(S, "faq", "FAQs"),
              ordered(S, "university", "Universities", "name"),
              ordered(S, "scholarship", "Scholarships and loans"),
            ]),
        ),
      S.divider(),
      ordered(S, "office", "Offices"),
      ordered(S, "teamMember", "Team"),
    ]);
