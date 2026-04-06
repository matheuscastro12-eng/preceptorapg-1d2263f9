import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/crm/supabase";

export interface Relatorio {
  id: string;
  mes: number;
  ano: number;
  mrr: number;
  arr: number;
  total_usuarios: number;
  novos_usuarios: number;
  churn_rate: number;
  cac: number;
  ltv: number;
  burn_rate: number;
  runway: number;
  headcount: number;
  nps: number | null;
  narrativa_positivo: string | null;
  narrativa_negativo: string | null;
  narrativa_proximos30: string | null;
  criado_em: string;
}

export interface RelatorioInsert {
  mes: number;
  ano: number;
  mrr?: number;
  arr?: number;
  total_usuarios?: number;
  novos_usuarios?: number;
  churn_rate?: number;
  cac?: number;
  ltv?: number;
  burn_rate?: number;
  runway?: number;
  headcount?: number;
  nps?: number | null;
  narrativa_positivo?: string | null;
  narrativa_negativo?: string | null;
  narrativa_proximos30?: string | null;
}

export function useRelatorios() {
  return useQuery({
    queryKey: ["crm-admin", "relatorios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_relatorios_investidor")
        .select("*")
        .order("ano", { ascending: false })
        .order("mes", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        mrr: Number(r.mrr), arr: Number(r.arr), churn_rate: Number(r.churn_rate),
        cac: Number(r.cac), ltv: Number(r.ltv), burn_rate: Number(r.burn_rate), runway: Number(r.runway),
      })) as Relatorio[];
    },
  });
}

export function useUpsertRelatorio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: RelatorioInsert) => {
      // Check if exists
      const { data: existing } = await supabase
        .from("admin_relatorios_investidor")
        .select("id")
        .eq("mes", r.mes)
        .eq("ano", r.ano)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from("admin_relatorios_investidor").update(r).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("admin_relatorios_investidor").insert(r);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useDeleteRelatorio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_relatorios_investidor").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

// Auto-fill from current data
export function useAutoFillRelatorio(mes: number, ano: number) {
  return useQuery({
    queryKey: ["crm-admin", "relatorio-autofill", mes, ano],
    queryFn: async () => {
      const mesStr = `${ano}-${String(mes).padStart(2, "0")}`;

      const { data: receitasAtivas } = await supabase.from("admin_receitas").select("valor").eq("status", "ativo");
      const mrr = (receitasAtivas ?? []).reduce((s, r) => s + Number(r.valor), 0);

      const { data: despesasMes } = await supabase.from("admin_despesas").select("valor").gte("data", `${mesStr}-01`).lte("data", `${mesStr}-31`);
      const burn = (despesasMes ?? []).reduce((s, d) => s + Number(d.valor), 0);

      const { data: fluxo } = await supabase.from("admin_fluxo_caixa").select("saldo_atual").order("data_atualizacao", { ascending: false }).limit(1).single();
      const saldo = Number(fluxo?.saldo_atual ?? 0);

      const { count: headcount } = await supabase.from("admin_membros").select("*", { count: "exact", head: true }).eq("status", "ativo");
      const { count: totalUsuarios } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { count: cancelamentos } = await supabase.from("admin_receitas").select("*", { count: "exact", head: true }).eq("status", "cancelado");
      const { count: totalReceitas } = await supabase.from("admin_receitas").select("*", { count: "exact", head: true });

      const churn = (totalReceitas ?? 0) > 0 ? ((cancelamentos ?? 0) / (totalReceitas ?? 1)) * 100 : 0;
      const assinantes = (receitasAtivas ?? []).length;
      const ltv = mrr > 0 ? (mrr / (assinantes || 1)) * 7.5 : 0;

      return {
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(mrr * 12 * 100) / 100,
        total_usuarios: totalUsuarios ?? 0,
        novos_usuarios: 0,
        churn_rate: Math.round(churn * 10) / 10,
        cac: 0,
        ltv: Math.round(ltv * 100) / 100,
        burn_rate: Math.round(burn * 100) / 100,
        runway: burn > 0 ? Math.round((saldo / burn) * 10) / 10 : 0,
        headcount: headcount ?? 0,
      };
    },
  });
}
