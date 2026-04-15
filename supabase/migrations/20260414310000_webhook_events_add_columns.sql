-- A tabela webhook_events ja existia com schema antigo. Adiciona colunas
-- que a migration anterior (com CREATE TABLE IF NOT EXISTS) nao criou.

ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT TRUE;

ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS error_message TEXT;

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_event
  ON public.webhook_events(provider, event_type);

CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at
  ON public.webhook_events(created_at DESC);
