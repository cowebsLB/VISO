# VISO — full session chronicle (entire chat)

This document reconstructs work from **the full Cursor conversation** that built and evolved the Anush Badar / VISO bakery site—not only the Supabase phase. It is intentionally long: **what you asked for**, **what broke**, **where it showed up**, **why**, and **what we changed**.

**Source:** Cursor agent transcript **fb482a58-708f-4958-b5a5-cbde8dec7db3** (parent chat), plus repo state. Some assistant turns in the transcript are redacted; user questions and summarized outcomes are preserved.

---

## How to use this doc

- **Timeline:** Roughly follows the order of the chat (planning → storefront → Pages → branding → catalog depth → Supabase admin → checkout/RLS → menu admin UX → storage → dev stability → polish).
- **Errors:** Many entries include **symptom → cause → fix → files or commands**.
- **Security:** Do not paste **service role** keys or live passwords here; the chat once put anon URL/key in `.env.local` (gitignored)—rotate keys if a transcript could leak.

---

## Part A — Vision, plan, and first build

### A.1 Original ask (home bakery catalog)

- **Ask:** Small catalog site for VISO: **home, catalog, contact**; palette **#ff4610** + shades, characters orange, background **#d4eaea**; micro-interactions; **HTML, Tailwind, JS/TS**, light SEO, social footer; logo in assets.
- **Reality:** Repo was nearly empty (README); plan assumed logo path under `public/` / assets.

### A.2 UI/UX depth and trilingual

- **Ask:** More UI/UX detail.
- **Outcome:** Plan expanded to **cozy handmade** direction, **English + Arabic + Armenian**, RTL for Arabic, `localStorage` locale, typography (display + Noto families), sticky header, footer, motion with **`prefers-reduced-motion`**, a11y, SEO.

### A.3 Cart → checkout → WhatsApp + images + “you write languages”

- **Ask:** **Add to cart**, **cart page**, **checkout** with prefilled line items; **WhatsApp** prefilled message; **image optimization**; implement **en/ar/hy** copy (owner did not want to author translations).

### A.4 Stack pivot: React / Node / TS / Tailwind / custom CSS animations

- **Ask:** Use **React, Node, TS, Tailwind**, custom animation CSS.
- **Outcome:** Plan and implementation moved to **Next.js App Router** (React + Node toolchain), `globals.css` keyframes, Tailwind layout.

### A.5 PWA: aggressive caching + sensible reload behavior

- **Ask:** PWA with **aggressive caching** and **cache reset on reload**.
- **Outcome:** **Serwist** integration, precache + runtime strategies, **network-first for navigations** so reload is not stuck on stale HTML; versioned cache cleanup on new SW—not “wipe every cache every reload” (that would defeat caching). Manifest + icons.

### A.6 “Implement the plan” — greenfield Next app

- **Action:** Scaffold **Next 15**, **React 19**, **TS**, **Tailwind**, **Fraunces + Noto** fonts, `src/app/(site)/` routes: `/`, `/catalog`, `/cart`, `/checkout`, `/contact`.
- **Features:** `LocaleProvider`, `CartProvider`, `localStorage` cart + locale, **`buildWhatsAppUrl`**, **`NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER`**, Serwist **`src/app/sw.ts`** → **`public/sw.js`** (disabled in dev), `ClientProviders` with `SerwistProvider`.
- **Friction:** Creating project in folder with spaces / npm naming—**manual file scaffold** instead of `create-next-app` into invalid package name.

### A.7 Header UX: cart on the far right

- **Ask:** Cart as a **button at the far right**, not inline with main nav.
- **Outcome:** **`Header.tsx`**: desktop center nav without cart; **right cluster**: language, then cart (icon + label + badge); mobile: hamburger, cart rightmost; RTL-safe `ms-auto`.

### A.8 First commit

- **Ask:** Commit and push.
- **Outcome:** e.g. `feat: Next.js bakery site with cart, i18n, PWA, and WhatsApp checkout` on `main`.

---

## Part B — GitHub Pages (README instead of site)

### B.1 Symptom

- **Where:** `https://cowebslb.github.io/VISO/` (or project Pages URL).
- **What:** User saw **GitHub’s README render**, not the app.

### B.2 Cause

