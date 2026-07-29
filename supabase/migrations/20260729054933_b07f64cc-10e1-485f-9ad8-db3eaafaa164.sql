DROP POLICY IF EXISTS "Anyone can view published past events" ON public.past_events;
CREATE POLICY "Anyone can view published past events" ON public.past_events FOR SELECT TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "Admins can view all past events" ON public.past_events;
CREATE POLICY "Admins can view all past events" ON public.past_events FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert past events" ON public.past_events;
CREATE POLICY "Admins can insert past events" ON public.past_events FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update past events" ON public.past_events;
CREATE POLICY "Admins can update past events" ON public.past_events FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete past events" ON public.past_events;
CREATE POLICY "Admins can delete past events" ON public.past_events FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));