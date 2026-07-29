GRANT SELECT ON public.past_events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.past_events TO authenticated;
GRANT ALL ON public.past_events TO service_role;