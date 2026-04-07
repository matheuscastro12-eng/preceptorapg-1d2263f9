// Edge Function: Inadimplencia Cron
// Roda diariamente via pg_cron — verifica usuarios inadimplentes
// e enfileira emails de cobranca na crm_automations_log

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Regras de disparo por dias de atraso
const RULES = [
  { minDays: 1,  maxDays: 4,  trigger: "inadimplencia_d1",  emailIndex: 1 },
  { minDays: 5,  maxDays: 9,  trigger: "inadimplencia_d5",  emailIndex: 2 },
  { minDays: 10, maxDays: 14, trigger: "inadimplencia_d10", emailIndex: 3 },
] as const;

const AUTO_CANCEL_DAYS = 15;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Buscar todas as inadimplencias ativas
    const { data: inadimplentes, error } = await supabase
      .from("admin_inadimplencias")
      .select("*")
      .eq("status", "em_cobranca");

    if (error) throw error;

    const now = Date.now();
    const results = { emails_queued: 0, auto_cancelled: 0, skipped: 0 };

    for (const item of inadimplentes ?? []) {
      const diasAtraso = Math.floor((now - new Date(item.data_ocorrencia).getTime()) / 86400000);

      // Auto-cancelar apos 15 dias
      if (diasAtraso >= AUTO_CANCEL_DAYS) {
        // Marcar como perdido
        await supabase.from("admin_inadimplencias")
          .update({ status: "perdido" })
          .eq("id", item.id);

        // Cancelar assinatura
        if (item.user_id) {
          await supabase.from("subscriptions")
            .update({ status: "inactive", plan_type: "none" })
            .eq("user_id", item.user_id);

          await supabase.from("crm_leads")
            .update({ status: "churned", churned_at: new Date().toISOString() })
            .eq("user_id", item.user_id);
        }

        console.log(`[Inadimplencia] Auto-cancelled: ${item.email} (${diasAtraso}d atraso)`);
        results.auto_cancelled++;
        continue;
      }

      // Verificar qual email enviar
      const rule = RULES.find(r =>
        diasAtraso >= r.minDays &&
        diasAtraso <= r.maxDays &&
        item.emails_enviados < r.emailIndex
      );

      if (!rule) {
        results.skipped++;
        continue;
      }

      // Buscar lead_id para o crm_automations_log
      let leadId: string | null = null;
      if (item.user_id) {
        const { data: lead } = await supabase
          .from("crm_leads")
          .select("id")
          .eq("user_id", item.user_id)
          .maybeSingle();
        leadId = lead?.id ?? null;
      }

      // Inserir na fila de automacoes
      const { error: insertError } = await supabase.from("crm_automations_log").insert({
        lead_id: leadId,
        user_id: item.user_id,
        automation_type: "email",
        trigger_name: rule.trigger,
        trigger_reason: `Pagamento em atraso ha ${diasAtraso} dias (${item.ultimo_evento})`,
        channel: "email",
        status: "pending",
        produto: "preceptormed",
        metadata: {
          inadimplencia_id: item.id,
          email: item.email,
          nome: item.nome,
          plano: item.plano,
          valor_devido: item.valor_devido,
          dias_atraso: diasAtraso,
          tentativas_pagamento: item.tentativas,
        },
      });

      if (insertError) {
        console.error(`[Inadimplencia] Failed to queue email for ${item.email}:`, insertError.message);
        continue;
      }

      // Atualizar contadores
      await supabase.from("admin_inadimplencias")
        .update({
          emails_enviados: rule.emailIndex,
          ultimo_email_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      console.log(`[Inadimplencia] Queued ${rule.trigger} for ${item.email} (${diasAtraso}d atraso)`);
      results.emails_queued++;
    }

    // Chamar crm-automations para processar a fila
    if (results.emails_queued > 0) {
      const automationsUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/crm-automations`;
      await fetch(automationsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({}),
      }).catch(err => console.error("[Inadimplencia] Failed to trigger crm-automations:", err));
    }

    console.log(`[Inadimplencia] Done: ${JSON.stringify(results)}`);
    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[Inadimplencia Error]", (err as Error).message);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
