// Edge Function: Churn Prediction Engine
// Identifica usuários com risco de churn 14 dias antes — roda a cada 4h

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RiskLevel = "low" | "medium" | "high" | "critical";

interface ChurnSignals {
  login_down_50pct: boolean;
  zero_questions_5days: boolean;
  three_emails_unopened: boolean;
  card_declined: boolean;
  visited_cancellation: boolean;
  downgrade_intent: boolean;
  health_score_below_40: boolean;
  no_login_7days: boolean;
  streak_broken: boolean;
}

interface ChurnPredictionResult {
  churn_probability: number;
  risk_level: RiskLevel;
  signals: string[];
  intervention_type: string;
}

/**
 * Modelo de risco baseado em regras (rule-based ML)
 * Identifica sinais de churn e calcula probabilidade 0-1
 *
 * Intervenções por nível:
 * - Medium (40-59%): email personalizado
 * - High (60-79%): push + WhatsApp com oferta de mentoria
 * - Critical (80%+): desconto 30% + chamada do time de sucesso
 */
function predictChurn(signals: ChurnSignals, healthScore: number): ChurnPredictionResult {
  let probability = 0;
  const activeSignals: string[] = [];

  // ── SINAIS E PESOS ────────────────────────────────────────

  if (signals.no_login_7days) {
    probability += 0.25;
    activeSignals.push("no_login_7days");
  }

  if (signals.login_down_50pct) {
    probability += 0.15;
    activeSignals.push("login_down_50pct");
  }

  if (signals.zero_questions_5days) {
    probability += 0.20;
    activeSignals.push("zero_questions_5days");
  }

  if (signals.three_emails_unopened) {
    probability += 0.10;
    activeSignals.push("three_emails_unopened");
  }

  if (signals.card_declined) {
    probability += 0.30;
    activeSignals.push("card_declined");
  }

  if (signals.visited_cancellation) {
    probability += 0.35;
    activeSignals.push("visited_cancellation");
  }

  if (signals.downgrade_intent) {
    probability += 0.20;
    activeSignals.push("downgrade_intent");
  }

  if (signals.health_score_below_40) {
    probability += 0.15;
    activeSignals.push("health_score_below_40");
  }

  if (signals.streak_broken) {
    probability += 0.10;
    activeSignals.push("streak_broken");
  }

  // Ajuste pelo health score atual
  if (healthScore < 20) probability = Math.min(1, probability + 0.20);
  else if (healthScore < 40) probability = Math.min(1, probability + 0.10);
  else if (healthScore > 80) probability = Math.max(0, probability - 0.15);

  // Cap entre 0 e 1
  probability = Math.min(1, Math.max(0, probability));

  // ── NÍVEL DE RISCO ───────────────────────────────────────
  let risk_level: RiskLevel;
  let intervention_type: string;

  if (probability >= 0.80) {
    risk_level = "critical";
    intervention_type = "desconto_30pct_call"; // call do time de sucesso
  } else if (probability >= 0.60) {
    risk_level = "high";
    intervention_type = "push_whatsapp_mentoria"; // push + WhatsApp com oferta
  } else if (probability >= 0.40) {
    risk_level = "medium";
    intervention_type = "email_personalizado"; // email personalizado
  } else {
    risk_level = "low";
    intervention_type = "none";
  }

  return {
    churn_probability: Math.round(probability * 10000) / 10000,
    risk_level,
    signals: activeSignals,
    intervention_type,
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

    const { threshold = 0.40, batch_size = 200 } = await req.json().catch(() => ({}));

    // Buscar assinantes ativos
    const { data: subscribers, error: subsError } = await supabase
      .from("crm_leads")
      .select("id, user_id, email, produto_interesse")
      .eq("status", "subscriber")
      .not("user_id", "is", null)
      .limit(batch_size);

    if (subsError) throw subsError;

    const processed = [];
    const interventions_queued = [];

    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 86400000);
    const d5 = new Date(now.getTime() - 5 * 86400000);

    for (const sub of subscribers ?? []) {
      // ── COLETAR SINAIS ────────────────────────────────────

      // Última atividade (via generation_logs)
      const { data: lastActivity } = await supabase
        .from("generation_logs")
        .select("created_at")
        .eq("user_id", sub.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const noLogin7days = !lastActivity ||
        new Date(lastActivity.created_at) < d7;

      // Atividade esta semana vs semana passada (via generation_logs)
      const { count: activityThisWeek } = await supabase
        .from("generation_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", sub.user_id)
        .gte("created_at", new Date(now.getTime() - 7 * 86400000).toISOString());

      const { count: activityPrevWeek } = await supabase
        .from("generation_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", sub.user_id)
        .gte("created_at", new Date(now.getTime() - 14 * 86400000).toISOString())
        .lt("created_at", new Date(now.getTime() - 7 * 86400000).toISOString());

      const loginDown50pct = (activityPrevWeek ?? 0) > 0 &&
        (activityThisWeek ?? 0) < (activityPrevWeek ?? 0) * 0.5;

      // Questões nos últimos 5 dias (via enamed_attempts)
      const { count: q5d } = await supabase
        .from("enamed_attempts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", sub.user_id)
        .gte("created_at", d5.toISOString());

      const zeroQuestions5days = (q5d ?? 0) === 0;

      // Health Score atual
      const { data: healthScore } = await supabase
        .from("crm_health_scores")
        .select("score")
        .eq("user_id", sub.user_id)
        .order("calculado_em", { ascending: false })
        .limit(1)
        .single();

      const currentHealthScore = healthScore?.score ?? 50;

      // Emails não abertos (últimos 3 da automação)
      const { count: unopenedEmails } = await supabase
        .from("crm_automations_log")
        .select("*", { count: "exact", head: true })
        .eq("user_id", sub.user_id)
        .eq("channel", "email")
        .not("sent_at", "is", null)
        .is("opened_at", null)
        .limit(3);

      const threeEmailsUnopened = (unopenedEmails ?? 0) >= 3;

      const signals: ChurnSignals = {
        login_down_50pct: loginDown50pct,
        zero_questions_5days: zeroQuestions5days,
        three_emails_unopened: threeEmailsUnopened,
        card_declined: false,      // TODO: integrar com Stripe webhook
        visited_cancellation: false, // TODO: integrar com analytics
        downgrade_intent: false,    // TODO: integrar com eventos de produto
        health_score_below_40: currentHealthScore < 40,
        no_login_7days: noLogin7days,
        streak_broken: false,       // TODO: integrar com gamification
      };

      const prediction = predictChurn(signals, currentHealthScore);

      if (prediction.churn_probability >= threshold) {
        // Salvar/atualizar predição
        const validUntil = new Date(now.getTime() + 14 * 86400000);

        const { error: upsertError } = await supabase
          .from("crm_churn_predictions")
          .upsert({
            user_id: sub.user_id,
            lead_id: sub.id,
            churn_probability: prediction.churn_probability,
            risk_level: prediction.risk_level,
            signals: prediction.signals,
            intervention_sent: false,
            intervention_type: prediction.intervention_type,
            prediction_window: 14,
            valid_until: validUntil.toISOString(),
            produto: sub.produto_interesse,
            updated_at: now.toISOString(),
          }, {
            onConflict: "user_id",
          });

        if (upsertError) throw upsertError;

        // Enfileirar automação de intervenção se não foi enviada ainda
        if (prediction.intervention_type !== "none") {
          const triggerMap: Record<string, string> = {
            "email_personalizado": "churn_prevention",
            "push_whatsapp_mentoria": "churn_prevention",
            "desconto_30pct_call": "churn_prevention",
          };

          await supabase.from("crm_automations_log").insert({
            user_id: sub.user_id,
            lead_id: sub.id,
            automation_type: prediction.intervention_type.includes("email") ? "email" : "whatsapp",
            trigger_name: triggerMap[prediction.intervention_type] ?? "churn_prevention",
            trigger_reason: `Churn prob: ${(prediction.churn_probability * 100).toFixed(0)}% | Sinais: ${prediction.signals.join(", ")}`,
            channel: prediction.intervention_type.includes("email") ? "email" : "whatsapp",
            status: "pending",
            metadata: { intervention_type: prediction.intervention_type, signals: prediction.signals },
            produto: sub.produto_interesse,
          });

          interventions_queued.push({
            user_id: sub.user_id,
            intervention: prediction.intervention_type,
          });
        }

        processed.push({
          user_id: sub.user_id,
          email: sub.email,
          ...prediction,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_checked: (subscribers ?? []).length,
        at_risk: processed.length,
        interventions_queued: interventions_queued.length,
        results: processed,
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
