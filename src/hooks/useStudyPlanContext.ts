import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Atividade } from "./useStudyPlan";

/**
 * Hook que detecta se a página foi aberta a partir de uma atividade do
 * cronograma (?planDay=...&actIdx=...&tema=...) e expõe utilitários
 * pra auto-marcar a atividade como concluída quando o user terminar.
 */
export function useStudyPlanContext() {
  const [params] = useSearchParams();
  const planDay = params.get("planDay");
  const actIdx = params.get("actIdx");
  const tema = params.get("tema");
  const isFromPlan = !!(planDay && actIdx !== null);

  return useMemo(
    () => ({
      isFromPlan,
      planDay,
      actIdx: actIdx ? parseInt(actIdx, 10) : null,
      tema,
    }),
    [isFromPlan, planDay, actIdx, tema],
  );
}

/**
 * Marca uma atividade como concluída no banco. Idempotente.
 * Usado quando o user completa uma ação (ex: gerou fechamento, terminou simulado).
 */
export async function markPlanActivityComplete(
  planDayId: string,
  activityIdx: number,
  itemRef: string | null = null,
): Promise<boolean> {
  try {
    const { data: dayRow, error } = await supabase
      .from("study_plan_days")
      .select("atividades, plan_id, user_id")
      .eq("id", planDayId)
      .maybeSingle();
    if (error || !dayRow) return false;

    const atividades: Atividade[] = (dayRow.atividades ?? []) as Atividade[];
    if (activityIdx < 0 || activityIdx >= atividades.length) return false;

    const ativ = atividades[activityIdx];
    if (ativ.concluida) return true; // já marcada

    atividades[activityIdx] = {
      ...ativ,
      concluida: true,
      completed_at: new Date().toISOString(),
      item_ref: itemRef ?? ativ.item_ref,
    };

    const total = atividades.length;
    const feitas = atividades.filter((a) => a.concluida).length;
    const pct = Math.round((feitas / total) * 100);

    const { error: ue } = await supabase
      .from("study_plan_days")
      .update({ atividades, concluido_pct: pct, updated_at: new Date().toISOString() })
      .eq("id", planDayId);

    return !ue;
  } catch {
    return false;
  }
}

/**
 * Componente useEffect que auto-marca quando uma condição é atingida
 * (ex: fechamento gerado, prova finalizada). Use dentro do componente
 * que tá no fluxo da atividade.
 */
export function useAutoCompleteActivity(
  shouldComplete: boolean,
  ctx: { planDay: string | null; actIdx: number | null },
  itemRef?: string | null,
) {
  useEffect(() => {
    if (!shouldComplete || !ctx.planDay || ctx.actIdx === null) return;
    markPlanActivityComplete(ctx.planDay, ctx.actIdx, itemRef ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldComplete]);
}
