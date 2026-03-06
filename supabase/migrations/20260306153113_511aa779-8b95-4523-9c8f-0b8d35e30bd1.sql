
CREATE OR REPLACE FUNCTION public.validate_booking_input()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Sanitize and validate event_name
  IF NEW.event_name IS NOT NULL THEN
    -- Strip HTML tags
    NEW.event_name := REGEXP_REPLACE(NEW.event_name, '<[^>]*>', '', 'g');
    NEW.event_name := TRIM(NEW.event_name);
    IF LENGTH(NEW.event_name) > 200 THEN
      RAISE EXCEPTION 'Event name must be 200 characters or fewer';
    END IF;
    IF LENGTH(NEW.event_name) = 0 THEN
      RAISE EXCEPTION 'Event name cannot be empty';
    END IF;
  END IF;

  -- Sanitize and validate notes
  IF NEW.notes IS NOT NULL THEN
    NEW.notes := REGEXP_REPLACE(NEW.notes, '<[^>]*>', '', 'g');
    NEW.notes := TRIM(NEW.notes);
    IF LENGTH(NEW.notes) > 2000 THEN
      RAISE EXCEPTION 'Notes must be 2000 characters or fewer';
    END IF;
    IF LENGTH(NEW.notes) = 0 THEN
      NEW.notes := NULL;
    END IF;
  END IF;

  -- Validate guest_count
  IF NEW.guest_count IS NOT NULL AND NEW.guest_count < 1 THEN
    RAISE EXCEPTION 'Guest count must be at least 1';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_booking_before_write
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.validate_booking_input();
