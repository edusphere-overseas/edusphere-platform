# Edusphere Overseas — website and portal

The new Edusphere Overseas site, built to the **Website Plan, Version 1**.

**Stack:** Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · Motion · Netlify.
Coming in later steps: Sanity (content), Supabase (portal, Mumbai region), Cloudflare R2 and Turnstile, Resend.

## Run it on your computer

You need Node.js 22 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build, the same one Netlify runs
```

## Where things live

| What | File |
| --- | --- |
| Contact details, offices, WhatsApp number, social links | `src/config/site.ts` |
| News ticker items | `src/config/site.ts` → `tickerItems` |
| Destination cards and hero flags | `src/config/site.ts` → `destinations`, `flagStrip` |
| Brand colours, animations | `src/app/globals.css` |
| Logo (vector) and loading animation | `src/components/brand/` |
| Home page sections | `src/components/home/` |
| Header, footer, ticker, WhatsApp button | `src/components/layout/` |
| Country flags (MIT licence) | `public/flags/` |

From Step 2 these settings move into the **Content** area of the admin portal (Sanity), so the team can edit them without touching code.

## Logo loading animation

Plays once per browser session (about 1.6 seconds), then glides into the header logo. Tap to skip. It is skipped for visitors who have "reduce motion" turned on, and it hides itself even if JavaScript is slow.

## Deploy (Netlify)

1. Push this folder to the Edusphere GitHub repository.
2. In Netlify: **Add new project → Import from Git → GitHub →** choose the repository. Netlify detects Next.js; leave the build settings as they are (`netlify.toml` sets Node 22).
3. Later steps add keys under **Site configuration → Environment variables** (see `.env.example`).

The site is set to `noindex` until launch; switch `robots` in `src/app/layout.tsx` at go-live (Step 8).

## Build plan progress

- [x] Step 1 — Foundations: project, brand theme, logo and loading animation, header, news ticker, hero with interactive flags, destinations, services, journey, UK onshore, contact with maps, footer, WhatsApp button
- [ ] Step 2 — Sanity content (banners, ticker, offices, contacts, galleries, "Open now", course finder switch)
- [ ] Step 3 — Student and parent portal (Supabase sign-up with email or Google, documents, tracker)
- [ ] Step 4 — Counselling appointments and email
- [ ] Steps 5–8 — per the plan
