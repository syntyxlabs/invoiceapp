-- pg_cron Setup for Automatic Payment Reminders
-- NOTE: This must be run by a database superuser in the Supabase Dashboard SQL Editor
-- pg_cron is only available on paid Supabase plans (Pro and above)

-- Enable pg_cron extension (requires superuser)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests (required for calling Edge Functions)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule reminder processing daily at 9 AM (UTC)
-- Adjust the time based on your users' timezone
SELECT cron.schedule(
  'process-payment-reminders',           -- Job name
  '0 9 * * *',                           -- Cron expression: 9:00 AM UTC daily
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Alternative: More frequent schedule (every 15 minutes)
-- Uncomment if you want more frequent reminder processing
/*
SELECT cron.schedule(
  'process-payment-reminders',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
*/

-- View scheduled jobs
-- SELECT * FROM cron.job;

-- View job run history
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- To unschedule a job:
-- SELECT cron.unschedule('process-payment-reminders');

-- =============================================================================
-- IMPORTANT SETUP STEPS:
-- =============================================================================
-- 1. Replace YOUR_PROJECT_REF with your actual Supabase project reference
--    (e.g., 'abcdefghijklmnop')
--
-- 2. Replace YOUR_SERVICE_ROLE_KEY with your service role key from:
--    Supabase Dashboard > Settings > API > service_role key
--
-- 3. For production, consider using Supabase Vault for secrets:
--    - Store the service role key in Vault
--    - Reference it using: (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
--
-- 4. Deploy the Edge Function first:
--    supabase functions deploy process-reminders
--
-- 5. Set the required environment variables for the Edge Function:
--    - APP_URL: Your app's URL (e.g., https://your-app.vercel.app)
--    - API_SECRET: Optional API secret for authentication
--
-- 6. Test the Edge Function manually before enabling cron:
--    curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-reminders \
--      -H "Authorization: Bearer YOUR_ANON_KEY" \
--      -H "Content-Type: application/json"
-- =============================================================================
