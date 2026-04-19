-- Adiciona colunas para salvar provas/simulados na tabela fechamentos
-- (useExamGenerator.saveToLibrary já tenta inserir esses campos mas falhava
-- silenciosamente porque colunas não existiam).

ALTER TABLE fechamentos
  ADD COLUMN IF NOT EXISTS tipo text,
  ADD COLUMN IF NOT EXISTS exam_config jsonb;

-- Indexa tipo pra filtrar na biblioteca (prova / caso_clinico / fechamento default)
CREATE INDEX IF NOT EXISTS idx_fechamentos_tipo ON fechamentos(user_id, tipo);

COMMENT ON COLUMN fechamentos.tipo IS
  'Tipo do conteudo: fechamento (padrao, default null), prova (simulado), caso_clinico.';
COMMENT ON COLUMN fechamentos.exam_config IS
  'Config do simulado quando tipo=prova/caso_clinico: { quantidade, nivel, simulationMode }.';