- **Why:** Pages was serving **repo root** or branch without a **built static site**; no `out/` artifact.

### B.3 Fix

- **`output: 'export'`** in Next config for static export.
- **`NEXT_PUBLIC_BASE_PATH=/VISO`** for **project Pages** subpath.
- **`.github/workflows/deploy-pages.yml`**: build → upload **`out/`** → **GitHub Actions** Pages deploy.
- **`public/.nojekyll`** so `_next` and friends are not stripped by Jekyll.
- **`src/lib/basePath.ts`** + **`publicAsset()`** so logo, images, links use **`/VISO/...`** not root-relative 404s.
- **`src/app/manifest.ts`** (with `force-static`) replacing conflicting static manifest; correct `start_url` / icons with base path. *(Later superseded Apr 2026: static **`public/manifest.webmanifest`** + no root **`app/manifest.ts`** — see **Part L**.)*
- **`layout.tsx`**: `metadataBase`, OG URLs to **`https://cowebslb.github.io/VISO`**.
- **`not-found.tsx`**: home link respects base path.
- **Serwist:** removed duplicate **`swUrl`/`scope`** that doubled base path (`/VISO/VISO/sw.js`).
- **Docs:** README — set Pages **source = GitHub Actions**, not “deploy from branch.”

### B.4 WhatsApp secret and real number

- **Ask:** Use GitHub secret **`WHATSAPP_ORDER_NUMBER`**; real number **+961 71 408 822**.
- **Outcome:** Workflow maps secret → **`NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER`**; value **96171408822** (digits only for `wa.me`); `.env.example`, fallbacks, footer WhatsApp link aligned.

---

## Part C — Branding, easter egg, favicons, real product photos

### C.1 Footer chibi “COwebs.lb”

- **Ask:** **`made by.png`** at bottom: head peek; hover / tap reveals slowly; bubble **made by COwebs.lb (cowebslb.com)**.
- **Outcome:** **`public/made-by-chibi.png`**, **`FooterChibiPeek.tsx`**, wired in **`Footer.tsx`**; reduced-motion respected; note about transparent PNG if exported.

### C.2 Favicon pack integration

- **Ask:** android-chrome, apple-touch, favicon PNGs, `favicon.ico`, `site.webmanifest` from `assets/logo/`.
- **Outcome:** Files under **`public/`**, **`src/app/favicon.ico`**, **`layout.tsx` metadata.icons**, **`manifest.ts`** icons; reference **`assets/logo/site.webmanifest`** kept in sync for humans; live manifest from **`manifest.ts`**. *(Later: storefront manifest moved to **`public/manifest.webmanifest`** — **Part L**.)*

### C.3 Rebrand: Anush Badar + new `Logo.png`

- **Ask:** New name and logo assets.
- **Outcome:** **`src/lib/brand.ts`** (`BRAND_NAME`, etc.); **Anush Badar — Bakery & Sweets** across metadata and locales; **`public/Logo.png`**; removed old **`viso-logo.jpg`**; contact placeholder email; GitHub path still **`/VISO`** (repo name).

### C.4 Real menu WebPs instead of SVG placeholders

- **Ask:** Use provided **`assets/Menu items/*.webp`** as products.
- **Outcome:** Copied/renamed under **`public/images/products/`**; **`src/data/products.ts`** updated ids, paths, categories, multi-option “fillings” where applicable.

### C.5 Prices from a photo; dev server

- **Ask:** Take **prices only** from a pricing image; run site for live updates.
- **Outcome:** Price updates in data; dev server run (ports varied early on).

### C.6 React hydration warning

- **Ask:** Next hydration mismatch warning (server/client HTML differ).
- **Typical causes:** `Date.now()`, `Math.random()`, `typeof window`, extensions mutating DOM, locale formatting.
- **Outcome:** Tracked down client-only branches / unstable markup (specific fix depended on component—pattern: gate client-only UI, match server markup, suspect extensions).

### C.7 Dynamic product detail pages + fillings

- **Ask:** Multiple fillings; **dynamic product page** from earlier menu.
- **Outcome:** **`/catalog/[productId]`** with **`generateStaticParams`** from catalog data; product options surfaced on detail; cart line ids composite **`productId:optionId`** where needed.

