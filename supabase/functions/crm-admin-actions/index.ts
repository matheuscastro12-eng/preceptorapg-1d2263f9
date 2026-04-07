// Edge Function: CRM Admin Actions
// Handles admin operations that need service_role_key to bypass RLS
// Actions: grant_access, revoke_access, update_plan, get_dashboard_data

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CRM_TOKEN_SECRET = Deno.env.get("CRM_TOKEN_SECRET") ?? "";

function verifyCrmToken(token: string): boolean {
  if (!token || !CRM_TOKEN_SECRET) return false;
  try {
    const [dataB64, sig] = token.split(".");
    if (!dataB64 || !sig) return false;
    const data = JSON.parse(atob(dataB64));
    if (data.exp && data.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, token } = body;

    // Verify CRM admin token
    if (!verifyCrmToken(token)) {
      return json({ error: "Token CRM invalido ou expirado" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── GRANT ACCESS ──
    if (action === "grant_access") {
      const { user_id, plan_type, access_expires_at, granted_by } = body;
      if (!user_id) return json({ error: "user_id obrigatorio" }, 400);

      const { data: existing } = await supabase
        .from("subscriptions").select("id").eq("user_id", user_id).maybeSingle();

      const subData = {
        status: "active",
        plan_type: plan_type || "free_access",
        granted_by: granted_by || null,
        access_expires_at: access_expires_at || null,
      };

      if (existing) {
        const { error } = await supabase.from("subscriptions").update(subData).eq("user_id", user_id);
        if (error) return json({ error: error.message }, 500);
      } else {
        const { error } = await supabase.from("subscriptions").insert({ user_id, ...subData });
        if (error) return json({ error: error.message }, 500);
      }

      return json({ success: true, action: "granted" });
    }

    // ── REVOKE ACCESS ──
    if (action === "revoke_access") {
      const { user_id } = body;
      if (!user_id) return json({ error: "user_id obrigatorio" }, 400);

      const { error } = await supabase.from("subscriptions")
        .update({ status: "inactive", plan_type: "none", access_expires_at: null })
        .eq("user_id", user_id);
      if (error) return json({ error: error.message }, 500);

      return json({ success: true, action: "revoked" });
    }

    // ── UPDATE PLAN ──
    if (action === "update_plan") {
      const { user_id, plan_type } = body;
      if (!user_id || !plan_type) return json({ error: "user_id e plan_type obrigatorios" }, 400);

      const status = plan_type === "none" ? "inactive" : "active";
      const { data: existing } = await supabase
        .from("subscriptions").select("id").eq("user_id", user_id).maybeSingle();

      const subData = { status, plan_type, access_expires_at: null };
      if (existing) {
        const { error } = await supabase.from("subscriptions").update(subData).eq("user_id", user_id);
        if (error) return json({ error: error.message }, 500);
      } else {
        const { error } = await supabase.from("subscriptions").insert({ user_id, ...subData });
        if (error) return json({ error: error.message }, 500);
      }

      return json({ success: true, action: "plan_updated" });
    }

    // ── GET ALL SUBSCRIPTIONS (for dashboard) ──
    if (action === "get_subscriptions") {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("user_id, status, plan_type, access_expires_at, created_at, updated_at");
      if (error) return json({ error: error.message }, 500);
      return json({ subscriptions: data });
    }

    return json({ error: `Acao desconhecida: ${action}` }, 400);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
