-- Padroniza role = 'super_admin' pra todos os usuarios CRM e ajusta
-- acesso_marketing/acesso_admin conforme combinado:
--   - Matheus (owner): ambos
--   - Thiago, Leonardo, Marco: so marketing
--   - Kalley: so marketing (mantem configuracao anterior)
--   - Ana Flavia: so admin (cria se nao existir com senha temporaria)

-- Passo 1: todos como super_admin
UPDATE public.admin_crm_users SET role = 'super_admin';

-- Passo 2: Ana Flavia — criar se nao existir
DO $$
DECLARE v_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_crm_users
    WHERE username ILIKE 'ana%flavia%' OR username = 'ana' OR username = 'anaflavia'
  ) THEN
    INSERT INTO public.admin_crm_users (
      username, password_hash, nome, email, role,
      acesso_marketing, acesso_admin, ativo
    ) VALUES (
      'anaflavia', '', 'Ana Flavia', 'anaflavia@ospreceptores.com', 'super_admin',
      FALSE, TRUE, TRUE
    ) RETURNING id INTO v_id;

    -- Senha temporaria via RPC (requer pgcrypto via extensions schema)
    PERFORM public.update_crm_password(v_id, 'Preceptor@2026');
    RAISE NOTICE 'Ana Flavia CRIADA com senha temporaria Preceptor@2026';
  ELSE
    RAISE NOTICE 'Ana Flavia ja existe — apenas ajustando acessos';
  END IF;
END $$;

-- Passo 3: ajusta flags de acesso conforme definicao do owner
-- Thiago, Leonardo, Marco, Kalley: so marketing
UPDATE public.admin_crm_users
SET acesso_marketing = TRUE, acesso_admin = FALSE
WHERE lower(username) IN ('thiago', 'leonardo', 'leo', 'marco', 'kalley');

-- Ana Flavia: so admin
UPDATE public.admin_crm_users
SET acesso_marketing = FALSE, acesso_admin = TRUE
WHERE lower(username) ILIKE 'ana%flavia%' OR lower(username) IN ('ana', 'anaflavia');

-- Matheus (owner) e crm-service: ambos
UPDATE public.admin_crm_users
SET acesso_marketing = TRUE, acesso_admin = TRUE
WHERE lower(username) IN ('matheus', 'mcastro', 'preceptormed', 'owner', 'admin')
   OR lower(email) ILIKE '%castroomath7%'
   OR lower(email) ILIKE 'matheus@ospreceptores%';

-- Report final
DO $$
DECLARE r RECORD;
BEGIN
  RAISE NOTICE '--- Estado final dos usuarios CRM ---';
  FOR r IN
    SELECT username, email, role, acesso_marketing, acesso_admin, ativo
    FROM public.admin_crm_users ORDER BY username
  LOOP
    RAISE NOTICE 'username=% email=% role=% mkt=% adm=% ativo=%',
      r.username, r.email, r.role, r.acesso_marketing, r.acesso_admin, r.ativo;
  END LOOP;
END $$;