### C.8 Internal Server Error (again during catalog work)

- **Outcome:** Iterated dev server / `.next` clean as in later Part H.

### C.9 Cart / checkout images missing

- **Ask:** No images on checkout/cart line items.
- **Outcome:** Cart schema extended with **`image`** snapshot per line; **`CART_VERSION`** bump; UI passes image from catalog into cart; **`next/image`** or `<img>` as appropriate for static export constraints.

### C.10 WhatsApp without opening app?

- **Ask:** Auto-send WhatsApp without taking user to WhatsApp.
- **Outcome:** Explained **browser cannot silently send WhatsApp** without official Business API backend; user dropped the idea (“forget it”).

### C.11 Instagram link

- **Ask:** Hook **https://www.instagram.com/anush.badar?...** to Instagram icon.
- **Outcome:** Footer (and any other social slot) updated to real URL; commit/push.

---

## Part D — Supabase, admin, orders, and the long checkout / RLS thread

### D.1 “Serious work” — Supabase-backed catalog, checkout RPC, admin

**Delivered (high level):**

- **Migrations** `20260204120000`–`03` (+ later `04`–`07`): schema, RLS, **`is_admin()`**, RPCs, seed catalog.
- **Env / CI:** `.env.example`, **`deploy-pages.yml`** and **`e2e.yml`** pass **`NEXT_PUBLIC_SUPABASE_*`** via secrets.
- **Clients:** `src/lib/supabase/client.ts` (browser), `server.ts` (build).
- **Catalog loader:** `load-catalog.ts` — Supabase when env set, else fallback **`src/data/products.ts`**.
- **Catalog / product routes:** server + **`CatalogPageClient`**, **`ProductDetailsClient`** for client refetch when env present.
- **Checkout payload:** `build-payload.ts` → RPC **`create_order_from_checkout`**; **WhatsApp** still opens with message including **order ref** after successful RPC.
- **Admin (static-export-safe):** no dynamic `[orderId]` segment; **orders list + detail** via query/searchParams or static patterns as implemented.
- **Pages:** login, dashboard, orders, **products/menu**, recipes (BOM note), inventory (**adjust_inventory**).
- **Docs:** `docs/seed-admins.md` — four staff users + **`public.admins`** inserts.
- **E2E:** Playwright smoke + crawl; CI with basePath.

**Note:** Early agent message: local **`npm run build`** could fail only due to **Google Fonts fetch** (`ENOTFOUND`) in sandbox—**`tsc`** still passed.

### D.2 Admin URLs (reference)

| Environment | URL |
|-------------|-----|
| Local | `http://localhost:3040/admin` |
| Login | `http://localhost:3040/admin/login` |
| GitHub Pages | `https://cowebslb.github.io/VISO/admin` |

### D.3 Migrations applied from CLI

- **Ask:** “Do them yourself” + put anon key in `.env.local`.
- **Outcome:** **`supabase db push`** applied core migrations; **`.env.local`** created with project URL + anon key + WhatsApp (gitignored). **Auth users + `admins` rows** still manual per seed doc.

### D.4 “How do I put keys in the repo?”

- **Answer:** **Do not** commit secrets. Use **GitHub Actions secrets** for **`NEXT_PUBLIC_SUPABASE_URL`**, **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**, **`WHATSAPP_ORDER_NUMBER`**. Anon key is “public” in the built JS but should not live in tracked plaintext history.

### D.5 Staff users: “internal usernames”

- **Constraint:** Supabase email/password provider still stores **`something@viso-admin.local`** in `auth.users.email`.
- **UX:** Login form **username + password** only; code normalizes to synthetic email; **`docs/seed-admins.md`** updated.

### D.6 Password for `christian`?

- **Answer:** No default password in repo—set in **Supabase Dashboard** or reset there.

### D.7 Multiple GoTrueClient warnings + login 400 + extension noise

- **Symptoms:** Console spam **Multiple GoTrueClient instances**; **`400`** on **`/auth/v1/token`**; **`content.js`**, **message channel** errors.
- **Causes:** New `createClient` per call; **bad password / unconfirmed user** for 400; extensions for other lines.
- **Fixes:** **Singleton** browser Supabase client in **`client.ts`**; clearer login error UI; **`data-scroll-behavior="smooth"`** on `<html>` for Next warning.

