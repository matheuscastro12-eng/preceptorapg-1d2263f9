-- ============================================================
-- Garantir que admins consigam ler crm_page_views para alimentar
-- a pagina /admin/crm-mkt/analytics.
--
-- O Thiago (e outros users CRM sem role admin direto no Supabase Auth)
-- usava o import errado (@/integrations/supabase/client) que ja foi
-- trocado pra @/lib/crm/supabase no frontend. Essa migration e
-- defensiva — cobre o caso de RLS existir sem policy admin.
-- ============================================================

-- Idempotente: so cria se nao existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'crm_page_views'
      AND policyname = 'Admins can view all page views'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can view all page views"
        ON public.crm_page_views FOR SELECT
        USING (public.has_role(auth.uid(), 'admin'))
    $policy$;
  END IF;
END $$;
