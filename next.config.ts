import type { NextConfig } from "next";

const https = (host?: string) => (host ? `https://${host}` : "");

// Address used in portal emails and sign-in links, fixed at build time from the host's
// own variables, so production links to the main address and a preview to itself.
// SITE_URL (set at launch to the real domain) always wins.
const siteOrigin =
  process.env.SITE_URL ||
  // Vercel
  (process.env.VERCEL_ENV === "production"
    ? https(process.env.VERCEL_PROJECT_PRODUCTION_URL)
    : https(process.env.VERCEL_BRANCH_URL) || https(process.env.VERCEL_URL)) ||
  // Netlify
  (process.env.CONTEXT === "production" ? process.env.URL : process.env.DEPLOY_PRIME_URL) ||
  process.env.URL ||
  "";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  env: { SITE_ORIGIN: siteOrigin },
  cacheComponents: true,
  partialPrefetching: true,
  // Sent on every page, whichever host serves the site
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