### D.8 Checkout: remove “Submit order online”, merge with WhatsApp, order not saving

- **Ask:** Single WhatsApp button that **also** writes to dashboard.
- **First RLS theory:** **`SECURITY DEFINER`** RPC still blocked by RLS — tried **`set_config('row_security','off')`** inside function (migration **004**).

- **Still failing:** **`SECURITY INVOKER`** experiment + **anon INSERT policies** (migration **005**) — user thought migration wasn’t applied; **`supabase db push`** applied **005**.

- **403 Forbidden on RPC:** **`INVOKER`** meant anon couldn’t satisfy FK / **`RETURNING`** visibility.
- **Fix:** Migration **006** — restore **`SECURITY DEFINER`** for **`create_order_from_checkout`**, revoke risky anon direct inserts, `SET search_path = public`.

### D.9 Orders page empty but DB has rows

- **Cause:** **`SELECT` on `orders`** allowed only when **`is_admin()`** — missing row in **`public.admins`** → **zero rows, no error**.
- **Fix:** **`getStaffSupabase()`** in **`staff-access.ts`**; explicit **“not linked as staff”** message; orders reload on auth change; user inserts **`admins`** row with their Auth UUID.

### D.10 “Not admin anymore” but row exists in Supabase (`maybeSingle` bug)

- **Symptom:** Staff check failed despite **`admins`** row.
- **Cause:** RLS lets admins **see all** `admins` rows; unfiltered **`select().maybeSingle()`** with **multiple rows** → PostgREST error → UI treated as not staff.
- **Fix:** **`.eq("user_id", session.user.id)`** before **`maybeSingle()`**.

### D.11 Admin / favicon 500, missing `routes-manifest`, `./331.js`

- **Cause:** Corrupt **`.next`** (deleted while dev running, Windows locks, mixed bundlers).
- **Mitigations over time:** **`public/favicon.ico`**; **`webpack cache: false`** in dev; toggled default **`dev`** between **Turbopack** and **Webpack** (see H).

### D.12 Products admin: “not all options / products”

- **Cause:** Seed had **four** products; admin UI initially didn’t surface **variants** well.
- **Iteration 1:** Options table + add option form + staff gate.
- **Iteration 2:** “Menu items” **card** UI — owner found confusing.
- **Iteration 3 (requested):** **Search bar**, **table**, **Add** opens **modal**; **edit** in modal — **`MenuItemsAdmin.tsx`** + **`MenuItemModal.tsx`**; live site updates via client refetch + DB (static URLs for brand-new slugs still need redeploy).

### D.13 New categories + storefront from DB

- **Ask:** Add **new categories** in admin, not only existing; catalog from DB.
- **Outcome:** Admin can insert **`product_categories`**; shared catalog fetch; dynamic filters; **`productImageUrl`** for storage keys vs static paths.

### D.14 Storage bucket + optional WebP in browser

- **Ask:** Bucket for images; optional auto-convert to WebP.
- **Outcome:** Migration **007** bucket **`product-images`**; upload uses **`prepareImageForUpload`** + **`storageImageContentType`**; **`PRODUCT_IMAGES_BUCKET`** env override.

### D.15 CI build failure (ESLint)

- **Symptom:** GitHub Actions build failed (e.g. **`prefer-const`**, hooks, `img` rules).
- **Fix:** Lint-clean admin and lib files.

### D.16 Modal `useEffect` dependency size changed

- **Symptom:** React warning about **dependency array length** changing.
- **Fix:** Stable effect deps; **`onErrorRef`** pattern so **`onError`** is not a dep that changes array length.

### D.17 `layout.css` / chunks 404 on login

- **Cause:** Stale **`.next`**, wrong port, or **service worker** serving old graph; sometimes **basePath** mismatch.
- **Fix:** Clean `.next`, hard refresh, unregister SW; align **`effective-base-path`** with **`next.config`**.

### D.18 Turbopack `_buildManifest.js.tmp` ENOENT (Windows)

