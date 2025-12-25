-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table (separate from profiles to prevent privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can manage roles (using security definer function)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Update handle_new_user function with input validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
BEGIN
  -- Safely extract and validate full_name
  v_full_name := TRIM(COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''));
  
  -- Enforce length limit
  IF LENGTH(v_full_name) > 255 THEN
    v_full_name := LEFT(v_full_name, 255);
  END IF;
  
  -- Insert profile with validated data
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, v_full_name);
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Add admin-only write policies for halls table
CREATE POLICY "Only admins can insert halls"
ON public.halls FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update halls"
ON public.halls FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete halls"
ON public.halls FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin-only write policies for catering_packages table
CREATE POLICY "Only admins can insert catering_packages"
ON public.catering_packages FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update catering_packages"
ON public.catering_packages FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete catering_packages"
ON public.catering_packages FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin-only write policies for decoration_packages table
CREATE POLICY "Only admins can insert decoration_packages"
ON public.decoration_packages FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update decoration_packages"
ON public.decoration_packages FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete decoration_packages"
ON public.decoration_packages FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));