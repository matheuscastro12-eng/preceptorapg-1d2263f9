-- Aportes / Investimentos: entradas pontuais de capital no caixa
-- (investimento dos sócios, captação, empréstimo, etc). Antes não havia
-- onde registrar — o saldo só vinha de admin_fluxo_caixa (snapshot manual)
-- e isso não refletia certinho no fluxo.

create table if not exists public.admin_aportes (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  valor numeric(14,2) not null check (valor > 0),
  data date not null default current_date,
  tipo text not null default 'investimento'
    check (tipo in ('investimento', 'emprestimo', 'captacao', 'reembolso', 'outro')),
  responsavel text,
  observacoes text,
  created_at timestamptz not null default now()
);

create index if not exists admin_aportes_data_idx on public.admin_aportes (data desc);

alter table public.admin_aportes enable row level security;

-- Mesmo padrão das outras tabelas admin: acesso total para admins
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'has_role'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Admins full access aportes" ON public.admin_aportes
        FOR ALL TO authenticated
        USING (has_role(auth.uid(), 'admin'))
        WITH CHECK (has_role(auth.uid(), 'admin'))
    $pol$;
  ELSE
    -- fallback: qualquer authenticated (mesma postura de outras tabelas admin antigas)
    EXECUTE $pol$
      CREATE POLICY "Authenticated aportes" ON public.admin_aportes
        FOR ALL TO authenticated USING (true) WITH CHECK (true)
    $pol$;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

comment on table public.admin_aportes is
  'Entradas pontuais de capital (investimento, emprestimo, captacao). Somadas ao saldo no fluxo de caixa.';
