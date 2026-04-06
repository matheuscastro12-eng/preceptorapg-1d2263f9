import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/crm/supabase";

export interface Despesa {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  recorrente: boolean;
  frequencia: string;
  responsavel: string | null;
  centro_de_custo: string | null;
  comprovante_url: string | null;
  observacoes: string | null;
  created_at: string;
}

export interface DespesaInsert {
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  recorrente: boolean;
  frequencia: string;
  responsavel?: string | null;
  centro_de_custo?: string | null;
  comprovante_url?: string | null;
  observacoes?: string | null;
}

export interface DespesaResumo {
  totalMes: number;
  recorrentes: number;
  pontuais: number;
  maiorCategoria: string;
  maiorCategoriaValor: number;
}

export function useDespesas(filters?: { categoria?: string; mes?: string; recorrente?: boolean | null }) {
  return useQuery({
    queryKey: ["crm-admin", "despesas", filters],
    queryFn: async () => {
      let q = supabase.from("admin_despesas").select("*").order("data", { ascending: false });
      if (filters?.categoria) q = q.eq("categoria", filters.categoria);
      if (filters?.mes) {
        q = q.gte("data", `${filters.mes}-01`).lte("data", `${filters.mes}-31`);
      }
      if (filters?.recorrente === true) q = q.eq("recorrente", true);
      if (filters?.recorrente === false) q = q.eq("recorrente", false);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Despesa[];
    },
  });
}

export function useDespesaResumo() {
  const now = new Date();
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return useQuery({
    queryKey: ["crm-admin", "despesa-resumo", mesAtual],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_despesas")
        .select("valor, categoria, recorrente")
        .gte("data", `${mesAtual}-01`)
        .lte("data", `${mesAtual}-31`);

      const all = data ?? [];
      const totalMes = all.reduce((s, d) => s + Number(d.valor), 0);
      const recorrentes = all.filter((d) => d.recorrente).reduce((s, d) => s + Number(d.valor), 0);
      const pontuais = totalMes - recorrentes;

      const catMap: Record<string, number> = {};
      all.forEach((d) => { catMap[d.categoria] = (catMap[d.categoria] ?? 0) + Number(d.valor); });
      const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

      return {
        totalMes: Math.round(totalMes * 100) / 100,
        recorrentes: Math.round(recorrentes * 100) / 100,
        pontuais: Math.round(pontuais * 100) / 100,
        maiorCategoria: sorted[0]?.[0] ?? "—",
        maiorCategoriaValor: Math.round((sorted[0]?.[1] ?? 0) * 100) / 100,
      } as DespesaResumo;
    },
  });
}

export function useDespesasPorCategoria() {
  return useQuery({
    queryKey: ["crm-admin", "despesas-por-categoria"],
    queryFn: async () => {
      const { data } = await supabase.from("admin_despesas").select("categoria, valor");
      const map: Record<string, number> = {};
      (data ?? []).forEach((d) => { map[d.categoria] = (map[d.categoria] ?? 0) + Number(d.valor); });
      return Object.entries(map)
        .map(([categoria, total]) => ({ categoria, total: Math.round(total * 100) / 100 }))
        .sort((a, b) => b.total - a.total);
    },
  });
}

export function useDespesasProximoVencimento() {
  return useQuery({
    queryKey: ["crm-admin", "despesas-vencimento-7d"],
    queryFn: async () => {
      const hoje = new Date();
      const em7dias = new Date(hoje.getTime() + 7 * 86400000);
      // Despesas recorrentes — simular proximo vencimento como proximo mes na mesma data
      const { data } = await supabase
        .from("admin_despesas")
        .select("*")
        .eq("recorrente", true)
        .order("data", { ascending: true });

      const alertas: Despesa[] = [];
      for (const d of data ?? []) {
        const orig = new Date(d.data);
        // Calcula proximo vencimento (mes seguinte ao ultimo registrado)
        const prox = new Date(orig);
        while (prox <= hoje) {
          if (d.frequencia === "mensal") prox.setMonth(prox.getMonth() + 1);
          else if (d.frequencia === "anual") prox.setFullYear(prox.getFullYear() + 1);
          else break;
        }
        if (prox <= em7dias) {
          alertas.push({ ...d, data: prox.toISOString().split("T")[0] } as Despesa);
        }
      }
      return alertas;
    },
  });
}

export function useCreateDespesa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: DespesaInsert) => {
      const { data, error } = await supabase.from("admin_despesas").insert(d).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useUpdateDespesa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; data: Partial<DespesaInsert> }) => {
      const { error } = await supabase.from("admin_despesas").update(params.data).eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useDeleteDespesa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_despesas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}
