-- Flag por template: envia automaticamente (cron/trigger) ou so manual
-- (admin aperta Enviar). Default FALSE pra manter comportamento atual
-- (nenhum envio automatico sem o admin pedir).

ALTER TABLE public.crm_email_templates
  ADD COLUMN IF NOT EXISTS auto_send BOOLEAN NOT NULL DEFAULT FALSE;
