import { publicAsset } from "@/lib/basePath";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/supabase/product-images-bucket";

/** Default hero/cart image when path is missing or storage is unavailable. */
export const PRODUCT_IMAGE_FALLBACK = "/images/products/plain-kaak.webp";

const STORAGE_OBJECT_PREFIX = "/storage/v1/object/";

/**
 * Public bucket URLs must include `/object/public/{bucket}/...`. Some UIs omit `public`,
 * yielding `/object/{bucket}/...` and a 400 from Storage.
 */
export function normalizeSupabasePublicObjectUrl(url: string): string {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith(".supabase.co")) return url;
    const path = u.pathname;
    const idx = path.indexOf(STORAGE_OBJECT_PREFIX);
    if (idx === -1) return url;
    const after = path.slice(idx + STORAGE_OBJECT_PREFIX.length);
    if (after.startsWith("public/")) return url;
    if (after.startsWith("sign/") || after.startsWith("authenticated/")) return url;
    return `${u.origin}${STORAGE_OBJECT_PREFIX}public/${after}`;
  } catch {
    return url;
  }
}

/**
 * Resolves `products.image_path` for <Image /> / <img />.
 * - `https://...` → used as-is (Supabase object URLs missing `public` are fixed when possible)
 * - `/...` → static file under `public/` (with basePath)
 * - `menu/foo.webp` → Supabase Storage public URL (requires NEXT_PUBLIC_SUPABASE_URL)
 */
export function productImageUrl(imagePath: string | null | undefined): string {
  const fallback = publicAsset(PRODUCT_IMAGE_FALLBACK);
  if (!imagePath?.trim()) return fallback;
  const p = imagePath.trim();
  if (p.startsWith("http://") || p.startsWith("https://")) {
    return normalizeSupabasePublicObjectUrl(p);
  }
  if (p.startsWith("/")) return publicAsset(p);

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return fallback;

  const encodedKey = p
    .split("/")
    .filter((seg) => seg.length > 0 && seg !== "." && seg !== "..")
    .map((seg) => encodeURIComponent(seg))
    .join("/");

  return `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${encodedKey}`;
}
