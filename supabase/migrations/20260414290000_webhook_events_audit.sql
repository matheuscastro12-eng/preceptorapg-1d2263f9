-- Tabela de auditoria pra webhooks externos (EasyFlow, Stripe futuro).
-- O webhook da EasyFlow ja tentava inserir aqui, mas a tabela nunca
-- existiu — erros iam silenciosos via try/catch vazio.

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_event ON public.webhook_events(provider, event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at DESC);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook_events" ON public.webhook_events
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
