import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/crm/supabase";

export interface PDI { id: string; membro_id: string; periodo: string; status: string; created_at: string; }
export interface PDICompetencia { id: string; pdi_id: string; competencia: string; situacao_atual: string | null; situacao_desejada: string | null; indicador_sucesso: string | null; acoes?: PDIAcao[]; }
export interface PDIAcao { id: string; competencia_id: string; descricao: string; prazo: string | null; responsavel: string | null; status: string; }

export function usePDIs(membroId?: string) {
  return useQuery({
    queryKey: ["crm-admin", "pdis", membroId],
    enabled: !!membroId,
    queryFn: async () => {
      const { data: pdis } = await supabase.from("admin_pdis").select("*").eq("membro_id", membroId!).order("created_at", { ascending: false });
      const ids = (pdis ?? []).map((p) => p.id);
      if (!ids.length) return (pdis ?? []) as PDI[];
      const { data: comps } = await supabase.from("admin_pdi_competencias").select("*").in("pdi_id", ids);
      const compIds = (comps ?? []).map((c) => c.id);
      const { data: acoes } = compIds.length ? await supabase.from("admin_pdi_acoes").select("*").in("competencia_id", compIds) : { data: [] };
      const acoesMap: Record<string, PDIAcao[]> = {};
      (acoes ?? []).forEach((a) => { (acoesMap[a.competencia_id] ??= []).push(a as PDIAcao); });
      const compsMap: Record<string, PDICompetencia[]> = {};
      (comps ?? []).forEach((c) => { (compsMap[c.pdi_id] ??= []).push({ ...c, acoes: acoesMap[c.id] ?? [] } as PDICompetencia); });
      return (pdis ?? []).map((p) => ({ ...p, competencias: compsMap[p.id] ?? [] })) as (PDI & { competencias: PDICompetencia[] })[];
    },
  });
}

export function useCreatePDI() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { membro_id: string; periodo: string }) => {
      const { data, error } = await supabase.from("admin_pdis").insert(p).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useCreateCompetencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: { pdi_id: string; competencia: string; situacao_atual?: string; situacao_desejada?: string; indicador_sucesso?: string }) => {
      const { data, error } = await supabase.from("admin_pdi_competencias").insert(c).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useCreateAcao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: { competencia_id: string; descricao: string; prazo?: string; responsavel?: string }) => {
      const { error } = await supabase.from("admin_pdi_acoes").insert(a);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useToggleAcao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; status: string }) => {
      const { error } = await supabase.from("admin_pdi_acoes").update({ status: p.status }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function usePDIStats() {
  return useQuery({
    queryKey: ["crm-admin", "pdi-stats"],
    queryFn: async () => {
      const { count } = await supabase.from("admin_pdis").select("*", { count: "exact", head: true }).eq("status", "ativo");
      return { ativos: count ?? 0 };
    },
  });
}
