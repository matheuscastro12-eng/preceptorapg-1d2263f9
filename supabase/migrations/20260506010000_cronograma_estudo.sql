-- Cronograma de estudos personalizado por prova
-- Hipótese de retenção: estudante coloca prova + tópicos + horas/dia, app
-- gera plano dia-a-dia que liga atividades ao Dashboard, Flashcards e Exam.
-- Streak Duolingo-style com 1 freeze/semana grátis.

-- ============================================================
-- study_plans — 1 plano ativo por user
-- ============================================================
CREATE TABLE public.study_plans (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prova_nome               text NOT NULL,
  prova_data               date NOT NULL,
  topicos_input            text NOT NULL,           -- texto cru do user
  topicos_normalizados     text[] NOT NULL DEFAULT '{}', -- IA normaliza
  horas_dia                int  NOT NULL DEFAULT 2 CHECK (horas_dia BETWEEN 1 AND 8),
  status                   text NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'completed', 'expired', 'abandoned')),
  -- Streak
  streak_dias              int  NOT NULL DEFAULT 0,
  ultimo_dia_concluido     date,
  freezes_disponiveis      int  NOT NULL DEFAULT 1, -- recarrega aos domingos
  freeze_recarga_em        date NOT NULL DEFAULT (current_date + interval '7 days')::date,
  -- Geração
  raw_plan                 jsonb,                   -- output bruto da IA (debug)
  generation_meta          jsonb DEFAULT '{}'::jsonb,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_study_plans_user        ON public.study_plans(user_id, status, created_at DESC);
CREATE UNIQUE INDEX idx_study_plans_one_active
  ON public.study_plans(user_id) WHERE status = 'active';

ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_read_own_plans"   ON public.study_plans FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_insert_own_plans" ON public.study_plans FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_update_own_plans" ON public.study_plans FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_delete_own_plans" ON public.study_plans FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin_all_plans"       ON public.study_plans FOR ALL    TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tg_study_plans_updated
  BEFORE UPDATE ON public.study_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.study_plans IS
  'Cronograma de estudo personalizado para uma prova. Apenas 1 plano ativo por user (UNIQUE WHERE status=active).';

-- ============================================================
-- study_plan_days — uma linha por dia do plano
-- ============================================================
CREATE TABLE public.study_plan_days (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id             uuid NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data                date NOT NULL,
  topico_principal    text,
  fase                text NOT NULL DEFAULT 'aprendizado'
                          CHECK (fase IN ('aprendizado', 'consolidacao', 'revisao_final', 'descanso')),
  -- Atividades do dia (formato rico):
  --   [{
  --     "tipo":"fechamento"|"flashcards"|"questoes"|"revisao_flash"|"leitura",
  --     "tema":"...",
  --     "descricao":"...",
  --     "estimativa_min":25,
  --     "quantidade":3,
  --     "concluida":false,
  --     "completed_at":null,
  --     "item_ref":null  -- id do fechamento/deck/exam após executar
  --   }]
  atividades          jsonb NOT NULL DEFAULT '[]'::jsonb,
  concluido_pct       int  NOT NULL DEFAULT 0 CHECK (concluido_pct BETWEEN 0 AND 100),
  notas               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE(plan_id, data)
);

CREATE INDEX idx_study_plan_days_plan    ON public.study_plan_days(plan_id, data);
CREATE INDEX idx_study_plan_days_user    ON public.study_plan_days(user_id, data);
CREATE INDEX idx_study_plan_days_today   ON public.study_plan_days(user_id, data) WHERE concluido_pct < 100;

ALTER TABLE public.study_plan_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_read_own_days"   ON public.study_plan_days FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_insert_own_days" ON public.study_plan_days FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_update_own_days" ON public.study_plan_days FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_delete_own_days" ON public.study_plan_days FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin_all_days"       ON public.study_plan_days FOR ALL    TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tg_study_plan_days_updated
  BEFORE UPDATE ON public.study_plan_days
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.study_plan_days IS
  'Cada linha = um dia do cronograma. Atividades em jsonb permitem flexibilidade de tipos sem migrations.';

-- ============================================================
-- Trigger: atualizar streak ao marcar dia 100% concluído
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_update_streak_on_day_complete()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  plan_rec RECORD;
  ontem date;
BEGIN
  -- Só dispara se o dia foi MARCADO como 100% (de < 100 para = 100)
  IF NEW.concluido_pct = 100 AND COALESCE(OLD.concluido_pct, 0) < 100 THEN
    SELECT * INTO plan_rec FROM public.study_plans WHERE id = NEW.plan_id FOR UPDATE;
    IF NOT FOUND THEN RETURN NEW; END IF;

    -- Só conta se o dia concluído for HOJE (não retroativo)
    IF NEW.data = current_date THEN
      ontem := current_date - 1;
      -- Se ultimo_dia_concluido foi ontem, mantém streak; senão zera e começa em 1
      IF plan_rec.ultimo_dia_concluido = ontem OR plan_rec.ultimo_dia_concluido = current_date THEN
        UPDATE public.study_plans
          SET streak_dias = CASE
                WHEN ultimo_dia_concluido = current_date THEN streak_dias
                ELSE streak_dias + 1
              END,
              ultimo_dia_concluido = current_date,
              updated_at = now()
          WHERE id = NEW.plan_id;
      ELSE
        UPDATE public.study_plans
          SET streak_dias = 1,
              ultimo_dia_concluido = current_date,
              updated_at = now()
          WHERE id = NEW.plan_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_streak_on_day_complete
  AFTER UPDATE OF concluido_pct ON public.study_plan_days
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_streak_on_day_complete();

-- ============================================================
-- Cron diário: zerar streak se pulou ontem (sem freeze)
-- + recarregar freezes aos domingos
-- (job real será criado via supabase functions deploy)
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_streak_daily_check()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ontem date := current_date - 1;
BEGIN
  -- 1. Zerar streak de quem não cumpriu ontem E não tem freeze disponível
  UPDATE public.study_plans
    SET streak_dias = 0,
        updated_at = now()
    WHERE status = 'active'
      AND streak_dias > 0
      AND (ultimo_dia_concluido IS NULL OR ultimo_dia_concluido < ontem)
      AND freezes_disponiveis = 0;

  -- 2. Quem tem freeze e pulou ontem: usa o freeze, mantém streak, ultimo_dia atualizado para ontem (perdão)
  UPDATE public.study_plans
    SET freezes_disponiveis = freezes_disponiveis - 1,
        ultimo_dia_concluido = ontem,
        updated_at = now()
    WHERE status = 'active'
      AND streak_dias > 0
      AND (ultimo_dia_concluido IS NULL OR ultimo_dia_concluido < ontem)
      AND freezes_disponiveis > 0;

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
  'Cron diário: zera streak de quem pulou (sem freeze), consome freeze quando aplicável, recarrega aos domingos, marca planos como completed após prova.';
