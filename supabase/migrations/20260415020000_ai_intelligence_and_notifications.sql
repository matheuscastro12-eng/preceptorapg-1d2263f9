-- Feature 4: Revenue Intelligence AI — tabela de cache pra analises do Gemini
CREATE TABLE IF NOT EXISTS public.revenue_intelligence_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  data_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_intel_created ON public.revenue_intelligence_cache(created_at DESC);

ALTER TABLE public.revenue_intelligence_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read revenue intelligence" ON public.revenue_intelligence_cache
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Feature 5: Notificacoes in-app — tabela + policies
CREATE TABLE IF NOT EXISTS public.crm_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,                 -- 'new_subscriber', 'churn', 'inadimplencia', 'feedback', 'system'
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'info',       -- 'info', 'success', 'warning', 'error'
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_crm_notifications_read ON public.crm_notifications(read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_notifications_type ON public.crm_notifications(type);

ALTER TABLE public.crm_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage crm_notifications" ON public.crm_notifications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Habilita realtime pra o sino atualizar instantaneamente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'crm_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_notifications;
  END IF;
END $$;

-- Trigger: cria notificacao quando subscription muda pra active (nova assinatura)
CREATE OR REPLACE FUNCTION public.fn_notify_new_subscriber()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    INSERT INTO public.crm_notifications (type, title, description, severity, metadata)
    VALUES (
      'new_subscriber',
      'Nova assinatura ativa',
      COALESCE(NEW.plan_type, 'plano') || ' ativado',
      'success',
      jsonb_build_object('user_id', NEW.user_id, 'plan_type', NEW.plan_type)
    );
  ELSIF OLD.status = 'active' AND NEW.status = 'inactive' THEN
    INSERT INTO public.crm_notifications (type, title, description, severity, metadata)
    VALUES (
      'churn',
      'Cancelamento de assinatura',
      COALESCE(OLD.plan_type, 'plano') || ' cancelado',
      'error',
      jsonb_build_object('user_id', NEW.user_id, 'plan_type', OLD.plan_type)
    );
  ELSIF NEW.status = 'inadimplente' AND (OLD.status IS NULL OR OLD.status != 'inadimplente') THEN
    INSERT INTO public.crm_notifications (type, title, description, severity, metadata)
    VALUES (
      'inadimplencia',
      'Assinante inadimplente',
      'Pagamento falhou — entrar em cobranca',
      'warning',
      jsonb_build_object('user_id', NEW.user_id, 'plan_type', NEW.plan_type)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_subscription_changes ON public.subscriptions;
CREATE TRIGGER trg_notify_subscription_changes
AFTER UPDATE OR INSERT ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.fn_notify_new_subscriber();
