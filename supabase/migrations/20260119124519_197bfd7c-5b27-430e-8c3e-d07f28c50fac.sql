
-- Fix RLS Security Issues

-- 1. Drop the overly permissive INSERT policies that use "true"
DROP POLICY IF EXISTS "Service role can insert tracking events" ON public.email_tracking;
DROP POLICY IF EXISTS "Service role can insert reminders" ON public.email_reminders;

-- 2. Create more restrictive INSERT policies that check for service role context
-- For email_tracking: Only allow inserts from authenticated service context or edge functions
CREATE POLICY "Only service role can insert email tracking"
ON public.email_tracking
FOR INSERT
WITH CHECK (
  -- This will only succeed when called from edge functions with service role
  auth.role() = 'service_role'
);

-- For email_reminders: Only allow inserts from service role
CREATE POLICY "Only service role can insert email reminders"
ON public.email_reminders
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
);

-- 3. Add explicit denial for anonymous users on profiles table
-- Drop existing policies and recreate with stricter conditions
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate with explicit authenticated user checks
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 4. Strengthen bookings policies with explicit auth checks
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;

CREATE POLICY "Users can view their own bookings"
ON public.bookings
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
ON public.bookings
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
ON public.bookings
FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all bookings"
ON public.bookings
FOR UPDATE
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'));

-- 5. Strengthen user_roles policies with explicit auth checks
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can assign roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can revoke roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can assign roles"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can revoke roles"
ON public.user_roles
FOR DELETE
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'));

-- 6. Add UPDATE policy restriction for user_roles (prevent role escalation)
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'));

-- 7. Strengthen email_tracking SELECT policy
DROP POLICY IF EXISTS "Admins can view email tracking" ON public.email_tracking;

CREATE POLICY "Admins can view email tracking"
ON public.email_tracking
FOR SELECT
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'));

-- 8. Strengthen email_reminders SELECT policy
DROP POLICY IF EXISTS "Admins can view email reminders" ON public.email_reminders;

CREATE POLICY "Admins can view email reminders"
ON public.email_reminders
FOR SELECT
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'));
