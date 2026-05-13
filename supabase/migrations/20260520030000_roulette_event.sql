-- Roleta da Semana Médica de Itajubá (e eventos futuros)
-- 1 spin por email, prêmio determinado server-side, prêmios fixos.

create table if not exists public.roulette_spins (
  id uuid primary key default gen_random_uuid(),
  -- Identificação do participante
  email text not null,
  full_name text not null,
  faculdade text,
  phone text,
  user_id uuid references auth.users(id) on delete set null,

  -- Evento (permite reutilizar a estrutura em futuros eventos)
  event_slug text not null default 'semana-itajuba',

  -- Prêmio
  prize text not null check (prize in ('chaveiro', 'desconto_30', 'desconto_50', 'mensal_gratis')),
  prize_label text not null,
  coupon_code text,             -- código do cupom (se aplicável)
  redemption_code text not null default substr(md5(random()::text), 1, 8),
                                -- código para retirar chaveiro no estande / referência

  -- Status de entrega
  delivered_at timestamptz,     -- chaveiro: marcado pelo organizador no estande
                                -- mensal: marcado quando o free_access é aplicado
                                -- cupons: nunca (são auto-aplicáveis)

  -- Auditoria
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Garante 1 spin por email POR EVENTO (permite participar de eventos futuros)
create unique index if not exists roulette_spins_email_event_uniq
  on public.roulette_spins (lower(email), event_slug);

-- Index para buscar por redemption_code (consulta no estande)
create index if not exists roulette_spins_redemption_code_idx
  on public.roulette_spins (redemption_code);

-- Index para queries de dashboard / contagem por prêmio
create index if not exists roulette_spins_event_prize_idx
  on public.roulette_spins (event_slug, prize);

-- RLS: somente service_role escreve. Leitura é admin-only.
alter table public.roulette_spins enable row level security;

create policy "roulette_spins admin select"
  on public.roulette_spins for select
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.role = 'admin'
    )
  );

-- Inserções vêm SOMENTE da edge function via service_role (que bypassa RLS).
-- Nenhuma policy de INSERT — bloqueia inserção via cliente comum.

comment on table public.roulette_spins is
  'Sorteios de roleta em eventos presenciais. Inserções somente via edge function roulette-spin (service_role).';
