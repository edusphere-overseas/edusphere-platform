# Edusphere Overseas — website and portal

The new Edusphere Overseas site, built to the **Website Plan, Version 1**.

**Stack:** Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · Motion · Sanity (content) · Supabase (portal) · Cloudflare R2 (documents) · Vercel.
Coming in later steps: Supabase (portal, Mumbai region), Cloudflare R2 and Turnstile, Resend.

**Live preview:** on Vercel (project `edusphere-platform`); search engines are kept out until launch.
**Admin portal:** `/admin` → **Content** at `/admin/content` (Sanity Studio; sign in with your invited Sanity account)

## Run it on your computer

You need Node.js 22 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build, the same one Vercel runs
```

## Where things live

| What | Where |
| --- | --- |
| Banners, ticker, offices, contact details, social links, destinations, services, "Open now", UK onshore programmes, team, office photos, section switches, hero text | **Admin → Content** (Sanity) |
| Built-in fallback content (used until Content is set up) | `src/config/site.ts` |
| Content types (what fields the team can edit) | `src/sanity/schemaTypes/` |
| Content menu layout | `src/sanity/structure.ts` |
| How the site reads content | `src/sanity/queries.ts`, `src/lib/content.ts` |
| Brand colours, animations | `src/app/globals.css` |
| Logo (vector) and loading animation | `src/components/brand/` |
| Home page sections | `src/components/home/` |
| Header, footer, ticker, WhatsApp button | `src/components/layout/` |
| Country flags (MIT licence) | `public/flags/` |

Published changes appear on the website within about a minute. For instant updates, add a Sanity webhook to `/api/revalidate` with a secret, and the same secret as `SANITY_REVALIDATE_SECRET` in Vercel.

To give a team member access to Content, invite them to the **Edusphere Platform** project at sanity.io/manage → Members.

## Logo loading animation

Plays once per browser session (about 1.6 seconds), then glides into the header logo. Tap to skip. It is skipped for visitors who have "reduce motion" turned on, and it hides itself even if JavaScript is slow.

## Deploy (Vercel)

1. Vercel is connected to this GitHub repository (project `edusphere-platform`). Every push to `main` deploys production; other branches get preview deployments.
2. Keys go in Vercel under **Project Settings → Environment Variables** (see `.env.example`), then redeploy.
3. Commits that only add files under `updates/` (update-bundle parts) are not built (`vercel.json` → `ignoreCommand`).

`netlify.toml` is kept only for the earlier Netlify project and can be removed once Netlify is switched off.

The site is set to `noindex` until launch; switch `robots` in `src/app/layout.tsx` at go-live (Step 8).

## Build plan progress

- [x] Step 1 — Foundations: project, brand theme, logo and loading animation, header, news ticker, hero with interactive flags, destinations, services, journey, UK onshore, contact with maps, footer, WhatsApp button
- [x] Step 2 (part 1) — Sanity Content area embedded in the admin portal; banners, ticker, offices, contacts, social links, destinations, services, "Open now", UK onshore programmes, team, office photos, section switches (incl. course finder), About page
- [ ] Step 2 (part 2) — Google reviews, destination and service pages
- [ ] Step 3 — Student and parent portal (Supabase sign-up with email or Google, documents, tracker)
- [ ] Step 4 — Counselling appointments and email
- [ ] Steps 5–8 — per the plan
