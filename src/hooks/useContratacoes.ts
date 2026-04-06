import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/crm/supabase";

export interface Vaga {
  id: string;
  titulo: string;
  area: string;
  vinculo_desejado: string;
  faixa_min: number | null;
  faixa_max: number | null;
  urgencia: string;
  data_abertura: string;
  status: string;
  created_at: string;
  candidatos_count?: number;
}

export interface VagaInsert {
  titulo: string;
  area: string;
  vinculo_desejado: string;
  faixa_min?: number | null;
  faixa_max?: number | null;
  urgencia: string;
  status?: string;
}

export interface Candidato {
  id: string;
  vaga_id: string;
  nome: string;
  linkedin: string | null;
  fonte: string | null;
  etapa: string;
  feedback: string | null;
  data_prevista_inicio: string | null;
  fit_cultural: number | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CandidatoInsert {
  vaga_id: string;
  nome: string;
  linkedin?: string | null;
  fonte?: string | null;
  etapa?: string;
}

export interface ContratacaoMetricas {
  vagasAbertas: number;
  candidatosEmProcesso: number;
  tempoMedio: string;
  taxaAprovacao: number;
}

export function useVagas() {
  return useQuery({
    queryKey: ["crm-admin", "vagas"],
    queryFn: async () => {
      const { data: vagas, error } = await supabase
        .from("admin_vagas")
        .select("*")
        .order("data_abertura", { ascending: false });
      if (error) throw error;

      // Count candidatos per vaga
      const { data: candidatos } = await supabase
        .from("admin_candidatos")
        .select("vaga_id");

      const countMap: Record<string, number> = {};
      (candidatos ?? []).forEach((c) => { countMap[c.vaga_id] = (countMap[c.vaga_id] ?? 0) + 1; });

      return (vagas ?? []).map((v) => ({
        ...v,
        faixa_min: v.faixa_min ? Number(v.faixa_min) : null,
        faixa_max: v.faixa_max ? Number(v.faixa_max) : null,
        candidatos_count: countMap[v.id] ?? 0,
      })) as Vaga[];
    },
  });
}

export function useCandidatosByVaga(vagaId?: string) {
  return useQuery({
    queryKey: ["crm-admin", "candidatos", vagaId],
    enabled: !!vagaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_candidatos")
        .select("*")
        .eq("vaga_id", vagaId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Candidato[];
    },
  });
}

export function useContratacaoMetricas() {
  return useQuery({
    queryKey: ["crm-admin", "contratacao-metricas"],
    queryFn: async () => {
      const { data: vagas } = await supabase.from("admin_vagas").select("status, data_abertura");
      const { data: candidatos } = await supabase.from("admin_candidatos").select("etapa, created_at");

      const abertas = (vagas ?? []).filter((v) => v.status !== "encerrada").length;
      const emProcesso = (candidatos ?? []).filter((c) => !["aprovado", "recusado"].includes(c.etapa)).length;
      const aprovados = (candidatos ?? []).filter((c) => c.etapa === "aprovado").length;
      const total = (candidatos ?? []).length;
      const taxa = total > 0 ? Math.round((aprovados / total) * 100) : 0;

      // Tempo medio: dias entre abertura da vaga e encerramento
      const encerradas = (vagas ?? []).filter((v) => v.status === "encerrada");
      let tempoMedio = "—";
      if (encerradas.length > 0) {
        const totalDias = encerradas.reduce((s, v) => {
          const dias = Math.floor((Date.now() - new Date(v.data_abertura).getTime()) / 86400000);
          return s + dias;
        }, 0);
        tempoMedio = `${Math.round(totalDias / encerradas.length)}d`;
      }

      return { vagasAbertas: abertas, candidatosEmProcesso: emProcesso, tempoMedio, taxaAprovacao: taxa } as ContratacaoMetricas;
    },
  });
}

export function useCreateVaga() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: VagaInsert) => {
      const { data, error } = await supabase.from("admin_vagas").insert(v).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useCreateCandidato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: CandidatoInsert) => {
      const { data, error } = await supabase.from("admin_candidatos").insert(c).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useUpdateCandidatoEtapa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; etapa: string }) => {
      const { error } = await supabase
        .from("admin_candidatos")
        .update({ etapa: params.etapa })
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useDeleteVaga() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("admin_candidatos").delete().eq("vaga_id", id);
      const { error } = await supabase.from("admin_vagas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useUpdateVaga() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; data: Partial<VagaInsert> }) => {
      const { error } = await supabase.from("admin_vagas").update(params.data).eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useDeleteCandidato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_candidatos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useUpdateCandidato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; data: Partial<Candidato> }) => {
      const { error } = await supabase
        .from("admin_candidatos")
        .update(params.data)
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}
