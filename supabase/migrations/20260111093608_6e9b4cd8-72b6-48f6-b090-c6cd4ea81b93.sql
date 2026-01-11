-- Create a unique index to prevent double-booking the same hall on the same date
-- Only applies to non-cancelled bookings
CREATE UNIQUE INDEX idx_unique_hall_date ON public.bookings (hall_id, event_date)
WHERE hall_id IS NOT NULL AND status != 'cancelled';