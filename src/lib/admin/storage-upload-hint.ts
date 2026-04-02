/**
 * Turns Supabase Storage API errors into short, actionable messages for admin UI.
 */
export function storageUploadUserHint(message: string, bucketId: string): string {
  const lower = message.toLowerCase();

  if (
    message.includes("Bucket not found") ||
    (lower.includes("bucket") && lower.includes("not found"))
  ) {
    return `${message} — In Dashboard → Storage, create a bucket with id "${bucketId}" (exactly), or set NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET to your bucket id, then run migration 20260204120007 for RLS.`;
  }

  if (
    lower.includes("row-level security") ||
    lower.includes("violates row-level security") ||
    lower.includes("new row violates") ||
    lower.includes("permission denied") ||
    message.includes("42501") ||
    (lower.includes("policy") && lower.includes("violat"))
  ) {
    return `${message} — Storage RLS is blocking the upload. Creating a bucket in the UI does not add policies. Run supabase/migrations/20260204120007_storage_product_images.sql in the SQL Editor (or supabase db push). Your user must be in public.admins (see docs/seed-admins.md).`;
  }

  if (
    lower.includes("mime") ||
    lower.includes("invalid type") ||
    lower.includes("not allowed") ||
    lower.includes("unsupported")
  ) {
    return `${message} — Bucket allowed MIME types may be too strict. Either clear restrictions in Storage → ${bucketId} → configuration, or match the list in migration 20260204120007 (image/jpeg, png, webp, …).`;
  }

  if (lower.includes("too large") || lower.includes("exceeded") || lower.includes("413")) {
    return `${message} — File exceeds the bucket file size limit. Increase the limit in Storage → ${bucketId} or use a smaller image.`;
  }

  if (lower.includes("already exists") || lower.includes("duplicate")) {
    return `${message} — Try again (a new object key is generated each time) or remove the existing object in Storage.`;
  }

  return message;
}
