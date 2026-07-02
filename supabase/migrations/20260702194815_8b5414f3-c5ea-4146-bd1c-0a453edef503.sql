
-- These SECURITY DEFINER functions are trigger handlers or admin utilities
-- that should NOT be callable via the Data API by anon or authenticated users.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_user_role_modification() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_user_role_deletion() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_promo_usage() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_booking_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_waitlist_on_cancel() FROM anon, authenticated, PUBLIC;

-- has_role is used by RLS policies (runs as definer), so revoke public API access.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
