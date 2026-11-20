import type { StructureResolver } from "sanity/structure";
import { Home, Settings } from "lucide-react";

const ordered = (S: Parameters<StructureResolver>[0], type: string, title: string) =>
  S.listItem()
    .title(title)
    .schemaType(type)
    .child(S.documentTypeList(type).title(title).defaultOrdering([{ field: "order", direction: "asc" }]));

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
              ordered(S, "destination", "Destinations"),
              ordered(S, "service", "Student services"),
              ordered(S, "onshoreProgramme", "UK onshore programmes"),
            ]),
        ),
      S.listItem()
        .title('"Open now" visas and scholarships')
        .schemaType("openNowProgramme")
        .child(
          S.documentTypeList("openNowProgramme")
            .title('"Open now"')
            .defaultOrdering([{ field: "closesAt", direction: "asc" }]),
        ),
      S.divider(),
      ordered(S, "office", "Offices"),
      ordered(S, "teamMember", "Team"),
    ]);
