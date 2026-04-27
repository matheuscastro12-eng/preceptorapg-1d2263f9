-- Provas importadas pelo aluno: upload de PDF -> extracao via Gemini Vision -> simulado
--
-- Decisoes de produto:
-- - Cada aluno paying pode subir suas proprias provas (RLS estrita por user_id).
-- - Aluno escolhe se prova tem 4 ou 5 alternativas no upload.
-- - Justificativa: se vier no PDF, IA extrai literal. Se nao vier e o user
--   pediu, IA gera. Coluna `justificativa_origem` rastreia.
-- - Imagens nas questoes sao ignoradas (so texto).
-- - Volume esperado: massivo, entao tudo eh paginavel/indexado e contadores
--   sao denormalizados pra evitar count() na UI.

-- ============================================================
-- Tabela 1: cabecalho da prova
-- ============================================================
CREATE TABLE public.provas_importadas (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo                   text NOT NULL,
  num_alternativas         smallint NOT NULL CHECK (num_alternativas IN (4, 5)),
  -- Opcao de geracao:
  -- - true  = se justificativa nao vier no PDF, IA gera
  -- - false = sem justificativa caso nao venha no PDF
  gerar_justificativa_ia   boolean NOT NULL DEFAULT true,
  -- PDF original armazenado em storage privado
  pdf_storage_path         text,
  pdf_size_bytes           integer,
  num_paginas              integer,
  -- Status do pipeline de processamento
  status                   text NOT NULL DEFAULT 'uploading'
    CHECK (status IN ('uploading','extracting','reviewing','ready','failed','archived')),
  status_message           text,
  -- Contadores denormalizados (mantidos via trigger) — evita count() na listagem
  num_questoes             integer NOT NULL DEFAULT 0,
  num_questoes_aprovadas   integer NOT NULL DEFAULT 0,
  num_questoes_rejeitadas  integer NOT NULL DEFAULT 0,
  -- Timing/custo
  extraction_started_at    timestamptz,
  extraction_completed_at  timestamptz,
  extraction_cost_usd      numeric(10,4),
  -- Estatisticas agregadas das tentativas (atualizado quando user roda simulado)
  best_percentage          numeric(5,2),
  attempts_count           integer NOT NULL DEFAULT 0,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_provas_user_status     ON public.provas_importadas (user_id, status, created_at DESC);
CREATE INDEX idx_provas_user_created    ON public.provas_importadas (user_id, created_at DESC);

COMMENT ON TABLE public.provas_importadas IS
  'Provas importadas pelo aluno via upload de PDF. Pipeline: uploading -> extracting -> reviewing -> ready.';

-- ============================================================
-- Tabela 2: questoes extraidas
-- ============================================================
CREATE TABLE public.prova_questoes_importadas (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prova_id              uuid NOT NULL REFERENCES public.provas_importadas(id) ON DELETE CASCADE,
  -- user_id duplicado pra simplificar RLS (evita join)
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero                integer NOT NULL,
  enunciado             text NOT NULL,
  -- Array de alternativas — comprimento 4 ou 5 conforme prova.num_alternativas
  alternativas          text[] NOT NULL,
  -- Letra do gabarito (A-E). CHECK forcado a alfabeto valido.
  gabarito              text NOT NULL CHECK (gabarito ~ '^[A-E]$'),
  justificativa         text,
  -- Origem: 'pdf' = vinha no proprio PDF, 'ia' = IA gerou, 'none' = sem
  justificativa_origem  text NOT NULL DEFAULT 'none'
    CHECK (justificativa_origem IN ('pdf','ia','none')),
  -- Status de revisao do user antes de virar simulado
  status                text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','edited')),
  edited_by_user        boolean NOT NULL DEFAULT false,
  pagina_origem         integer,
  -- Raw da extracao Gemini (pra debug/reprocessamento)
  raw_extraction        jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prova_id, numero)
);

CREATE INDEX idx_prova_questoes_prova        ON public.prova_questoes_importadas (prova_id, numero);
CREATE INDEX idx_prova_questoes_prova_status ON public.prova_questoes_importadas (prova_id, status);
CREATE INDEX idx_prova_questoes_user         ON public.prova_questoes_importadas (user_id);

COMMENT ON TABLE public.prova_questoes_importadas IS
  'Questoes extraidas de provas importadas. Aluno revisa antes de virar simulado (status pending->approved).';

-- ============================================================
-- Tabela 3: tentativas (simulado online)
-- ============================================================
CREATE TABLE public.prova_attempts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prova_id            uuid NOT NULL REFERENCES public.provas_importadas(id) ON DELETE CASCADE,
  total_questions     integer NOT NULL,
  correct_answers     integer NOT NULL,
  percentage          numeric(5,2) NOT NULL,
  -- {questao_id_uuid: 'A'|'B'|'C'|'D'|'E'|null}
  answers             jsonb NOT NULL DEFAULT '{}',
  duration_seconds    integer,
  finished_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_prova_attempts_user_created ON public.prova_attempts (user_id, created_at DESC);
