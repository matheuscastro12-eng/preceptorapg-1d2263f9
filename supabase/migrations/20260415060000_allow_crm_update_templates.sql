-- Relaxa UPDATE em crm_email_templates pra qualquer authenticated.
-- Motivo: todos os usuarios CRM logam atraves de um unico service account
-- (crm-service@thepreceptor.com.br) via crm-auth. Se conseguiram autenticar,
-- passaram pelo verify_crm_login — autorizacao ja foi feita nessa etapa.
-- A policy anterior exigia has_role(auth.uid(),'admin') que falhava em
-- casos de session expirada/dessincronizada, causando update silencioso
-- com 0 rows afetadas (Thiago salvou e nao persistiu).

DROP POLICY IF EXISTS "Admins update crm_email_templates" ON public.crm_email_templates;
DROP POLICY IF EXISTS "Admins write crm_email_templates" ON public.crm_email_templates;
DROP POLICY IF EXISTS "Admins delete crm_email_templates" ON public.crm_email_templates;

CREATE POLICY "Authenticated write crm_email_templates" ON public.crm_email_templates
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update crm_email_templates" ON public.crm_email_templates
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated delete crm_email_templates" ON public.crm_email_templates
  FOR DELETE TO authenticated USING (true);

-- Mesma logica pro settings
DROP POLICY IF EXISTS "Admins update crm_email_settings" ON public.crm_email_settings;
DROP POLICY IF EXISTS "Admins write crm_email_settings" ON public.crm_email_settings;

CREATE POLICY "Authenticated write crm_email_settings" ON public.crm_email_settings
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update crm_email_settings" ON public.crm_email_settings
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
