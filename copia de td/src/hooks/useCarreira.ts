import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/crm/supabase";

export interface Trilha { id: string; area: string; nivel: number; titulo: string; responsabilidades: string[]; habilidades: string[]; salario_min: number | null; salario_max: number | null; tempo_medio_meses: number; }
export interface Posicao { id: string; membro_id: string; trilha_id: string; data_inicio: string; data_fim: string | null; promovido_por: string | null; }

export function useTrilhas(area?: string) {
  return useQuery({
    queryKey: ["crm-admin", "trilhas", area],
    queryFn: async () => {
      let q = supabase.from("admin_trilhas_carreira").select("*").order("nivel", { ascending: true });
      if (area) q = q.eq("area", area);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((t) => ({ ...t, salario_min: t.salario_min ? Number(t.salario_min) : null, salario_max: t.salario_max ? Number(t.salario_max) : null })) as Trilha[];
    },
  });
}

export function usePosicoes() {
  return useQuery({
    queryKey: ["crm-admin", "posicoes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_posicoes_carreira").select("*").is("data_fim", null);
      if (error) throw error;
      return (data ?? []) as Posicao[];
    },
  });
}

export function usePromover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { membro_id: string; trilha_id: string; promovido_por?: string }) => {
      // Close current position
      await supabase.from("admin_posicoes_carreira").update({ data_fim: new Date().toISOString().split("T")[0] }).eq("membro_id", p.membro_id).is("data_fim", null);
      // Create new
      const { error } = await supabase.from("admin_posicoes_carreira").insert({ membro_id: p.membro_id, trilha_id: p.trilha_id, promovido_por: p.promovido_por ?? null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function usePromocoesTrimestrais() {
  return useQuery({
    queryKey: ["crm-admin", "promocoes-tri"],
    queryFn: async () => {
      const now = new Date();
      const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().split("T")[0];
      const { count } = await supabase.from("admin_posicoes_carreira").select("*", { count: "exact", head: true }).gte("data_inicio", qStart);
      return count ?? 0;
    },
  });
}
