CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  field text NOT NULL,
  old_value text,
  new_value text NOT NULL,
  reason text,
  changed_by uuid,
  actor text NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_status_history_booking_idx
  ON public.booking_status_history (booking_id, created_at);

GRANT SELECT ON public.booking_status_history TO authenticated;
GRANT ALL ON public.booking_status_history TO service_role;

ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view history of their own bookings"
ON public.booking_status_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_status_history.booking_id
      AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all booking history"
ON public.booking_status_history
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.log_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_actor text;
  v_reason text;
  v_uid uuid := auth.uid();
BEGIN
  v_reason := NULLIF(TRIM(COALESCE(current_setting('app.status_change_reason', true), '')), '');

  IF current_setting('app.auto_cancel', true) = 'on' THEN
    v_actor := 'system';
    v_reason := COALESCE(v_reason, 'Automatically cancelled: unpaid for more than 14 days');
  ELSIF v_uid IS NULL THEN
    v_actor := 'system';
  ELSIF public.has_role(v_uid, 'admin') THEN
    v_actor := 'admin';
  ELSE
    v_actor := 'customer';
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.booking_status_history (booking_id, field, old_value, new_value, reason, changed_by, actor)
    VALUES (NEW.id, 'created', NULL, NEW.status::text, COALESCE(v_reason, 'Booking request submitted'), v_uid, v_actor);
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.booking_status_history (booking_id, field, old_value, new_value, reason, changed_by, actor)
    VALUES (NEW.id, 'status', OLD.status::text, NEW.status::text, v_reason, v_uid, v_actor);
  END IF;

  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    INSERT INTO public.booking_status_history (booking_id, field, old_value, new_value, reason, changed_by, actor)
    VALUES (NEW.id, 'payment_status', OLD.payment_status::text, NEW.payment_status::text, v_reason, v_uid, v_actor);
  END IF;

  IF NEW.event_date IS DISTINCT FROM OLD.event_date THEN
    INSERT INTO public.booking_status_history (booking_id, field, old_value, new_value, reason, changed_by, actor)
    VALUES (NEW.id, 'event_date', OLD.event_date::text, NEW.event_date::text, COALESCE(v_reason, 'Booking rescheduled'), v_uid, v_actor);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_booking_status_change_ins ON public.bookings;
CREATE TRIGGER log_booking_status_change_ins
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.log_booking_status_change();

DROP TRIGGER IF EXISTS log_booking_status_change_upd ON public.bookings;
CREATE TRIGGER log_booking_status_change_upd
AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.log_booking_status_change();

CREATE OR REPLACE FUNCTION public.update_booking_status(_booking_id uuid, _status booking_status, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can update booking status';
  END IF;

  PERFORM set_config('app.status_change_reason', COALESCE(NULLIF(TRIM(_reason), ''), ''), true);

  UPDATE public.bookings
  SET status = _status
  WHERE id = _booking_id;

  PERFORM set_config('app.status_change_reason', '', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_booking_status(uuid, booking_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_booking_status(uuid, booking_status, text) TO authenticated;

-- Backfill history for existing bookings so timelines are not empty
INSERT INTO public.booking_status_history (booking_id, field, old_value, new_value, reason, actor, created_at)
SELECT b.id, 'created', NULL, 'pending', 'Booking request submitted', 'customer', b.created_at
FROM public.bookings b
WHERE NOT EXISTS (
  SELECT 1 FROM public.booking_status_history h WHERE h.booking_id = b.id
);

INSERT INTO public.booking_status_history (booking_id, field, old_value, new_value, reason, actor, created_at)
SELECT b.id, 'status', 'pending', b.status::text, 'Recorded before change history was enabled', 'system', b.updated_at
FROM public.bookings b
WHERE b.status <> 'pending'
  AND NOT EXISTS (
    SELECT 1 FROM public.booking_status_history h
    WHERE h.booking_id = b.id AND h.field = 'status'
  );
