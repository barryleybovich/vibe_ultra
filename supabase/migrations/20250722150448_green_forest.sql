/*
  # Setup Daily Workout Email Cron Job

  1. Cron Job Configuration
    - Creates a pg_cron job that runs daily at 5:00 AM UTC
    - Calls the send-daily-workout-email Edge function via HTTP request
    - Uses the service role key for authentication

  2. Security
    - Uses Supabase's internal service role for authentication
    - Scheduled job runs with appropriate permissions

  3. Monitoring
    - Job execution can be monitored via pg_cron.job_run_details table
*/

-- Create the cron job to send daily workout emails at 5:00 AM UTC
SELECT cron.schedule(
  'send-daily-workout-emails',
  '0 5 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://qtnqndckdxizhykquxpw.supabase.co/functions/v1/send-daily-workout-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('source', 'pg_cron')
    );
  $$
);

-- Verify the job was created
SELECT * FROM cron.job WHERE jobname = 'send-daily-workout-emails';