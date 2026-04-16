-- Anotações (marca-texto + comentários) em trechos do resumo gerado
-- Cada anotação referencia um fechamento (resumo) e guarda o texto selecionado literalmente
-- para permitir re-aplicação determinística via string match na renderização.

CREATE TABLE IF NOT EXISTS fechamento_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fechamento_id UUID NOT NULL REFERENCES fechamentos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_text TEXT NOT NULL CHECK (char_length(selected_text) BETWEEN 1 AND 500),
  comment TEXT CHECK (comment IS NULL OR char_length(comment) BETWEEN 1 AND 2000),
  color TEXT NOT NULL DEFAULT 'yellow' CHECK (color IN ('yellow', 'green', 'blue', 'pink')),
  -- Ordem aproximada de aparição no texto — util pra resolver matches ambiguos
  occurrence_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fechamento_annotations_fechamento
  ON fechamento_annotations(fechamento_id);
CREATE INDEX IF NOT EXISTS idx_fechamento_annotations_user
  ON fechamento_annotations(user_id);

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION update_fechamento_annotations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fechamento_annotations_updated_at ON fechamento_annotations;
CREATE TRIGGER trg_fechamento_annotations_updated_at
  BEFORE UPDATE ON fechamento_annotations
  FOR EACH ROW EXECUTE FUNCTION update_fechamento_annotations_updated_at();

-- RLS — apenas o dono da anotação pode ver/modificar
ALTER TABLE fechamento_annotations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fechamento_annotations_select_own ON fechamento_annotations;
CREATE POLICY fechamento_annotations_select_own
  ON fechamento_annotations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS fechamento_annotations_insert_own ON fechamento_annotations;
CREATE POLICY fechamento_annotations_insert_own
  ON fechamento_annotations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS fechamento_annotations_update_own ON fechamento_annotations;
CREATE POLICY fechamento_annotations_update_own
  ON fechamento_annotations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS fechamento_annotations_delete_own ON fechamento_annotations;
CREATE POLICY fechamento_annotations_delete_own
  ON fechamento_annotations FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE fechamento_annotations IS
  'Marca-texto e comentarios que estudantes adicionam em trechos dos resumos gerados por IA.';
