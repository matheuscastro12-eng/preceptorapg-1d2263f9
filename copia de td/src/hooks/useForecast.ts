import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/crm/supabase";

export interface Premissa {
  id: string;
  versao: string;
  criado_em: string;
  criado_por: string | null;
  total_assinantes_base: number;
  mix_mensal: number;
  mix_anual: number;
  mix_bianual: number;
  preco_mensal: number;
  preco_anual: number;
  preco_bianual: number;
  taxa_renovacao_m_m: number;
  taxa_renovacao_m_a: number;
  taxa_renovacao_a_a: number;
  cac: number;
  ativo: boolean;
}

export interface DRELinha {
  id: string;
  codigo: string;
  descricao: string;
  tipo: string;
  nivel: number;
  ordem: number;
  editavel: boolean;
  formula: string | null;
}

export interface DREValor {
  id: string;
  dre_linha_id: string;
  mes: number;
  ano: number;
  valor: number;
  observacao: string | null;
}

export interface DRERow {
  linha: DRELinha;
  valores: Record<number, number>; // mes -> valor
}

export function usePremissas() {
  return useQuery({
    queryKey: ["crm-admin", "premissas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forecast_premissas")
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((p) => ({
        ...p,
        total_assinantes_base: Number(p.total_assinantes_base),
        mix_mensal: Number(p.mix_mensal),
        mix_anual: Number(p.mix_anual),
        mix_bianual: Number(p.mix_bianual),
        preco_mensal: Number(p.preco_mensal),
        preco_anual: Number(p.preco_anual),
        preco_bianual: Number(p.preco_bianual),
        taxa_renovacao_m_m: Number(p.taxa_renovacao_m_m),
        taxa_renovacao_m_a: Number(p.taxa_renovacao_m_a),
        taxa_renovacao_a_a: Number(p.taxa_renovacao_a_a),
        cac: Number(p.cac),
      })) as Premissa[];
    },
  });
}

export function usePremissaAtiva() {
  return useQuery({
    queryKey: ["crm-admin", "premissa-ativa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forecast_premissas")
        .select("*")
        .eq("ativo", true)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      if (!data) return null;
      return {
        ...data,
        total_assinantes_base: Number(data.total_assinantes_base),
        mix_mensal: Number(data.mix_mensal),
        mix_anual: Number(data.mix_anual),
        mix_bianual: Number(data.mix_bianual),
        preco_mensal: Number(data.preco_mensal),
        preco_anual: Number(data.preco_anual),
        preco_bianual: Number(data.preco_bianual),
        taxa_renovacao_m_m: Number(data.taxa_renovacao_m_m),
        taxa_renovacao_m_a: Number(data.taxa_renovacao_m_a),
        taxa_renovacao_a_a: Number(data.taxa_renovacao_a_a),
        cac: Number(data.cac),
      } as Premissa;
    },
  });
}

export function useSavePremissa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Omit<Premissa, "id" | "criado_em">) => {
      const { data, error } = await supabase.from("forecast_premissas").insert(p).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useSetPremissaAtiva() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("forecast_premissas").update({ ativo: false }).neq("id", id);
      const { error } = await supabase.from("forecast_premissas").update({ ativo: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useUpdatePremissa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; data: Partial<Premissa> }) => {
      const { error } = await supabase.from("forecast_premissas").update(params.data).eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useDREData(ano = 2026) {
  return useQuery({
    queryKey: ["crm-admin", "dre", ano],
    queryFn: async () => {
      const { data: linhas, error: lErr } = await supabase
        .from("dre_linhas")
        .select("*")
        .order("ordem", { ascending: true });
      if (lErr) throw lErr;

      const { data: valores, error: vErr } = await supabase
        .from("dre_valores")
        .select("*")
        .eq("ano", ano);
      if (vErr) throw vErr;

      const valMap: Record<string, Record<number, number>> = {};
      (valores ?? []).forEach((v) => {
        if (!valMap[v.dre_linha_id]) valMap[v.dre_linha_id] = {};
        valMap[v.dre_linha_id][v.mes] = Number(v.valor);
      });

      return (linhas ?? []).map((l) => ({
        linha: l as DRELinha,
        valores: valMap[l.id] ?? {},
      })) as DRERow[];
    },
  });
}

// Calculate projected values from premissas
export function calcularReceitas(p: Premissa) {
  const assM = Math.round(p.total_assinantes_base * p.mix_mensal);
  const assA = Math.round(p.total_assinantes_base * p.mix_anual);
  const assB = Math.round(p.total_assinantes_base * p.mix_bianual);

  const recAqM = assM * p.preco_mensal;
  const recAqA = assA * p.preco_anual;
  const recAqB = assB * p.preco_bianual;
  const recAqTotal = recAqM + recAqA + recAqB;

  const recRenM = assM * p.taxa_renovacao_m_m * p.preco_mensal;
  const recRenMA = assM * p.taxa_renovacao_m_a * p.preco_anual;
  const recRenAA = assA * p.taxa_renovacao_a_a * p.preco_anual;
  const recRenTotal = recRenM + recRenMA + recRenAA;

  const recTotal = recAqTotal + recRenTotal;
  const cacTotal = p.total_assinantes_base * p.cac;
  const ticketMedio = p.total_assinantes_base > 0 ? recAqTotal / p.total_assinantes_base : 0;

  return {
    assinantes: { mensal: assM, anual: assA, bianual: assB, total: p.total_assinantes_base },
    aquisicao: { mensal: recAqM, anual: recAqA, bianual: recAqB, total: recAqTotal },
    renovacao: { mensal: recRenM, anualFromMensal: recRenMA, anualFromAnual: recRenAA, total: recRenTotal },
    receitaTotal: recTotal,
    cacTotal,
    ticketMedio: Math.round(ticketMedio * 100) / 100,
  };
}
