-- Create table to track sent reminders
CREATE TABLE public.email_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('one_week', 'one_day')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booking_id, reminder_type)
);

-- Enable RLS
ALTER TABLE public.email_reminders ENABLE ROW LEVEL SECURITY;

-- Allow admins to view reminders
CREATE POLICY "Admins can view email reminders"
  ON public.email_reminders
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role to insert (for edge function)
CREATE POLICY "Service role can insert reminders"
  ON public.email_reminders
  FOR INSERT
  WITH CHECK (true);

-- Create index for efficient queries
CREATE INDEX idx_email_reminders_booking_id ON public.email_reminders(booking_id);
CREATE INDEX idx_email_reminders_reminder_type ON public.email_reminders(reminder_type);