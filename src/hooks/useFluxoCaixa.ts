import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/crm/supabase";

export interface FluxoCaixa {
  id: string;
  saldo_atual: number;
  data_atualizacao: string;
  observacoes: string | null;
}

export interface ProjecaoDia {
  data: string;
  saldo: number;
}

export function useFluxoCaixa() {
  return useQuery({
    queryKey: ["crm-admin", "fluxo-caixa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_fluxo_caixa")
        .select("*")
        .order("data_atualizacao", { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data ? { ...data, saldo_atual: Number(data.saldo_atual) } as FluxoCaixa : null;
    },
  });
}

export function useUpdateSaldo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { saldo: number; observacoes?: string }) => {
      const { data, error } = await supabase.from("admin_fluxo_caixa").insert({
        saldo_atual: params.saldo,
        observacoes: params.observacoes ?? null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useRunway() {
  return useQuery({
    queryKey: ["crm-admin", "runway"],
    queryFn: async () => {
      // Saldo atual
      const { data: fluxo } = await supabase
        .from("admin_fluxo_caixa")
        .select("saldo_atual")
        .order("data_atualizacao", { ascending: false })
        .limit(1)
        .single();

      const saldo = Number(fluxo?.saldo_atual ?? 0);

      // Burn medio dos ultimos 3 meses
      const now = new Date();
      const tresMesesAtras = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split("T")[0];
      const { data: despesas } = await supabase
        .from("admin_despesas")
        .select("valor, data")
        .gte("data", tresMesesAtras);

      const totalDespesas = (despesas ?? []).reduce((s, d) => s + Number(d.valor), 0);
      const meses = Math.max(1, 3); // Sempre dividir por 3
      const burnMedio = totalDespesas / meses;

      return {
        saldo,
        burnMedio: Math.round(burnMedio * 100) / 100,
        runway: burnMedio > 0 ? Math.round((saldo / burnMedio) * 10) / 10 : 0,
      };
    },
  });
}

export function useEntradasPrevistas() {
  return useQuery({
    queryKey: ["crm-admin", "entradas-previstas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_receitas")
        .select("id, produto, plano, valor, data_renovacao, observacoes")
        .eq("status", "ativo")
        .not("data_renovacao", "is", null)
        .order("data_renovacao", { ascending: true });

      return (data ?? []).map((r) => ({
        id: r.id,
        descricao: `${r.produto === "preceptormed" ? "PreceptorMED" : "PreceptorENEM"} - ${r.plano}`,
        valor: Number(r.valor),
        data: r.data_renovacao!,
        obs: r.observacoes,
      }));
    },
  });
}

export function useSaidasPrevistas() {
  return useQuery({
    queryKey: ["crm-admin", "saidas-previstas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_despesas")
        .select("id, descricao, valor, data, frequencia, categoria")
        .eq("recorrente", true)
        .order("data", { ascending: true });

      const hoje = new Date();
      const em90dias = new Date(hoje.getTime() + 90 * 86400000);

      const saidas: { id: string; descricao: string; valor: number; data: string; categoria: string }[] = [];

      for (const d of data ?? []) {
        const orig = new Date(d.data);
        const prox = new Date(orig);
        while (prox <= hoje) {
          if (d.frequencia === "mensal") prox.setMonth(prox.getMonth() + 1);
          else if (d.frequencia === "anual") prox.setFullYear(prox.getFullYear() + 1);
          else break;
        }
        // Adicionar todas as ocorrencias nos proximos 90 dias
        while (prox <= em90dias) {
          saidas.push({
            id: d.id,
            descricao: d.descricao,
            valor: Number(d.valor),
            data: prox.toISOString().split("T")[0],
            categoria: d.categoria,
          });
          if (d.frequencia === "mensal") prox.setMonth(prox.getMonth() + 1);
          else if (d.frequencia === "anual") prox.setFullYear(prox.getFullYear() + 1);
          else break;
        }
      }

      return saidas.sort((a, b) => a.data.localeCompare(b.data));
    },
  });
}

export function useProjecao90Dias() {
  return useQuery({
    queryKey: ["crm-admin", "projecao-90d"],
    queryFn: async () => {
      // Saldo atual
      const { data: fluxo } = await supabase
        .from("admin_fluxo_caixa")
        .select("saldo_atual")
        .order("data_atualizacao", { ascending: false })
        .limit(1)
        .single();
      let saldo = Number(fluxo?.saldo_atual ?? 0);

      // Entradas previstas (receitas ativas com renovacao)
      const { data: receitas } = await supabase
        .from("admin_receitas")
        .select("valor, data_renovacao, plano")
        .eq("status", "ativo");

      // Saidas previstas (despesas recorrentes)
      const { data: despesas } = await supabase
        .from("admin_despesas")
        .select("valor, data, frequencia")
        .eq("recorrente", true);

      const hoje = new Date();
      const dias: ProjecaoDia[] = [];

      for (let i = 0; i <= 90; i++) {
        const dia = new Date(hoje.getTime() + i * 86400000);
        const diaStr = dia.toISOString().split("T")[0];
        const diaNum = dia.getDate();
        const mesDia = dia.getMonth();
        const anoDia = dia.getFullYear();

        // Entradas: receitas que renovam neste dia
        for (const r of receitas ?? []) {
          if (!r.data_renovacao) continue;
          const renov = new Date(r.data_renovacao);
          // Mensal: mesmo dia do mes
          if (renov.getDate() === diaNum) {
            // Verificar se e o mes certo
            if (r.plano === "mensal" || (r.plano === "anual" && renov.getMonth() === mesDia)) {
              saldo += Number(r.valor);
            }
          }
        }

        // Saidas: despesas recorrentes que vencem neste dia
        for (const d of despesas ?? []) {
          const orig = new Date(d.data);
          if (d.frequencia === "mensal" && orig.getDate() === diaNum) {
            saldo -= Number(d.valor);
          } else if (d.frequencia === "anual" && orig.getDate() === diaNum && orig.getMonth() === mesDia) {
            saldo -= Number(d.valor);
          }
        }

        dias.push({ data: diaStr, saldo: Math.round(saldo * 100) / 100 });
      }

      return dias;
    },
  });
}
