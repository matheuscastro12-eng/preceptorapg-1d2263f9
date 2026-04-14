-- ============================================================
-- Admins precisam ler generation_logs pra alimentar o painel
-- "Metricas da Plataforma" em /admin/crm-mkt/usuarios.
-- RLS original so permite ao dono do log ver; service account
-- do CRM retornava zero linhas.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'generation_logs'
      AND policyname = 'Admins can view all generation logs'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can view all generation logs"
        ON public.generation_logs FOR SELECT
        USING (public.has_role(auth.uid(), 'admin'))
    $policy$;
  END IF;
END $$;
