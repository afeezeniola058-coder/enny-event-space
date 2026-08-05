
CREATE TYPE public.reschedule_status AS ENUM ('pending','approved','rejected','cancelled');

CREATE TABLE public.reschedule_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  current_date_snapshot date NOT NULL,
  requested_date date NOT NULL,
  requested_start_time time NOT NULL,
  requested_end_time time NOT NULL,
  requested_hall_id uuid REFERENCES public.halls(id),
  reason text,
  status public.reschedule_status NOT NULL DEFAULT 'pending',
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX reschedule_requests_one_pending
  ON public.reschedule_requests(booking_id) WHERE status = 'pending';

GRANT SELECT ON public.reschedule_requests TO authenticated;
GRANT ALL ON public.reschedule_requests TO service_role;

ALTER TABLE public.reschedule_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reschedule requests"
  ON public.reschedule_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reschedule requests"
  ON public.reschedule_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_reschedule_requests_updated_at
  BEFORE UPDATE ON public.reschedule_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Submit a reschedule request
CREATE OR REPLACE FUNCTION public.request_booking_reschedule(
  _booking_id uuid,
  _requested_date date,
  _requested_start_time time,
  _requested_end_time time,
  _requested_hall_id uuid,
  _reason text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_id uuid;
  v_hall uuid;
  v_conflict boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_booking FROM public.bookings WHERE id = _booking_id;
  IF v_booking.id IS NULL OR v_booking.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  IF v_booking.status NOT IN ('pending','confirmed') THEN
    RAISE EXCEPTION 'Only pending or confirmed bookings can be rescheduled';
  END IF;
  IF (v_booking.event_date + v_booking.start_time) < (now() + interval '72 hours') THEN
    RAISE EXCEPTION 'Reschedule requests must be made at least 72 hours before the event';
  END IF;
  IF _requested_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Requested date cannot be in the past';
  END IF;
  IF _requested_end_time <= _requested_start_time THEN
    RAISE EXCEPTION 'End time must be after start time';
  END IF;

  v_hall := COALESCE(_requested_hall_id, v_booking.hall_id);
  IF v_hall IS NULL THEN
    RAISE EXCEPTION 'A venue is required';
  END IF;

  IF EXISTS (SELECT 1 FROM public.reschedule_requests r WHERE r.booking_id = _booking_id AND r.status = 'pending') THEN
    RAISE EXCEPTION 'You already have a pending reschedule request for this booking';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.hall_id = v_hall
      AND b.event_date = _requested_date
      AND b.status <> 'cancelled'
      AND b.id <> _booking_id
  ) INTO v_conflict;

  IF v_conflict THEN
    RAISE EXCEPTION 'That venue is already booked on the requested date';
  END IF;

  INSERT INTO public.reschedule_requests (
    booking_id, user_id, current_date_snapshot, requested_date,
    requested_start_time, requested_end_time, requested_hall_id, reason
  ) VALUES (
    _booking_id, auth.uid(), v_booking.event_date, _requested_date,
    _requested_start_time, _requested_end_time, v_hall, NULLIF(TRIM(COALESCE(_reason,'')), '')
  ) RETURNING id INTO v_id;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    auth.uid(),
    'Reschedule request submitted',
    'We received your request to move "' || v_booking.event_name || '" to ' ||
      to_char(_requested_date, 'Mon DD, YYYY') || '. Our team will review it shortly.',
    'info',
    '/booking/' || _booking_id
  );

  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT ur.user_id,
         'New reschedule request',
         'A customer requested to move "' || v_booking.event_name || '" to ' ||
           to_char(_requested_date, 'Mon DD, YYYY') || '.',
         'warning',
         '/admin'
  FROM public.user_roles ur WHERE ur.role = 'admin';

  RETURN v_id;
END;
$$;

-- Customer cancels their own pending request
CREATE OR REPLACE FUNCTION public.cancel_reschedule_request(_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.reschedule_requests
  SET status = 'cancelled'
  WHERE id = _request_id AND user_id = auth.uid() AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending request not found';
  END IF;
END;
$$;

-- Admin approves or rejects
CREATE OR REPLACE FUNCTION public.review_reschedule_request(
  _request_id uuid,
  _approve boolean,
  _admin_note text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_req public.reschedule_requests%ROWTYPE;
  v_booking public.bookings%ROWTYPE;
  v_conflict boolean;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can review reschedule requests';
  END IF;

  SELECT * INTO v_req FROM public.reschedule_requests WHERE id = _request_id;
  IF v_req.id IS NULL OR v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Pending request not found';
  END IF;

  SELECT * INTO v_booking FROM public.bookings WHERE id = v_req.booking_id;

  IF _approve THEN
    SELECT EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.hall_id = v_req.requested_hall_id
        AND b.event_date = v_req.requested_date
        AND b.status <> 'cancelled'
        AND b.id <> v_req.booking_id
    ) INTO v_conflict;

    IF v_conflict THEN
      RAISE EXCEPTION 'That venue is no longer available on the requested date';
    END IF;

    PERFORM set_config('app.status_change_reason',
      'Reschedule request approved' || COALESCE(': ' || NULLIF(TRIM(COALESCE(_admin_note,'')), ''), ''), true);

    UPDATE public.bookings
    SET event_date = v_req.requested_date,
        start_time = v_req.requested_start_time,
        end_time = v_req.requested_end_time,
        hall_id = v_req.requested_hall_id
    WHERE id = v_req.booking_id;

    PERFORM set_config('app.status_change_reason', '', true);
  END IF;

  UPDATE public.reschedule_requests
  SET status = CASE WHEN _approve THEN 'approved'::public.reschedule_status ELSE 'rejected'::public.reschedule_status END,
      admin_note = NULLIF(TRIM(COALESCE(_admin_note,'')), ''),
      reviewed_by = auth.uid(),
      reviewed_at = now()
  WHERE id = _request_id;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    v_req.user_id,
    CASE WHEN _approve THEN 'Reschedule approved' ELSE 'Reschedule declined' END,
    CASE WHEN _approve
      THEN 'Your event "' || v_booking.event_name || '" has been moved to ' || to_char(v_req.requested_date, 'Mon DD, YYYY') || '.'
      ELSE 'Your reschedule request for "' || v_booking.event_name || '" was declined.'
    END || COALESCE(' Note: ' || NULLIF(TRIM(COALESCE(_admin_note,'')), ''), ''),
    CASE WHEN _approve THEN 'success' ELSE 'warning' END,
    '/booking/' || v_req.booking_id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.request_booking_reschedule(uuid, date, time, time, uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.cancel_reschedule_request(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.review_reschedule_request(uuid, boolean, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.request_booking_reschedule(uuid, date, time, time, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_reschedule_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_reschedule_request(uuid, boolean, text) TO authenticated;
