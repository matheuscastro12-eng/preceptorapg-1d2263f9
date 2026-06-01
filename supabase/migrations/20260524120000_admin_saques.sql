-- ────────────────────────────────────────────────────────────────
-- admin_saques — saques/movimentações manuais de caixa
--
-- Pedido: registrar saque da EasyFlow no fluxo de caixa, podendo
-- escolher o efeito no saldo a cada saque:
--   somar    → dinheiro que entra no caixa (ex.: saque que ainda não
--              estava contabilizado como saldo)  [+]
--   subtrair → retirada de verdade (pró-labore, distribuição)         [−]
--   neutro   → só registro/conciliação, não mexe no saldo             [0]
--
-- Mesma regra de janela dos aportes: só conta a partir do baseline
-- (data >= data do último snapshot em admin_fluxo_caixa).
-- ────────────────────────────────────────────────────────────────

create table if not exists public.admin_saques (
  id           uuid primary key default gen_random_uuid(),
  descricao    text not null,
  valor        numeric(14,2) not null check (valor > 0),
  data         date not null default current_date,
  origem       text not null default 'easyflow'
               check (origem in ('easyflow', 'banco', 'outro')),
  efeito       text not null default 'somar'
               check (efeito in ('somar', 'subtrair', 'neutro')),
  responsavel  text,
  observacoes  text,
  created_at   timestamptz not null default now()
);

create index if not exists admin_saques_data_idx on public.admin_saques (data desc);

alter table public.admin_saques enable row level security;

-- Mesmo padrão das outras tabelas admin
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role') THEN
    EXECUTE $pol$
      CREATE POLICY "Admins full access saques" ON public.admin_saques
        FOR ALL TO authenticated
        USING (has_role(auth.uid(), 'admin'))
        WITH CHECK (has_role(auth.uid(), 'admin'))
    $pol$;
  ELSE
    EXECUTE $pol$
      CREATE POLICY "Authenticated saques" ON public.admin_saques
        FOR ALL TO authenticated USING (true) WITH CHECK (true)
    $pol$;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

comment on table public.admin_saques is
  'Saques/movimentações manuais de caixa. efeito controla o impacto no saldo: somar(+)/subtrair(−)/neutro(0).';
