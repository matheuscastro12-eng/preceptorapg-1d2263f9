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

// NOTA: A API da EasyFlow NAO oferece endpoint publico de cancelar
// assinatura (so GET /subscriptions/filter e GET /subscriptions/{id}).
// Entao o "cancelamento" aqui e 100% local:
//   - immediate: encerra o acesso agora no nosso BD.
//   - end_of_period: marca cancel_at_period_end=true.
// Pra realmente parar a cobranca no cartao, o dono da conta precisa
// cancelar manualmente no painel da EasyFlow (ou a gente usar
// DELETE /customers/remove/{id} que remove o customer inteiro — perigoso).

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

    const now = new Date().toISOString();

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
        message: "Acesso encerrado. IMPORTANTE: pra parar a cobranca no cartao, cancele tambem no painel da EasyFlow — a API deles nao permite cancelamento automatico.",
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
      message: "Renovacao marcada como cancelada. Voce continua com acesso ate o fim do periodo. IMPORTANTE: cancele tambem no painel da EasyFlow pra garantir que nao sera cobrado no proximo ciclo.",
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
