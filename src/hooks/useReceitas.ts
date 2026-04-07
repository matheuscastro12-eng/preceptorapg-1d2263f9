import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/crm/supabase";

export interface Receita {
  id: string;
  produto: string;
  plano: string;
  valor: number;
  data_inicio: string;
  data_renovacao: string | null;
  status: string;
  origem: string;
  observacoes: string | null;
  created_at: string;
}

export interface ReceitaInsert {
  produto: string;
  plano: string;
  valor: number;
  data_inicio: string;
  data_renovacao?: string | null;
  status: string;
  origem: string;
  observacoes?: string | null;
}

export interface ReceitaResumo {
  mrrTotal: number;
  novas: number;
  cancelamentos: number;
  expansao: number;
}

type Periodo = "mes" | "trimestre" | "ano";

function getDateRange(periodo: Periodo): string {
  const now = new Date();
  switch (periodo) {
    case "mes":
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    case "trimestre": {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      return `${now.getFullYear()}-${String(qMonth + 1).padStart(2, "0")}-01`;
    }
    case "ano":
      return `${now.getFullYear()}-01-01`;
  }
}

export function useReceitas(periodo: Periodo = "mes") {
  return useQuery({
    queryKey: ["crm-admin", "receitas", periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_receitas")
        .select("*")
        .order("data_inicio", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Receita[];
    },
  });
}

const PLAN_PRICES: Record<string, number> = {
  monthly: 49.90,
  annual: 350.90 / 12,    // ~R$29.24/mês
  biannual: 599.90 / 6,   // ~R$99.98/mês
};

export function useReceitaResumo(periodo: Periodo = "mes") {
  const since = getDateRange(periodo);

  return useQuery({
    queryKey: ["crm-admin", "receita-resumo", periodo],
    queryFn: async () => {
      // MRR real da tabela subscriptions (mesma fonte do CRM Marketing)
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("plan_type, status, created_at")
        .eq("status", "active");

      const pagantes = (subs ?? []).filter((s) => s.plan_type === "monthly" || s.plan_type === "annual" || s.plan_type === "biannual");
      const mrrTotal = pagantes.reduce((s, sub) => s + (PLAN_PRICES[sub.plan_type] ?? 0), 0);
      const novas = pagantes.filter((s) => s.created_at >= `${since}T00:00:00.000Z`).length;

      const { count: cancelamentos } = await supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "inactive");

      return {
        mrrTotal: Math.round(mrrTotal * 100) / 100,
        novas,
        cancelamentos: cancelamentos ?? 0,
        expansao: 0,
      } as ReceitaResumo;
    },
  });
}

export function useReceitaPorPlano() {
  return useQuery({
    queryKey: ["crm-admin", "receita-por-plano"],
    queryFn: async () => {
      const { data } = await supabase.from("admin_receitas").select("plano, valor").eq("status", "ativo");
      const map: Record<string, number> = {};
      (data ?? []).forEach((r) => { map[r.plano] = (map[r.plano] ?? 0) + Number(r.valor); });
      return Object.entries(map).map(([plano, total]) => ({ plano, total: Math.round(total * 100) / 100 }));
    },
  });
}

export function useReceitaPorProduto() {
  return useQuery({
    queryKey: ["crm-admin", "receita-por-produto"],
    queryFn: async () => {
      const { data } = await supabase.from("admin_receitas").select("produto, valor").eq("status", "ativo");
      const map: Record<string, number> = {};
      (data ?? []).forEach((r) => { map[r.produto] = (map[r.produto] ?? 0) + Number(r.valor); });
      return Object.entries(map).map(([produto, total]) => ({ produto, total: Math.round(total * 100) / 100 }));
    },
  });
}

export function useCreateReceita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (receita: ReceitaInsert) => {
      const { data, error } = await supabase.from("admin_receitas").insert(receita).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useUpdateReceita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; data: Partial<ReceitaInsert> }) => {
      const { error } = await supabase.from("admin_receitas").update(params.data).eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useDeleteReceita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_receitas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}
