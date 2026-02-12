
-- Create a validation trigger for reviews to prevent XSS and injection attacks
CREATE OR REPLACE FUNCTION public.validate_review_input()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate rating range
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  -- Validate and sanitize comment
  IF NEW.comment IS NOT NULL THEN
    -- Enforce length limit
    IF LENGTH(NEW.comment) > 1000 THEN
      RAISE EXCEPTION 'Comment must be 1000 characters or fewer';
    END IF;
    -- Strip HTML tags to prevent XSS
    NEW.comment := REGEXP_REPLACE(NEW.comment, '<[^>]*>', '', 'g');
    -- Trim whitespace
    NEW.comment := TRIM(NEW.comment);
    IF LENGTH(NEW.comment) = 0 THEN
      RAISE EXCEPTION 'Comment cannot be empty';
    END IF;
  END IF;

  -- Validate and sanitize title
  IF NEW.title IS NOT NULL THEN
    IF LENGTH(NEW.title) > 100 THEN
      RAISE EXCEPTION 'Title must be 100 characters or fewer';
    END IF;
    -- Strip HTML tags
    NEW.title := REGEXP_REPLACE(NEW.title, '<[^>]*>', '', 'g');
    NEW.title := TRIM(NEW.title);
    IF LENGTH(NEW.title) = 0 THEN
      NEW.title := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Apply trigger on INSERT and UPDATE
CREATE TRIGGER validate_review_before_write
BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.validate_review_input();
