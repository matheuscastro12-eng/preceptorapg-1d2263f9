import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/crm/supabase";

export interface BPHighlights {
  receitaBrutaMes: number;
  ebitdaMes: number;
  margemEbitda: number;
  lucroLiquidoMes: number;
  aporteAcumulado: number;
  lucroMensal: { mes: string; valor: number }[];
}

const MESES_LABELS = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function useBPHighlights(ano = 2026) {
  const mesAtual = new Date().getMonth() + 1; // 1-12

  return useQuery({
    queryKey: ["crm-admin", "bp-highlights", ano],
    queryFn: async () => {
      const { data: linhas } = await supabase.from("dre_linhas").select("id, codigo");
      const { data: valores } = await supabase.from("dre_valores").select("dre_linha_id, mes, valor").eq("ano", ano);

      const linhaMap: Record<string, string> = {};
      (linhas ?? []).forEach((l) => { linhaMap[l.codigo] = l.id; });

      const getVal = (codigo: string, mes: number): number => {
        const lid = linhaMap[codigo];
        if (!lid) return 0;
        const v = (valores ?? []).find((val) => val.dre_linha_id === lid && val.mes === mes);
        return Number(v?.valor ?? 0);
      };

      const getTotal = (codigo: string): number => {
        const lid = linhaMap[codigo];
        if (!lid) return 0;
        return (valores ?? [])
          .filter((v) => v.dre_linha_id === lid)
          .reduce((s, v) => s + Number(v.valor), 0);
      };

      // Mês atual (ou abril se antes)
      const mes = Math.max(mesAtual, 4);
      const recBruta = getVal("1", mes);
      const ebitda = getVal("EBITDA", mes);
      const ll = getVal("LL", mes);
      const margem = recBruta > 0 ? (ebitda / recBruta) * 100 : 0;
      const aporte = getTotal("APORTE");

      // Lucro mensal abril-dezembro
      const lucroMensal = [4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => ({
        mes: MESES_LABELS[m],
        valor: getVal("LL", m),
      }));

      return {
        receitaBrutaMes: recBruta,
        ebitdaMes: ebitda,
        margemEbitda: Math.round(margem * 10) / 10,
        lucroLiquidoMes: ll,
        aporteAcumulado: aporte,
        lucroMensal,
      } as BPHighlights;
    },
  });
}
