CREATE TABLE public.hall_availability (
  hall_id uuid NOT NULL,
  event_date date NOT NULL,
  status text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (hall_id, event_date)
);

GRANT SELECT ON public.hall_availability TO anon, authenticated;
GRANT ALL ON public.hall_availability TO service_role;

ALTER TABLE public.hall_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hall availability is publicly readable"
ON public.hall_availability FOR SELECT
TO anon, authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.sync_hall_availability(_hall_id uuid, _event_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_status text;
BEGIN
  IF _hall_id IS NULL OR _event_date IS NULL THEN
    RETURN;
  END IF;

  SELECT CASE WHEN bool_or(b.status IN ('confirmed','completed')) THEN 'confirmed' ELSE 'pending' END
    INTO v_status
  FROM public.bookings b
  WHERE b.hall_id = _hall_id
    AND b.event_date = _event_date
    AND b.status <> 'cancelled';

  IF v_status IS NULL THEN
    DELETE FROM public.hall_availability
    WHERE hall_id = _hall_id AND event_date = _event_date;
  ELSE
    INSERT INTO public.hall_availability (hall_id, event_date, status)
    VALUES (_hall_id, _event_date, v_status)
    ON CONFLICT (hall_id, event_date)
    DO UPDATE SET status = EXCLUDED.status, updated_at = now();
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_hall_availability(uuid, date) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.bookings_sync_hall_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP IN ('UPDATE','DELETE') THEN
    PERFORM public.sync_hall_availability(OLD.hall_id, OLD.event_date);
  END IF;
  IF TG_OP IN ('INSERT','UPDATE') THEN
    PERFORM public.sync_hall_availability(NEW.hall_id, NEW.event_date);
  END IF;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.bookings_sync_hall_availability() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_bookings_sync_hall_availability ON public.bookings;
CREATE TRIGGER trg_bookings_sync_hall_availability
AFTER INSERT OR UPDATE OR DELETE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.bookings_sync_hall_availability();

INSERT INTO public.hall_availability (hall_id, event_date, status)
SELECT b.hall_id, b.event_date,
       CASE WHEN bool_or(b.status IN ('confirmed','completed')) THEN 'confirmed' ELSE 'pending' END
FROM public.bookings b
WHERE b.hall_id IS NOT NULL AND b.status <> 'cancelled'
GROUP BY b.hall_id, b.event_date
ON CONFLICT (hall_id, event_date) DO UPDATE SET status = EXCLUDED.status;

DROP FUNCTION IF EXISTS public.get_hall_availability(uuid);
DROP FUNCTION IF EXISTS public.get_hall_availability_for_date(date);