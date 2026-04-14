-- Cria contas CRM Admin-Marketing para a equipe (Leonardo e Kalley).
-- Senhas temporarias (devem trocar no primeiro login).
-- Idempotente: nao re-cria se username ja existir.

-- Garante pgcrypto (a funcao update_crm_password usa gen_salt/crypt)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Expoe extensions no search_path caso a function original nao tenha schema-qualified
SET search_path = public, extensions;

DO $$
DECLARE
  v_leonardo_id UUID;
  v_kalley_id UUID;
BEGIN
  -- Leonardo
  IF NOT EXISTS (SELECT 1 FROM public.admin_crm_users WHERE username = 'leonardo') THEN
    INSERT INTO public.admin_crm_users (
      username, password_hash, nome, email, role,
      acesso_marketing, acesso_admin, ativo
    ) VALUES (
      'leonardo', '', 'Leonardo', 'leonardo@ospreceptores.com', 'admin',
      TRUE, TRUE, TRUE
    ) RETURNING id INTO v_leonardo_id;

    PERFORM public.update_crm_password(v_leonardo_id, 'Preceptor@2026');
  END IF;

  -- Kalley
  IF NOT EXISTS (SELECT 1 FROM public.admin_crm_users WHERE username = 'kalley') THEN
    INSERT INTO public.admin_crm_users (
      username, password_hash, nome, email, role,
      acesso_marketing, acesso_admin, ativo
    ) VALUES (
      'kalley', '', 'Kalley', 'kalley@ospreceptores.com', 'admin',
      TRUE, TRUE, TRUE
    ) RETURNING id INTO v_kalley_id;

    PERFORM public.update_crm_password(v_kalley_id, 'Preceptor@2026');
  END IF;
END $$;
