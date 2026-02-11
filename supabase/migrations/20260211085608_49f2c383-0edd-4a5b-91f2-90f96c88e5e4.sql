
-- Fix 1: Add WITH CHECK clause to prevent users from modifying protected fields
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;

CREATE POLICY "Users can update their own reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  user_id = (SELECT r.user_id FROM public.reviews r WHERE r.id = reviews.id) AND
  booking_id IS NOT DISTINCT FROM (SELECT r.booking_id FROM public.reviews r WHERE r.id = reviews.id) AND
  is_approved = (SELECT r.is_approved FROM public.reviews r WHERE r.id = reviews.id) AND
  hall_id IS NOT DISTINCT FROM (SELECT r.hall_id FROM public.reviews r WHERE r.id = reviews.id)
);

-- Fix 2: Create a public view that excludes sensitive user identifiers
CREATE OR REPLACE VIEW public.public_reviews AS
SELECT id, hall_id, rating, title, comment, created_at, updated_at
FROM public.reviews
WHERE is_approved = true;

-- Grant access to the view
GRANT SELECT ON public.public_reviews TO anon, authenticated;
