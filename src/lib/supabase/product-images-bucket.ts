/**
 * Supabase Storage bucket id for menu photos (must match Dashboard → Storage).
 * Default matches `supabase/migrations/20260204120007_storage_product_images.sql`.
 */
export const PRODUCT_IMAGES_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET?.trim() || "product-images";
