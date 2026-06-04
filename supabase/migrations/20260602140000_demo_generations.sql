-- Rate-limit do "experimente sem cadastro" (edge function demo-fechamento).
-- Guarda IP + tema por geração demo, p/ limitar 2/IP/24h + cap global diário.
create table if not exists public.demo_generations (
  id uuid primary key default gen_random_uuid(),
  ip text,
  tema text,
  created_at timestamptz not null default now()
);
create index if not exists idx_demo_gen_ip_time on public.demo_generations (ip, created_at desc);
alter table public.demo_generations enable row level security;
-- Sem policy de cliente: só o service_role (edge function) lê/escreve.
