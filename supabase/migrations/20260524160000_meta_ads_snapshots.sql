-- ────────────────────────────────────────────────────────────────
-- meta_ads_snapshots — histórico diário de performance do Meta Ads
--
-- Gravado pela edge function meta-ads-daily (cron). Serve para:
--   - gráfico de tendência no dashboard (/admin/crm-mkt/ads)
--   - comparação dia-a-dia / 7d no e-mail diário (alertas de CPL subindo)
--   - histórico próprio, independente da API do Meta
--
-- Leitura: somente via service_role (edge functions) / admins.
-- ────────────────────────────────────────────────────────────────

create table if not exists public.meta_ads_snapshots (
  id                uuid primary key default gen_random_uuid(),
  data              date not null,                 -- dia de referência (insights daquele dia)
  account_id        text not null,
  spend             numeric(14,2) not null default 0,
  impressions       bigint not null default 0,
  clicks            bigint not null default 0,
  reach             bigint not null default 0,
  ctr               numeric(8,4) not null default 0,   -- %
  cpc               numeric(12,4) not null default 0,   -- R$
  cpm               numeric(12,4) not null default 0,   -- R$
  leads             integer not null default 0,         -- conversões (pixel lead/registration)
  cpl               numeric(12,2) not null default 0,    -- custo por lead (spend/leads)
  campaigns         jsonb not null default '[]',         -- breakdown por campanha do dia
  created_at        timestamptz not null default now(),
  unique (data, account_id)
);

create index if not exists meta_ads_snapshots_data_idx on public.meta_ads_snapshots (data desc);

alter table public.meta_ads_snapshots enable row level security;

-- Mesmo padrão admin das demais tabelas (has_role) com fallback authenticated.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role') THEN
    EXECUTE $pol$
      CREATE POLICY "Admins read meta_ads" ON public.meta_ads_snapshots
        FOR ALL TO authenticated
        USING (has_role(auth.uid(), 'admin'))
        WITH CHECK (has_role(auth.uid(), 'admin'))
    $pol$;
  ELSE
    EXECUTE $pol$
      CREATE POLICY "Authenticated meta_ads" ON public.meta_ads_snapshots
        FOR ALL TO authenticated USING (true) WITH CHECK (true)
    $pol$;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

comment on table public.meta_ads_snapshots is
  'Snapshot diário de performance do Meta Ads (gravado pelo cron meta-ads-daily).';
