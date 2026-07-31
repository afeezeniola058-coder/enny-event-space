CREATE OR REPLACE FUNCTION public.prevent_booking_status_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('role', true) = 'service_role' THEN
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
$function$;

DROP TRIGGER IF EXISTS trg_prevent_booking_status_tampering ON public.bookings;