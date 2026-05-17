-- Integra admin_receitas com EasyFlow.
-- Antes: tabela era so manualmente populada via /admin/crm-admin/receita.
-- Agora: o webhook easyflow-webhook insere uma linha a cada order.paid /
-- subscriptionrecurrence.paid (ja deduplicado por payment_id).

-- 1) Adiciona 'easyflow' ao enum receita_origem
do $$
begin
  alter type receita_origem add value if not exists 'easyflow';
exception
  when duplicate_object then null;
end $$;

-- 2) Colunas de rastreabilidade
alter table public.admin_receitas
  add column if not exists payment_id text,
  add column if not exists order_id text,
  add column if not exists event_type text;

-- 3) Dedup forte por payment_id (cada cobranca da EasyFlow tem id unico).
-- Indice parcial — manuais ficam NULL e nao sao afetados.
create unique index if not exists admin_receitas_payment_id_uq
  on public.admin_receitas(payment_id)
  where payment_id is not null;

-- 4) Indice de busca rapida por usuario_id (uso ja vinha no relatorio)
create index if not exists admin_receitas_usuario_id_idx
  on public.admin_receitas(usuario_id);

comment on column public.admin_receitas.payment_id is 'EasyFlow payment id — usado pra dedup (UNIQUE). Manual = null.';
comment on column public.admin_receitas.order_id is 'EasyFlow order id quando aplicavel.';
comment on column public.admin_receitas.event_type is 'Webhook event que originou (order.paid, subscriptionrecurrence.paid, etc).';
