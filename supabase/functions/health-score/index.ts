// Edge Function: Student Health Score Calculator
// Roda via cron a cada hora — calcula score 0-100 para todos os assinantes ativos

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type HealthZone = "healthy" | "attention" | "risk" | "critical";

interface HealthScoreResult {
  score: number;
  zone: HealthZone;
  pts_frequencia: number;
  pts_desempenho: number;
  pts_engajamento: number;
  pts_tendencia: number;
}

interface UserMetrics {
  questoes_7d: number;
  questoes_30d: number;
  acertos_pct: number;
  dias_ativos_14d: number;
  features_usadas: number;
  streak_atual: number;
  score_anterior: number;
}

/**
 * Calcula o Health Score baseado em 4 componentes:
 *
 * 1. Frequência     (30 pts) — dias ativos nos últimos 14 dias + streak
 * 2. Desempenho     (25 pts) — % de acertos nas questões
 * 3. Engajamento    (25 pts) — diversidade de features usadas + questões nos últimos 7 dias
 * 4. Tendência      (20 pts) — melhora ou piora em relação à semana anterior
 */
function calculateHealthScore(metrics: UserMetrics): HealthScoreResult {
  let pts_frequencia = 0;
  let pts_desempenho = 0;
  let pts_engajamento = 0;
  let pts_tendencia = 0;

  // ── FREQUÊNCIA (30 pts) ──────────────────────────────────
  // Dias ativos nos últimos 14 (max 20 pts)
  const diasPct = metrics.dias_ativos_14d / 14;
  pts_frequencia += Math.round(diasPct * 20);

  // Streak atual (max 10 pts)
  if (metrics.streak_atual >= 7) pts_frequencia += 10;
  else if (metrics.streak_atual >= 5) pts_frequencia += 7;
  else if (metrics.streak_atual >= 3) pts_frequencia += 5;
  else if (metrics.streak_atual >= 1) pts_frequencia += 2;

  // ── DESEMPENHO (25 pts) ──────────────────────────────────
  // Baseado no % de acertos
  const acertos = metrics.acertos_pct;
  if (acertos >= 80) pts_desempenho = 25;
  else if (acertos >= 70) pts_desempenho = 20;
  else if (acertos >= 60) pts_desempenho = 15;
  else if (acertos >= 50) pts_desempenho = 10;
  else if (acertos >= 30) pts_desempenho = 5;
  else if (acertos > 0) pts_desempenho = 2;

  // ── ENGAJAMENTO (25 pts) ─────────────────────────────────
  // Questões nos últimos 7 dias (max 15 pts)
  const q7d = metrics.questoes_7d;
  if (q7d >= 50) pts_engajamento += 15;
  else if (q7d >= 20) pts_engajamento += 12;
  else if (q7d >= 10) pts_engajamento += 8;
  else if (q7d >= 5) pts_engajamento += 5;
  else if (q7d >= 1) pts_engajamento += 2;

  // Features usadas (max 10 pts) — indica profundidade de uso
  const features = metrics.features_usadas;
  if (features >= 6) pts_engajamento += 10;
  else if (features >= 4) pts_engajamento += 7;
  else if (features >= 2) pts_engajamento += 4;
  else if (features >= 1) pts_engajamento += 2;

  // ── TENDÊNCIA (20 pts) ───────────────────────────────────
  // Calcula score anterior para comparar tendência
  const scoreAtual = pts_frequencia + pts_desempenho + pts_engajamento;
  const delta = scoreAtual - metrics.score_anterior;

  if (delta >= 10) pts_tendencia = 20;       // Melhorando muito
  else if (delta >= 5) pts_tendencia = 16;   // Melhorando
  else if (delta >= 0) pts_tendencia = 12;   // Estável (mantém)
  else if (delta >= -5) pts_tendencia = 8;   // Caindo um pouco
  else if (delta >= -10) pts_tendencia = 4;  // Caindo
  else pts_tendencia = 0;                     // Caindo muito

  // ── TOTAL ────────────────────────────────────────────────
  const score = Math.min(100, Math.max(0,
    pts_frequencia + pts_desempenho + pts_engajamento + pts_tendencia
  ));

  // ── ZONA ─────────────────────────────────────────────────
  let zone: HealthZone;
  if (score >= 80) zone = "healthy";
  else if (score >= 60) zone = "attention";
  else if (score >= 40) zone = "risk";
  else zone = "critical";

  return {
    score,
    zone,
    pts_frequencia: Math.min(30, pts_frequencia),
    pts_desempenho: Math.min(25, pts_desempenho),
    pts_engajamento: Math.min(25, pts_engajamento),
    pts_tendencia: Math.min(20, pts_tendencia),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { batch_size = 200, user_id } = await req.json().catch(() => ({}));

    // Buscar TODOS os perfis (inclusive quem nao tem lead ainda).
    // O health score deve refletir toda a base cadastrada.
    let profilesQuery = supabase
      .from("profiles")
      .select("user_id, email, full_name");

    if (user_id) {
      profilesQuery = profilesQuery.eq("user_id", user_id);
    } else {
      profilesQuery = profilesQuery.limit(batch_size);
    }

    const { data: profiles, error: profilesError } = await profilesQuery;
    if (profilesError) throw profilesError;

    // Buscar leads existentes pra mapear user_id -> lead (id, produto_interesse)
    const userIds = (profiles ?? []).map((p: any) => p.user_id).filter(Boolean);
    const { data: existingLeads } = await supabase
      .from("crm_leads")
      .select("id, user_id, produto_interesse")
      .in("user_id", userIds);
    const leadMap = new Map((existingLeads ?? []).map((l: any) => [l.user_id, l]));

    // Backfill: criar leads minimos pra profiles sem registro no CRM
    const missingProfiles = (profiles ?? []).filter((p: any) => p.user_id && !leadMap.has(p.user_id));
    if (missingProfiles.length > 0) {
      const { data: created } = await supabase
        .from("crm_leads")
        .insert(missingProfiles.map((p: any) => ({
          user_id: p.user_id,
          email: p.email ?? `${p.user_id}@unknown.local`,
          nome: p.full_name ?? null,
          status: "visitor",
        })))
        .select("id, user_id, produto_interesse");
      (created ?? []).forEach((l: any) => leadMap.set(l.user_id, l));
    }

    const leads = (profiles ?? [])
      .filter((p: any) => p.user_id)
      .map((p: any) => {
        const lead = leadMap.get(p.user_id);
        return {
          user_id: p.user_id,
          lead_id: lead?.id ?? null,
          produto_interesse: lead?.produto_interesse ?? "preceptormed",
        };
      });

    const results = [];
    const errors = [];

    for (const lead of leads ?? []) {
      try {
        // ── Métricas via enamed_attempts (questões respondidas) ──

        // Questões nos últimos 7 dias (soma total_questions de cada attempt)
        const { data: attempts7d } = await supabase
          .from("enamed_attempts")
          .select("total_questions")
          .eq("user_id", lead.user_id)
          .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());

        const q7d = (attempts7d ?? []).reduce((acc, a) => acc + (a.total_questions ?? 0), 0);

        // Questões nos últimos 30 dias
        const { data: attempts30d } = await supabase
          .from("enamed_attempts")
          .select("total_questions")
          .eq("user_id", lead.user_id)
          .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString());

        const q30d = (attempts30d ?? []).reduce((acc, a) => acc + (a.total_questions ?? 0), 0);

        // % de acertos (média ponderada das últimas tentativas)
        const { data: recentAttempts } = await supabase
          .from("enamed_attempts")
          .select("correct_answers, total_questions, percentage")
          .eq("user_id", lead.user_id)
          .order("created_at", { ascending: false })
          .limit(20);

        let acertos_pct = 0;
        if (recentAttempts && recentAttempts.length > 0) {
          const totalQ = recentAttempts.reduce((a, r) => a + (r.total_questions ?? 0), 0);
          const totalC = recentAttempts.reduce((a, r) => a + (r.correct_answers ?? 0), 0);
          acertos_pct = totalQ > 0 ? (totalC / totalQ) * 100 : 0;
        }

        // ── Dias ativos nos últimos 14 dias (via generation_logs) ──
        const { data: activityLogs } = await supabase
          .from("generation_logs")
          .select("created_at")
          .eq("user_id", lead.user_id)
          .gte("created_at", new Date(Date.now() - 14 * 86400000).toISOString());

        const uniqueDays14 = new Set(
          (activityLogs ?? []).map((l) => l.created_at.split("T")[0])
        ).size;

        // Features usadas (funções distintas nos últimos 30 dias)
        const { data: featureLogs } = await supabase
          .from("generation_logs")
          .select("function_name")
          .eq("user_id", lead.user_id)
          .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString());

        const featuresUsadas = new Set(
          (featureLogs ?? []).map((l) => l.function_name)
        ).size;

        // Streak: dias consecutivos com atividade (últimos 30 dias)
        const { data: streakLogs } = await supabase
          .from("generation_logs")
          .select("created_at")
          .eq("user_id", lead.user_id)
          .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
          .order("created_at", { ascending: false });

        let streak = 0;
        if (streakLogs && streakLogs.length > 0) {
          const days = [...new Set(streakLogs.map((l) => l.created_at.split("T")[0]))].sort().reverse();
          const today = new Date().toISOString().split("T")[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
          if (days[0] === today || days[0] === yesterday) {
            streak = 1;
            for (let i = 1; i < days.length; i++) {
              const prev = new Date(days[i - 1]);
              const curr = new Date(days[i]);
              const diff = (prev.getTime() - curr.getTime()) / 86400000;
              if (diff <= 1.5) streak++;
              else break;
            }
          }
        }

        // Score anterior (último calculado). Null = primeira vez (tendencia neutra).
        const { data: prevScore } = await supabase
          .from("crm_health_scores")
          .select("score")
          .eq("user_id", lead.user_id)
          .order("calculado_em", { ascending: false })
          .limit(1)
          .single();

        const hasHistory = prevScore?.score != null;

        const metrics: UserMetrics = {
          questoes_7d: q7d,
          questoes_30d: q30d,
          acertos_pct,
          dias_ativos_14d: uniqueDays14,
          features_usadas: featuresUsadas,
          streak_atual: streak,
          score_anterior: hasHistory ? prevScore!.score : 0,
        };

        const result = calculateHealthScore(metrics);

        // Primeira execucao: zera tendencia pra nao penalizar falta de historico.
        // Delta contra score_anterior=0 sempre daria +20 artificial — forcamos neutro (12pts).
        if (!hasHistory) {
          const neutral = 12;
          const baseScore = result.pts_frequencia + result.pts_desempenho + result.pts_engajamento;
          result.pts_tendencia = neutral;
          result.score = Math.min(100, baseScore + neutral);
          if (result.score >= 80) result.zone = "healthy";
          else if (result.score >= 60) result.zone = "attention";
          else if (result.score >= 40) result.zone = "risk";
          else result.zone = "critical";
        }

        // Upsert no banco (um score por dia)
        const { error: upsertError } = await supabase
          .from("crm_health_scores")
          .upsert({
            user_id: lead.user_id,
            lead_id: lead.lead_id ?? null,
            ...result,
            questoes_7d: metrics.questoes_7d,
            questoes_30d: metrics.questoes_30d,
            acertos_pct: Math.round(acertos_pct * 100) / 100,
            dias_ativos_14d: metrics.dias_ativos_14d,
            score_semana_anterior: hasHistory ? metrics.score_anterior : result.score,
            variacao_score: hasHistory ? result.score - metrics.score_anterior : 0,
            produto: lead.produto_interesse,
            calculado_em: new Date().toISOString(),
          }, {
            onConflict: "user_id",
          });

        if (upsertError) throw upsertError;

        // Disparar alerta se score crítico (< 40)
        if (result.score < 40) {
          await supabase.from("crm_automations_log").insert({
            user_id: lead.user_id,
            automation_type: "email",
            trigger_name: "health_alert",
            trigger_reason: `Health score crítico: ${result.score}/100 (zona: ${result.zone})`,
            channel: "email",
            status: "pending",
            produto: lead.produto_interesse,
          });
        }

        results.push({ user_id: lead.user_id, ...result });
      } catch (err) {
        errors.push({ user_id: lead.user_id, error: (err as Error).message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        errors: errors.length,
        results,
        errors_detail: errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
