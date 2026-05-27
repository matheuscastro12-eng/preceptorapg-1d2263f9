-- ────────────────────────────────────────────────────────────────
-- flashcards.tema / flashcards.secao — hierarquia Doença → Subseção
--
-- Antes: o gerador preenchia `area` com valores inconsistentes
-- (especialidade, doença ou subseção) e a UI agrupava por isso,
-- gerando decks confusos no nível raiz. Agora:
--   tema  → "Insuficiência Cardíaca" (doença/tema principal)
--   secao → "Fisiopatologia" (subseção dentro do tema)
--
-- Cards antigos ficam com tema/secao NULL e continuam funcionando
-- via fallback para source_id / area no client.
-- ────────────────────────────────────────────────────────────────

alter table public.flashcards
  add column if not exists tema  text,
  add column if not exists secao text;

comment on column public.flashcards.tema is
  'Tema principal do flashcard (doença, condição, sistema). Cards antigos têm NULL — agrupam-se por source_id/area no fallback.';

comment on column public.flashcards.secao is
  'Subseção dentro do tema: Fisiopatologia, Tratamento, Diagnóstico, etc. NULL para cards legacy.';

-- Index para a UI agrupar rapidamente por tema do usuário
create index if not exists idx_flashcards_user_tema
  on public.flashcards (user_id, tema)
  where tema is not null;

-- Index para revisar todos os cards de um tema específico ordenados por next_review
create index if not exists idx_flashcards_user_tema_review
  on public.flashcards (user_id, tema, next_review)
  where tema is not null;
