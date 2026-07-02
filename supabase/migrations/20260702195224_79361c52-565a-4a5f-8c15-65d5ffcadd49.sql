
-- Remove the policy that lets authenticated users read all active promo code details
DROP POLICY IF EXISTS "Authenticated users can view active promo codes" ON public.promo_codes;

-- Create a SECURITY DEFINER function that validates a code and returns only the
-- minimal fields needed at checkout. It never exposes usage limits, used counts,
-- validity windows, or descriptions of other codes.
CREATE OR REPLACE FUNCTION public.redeem_promo_code(_code text)
RETURNS TABLE (
  id uuid,
  code text,
  description text,
  discount_type text,
  discount_value numeric,
  max_discount numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo public.promo_codes%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE UPPER(promo_codes.code) = UPPER(TRIM(_code))
    AND promo_codes.is_active = true;

  IF v_promo.id IS NULL THEN
    RAISE EXCEPTION 'Invalid promo code' USING ERRCODE = 'P0002';
  END IF;
  IF v_promo.valid_from IS NOT NULL AND v_promo.valid_from > now() THEN
    RAISE EXCEPTION 'Promo code is not yet valid' USING ERRCODE = 'P0002';
  END IF;
  IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < now() THEN
    RAISE EXCEPTION 'Promo code has expired' USING ERRCODE = 'P0002';
  END IF;
  IF v_promo.usage_limit IS NOT NULL AND v_promo.used_count >= v_promo.usage_limit THEN
    RAISE EXCEPTION 'Promo code usage limit reached' USING ERRCODE = 'P0002';
  END IF;

  RETURN QUERY SELECT
    v_promo.id,
    v_promo.code,
    v_promo.description,
    v_promo.discount_type,
    v_promo.discount_value,
    v_promo.max_discount;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.redeem_promo_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(text) TO authenticated;
