# Public catalog, product images, and staff checks

How the storefront loads menu data, how image paths resolve, and how staff verification interacts with RLS.

## Public catalog (database)

When `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set:

- **Build / SSR:** `loadCatalogProducts()` still loads the catalog for static generation and initial HTML.
- **Browser:** `CatalogPageClient` and `ProductDetailsClient` refetch the active catalog via the **anon** client after mount, so menu changes in Supabase show up **without** waiting for a new deploy (list and product detail data).

**Static hosting caveat:** `generateStaticParams` only knows product IDs from the **last build**. Brand-new product **URLs** may still 404 on pure static hosts until you publish a fresh build; opening new items from the refreshed menu via in-app navigation works.

## Product images

`products.image_path` can be:

| Value | Meaning |
|--------|---------|
| `/images/products/foo.webp` | File under `public/` (respects `NEXT_PUBLIC_BASE_PATH` on GitHub Pages). |
| `menu/<uuid>.webp` (or similar) | Object key in your product images bucket (default id **`product-images`**). Public URL: `{NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/{bucket}/{key}`. Override bucket id with **`NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET`** if the Dashboard name differs. |
| `https://…` | Used as-is. |

Resolution is implemented in `src/lib/images/product-image-url.ts` (`productImageUrl`).

**Bucket setup:** Apply migration `20260204120007_storage_product_images.sql` (`supabase db push`). Staff upload from **Admin → Menu** (optional in-browser **WebP** conversion).

### If you created the bucket only in the Dashboard

The bucket id must be exactly **`product-images`** (hyphen, lowercase) unless you set **`NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET`** to match your id.

Turn **Public bucket** on if you want catalog `<img>` URLs to work without signed URLs.

**Important:** The UI does **not** create the **storage.objects** RLS policies the app expects. Without them, uploads fail with errors like *new row violates row-level security policy* or *permission denied*.

1. Supabase → **SQL Editor** → New query.
2. Paste and run the full contents of **`supabase/migrations/20260204120007_storage_product_images.sql`**.

That script upserts the bucket row (public, MIME allow-list, size limit) and recreates the four policies (public read; admin insert/update/delete). It is safe to run more than once.

**Still failing?** Confirm your login is staff: a row in **`public.admins`** with **`user_id`** = your Auth user UUID (`docs/seed-admins.md`). Confirm **`.env.local`** uses the same project URL and anon key as that Dashboard.

## Staff verification (`getStaffSupabase`)

Staff must have a row in **`public.admins`** with `user_id` = their Supabase Auth user UUID (`docs/seed-admins.md`).

The app checks staff by querying **`admins` filtered by the signed-in user’s id**. That filter is required because RLS allows admins to **see all** `admins` rows (`admins_admin_all`); an unfiltered `select … maybeSingle()` could return **multiple rows**, which makes PostgREST reject `maybeSingle()` and the UI incorrectly showed *“not linked as staff”* even when your row existed.

If you still see errors after confirming your UUID in `admins`, verify `.env.local` points at the **same** Supabase project as the Dashboard where you checked the table.
