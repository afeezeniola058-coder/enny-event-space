-- Tighten storage SELECT policies to prevent bucket listing while keeping public CDN URL reads working.
-- Public buckets serve files via the public URL (CDN) without RLS checks. The RLS SELECT policy only
-- governs listing/API access. We restrict listing so callers cannot enumerate all files in the bucket.

-- event-images: only admins can list via the API; public CDN URLs continue to work for display
DROP POLICY IF EXISTS "Anyone can view event images" ON storage.objects;

CREATE POLICY "Admins can list event images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'event-images'
  AND auth.uid() IS NOT NULL
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- avatars: users can only list files in their own folder; public CDN URLs continue to work for display
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

CREATE POLICY "Users can list their own avatar files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can list all avatar files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND has_role(auth.uid(), 'admin'::app_role)
);