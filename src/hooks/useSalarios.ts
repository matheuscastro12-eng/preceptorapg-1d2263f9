import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/crm/supabase";

export interface Remuneracao {
  id: string;
  membro_id: string;
  salario_bruto: number;
  modelo_pagamento: string;
  dia_pagamento: number | null;
  banco: string | null;
  dados_bancarios: string | null;
  equity_percentual: number;
  cliff_meses: number;
  vesting_meses: number;
  beneficios: Record<string, unknown>;
  observacoes_confidenciais: string | null;
}

export interface RemuneracaoInsert {
  membro_id: string;
  salario_bruto: number;
  modelo_pagamento: string;
  dia_pagamento?: number | null;
  banco?: string | null;
  dados_bancarios?: string | null;
  equity_percentual?: number;
  cliff_meses?: number;
  vesting_meses?: number;
  beneficios?: Record<string, unknown>;
  observacoes_confidenciais?: string | null;
}

export interface Reajuste {
  id: string;
  membro_id: string;
  data: string;
  percentual: number;
  valor_anterior: number;
  valor_novo: number;
  motivo: string | null;
}

export interface FolhaConsolidada {
  membro_id: string;
  nome: string;
  cargo: string;
  area: string;
  salario_bruto: number;
  modelo_pagamento: string;
  dia_pagamento: number | null;
  equity_percentual: number;
}

export function useFolhaConsolidada() {
  return useQuery({
    queryKey: ["crm-admin", "folha-consolidada"],
    queryFn: async () => {
      const { data: membros } = await supabase
        .from("admin_membros")
        .select("id, nome, cargo, area")
        .eq("status", "ativo");

      const { data: remuneracoes } = await supabase
        .from("admin_remuneracao")
        .select("membro_id, salario_bruto, modelo_pagamento, dia_pagamento, equity_percentual");

      const remMap: Record<string, typeof remuneracoes extends (infer T)[] | null ? T : never> = {};
      (remuneracoes ?? []).forEach((r) => { remMap[r.membro_id] = r; });

      const folha: FolhaConsolidada[] = (membros ?? []).map((m) => {
        const rem = remMap[m.id];
        return {
          membro_id: m.id,
          nome: m.nome,
          cargo: m.cargo,
          area: m.area,
          salario_bruto: Number(rem?.salario_bruto ?? 0),
          modelo_pagamento: rem?.modelo_pagamento ?? "mensal",
          dia_pagamento: rem?.dia_pagamento ?? null,
          equity_percentual: Number(rem?.equity_percentual ?? 0),
        };
      });

      return folha;
    },
  });
}

export function useRemuneracaoByMembro(membroId?: string) {
  return useQuery({
    queryKey: ["crm-admin", "remuneracao", membroId],
    enabled: !!membroId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_remuneracao")
        .select("*")
        .eq("membro_id", membroId!)
        .maybeSingle();
      if (error) throw error;
      return data as Remuneracao | null;
    },
  });
}

export function useUpsertRemuneracao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: RemuneracaoInsert) => {
      const { data: existing } = await supabase
        .from("admin_remuneracao")
        .select("id")
        .eq("membro_id", r.membro_id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from("admin_remuneracao").update(r).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("admin_remuneracao").insert(r);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useReajustesByMembro(membroId?: string) {
  return useQuery({
    queryKey: ["crm-admin", "reajustes", membroId],
    enabled: !!membroId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_reajustes")
        .select("*")
        .eq("membro_id", membroId!)
        .order("data", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Reajuste[];
    },
  });
}

export function useProjecaoFolha() {
  return useQuery({
    queryKey: ["crm-admin", "projecao-folha"],
    queryFn: async () => {
      const { data: remuneracoes } = await supabase
        .from("admin_remuneracao")
        .select("salario_bruto, membro_id");

      const { data: membrosAtivos } = await supabase
        .from("admin_membros")
        .select("id")
        .eq("status", "ativo");

      const ativosSet = new Set((membrosAtivos ?? []).map((m) => m.id));
      const folhaAtual = (remuneracoes ?? [])
        .filter((r) => ativosSet.has(r.membro_id))
        .reduce((s, r) => s + Number(r.salario_bruto), 0);

      const now = new Date();
      return [1, 2, 3].map((i) => {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        return {
          mes: d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
          valor: Math.round(folhaAtual * 100) / 100,
        };
      });
    },
  });
}
