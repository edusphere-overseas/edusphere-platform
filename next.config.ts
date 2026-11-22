import type { NextConfig } from "next";

// Address used in portal emails and sign-in links, fixed at build time from Netlify's
// own variables: production uses the site's main address, a deploy preview its own.
const siteOrigin =
  process.env.SITE_URL ||
  (process.env.CONTEXT === "production" ? process.env.URL : process.env.DEPLOY_PRIME_URL) ||
  process.env.URL ||
  "";

const nextConfig: NextConfig = {
  env: { SITE_ORIGIN: siteOrigin },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
