-- ============================================================
-- CRM Schema Upgrade: Drop simple tables, create full CRM schema
-- ============================================================

-- Drop existing simple CRM tables (no production data)
DROP TABLE IF EXISTS public.crm_health_scores CASCADE;
DROP TABLE IF EXISTS public.crm_referrals CASCADE;
DROP TABLE IF EXISTS public.crm_funnel_events CASCADE;
DROP TABLE IF EXISTS public.crm_leads CASCADE;

-- ============================================================
-- ENUM TYPES
-- ============================================================

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM (
    'visitor','signup','active_trial','engaged','subscriber','churned','win_back'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE health_zone AS ENUM ('healthy','attention','risk','critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE risk_level AS ENUM ('low','medium','high','critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE automation_type AS ENUM ('email','push','whatsapp','in_app');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE automation_trigger AS ENUM (
    'boas_vindas','ativacao_d1','engajamento_d3','social_proof_d5',
    'oferta_d6','ultimo_dia_d7','win_back_d14','health_alert',
    'churn_prevention','referral_nudge','upsell_cross','reativacao'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE delivery_status AS ENUM (
    'pending','sent','delivered','opened','clicked','failed','bounced'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE produto AS ENUM ('preceptormed','preceptorjus','preceptorenem');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- MODULE 1: LEAD INTELLIGENCE
-- ============================================================

CREATE TABLE public.crm_leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email           TEXT NOT NULL,
  nome            TEXT,
  telefone        TEXT,
  lead_score      INTEGER NOT NULL DEFAULT 0 CHECK (lead_score BETWEEN 0 AND 100),
  status          lead_status NOT NULL DEFAULT 'visitor',
  produto_interesse produto NOT NULL DEFAULT 'preceptormed',
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  utm_content     TEXT,
  utm_term        TEXT,
  referral_code   TEXT,
  landing_page    TEXT,
  fase_medica     TEXT,
  especialidade   TEXT,
  faculdade       TEXT,
  ano_formatura   INTEGER,
  total_sessions      INTEGER DEFAULT 0,
  last_activity_at    TIMESTAMPTZ,
  trial_started_at    TIMESTAMPTZ,
  trial_ends_at       TIMESTAMPTZ,
  converted_at        TIMESTAMPTZ,
  churned_at          TIMESTAMPTZ,
  ip_address      INET,
  user_agent      TEXT,
  country         TEXT DEFAULT 'BR',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crm_leads_user_id       ON crm_leads(user_id);
CREATE INDEX idx_crm_leads_email         ON crm_leads(email);
CREATE INDEX idx_crm_leads_status        ON crm_leads(status);
CREATE INDEX idx_crm_leads_lead_score    ON crm_leads(lead_score DESC);
CREATE INDEX idx_crm_leads_produto       ON crm_leads(produto_interesse);
CREATE INDEX idx_crm_leads_utm_source    ON crm_leads(utm_source);
CREATE INDEX idx_crm_leads_created_at    ON crm_leads(created_at DESC);

-- ============================================================
-- MODULE 2: CONVERSION FUNNEL
-- ============================================================

CREATE TABLE public.crm_funnel_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  from_stage      lead_status,
  to_stage        lead_status NOT NULL,
  trigger_type    automation_trigger,
  trigger_source  TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crm_funnel_lead_id    ON crm_funnel_events(lead_id);
CREATE INDEX idx_crm_funnel_user_id    ON crm_funnel_events(user_id);
CREATE INDEX idx_crm_funnel_to_stage   ON crm_funnel_events(to_stage);
CREATE INDEX idx_crm_funnel_created_at ON crm_funnel_events(created_at DESC);

-- ============================================================
-- MODULE 3: STUDENT HEALTH SCORE
-- ============================================================

CREATE TABLE public.crm_health_scores (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id             UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  score               INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  zone                health_zone NOT NULL DEFAULT 'critical',
  pts_frequencia      INTEGER DEFAULT 0 CHECK (pts_frequencia BETWEEN 0 AND 30),
  pts_desempenho      INTEGER DEFAULT 0 CHECK (pts_desempenho BETWEEN 0 AND 25),
  pts_engajamento     INTEGER DEFAULT 0 CHECK (pts_engajamento BETWEEN 0 AND 25),
  pts_tendencia       INTEGER DEFAULT 0 CHECK (pts_tendencia BETWEEN 0 AND 20),
  questoes_7d         INTEGER DEFAULT 0,
  questoes_30d        INTEGER DEFAULT 0,
  acertos_pct         DECIMAL(5,2) DEFAULT 0,
  dias_ativos_14d     INTEGER DEFAULT 0,
  dias_ativos_30d     INTEGER DEFAULT 0,
  features_usadas     INTEGER DEFAULT 0,
  streak_atual        INTEGER DEFAULT 0,
  streak_maximo       INTEGER DEFAULT 0,
  score_semana_anterior INTEGER DEFAULT 0,
  variacao_score      INTEGER DEFAULT 0,
  produto             produto NOT NULL DEFAULT 'preceptormed',
  calculado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Funcao imutavel para extrair data de timestamptz (necessaria para index)
CREATE OR REPLACE FUNCTION crm_date_from_timestamptz(ts TIMESTAMPTZ)
RETURNS DATE AS $$
  SELECT (ts AT TIME ZONE 'UTC')::date;
$$ LANGUAGE sql IMMUTABLE;

CREATE UNIQUE INDEX idx_crm_health_user_day ON crm_health_scores(user_id, crm_date_from_timestamptz(calculado_em));
CREATE INDEX idx_crm_health_user_id     ON crm_health_scores(user_id);
CREATE INDEX idx_crm_health_zone        ON crm_health_scores(zone);
CREATE INDEX idx_crm_health_score       ON crm_health_scores(score DESC);
CREATE INDEX idx_crm_health_calculado   ON crm_health_scores(calculado_em DESC);

-- ============================================================
-- MODULE 4: ANTI-CHURN ENGINE
-- ============================================================

CREATE TABLE public.crm_churn_predictions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id             UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  churn_probability   DECIMAL(5,4) NOT NULL CHECK (churn_probability BETWEEN 0 AND 1),
  risk_level          risk_level NOT NULL DEFAULT 'low',
  signals             JSONB DEFAULT '[]',
  intervention_sent   BOOLEAN DEFAULT FALSE,
  intervention_type   TEXT,
  intervention_at     TIMESTAMPTZ,
  intervention_result TEXT,
  outcome             TEXT,
  outcome_at          TIMESTAMPTZ,
  prediction_window   INTEGER DEFAULT 14,
  valid_until         TIMESTAMPTZ,
  produto             produto NOT NULL DEFAULT 'preceptormed',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crm_churn_user_id      ON crm_churn_predictions(user_id);
CREATE INDEX idx_crm_churn_risk         ON crm_churn_predictions(risk_level);
CREATE INDEX idx_crm_churn_probability  ON crm_churn_predictions(churn_probability DESC);
CREATE INDEX idx_crm_churn_intervention ON crm_churn_predictions(intervention_sent);
CREATE INDEX idx_crm_churn_created_at   ON crm_churn_predictions(created_at DESC);

-- ============================================================
-- MODULE 5: AUTOMATIONS LOG
-- ============================================================

CREATE TABLE public.crm_automations_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  automation_type   automation_type NOT NULL,
  trigger_name      automation_trigger NOT NULL,
  trigger_reason    TEXT,
  template_id       TEXT,
  template_name     TEXT,
  channel           automation_type NOT NULL,
  status            delivery_status NOT NULL DEFAULT 'pending',
  error_message     TEXT,
  sent_at           TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  opened_at         TIMESTAMPTZ,
  clicked_at        TIMESTAMPTZ,
  failed_at         TIMESTAMPTZ,
  metadata          JSONB DEFAULT '{}',
  produto           produto NOT NULL DEFAULT 'preceptormed',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crm_auto_lead_id       ON crm_automations_log(lead_id);
CREATE INDEX idx_crm_auto_user_id       ON crm_automations_log(user_id);
CREATE INDEX idx_crm_auto_trigger       ON crm_automations_log(trigger_name);
CREATE INDEX idx_crm_auto_status        ON crm_automations_log(status);
CREATE INDEX idx_crm_auto_created_at    ON crm_automations_log(created_at DESC);

-- ============================================================
-- REFERRAL PROGRAM
-- ============================================================

CREATE TABLE public.crm_referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code   TEXT NOT NULL UNIQUE,
  status          TEXT DEFAULT 'pending',
  tier            TEXT DEFAULT 'bronze',
  total_referrals INTEGER DEFAULT 0,
  reward_type     TEXT,
  reward_value    INTEGER,
  reward_applied  BOOLEAN DEFAULT FALSE,
  reward_applied_at TIMESTAMPTZ,
  produto         produto NOT NULL DEFAULT 'preceptormed',
  converted_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crm_referrals_referrer ON crm_referrals(referrer_id);
CREATE INDEX idx_crm_referrals_code     ON crm_referrals(referral_code);
CREATE INDEX idx_crm_referrals_status   ON crm_referrals(status);

-- ============================================================
-- A/B TESTS
-- ============================================================

CREATE TABLE public.crm_ab_tests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  status          TEXT DEFAULT 'draft',
  variant_a_name  TEXT NOT NULL DEFAULT 'Controle',
  variant_b_name  TEXT NOT NULL DEFAULT 'Variante',
  split_pct       INTEGER DEFAULT 50,
  metric_primary  TEXT,
  metric_goal     DECIMAL(8,4),
  variant_a_users     INTEGER DEFAULT 0,
  variant_a_conversions INTEGER DEFAULT 0,
  variant_b_users     INTEGER DEFAULT 0,
  variant_b_conversions INTEGER DEFAULT 0,
  winner          TEXT,
  produto         produto NOT NULL DEFAULT 'preceptormed',
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

CREATE TRIGGER set_crm_leads_updated_at
  BEFORE UPDATE ON crm_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_crm_churn_updated_at
  BEFORE UPDATE ON crm_churn_predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_crm_referrals_updated_at
  BEFORE UPDATE ON crm_referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION calculate_health_zone(score INTEGER)
RETURNS health_zone AS $$
BEGIN
  RETURN CASE
    WHEN score >= 80 THEN 'healthy'::health_zone
    WHEN score >= 60 THEN 'attention'::health_zone
    WHEN score >= 40 THEN 'risk'::health_zone
    ELSE 'critical'::health_zone
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION calculate_referral_tier(total INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN total >= 25 THEN 'elite'
    WHEN total >= 10 THEN 'diamond'
    WHEN total >= 5  THEN 'gold'
    WHEN total >= 3  THEN 'silver'
    ELSE 'bronze'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION calculate_risk_level(probability DECIMAL)
RETURNS risk_level AS $$
BEGIN
  RETURN CASE
    WHEN probability >= 0.80 THEN 'critical'::risk_level
    WHEN probability >= 0.60 THEN 'high'::risk_level
    WHEN probability >= 0.40 THEN 'medium'::risk_level
    ELSE 'low'::risk_level
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- ANALYTICAL VIEWS
-- ============================================================

CREATE OR REPLACE VIEW crm_funnel_kpis AS
SELECT
  produto_interesse AS produto,
  COUNT(*) FILTER (WHERE status = 'visitor')      AS visitors,
  COUNT(*) FILTER (WHERE status = 'signup')       AS signups,
  COUNT(*) FILTER (WHERE status = 'active_trial') AS active_trials,
  COUNT(*) FILTER (WHERE status = 'engaged')      AS engaged,
  COUNT(*) FILTER (WHERE status = 'subscriber')   AS subscribers,
  COUNT(*) FILTER (WHERE status = 'churned')      AS churned,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status != 'visitor') /
    NULLIF(COUNT(*) FILTER (WHERE status = 'visitor'), 0), 1) AS visitor_to_signup_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status IN ('engaged', 'subscriber')) /
    NULLIF(COUNT(*) FILTER (WHERE status = 'active_trial'), 0), 1) AS trial_to_engaged_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'subscriber') /
    NULLIF(COUNT(*) FILTER (WHERE status = 'engaged'), 0), 1) AS engaged_to_subscriber_pct
