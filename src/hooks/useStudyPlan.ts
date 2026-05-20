import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AtividadeTipo = "fechamento" | "flashcards" | "questoes" | "revisao_flash" | "leitura";

export interface Atividade {
  tipo: AtividadeTipo;
  tema: string;
  descricao: string;
  estimativa_min: number;
  quantidade?: number;
  concluida: boolean;
  completed_at: string | null;
  item_ref: string | null;
}

export interface StudyPlanDay {
  id: string;
  plan_id: string;
  user_id: string;
  data: string;
  topico_principal: string | null;
  fase: "aprendizado" | "consolidacao" | "revisao_final" | "descanso";
  atividades: Atividade[];
  concluido_pct: number;
  notas: string | null;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  prova_nome: string;
  prova_data: string;
  topicos_input: string;
  topicos_normalizados: string[];
  horas_dia: number;
  status: "active" | "completed" | "expired" | "abandoned";
  streak_dias: number;
  ultimo_dia_concluido: string | null;
  freezes_disponiveis: number;
  freeze_recarga_em: string;
  created_at: string;
  updated_at: string;
}

/**
 * Hook principal: retorna o plano ativo + dias.
 * Atualiza em real-time quando atividades são marcadas/desmarcadas.
 */
export function useActiveStudyPlan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [days, setDays] = useState<StudyPlanDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) {
      setPlan(null);
      setDays([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: planRow, error: pe } = await supabase
        .from("study_plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pe) throw pe;
      if (!planRow) {
        setPlan(null);
        setDays([]);
        setLoading(false);
        return;
      }
      setPlan(planRow as StudyPlan);

      const { data: daysRows, error: de } = await supabase
        .from("study_plan_days")
        .select("*")
        .eq("plan_id", planRow.id)
        .order("data", { ascending: true });
      if (de) throw de;

      setDays((daysRows ?? []) as StudyPlanDay[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { plan, days, loading, error, reload };
}

/**
 * Marca atividade como concluída/não concluída.
 * Recalcula concluido_pct do dia automaticamente.
 */
export async function toggleAtividadeConcluida(
  dayId: string,
  atividadeIndex: number,
  itemRef?: string,
) {
  const { data: dayRow, error } = await supabase
    .from("study_plan_days")
    .select("atividades")
    .eq("id", dayId)
    .maybeSingle();

  if (error || !dayRow) throw error ?? new Error("Dia não encontrado");

  const atividades: Atividade[] = (dayRow.atividades ?? []) as Atividade[];
  if (atividadeIndex < 0 || atividadeIndex >= atividades.length) {
    throw new Error("Índice de atividade inválido");
  }

  const ativ = atividades[atividadeIndex];
  const novaConcluida = !ativ.concluida;
  atividades[atividadeIndex] = {
    ...ativ,
    concluida: novaConcluida,
    completed_at: novaConcluida ? new Date().toISOString() : null,
    item_ref: novaConcluida ? itemRef ?? ativ.item_ref : ativ.item_ref,
  };

  const total = atividades.length;
  const feitas = atividades.filter((a) => a.concluida).length;
  const pct = Math.round((feitas / total) * 100);

  const { error: ue } = await supabase
    .from("study_plan_days")
    .update({ atividades, concluido_pct: pct, updated_at: new Date().toISOString() })
    .eq("id", dayId);

  if (ue) throw ue;
  return { atividades, concluido_pct: pct };
}

/**
 * Cria novo plano via edge function.
 */
export async function createStudyPlan(input: {
  prova_nome: string;
  prova_data: string;
  topicos_input: string;
  horas_dia: number;
}): Promise<{ plan_id: string; total_dias: number; topicos_normalizados: string[] }> {
  const { data, error } = await supabase.functions.invoke("generate-study-plan", { body: input });
  if (error) {
    // supabase-js retorna "Edge Function returned a non-2xx status code"
    // genericamente — pegamos a mensagem real do corpo da resposta.
    let real = error.message ?? "Erro ao gerar plano";
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === "function") {
        const body = await ctx.json();
        if (body?.error) real = body.error;
      }
    } catch { /* mantém msg genérica */ }
    throw new Error(real);
  }
  if (!data?.success) {
    throw new Error(data?.error ?? "Falha desconhecida");
  }
  return data;
}

/**
 * Abandona o plano ativo.
 */
export async function abandonActivePlan(planId: string) {
  const { error } = await supabase
    .from("study_plans")
    .update({ status: "abandoned", updated_at: new Date().toISOString() })
    .eq("id", planId);
  if (error) throw error;
}

/**
 * Pega o dia de hoje (ou o próximo se hoje não existe).
 */
export function getTodayDay(days: StudyPlanDay[]): StudyPlanDay | null {
  const todayISO = new Date().toISOString().slice(0, 10);
  const today = days.find((d) => d.data === todayISO);
  if (today) return today;
  // próximo dia futuro
  const futuro = days.find((d) => d.data > todayISO);
  return futuro ?? null;
}

/**
 * Calcula dias até a prova.
 */
export function diasAteProva(provaData: string): number {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const prova = new Date(provaData + "T00:00:00Z");
  return Math.max(0, Math.round((prova.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
}

/**
 * Progresso geral do plano (% de atividades concluídas vs total).
 */
export function progressoPlano(days: StudyPlanDay[]): { pct: number; feitas: number; total: number } {
  let feitas = 0;
  let total = 0;
  for (const d of days) {
    for (const a of d.atividades) {
      total++;
      if (a.concluida) feitas++;
    }
  }
  const pct = total === 0 ? 0 : Math.round((feitas / total) * 100);
  return { pct, feitas, total };
}