- **Symptom:** Dev with **Turbopack** on Windows fails writing manifest temp file (path with spaces exacerbates).
- **Fix:** Default **`npm run dev`** back to **Webpack**; **`dev:turbopack`** optional; **`dev:webpack:clean`** / **`dev:turbopack:clean`**.

### D.19 Duplicate `app/favicon.ico` vs `public/favicon.ico`

- **Symptom:** Favicon route 500 / conflict.
- **Fix:** Single canonical favicon location (removed duplicate under **`src/app`** per resolution).

### D.20 `NEXT_PUBLIC_BASE_PATH` vs dev `/_next` 404

- **Symptom:** Local dev 404 for static assets when `.env` has **`/VISO`**.
- **Fix:** **`effective-base-path.ts`**: in **development**, ignore base path unless **`NEXT_PUBLIC_FORCE_BASE_PATH_IN_DEV=true`**.

---

## Part E — Storage polish, SW, URL shape, policies CLI, UI cleanup

### E.1 Bucket named “product images” vs id `product-images`

- **Note:** Dashboard **display name** vs **bucket id**; code default **`product-images`**; override with **`NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET`**.

### E.2 No storage policies

- **Symptom:** Upload fails (RLS).
- **Fix:** Run **`20260204120007_storage_product_images.sql`**; **`storageUploadUserHint`** for clearer errors; **`npm run db:storage-policies`** = `supabase db query -f ... --linked` when CLI linked.

### E.3 `./124.js`, SegmentViewNode, admin 500 cascade

- **Fix:** **`scripts/clean-next.mjs`** (`.next` + `node_modules/.cache`); **`experimental.devtoolSegmentExplorer: false`**; README troubleshooting.

### E.4 `bad-precaching-response` + Storage URL **400** (missing `public`)

- **SW:** Stale **`sw.js`** precaching old **`_next/static/<buildId>/...`** → **`ClientProviders`** unregisters SW on **localhost** in dev.
- **Storage URL:** Full URLs without **`/object/public/`** → **`normalizeSupabasePublicObjectUrl`** in **`product-image-url.ts`**.

### E.5 Menu modal / page copy cleanup

- Removed **GitHub Pages / republish** wall of text from modal header and menu intro; shortened **Photo** section; **Upload image**, **Prefer WebP**, **Path** label; trimmed **New category** helper.

### E.6 This document (first version)

- User asked for **`docs/`** MD with “everything”; first cut was Supabase-heavy; this revision is **full-chat**.

---

## Part F — Operational commands (current)

| Script | Role |
|--------|------|
| `npm run dev` | Next dev, port **3040**, Webpack |
| `npm run dev:turbopack` | Optional Turbopack |
| `npm run clean` | `scripts/clean-next.mjs` |
| `npm run dev:clean` | clean + dev |
| `npm run db:storage-policies` | Apply storage migration via linked Supabase |

---

## Part G — Quick error lookup table

| Symptom | Likely cause | First-line fix |
|--------|----------------|----------------|
| GitHub Pages shows README | No `out/` deploy / wrong Pages source | Actions deploy from `out/`, **GitHub Actions** source |
| Asset 404 under `/VISO` | Missing `publicAsset()` / basePath | Fix `basePath.ts` + config |
| `localhost:3000` 500 | Wrong process on 3000 | Use **3040** or kill PID on 3000 |
| Turbopack `ssr/[turbopack]_runtime.js` missing | Mixed Serwist Webpack + Turbopack + stale `.next` | Delete `.next`, use Webpack dev |
| `Cannot find module './NNN.js'` | Corrupt `.next` | Stop dev → `npm run clean` → dev |
| `SegmentViewNode` / client manifest | Next devtools + bad cache | Clean + `devtoolSegmentExplorer: false` |
| Login 400 | Wrong password / unconfirmed user / email mismatch (Gmail user but typed short name only) | Use **full email** as in Auth, or synthetic **`user@viso-admin.local`**; confirm email in Dashboard |
| Stay on login after success | Auth listener did not navigate on SIGNED_IN | Fixed in **`AdminAuthGate`** + **`router.replace`** after sign-in |
| Logout 403 (`scope=global`) | Anon client + global revoke | Use **`signOut({ scope: "local" })`** |
| Multiple GoTrueClient | Many `createClient` calls | Singleton in `client.ts` |
| RPC 403 / order not inserted | RLS + INVOKER / missing migration | Migrations **004–006** applied in order |
| Orders list empty | No `admins` row for your UUID | `INSERT INTO admins ...` |
| “Not staff” with rows present | `maybeSingle` + multiple `admins` rows | Filter by `user_id` |
| Storage upload fails | No RLS policies on `storage.objects` | Run migration **007** |
| Image URL 400 | Missing `/public/` in path | Normalize URL or store key only |
| `bad-precaching-response` | Stale SW on localhost | Auto-unregister in dev + manual unregister |
| `_buildManifest.js.tmp` ENOENT | Turbopack on Windows | Use Webpack dev |

