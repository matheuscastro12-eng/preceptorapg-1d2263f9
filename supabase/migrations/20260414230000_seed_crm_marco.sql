-- Cria conta CRM Marketing para Marco.
-- Acesso: so marketing (sem admin/financeiro).
-- Senha temporaria (deve trocar no primeiro login).

SET search_path = public, extensions;

DO $$
DECLARE
  v_marco_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_crm_users WHERE username = 'marco') THEN
    INSERT INTO public.admin_crm_users (
      username, password_hash, nome, email, role,
      acesso_marketing, acesso_admin, ativo
    ) VALUES (
      'marco', '', 'Marco', 'marco@ospreceptores.com', 'admin',
      TRUE, FALSE, TRUE
    ) RETURNING id INTO v_marco_id;

    PERFORM public.update_crm_password(v_marco_id, 'Preceptor@2026');
  END IF;
END $$;
