import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tabelas com user_id sem FK para auth.users — ficam orfas se nao limparmos
// manualmente antes do auth.admin.deleteUser. Tabelas com FK ON DELETE CASCADE
// sao limpas automaticamente pelo Postgres.
const ORPHAN_TABLES_BY_USER_ID = [
  "fechamentos",
  "flashcards",
  "topic_progress",
  "generation_logs",
  "enamed_attempts",
  "landing_events",
] as const;

// Tabelas de CRM — limpas explicitamente para evitar dados de marketing presos
const CRM_TABLES_BY_USER_ID = [
  "crm_funnel_events",
  "crm_health_scores",
  "crm_churn_predictions",
  "crm_automations_log",
  "crm_leads",
  "subscriptions",
  "user_roles",
  "profiles",
] as const;

async function safeDelete(
  supabase: SupabaseClient,
  table: string,
  column: string,
  userId: string,
): Promise<{ table: string; error: string | null }> {
  try {
    const { error } = await supabase.from(table).delete().eq(column, userId);
    if (error) {
      console.warn(`delete-user: failed to clean ${table}:`, error.message);
      return { table, error: error.message };
    }
    return { table, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`delete-user: exception cleaning ${table}:`, msg);
    return { table, error: msg };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !caller) throw new Error("Unauthorized");

    const { user_id: bodyUserId, self = false } = await req.json();

    // Modos:
    // - self = true: usuario deletando a propria conta (nao precisa ser admin)
    // - self = false: admin deletando qualquer outro user (exceto ele mesmo)
    let user_id: string;
    if (self) {
      user_id = caller.id;
    } else {
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", caller.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!role) throw new Error("Forbidden: not admin");

      if (!bodyUserId) throw new Error("user_id required");
      if (bodyUserId === caller.id) throw new Error("Use self=true para deletar a propria conta");
      user_id = bodyUserId;
    }

    // Limpar referrals (duas colunas distintas) — tolerante a falhas
    await safeDelete(supabase, "crm_referrals", "referrer_id", user_id);
    await safeDelete(supabase, "crm_referrals", "referred_id", user_id);

    // Limpar dados de CRM e dependencias diretas
    const cleanupResults = await Promise.all([
      ...CRM_TABLES_BY_USER_ID.map((t) => safeDelete(supabase, t, "user_id", user_id)),
      ...ORPHAN_TABLES_BY_USER_ID.map((t) => safeDelete(supabase, t, "user_id", user_id)),
    ]);

    const failures = cleanupResults.filter((r) => r.error !== null);
    if (failures.length > 0) {
      console.warn("delete-user: cleanup partial failures:", failures);
    }

    // Deletar auth user (cascade automatica nas tabelas com FK ON DELETE CASCADE)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);
    if (deleteError) {
      console.error("delete-user: auth.admin.deleteUser falhou:", deleteError);
      throw new Error(`Falha ao remover conta: ${deleteError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        deleted: user_id,
        cleanup_warnings: failures.length > 0 ? failures : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = (err as Error).message ?? "Erro desconhecido";
    const status = msg === "Unauthorized" ? 401 : msg.startsWith("Forbidden") ? 403 : 400;
    console.error("delete-user error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
