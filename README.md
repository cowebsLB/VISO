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

Copy `.env.example` to `.env.local` and set:

```env
NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER=96171408822
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Use **digits only** for WhatsApp (country code + number, no `+`). Supabase **anon** key is safe in the browser (RLS applies); never put the **service role** key in `NEXT_PUBLIC_*`.

**`NEXT_PUBLIC_BASE_PATH`:** fine to keep `/VISO` in `.env.local` for production parity — **`next dev` ignores it** unless you set `NEXT_PUBLIC_FORCE_BASE_PATH_IN_DEV=true`. Otherwise you would have to open `http://localhost:3040/VISO/...` and mismatched asset URLs cause **`_next/static/...` 404** on `/admin/login`.

Staff admin (`/admin`) and build-time catalog paths need the Supabase URL and anon key. **Documentation hub:** **`docs/index.md`**. Auth and `admins` rows: **`docs/seed-admins.md`**. Catalog, Storage, RLS: **`docs/catalog-storage-and-staff.md`**. Login behavior: **`docs/admin-auth-and-login.md`**. Background order push (Web Push): after `supabase link`, run **`npm run supabase:setup-order-push`** (see **`docs/supabase-step-by-step.md`**).

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Dev server at **http://localhost:3040** (**Webpack**; Serwist off in dev). Recommended on **Windows** (paths with spaces, Defender). |
| `npm run dev:turbopack` | Same port with **Turbopack** (faster on some setups; can error on Windows with `_buildManifest.js.tmp` ENOENT). |
| `npm run dev:webpack` | Same as `dev` (alias). |
| `npm run build` | Production build + `public/sw.js` |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Playwright E2E (starts dev server locally unless `CI=1`; run `npx playwright install` once) |

### If you see `500` on `/admin/...`, `/favicon.ico`, or `/manifest.webmanifest` on **3040**

Usually a **broken `.next` cache** (missing `routes-manifest.json`, **`Cannot find module './331.js'`**, **`./124.js`**, or similar chunk errors in the terminal). **`npm run clean`** also removes **`node_modules/.cache`**. **Stop** the dev server (Ctrl+C), then run **`npm run clean`** (or delete **`.next`** manually), then start again with **`npm run dev`** or **`npm run dev:webpack`**. One-shot: **`npm run dev:clean`** or **`npm run dev:webpack:clean`**. Wait until the terminal says **Ready** before opening the browser. On Windows, **never** delete `.next` while the dev server is still running (locks + half-written chunks cause this).

If **`Cannot find module './331.js'`** / **`./124.js`** or chunk 404s persist after **`npm run clean`**, exclude the project or **`.next`** from real-time antivirus scanning, or move the repo to a path **without spaces** (e.g. `C:\dev\VISO`). If **`_buildManifest.js.tmp` ENOENT** appears with **`npm run dev:turbopack`**, use **`npm run dev`** (Webpack) instead.

`SegmentViewNode` / **React Client Manifest** errors during dev are treated the same: **stop → `npm run clean` → restart**. This repo disables **`experimental.devtoolSegmentExplorer`** to reduce follow-on errors after a bad cache.

### If **`layout.css` / `main-app.js` / `_next/static/chunks/...` 404** on **3040**

1. **Stop** the dev server → **`npm run clean`** → start dev again → **hard refresh** (Ctrl+Shift+R) or DevTools **Disable cache**.
2. **Service worker + Cache storage:** after visiting a **static export** preview (`serve out`) or **production**, Serwist (or the **admin** worker) can leave registrations and **Cache storage** entries that intercept **`/_next/static/*`** on **`localhost`** (stale precache → chunk **404** for **`layout.css`**, **`main-app.js`**, etc.). **`LocalhostPwaCacheBustScript`** in **`layout.tsx`** runs **in `<head>` before module scripts**: it **async** unregisters workers and clears caches, then **reloads** (up to **2×** per tab) when anything was removed so the next load is not controlled by a stale worker. **`ClientProviders`** repeats cleanup on hydrate. Production hostnames are unchanged.
3. **Still 404 after reload:** **`next build`** leaves **hashed** chunks under **`.next`** while **`next dev`** expects names like **`main-app.js`** — a mixed cache causes **real** dev-server 404s. **Stop** the dev server (**Ctrl+C**), run **`npm run clean`**, then **`npm run dev`** and wait for **Ready** before opening the browser.
4. **Base path:** if you forced `NEXT_PUBLIC_FORCE_BASE_PATH_IN_DEV=true`, open URLs under **`http://localhost:3040/VISO/...`** (match your `NEXT_PUBLIC_BASE_PATH`); otherwise **`/_next/static/...` 404** is common.
5. Messages like **`content.js`** / “Feature is disabled” usually come from a **browser extension**, not this repo.

