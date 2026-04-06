import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/crm/supabase";

export interface OKR {
  id: string;
  objetivo: string;
  responsavel_id: string | null;
  trimestre: number;
  ano: number;
  status: string;
  created_at: string;
  responsavel_nome?: string;
  key_results?: KeyResult[];
  progresso_medio?: number;
}

export interface KeyResult {
  id: string;
  okr_id: string;
  descricao: string;
  meta: number;
  progresso_atual: number;
  unidade: string;
  comentario_semanal: string | null;
  created_at: string;
}

export interface OKRInsert {
  objetivo: string;
  responsavel_id: string | null;
  trimestre: number;
  ano: number;
}

export interface KRInsert {
  okr_id: string;
  descricao: string;
  meta: number;
  progresso_atual?: number;
  unidade: string;
  comentario_semanal?: string | null;
}

export function useOKRs(trimestre: number, ano: number) {
  return useQuery({
    queryKey: ["crm-admin", "okrs", trimestre, ano],
    queryFn: async () => {
      const { data: okrs, error } = await supabase
        .from("admin_okrs")
        .select("*")
        .eq("trimestre", trimestre)
        .eq("ano", ano)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const ids = (okrs ?? []).map((o) => o.id);
      const { data: krs } = ids.length > 0
        ? await supabase.from("admin_key_results").select("*").in("okr_id", ids).order("created_at", { ascending: true })
        : { data: [] };

      const { data: membros } = await supabase.from("admin_membros").select("id, nome");
      const membroMap: Record<string, string> = {};
      (membros ?? []).forEach((m) => { membroMap[m.id] = m.nome; });

      return (okrs ?? []).map((o) => {
        const okrKrs = (krs ?? []).filter((k) => k.okr_id === o.id).map((k) => ({
          ...k,
          meta: Number(k.meta),
          progresso_atual: Number(k.progresso_atual),
        })) as KeyResult[];

        const progresso_medio = okrKrs.length > 0
          ? Math.round(okrKrs.reduce((s, k) => s + (k.meta > 0 ? (k.progresso_atual / k.meta) * 100 : 0), 0) / okrKrs.length)
          : 0;

        return {
          ...o,
          responsavel_nome: o.responsavel_id ? membroMap[o.responsavel_id] ?? "—" : "—",
          key_results: okrKrs,
          progresso_medio,
        } as OKR;
      });
    },
  });
}

export function useAvailableQuarters() {
  return useQuery({
    queryKey: ["crm-admin", "okr-quarters"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_okrs")
        .select("trimestre, ano")
        .order("ano", { ascending: false })
        .order("trimestre", { ascending: false });

      const seen = new Set<string>();
      const quarters: { trimestre: number; ano: number }[] = [];
      (data ?? []).forEach((d) => {
        const key = `${d.ano}-Q${d.trimestre}`;
        if (!seen.has(key)) { seen.add(key); quarters.push({ trimestre: d.trimestre, ano: d.ano }); }
      });

      // Ensure current quarter is present
      const now = new Date();
      const curQ = Math.floor(now.getMonth() / 3) + 1;
      const curY = now.getFullYear();
      const curKey = `${curY}-Q${curQ}`;
      if (!seen.has(curKey)) quarters.unshift({ trimestre: curQ, ano: curY });

      return quarters;
    },
  });
}

export function useCreateOKR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (o: OKRInsert) => {
      const { data, error } = await supabase.from("admin_okrs").insert(o).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useCreateKR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (kr: KRInsert) => {
      const { data, error } = await supabase.from("admin_key_results").insert(kr).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useUpdateKR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; progresso_atual?: number; comentario_semanal?: string | null }) => {
      const { error } = await supabase.from("admin_key_results").update(params).eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useUpdateOKRStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; status: string }) => {
      const { error } = await supabase.from("admin_okrs").update({ status: params.status }).eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useDeleteOKR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("admin_key_results").delete().eq("okr_id", id);
      const { error } = await supabase.from("admin_okrs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useDeleteKR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_key_results").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useMembrosSelect() {
  return useQuery({
    queryKey: ["crm-admin", "membros-select"],
    queryFn: async () => {
      const { data } = await supabase.from("admin_membros").select("id, nome").eq("status", "ativo").order("nome");
      return (data ?? []) as { id: string; nome: string }[];
    },
  });
}
