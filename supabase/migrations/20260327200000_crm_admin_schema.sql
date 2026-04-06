-- ============================================================
-- CRM ADMINISTRATIVO — Schema Completo
-- Preceptor Group | Marco 2026
-- ============================================================

-- ENUMS
DO $$ BEGIN CREATE TYPE produto_admin AS ENUM ('preceptormed','preceptorenem'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE plano_tipo AS ENUM ('mensal','anual','bianual'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE receita_status AS ENUM ('ativo','cancelado','inadimplente'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE receita_origem AS ENUM ('stripe','pix','manual'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE despesa_categoria AS ENUM ('infra','marketing','salarios','ferramentas','juridico','outros'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE despesa_frequencia AS ENUM ('mensal','anual','unico'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE membro_area AS ENUM ('tech','marketing','ops','comercial'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE membro_vinculo AS ENUM ('socio','clt','pj','estagio','voluntario'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE membro_status AS ENUM ('ativo','inativo'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE pagamento_modelo AS ENUM ('mensal','quinzenal'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE vaga_urgencia AS ENUM ('alta','media','baixa'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE vaga_status AS ENUM ('rascunho','divulgada','entrevistas','oferta','encerrada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE candidato_etapa AS ENUM ('triagem','rh','tecnica','case','oferta','recusado','aprovado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE okr_status AS ENUM ('no_prazo','em_risco','atrasado','concluido'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- FINANCEIRO
-- ============================================================

CREATE TABLE admin_receitas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto         produto_admin NOT NULL DEFAULT 'preceptormed',
  plano           plano_tipo NOT NULL,
  valor           NUMERIC(12,2) NOT NULL CHECK (valor >= 0),
  data_inicio     DATE NOT NULL,
  data_renovacao  DATE,
  status          receita_status NOT NULL DEFAULT 'ativo',
  origem          receita_origem NOT NULL DEFAULT 'manual',
  usuario_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  observacoes     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_receitas_status   ON admin_receitas(status);
CREATE INDEX idx_admin_receitas_produto  ON admin_receitas(produto);
CREATE INDEX idx_admin_receitas_data     ON admin_receitas(data_inicio DESC);

CREATE TABLE admin_despesas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao       TEXT NOT NULL,
  categoria       despesa_categoria NOT NULL,
  valor           NUMERIC(12,2) NOT NULL CHECK (valor >= 0),
  data            DATE NOT NULL,
  recorrente      BOOLEAN NOT NULL DEFAULT false,
  frequencia      despesa_frequencia NOT NULL DEFAULT 'unico',
  responsavel     TEXT,
  centro_de_custo TEXT,
  comprovante_url TEXT,
  observacoes     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_despesas_cat   ON admin_despesas(categoria);
CREATE INDEX idx_admin_despesas_data  ON admin_despesas(data DESC);

CREATE TABLE admin_fluxo_caixa (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saldo_atual       NUMERIC(14,2) NOT NULL DEFAULT 0,
  data_atualizacao  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  observacoes       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_relatorios_investidor (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes                   INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano                   INTEGER NOT NULL CHECK (ano >= 2024),
  mrr                   NUMERIC(12,2) DEFAULT 0,
  arr                   NUMERIC(14,2) DEFAULT 0,
  total_usuarios        INTEGER DEFAULT 0,
  novos_usuarios        INTEGER DEFAULT 0,
  churn_rate            NUMERIC(5,2) DEFAULT 0,
  cac                   NUMERIC(10,2) DEFAULT 0,
  ltv                   NUMERIC(10,2) DEFAULT 0,
  burn_rate             NUMERIC(12,2) DEFAULT 0,
  runway                NUMERIC(5,1) DEFAULT 0,
  headcount             INTEGER DEFAULT 0,
  nps                   NUMERIC(4,1),
  narrativa_positivo    TEXT,
  narrativa_negativo    TEXT,
  narrativa_proximos30  TEXT,
  criado_em             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(mes, ano)
);

-- ============================================================
-- PEOPLE
-- ============================================================

CREATE TABLE admin_membros (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            TEXT NOT NULL,
  foto_url        TEXT,
  cargo           TEXT NOT NULL,
  area            membro_area NOT NULL,
  vinculo         membro_vinculo NOT NULL,
  data_entrada    DATE NOT NULL,
  status          membro_status NOT NULL DEFAULT 'ativo',
  email           TEXT,
  linkedin        TEXT,
  aniversario     DATE,
  cidade          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_membros_area    ON admin_membros(area);
CREATE INDEX idx_admin_membros_status  ON admin_membros(status);

CREATE TABLE admin_remuneracao (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membro_id               UUID NOT NULL REFERENCES admin_membros(id) ON DELETE CASCADE,
  salario_bruto           NUMERIC(12,2) NOT NULL CHECK (salario_bruto >= 0),
  modelo_pagamento        pagamento_modelo NOT NULL DEFAULT 'mensal',
  dia_pagamento           INTEGER CHECK (dia_pagamento BETWEEN 1 AND 31),
  banco                   TEXT,
  dados_bancarios         TEXT,
  equity_percentual       NUMERIC(5,2) DEFAULT 0,
  cliff_meses             INTEGER DEFAULT 0,
  vesting_meses           INTEGER DEFAULT 0,
  beneficios              JSONB DEFAULT '{}',
  observacoes_confidenciais TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_reajustes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membro_id       UUID NOT NULL REFERENCES admin_membros(id) ON DELETE CASCADE,
  data            DATE NOT NULL,
  percentual      NUMERIC(5,2) NOT NULL,
  valor_anterior  NUMERIC(12,2) NOT NULL,
  valor_novo      NUMERIC(12,2) NOT NULL,
  motivo          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_vagas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo            TEXT NOT NULL,
  area              membro_area NOT NULL,
  vinculo_desejado  membro_vinculo NOT NULL,
  faixa_min         NUMERIC(10,2),
  faixa_max         NUMERIC(10,2),
  urgencia          vaga_urgencia NOT NULL DEFAULT 'media',
  data_abertura     DATE NOT NULL DEFAULT CURRENT_DATE,
  status            vaga_status NOT NULL DEFAULT 'rascunho',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_vagas_status ON admin_vagas(status);

CREATE TABLE admin_candidatos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_id               UUID NOT NULL REFERENCES admin_vagas(id) ON DELETE CASCADE,
  nome                  TEXT NOT NULL,
  linkedin              TEXT,
  fonte                 TEXT,
  etapa                 candidato_etapa NOT NULL DEFAULT 'triagem',
  feedback              TEXT,
  data_prevista_inicio  DATE,
  fit_cultural          INTEGER CHECK (fit_cultural BETWEEN 1 AND 5),
  observacoes           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_candidatos_vaga  ON admin_candidatos(vaga_id);
CREATE INDEX idx_admin_candidatos_etapa ON admin_candidatos(etapa);

CREATE TABLE admin_okrs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objetivo        TEXT NOT NULL,
  responsavel_id  UUID REFERENCES admin_membros(id) ON DELETE SET NULL,
  trimestre       INTEGER NOT NULL CHECK (trimestre BETWEEN 1 AND 4),
  ano             INTEGER NOT NULL CHECK (ano >= 2024),
  status          okr_status NOT NULL DEFAULT 'no_prazo',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_key_results (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id              UUID NOT NULL REFERENCES admin_okrs(id) ON DELETE CASCADE,
  descricao           TEXT NOT NULL,
  meta                NUMERIC(12,2) NOT NULL,
  progresso_atual     NUMERIC(12,2) NOT NULL DEFAULT 0,
  unidade             TEXT NOT NULL DEFAULT '%',
  comentario_semanal  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================

CREATE TRIGGER set_admin_receitas_updated   BEFORE UPDATE ON admin_receitas      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_admin_despesas_updated   BEFORE UPDATE ON admin_despesas      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_admin_membros_updated    BEFORE UPDATE ON admin_membros       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_admin_remuneracao_updated BEFORE UPDATE ON admin_remuneracao  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_admin_vagas_updated      BEFORE UPDATE ON admin_vagas         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_admin_candidatos_updated BEFORE UPDATE ON admin_candidatos    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_admin_okrs_updated       BEFORE UPDATE ON admin_okrs          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_admin_kr_updated         BEFORE UPDATE ON admin_key_results   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY — Admins only
-- ============================================================

ALTER TABLE admin_receitas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_despesas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_fluxo_caixa           ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_relatorios_investidor  ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_membros               ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_remuneracao           ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_reajustes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_vagas                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_candidatos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_okrs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_key_results           ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access" ON admin_receitas              FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins full access" ON admin_despesas              FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins full access" ON admin_fluxo_caixa           FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins full access" ON admin_relatorios_investidor  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins full access" ON admin_membros               FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins full access" ON admin_remuneracao           FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins full access" ON admin_reajustes             FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins full access" ON admin_vagas                 FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins full access" ON admin_candidatos            FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins full access" ON admin_okrs                  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins full access" ON admin_key_results           FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
