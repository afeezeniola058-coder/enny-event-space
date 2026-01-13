-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create a cron job to send event reminders daily at 9 AM UTC
SELECT cron.schedule(
  'send-event-reminders-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://izqdyzqkglcmyzmfsrmt.supabase.co/functions/v1/send-event-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);