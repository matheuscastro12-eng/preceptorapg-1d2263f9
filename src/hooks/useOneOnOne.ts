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
  lider_id?: string | null;
  data: string;
  duracao?: number;
  humor?: number;
  topicos?: string[];
  compromissos?: OneOnOne["compromissos"];
  observacoes_confidenciais?: string | null;
  proxima_data?: string | null;
}

export function useOneOnOnes(membroId?: string) {
  return useQuery({
    queryKey: ["crm-admin", "one-on-ones", membroId ?? "all"],
    queryFn: async () => {
      // Sem membroId: retorna TODOS os 1:1s (usado na pagina Time pra
      // listar "Proximos 1:1s" e calcular pendencias). Antes a query
      // ficava desabilitada e a lista vinha sempre vazia.
      let q = supabase.from("admin_one_on_ones").select("*").order("data", { ascending: false });
      if (membroId) q = q.eq("membro_id", membroId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as OneOnOne[];
    },
  });
}

export function useOneOnOneAlerts() {
  return useQuery({
    queryKey: ["crm-admin", "oo-alerts"],
    queryFn: async () => {
      const { data: membros } = await supabase.from("admin_membros").select("id, nome, cargo").eq("status", "ativo");
      const { data: oos } = await supabase.from("admin_one_on_ones").select("membro_id, data").order("data", { ascending: false });
      const lastOO: Record<string, string> = {};
      (oos ?? []).forEach((o) => { if (!lastOO[o.membro_id]) lastOO[o.membro_id] = o.data; });
      const cutoff = new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0];
      // Shape alinhado com a UI (AdminTimeV3 / OneOnOneV3): membro_id, nome,
      // cargo, ultimo, dias_desde_ultimo.
      return (membros ?? []).filter((m) => !lastOO[m.id] || lastOO[m.id] < cutoff).map((m) => {
        const ultimo = lastOO[m.id] ?? null;
        const dias = ultimo ? Math.floor((Date.now() - new Date(ultimo).getTime()) / 86400000) : null;
        return {
          id: m.id,
          membro_id: m.id,
          nome: m.nome,
          cargo: (m as { cargo?: string }).cargo ?? null,
          ultimo,
          dias_desde_ultimo: dias,
        };
      });
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
