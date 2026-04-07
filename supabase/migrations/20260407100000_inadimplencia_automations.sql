-- Add inadimplencia triggers to automation_trigger enum
ALTER TYPE automation_trigger ADD VALUE IF NOT EXISTS 'inadimplencia_d1';
ALTER TYPE automation_trigger ADD VALUE IF NOT EXISTS 'inadimplencia_d5';
ALTER TYPE automation_trigger ADD VALUE IF NOT EXISTS 'inadimplencia_d10';

-- NOTE: pg_cron scheduling must be configured via Supabase Dashboard:
-- 1. Go to Database > Extensions > Enable pg_cron and pg_net
-- 2. Go to Database > Cron Jobs > New Cron Job:
--    Name: inadimplencia-daily-check
--    Schedule: 0 10 * * * (daily at 10:00 UTC / 07:00 BRT)
--    Command: SELECT net.http_post(
--      url := 'https://qnyxluevbogwwtwtbpuu.supabase.co/functions/v1/inadimplencia-cron',
--      headers := '{"Content-Type":"application/json","Authorization":"Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
--      body := '{}'::jsonb
--    );
