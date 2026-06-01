-- pg_cron diário pra disparar o relatório de Meta Ads (8h BRT = 11h UTC).
-- Mesmo padrão do study-plan-daily-email.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'meta-ads-daily') THEN
    PERFORM cron.unschedule('meta-ads-daily');
  END IF;
END $$;

SELECT cron.schedule(
  'meta-ads-daily',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/meta-ads-daily',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('source', 'pg_cron')
  ) AS request_id;
  $$
);
