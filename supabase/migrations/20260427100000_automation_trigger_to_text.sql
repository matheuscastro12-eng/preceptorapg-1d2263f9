-- Converte o enum automation_trigger em TEXT pra permitir triggers livres.
--
-- Contexto: crm_email_templates.trigger_name ja eh TEXT (admin pode criar
-- qualquer identificador de template via UI). Mas crm_automations_log.
-- trigger_name e crm_funnel_events.trigger_type continuavam como ENUM
-- estrito. Quando o engine de automacao tentava logar uma automacao
-- ligada a um trigger custom (ex: "teste_automacao"), o INSERT/UPDATE
-- estourava com:
--
--   invalid input value for enum automation_trigger: "teste_automacao"
--
-- Fix: ALTER ... TYPE text. Conversao eh segura via cast (cada label do
-- enum ja eh uma string valida). DROP TYPE remove o enum agora orfao.

-- 1) Drop temporario da view que depende da coluna
DROP VIEW IF EXISTS public.crm_automations_performance;

-- 2) crm_automations_log
ALTER TABLE public.crm_automations_log
  ALTER COLUMN trigger_name TYPE text
  USING trigger_name::text;

-- 3) crm_funnel_events
ALTER TABLE public.crm_funnel_events
  ALTER COLUMN trigger_type TYPE text
  USING trigger_type::text;

-- 4) Recria a view (mesma definicao, agora trigger_name eh TEXT)
CREATE OR REPLACE VIEW public.crm_automations_performance AS
SELECT
  trigger_name, automation_type, produto,
  COUNT(*) AS total_sent,
  COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
  COUNT(*) FILTER (WHERE status = 'opened')    AS opened,
  COUNT(*) FILTER (WHERE status = 'clicked')   AS clicked,
  COUNT(*) FILTER (WHERE status = 'failed')    AS failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE opened_at IS NOT NULL) /
    NULLIF(COUNT(*) FILTER (WHERE delivered_at IS NOT NULL), 0), 1) AS open_rate_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) /
    NULLIF(COUNT(*) FILTER (WHERE opened_at IS NOT NULL), 0), 1) AS click_rate_pct
FROM public.crm_automations_log
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY trigger_name, automation_type, produto
ORDER BY total_sent DESC;

-- 5) Drop do enum (so funciona se nenhuma outra coluna ainda usa)
DROP TYPE IF EXISTS automation_trigger;

-- Indice em trigger_name pra facilitar joins com crm_email_templates
CREATE INDEX IF NOT EXISTS idx_automations_log_trigger_name
  ON public.crm_automations_log (trigger_name);

COMMENT ON COLUMN public.crm_automations_log.trigger_name IS
  'Identificador do trigger (TEXT). Bate com crm_email_templates.trigger_name. '
  'Antes era enum automation_trigger — convertido pra TEXT em 27/abr/2026.';

COMMENT ON COLUMN public.crm_funnel_events.trigger_type IS
  'Identificador do trigger (TEXT). Antes era enum automation_trigger — convertido pra TEXT.';
