
-- Fix 1: Prevent users from modifying protected booking fields (status, payment_status, total_amount, payment_reference)
CREATE OR REPLACE FUNCTION public.prevent_booking_status_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow service_role to modify any fields (used by edge functions)
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block regular users from modifying protected fields
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

CREATE TRIGGER booking_field_protection
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.prevent_booking_status_tampering();

-- Fix 2: Server-side price recalculation on booking INSERT
CREATE OR REPLACE FUNCTION public.recalculate_booking_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_hall_price numeric := 0;
  v_catering_price numeric := 0;
  v_decoration_price numeric := 0;
  v_hours numeric := 0;
  v_calculated_total numeric := 0;
BEGIN
  -- Calculate hall cost
  IF NEW.hall_id IS NOT NULL AND NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
    SELECT price_per_hour INTO v_hall_price FROM public.halls WHERE id = NEW.hall_id;
    v_hours := EXTRACT(HOUR FROM (NEW.end_time - NEW.start_time));
    IF v_hours <= 0 THEN
      v_hours := 0;
    END IF;
    v_calculated_total := v_calculated_total + (COALESCE(v_hall_price, 0) * v_hours);
  END IF;

  -- Calculate catering cost
  IF NEW.catering_package_id IS NOT NULL THEN
    SELECT price_per_person INTO v_catering_price FROM public.catering_packages WHERE id = NEW.catering_package_id;
    v_calculated_total := v_calculated_total + (COALESCE(v_catering_price, 0) * COALESCE(NEW.guest_count, 0));
  END IF;

  -- Calculate decoration cost
  IF NEW.decoration_package_id IS NOT NULL THEN
    SELECT price INTO v_decoration_price FROM public.decoration_packages WHERE id = NEW.decoration_package_id;
    v_calculated_total := v_calculated_total + COALESCE(v_decoration_price, 0);
  END IF;

  -- Override the client-provided total with server-calculated total
  NEW.total_amount := v_calculated_total;

  RETURN NEW;
END;
$$;

CREATE TRIGGER recalculate_booking_total_on_insert
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_booking_total();
