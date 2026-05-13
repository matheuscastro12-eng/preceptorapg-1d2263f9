-- Casos clínicos interativos: PreceptorMED conduz uma conversa com o
-- usuário (médico/professor) coletando nome, idade, sexo, doença e
-- detalhes adaptativos. No final, estrutura um caso clínico completo
-- pronto pra ser usado em aula. Pode gerar questões em cima do caso.

CREATE TABLE public.clinical_cases (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Campos básicos (sempre preenchidos)
  paciente_nome            text,        -- "Maria Silva" ou alias
  paciente_idade           int,         -- em anos (0 se RN)
  paciente_idade_unidade   text DEFAULT 'anos' CHECK (paciente_idade_unidade IN ('anos','meses','dias')),
  paciente_sexo            text CHECK (paciente_sexo IN ('M','F','I')),  -- I = intersexo / não-binário
  doenca_principal         text,        -- "DM2 descompensada", "IAM com supra"

  -- Estrutura completa após finalização (jsonb pra flexibilidade)
  -- Schema:
  --   identificacao:      {nome, idade, sexo, profissao, naturalidade, ocupacao}
  --   queixa_principal:   string
  --   hda:                string  (História da Doença Atual)
  --   antecedentes:       {pessoais, familiares, ginecologicos, sociais}
  --   medicacoes_alergias: {em_uso[], alergias[]}
  --   exame_fisico:       {sinais_vitais{}, geral, segmentar{}}
  --   exames_complementares: [{tipo, nome, resultado}]
  --   hipoteses_diagnosticas: [{cid, descricao, justificativa}]
  --   diagnostico_final:  string
  --   conduta_proposta:   string
  --   evolucao:           string  (opcional, se houve)
  --   pontos_aprendizado: string[]   (3-5 takeaways)
  caso_estruturado         jsonb DEFAULT '{}'::jsonb,

  -- Conversa de construção (histórico user/assistant)
  -- [{role:'assistant'|'user', content:string, timestamp:string}]
  conversation             jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Estado
  status                   text NOT NULL DEFAULT 'building'
                              CHECK (status IN ('building', 'complete', 'archived')),
  titulo                   text,        -- gerado IA ao finalizar (ex: "DM2 descompensada em mulher de 65a")
  resumo_curto             text,        -- 1-2 frases pra listagem

  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_clinical_cases_user        ON public.clinical_cases(user_id, created_at DESC);
CREATE INDEX idx_clinical_cases_status      ON public.clinical_cases(user_id, status);

ALTER TABLE public.clinical_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_read_own_cases"   ON public.clinical_cases FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_insert_own_cases" ON public.clinical_cases FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_update_own_cases" ON public.clinical_cases FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_delete_own_cases" ON public.clinical_cases FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin_all_cases"       ON public.clinical_cases FOR ALL    TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tg_clinical_cases_updated
  BEFORE UPDATE ON public.clinical_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.clinical_cases IS
  'Casos clínicos construídos interativamente via chat com IA. Professor pode usar em aula. Pode gerar questões em cima.';

-- ============================================================
-- Questões geradas a partir do caso (banco próprio do user)
-- ============================================================
CREATE TABLE public.clinical_case_questions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id             uuid NOT NULL REFERENCES public.clinical_cases(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  ordem               int NOT NULL DEFAULT 1,
  enunciado           text NOT NULL,
  -- Alternativas: [{letra:'A', texto:'...', correta:false, justificativa:'...'}]
  alternativas        jsonb NOT NULL DEFAULT '[]'::jsonb,
  letra_correta       text NOT NULL CHECK (letra_correta ~ '^[A-E]$'),
  comentario_geral    text,
  area                text,
  dificuldade         text DEFAULT 'media' CHECK (dificuldade IN ('facil','media','dificil')),

  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_case_questions_case ON public.clinical_case_questions(case_id, ordem);
CREATE INDEX idx_case_questions_user ON public.clinical_case_questions(user_id, created_at DESC);

ALTER TABLE public.clinical_case_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_read_own_case_q"   ON public.clinical_case_questions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_insert_own_case_q" ON public.clinical_case_questions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_update_own_case_q" ON public.clinical_case_questions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_delete_own_case_q" ON public.clinical_case_questions FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin_all_case_q"       ON public.clinical_case_questions FOR ALL    TO authenticated USING (public.has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.clinical_case_questions IS
  'Questões ENAMED-style geradas a partir de um caso clínico específico. Professor usa em aula/avaliação.';
