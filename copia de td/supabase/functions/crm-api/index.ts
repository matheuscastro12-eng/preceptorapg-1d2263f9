import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-crm-api-key",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: require CRM API key
  const CRM_API_KEY = Deno.env.get("CRM_API_KEY");
  console.log("CRM_API_KEY set:", !!CRM_API_KEY, "length:", CRM_API_KEY?.length, "first4:", CRM_API_KEY?.substring(0, 4));
  if (!CRM_API_KEY) {
    return errorResponse("CRM_API_KEY not configured on server", 500);
  }

  const providedKey = req.headers.get("x-crm-api-key");
  console.log("Provided key length:", providedKey?.length, "first4:", providedKey?.substring(0, 4));
  if (providedKey !== CRM_API_KEY) {
    return errorResponse("Invalid or missing CRM API key", 401);
  }

  // Supabase admin client (service role for full access)
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const url = new URL(req.url);
  const path = url.pathname.replace("/crm-api", "").replace(/^\/+/, "");
  const method = req.method;

  try {
    // ─── LEADS ───
    if (path === "leads" && method === "GET") {
      const stage = url.searchParams.get("stage");
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");

      let query = supabase.from("crm_leads").select("*", { count: "exact" });
      if (stage) query = query.eq("funnel_stage", stage);
      const { data, error, count } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
      if (error) throw error;
      return jsonResponse({ data, total: count });
    }

    if (path === "leads" && method === "POST") {
      const body = await req.json();
      const { data, error } = await supabase.from("crm_leads").insert(body).select().single();
      if (error) throw error;
      return jsonResponse({ data }, 201);
    }

    if (path.startsWith("leads/") && method === "PUT") {
      const id = path.split("/")[1];
      const body = await req.json();
      const { data, error } = await supabase.from("crm_leads").update(body).eq("id", id).select().single();
      if (error) throw error;
      return jsonResponse({ data });
    }

    if (path.startsWith("leads/") && method === "DELETE") {
      const id = path.split("/")[1];
      const { error } = await supabase.from("crm_leads").delete().eq("id", id);
      if (error) throw error;
      return jsonResponse({ success: true });
    }

    // ─── FUNNEL EVENTS ───
    if (path === "funnel-events" && method === "GET") {
      const leadId = url.searchParams.get("lead_id");
      const limit = parseInt(url.searchParams.get("limit") || "50");
      let query = supabase.from("crm_funnel_events").select("*", { count: "exact" });
      if (leadId) query = query.eq("lead_id", leadId);
      const { data, error, count } = await query.order("created_at", { ascending: false }).range(0, limit - 1);
      if (error) throw error;
      return jsonResponse({ data, total: count });
    }

    if (path === "funnel-events" && method === "POST") {
      const body = await req.json();
      // Also update lead's funnel_stage if to_stage is provided
      if (body.lead_id && body.to_stage) {
        await supabase.from("crm_leads").update({ funnel_stage: body.to_stage }).eq("id", body.lead_id);
      }
      const { data, error } = await supabase.from("crm_funnel_events").insert(body).select().single();
      if (error) throw error;
      return jsonResponse({ data }, 201);
    }

    // ─── REFERRALS ───
    if (path === "referrals" && method === "GET") {
      const { data, error } = await supabase.from("crm_referrals").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return jsonResponse({ data });
    }

    if (path === "referrals" && method === "POST") {
      const body = await req.json();
      const { data, error } = await supabase.from("crm_referrals").insert(body).select().single();
      if (error) throw error;
      return jsonResponse({ data }, 201);
    }

    if (path.startsWith("referrals/") && method === "PUT") {
      const id = path.split("/")[1];
      const body = await req.json();
      const { data, error } = await supabase.from("crm_referrals").update(body).eq("id", id).select().single();
      if (error) throw error;
      return jsonResponse({ data });
    }

    // ─── HEALTH SCORES ───
    if (path === "health-scores" && method === "GET") {
      const riskLevel = url.searchParams.get("risk_level");
      let query = supabase.from("crm_health_scores").select("*");
      if (riskLevel) query = query.eq("risk_level", riskLevel);
      const { data, error } = await query.order("calculated_at", { ascending: false });
      if (error) throw error;
      return jsonResponse({ data });
    }

    if (path === "health-scores" && method === "POST") {
      const body = await req.json();
      const { data, error } = await supabase.from("crm_health_scores").insert(body).select().single();
      if (error) throw error;
      return jsonResponse({ data }, 201);
    }

    // ─── READ-ONLY: PreceptorMED data ───
    if (path === "subscribers" && method === "GET") {
      const status = url.searchParams.get("status");
      let query = supabase.from("subscriptions").select("*, profiles!inner(full_name, email, university)");
      if (status) query = query.eq("status", status);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return jsonResponse({ data });
    }

    if (path === "profiles" && method === "GET") {
      const { data, error } = await supabase.from("profiles").select("user_id, full_name, email, university, semester, created_at");
      if (error) throw error;
      return jsonResponse({ data });
    }

    if (path === "metrics/generations" && method === "GET") {
      const days = parseInt(url.searchParams.get("days") || "7");
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const { data, error } = await supabase
        .from("generation_logs")
        .select("function_name, created_at, user_id")
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return jsonResponse({ data, period_days: days });
    }

    if (path === "metrics/summary" && method === "GET") {
      const [subs, profiles, logs] = await Promise.all([
        supabase.from("subscriptions").select("status, plan_type", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("generation_logs").select("id", { count: "exact" })
          .gte("created_at", new Date(Date.now() - 86400000).toISOString()),
      ]);
      return jsonResponse({
        total_users: profiles.count || 0,
        total_subscriptions: subs.count || 0,
        generations_last_24h: logs.count || 0,
        subscriptions_by_status: subs.data?.reduce((acc: Record<string, number>, s) => {
          acc[s.status] = (acc[s.status] || 0) + 1;
          return acc;
        }, {}) || {},
      });
    }

    return errorResponse(`Route not found: ${method} ${path}`, 404);
  } catch (err) {
    console.error("CRM API Error:", err);
    return errorResponse(err.message || "Internal server error", 500);
  }
});
