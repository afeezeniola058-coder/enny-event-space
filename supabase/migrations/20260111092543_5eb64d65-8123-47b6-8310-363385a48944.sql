-- Add policies for admins to manage user roles
-- Only admins can view all user roles (needed for admin management)
CREATE POLICY "Admins can view all user roles"
ON public.user_roles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can assign new roles
CREATE POLICY "Admins can assign roles"
ON public.user_roles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can revoke roles
CREATE POLICY "Admins can revoke roles"
ON public.user_roles FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));