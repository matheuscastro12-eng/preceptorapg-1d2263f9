import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/crm/supabase";

export interface OneOnOne {
  id: string;
  membro_id: string;
  lider_id: string;
  data: string;
  duracao: number;
  humor: number;
  topicos: string[];
  compromissos: { texto: string; responsavel: string; prazo: string; concluido: boolean }[];
  observacoes_confidenciais: string | null;
  proxima_data: string | null;
  created_at: string;
}

export interface OneOnOneInsert {
  membro_id: string;
  lider_id: string;
  data: string;
  duracao?: number;
  humor?: number;
  topicos?: string[];
  compromissos?: OneOnOne["compromissos"];
  observacoes_confidenciais?: string;
  proxima_data?: string;
}

export function useOneOnOnes(membroId?: string) {
  return useQuery({
    queryKey: ["crm-admin", "one-on-ones", membroId],
    enabled: !!membroId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_one_on_ones").select("*")
        .eq("membro_id", membroId!).order("data", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OneOnOne[];
    },
  });
}

export function useOneOnOneAlerts() {
  return useQuery({
    queryKey: ["crm-admin", "oo-alerts"],
    queryFn: async () => {
      const { data: membros } = await supabase.from("admin_membros").select("id, nome").eq("status", "ativo");
      const { data: oos } = await supabase.from("admin_one_on_ones").select("membro_id, data").order("data", { ascending: false });
      const lastOO: Record<string, string> = {};
      (oos ?? []).forEach((o) => { if (!lastOO[o.membro_id]) lastOO[o.membro_id] = o.data; });
      const cutoff = new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0];
      return (membros ?? []).filter((m) => !lastOO[m.id] || lastOO[m.id] < cutoff).map((m) => ({
        id: m.id, nome: m.nome, ultimo: lastOO[m.id] ?? null,
      }));
    },
  });
}

export function useCreateOneOnOne() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (o: OneOnOneInsert) => {
      const { data, error } = await supabase.from("admin_one_on_ones").insert(o).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useUpdateCompromisso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; compromissos: OneOnOne["compromissos"] }) => {
      const { error } = await supabase.from("admin_one_on_ones").update({ compromissos: p.compromissos as any }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}
