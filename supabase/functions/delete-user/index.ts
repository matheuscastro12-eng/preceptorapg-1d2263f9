import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verificar que quem chama e admin
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

    // Deletar dados publicos primeiro. A maioria tem ON DELETE CASCADE pro
    // auth.users, mas algumas tabelas tem FK SET NULL ou triggers que podem
    // travar auth.admin.deleteUser. Preferimos limpar explicitamente — se
    // alguma tabela nao existir nesse projeto, o supabase-js retorna erro
    // PGRST205/42P01 e seguimos em frente em vez de abortar a exclusao.
    const tablesByUserId = [
      "crm_funnel_events",
      "crm_health_scores",
      "crm_churn_predictions",
      "crm_automations_log",
      "crm_leads",
      "fechamentos",
      "fechamento_annotations",
      "flashcards",
      "flashcard_reviews",
      "enamed_attempts",
      "exam_attempts",
      "ai_chat_messages",
      "ai_chat_sessions",
      "generation_logs",
      "daily_activity",
      "achievement_progress",
      "user_achievements",
      "follows",
      "posts",
      "post_likes",
      "comments",
      "support_tickets",
      "support_messages",
      "admin_inadimplencias",
      "subscriptions",
      "user_roles",
      "profiles",
    ];

    const tableErrors: string[] = [];
    for (const table of tablesByUserId) {
      const { error } = await supabase.from(table).delete().eq("user_id", user_id);
      if (error && !/does not exist|relation .* does not exist|PGRST205|42P01/i.test(error.message)) {
        // Erro real (FK violation, RLS, etc) — registra mas nao aborta;
        // a falha real aparece no auth.admin.deleteUser logo abaixo.
        console.warn(`delete from ${table} failed:`, error.message);
        tableErrors.push(`${table}: ${error.message}`);
      }
    }

    // Tabelas com colunas alternativas (nao "user_id")
    await supabase.from("crm_referrals").delete().eq("referrer_id", user_id);
    await supabase.from("crm_referrals").delete().eq("referred_id", user_id);
    await supabase.from("follows").delete().eq("follower_id", user_id);
    await supabase.from("follows").delete().eq("following_id", user_id);
    await supabase.from("messages").delete().eq("sender_id", user_id);
    await supabase.from("messages").delete().eq("receiver_id", user_id);

    // Deletar auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);
    if (deleteError) {
      console.error("auth.admin.deleteUser failed for", user_id, deleteError, "table errors:", tableErrors);
      throw new Error(
        `Falha ao excluir conta: ${deleteError.message}` +
          (tableErrors.length ? ` (${tableErrors.join("; ")})` : "")
      );
    }

    return new Response(
      JSON.stringify({ success: true, deleted: user_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg.startsWith("Forbidden") ? 403 : 400;
    return new Response(
      JSON.stringify({ error: msg }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
