import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/crm/supabase";

export interface FluxoCaixa {
  id: string;
  /** Saldo efetivo HOJE = baseline manual + receitas - despesas desde baseline */
  saldo_atual: number;
  /** Saldo manual (snapshot que o user lancou) — antes de aplicar mov. automaticos */
  saldo_baseline: number;
  /** Data do snapshot manual */
  data_atualizacao: string;
  observacoes: string | null;
  /** Total de receitas realizadas desde a data do baseline */
  receitas_realizadas: number;
  /** Total de despesas realizadas desde a data do baseline */
  despesas_realizadas: number;
}

export interface ProjecaoDia {
  data: string;
  saldo: number;
}

export interface Aporte {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  tipo: "investimento" | "emprestimo" | "captacao" | "reembolso" | "outro";
  responsavel: string | null;
  observacoes: string | null;
  created_at: string;
}

export interface AporteInsert {
  descricao: string;
  valor: number;
  data: string;
  tipo?: Aporte["tipo"];
  responsavel?: string | null;
  observacoes?: string | null;
}

export function useAportes() {
  return useQuery({
    queryKey: ["crm-admin", "aportes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_aportes")
        .select("*")
        .order("data", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((a) => ({ ...a, valor: Number(a.valor) })) as Aporte[];
    },
  });
}

export function useCreateAporte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: AporteInsert) => {
      const { data, error } = await supabase.from("admin_aportes").insert(a).select().single();
      if (error) throw error;
      return data;
    },
    // Invalida fluxo-caixa, aportes e runway pra refletir o aporte no caixa
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useDeleteAporte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_aportes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

/**
 * Saldo de caixa *efetivo* HOJE. Combina:
 *   baseline (admin_fluxo_caixa.saldo_atual, ponto de partida do banco)
 *   + receitas (admin_receitas) com data_inicio >= baseline e status=ativo
 *   - despesas (admin_despesas) com data >= baseline
 *   + aportes (admin_aportes) — investimento/captacao/emprestimo
 *
 * Cadastrar despesa, receber pagamento EasyFlow OU registrar aporte ja
 * altera o saldo sem precisar editar manualmente.
 */
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
      if (!data) return null;

      const baseline = Number(data.saldo_atual);
      const baselineDate = (data.data_atualizacao ?? "").slice(0, 10);

      // Receitas realizadas desde o baseline (data_inicio >= baseline)
      const { data: receitas } = await supabase
        .from("admin_receitas")
        .select("valor")
        .gte("data_inicio", baselineDate)
        .eq("status", "ativo");
      const receitasTotal = (receitas ?? []).reduce((s, r) => s + Number(r.valor), 0);

      // Despesas realizadas desde o baseline (data >= baseline)
      const { data: despesas } = await supabase
        .from("admin_despesas")
        .select("valor")
        .gte("data", baselineDate);
      const despesasTotal = (despesas ?? []).reduce((s, d) => s + Number(d.valor), 0);

      // Aportes/investimentos — entram integralmente no caixa
      const { data: aportes } = await supabase
        .from("admin_aportes")
        .select("valor");
      const aportesTotal = (aportes ?? []).reduce((s, a) => s + Number(a.valor), 0);

      const saldoEfetivo = baseline + receitasTotal - despesasTotal + aportesTotal;

      return {
        id: data.id,
        saldo_atual: Math.round(saldoEfetivo * 100) / 100,
        saldo_baseline: baseline,
        data_atualizacao: data.data_atualizacao,
        observacoes: data.observacoes,
        receitas_realizadas: Math.round(receitasTotal * 100) / 100,
        despesas_realizadas: Math.round(despesasTotal * 100) / 100,
        total_aportes: Math.round(aportesTotal * 100) / 100,
      } as FluxoCaixa & { saldo_baseline: number; receitas_realizadas: number; despesas_realizadas: number; total_aportes: number };
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
      // Saldo efetivo = baseline + receitas - despesas + aportes
      // (mesma logica do useFluxoCaixa pra runway bater com o saldo exibido)
      const { data: fluxo } = await supabase
        .from("admin_fluxo_caixa")
        .select("saldo_atual, data_atualizacao")
        .order("data_atualizacao", { ascending: false })
        .limit(1)
        .single();
      const baseline = Number(fluxo?.saldo_atual ?? 0);
      const baselineDate = (fluxo?.data_atualizacao ?? "").slice(0, 10) || "2026-01-01";

      const { data: receitasBase } = await supabase
        .from("admin_receitas").select("valor")
        .gte("data_inicio", baselineDate).eq("status", "ativo");
      const receitasTotal = (receitasBase ?? []).reduce((s, r) => s + Number(r.valor), 0);

      const { data: despesasBase } = await supabase
        .from("admin_despesas").select("valor").gte("data", baselineDate);
      const despesasDesdeBaseline = (despesasBase ?? []).reduce((s, d) => s + Number(d.valor), 0);

      const { data: aportes } = await supabase.from("admin_aportes").select("valor");
      const totalAportes = (aportes ?? []).reduce((s, a) => s + Number(a.valor), 0);

      const saldo = baseline + receitasTotal - despesasDesdeBaseline + totalAportes;

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
