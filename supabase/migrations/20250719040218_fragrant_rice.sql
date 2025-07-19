/*
  # Setup Daily Email Cron Job

  1. Extensions
    - Enable pg_cron extension for scheduled jobs
  
  2. Cron Job
    - Schedule daily workout emails at 6:00 AM UTC
    - Calls the send-daily-workout-email edge function
  
  3. Security
    - Grant necessary permissions for cron job execution
*/

-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to send daily workout emails at 6:00 AM UTC
-- This translates to different local times depending on timezone
-- 6:00 AM UTC = 1:00 AM EST / 11:00 PM PST (previous day)
-- You may want to adjust this based on your users' primary timezone
SELECT cron.schedule(
  'daily-workout-emails',
  '0 6 * * *', -- Every day at 6:00 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://qtnqndckdxizhykquxpw.supabase.co/functions/v1/send-daily-workout-email',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;