-- Leonardo e Kalley so precisam de acesso ao CRM Marketing.
-- Remove acesso_admin (financeiro/DRE/metas/inadimplencia).

UPDATE public.admin_crm_users
SET acesso_admin = FALSE
WHERE username IN ('leonardo', 'kalley');