FROM crm_leads
GROUP BY produto_interesse;

CREATE OR REPLACE VIEW crm_health_distribution AS
SELECT
  produto, zone,
  COUNT(*) AS total,
  ROUND(AVG(score), 1) AS avg_score,
  ROUND(AVG(questoes_7d), 1) AS avg_questoes_7d,
  ROUND(AVG(acertos_pct), 1) AS avg_acertos_pct
FROM crm_health_scores
WHERE calculado_em >= NOW() - INTERVAL '24 hours'
GROUP BY produto, zone;

CREATE OR REPLACE VIEW crm_active_churn_risks AS
SELECT
  cp.*,
  l.email, l.nome, l.utm_source,
  hs.score AS health_score, hs.zone AS health_zone, hs.questoes_7d, hs.dias_ativos_14d
FROM crm_churn_predictions cp
LEFT JOIN crm_leads l ON l.user_id = cp.user_id
LEFT JOIN crm_health_scores hs ON hs.user_id = cp.user_id
  AND hs.calculado_em = (
    SELECT MAX(calculado_em) FROM crm_health_scores WHERE user_id = cp.user_id
  )
WHERE cp.outcome IS NULL AND cp.valid_until > NOW()
ORDER BY cp.churn_probability DESC;

CREATE OR REPLACE VIEW crm_automations_performance AS
SELECT
  trigger_name, automation_type, produto,
  COUNT(*) AS total_sent,
  COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
  COUNT(*) FILTER (WHERE status = 'opened')    AS opened,
  COUNT(*) FILTER (WHERE status = 'clicked')   AS clicked,
  COUNT(*) FILTER (WHERE status = 'failed')    AS failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE opened_at IS NOT NULL) /
    NULLIF(COUNT(*) FILTER (WHERE delivered_at IS NOT NULL), 0), 1) AS open_rate_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) /
    NULLIF(COUNT(*) FILTER (WHERE opened_at IS NOT NULL), 0), 1) AS click_rate_pct
FROM crm_automations_log
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY trigger_name, automation_type, produto
ORDER BY total_sent DESC;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE crm_leads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_funnel_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_health_scores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_churn_predictions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_automations_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_referrals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_ab_tests            ENABLE ROW LEVEL SECURITY;

-- Admin policies (using existing has_role function)
CREATE POLICY "Admins can manage crm_leads" ON crm_leads
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage crm_funnel_events" ON crm_funnel_events
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage crm_health_scores" ON crm_health_scores
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own health score" ON crm_health_scores
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage crm_churn_predictions" ON crm_churn_predictions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage crm_automations_log" ON crm_automations_log
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage crm_referrals" ON crm_referrals
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own referrals" ON crm_referrals
  FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Admins can manage crm_ab_tests" ON crm_ab_tests
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
