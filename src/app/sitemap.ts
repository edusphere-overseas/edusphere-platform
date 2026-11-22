import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { getLibrary, getSiteContent } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [c, lib] = await Promise.all([getSiteContent(), getLibrary()]);
  const pages = [
    "",
    "/destinations",
    "/services",
    "/universities",
    "/scholarships",
    "/success-stories",
    "/news",
    "/faqs",
    "/about",
    "/contact",
    "/privacy",
    ...(c.sections.courseFinder ? ["/course-finder"] : []),
  ];
  return [
    ...pages.map((p) => ({ url: `${site.url}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...lib.destinations.map((d) => ({ url: `${site.url}/destinations/${d.id}`, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...lib.posts.map((p) => ({ url: `${site.url}/news/${p.slug}`, lastModified: p.date, changeFrequency: "yearly" as const, priority: 0.5 })),
  ];
}
