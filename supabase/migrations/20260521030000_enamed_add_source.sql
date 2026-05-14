-- Adiciona campo 'source' em enamed_questions pra distinguir banco
-- entre ENAMED original e Revalida (e potencialmente outras provas).
-- Mantem compat com queries existentes via default 'enamed'.

alter table public.enamed_questions
  add column if not exists source text not null default 'enamed';

create index if not exists enamed_questions_source_idx
  on public.enamed_questions(source);

-- Constraint composta: mesma numeracao pode existir em ano/source diferentes
-- (Revalida 1 ≠ ENAMED 1). Usa unique index parcial.
create unique index if not exists enamed_questions_source_ano_numero_uq
  on public.enamed_questions(source, ano, numero);

comment on column public.enamed_questions.source is 'origem da questao: enamed | revalida | manual';
