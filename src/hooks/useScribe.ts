import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ConsultaStatus =
  | "gravando"
  | "transcrevendo"
  | "estruturando"
  | "pendente_revisao"
  | "aprovada"
  | "arquivada"
  | "erro";

export type ConsentMethod =
  | "verbal_gravado"
  | "assinatura_digital"
  | "formulario_papel_arquivado"
  | "testemunha";

export interface ConsultaSoap {
  S?: {
    queixa_principal?: string;
    hda?: string;
    antecedentes_pessoais?: string;
    antecedentes_familiares?: string;
    medicacoes_em_uso?: string[];
    alergias?: string[];
    habitos?: string;
  };
  O?: {
    sinais_vitais?: {
      pa?: string;
      fc?: string;
      fr?: string;
      temperatura?: string;
      sato2?: string;
      peso?: string;
      altura?: string;
    };
    exame_fisico_geral?: string;
    exame_fisico_segmentar?: Array<{ segmento?: string; achados?: string }>;
  };
  A?: {
    hipoteses_diagnosticas?: Array<{
      cid?: string;
      descricao?: string;
      probabilidade?: string;
    }>;
    comentario?: string;
  };
  P?: {
    conduta?: string;
    exames_solicitados?: string[];
    prescricao_rascunho?: Array<{
      medicamento?: string;
      posologia?: string;
      duracao?: string;
      observacoes?: string;
    }>;
    orientacoes?: string;
    retorno?: string;
  };
}

export interface Consulta {
  id: string;
  user_id: string;
  paciente_anonimo_id: string | null;
  paciente_alias: string;
  data_consulta: string;
  status: ConsultaStatus;
  status_message: string | null;
  audio_storage_path: string | null;
  audio_duration_s: number | null;
  audio_size_bytes: number | null;
  transcript: string | null;
  transcript_segments: unknown;
  soap_jsonb: ConsultaSoap;
  ddx_jsonb: unknown;
  exames_jsonb: unknown;
  prescricao_jsonb: unknown;
  validated_by_md: string | null;
  validated_at: string | null;
  validation_signature: string | null;
  retencao_audio_ate: string | null;
  audio_purged_at: string | null;
  created_at: string;
  updated_at: string;
}

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export function useConsultas() {
  const { user } = useAuth();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("consultas")
      .select("*")
      .order("data_consulta", { ascending: false });
    setConsultas((data ?? []) as Consulta[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Realtime: refresca quando consulta muda status
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("consultas-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "consultas",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  return { consultas, loading, refresh };
}

export function useConsulta(consultaId: string | undefined) {
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!consultaId) return;
    const { data } = await supabase
      .from("consultas")
      .select("*")
      .eq("id", consultaId)
      .maybeSingle();
    setConsulta((data as Consulta) ?? null);
    setLoading(false);
  }, [consultaId]);

  useEffect(() => {
    if (!consultaId) {
      setLoading(false);
      return;
    }
    void refresh();
  }, [consultaId, refresh]);

  // Realtime na consulta especifica
  useEffect(() => {
    if (!consultaId) return;
    const channel = supabase
      .channel(`consulta-${consultaId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "consultas",
          filter: `id=eq.${consultaId}`,
        },
        (payload) => {
          setConsulta(payload.new as Consulta);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [consultaId]);

  return { consulta, loading, refresh };
}

// ────────────────────────────────────────────────────────────
// Helpers de operacao
// ────────────────────────────────────────────────────────────

interface CreateConsultaParams {
  userId: string;
  pacienteAlias: string;
  dataConsulta?: Date;
  consent: {
    audio: boolean;
    pdf: boolean;
    compartilhamento_ia: boolean;
    method: ConsentMethod;
  };
}

export async function createConsulta(
  params: CreateConsultaParams,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("consultas")
    .insert({
      user_id: params.userId,
      paciente_alias: params.pacienteAlias.trim().slice(0, 200),
      data_consulta: (params.dataConsulta ?? new Date()).toISOString(),
      status: "gravando",
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Falha ao criar consulta");

  // Insere consent
  await supabase.from("consulta_consents").insert({
    consulta_id: data.id,
    paciente_consent_audio: params.consent.audio,
    paciente_consent_pdf: params.consent.pdf,
    paciente_consent_compartilhamento_ia: params.consent.compartilhamento_ia,
    consent_method: params.consent.method,
    paciente_alias: params.pacienteAlias.trim().slice(0, 200),
  });

  return { id: data.id };
}

export async function uploadConsultaAudio(
  userId: string,
  consultaId: string,
  audioBlob: Blob,
  durationS: number,
): Promise<void> {
  const ext = audioBlob.type.includes("mp4") ? "mp4" : "webm";
  const path = `${userId}/${consultaId}/audio.${ext}`;

  const { error: upError } = await supabase.storage
    .from("consultas-audio")
    .upload(path, audioBlob, {
      contentType: audioBlob.type || "audio/webm",
      upsert: true,
    });
  if (upError) throw new Error(`Upload audio falhou: ${upError.message}`);

  await supabase
    .from("consultas")
    .update({
      audio_storage_path: path,
      audio_duration_s: Math.round(durationS),
      audio_size_bytes: audioBlob.size,
    })
    .eq("id", consultaId);
}

export async function startTranscription(consultaId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Sessao expirada");
  const res = await fetch(`${API_URL}/transcribe-consult`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ consulta_id: consultaId }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Erro ${res.status}`);
}

export async function getConsultaAudioUrl(
  storagePath: string,
): Promise<string> {
  const { data } = await supabase.storage
    .from("consultas-audio")
    .createSignedUrl(storagePath, 3600);
  return data?.signedUrl ?? "";
}

export async function deleteConsulta(consultaId: string): Promise<void> {
  const { data: c } = await supabase
    .from("consultas")
    .select("audio_storage_path")
    .eq("id", consultaId)
    .single();
  if (c?.audio_storage_path) {
    await supabase.storage.from("consultas-audio").remove([c.audio_storage_path]);
  }
  await supabase.from("consultas").delete().eq("id", consultaId);
}
