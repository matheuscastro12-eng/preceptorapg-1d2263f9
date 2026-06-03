-- Tabela de sincronização Meta Ads (ponte via MCP do Claude).
-- O Claude puxa os números do Meta Ads (somente leitura) e grava o payload
-- aqui; a edge function `meta-ads` lê a linha mais recente quando não há
-- token Graph API configurado. RLS habilitada sem policy de cliente: só o
-- service_role (edge function) lê. Idempotente.

create table if not exists public.meta_ads_sync (
  id uuid primary key default gen_random_uuid(),
  account_id text,
  period text not null default 'last_30d',
  payload jsonb not null,
  synced_at timestamptz not null default now()
);

alter table public.meta_ads_sync enable row level security;

create index if not exists idx_meta_ads_sync_synced_at
  on public.meta_ads_sync (synced_at desc);