---

## Part H — Key file map

| Area | Paths |
|------|--------|
| Brand | `src/lib/brand.ts` |
| Base path | `src/lib/basePath.ts`, `src/lib/effective-base-path.ts` |
| Catalog / Supabase | `src/lib/catalog/supabase-catalog.ts`, `load-catalog.ts` |
| Images | `src/lib/images/product-image-url.ts`, `src/lib/admin/prepare-image-upload.ts` |
| Storage errors | `src/lib/admin/storage-upload-hint.ts` |
| Bucket id | `src/lib/supabase/product-images-bucket.ts` |
| Staff | `src/lib/admin/staff-access.ts` |
| Menu admin UI | `MenuItemsAdmin.tsx`, `MenuItemModal.tsx` |
| Footer / chibi | `Footer.tsx`, `FooterChibiPeek.tsx` |
| SW | `src/app/sw.ts`, `ClientProviders.tsx` |
| Next config | `next.config.ts` |
| Migrations | `supabase/migrations/*.sql` |
| Pages deploy | `.github/workflows/deploy-pages.yml` |
| Staff login / auth gate | `src/app/admin/login/page.tsx`, `src/components/admin/AdminAuthGate.tsx`, `src/components/admin/AdminUserMenu.tsx`, `src/lib/admin/staff-email.ts` |
| Inventory admin | `src/app/admin/(shell)/inventory/page.tsx` |
| Recipes / BOM admin | `src/app/admin/(shell)/recipes/page.tsx` |
| Next cache clean | `scripts/clean-next.mjs`, `npm run clean` |

---

## Part I — Admin UX and docs split (2 April 2026)

### I.1 Inventory admin (full CRUs + stock)

- **Symptom:** Inventory page was essentially an “adjustment” strip and a table with no add/edit/remove; staff could not manage ingredients or understand how stock should change.
- **Outcome:** **Add ingredient** (modal with starting quantity, cost, unit, optional category and low threshold), **Edit** (metadata only; on-hand edited via **Update stock**), **Update stock** (modal calling **`adjust_inventory`** with human-readable reasons), **Remove** (delete with FK hint if still referenced from **`recipe_lines`**). All loads and mutations use **`getStaffSupabase()`**; mutations use **`withStaff`** returning **`"ok" | "staff" | "fail"`** and **`SupabaseClient`** typing (no broken **`runWithStaff`** reference after refactor).

### I.2 Login redirect and Gmail-friendly sign-in

- **Symptom:** After correct password, user stayed on **`/admin/login`** until a full reload; **400** on **`/auth/v1/token`** when Auth users were created with **Gmail** (or any real email) but the UI only sent **`shortname@viso-admin.local`**.
- **Cause:** **`AdminAuthGate`** `onAuthStateChange` only redirected **unauthenticated** users to login, not **authenticated** users away from login; email mapping assumed synthetic domain only.
- **Fix:** **`router.replace("/admin")`** after successful **`signInWithPassword`**; gate listener also **`replace("/admin")`** when **`session && isLogin`**. **`resolveStaffAuthEmail`:** if input contains **`@`**, use trimmed lowercase full email; else **`username@viso-admin.local`**. Clearer UI copy (“Email or username”, placeholder **`you@gmail.com`**) and errors (wrong email/password, email not confirmed).

### I.3 Sign-out 403

- **Symptom:** **`POST .../auth/v1/logout?scope=global`** returned **403** in the console.
- **Fix:** **`signOut({ scope: "local" })`** in **`AdminUserMenu`** so the client session clears without relying on that endpoint with the anon key.

