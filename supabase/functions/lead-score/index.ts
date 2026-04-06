// Edge Function: Lead Score Calculator
// Dispara via webhook (novo signup, evento de comportamento) ou cron

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadScoreInput {
  lead_id?: string;
  user_id?: string;
  email?: string;
  // Comportamento
  utm_source?: string;
  utm_medium?: string;
  trial_started?: boolean;
  sessions_count?: number;
  questoes_respondidas?: number;
  features_usadas?: string[];
  fase_medica?: string;
}

/**
 * Calcula o Lead Score (0-100) baseado em origem + comportamento + perfil
 *
 * Critérios:
 * - Origem (UTM Source): até 20 pts
 * - Comportamento (sessões, questões, features): até 50 pts
 * - Perfil (fase médica, especialidade): até 20 pts
 * - Trial ativo: +10 pts bônus
 */
function calculateLeadScore(input: LeadScoreInput): number {
  let score = 0;

  // ── ORIGEM (max 20 pts) ──────────────────────────────────
  const sourcePoints: Record<string, number> = {
    google: 20,        // Intent alta — buscou ativamente
    instagram: 15,     // Orgânico social
    tiktok: 12,        // Viral social
    referral: 18,      // Indicação = alta intenção
    direct: 10,        // Conhece a marca
    email: 16,         // Já está na base
    youtube: 14,       // Consumiu conteúdo longo
    linkedin: 12,      // Profissional
    outros: 5,
  };

  const src = (input.utm_source || "outros").toLowerCase();
  score += sourcePoints[src] ?? sourcePoints["outros"];

  // ── COMPORTAMENTO (max 50 pts) ────────────────────────────

  // Sessões (max 15 pts)
  const sessions = input.sessions_count ?? 0;
  if (sessions >= 10) score += 15;
  else if (sessions >= 5) score += 10;
  else if (sessions >= 2) score += 5;
  else if (sessions >= 1) score += 2;

  // Questões respondidas (max 20 pts)
  const questoes = input.questoes_respondidas ?? 0;
  if (questoes >= 100) score += 20;
  else if (questoes >= 50) score += 15;
  else if (questoes >= 20) score += 10;
  else if (questoes >= 5) score += 5;
  else if (questoes >= 1) score += 2;

  // Features usadas (max 15 pts) — diversidade de uso
  const features = input.features_usadas ?? [];
  const featureCount = features.length;
  if (featureCount >= 5) score += 15;
  else if (featureCount >= 3) score += 10;
  else if (featureCount >= 2) score += 6;
  else if (featureCount >= 1) score += 3;

  // ── PERFIL (max 20 pts) ──────────────────────────────────
  const fasePoints: Record<string, number> = {
    internato: 20,      // Próximo de fazer residência
    residencia: 18,     // Já faz, mas pode usar para estudar
    quarto_ano: 16,     // Começando a pensar em residência
    terceiro_ano: 12,   // Cedo mas relevante
    segundo_ano: 8,
    primeiro_ano: 5,
    outros: 3,
  };

  const fase = (input.fase_medica || "outros")
    .toLowerCase()
    .replace(/\s+/g, "_");
  score += fasePoints[fase] ?? fasePoints["outros"];

  // ── BÔNUS ────────────────────────────────────────────────
  if (input.trial_started) score += 10;

  // ── CAP ─────────────────────────────────────────────────
  return Math.min(100, Math.max(0, score));
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

    const body: LeadScoreInput = await req.json();

    // Buscar lead existente
    let leadQuery = supabase.from("crm_leads").select("*");

    if (body.lead_id) {
      leadQuery = leadQuery.eq("id", body.lead_id);
    } else if (body.user_id) {
      leadQuery = leadQuery.eq("user_id", body.user_id);
    } else if (body.email) {
      leadQuery = leadQuery.eq("email", body.email);
    }

    const { data: lead, error: leadError } = await leadQuery.single();
    if (leadError && leadError.code !== "PGRST116") throw leadError;

    const scoreInput: LeadScoreInput = {
      ...body,
      utm_source: lead?.utm_source ?? body.utm_source,
      trial_started: lead?.trial_started_at != null,
      sessions_count: lead?.total_sessions ?? body.sessions_count,
      fase_medica: lead?.fase_medica ?? body.fase_medica,
    };

    const newScore = calculateLeadScore(scoreInput);

    if (lead) {
      // Atualizar score existente
      const { error: updateError } = await supabase
        .from("crm_leads")
        .update({
          lead_score: newScore,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lead.id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          success: true,
          lead_id: lead.id,
          previous_score: lead.lead_score,
          new_score: newScore,
          delta: newScore - lead.lead_score,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Criar novo lead com score
      const { data: newLead, error: insertError } = await supabase
        .from("crm_leads")
        .insert({
          email: body.email,
          user_id: body.user_id,
          lead_score: newScore,
          utm_source: body.utm_source,
          utm_medium: body.utm_medium,
          fase_medica: body.fase_medica,
          status: "visitor",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({ success: true, lead_id: newLead.id, score: newScore }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
