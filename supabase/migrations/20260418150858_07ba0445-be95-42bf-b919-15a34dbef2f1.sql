-- ============================================================
-- PROMO CODES
-- ============================================================
CREATE TYPE public.discount_type AS ENUM ('percentage', 'fixed');

CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type public.discount_type NOT NULL,
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  max_discount numeric,
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promo codes"
ON public.promo_codes FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all promo codes"
ON public.promo_codes FOR SELECT
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert promo codes"
ON public.promo_codes FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update promo codes"
ON public.promo_codes FOR UPDATE
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete promo codes"
ON public.promo_codes FOR DELETE
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add promo fields to bookings
ALTER TABLE public.bookings
  ADD COLUMN promo_code_id uuid REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  ADD COLUMN discount_amount numeric NOT NULL DEFAULT 0;

-- ============================================================
-- WAITLIST
-- ============================================================
CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  hall_id uuid NOT NULL REFERENCES public.halls(id) ON DELETE CASCADE,
  event_date date NOT NULL,
  guest_count integer,
  notes text,
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, hall_id, event_date)
);

CREATE INDEX idx_waitlist_hall_date ON public.waitlist(hall_id, event_date);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own waitlist entries"
ON public.waitlist FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Admins can view all waitlist entries"
ON public.waitlist FOR SELECT
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create their own waitlist entries"
ON public.waitlist FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own waitlist entries"
ON public.waitlist FOR DELETE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Admins can delete waitlist entries"
ON public.waitlist FOR DELETE
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- UPDATED BOOKING TOTAL TRIGGER (applies promo discount)
-- ============================================================
CREATE OR REPLACE FUNCTION public.recalculate_booking_total()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_hall_price numeric := 0;
  v_catering_price numeric := 0;
  v_decoration_price numeric := 0;
  v_hours numeric := 0;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_promo RECORD;
BEGIN
  -- Hall cost
  IF NEW.hall_id IS NOT NULL AND NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
    SELECT price_per_hour INTO v_hall_price FROM public.halls WHERE id = NEW.hall_id;
    v_hours := EXTRACT(HOUR FROM (NEW.end_time - NEW.start_time));
    IF v_hours <= 0 THEN v_hours := 0; END IF;
    v_subtotal := v_subtotal + (COALESCE(v_hall_price, 0) * v_hours);
  END IF;

  -- Catering cost
  IF NEW.catering_package_id IS NOT NULL THEN
    SELECT price_per_person INTO v_catering_price FROM public.catering_packages WHERE id = NEW.catering_package_id;
    v_subtotal := v_subtotal + (COALESCE(v_catering_price, 0) * COALESCE(NEW.guest_count, 0));
  END IF;

  -- Decoration cost
  IF NEW.decoration_package_id IS NOT NULL THEN
    SELECT price INTO v_decoration_price FROM public.decoration_packages WHERE id = NEW.decoration_package_id;
    v_subtotal := v_subtotal + COALESCE(v_decoration_price, 0);
  END IF;

  -- Apply promo code if present and valid
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

-- Increment promo usage count on insert when a code is applied
CREATE OR REPLACE FUNCTION public.increment_promo_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.promo_code_id IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.promo_code_id IS DISTINCT FROM NEW.promo_code_id) THEN
    UPDATE public.promo_codes
    SET used_count = used_count + 1
    WHERE id = NEW.promo_code_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER bookings_increment_promo_usage
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.increment_promo_usage();

-- ============================================================
-- WAITLIST NOTIFICATION TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_waitlist_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_hall_name text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' AND NEW.hall_id IS NOT NULL THEN
    SELECT name INTO v_hall_name FROM public.halls WHERE id = NEW.hall_id;

    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT
      w.user_id,
      'A spot just opened up!',
      'Good news — ' || COALESCE(v_hall_name, 'a hall') || ' is now available on ' || to_char(NEW.event_date, 'Mon DD, YYYY') || '. Book it before someone else does!',
      'success',
      '/book?hall=' || NEW.hall_id::text || '&date=' || NEW.event_date::text
    FROM public.waitlist w
    WHERE w.hall_id = NEW.hall_id
      AND w.event_date = NEW.event_date
      AND w.notified_at IS NULL;

    UPDATE public.waitlist
    SET notified_at = now()
    WHERE hall_id = NEW.hall_id
      AND event_date = NEW.event_date
      AND notified_at IS NULL;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER bookings_notify_waitlist
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_waitlist_on_cancel();