-- Public bucket for menu/product photos. Store object keys in products.image_path (e.g. menu/<uuid>.webp).
-- Full URL is built in the app: {SUPABASE_URL}/storage/v1/object/public/product-images/{key}

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/svg+xml',
    'image/heic',
    'image/heif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "product_images_select_public" ON storage.objects;
DROP POLICY IF EXISTS "product_images_insert_admin" ON storage.objects;
DROP POLICY IF EXISTS "product_images_update_admin" ON storage.objects;
DROP POLICY IF EXISTS "product_images_delete_admin" ON storage.objects;

CREATE POLICY "product_images_select_public"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_insert_admin"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (SELECT public.is_admin())
  );

CREATE POLICY "product_images_update_admin"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (SELECT public.is_admin())
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND (SELECT public.is_admin())
  );

CREATE POLICY "product_images_delete_admin"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (SELECT public.is_admin())
  );
