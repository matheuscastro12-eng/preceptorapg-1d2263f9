-- Diagnostico + fix: garantir que o lead do Rafael no CRM reflita
-- o pagamento. Backfill anterior so fez UPDATE, e se nao havia row
-- em crm_leads, afetava 0 linhas silenciosamente.

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_name TEXT;
  v_sub RECORD;
  v_lead RECORD;
BEGIN
  SELECT id, email INTO v_user_id, v_email
  FROM auth.users
  WHERE lower(email) = 'rafaelzondonadi@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'user nao encontrado';
    RETURN;
  END IF;

  SELECT full_name INTO v_name FROM public.profiles WHERE user_id = v_user_id;

  SELECT status, plan_type, access_expires_at INTO v_sub
  FROM public.subscriptions WHERE user_id = v_user_id;

  SELECT id, status, converted_at INTO v_lead
  FROM public.crm_leads WHERE user_id = v_user_id;

  RAISE NOTICE 'user_id=%, email=%, nome=%', v_user_id, v_email, v_name;
  RAISE NOTICE 'subscription: status=%, plan=%, expires=%', v_sub.status, v_sub.plan_type, v_sub.access_expires_at;
  RAISE NOTICE 'crm_lead: id=%, status=%, converted_at=%', v_lead.id, v_lead.status, v_lead.converted_at;

  IF v_lead.id IS NULL THEN
    -- Lead nao existia — cria
    INSERT INTO public.crm_leads (user_id, email, nome, status, converted_at)
    VALUES (v_user_id, v_email, v_name, 'subscriber', NOW());
    RAISE NOTICE 'crm_lead CRIADO: subscriber';
  ELSIF v_lead.status != 'subscriber' THEN
    UPDATE public.crm_leads
    SET status = 'subscriber', converted_at = COALESCE(converted_at, NOW()), updated_at = NOW()
    WHERE id = v_lead.id;
    RAISE NOTICE 'crm_lead ATUALIZADO para subscriber';
  ELSE
    RAISE NOTICE 'crm_lead ja estava como subscriber — sem mudanca';
  END IF;
END $$;
