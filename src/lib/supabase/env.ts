/**
 * Portal settings from the environment (Vercel → Project Settings → Environment Variables).
 * Keys are never stored in the code repository.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** False until the Supabase project is connected: the portal then shows a friendly "coming soon" page. */
export const portalConfigured = Boolean(supabaseUrl && supabaseKey);

/**
 * The address used in emails and sign-in links. Set at build time from the host's own
 * variables (see next.config.ts), so a deploy preview links to itself and production
 * to the real domain. Never taken from the request, so links can't be pointed elsewhere.
 */
export function siteOrigin() {
  return (process.env.SITE_ORIGIN || process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
