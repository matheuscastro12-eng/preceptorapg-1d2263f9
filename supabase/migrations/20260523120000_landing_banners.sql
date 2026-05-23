-- ────────────────────────────────────────────────────────────────
-- landing_banners — CMS de banners rotativos da home
-- Pedido do time de MKT (Relatorio Site Preceptor)
-- ────────────────────────────────────────────────────────────────

create table if not exists public.landing_banners (
  id            uuid primary key default gen_random_uuid(),
  title         text,                                              -- headline opcional (sobreposta na imagem)
  subtitle      text,                                              -- subhead opcional
  image_url     text not null,                                     -- URL da imagem (storage publico ou externa)
  cta_label     text not null default 'Saiba mais',                -- texto do botao
  cta_link      text not null,                                     -- destino (path interno preferido, ex: /auth?tab=signup)
  link_target   text not null default 'same'
                check (link_target in ('same', 'new')),            -- 'same' = mesma aba (default por pedido do MKT), 'new' = nova
  ordem         int not null default 0,                            -- ordem de exibicao (asc)
  ativo         boolean not null default true,                     -- toggle on/off sem deletar
  starts_at     timestamptz,                                       -- janela de inicio (null = sempre)
  ends_at       timestamptz,                                       -- janela de fim (null = sempre)
  audience      text not null default 'all'
                check (audience in ('all', 'visitors', 'free', 'paid')),
                                                                   -- 'all' = todo mundo
                                                                   -- 'visitors' = nao logado (Landing publica)
                                                                   -- 'free' = logado sem plano pago
                                                                   -- 'paid' = logado com plano ativo
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id) on delete set null
);

comment on table public.landing_banners is
  'Banners rotativos da home do site. Gerenciados via /admin/crm-mkt/banners pelo time de MKT.';

create index if not exists idx_landing_banners_ativo_ordem
  on public.landing_banners (ativo, ordem) where ativo = true;

create index if not exists idx_landing_banners_audience
  on public.landing_banners (audience) where ativo = true;

-- Trigger pra manter updated_at
create or replace function public.touch_landing_banners_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_landing_banners_updated_at on public.landing_banners;
create trigger trg_landing_banners_updated_at
  before update on public.landing_banners
  for each row execute function public.touch_landing_banners_updated_at();

-- ── RLS ──
alter table public.landing_banners enable row level security;

-- SELECT publico: so banners ativos dentro da janela aparecem
drop policy if exists "landing banners visiveis quando ativos" on public.landing_banners;
create policy "landing banners visiveis quando ativos"
  on public.landing_banners
  for select
  to anon, authenticated
  using (
    ativo = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

-- INSERT/UPDATE/DELETE: bloqueado por padrao no client.
-- Toda escrita passa pelo crm-admin-actions edge function (service_role bypassa RLS).
-- Nao criamos policy de write — service_role nao precisa, anon/authenticated nao deve mexer.

-- ────────────────────────────────────────────────────────────────
-- Storage bucket: landing-banners (publico, write via service_role)
-- ────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'landing-banners',
  'landing-banners',
  true,
  10485760,                                                        -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read no bucket
drop policy if exists "landing-banners leitura publica" on storage.objects;
create policy "landing-banners leitura publica"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'landing-banners');

-- Escrita restrita a service_role (sem policy explicita, service_role bypassa).
-- Authenticated nao pode upar direto — usa edge function que valida o token CRM.
