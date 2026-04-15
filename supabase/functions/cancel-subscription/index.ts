// Edge Function: Cancel subscription (self-service, autenticado).
// Aceita dois modos:
//   - 'end_of_period': marca cancel_at_period_end=true, assinatura continua
//     ativa ate current_period_end (ou access_expires_at) e nao renova.
//   - 'immediate': encerra agora — status=inactive, plan_type=none, access
//     expira imediatamente.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EASYFLOW_BASE = "https://9iq81tsdy4.execute-api.sa-east-1.amazonaws.com";

function getEasyflowHeaders(): Array<Record<string, string>> {
  const headers: Array<Record<string, string>> = [];
  const k1 = Deno.env.get("EASYFLOW_API_KEY");
  const s1 = Deno.env.get("EASYFLOW_API_SECRET");
  const b1 = Deno.env.get("EASYFLOW_BUSINESS_ID");
  if (k1 && s1) headers.push({ "Content-Type": "application/json", "x-api-key": k1, "x-api-secret": s1, ...(b1 ? { "business-id": b1 } : {}) });
  const k2 = Deno.env.get("EASYFLOW2_API_KEY");
  const s2 = Deno.env.get("EASYFLOW2_API_SECRET");
  const b2 = Deno.env.get("EASYFLOW2_BUSINESS_ID");
  if (k2 && s2) headers.push({ "Content-Type": "application/json", "x-api-key": k2, "x-api-secret": s2, ...(b2 ? { "business-id": b2 } : {}) });
  return headers;
}

// Tenta cancelar subscription remotamente. Testa DELETE e POST /cancel em
// cada conta ate achar uma que funcione. Retorna true se algum conseguiu.
async function cancelRemote(subscriptionId: string): Promise<{ ok: boolean; detail: string }> {
  const headersList = getEasyflowHeaders();
  if (headersList.length === 0) return { ok: false, detail: "sem credenciais EasyFlow" };

  const attempts: Array<{ method: string; path: string }> = [
    { method: "DELETE", path: `/subscriptions/${subscriptionId}` },
    { method: "POST", path: `/subscriptions/${subscriptionId}/cancel` },
    { method: "PATCH", path: `/subscriptions/${subscriptionId}` },
  ];

  const logs: string[] = [];
  for (const headers of headersList) {
    for (const a of attempts) {
      try {
        const res = await fetch(`${EASYFLOW_BASE}${a.path}`, {
          method: a.method,
          headers,
          body: a.method === "PATCH" ? JSON.stringify({ status: "cancelled" }) : undefined,
        });
        logs.push(`${a.method} ${a.path} -> ${res.status}`);
        if (res.ok) {
          return { ok: true, detail: `${a.method} ${a.path} ${res.status}` };
        }
      } catch (err) {
        logs.push(`${a.method} ${a.path} -> ${(err as Error).message}`);
      }
    }
  }
  return { ok: false, detail: logs.join("; ") };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Nao autenticado" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: "Token invalido" }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const mode = (body.mode as "immediate" | "end_of_period") ?? "end_of_period";

    // Carrega subscription pra pegar o stripe_subscription_id (id da EasyFlow)
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, plan_type, status")
      .eq("user_id", userId)
      .maybeSingle();

    const now = new Date().toISOString();

    // Tenta cancelar na EasyFlow (so se tem ID remoto valido). Nao bloqueia
    // em caso de falha — user ainda consegue desativar localmente.
    let remoteResult: { ok: boolean; detail: string } | null = null;
    if (sub?.stripe_subscription_id) {
      remoteResult = await cancelRemote(sub.stripe_subscription_id);
      console.log(`[cancel-subscription] remote: ${remoteResult.ok ? "OK" : "FAIL"} ${remoteResult.detail}`);
    }

    if (mode === "immediate") {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "inactive",
          plan_type: "none",
          access_expires_at: now,
          cancel_at_period_end: false,
          canceled_at: now,
          updated_at: now,
        })
        .eq("user_id", userId);
      if (error) return json({ error: error.message }, 500);

      // Atualiza status no CRM tambem
      await supabase
        .from("crm_leads")
        .update({ status: "churned", churned_at: now })
        .eq("user_id", userId);

      return json({
        success: true,
        mode: "immediate",
        message: remoteResult?.ok
          ? "Assinatura cancelada agora. Acesso encerrado e cobranca do cartao parada."
          : remoteResult
            ? "Acesso encerrado. ATENCAO: nao conseguimos parar a cobranca na EasyFlow automaticamente — entre em contato com suporte se precisar."
            : "Assinatura cancelada agora. Acesso encerrado.",
        remote: remoteResult,
      });
    }

    // end_of_period (default)
    const { error } = await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        canceled_at: now,
        updated_at: now,
      })
      .eq("user_id", userId);
    if (error) return json({ error: error.message }, 500);

    return json({
      success: true,
      mode: "end_of_period",
      message: remoteResult?.ok
        ? "Renovacao cancelada na EasyFlow. Voce continua com acesso ate o fim do periodo atual e nao sera cobrado novamente."
        : remoteResult
          ? "Renovacao marcada como cancelada. ATENCAO: cobranca na EasyFlow pode continuar no proximo ciclo — contate o suporte se precisar."
          : "Renovacao cancelada. Voce continua com acesso ate o fim do periodo atual.",
      remote: remoteResult,
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
