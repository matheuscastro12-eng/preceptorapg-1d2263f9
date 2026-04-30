-- Phase 3: Scribe Clinico — gravacao de consulta -> transcricao -> SOAP.
--
-- Compliance:
-- - LGPD Art. 11 (dado sensivel de saude): consentimento expresso registrado
--   em consulta_consents; retencao configuravel; audit log completo.
-- - CFM 1.821/2007 e 2.299/2021 (prontuario): assinatura eletronica do medico
--   via HMAC; status 'aprovada' so apos revisao explicita.
-- - Paciente nunca eh identificado em claro: paciente_anonimo_id eh hash
--   SHA-256 de {nome_completo+nascimento}; paciente_alias eh apelido livre
--   sem PII (ex: "JM, 62a, HAS").

-- ============================================================
-- consultas — cabecalho da consulta
-- ============================================================
CREATE TABLE public.consultas (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Hash SHA-256 do {nome+nascimento} fornecido pelo medico (NUNCA o nome em claro)
  paciente_anonimo_id      text,
  -- Apelido livre escolhido pelo medico (sem PII direta)
  paciente_alias           text NOT NULL,
  data_consulta            timestamptz NOT NULL DEFAULT now(),
  -- Pipeline status
  status                   text NOT NULL DEFAULT 'gravando'
    CHECK (status IN ('gravando','transcrevendo','estruturando','pendente_revisao','aprovada','arquivada','erro')),
  status_message           text,
  -- Audio (Storage privado)
  audio_storage_path       text,
  audio_duration_s         integer,
  audio_size_bytes         integer,
  -- Resultado da transcricao
  transcript               text,
  transcript_segments      jsonb DEFAULT '[]'::jsonb,
  -- SOAP estruturado (S/O/A — P em fase 4)
  soap_jsonb               jsonb DEFAULT '{}'::jsonb,
  -- DDx + exames + prescricao (Phase 4)
  ddx_jsonb                jsonb DEFAULT '[]'::jsonb,
  exames_jsonb             jsonb DEFAULT '[]'::jsonb,
  prescricao_jsonb         jsonb DEFAULT '[]'::jsonb,
  -- Validacao do medico
  validated_by_md          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  validated_at             timestamptz,
  -- HMAC-SHA256 de {transcript+soap_jsonb+timestamp} — assinatura eletronica simples
  validation_signature     text,
  -- Retencao
  retencao_audio_ate       date,    -- quando audio sera purgado
  audio_purged_at          timestamptz,
  -- Custos / metrics
  transcription_cost_usd   numeric(10,4),
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_consultas_user_data    ON public.consultas (user_id, data_consulta DESC);
CREATE INDEX idx_consultas_status       ON public.consultas (status);
CREATE INDEX idx_consultas_retencao     ON public.consultas (retencao_audio_ate) WHERE audio_purged_at IS NULL AND audio_storage_path IS NOT NULL;

ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_select_own_consultas"
  ON public.consultas FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "user_insert_own_consultas"
  ON public.consultas FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_update_own_consultas"
  ON public.consultas FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_delete_own_consultas"
  ON public.consultas FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER tg_consultas_updated
  BEFORE UPDATE ON public.consultas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.consultas IS
  'Consultas medicas gravadas pelo Scribe. Compliance LGPD Art. 11 (dado sensivel): consentimento + retencao + audit. CFM: prontuario assinado eletronicamente pelo medico via HMAC apos revisao.';

-- ============================================================
-- consulta_audit_log — append-only, capturado por trigger
-- ============================================================
CREATE TABLE public.consulta_audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id     uuid NOT NULL REFERENCES public.consultas(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Acoes possiveis: create, update, validate, view_audio, export_pdf,
  -- delete_audio, restore_audio, share, status_change
  action          text NOT NULL,
  before_jsonb    jsonb,
  after_jsonb     jsonb,
  ip              text,
  user_agent      text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_consulta_audit_consulta ON public.consulta_audit_log (consulta_id, created_at DESC);
CREATE INDEX idx_consulta_audit_user     ON public.consulta_audit_log (user_id, created_at DESC);

ALTER TABLE public.consulta_audit_log ENABLE ROW LEVEL SECURITY;

-- Medico ve apenas log das proprias consultas. Admin (compliance) ve tudo.
CREATE POLICY "user_select_own_consulta_audit"
  ON public.consulta_audit_log FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.consultas c
      WHERE c.id = consulta_audit_log.consulta_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "admin_select_all_consulta_audit"
  ON public.consulta_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- INSERT vem so via service_role (edge functions) ou trigger interno.
-- Sem policy de INSERT pra authenticated — bloqueio explicito.

COMMENT ON TABLE public.consulta_audit_log IS
  'Log append-only de todas as acoes em consultas. Inserido apenas via service_role/triggers. Medico ve proprio log; admin ve tudo (compliance).';

-- Trigger automatico: registra create/update em consultas
CREATE OR REPLACE FUNCTION public.consulta_audit_capture()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  action_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_name := 'create';
    INSERT INTO public.consulta_audit_log (consulta_id, user_id, action, after_jsonb)
    VALUES (NEW.id, NEW.user_id, action_name, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    -- Distingue acoes especificas
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      action_name := 'status_change';
    ELSIF NEW.validated_at IS DISTINCT FROM OLD.validated_at AND NEW.validated_at IS NOT NULL THEN
      action_name := 'validate';
    ELSIF NEW.audio_purged_at IS DISTINCT FROM OLD.audio_purged_at AND NEW.audio_purged_at IS NOT NULL THEN
      action_name := 'delete_audio';
    ELSE
      action_name := 'update';
    END IF;
    INSERT INTO public.consulta_audit_log (consulta_id, user_id, action, before_jsonb, after_jsonb)
    VALUES (NEW.id, NEW.user_id, action_name, to_jsonb(OLD), to_jsonb(NEW));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_consulta_audit
  AFTER INSERT OR UPDATE ON public.consultas
  FOR EACH ROW EXECUTE FUNCTION public.consulta_audit_capture();

-- ============================================================
-- consulta_consents — termo do paciente
-- ============================================================
CREATE TABLE public.consulta_consents (
  id                                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id                        uuid NOT NULL UNIQUE REFERENCES public.consultas(id) ON DELETE CASCADE,
  paciente_consent_audio             boolean NOT NULL DEFAULT false,
  paciente_consent_pdf               boolean NOT NULL DEFAULT false,
  paciente_consent_compartilhamento_ia boolean NOT NULL DEFAULT false,
  -- Como o consentimento foi obtido
  consent_method                     text NOT NULL CHECK (consent_method IN (
    'verbal_gravado',           -- gravado no proprio audio (mais robusto)
    'assinatura_digital',
    'formulario_papel_arquivado',
    'testemunha'
  )),
  consent_signature_hash             text,
  -- Em modo verbal_gravado, indica em que segundo do audio esta o consentimento
  consent_recorded_at_offset_s       integer,
  paciente_alias                     text,
  -- Revogacao (LGPD: paciente pode revogar a qualquer tempo)
  revogado_em                        timestamptz,
  revogacao_motivo                   text,
  captured_at                        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_consulta_consents_consulta ON public.consulta_consents (consulta_id);

ALTER TABLE public.consulta_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_select_own_consents"
  ON public.consulta_consents FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.consultas c
      WHERE c.id = consulta_consents.consulta_id AND c.user_id = auth.uid()
    )
  );
CREATE POLICY "user_insert_own_consents"
  ON public.consulta_consents FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.consultas c
      WHERE c.id = consulta_consents.consulta_id AND c.user_id = auth.uid()
    )
  );
