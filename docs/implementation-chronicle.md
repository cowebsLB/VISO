# VISO — implementation chronicle

This document is a **detailed, narrative record** of major work on the VISO bakery site: features added, infrastructure choices, **errors encountered** (when, where, why), and **how they were fixed**. It includes catalog/Supabase integration, admin menu management, Storage for product images, local development tooling, service worker behavior, and **UI/UX copy cleanup**.

It is meant for future you (or another developer) who needs context beyond commit messages. It is **not** a minimal README; it is intentionally verbose.

---

## Table of contents

1. [Product goals (what we were building)](#1-product-goals-what-we-were-building)
2. [Database and Supabase](#2-database-and-supabase)
3. [Public catalog and storefront](#3-public-catalog-and-storefront)
4. [Admin: menu / products](#4-admin-menu--products)
5. [Supabase Storage: product images](#5-supabase-storage-product-images)
6. [Staff access and `is_admin`](#6-staff-access-and-is_admin)
7. [Checkout and orders (context)](#7-checkout-and-orders-context)
8. [Errors, symptoms, and fixes](#8-errors-symptoms-and-fixes)
9. [Development tooling and scripts](#9-development-tooling-and-scripts)
10. [UI and UX changes](#10-ui-and-ux-changes)
11. [Documentation and env vars](#11-documentation-and-env-vars)
12. [File index (where things live)](#12-file-index-where-things-live)

---

## 1. Product goals (what we were building)

- **Menu driven by Supabase**, not only static JSON: categories and products load from the database; admin can **create new categories** and CRUD products.
- **Storefront** (catalog list, product detail, cart) should reflect DB changes where possible (client refetch when env is set; static export caveats documented).
- **Product images** via **Supabase Storage** (public bucket), with optional **WebP conversion in the browser** before upload.
- **Admin area** (`/admin`) for staff: login, orders, **menu/products** with a usable Tailwind UI.
- **GitHub Pages** deployment with optional **`NEXT_PUBLIC_BASE_PATH`** (e.g. `/VISO`) without breaking local dev URLs.

---

## 2. Database and Supabase

### Migrations (ordered)

Under `supabase/migrations/`:

| File | Purpose (summary) |
|------|-------------------|
| `20260204120000_core_schema.sql` | Core tables (products, categories, options, i18n, orders, etc.) |
| `20260204120001_rls_and_helpers.sql` | RLS policies, **`public.is_admin()`** (checks `public.admins` for `auth.uid()`), catalog read policies |
| `20260204120002_functions.sql` | RPCs / server-side helpers (checkout-related, admin checks) |
| `20260204120003_seed_catalog.sql` | Seed data for catalog |
| `20260204120004_checkout_rpc_bypass_rls.sql` | Checkout RPC path vs RLS |
| `20260204120005_checkout_anon_insert_policies.sql` | Anon insert policies for web orders |
| `20260204120006_checkout_rpc_security_definer.sql` | Security definer hardening for checkout RPC |
| `20260204120007_storage_product_images.sql` | **`product-images` bucket** + **`storage.objects` policies** |

### Why Storage is a separate migration

Storage uses the **`storage`** schema (`storage.buckets`, `storage.objects`). Policies must reference **`bucket_id = 'product-images'`** and **`public.is_admin()`** for staff uploads. Creating a bucket **only in the Dashboard** does **not** create those policies; uploads then fail with **RLS / permission** errors until the SQL is applied.

---

## 3. Public catalog and storefront

### Shared catalog fetch

- Logic was centralized (e.g. `src/lib/catalog/supabase-catalog.ts` — **`fetchCatalogProductsFromSupabase`** pattern) so build-time and runtime paths stay consistent.
- **`load-catalog.ts`** (or equivalent load path) uses that shared fetch for static generation / SSG.

### Client refetch

When **`NEXT_PUBLIC_SUPABASE_URL`** and **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** are set:

- **`CatalogPageClient`** and **`ProductDetailsClient`** refetch the active catalog **after mount** in the browser so menu changes appear **without redeploy** (for data already reachable by anon RLS).

### Categories

- **`Product.category`** (or equivalent) is modeled as a **category slug** string for filters and URLs.
- Category filters on the catalog are **dynamic** from loaded data.

### Static hosting caveat

- **`generateStaticParams`** only knows product IDs from the **last build**. Brand-new product **routes** may still 404 on pure static hosts until a new build; in-app navigation from a refreshed list can still work. This is documented in **`docs/catalog-storage-and-staff.md`**.

---

## 4. Admin: menu / products

### Features

- **List** products with search, thumbnails, **On website** toggle, edit/delete.
- **Modal** for add/edit: English name/description, Arabic/Armenian names, category (select + **add new category**), weight per unit, **photo** (upload or path), choices/prices.

### New categories

- Admin can **insert** into **`product_categories`** (not limited to pre-seeded slugs).

### Relevant files

- `src/components/admin/products/MenuItemsAdmin.tsx`
- `src/components/admin/products/MenuItemModal.tsx`
- `src/lib/admin/slugify.ts`, `category-label.ts`, `prepare-image-upload.ts`, `storage-upload-hint.ts`

---

## 5. Supabase Storage: product images

### Bucket

- **Default bucket id:** **`product-images`** (hyphenated, lowercase).
- Override via **`NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET`** if the Dashboard id differs.
- Implemented in **`src/lib/supabase/product-images-bucket.ts`** (`PRODUCT_IMAGES_BUCKET`), used by:

  - **`src/lib/images/product-image-url.ts`** — builds public URLs for `menu/<key>` paths
  - **`MenuItemModal.tsx`** — `storage.from(PRODUCT_IMAGES_BUCKET).upload(...)`

### URL shape (critical)

Public objects must use:

```text
{SUPABASE_URL}/storage/v1/object/public/{bucket}/{objectKey}
```

If a URL is saved **without** the **`public`** segment (`.../object/product-images/...`), Storage often returns **400**. The app now **normalizes** full `https://*.supabase.co/...` URLs that omit `public` via **`normalizeSupabasePublicObjectUrl`** in `product-image-url.ts`. **Best practice:** store **only the object key** (e.g. `menu/<uuid>.webp`) in **`products.image_path`**.

### Upload pipeline

- **`prepareImageForUpload`** (`src/lib/admin/prepare-image-upload.ts`): optional canvas → **WebP**; fallback to original file.
- **`storageImageContentType`**: maps extension / type so uploads are not sent as **`application/octet-stream`**, which **buckets with `allowed_mime_types`** reject.

### RLS policies (migration `007`)

- **SELECT** for **`anon`** and **`authenticated`** on `bucket_id = 'product-images'`.
- **INSERT / UPDATE / DELETE** for **`authenticated`** when **`(SELECT public.is_admin())`** is true.

### Applying policies from the machine

- **`npm run db:storage-policies`** runs:

  `npx supabase db query -f supabase/migrations/20260204120007_storage_product_images.sql --linked`

  Requires Supabase CLI **login** and **`supabase link`** to the project. Alternatively: paste the same SQL in the Dashboard **SQL Editor**.

### Upload error hints

- **`src/lib/admin/storage-upload-hint.ts`** — maps Storage API messages to short actionable text (bucket missing, RLS, MIME, size, duplicate).

---

## 6. Staff access and `is_admin`

### Model

- Staff rows in **`public.admins`** with **`user_id`** = Supabase Auth user UUID.
- RLS on many tables uses **`public.is_admin()`**.

### `getStaffSupabase` (`src/lib/admin/staff-access.ts`)

- Creates anon client, checks session, then verifies staff by querying **`admins`** with **`.eq("user_id", session.user.id)`** and **`.maybeSingle()`**.

### Bug: “not staff” despite a row existing

- **When:** Admin UI showed not linked as staff even when a row existed.
- **Why:** RLS allows admins to **see all** `admins` rows. An **unfiltered** `select ... maybeSingle()` can return **multiple rows**; PostgREST then errors on `maybeSingle()`, and the UI treated it as failure.
- **Where:** `staff-access.ts` (and any similar pattern).
- **Fix:** Always **filter by the current user’s `user_id`** before `maybeSingle()`.

### Modal stability (HMR)

- **`onError`** passed into the modal: effect dependencies used a **ref** (`onErrorRef`) so callbacks stay fresh without unstable `useEffect` dependency arrays.

---

## 7. Checkout and orders (context)

- Web checkout flows through **RPC** + RLS-related migrations (`004`–`006`).
- Cart lines map to payload; WhatsApp flow preserved where applicable.
- Admin **orders** list/detail — part of broader admin work; this chronicle focuses more on catalog/storage but orders share the same **`is_admin`** model.

---

## 8. Errors, symptoms, and fixes

### 8.1 CI / ESLint

- **Symptoms:** PR checks failed (e.g. `prefer-const`, React hooks rules, `img` vs `next/image` in admin).
- **Where:** Various `src/` files including admin and `slugify.ts`.
- **Fix:** Satisfy ESLint (const, hook deps, disable comment only where appropriate for admin thumbnails and Supabase URLs).

### 8.2 Favicon 500 / conflict

- **Symptoms:** Requests to `/favicon.ico` or app icon routes returned 500.
- **Why:** Next.js conflict when both **`public/favicon`** (or similar) and **`src/app/favicon.ico`** exist.
- **Where:** App router metadata vs static public files.
- **Fix:** Remove duplicate **`src/app/favicon.ico`**; keep canonical asset under **`public/`** (as documented in project).

### 8.3 `Cannot find module './NNN.js'` (e.g. `./124.js`, `./331.js`)

- **When:** During **`next dev`**, often after deleting **`.next`**, switching bundlers, or Windows file locking.
- **Where:** `.next/server/.../webpack-runtime.js` pulling a missing chunk; sometimes surfaced via **`manifest.webmanifest`** or admin routes.
- **Why:** **Incomplete or stale Webpack output** (half-written chunks, AV locking, deleting `.next` while dev server running).
- **Fix:**
  - **Stop** dev server → **`npm run clean`** → restart **`npm run dev`**.
  - **`npm run clean`** runs **`scripts/clean-next.mjs`**: removes **`.next`** and **`node_modules/.cache`**.
  - **Never** delete `.next` while **`next dev`** is still running on Windows.
  - **`next.config.ts`**: **`webpack: (config, { dev }) => { if (dev) config.cache = false; }`** to reduce persistent cache corruption in dev.

### 8.4 `SegmentViewNode` / “React Client Manifest” / `__webpack_modules__[moduleId] is not a function`

- **When:** Next.js 15 **dev** after cache issues.
- **Why:** **Next devtools segment explorer** (`experimental.devtoolSegmentExplorer`, default **true**) plus broken chunk graph.
- **Where:** Server components pipeline / dev overlay.
- **Fix:** Set **`experimental: { devtoolSegmentExplorer: false }`** in **`next.config.ts`** to reduce cascading dev errors after a bad cache (still **clean `.next`** when chunks are missing).

### 8.5 Turbopack on Windows: `_buildManifest.js.tmp` ENOENT

- **Symptoms:** Turbopack dev failures on Windows (paths with spaces, Defender, temp manifest files).
- **Fix:** Default **`npm run dev`** uses **Webpack**; **`npm run dev:turbopack`** remains optional.

### 8.6 `NEXT_PUBLIC_BASE_PATH` vs `/_next` 404 on localhost

- **Symptoms:** Static assets 404 on **`http://localhost:3040`** when `.env.local` sets a GitHub Pages base path.
- **Why:** Dev server was applying **basePath** / **assetPrefix** while the user browsed the root URL.
- **Where:** `next.config.ts` and **`src/lib/effective-base-path.ts`** (must stay in sync).
- **Fix:** In **development**, **ignore** `NEXT_PUBLIC_BASE_PATH` unless **`NEXT_PUBLIC_FORCE_BASE_PATH_IN_DEV=true`**, so local dev uses **`/`** by default.

### 8.7 Service worker: `bad-precaching-response` / `_ssgManifest.js` / `_buildManifest.js` 404

- **When:** **`localhost:3040`** with DevTools console errors from **`sw.js`**.
- **Why:** A **stale service worker** from a **production** `next build` still controlled the origin; precache list pointed at **old build IDs** under **`_next/static/...`** that no longer exist after clean/rebuild.
- **Where:** Browser + **`public/sw.js`** (Serwist output). Serwist is **disabled in dev** in config, but **old SW remains registered**.
- **Fix:**
  - **`ClientProviders.tsx`**: on **development** + **localhost / 127.0.0.1**, **`useEffect`** calls **`navigator.serviceWorker.getRegistrations()`** and **`unregister()`** on load.
  - Manual fallback: DevTools → Application → Service workers → Unregister; hard refresh.
  - README updated to mention this alongside **`bad-precaching-response`**.

### 8.8 Image upload: MIME / bucket `allowed_mime_types`

- **Symptoms:** Upload fails when file is sent as **`application/octet-stream`**.
- **Why:** Bucket restricts **`allowed_mime_types`** to image types (migration `007`).
- **Fix:** **`storageImageContentType`** in **`prepare-image-upload.ts`**; upload options pass explicit **`contentType`**.

### 8.9 Storage: bucket exists, upload still fails

- **Symptoms:** RLS / permission errors, or vague Storage errors.
- **Why:** **No policies** on **`storage.objects`** for the bucket (UI-only bucket creation).
- **Fix:** Run **`20260204120007_storage_product_images.sql`** (SQL Editor or **`npm run db:storage-policies`** when linked).

### 8.10 Public image URL 400 (missing `public` in path)

- **Symptoms:** Network tab shows `.../storage/v1/object/product-images/...` without **`public`**.
- **Why:** Wrong URL stored in **`image_path`** or pasted from a non-public URL shape.
- **Fix:** **`normalizeSupabasePublicObjectUrl`** for `https://*.supabase.co` URLs; prefer storing **keys** only.

---

## 9. Development tooling and scripts

| Script | Purpose |
|--------|---------|
| `npm run clean` | Delete **`.next`** and **`node_modules/.cache`** (`scripts/clean-next.mjs`) |
| `npm run dev` | Next dev, port **3040**, Webpack |
| `npm run dev:clean` | Clean then dev |
| `npm run dev:turbopack` / `dev:turbopack:clean` | Optional Turbopack |
| `npm run dev:webpack:clean` | Clean then Webpack dev |
| `npm run db:storage-policies` | Apply Storage migration to **linked** Supabase project |

---

## 10. UI and UX changes

### Admin menu page (`MenuItemsAdmin.tsx`)

- **Before:** Long intro about static hosting, asking publishers to redeploy, build-time catalog.
- **After:** Short line: edit names/prices/photos; **“On website”** hides without deleting.

### Add/Edit item modal (`MenuItemModal.tsx`)

- **Removed** modal subtitle about live DB + GitHub Pages + republish.
- **Photo section:**
  - Short helper: upload then save, or path starting with **`/`**.
  - **Upload** and **Prefer WebP** first; then labeled **Path** field with simple placeholder.
  - Removed in-UI references to migration ids, bucket env vars, and Supabase URL in preview copy.
  - Preview for storage keys: thumbnail only (accessible **`alt`**).
  - Button label **Upload image**; success hint **Uploaded — press Save to apply.**
- **New category** box: title **New category**; removed “Creates a row in the database…” explanation.

Errors still surface via **`onError`** / **`storage-upload-hint`** when something breaks; happy path stays quiet.

---

## 11. Documentation and env vars

- **`README.md`**: setup, scripts, troubleshooting (`.next`, SW, base path, chunk errors).
- **`docs/catalog-storage-and-staff.md`**: catalog refetch, **`image_path`** semantics, Storage URL shape, bucket + RLS, staff verification, **`db:storage-policies`**.
- **`docs/seed-admins.md`**: Auth + inserting **`admins`** rows.
- **`.env.example`**: WhatsApp, optional base path, **`NEXT_PUBLIC_SUPABASE_*`**, optional **`NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET`**.

---

## 12. File index (where things live)

| Area | Paths |
|------|--------|
| Catalog fetch | `src/lib/catalog/supabase-catalog.ts`, load catalog utilities |
| Image URLs | `src/lib/images/product-image-url.ts` |
| Bucket constant | `src/lib/supabase/product-images-bucket.ts` |
| Upload prep / MIME | `src/lib/admin/prepare-image-upload.ts` |
| Upload error hints | `src/lib/admin/storage-upload-hint.ts` |
| Staff session | `src/lib/admin/staff-access.ts` |
| Base path | `src/lib/basePath.ts`, `src/lib/effective-base-path.ts` |
| Next config | `next.config.ts` |
| Serwist SW source | `src/app/sw.ts` → build writes **`public/sw.js`** |
| Client SW / providers | `src/components/ClientProviders.tsx` |
| Storage SQL | `supabase/migrations/20260204120007_storage_product_images.sql` |
| Clean script | `scripts/clean-next.mjs` |
| Admin menu UI | `src/components/admin/products/MenuItemsAdmin.tsx`, `MenuItemModal.tsx` |
| Storefront catalog UI | `src/app/(site)/catalog/CatalogPageClient.tsx`, `ProductDetailsClient.tsx` |

---

## Revision note

This chronicle reflects work through **Supabase-backed menu**, **Storage images**, **dev stability (Windows, SW, Webpack cache)**, **URL normalization**, **RLS/policy application**, and **admin copy cleanup**. If you add major features later, append a dated section or link a new doc so this file stays a **checkpoint**, not a living spec.

*Last compiled: April 2026 (session documentation).*
