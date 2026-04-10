-- Remove notifications from realtime publication to prevent cross-user data leakage
ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;

-- Email reminders: allow users to see reminders for their own bookings
CREATE POLICY "Users can view their own booking reminders"
ON public.email_reminders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = email_reminders.booking_id
    AND bookings.user_id = auth.uid()
  )
);

-- Email reminders: allow service role to delete old records
CREATE POLICY "Service role can delete email reminders"
ON public.email_reminders
FOR DELETE
USING (auth.role() = 'service_role');

-- Email tracking: allow service role to delete old records
CREATE POLICY "Service role can delete email tracking"
ON public.email_tracking
FOR DELETE
USING (auth.role() = 'service_role');