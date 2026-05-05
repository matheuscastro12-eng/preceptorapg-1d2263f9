-- pg_cron diário pra disparar email matinal do cronograma + manutenção streaks.
-- Roda 10h UTC = 7h BRT (America/Sao_Paulo, sem horário de verão atualmente).

-- Garante extensões (idempotente)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove job se já existir (idempotente)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'study-plan-daily-email') THEN
    PERFORM cron.unschedule('study-plan-daily-email');
  END IF;
END $$;

-- Agenda: 10:00 UTC todos os dias (= 07:00 BRT)
SELECT cron.schedule(
  'study-plan-daily-email',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/study-plan-daily-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('source', 'pg_cron')
  ) AS request_id;
  $$
);

COMMENT ON EXTENSION pg_cron IS 'Cron diário do cronograma de estudo (07h BRT) — envia email matinal e roda fn_streak_daily_check';
