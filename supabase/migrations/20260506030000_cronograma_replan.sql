-- V2 do cronograma: re-planning automático ao pular dia.
--
-- Quando o usuário pula um dia (sem freeze disponível), as atividades
-- não concluídas do dia perdido são redistribuídas pros próximos dias
-- futuros do plano. Limita 2 atividades extras por dia pra não inflar.
--
-- Atividades redistribuídas ficam marcadas com "redistribuida_de"
-- pra rastreio.

CREATE OR REPLACE FUNCTION public.fn_redistribute_pending_activities(p_plan_id uuid, p_skipped_date date)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  pendentes_count int;
  pendentes jsonb;
  nova_atividade jsonb;
  i int;
  dia_alvo record;
  inseridas int := 0;
  max_por_dia int := 2; -- atividades EXTRAS por dia (acima do que já tinha)
BEGIN
  -- 1) Coleta atividades não concluídas do dia pulado
  SELECT
    coalesce(jsonb_agg(elem), '[]'::jsonb)
    INTO pendentes
  FROM public.study_plan_days,
       jsonb_array_elements(atividades) AS elem
  WHERE plan_id = p_plan_id
    AND data = p_skipped_date
    AND (elem->>'concluida')::bool = false;

  pendentes_count := jsonb_array_length(pendentes);
  IF pendentes_count = 0 THEN RETURN 0; END IF;

  -- 2) Marca o dia pulado: zera atividades pendentes (deixa só as feitas)
  UPDATE public.study_plan_days
    SET atividades = (
      SELECT coalesce(jsonb_agg(elem), '[]'::jsonb)
      FROM jsonb_array_elements(atividades) AS elem
      WHERE (elem->>'concluida')::bool = true
    ),
    notas = CASE
      WHEN notas IS NULL THEN format('Dia pulado em %s. %s atividades redistribuídas.', current_date, pendentes_count)
      ELSE notas || ' · Dia pulado: ' || pendentes_count || ' atividades redistribuídas.'
    END,
    updated_at = now()
  WHERE plan_id = p_plan_id AND data = p_skipped_date;

  -- 3) Distribui pendentes pelos próximos dias do plano (até 2 extras por dia)
  i := 0;
  FOR dia_alvo IN
    SELECT id, atividades, jsonb_array_length(atividades) AS n_ativs
    FROM public.study_plan_days
    WHERE plan_id = p_plan_id
      AND data > p_skipped_date
      AND data >= current_date  -- só futuros, nunca passado
    ORDER BY data ASC
  LOOP
    EXIT WHEN i >= pendentes_count;

    -- Marca cada atividade redistribuída e adiciona ao dia
    FOR k IN 0 .. LEAST(max_por_dia, pendentes_count - i) - 1 LOOP
      nova_atividade := pendentes -> (i + k);
      nova_atividade := nova_atividade
        || jsonb_build_object('redistribuida_de', p_skipped_date::text)
        || jsonb_build_object('concluida', false, 'completed_at', null, 'item_ref', null);

      UPDATE public.study_plan_days
        SET atividades = atividades || jsonb_build_array(nova_atividade),
            updated_at = now()
        WHERE id = dia_alvo.id;
    END LOOP;

    i := i + LEAST(max_por_dia, pendentes_count - i);
    inseridas := i;
  END LOOP;

  -- 4) Recalcula concluido_pct dos dias afetados
  UPDATE public.study_plan_days
    SET concluido_pct = (
      SELECT
        CASE WHEN jsonb_array_length(atividades) = 0 THEN 0
             ELSE round(
               100.0 * (
                 SELECT count(*) FROM jsonb_array_elements(atividades) AS e
                 WHERE (e->>'concluida')::bool = true
               ) / jsonb_array_length(atividades)::numeric
             )::int
        END
    )
    WHERE plan_id = p_plan_id
      AND (data = p_skipped_date OR data > p_skipped_date);

  RETURN inseridas;
END;
$$;

COMMENT ON FUNCTION public.fn_redistribute_pending_activities IS
  'Quando user pula 1 dia sem freeze, redistribui atividades pendentes pros próximos dias (max 2 extras/dia). Retorna quantas foram redistribuídas.';

-- ============================================================
-- Atualizar fn_streak_daily_check pra chamar redistribuição
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_streak_daily_check()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ontem date := current_date - 1;
  plan_skip record;
BEGIN
  -- 1. Quem tem freeze e pulou ontem: usa o freeze, mantém streak
  UPDATE public.study_plans
    SET freezes_disponiveis = freezes_disponiveis - 1,
        ultimo_dia_concluido = ontem,
        updated_at = now()
    WHERE status = 'active'
      AND streak_dias > 0
      AND (ultimo_dia_concluido IS NULL OR ultimo_dia_concluido < ontem)
      AND freezes_disponiveis > 0
      AND prova_data > current_date;  -- não consome freeze se prova já passou

  -- 2. Quem NÃO tem freeze e pulou: zera streak + REDISTRIBUI atividades
  --    Itera pra rodar redistribuição por plano antes de zerar
  FOR plan_skip IN
    SELECT id FROM public.study_plans
    WHERE status = 'active'
      AND (
        (streak_dias > 0 AND (ultimo_dia_concluido IS NULL OR ultimo_dia_concluido < ontem))
        OR EXISTS (
          SELECT 1 FROM public.study_plan_days d
          WHERE d.plan_id = study_plans.id
            AND d.data = ontem
            AND d.concluido_pct < 100
            AND jsonb_array_length(d.atividades) > 0
        )
      )
      AND freezes_disponiveis = 0
      AND prova_data > current_date
  LOOP
    PERFORM public.fn_redistribute_pending_activities(plan_skip.id, ontem);
  END LOOP;

  UPDATE public.study_plans
    SET streak_dias = 0,
        updated_at = now()
    WHERE status = 'active'
      AND streak_dias > 0
      AND (ultimo_dia_concluido IS NULL OR ultimo_dia_concluido < ontem)
      AND freezes_disponiveis = 0;

  -- 3. Recarregar 1 freeze pra todos cujo recarga venceu
  UPDATE public.study_plans
    SET freezes_disponiveis = LEAST(freezes_disponiveis + 1, 2),
        freeze_recarga_em = (current_date + interval '7 days')::date,
        updated_at = now()
    WHERE status = 'active'
      AND freeze_recarga_em <= current_date;

  -- 4. Marcar planos como 'completed' se prova já passou
  UPDATE public.study_plans
    SET status = 'completed', updated_at = now()
    WHERE status = 'active' AND prova_data < current_date;
END;
$$;

COMMENT ON FUNCTION public.fn_streak_daily_check() IS
  'V2: Cron diário. Consome freeze se possível; senão zera streak + redistribui atividades pendentes do dia pulado pros próximos dias futuros (fn_redistribute_pending_activities). Recarrega freezes aos domingos. Marca planos completed após prova.';
