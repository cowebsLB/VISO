# Anush Badar — home bakery site

Static Next.js site for **Anush Badar** (bakery & sweets): **menu**, **cart**, **checkout** (WhatsApp prefilled message), **trilingual** UI (English / Arabic / Armenian), **PWA** (Serwist), and **Tailwind** + custom CSS motion.

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
NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER=96171408822
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

- **Logo:** `public/Logo.png` (main mark). Favicons: `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-*.png`, `src/app/favicon.ico`.
- **Product images:** SVG placeholders under `public/images/products/`. Swap paths in `src/data/products.ts` and add files under `public/` as needed.

## PWA

- Manifest: `src/app/manifest.ts` (paths respect `NEXT_PUBLIC_BASE_PATH` for GitHub Pages).
- After `npm run build`, `public/sw.js` is generated (Serwist). It is listed in `.gitignore`; regenerate on each deploy.

## Deploy

- **Vercel / Node host:** connect the repo and set `NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER`.
- **GitHub Pages (this repo):** the workflow `.github/workflows/deploy-pages.yml` builds a static export with `NEXT_PUBLIC_BASE_PATH=/VISO` and `NEXT_PUBLIC_SITE_URL=https://cowebslb.github.io/VISO`, uploads the `out/` folder, and deploys via GitHub Actions. In the repo **Settings → Pages**, set **Source** to **GitHub Actions** (not “Deploy from a branch,” which only shows the README). Add a **repository secret** `WHATSAPP_ORDER_NUMBER` (digits only, e.g. `96171408822`) so the deployed build gets `NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER`.

## Project structure (high level)

- `src/app/(site)/` — routes: `/`, `/catalog`, `/cart`, `/checkout`, `/contact`
- `src/contexts/` — `LocaleProvider`, `CartProvider`
- `src/locales/` — `en.json`, `ar.json`, `hy.json`
- `src/data/products.ts` — catalog + prices
- `src/lib/` — cart helpers, WhatsApp URL builder
