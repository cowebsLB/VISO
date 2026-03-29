# VISO — home bakery site

Static Next.js site for a small bakery: **menu**, **cart**, **checkout** (WhatsApp prefilled message), **trilingual** UI (English / Arabic / Armenian), **PWA** (Serwist), and **Tailwind** + custom CSS motion.

## Tech stack

- **Next.js 15** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS** + `src/app/globals.css` keyframes
- **Serwist** service worker (`src/app/sw.ts` → `public/sw.js` on build)
- **next/image** for logo and product art

## Setup

```bash
npm install
```

Copy `.env.example` to `.env.local` and set your WhatsApp number:

```env
NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER=96171234567
```

Use **digits only** (country code + number, no `+`). This is used for `wa.me` links from checkout.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Dev server (Turbopack, no service worker) |
| `npm run build` | Production build + `public/sw.js` |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |

## Assets

- **Logo:** `public/viso-logo.jpg` (copied from your original asset; replace with a square PNG/JPEG if you want cleaner PWA icons).
- **Product images:** SVG placeholders under `public/images/products/`. Swap paths in `src/data/products.ts` and add files under `public/` as needed.

## PWA

- Manifest: `public/manifest.webmanifest`
- After `npm run build`, `public/sw.js` is generated (Serwist). It is listed in `.gitignore`; regenerate on each deploy.

## Deploy

- **Vercel / Node host:** connect the repo and set `NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER`.
- **Static export:** not configured by default; Serwist + `next/image` require a Node-compatible host for full behavior.

## Project structure (high level)

- `src/app/(site)/` — routes: `/`, `/catalog`, `/cart`, `/checkout`, `/contact`
- `src/contexts/` — `LocaleProvider`, `CartProvider`
- `src/locales/` — `en.json`, `ar.json`, `hy.json`
- `src/data/products.ts` — catalog + prices
- `src/lib/` — cart helpers, WhatsApp URL builder
