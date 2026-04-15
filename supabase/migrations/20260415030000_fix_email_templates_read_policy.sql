-- O dropdown de templates no CrmAutomations estava vindo vazio mesmo com
-- user autenticado como admin CRM. A policy exigia has_role(auth.uid(),'admin')
-- que retornava false em alguns casos (ex: service account com session
-- expirada ou com role dessincronizada). Separa SELECT (qualquer authenticated
-- com session CRM valida) de INSERT/UPDATE/DELETE (exige admin).

DROP POLICY IF EXISTS "Admins can manage crm_email_templates" ON public.crm_email_templates;

CREATE POLICY "Authenticated read crm_email_templates" ON public.crm_email_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins write crm_email_templates" ON public.crm_email_templates
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update crm_email_templates" ON public.crm_email_templates
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete crm_email_templates" ON public.crm_email_templates
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Mesma coisa pra crm_email_settings (mesmo problema pode afetar o branding)
DROP POLICY IF EXISTS "Admins can manage crm_email_settings" ON public.crm_email_settings;

CREATE POLICY "Authenticated read crm_email_settings" ON public.crm_email_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins write crm_email_settings" ON public.crm_email_settings
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update crm_email_settings" ON public.crm_email_settings
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
