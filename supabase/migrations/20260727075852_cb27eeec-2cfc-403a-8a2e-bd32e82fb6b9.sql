ALTER TABLE public.catering_packages
  ADD COLUMN IF NOT EXISTS pricing_type text NOT NULL DEFAULT 'per_person',
  ADD COLUMN IF NOT EXISTS flat_price numeric,
  ADD COLUMN IF NOT EXISTS dietary_options text[];

ALTER TABLE public.catering_packages
  DROP CONSTRAINT IF EXISTS catering_packages_pricing_type_check;
ALTER TABLE public.catering_packages
  ADD CONSTRAINT catering_packages_pricing_type_check CHECK (pricing_type IN ('per_person','flat'));

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS dietary_preferences text[];

CREATE OR REPLACE FUNCTION public.recalculate_booking_total()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_hall_price numeric := 0;
  v_catering RECORD;
  v_decoration_price numeric := 0;
  v_hours numeric := 0;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_promo RECORD;
BEGIN
  IF NEW.hall_id IS NOT NULL AND NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
    SELECT price_per_hour INTO v_hall_price FROM public.halls WHERE id = NEW.hall_id;
    v_hours := EXTRACT(HOUR FROM (NEW.end_time - NEW.start_time));
    IF v_hours <= 0 THEN v_hours := 0; END IF;
    v_subtotal := v_subtotal + (COALESCE(v_hall_price, 0) * v_hours);
  END IF;

  IF NEW.catering_package_id IS NOT NULL THEN
    SELECT price_per_person, pricing_type, flat_price
      INTO v_catering
      FROM public.catering_packages WHERE id = NEW.catering_package_id;
    IF v_catering.pricing_type = 'flat' THEN
      v_subtotal := v_subtotal + COALESCE(v_catering.flat_price, 0);
    ELSE
      v_subtotal := v_subtotal + (COALESCE(v_catering.price_per_person, 0) * COALESCE(NEW.guest_count, 0));
    END IF;
  END IF;

  IF NEW.decoration_package_id IS NOT NULL THEN
    SELECT price INTO v_decoration_price FROM public.decoration_packages WHERE id = NEW.decoration_package_id;
    v_subtotal := v_subtotal + COALESCE(v_decoration_price, 0);
  END IF;

  IF NEW.promo_code_id IS NOT NULL THEN
    SELECT * INTO v_promo FROM public.promo_codes WHERE id = NEW.promo_code_id;
    IF v_promo.id IS NULL THEN
      RAISE EXCEPTION 'Invalid promo code';
    END IF;
    IF NOT v_promo.is_active THEN
      RAISE EXCEPTION 'Promo code is not active';
    END IF;
    IF v_promo.valid_from > now() THEN
      RAISE EXCEPTION 'Promo code is not yet valid';
    END IF;
    IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < now() THEN
      RAISE EXCEPTION 'Promo code has expired';
    END IF;
    IF v_promo.usage_limit IS NOT NULL AND v_promo.used_count >= v_promo.usage_limit THEN
      RAISE EXCEPTION 'Promo code usage limit reached';
    END IF;

    IF v_promo.discount_type = 'percentage' THEN
      v_discount := v_subtotal * (v_promo.discount_value / 100);
      IF v_promo.max_discount IS NOT NULL AND v_discount > v_promo.max_discount THEN
        v_discount := v_promo.max_discount;
      END IF;
    ELSE
      v_discount := v_promo.discount_value;
    END IF;

    IF v_discount > v_subtotal THEN
      v_discount := v_subtotal;
    END IF;
  END IF;

  NEW.discount_amount := v_discount;
  NEW.total_amount := v_subtotal - v_discount;

  RETURN NEW;
END;
$function$;