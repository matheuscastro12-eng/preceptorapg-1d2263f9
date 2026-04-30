-- Phase 1: Whitebook Calculadoras
-- Tabela de escores/calculadoras clínicas. Conteudo eh factual (formulas
-- matematicas + interpretacoes resumidas em palavras proprias). Cada
-- calculadora tem sua fonte primaria citada por autor/ano.

CREATE TABLE public.wb_calculators (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,
  nome          text NOT NULL,
  categoria     text NOT NULL,  -- ex: 'Cardiologia', 'Infectologia', 'UTI'
  descricao     text,
  quando_usar   text,
  -- Definicao completa em JSON: inputs[], formula, interpretation[], fonte
  -- Schema documentado em src/components/whitebook/CalculatorRenderer.tsx
  definicao     jsonb NOT NULL,
  fonte         text,            -- ex: "Lip GY et al, 2010"
  fonte_url     text,            -- link pra paper/diretriz quando publico
  published     boolean NOT NULL DEFAULT false,
  reviewed_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  -- Campo gerado pra busca full-text portugues. Pesos:
  --   A=nome (mais relevante), B=categoria, C=descricao, D=quando_usar
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce(nome, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(categoria, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(descricao, '')), 'C') ||
    setweight(to_tsvector('portuguese', coalesce(quando_usar, '')), 'D')
  ) STORED
);

CREATE INDEX idx_wb_calculators_search    ON public.wb_calculators USING gin (search_vector);
CREATE INDEX idx_wb_calculators_slug      ON public.wb_calculators (slug);
CREATE INDEX idx_wb_calculators_categoria ON public.wb_calculators (categoria) WHERE published = true;
CREATE INDEX idx_wb_calculators_published ON public.wb_calculators (published);

ALTER TABLE public.wb_calculators ENABLE ROW LEVEL SECURITY;

-- Leitura aberta a authenticated, mas so itens publicados
-- (rascunhos so admin/curador via service_role)
CREATE POLICY "authenticated_read_published_calculators"
  ON public.wb_calculators FOR SELECT TO authenticated
  USING (published = true);

-- INSERT/UPDATE/DELETE so admin (via has_role) — seguindo o padrao
-- ja usado em crm_email_templates.
CREATE POLICY "admin_insert_calculators"
  ON public.wb_calculators FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_calculators"
  ON public.wb_calculators FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_calculators"
  ON public.wb_calculators FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tg_wb_calculators_updated
  BEFORE UPDATE ON public.wb_calculators
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.wb_calculators IS
  'Calculadoras/escores clinicos do Whitebook PreceptorMED. Conteudo factual (formula + interpretacao curta). Fonte primaria citada por autor/ano.';

COMMENT ON COLUMN public.wb_calculators.definicao IS
  'JSON: { inputs:[{key,label,type,...}], formula:{type, ...}, interpretation:[{min,max,label,action}], disclaimer }';
