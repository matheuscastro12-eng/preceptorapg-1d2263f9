-- Landing funnel analytics
-- Rastreia visitantes na landing pra entender onde param, onde convertem,
-- quais secoes engajam mais. Insert-only pelo anon key.

CREATE TABLE IF NOT EXISTS landing_events (
  id BIGSERIAL PRIMARY KEY,
  visitor_id UUID NOT NULL,
  session_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'page_view',       -- entrou na landing
    'section_view',    -- seccao entrou na viewport (dwell iniciado)
    'section_exit',    -- seccao saiu da viewport (dwell fechado, tem duration_ms)
    'cta_click',       -- clicou em um CTA
    'scroll_depth',    -- marcos 25/50/75/100%
    'conversion',      -- concluiu signup ou foi pra /auth
    'page_exit'        -- saiu da landing (beforeunload)
  )),
  section TEXT,                           -- identificador da secao (hero, recursos, ...)
  cta_id TEXT,                            -- identificador do CTA (start-free, pricing, ...)
  duration_ms INT,                        -- tempo dentro da secao (pra section_exit)
  scroll_pct INT CHECK (scroll_pct BETWEEN 0 AND 100),
  viewport_w INT,
  viewport_h INT,
  path TEXT,                              -- path atual (normalmente '/')
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes pro dashboard
CREATE INDEX IF NOT EXISTS idx_landing_events_session ON landing_events(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_landing_events_type ON landing_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_landing_events_section ON landing_events(section) WHERE section IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_landing_events_created ON landing_events(created_at);

-- RLS: qualquer um (anon) pode inserir. Apenas admin CRM le.
ALTER TABLE landing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS landing_events_anyone_insert ON landing_events;
CREATE POLICY landing_events_anyone_insert
  ON landing_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS landing_events_crm_read ON landing_events;
CREATE POLICY landing_events_crm_read
  ON landing_events FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE landing_events IS
  'Eventos de analytics da landing page pra medir funil de conversao.
   Insert-only pelo anon; leitura via CRM autenticado.';

-- View de resumo: funil por sessao
-- Quantos visitantes passaram por cada etapa nas ultimas 24h
CREATE OR REPLACE VIEW landing_funnel_daily AS
SELECT
  date_trunc('day', created_at) AS day,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view') AS sessions,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'section_view' AND section = 'recursos') AS viewed_recursos,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'section_view' AND section = 'como-funciona') AS viewed_como_funciona,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'section_view' AND section = 'depoimentos') AS viewed_depoimentos,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'section_view' AND section = 'precos') AS viewed_precos,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'cta_click') AS any_cta_click,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'conversion') AS conversions
FROM landing_events
WHERE created_at >= NOW() - INTERVAL '60 days'
GROUP BY 1
ORDER BY 1 DESC;

GRANT SELECT ON landing_funnel_daily TO authenticated;

-- View: tempo medio por secao
CREATE OR REPLACE VIEW landing_section_dwell AS
SELECT
  section,
  COUNT(*) AS views,
  COUNT(DISTINCT session_id) AS unique_sessions,
  ROUND(AVG(duration_ms) FILTER (WHERE duration_ms > 0 AND duration_ms < 600000))::INT AS avg_dwell_ms,
  ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY duration_ms) FILTER (WHERE duration_ms > 0))::INT AS median_dwell_ms
FROM landing_events
WHERE event_type = 'section_exit'
  AND created_at >= NOW() - INTERVAL '30 days'
  AND section IS NOT NULL
GROUP BY section
ORDER BY views DESC;

GRANT SELECT ON landing_section_dwell TO authenticated;
