import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/crm/supabase";

export interface Inadimplencia {
  id: string;
  user_id: string | null;
  email: string;
  nome: string;
  plano: string;
  valor_devido: number;
  status: string;
  tentativas: number;
  ultimo_evento: string | null;
  data_ocorrencia: string;
  emails_enviados: number;
  ultimo_email_at: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InadimplenciaStats {
  total: number;
  emCobranca: number;
  resolvidos: number;
  perdidos: number;
  valorTotalDevido: number;
  valorRecuperado: number;
}

const PLAN_LABELS: Record<string, string> = {
  monthly: "Mensal",
  annual: "Anual",
  biannual: "Bi-anual",
  unknown: "—",
};

export { PLAN_LABELS as INADIMPLENCIA_PLAN_LABELS };

export function useInadimplencias() {
  return useQuery({
    queryKey: ["crm-admin", "inadimplencias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_inadimplencias")
        .select("*")
        .order("data_ocorrencia", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Inadimplencia[];
    },
  });
}

export function useInadimplenciaStats() {
  return useQuery({
    queryKey: ["crm-admin", "inadimplencia-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_inadimplencias")
        .select("*");
      if (error) throw error;

      const all = (data ?? []) as Inadimplencia[];
      const emCobranca = all.filter(i => i.status === "em_cobranca");
      const resolvidos = all.filter(i => i.status === "resolvido");
      const perdidos = all.filter(i => i.status === "perdido");

      return {
        total: all.length,
        emCobranca: emCobranca.length,
        resolvidos: resolvidos.length,
        perdidos: perdidos.length,
        valorTotalDevido: emCobranca.reduce((s, i) => s + Number(i.valor_devido), 0),
        valorRecuperado: resolvidos.reduce((s, i) => s + Number(i.valor_devido), 0),
      } as InadimplenciaStats;
    },
  });
}

export function useUpdateInadimplencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Inadimplencia> }) => {
      const { error } = await supabase
        .from("admin_inadimplencias")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-admin"] });
    },
  });
}

export function useMarkAsPerdido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("admin_inadimplencias")
        .update({ status: "perdido" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-admin"] });
    },
  });
}
