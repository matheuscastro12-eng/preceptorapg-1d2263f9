import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/crm/supabase";

export interface Membro {
  id: string;
  nome: string;
  foto_url: string | null;
  cargo: string;
  area: string;
  vinculo: string;
  data_entrada: string;
  status: string;
  email: string | null;
  linkedin: string | null;
  aniversario: string | null;
  cidade: string | null;
  created_at: string;
}

export interface MembroInsert {
  nome: string;
  foto_url?: string | null;
  cargo: string;
  area: string;
  vinculo: string;
  data_entrada: string;
  status?: string;
  email?: string | null;
  linkedin?: string | null;
  aniversario?: string | null;
  cidade?: string | null;
}

export function useMembros(filters?: { area?: string; vinculo?: string; status?: string }) {
  return useQuery({
    queryKey: ["crm-admin", "membros", filters],
    queryFn: async () => {
      let q = supabase.from("admin_membros").select("*").order("data_entrada", { ascending: true });
      if (filters?.area) q = q.eq("area", filters.area);
      if (filters?.vinculo) q = q.eq("vinculo", filters.vinculo);
      if (filters?.status) q = q.eq("status", filters.status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Membro[];
    },
  });
}

export function useCreateMembro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: MembroInsert) => {
      const { data, error } = await supabase.from("admin_membros").insert(m).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useUpdateMembro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; data: Partial<MembroInsert> }) => {
      const { error } = await supabase.from("admin_membros").update(params.data).eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}

export function useDeleteMembro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("admin_remuneracao").delete().eq("membro_id", id);
      await supabase.from("admin_reajustes").delete().eq("membro_id", id);
      const { error } = await supabase.from("admin_membros").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-admin"] }); },
  });
}
