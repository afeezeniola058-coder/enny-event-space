CREATE OR REPLACE FUNCTION public.get_hall_availability(_hall_id uuid)
RETURNS TABLE(event_date date, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.event_date,
         CASE WHEN b.status IN ('confirmed','completed') THEN 'confirmed' ELSE 'pending' END AS status
  FROM public.bookings b
  WHERE b.hall_id = _hall_id
    AND b.status <> 'cancelled'
  GROUP BY b.event_date, 2
$$;

CREATE OR REPLACE FUNCTION public.get_hall_availability_for_date(_event_date date)
RETURNS TABLE(hall_id uuid, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.hall_id,
         CASE WHEN bool_or(b.status IN ('confirmed','completed')) THEN 'confirmed' ELSE 'pending' END AS status
  FROM public.bookings b
  WHERE b.event_date = _event_date
    AND b.status <> 'cancelled'
    AND b.hall_id IS NOT NULL
  GROUP BY b.hall_id
$$;

REVOKE ALL ON FUNCTION public.get_hall_availability(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_hall_availability_for_date(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_hall_availability(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_hall_availability_for_date(date) TO anon, authenticated, service_role;