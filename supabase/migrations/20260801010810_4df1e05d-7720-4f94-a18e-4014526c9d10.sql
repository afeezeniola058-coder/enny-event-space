CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.auto_cancel_stale_pending_bookings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  PERFORM set_config('app.auto_cancel', 'on', true);

  WITH updated AS (
    UPDATE public.bookings
    SET status = 'cancelled'
    WHERE status = 'pending'
      AND payment_status = 'pending'
      AND created_at < now() - interval '14 days'
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM updated;

  PERFORM set_config('app.auto_cancel', 'off', true);
  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.auto_cancel_stale_pending_bookings() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.prevent_booking_status_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF current_setting('app.auto_cancel', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Cannot modify booking status';
  END IF;
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    RAISE EXCEPTION 'Cannot modify payment status';
  END IF;
  IF NEW.payment_reference IS DISTINCT FROM OLD.payment_reference THEN
    RAISE EXCEPTION 'Cannot modify payment reference';
  END IF;
  IF NEW.total_amount IS DISTINCT FROM OLD.total_amount THEN
    RAISE EXCEPTION 'Cannot modify total amount';
  END IF;

  RETURN NEW;
END;
$$;