CREATE POLICY "user_update_own_consents"
  ON public.consulta_consents FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.consultas c
      WHERE c.id = consulta_consents.consulta_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.consultas c
      WHERE c.id = consulta_consents.consulta_id AND c.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.consulta_consents IS
  'Consentimento do paciente por consulta. LGPD Art. 11 (dado sensivel de saude). Revogavel a qualquer tempo (revogado_em).';

-- ============================================================
-- Storage bucket — consultas-audio
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('consultas-audio', 'consultas-audio', false)
ON CONFLICT (id) DO NOTHING;

-- Path convention: {user_id}/{consulta_id}/audio.webm

DROP POLICY IF EXISTS "user_upload_own_consulta_audio" ON storage.objects;
CREATE POLICY "user_upload_own_consulta_audio"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'consultas-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "user_read_own_consulta_audio" ON storage.objects;
CREATE POLICY "user_read_own_consulta_audio"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'consultas-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "user_delete_own_consulta_audio" ON storage.objects;
CREATE POLICY "user_delete_own_consulta_audio"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'consultas-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- Funcao pra atualizar retencao_audio_ate ao criar/editar consulta
-- baseado no setting do user em scribe_beta_invites.audio_retention_days
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_consulta_retencao()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  retention_days integer;
BEGIN
  IF NEW.retencao_audio_ate IS NULL AND NEW.data_consulta IS NOT NULL THEN
    SELECT audio_retention_days INTO retention_days
      FROM public.scribe_beta_invites WHERE user_id = NEW.user_id;
    IF retention_days IS NULL THEN
      retention_days := 30;  -- fallback default
    END IF;
    NEW.retencao_audio_ate := (NEW.data_consulta::date + retention_days);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_consultas_set_retencao
  BEFORE INSERT OR UPDATE ON public.consultas
  FOR EACH ROW EXECUTE FUNCTION public.set_consulta_retencao();

COMMENT ON COLUMN public.consultas.retencao_audio_ate IS
  'Data limite pra reter o audio. Calculada automaticamente de scribe_beta_invites.audio_retention_days. Cron diario apaga audios expirados.';
