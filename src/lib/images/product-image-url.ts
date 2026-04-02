import { publicAsset } from "@/lib/basePath";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/supabase/product-images-bucket";

/** Default hero/cart image when path is missing or storage is unavailable. */
export const PRODUCT_IMAGE_FALLBACK = "/images/products/plain-kaak.webp";

/**
 * Resolves `products.image_path` for <Image /> / <img />.
 * - `https://...` → used as-is
 * - `/...` → static file under `public/` (with basePath)
 * - `menu/foo.webp` → Supabase Storage public URL (requires NEXT_PUBLIC_SUPABASE_URL)
 */
export function productImageUrl(imagePath: string | null | undefined): string {
  const fallback = publicAsset(PRODUCT_IMAGE_FALLBACK);
  if (!imagePath?.trim()) return fallback;
  const p = imagePath.trim();
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
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
