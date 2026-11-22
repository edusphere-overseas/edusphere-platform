import type { MetadataRoute } from "next";
import { site } from "@/config/site";

/**
 * Search engines are kept out until launch (Step 7). At launch, set
 * SITE_LAUNCHED=true in Netlify and remove `robots` noindex in app/layout.tsx.
 */
export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_LAUNCHED !== "true") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/portal", "/api", "/__forms.html", "/sign-in", "/sign-up", "/forgot-password", "/reset-password", "/welcome", "/auth"] },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
