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

    // Checar role admin
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!role) throw new Error("Forbidden: not admin");

    const { user_id } = await req.json();
    if (!user_id) throw new Error("user_id required");

    // Nao permitir deletar a si mesmo
    if (user_id === caller.id) throw new Error("Cannot delete yourself");

    // Deletar dados publicos primeiro (cascade)
    await supabase.from("crm_funnel_events").delete().eq("user_id", user_id);
    await supabase.from("crm_health_scores").delete().eq("user_id", user_id);
    await supabase.from("crm_churn_predictions").delete().eq("user_id", user_id);
    await supabase.from("crm_automations_log").delete().eq("user_id", user_id);
    await supabase.from("crm_referrals").delete().eq("referrer_id", user_id);
    await supabase.from("crm_leads").delete().eq("user_id", user_id);
    await supabase.from("subscriptions").delete().eq("user_id", user_id);
    await supabase.from("user_roles").delete().eq("user_id", user_id);
    await supabase.from("profiles").delete().eq("user_id", user_id);

    // Deletar auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);
    if (deleteError) throw deleteError;

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
