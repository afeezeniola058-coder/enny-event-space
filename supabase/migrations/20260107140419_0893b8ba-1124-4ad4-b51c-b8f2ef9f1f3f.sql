-- Create email_tracking table for storing email engagement events
CREATE TABLE public.email_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL DEFAULT 'booking_notification',
  recipient_email TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'opened', 'clicked')),
  link_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_tracking ENABLE ROW LEVEL SECURITY;

-- Admin can view all tracking data
CREATE POLICY "Admins can view email tracking" 
ON public.email_tracking 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Service role can insert tracking events (for edge functions)
CREATE POLICY "Service role can insert tracking events"
ON public.email_tracking
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_email_tracking_booking_id ON public.email_tracking(booking_id);
CREATE INDEX idx_email_tracking_event_type ON public.email_tracking(event_type);
CREATE INDEX idx_email_tracking_created_at ON public.email_tracking(created_at DESC);