CREATE OR REPLACE FUNCTION public.validate_user_role_modification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow privileged/system contexts (signup trigger runs as supabase_auth_admin)
  IF current_setting('role', true) = 'service_role'
     OR current_user IN ('service_role', 'supabase_auth_admin', 'supabase_admin', 'postgres')
     OR session_user IN ('supabase_auth_admin', 'supabase_admin', 'postgres')
     OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can modify user roles';
  END IF;

  IF NEW.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Administrators cannot modify their own roles';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_user_role_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('role', true) = 'service_role'
     OR current_user IN ('service_role', 'supabase_auth_admin', 'supabase_admin', 'postgres')
     OR session_user IN ('supabase_auth_admin', 'supabase_admin', 'postgres') THEN
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
$function$;