
-- Fix the SECURITY DEFINER view issue
ALTER VIEW public.public_reviews SET (security_invoker = on);
