-- Phase 0: Foundations pra modulos Clinica (Whitebook + Scribe).
-- So infra de gate granular + tabelas-base. Sem features novas ainda.

-- ============================================================
-- 1) wb_user_favorites — favoritos do user no Whitebook
-- ============================================================
-- Tabela leve, user-side. Testa migration sem impacto em conteudo.
-- Vai ser usada quando paginas detalhadas do Whitebook (Phases 1+)
-- ganham botao "favoritar".
CREATE TABLE public.wb_user_favorites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 'drug' | 'protocol' | 'calculator' | 'icd10'
  resource_type text NOT NULL CHECK (resource_type IN ('drug','protocol','calculator','icd10')),
  -- ID textual: uuid pra drug/protocol/calculator (slug ou id), code pra icd10
  resource_id   text NOT NULL,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, resource_type, resource_id)
);

CREATE INDEX idx_wb_favs_user ON public.wb_user_favorites (user_id, resource_type);

ALTER TABLE public.wb_user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_select_own_favorites"
  ON public.wb_user_favorites FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "user_insert_own_favorites"
  ON public.wb_user_favorites FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_delete_own_favorites"
  ON public.wb_user_favorites FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "user_update_own_favorites"
  ON public.wb_user_favorites FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE public.wb_user_favorites IS
  'Favoritos do user no Whitebook (drogas, protocolos, calculadoras, CID-10). RLS owner-only.';

-- ============================================================
-- 2) scribe_beta_invites — controle do beta fechado
-- ============================================================
-- Lista de medicos autorizados a usar o Scribe Clinico durante o beta
-- fechado. Populada manualmente (admin INSERT). useFeatureAccess('scribe')
-- checa se existe linha aqui pra liberar o modulo.
--
-- Quando o beta amadurecer, pode virar tier de assinatura ou abrir geral.
CREATE TABLE public.scribe_beta_invites (
  user_id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at       timestamptz NOT NULL DEFAULT now(),
  -- ToS especifico do Scribe (LGPD/CFM/responsabilidade) aceito quando?
  tos_accepted_at  timestamptz,
  -- Notas do admin (ex: "convidado via Luciano FMIT", "residente R3 cardio")
  notes            text,
  -- Configuracoes pessoais default
  audio_retention_days smallint NOT NULL DEFAULT 30
    CHECK (audio_retention_days IN (1, 7, 30, 60, 90)),
  -- Setting opcional pra desligar prescricao mesmo tendo o modulo
  prescription_enabled boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_scribe_invites_invited_at ON public.scribe_beta_invites (invited_at DESC);

ALTER TABLE public.scribe_beta_invites ENABLE ROW LEVEL SECURITY;

-- User pode VER seu proprio convite (pra useFeatureAccess) e ATUALIZAR
-- settings pessoais (retention, ToS aceite).
CREATE POLICY "user_select_own_invite"
  ON public.scribe_beta_invites FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_update_own_invite_settings"
  ON public.scribe_beta_invites FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- INSERT/DELETE so via service_role (admin manual). Sem policies pra
-- authenticated cobrirem isso.

CREATE TRIGGER tg_scribe_invites_updated
  BEFORE UPDATE ON public.scribe_beta_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.scribe_beta_invites IS
  'Lista de medicos autorizados no beta fechado do Scribe Clinico. INSERT manual via admin (service role). User vê o proprio + edita settings (retencao, ToS).';
