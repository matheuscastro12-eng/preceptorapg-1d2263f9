-- Backfill lead_id nas automations antigas que foram criadas sem essa FK.
-- Health-score rodava sem passar lead_id, entao o join crm_leads!lead_id
-- na query da pagina Automacoes retornava null pra todas as rows antigas.

UPDATE public.crm_automations_log al
SET lead_id = cl.id
FROM public.crm_leads cl
WHERE al.lead_id IS NULL
  AND al.user_id IS NOT NULL
  AND cl.user_id = al.user_id;