### I.4 Recipes (BOM) readability and CRUD

- **Symptom:** Flat table of **`product_id`** / option id slugs; repeated rows; no way to add lines in-app.
- **Outcome:** Grouped **cards** by product (English name from **`product_i18n`**) and **variant** (from **`product_option_i18n`** + **`product_options.sort_order`**); ingredient names and units; **Add ingredient** / **Edit** / **Remove** modals writing **`recipe_lines`**; friendly message on **`recipe_lines_unique_bom`** duplicate; default new row to **first variant** when options exist; **“Fallback”** option maps to **`product_option_id` null**, matching **`private.apply_order_to_inventory`** (variant-specific BOM when present, else shared null-option lines). Loads all **`products`** for the product dropdown even if no lines exist yet.

### I.5 Dev stability (Windows)

- **`next.config.ts`:** **`experimental.devtoolSegmentExplorer: false`** to reduce segment-explorer / client-manifest noise after bad **`.next`** cache.
- **`scripts/clean-next.mjs`:** removes **`.next`** and **`node_modules/.cache`**; wired as **`npm run clean`** (already in **package.json** from prior commit).

### I.6 Documentation restructure

- **`docs/index.md`:** Hub linking all topic docs.
- **New:** **`admin-auth-and-login.md`**, **`admin-inventory.md`**, **`admin-recipes-bom.md`**, **`dev-environment-windows.md`**, **`Worklog-02-04-2026.md`**.
- **Updated:** **`seed-admins.md`** (Gmail / full-email login); **`catalog-storage-and-staff.md`** (pointer to index); this chronicle (**Part I**, file map, error table).

## Part J — Branding, PWA, admin UX (3 Apr 2026)

### J.1 Branding, PWA, and dev stability

- **Branding:** User-facing **VISO** → **Anush Badar** where appropriate; **`anushbadar-bakery`** package name; legacy **`viso-*`** localStorage keys migrated to **`anushbadar-*`**; **`viso-admin.local`** documented as legacy synthetic email domain for Supabase.
- **PWA:** **`manifest`** `id` / `scope` / categories; root **`metadata.manifest`**; **`PwaInstallBanner`** for install hints; **`globals.css`** **`site-*`** keyframes; **`SITE_SHOW_NOTIFICATION`** SW message type; **`postShowNotificationViaSw`** admin-path-only guard.
- **Dev `/_next/static` 404:** **Cache Storage** cleared on **`localhost`** dev load together with service worker unregister; README troubleshooting updated.
- **Admin orders:** Card list below **`xl`**, table **`xl`+**, mirroring **Menu** admin layout.

---

## Part K — Admin background push and Supabase ops (early Apr 2026)

### K.1 Requirement

- **Ask:** Order notifications for admin **in the background** when the PWA is installed; earlier implementation only **polled** while the tab was open.
- **Outcome:** **Web Push** via **Supabase Edge Function** `send-order-push` on **`orders` INSERT**; **`admin_push_subscriptions`** table + RLS; **`public/admin/sw.js`** `push` handler; client **`syncAdminPushSubscription`** / **`removeAdminPushSubscription`**. *(Follow-up Apr 2026: in-tab polling kept alongside push; see Part L / **Worklog-04-04-2026**.)*

### K.2 Next.js dev vs static export

- **Symptom:** **`/_next/static/...` 404** and hydration issues when **`output: "export"`** was active during **`next dev`** (dev HTML vs hashed prod chunks).
- **Fix:** **`next.config.ts`:** apply **`output: "export"`** only when **`argv` / npm lifecycle** is **`build`** or **`start`** — not during **`next dev`**. **`LocalhostPwaCacheBustScript`** in **`<head>`** plus **`ClientProviders`** cleanup for stale SW/cache on localhost.

### K.3 Empty `NEXT_PUBLIC_SITE_URL` → 500

- **Symptom:** **`GET /` and `/admin` 500**; React minified **#418** (hydration) because server error HTML did not match client bundle.
- **Cause:** **`.env.local`** had **`NEXT_PUBLIC_SITE_URL=`** (empty); **`??` fallback** did not run; **`metadataBase: new URL("/")`** threw in **`RootLayout`**.
- **Fix:** **`src/lib/basePath.ts`:** **`resolveSiteUrl()`** — trim, treat empty as unset, **`try/catch`** on **`new URL`** with safe default.

