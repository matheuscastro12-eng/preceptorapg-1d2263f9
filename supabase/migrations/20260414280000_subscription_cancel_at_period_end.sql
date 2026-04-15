-- Flag pra cancelamento no fim do periodo (nao cancela ja, so nao renova).
-- Quando TRUE, a assinatura fica ativa ate current_period_end/access_expires_at
-- mas nao sera renovada no proximo ciclo.

ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
