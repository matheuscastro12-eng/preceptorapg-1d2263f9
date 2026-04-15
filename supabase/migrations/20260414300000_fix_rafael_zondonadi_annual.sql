-- Fix pontual: rafaelzondonadi@gmail.com pagou plano anual mas nao foi
-- ativado porque o webhook da EasyFlow falhou silenciosamente (tabela
-- webhook_events ainda nao existia — erro engolido no try/catch vazio).
-- Ativa a assinatura manualmente + marca como subscriber no CRM.

DO $$
DECLARE
  v_user_id UUID;
  v_has_sub BOOLEAN;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = 'rafaelzondonadi@gmail.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Usuario nao encontrado em auth.users';
    RETURN;
  END IF;

  RAISE NOTICE 'Usuario encontrado: %', v_user_id;

  -- Ativar assinatura (upsert)
  SELECT EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id = v_user_id) INTO v_has_sub;

  IF v_has_sub THEN
    UPDATE public.subscriptions
    SET status = 'active',
        plan_type = 'annual',
        access_expires_at = NULL,
        cancel_at_period_end = FALSE,
        canceled_at = NULL,
        updated_at = NOW()
    WHERE user_id = v_user_id;
    RAISE NOTICE 'Subscription UPDATE: status=active, plan=annual';
  ELSE
    INSERT INTO public.subscriptions (user_id, status, plan_type, access_expires_at)
    VALUES (v_user_id, 'active', 'annual', NULL);
    RAISE NOTICE 'Subscription INSERT: status=active, plan=annual';
  END IF;

  -- Atualizar status no CRM (se o lead existir)
  UPDATE public.crm_leads
  SET status = 'subscriber',
      converted_at = NOW(),
      updated_at = NOW()
  WHERE user_id = v_user_id;

  -- Resolver qualquer inadimplencia aberta
  UPDATE public.admin_inadimplencias
  SET status = 'resolvido', updated_at = NOW()
  WHERE user_id = v_user_id AND status = 'em_cobranca';
END $$;