### K.4 Supabase automation and dashboard UX

- **`scripts/supabase-setup-order-push.mjs`** + **`npm run supabase:setup-order-push`:** generates VAPID + webhook secret, **`supabase secrets set --env-file`**, **`db push`**, **`functions deploy send-order-push`**. **`web-push`** devDependency; **`supabase/.push-setup-secrets.env`** gitignored.
- **Docs:** **`docs/admin-push-notifications.md`**, **`docs/supabase-step-by-step.md`**; **Database Webhooks** primary path is **Integrations → Webhooks** (not **Database** sidebar); direct URL pattern **`/integrations/webhooks/overview`**.
- **Webhook pitfalls:** URL must end **`…/send-order-push`** (full name); **`Authorization: Bearer <ORDER_PUSH_WEBHOOK_SECRET>`** header required; secret readable from generated **`.push-setup-secrets.env`** locally (not shown again in Dashboard).

## Part L — Split PWA manifests and dev `.next` hygiene (5 Apr 2026)

### L.1 Staff vs storefront manifest on static export

- **Symptom:** “Two PWAs” intent in code, but prerendered **`out/admin*.html`** still pointed the manifest link at the storefront **`…/manifest.webmanifest`** instead of **`…/admin/manifest.webmanifest`**.
- **Cause:** Root **`src/app/manifest.ts`** participated in Next metadata merge such that the root manifest won during **`output: "export"`** for admin routes; nested **`app/admin/manifest.ts`** did not appear in **`out/`** as a separate route in this setup.
- **Fix:** Delete **`src/app/manifest.ts`**; add **`public/manifest.webmanifest`** and **`public/admin/manifest.webmanifest`** with paths relative to each manifest URL (**`./`**, **`../`** for icons). **`admin/layout.tsx`** **`metadata.manifest`** → **`publicAsset("/admin/manifest.webmanifest")`**. **Follow-up:** set manifest **`id`** to **`pwa-storefront`** / **`pwa-staff`** (not **`./`** on both) so Chromium/Edge do not treat the two installs as one “branding update.”

### L.2 `metadataBase` hardening

- **`metadataBaseUrl()`** in **`src/lib/basePath.ts`** wraps **`new URL`** for root **`layout.tsx`** **`metadataBase`**.

### L.3 Preview static `out/` and `next start`

- **`npm run preview`:** **`serve out`** on port **3040** after **`npm run build`**. **`npm run start`** (**`next start`**) is unreliable with **`output: "export"`** (e.g. **`routesManifest.dataRoutes is not iterable`**).

### L.4 Dev chunk 404 / `routes-manifest.json` ENOENT

- **Symptom:** **`GET /_next/static/chunks/app/admin/layout.js` 404**, **`ChunkLoadError`** after Fast Refresh; server log **`ENOENT`** opening **`.next/routes-manifest.json`**.
- **Cause:** **`.next`** deleted or overwritten while **`next dev`** still running — e.g. **`npm run clean`** or **`npm run build`** in parallel with dev.
- **Fix:** Stop dev → **`npm run clean`** → **`npm run dev`**. **Webpack `cache: false` in dev** was default and could worsen HMR drift; now opt-in only via **`NEXT_DISABLE_WEBPACK_CACHE=true`**.

### L.5 Order notifications (continued)

- **Staff UI:** Polling runs alongside Web Push when notifications are on; shared notification **`tag`** **`order-<id>`** with Edge Function payload (see **Worklog-04-04-2026**).

---

## Revision

- **v1:** Supabase-focused chronicle.
- **v2:** Full multi-phase chat narrative + merged technical detail.
- **v3:** Part I (2 Apr 2026 admin + docs); split reference docs under **`docs/`** with **`docs/index.md`**.
- **v4:** Part J (3 Apr 2026 branding, PWA, dev cache, orders cards).
- **v5:** Part K (admin Web Push + Supabase automation + dashboard path).
- **v6:** Part L (5 Apr 2026 split PWA manifests, preview script, dev webpack / `.next` hygiene).

*Compiled from session transcript and repo state — April 2026.*
