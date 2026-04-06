import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/crm/supabase";

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
}

export interface DRERow {
  linha: DRELinha;
  valores: Record<number, number>;
  children?: DRERow[];
}

const MESES_DRE = [4, 5, 6, 7, 8, 9, 10, 11, 12];

export { MESES_DRE };

export function useDRELinhas() {
  return useQuery({
    queryKey: ["crm-admin", "dre-linhas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dre_linhas").select("*").order("ordem");
      if (error) throw error;
      return (data ?? []) as DRELinha[];
    },
  });
}

export function useDREValores(ano: number) {
  return useQuery({
    queryKey: ["crm-admin", "dre-valores", ano],
    queryFn: async () => {
      const { data, error } = await supabase.from("dre_valores").select("*").eq("ano", ano);
      if (error) throw error;
      return (data ?? []).map((v) => ({ ...v, valor: Number(v.valor) })) as DREValor[];
    },
  });
}

export function useUpdateDREValor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { linhaId: string; mes: number; ano: number; valor: number }) => {
      const { data: existing } = await supabase
        .from("dre_valores")
        .select("id")
        .eq("dre_linha_id", params.linhaId)
        .eq("mes", params.mes)
        .eq("ano", params.ano)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from("dre_valores").update({ valor: params.valor }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("dre_valores").insert({
          dre_linha_id: params.linhaId, mes: params.mes, ano: params.ano, valor: params.valor,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin", "dre-valores"] }); },
  });
}

// Build tree from flat list
export function buildDRETree(linhas: DRELinha[], valoresMap: Record<string, Record<number, number>>): DRERow[] {
  const rows: DRERow[] = linhas.map((l) => ({
    linha: l,
    valores: valoresMap[l.id] ?? {},
    children: [],
  }));

  // Group by code hierarchy
  const tree: DRERow[] = [];
  const byCode: Record<string, DRERow> = {};
  rows.forEach((r) => { byCode[r.linha.codigo] = r; });

  for (const row of rows) {
    const code = row.linha.codigo;
    const parts = code.split(".");

    if (parts.length === 1) {
      // Level 1 — top level
      tree.push(row);
    } else if (parts.length === 2 && !code.includes(".0")) {
      // Level 2 — subgroup (e.g., "1.1", "1.2")
      const parent = byCode[parts[0]];
      if (parent) parent.children!.push(row);
      else tree.push(row);
    } else {
      // Level 3 — item (e.g., "1.1.01", "2.01")
      // Find parent: "1.1.01" -> "1.1", "2.01" -> "2"
      let parentCode: string;
      if (parts.length === 3) {
        parentCode = `${parts[0]}.${parts[1]}`;
      } else {
        parentCode = parts[0];
      }
      const parent = byCode[parentCode];
      if (parent) parent.children!.push(row);
      else {
        // Try direct parent (e.g., "4.01" -> "4")
        const directParent = byCode[parts[0]];
        if (directParent) directParent.children!.push(row);
        else tree.push(row);
      }
    }
  }

  return tree;
}

// Format value for display
export function fmtDRE(valor: number): string {
  if (valor === 0) return "—";
  if (valor < 0) return `(${Math.abs(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })})`;
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

// Export to CSV
export function exportDREtoCSV(tree: DRERow[], ano: number) {
  const meses = MESES_DRE;
  const mesLabels = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const header = ["Código", "Descrição", ...meses.map((m) => mesLabels[m]), "Total"].join(";");

  const rows: string[] = [header];

  const flatten = (items: DRERow[], indent = 0) => {
    for (const row of items) {
      const prefix = "  ".repeat(indent);
      const total = meses.reduce((s, m) => s + (row.valores[m] ?? 0), 0);
      const vals = meses.map((m) => (row.valores[m] ?? 0).toFixed(2));
      rows.push([row.linha.codigo, `${prefix}${row.linha.descricao}`, ...vals, total.toFixed(2)].join(";"));
      if (row.children?.length) flatten(row.children, indent + 1);
    }
  };

  flatten(tree);

  const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dre-preceptor-${ano}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
