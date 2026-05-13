-- Phase 2.1: schema completo do Whitebook — drogas, protocolos, CID-10 e logs.
-- Conteudo seedado em palavras proprias, fontes publicas (ANVISA, DATASUS,
-- diretrizes brasileiras, OMS) citadas por nome/orgao + ano.
--
-- Nota: usamos triggers BEFORE INSERT/UPDATE pra manter search_vector
-- ao inves de GENERATED ALWAYS, porque to_tsvector('portuguese', ...)
-- nao eh garantidamente IMMUTABLE em todos os contextos do Postgres
-- quando combinado com array_to_string em colunas text[].

-- ============================================================
-- wb_drugs — medicamentos estruturados
-- ============================================================
CREATE TABLE public.wb_drugs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  text NOT NULL UNIQUE,
  nome_principio        text NOT NULL,
  nome_comercial        text[] DEFAULT '{}',
  classe_terapeutica    text,
  via_administracao     text[] DEFAULT '{}',
  apresentacoes         jsonb DEFAULT '[]'::jsonb,
  dose_adulto           jsonb DEFAULT '{}'::jsonb,
  dose_pediatrica       jsonb DEFAULT '{}'::jsonb,
  dose_idoso            jsonb DEFAULT '{}'::jsonb,
  ajuste_renal          jsonb DEFAULT '[]'::jsonb,
  ajuste_hepatico       jsonb DEFAULT '[]'::jsonb,
  gestacao_categoria    text,
  gestacao_obs          text,
  lactacao              text,
  interacoes            jsonb DEFAULT '[]'::jsonb,
  contraindicacoes      text[] DEFAULT '{}',
  efeitos_adversos      jsonb DEFAULT '[]'::jsonb,
  alertas_seguranca     text[] DEFAULT '{}',
  monitoramento         text[] DEFAULT '{}',
  bula_fonte_url        text,
  published             boolean NOT NULL DEFAULT false,
  version               integer NOT NULL DEFAULT 1,
  reviewed_by           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at           timestamptz,
  raw_extraction        jsonb,
  search_vector         tsvector,  -- mantido por trigger
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Trigger pra manter search_vector
CREATE OR REPLACE FUNCTION public.wb_drugs_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', coalesce(NEW.nome_principio, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(array_to_string(NEW.nome_comercial, ' '), '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.classe_terapeutica, '')), 'C') ||
    setweight(to_tsvector('portuguese', coalesce(array_to_string(NEW.via_administracao, ' '), '')), 'D');
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_wb_drugs_search_vector
  BEFORE INSERT OR UPDATE ON public.wb_drugs
  FOR EACH ROW EXECUTE FUNCTION public.wb_drugs_search_vector_update();

CREATE INDEX idx_wb_drugs_search    ON public.wb_drugs USING gin (search_vector);
CREATE INDEX idx_wb_drugs_slug      ON public.wb_drugs (slug);
CREATE INDEX idx_wb_drugs_published ON public.wb_drugs (published);
CREATE INDEX idx_wb_drugs_classe    ON public.wb_drugs (classe_terapeutica) WHERE published = true;

ALTER TABLE public.wb_drugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_published_drugs"
  ON public.wb_drugs FOR SELECT TO authenticated
  USING (published = true);
CREATE POLICY "admin_read_all_drugs"
  ON public.wb_drugs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_drugs"
  ON public.wb_drugs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_drugs"
  ON public.wb_drugs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_drugs"
  ON public.wb_drugs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tg_wb_drugs_updated
  BEFORE UPDATE ON public.wb_drugs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.wb_drugs IS
  'Medicamentos do Whitebook. Conteudo factual sintetizado de fontes publicas (ANVISA, diretrizes). Workflow: published=false -> revisao admin -> published=true.';

