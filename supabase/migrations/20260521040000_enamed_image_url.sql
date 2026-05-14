-- Adiciona coluna imagem_url em enamed_questions pra hospedar imagens
-- extraidas dos PDFs (ECG, RX, fluxogramas, tabelas) das questoes
-- Revalida que tem grafico/figura embutido no enunciado.

alter table public.enamed_questions
  add column if not exists imagem_url text;

comment on column public.enamed_questions.imagem_url is 'URL publica da imagem (Supabase Storage) quando a questao tem ECG/RX/grafico/tabela embutido no enunciado.';