### If you see `500` on `http://localhost:3000`

That URL is **not** this project unless you freed port 3000. Another process (often an old crashed dev server) can still be listening on **3000** and return **500** for `/` and `/favicon.ico`.

- **Use the URL Next prints** after `npm run dev` — this repo uses **port 3040** on purpose so it does not fight with whatever is on 3000.
- **Or** free port 3000, then you can change the dev script to `next dev -p 3000` if you prefer. In PowerShell:

```powershell
netstat -ano | findstr :3000
# note the PID in the last column, then:
taskkill /PID <pid> /F
```

## Testing (E2E)

- Install browsers once: `npx playwright install` (or `npx playwright install chromium`).
- `npm run test:e2e` runs against `http://127.0.0.1:3040` by default (dev server auto-started). For GitHub Pages–style URLs, set `NEXT_PUBLIC_BASE_PATH` and `PLAYWRIGHT_BASE_URL` accordingly.
- CI workflow: `.github/workflows/e2e.yml` (serves `out/` after `npm run build`).

## Assets

- **Logo:** `public/Logo.png` (main mark). Favicons: **`public/favicon.ico`** (do not duplicate as `src/app/favicon.ico` — Next.js treats that as a conflict). Also `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-*.png`.
- **Product images:** Either static files under `public/` (DB value like `/images/products/photo.webp`) or **Supabase Storage** bucket **`product-images`** (migration `20260204120007_storage_product_images.sql`). Staff can upload from **Admin → Menu**; optional **Convert to WebP** runs in the browser when the format supports it, otherwise the original file is uploaded. The storefront builds public URLs from `NEXT_PUBLIC_SUPABASE_URL` + the stored object key.

## PWA

- Manifest: `src/app/manifest.ts` (paths respect `NEXT_PUBLIC_BASE_PATH` for GitHub Pages).
- After `npm run build`, `public/sw.js` is generated (Serwist). It is listed in `.gitignore`; regenerate on each deploy.

## Deploy

- **Vercel / Node host:** connect the repo and set `NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER`.
- **GitHub Pages (this repo):** the workflow `.github/workflows/deploy-pages.yml` builds a static export with `NEXT_PUBLIC_BASE_PATH=/VISO` and `NEXT_PUBLIC_SITE_URL=https://cowebslb.github.io/VISO`, uploads the `out/` folder, and deploys via GitHub Actions. In the repo **Settings → Pages**, set **Source** to **GitHub Actions** (not “Deploy from a branch,” which only shows the README). Add **repository secrets**: `WHATSAPP_ORDER_NUMBER` (digits only), `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (for catalog static paths and client-side checkout/admin).

## Documentation

| Doc | Topics |
|-----|--------|
| `docs/seed-admins.md` | Staff Auth users, `public.admins`, troubleshooting |
| `docs/catalog-storage-and-staff.md` | Client catalog refresh, `product-images` bucket, image paths, staff query vs RLS |
| `docs/implementation-chronicle.md` | Full-session narrative (plan → Pages → branding → Supabase/admin → errors/fixes); see transcript id in doc |

## Project structure (high level)

- `src/app/(site)/` — routes: `/`, `/catalog`, `/cart`, `/checkout`, `/contact`
- `src/app/admin/` — staff admin (Supabase Auth + RLS)
- `supabase/migrations/` — database schema and RPCs
- `src/contexts/` — `LocaleProvider`, `CartProvider`
- `src/locales/` — `en.json`, `ar.json`, `hy.json`
- `src/data/products.ts` — catalog + prices
- `src/lib/` — cart helpers, WhatsApp URL builder