-- ============================================================
-- wb_protocols
-- ============================================================
CREATE TABLE public.wb_protocols (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                     text NOT NULL UNIQUE,
  titulo                   text NOT NULL,
  categoria                text NOT NULL,
  nivel_atencao            text,
  resumo                   text,
  criterios_diagnosticos   jsonb DEFAULT '[]'::jsonb,
  conduta_passos           jsonb DEFAULT '[]'::jsonb,
  medicamentos_relacionados uuid[] DEFAULT '{}',
  exames_solicitar         text[] DEFAULT '{}',
  red_flags                text[] DEFAULT '{}',
  fonte                    text,
  fonte_url                text,
  data_diretriz            date,
  published                boolean NOT NULL DEFAULT false,
  version                  integer NOT NULL DEFAULT 1,
  reviewed_by              uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at              timestamptz,
  raw_extraction           jsonb,
  search_vector            tsvector,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.wb_protocols_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', coalesce(NEW.titulo, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.categoria, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.resumo, '')), 'C');
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_wb_protocols_search_vector
  BEFORE INSERT OR UPDATE ON public.wb_protocols
  FOR EACH ROW EXECUTE FUNCTION public.wb_protocols_search_vector_update();

CREATE INDEX idx_wb_protocols_search    ON public.wb_protocols USING gin (search_vector);
CREATE INDEX idx_wb_protocols_slug      ON public.wb_protocols (slug);
CREATE INDEX idx_wb_protocols_categoria ON public.wb_protocols (categoria) WHERE published = true;
CREATE INDEX idx_wb_protocols_published ON public.wb_protocols (published);

ALTER TABLE public.wb_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_published_protocols"
  ON public.wb_protocols FOR SELECT TO authenticated
  USING (published = true);
CREATE POLICY "admin_read_all_protocols"
  ON public.wb_protocols FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_protocols"
  ON public.wb_protocols FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_protocols"
  ON public.wb_protocols FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_protocols"
  ON public.wb_protocols FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tg_wb_protocols_updated
  BEFORE UPDATE ON public.wb_protocols
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.wb_protocols IS
  'Protocolos clinicos sintetizados de diretrizes brasileiras publicas. Workflow rascunho -> revisao -> publicado.';

-- ============================================================
-- wb_icd10 — codigos CID-10 (dado publico DATASUS)
-- ============================================================
CREATE TABLE public.wb_icd10 (
  code              text PRIMARY KEY,
  descricao_pt      text NOT NULL,
  descricao_en      text,
  capitulo          text,
  capitulo_titulo   text,
  pai               text,
  search_vector     tsvector
);

CREATE OR REPLACE FUNCTION public.wb_icd10_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', coalesce(NEW.descricao_pt, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.code, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.capitulo_titulo, '')), 'C');
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_wb_icd10_search_vector
  BEFORE INSERT OR UPDATE ON public.wb_icd10
  FOR EACH ROW EXECUTE FUNCTION public.wb_icd10_search_vector_update();

CREATE INDEX idx_wb_icd10_search   ON public.wb_icd10 USING gin (search_vector);
CREATE INDEX idx_wb_icd10_capitulo ON public.wb_icd10 (capitulo);
CREATE INDEX idx_wb_icd10_pai      ON public.wb_icd10 (pai);

ALTER TABLE public.wb_icd10 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_icd10"
  ON public.wb_icd10 FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "admin_write_icd10"
  ON public.wb_icd10 FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.wb_icd10 IS
  'Codigos CID-10. Dado publico via DATASUS. Hierarquia em pai+capitulo.';

-- ============================================================
-- wb_search_logs — analytics
-- ============================================================
CREATE TABLE public.wb_search_logs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  query                 text NOT NULL,
  result_count          integer NOT NULL DEFAULT 0,
  clicked_resource_type text,
  clicked_resource_id   text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_wb_search_logs_user    ON public.wb_search_logs (user_id, created_at DESC);
CREATE INDEX idx_wb_search_logs_created ON public.wb_search_logs (created_at DESC);

ALTER TABLE public.wb_search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_insert_own_searchlog"
  ON public.wb_search_logs FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "admin_read_searchlogs"
  ON public.wb_search_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.wb_search_logs IS
  'Log de buscas no Whitebook. Analytics e descoberta de gaps de conteudo. RLS: user insere proprio, admin le todas.';
