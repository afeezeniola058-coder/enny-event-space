
-- Defense-in-depth trigger: prevent role escalation via any indirect code path
CREATE OR REPLACE FUNCTION public.validate_user_role_modification()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  -- Allow service_role (used by triggers like handle_new_user)
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- For authenticated users, verify they are an admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can modify user roles';
  END IF;

  -- Prevent admins from modifying their own role (self-escalation/de-escalation protection)
  IF NEW.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Administrators cannot modify their own roles';
  END IF;

  RETURN NEW;
END;
$$;

-- Apply trigger on INSERT and UPDATE
CREATE TRIGGER validate_user_role_change
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_role_modification();

-- Also protect DELETE
CREATE OR REPLACE FUNCTION public.validate_user_role_deletion()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' THEN
    RETURN OLD;
  END IF;

  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can delete user roles';
  END IF;

  IF OLD.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Administrators cannot remove their own roles';
  END IF;

  RETURN OLD;
END;
$$;

CREATE TRIGGER validate_user_role_delete
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_role_deletion();
