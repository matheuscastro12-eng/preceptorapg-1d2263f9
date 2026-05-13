-- pending_checkouts: registra "intencao de checkout" antes do redirect pro EasyFlow.
-- O webhook usa essa tabela como ponte pra identificar o user mesmo quando o
-- pagamento eh feito com cartao de terceiro (pai, mae, etc.) — caso onde
-- nem email no payload, nem holderName batem com o profile do estudante.

create table if not exists public.pending_checkouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  offer_id text not null,        -- UUID do produto/oferta na EasyFlow
  plan_hint text,                -- 'monthly' | 'annual' | 'biannual' | 'roulette' etc.
  source text,                   -- 'pricing' | 'landing' | 'roulette' | 'paywall' etc.
  created_at timestamptz not null default now(),
  linked_at timestamptz,         -- preenchido quando o webhook resolve este checkout
  payment_id text                -- paymentId da EasyFlow que resolveu este checkout
);

create index if not exists pending_checkouts_user_created_idx
  on public.pending_checkouts(user_id, created_at desc);

create index if not exists pending_checkouts_offer_created_idx
  on public.pending_checkouts(offer_id, created_at desc)
  where linked_at is null;

alter table public.pending_checkouts enable row level security;

-- Usuario pode criar/ver as proprias intencoes
drop policy if exists "users insert own checkout intent" on public.pending_checkouts;
create policy "users insert own checkout intent"
  on public.pending_checkouts
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "users see own checkout intents" on public.pending_checkouts;
create policy "users see own checkout intents"
  on public.pending_checkouts
  for select
  using (auth.uid() = user_id);

-- service_role bypassa RLS automaticamente (edge functions)