CREATE INDEX idx_prova_attempts_prova        ON public.prova_attempts (prova_id, created_at DESC);

COMMENT ON TABLE public.prova_attempts IS
  'Tentativas/simulados realizados pelo aluno em uma prova importada.';

-- ============================================================
-- RLS — aluno so ve/edita as proprias provas
-- ============================================================
ALTER TABLE public.provas_importadas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prova_questoes_importadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prova_attempts           ENABLE ROW LEVEL SECURITY;

-- provas_importadas
CREATE POLICY "user_select_own_provas"
  ON public.provas_importadas FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "user_insert_own_provas"
  ON public.provas_importadas FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_update_own_provas"
  ON public.provas_importadas FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_delete_own_provas"
  ON public.provas_importadas FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- prova_questoes_importadas
CREATE POLICY "user_select_own_prova_questoes"
  ON public.prova_questoes_importadas FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "user_insert_own_prova_questoes"
  ON public.prova_questoes_importadas FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_update_own_prova_questoes"
  ON public.prova_questoes_importadas FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_delete_own_prova_questoes"
  ON public.prova_questoes_importadas FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- prova_attempts
CREATE POLICY "user_select_own_prova_attempts"
  ON public.prova_attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "user_insert_own_prova_attempts"
  ON public.prova_attempts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- Storage bucket privado pros PDFs originais
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('provas-pdfs', 'provas-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Path convention: {user_id}/{prova_id}/original.pdf
-- RLS por path: o primeiro segmento DEVE ser o user_id de quem upou.

DROP POLICY IF EXISTS "user_upload_own_prova_pdf" ON storage.objects;
CREATE POLICY "user_upload_own_prova_pdf"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'provas-pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "user_read_own_prova_pdf" ON storage.objects;
CREATE POLICY "user_read_own_prova_pdf"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'provas-pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "user_delete_own_prova_pdf" ON storage.objects;
CREATE POLICY "user_delete_own_prova_pdf"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'provas-pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- Triggers
-- ============================================================

-- updated_at automatico (assume que public.update_updated_at_column ja existe)
CREATE TRIGGER tg_provas_importadas_updated
  BEFORE UPDATE ON public.provas_importadas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tg_prova_questoes_updated
  BEFORE UPDATE ON public.prova_questoes_importadas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mantem contadores em provas_importadas em sincronia
CREATE OR REPLACE FUNCTION public.refresh_prova_counters()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pid uuid;
BEGIN
  pid := COALESCE(NEW.prova_id, OLD.prova_id);
  UPDATE public.provas_importadas
  SET
    num_questoes            = (SELECT count(*) FROM public.prova_questoes_importadas WHERE prova_id = pid),
    num_questoes_aprovadas  = (SELECT count(*) FROM public.prova_questoes_importadas WHERE prova_id = pid AND status = 'approved'),
    num_questoes_rejeitadas = (SELECT count(*) FROM public.prova_questoes_importadas WHERE prova_id = pid AND status = 'rejected')
  WHERE id = pid;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER tg_prova_questoes_counters
  AFTER INSERT OR UPDATE OR DELETE ON public.prova_questoes_importadas
  FOR EACH ROW EXECUTE FUNCTION public.refresh_prova_counters();

-- Mantem stats agregados em provas_importadas quando uma tentativa eh registrada
CREATE OR REPLACE FUNCTION public.refresh_prova_attempt_stats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.provas_importadas
  SET
    attempts_count  = (SELECT count(*) FROM public.prova_attempts WHERE prova_id = NEW.prova_id),
    best_percentage = (SELECT max(percentage) FROM public.prova_attempts WHERE prova_id = NEW.prova_id)
  WHERE id = NEW.prova_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_prova_attempt_stats
  AFTER INSERT ON public.prova_attempts
  FOR EACH ROW EXECUTE FUNCTION public.refresh_prova_attempt_stats();

-- ============================================================
-- Constraint: gabarito tem que ser uma letra dentro do range
-- de num_alternativas da prova. Ex: prova de 4 alternativas
-- nao pode ter gabarito 'E'.
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_gabarito_within_alternativas()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  num_alt smallint;
  letra_max text;
BEGIN
  SELECT num_alternativas INTO num_alt
    FROM public.provas_importadas WHERE id = NEW.prova_id;
  letra_max := chr(64 + num_alt); -- 4=>'D', 5=>'E'
  IF NEW.gabarito > letra_max THEN
    RAISE EXCEPTION 'Gabarito % invalido para prova com % alternativas (max=%)', NEW.gabarito, num_alt, letra_max;
  END IF;
  IF array_length(NEW.alternativas, 1) <> num_alt THEN
    RAISE EXCEPTION 'Numero de alternativas (%) diferente do esperado pela prova (%)', array_length(NEW.alternativas, 1), num_alt;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_validate_gabarito
  BEFORE INSERT OR UPDATE ON public.prova_questoes_importadas
  FOR EACH ROW EXECUTE FUNCTION public.validate_gabarito_within_alternativas();
