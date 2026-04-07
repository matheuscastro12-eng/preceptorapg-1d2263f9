-- Inadimplencia tracking table (linked to EasyFlow webhook events)
CREATE TABLE IF NOT EXISTS admin_inadimplencias (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email           TEXT NOT NULL,
  nome            TEXT NOT NULL,
  plano           TEXT NOT NULL,
  valor_devido    NUMERIC(12,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'em_cobranca',  -- em_cobranca, resolvido, perdido
  tentativas      INTEGER NOT NULL DEFAULT 0,
  ultimo_evento   TEXT,                                  -- last EasyFlow event type
  data_ocorrencia TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  emails_enviados INTEGER NOT NULL DEFAULT 0,
  ultimo_email_at TIMESTAMPTZ,
  observacoes     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inadimplencias_status ON admin_inadimplencias(status);
CREATE INDEX IF NOT EXISTS idx_inadimplencias_user ON admin_inadimplencias(user_id);

-- RLS
ALTER TABLE admin_inadimplencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access inadimplencias"
  ON admin_inadimplencias FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Allow subscription status 'inadimplente'
-- (subscriptions.status is TEXT, not enum, so no ALTER TYPE needed)

-- Updated_at trigger (using built-in function)
CREATE OR REPLACE FUNCTION update_inadimplencias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_inadimplencias
  BEFORE UPDATE ON admin_inadimplencias
  FOR EACH ROW EXECUTE FUNCTION update_inadimplencias_updated_at();
