-- Backfill: todo user com subscription ativa paga (monthly/annual/biannual)
-- que nao tem lead no CRM ou tem lead com status != 'subscriber'
-- ganha um lead criado/atualizado. Corrige o estado pro que o webhook
-- corrigido faz daqui pra frente.

DO $$
DECLARE
  v_count_created INT := 0;
  v_count_updated INT := 0;
BEGIN
  -- Criar leads que faltam pra subscribers ativos
  WITH inserted AS (
    INSERT INTO public.crm_leads (user_id, email, nome, status, converted_at)
    SELECT s.user_id, u.email, COALESCE(p.full_name, u.email), 'subscriber', COALESCE(s.updated_at, NOW())
    FROM public.subscriptions s
    JOIN auth.users u ON u.id = s.user_id
    LEFT JOIN public.profiles p ON p.user_id = s.user_id
    LEFT JOIN public.crm_leads l ON l.user_id = s.user_id
    WHERE s.status = 'active'
      AND s.plan_type IN ('monthly', 'annual', 'biannual')
      AND l.id IS NULL
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count_created FROM inserted;

  -- Atualizar leads existentes que deveriam ser subscriber
  WITH updated AS (
    UPDATE public.crm_leads l
    SET status = 'subscriber',
        converted_at = COALESCE(l.converted_at, s.updated_at, NOW()),
        updated_at = NOW()
    FROM public.subscriptions s
    WHERE l.user_id = s.user_id
      AND s.status = 'active'
      AND s.plan_type IN ('monthly', 'annual', 'biannual')
      AND l.status != 'subscriber'
    RETURNING l.id
  )
  SELECT COUNT(*) INTO v_count_updated FROM updated;

  RAISE NOTICE 'crm_leads criados: %', v_count_created;
  RAISE NOTICE 'crm_leads atualizados: %', v_count_updated;
END $$;
