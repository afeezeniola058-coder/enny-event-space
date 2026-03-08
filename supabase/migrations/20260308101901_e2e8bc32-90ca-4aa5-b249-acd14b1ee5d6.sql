
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can insert notifications
CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create trigger function to auto-generate notifications on booking changes
CREATE OR REPLACE FUNCTION public.notify_booking_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_type TEXT;
BEGIN
  -- Only trigger on status or payment_status changes
  IF TG_OP = 'INSERT' THEN
    v_title := 'Booking Created';
    v_message := 'Your booking "' || NEW.event_name || '" has been created and is pending confirmation.';
    v_type := 'booking';
    
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (NEW.user_id, v_title, v_message, v_type, '/booking/' || NEW.id);
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Status change
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      CASE NEW.status
        WHEN 'confirmed' THEN
          v_title := 'Booking Confirmed';
          v_message := 'Your booking "' || NEW.event_name || '" has been confirmed!';
          v_type := 'success';
        WHEN 'cancelled' THEN
          v_title := 'Booking Cancelled';
          v_message := 'Your booking "' || NEW.event_name || '" has been cancelled.';
          v_type := 'warning';
        WHEN 'completed' THEN
          v_title := 'Event Completed';
          v_message := 'Your event "' || NEW.event_name || '" is now marked as completed. We hope you had a great time!';
          v_type := 'success';
        ELSE
          v_title := 'Booking Updated';
          v_message := 'Your booking "' || NEW.event_name || '" status has been updated.';
          v_type := 'info';
      END CASE;
      
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (NEW.user_id, v_title, v_message, v_type, '/booking/' || NEW.id);
    END IF;
    
    -- Payment status change
    IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
      IF NEW.payment_status = 'paid' THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (NEW.user_id, 'Payment Received', 'Payment for "' || NEW.event_name || '" has been confirmed.', 'success', '/booking/' || NEW.id);
      ELSIF NEW.payment_status = 'refunded' THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (NEW.user_id, 'Refund Processed', 'A refund for "' || NEW.event_name || '" has been processed.', 'info', '/booking/' || NEW.id);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attach trigger to bookings table
CREATE TRIGGER notify_on_booking_change
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_booking_change();
