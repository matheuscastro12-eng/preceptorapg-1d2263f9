// EasyFlow API Proxy — keeps credentials server-side
// Supports 2 EasyFlow accounts:
//   Account 1 (EASYFLOW_*): Cobrança recorrente (mensal)
//   Account 2 (EASYFLOW2_*): Cobrança avulsa com parcelamento (anual/bianual)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EASYFLOW_BASE = "https://9iq81tsdy4.execute-api.sa-east-1.amazonaws.com";

interface EFAccount {
  name: string;
  headers: Record<string, string>;
}

function getAccounts(): EFAccount[] {
  const accounts: EFAccount[] = [];

  // EasyFlow docs: auth = Bearer token. Usa o API_SECRET como token.
  // Mantem headers antigos (x-api-key) como fallback caso a API aceite ambos.

  // Account 1: Recorrente (mensal)
  const k1 = Deno.env.get("EASYFLOW_API_KEY");
  const s1 = Deno.env.get("EASYFLOW_API_SECRET");
  const b1 = Deno.env.get("EASYFLOW_BUSINESS_ID");
  if (k1 && s1) {
    accounts.push({
      name: "recorrente",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${s1}`,
        "x-api-key": k1,
        "x-api-secret": s1,
        ...(b1 ? { "business-id": b1 } : {}),
      },
    });
  }

  // Account 2: Avulsa/parcelamento (anual, bianual)
  const k2 = Deno.env.get("EASYFLOW2_API_KEY");
  const s2 = Deno.env.get("EASYFLOW2_API_SECRET");
  const b2 = Deno.env.get("EASYFLOW2_BUSINESS_ID");
  if (k2 && s2) {
    accounts.push({
      name: "avulsa",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${s2}`,
        "x-api-key": k2,
        "x-api-secret": s2,
        ...(b2 ? { "business-id": b2 } : {}),
      },
    });
  }

  return accounts;
}

// Fetch from all accounts and merge results, tagging each item with _source
async function fetchAllAccounts(
  accounts: EFAccount[],
  url: string,
  method: string,
  body?: string,
): Promise<{ items: any[]; byAccount: Record<string, number> }> {
  const results = await Promise.allSettled(
    accounts.map(async (acc) => {
      const res = await fetch(url, {
        method,
        headers: acc.headers,
        ...(body ? { body } : {}),
      });
      const data = await res.json();
      return { account: acc.name, data };
    }),
  );

  const items: any[] = [];
  const byAccount: Record<string, number> = {};

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    const { account, data } = r.value;

    // EasyFlow returns { data: [...] } or { items: [...] } or array directly
    const arr = Array.isArray(data) ? data
      : Array.isArray(data?.data) ? data.data
      : Array.isArray(data?.items) ? data.items
      : [];

    byAccount[account] = arr.length;

    for (const item of arr) {
      items.push({ ...item, _source: account });
    }
  }

  return { items, byAccount };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      const { data: role } = await supabase
        .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!role) return json({ error: "Forbidden" }, 403);
    }
  }

  const accounts = getAccounts();
  if (accounts.length === 0) {
    return json({ error: "No EasyFlow accounts configured" }, 500);
  }

  // Default to first account for single-account operations
  const primaryHeaders = accounts[0].headers;

  try {
    const body = await req.json();
    const { action } = body;

    // ── LIST SUBSCRIPTIONS (merged from all accounts) ──
    if (action === "list_subscriptions") {
      const { page = 1, limit = 20, email, status } = body;
      const filter: Record<string, any> = {};
      if (email) filter.email = email;
      if (status) filter.status = status;

      const url = `${EASYFLOW_BASE}/subscriptions/filter?page=${page}&limit=${limit}`;
      const { items, byAccount } = await fetchAllAccounts(accounts, url, "POST", JSON.stringify(filter));

      return json({ data: items, total: items.length, sources: byAccount });
    }

    // ── GET SUBSCRIPTION ──
    if (action === "get_subscription") {
      const { subscriptionId } = body;
      if (!subscriptionId) return json({ error: "subscriptionId required" }, 400);

      // Try all accounts until found
      for (const acc of accounts) {
        try {
          const res = await fetch(`${EASYFLOW_BASE}/subscriptions/${subscriptionId}`, {
            method: "GET", headers: acc.headers,
          });
          const data = await res.json();
          if (data && !data.error) return json({ ...data, _source: acc.name });
        } catch {}
      }
      return json({ error: "Subscription not found" }, 404);
    }

    // ── LIST SALES (merged from all accounts) ──
    if (action === "list_sales") {
      const { page = 1, limit = 20, email, status, initialDate, endDate } = body;
      const filter: Record<string, any> = {};
      if (email) filter.email = email;
      if (status) filter.status = status;
      if (initialDate) filter.initialDate = initialDate;
      if (endDate) filter.endDate = endDate;

      const url = `${EASYFLOW_BASE}/sales/filter?page=${page}&limit=${limit}`;
      const { items, byAccount } = await fetchAllAccounts(accounts, url, "POST", JSON.stringify(filter));

      return json({ data: items, total: items.length, sources: byAccount });
    }

    // ── LIST CUSTOMERS (merged) ──
    if (action === "list_customers") {
      const { page = 1, limit = 20 } = body;
      const url = `${EASYFLOW_BASE}/customers?page=${page}&limit=${limit}`;
      const { items, byAccount } = await fetchAllAccounts(accounts, url, "GET");

      return json({ data: items, total: items.length, sources: byAccount });
    }

    // ── GET FINANCIALS (merged) ──
    if (action === "get_financials") {
      const results = await Promise.allSettled(
        accounts.map(async (acc) => {
          const res = await fetch(`${EASYFLOW_BASE}/financials`, { method: "GET", headers: acc.headers });
          return { account: acc.name, data: await res.json() };
        }),
      );

      const merged: Record<string, any> = {};
      for (const r of results) {
        if (r.status === "fulfilled") {
          merged[r.value.account] = r.value.data;
        }
      }
      return json(merged);
    }

    // ── CANCEL SUBSCRIPTION ──
    if (action === "cancel_subscription") {
      const { subscriptionId } = body;
      if (!subscriptionId) return json({ error: "subscriptionId required" }, 400);

      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "inactive", plan_type: "none" })
        .eq("stripe_subscription_id", subscriptionId);

      if (error) return json({ error: error.message }, 500);

      console.log(`[EasyFlow API] Subscription cancelled locally: ${subscriptionId}`);
      return json({ success: true, action: "cancelled_locally", subscriptionId });
    }

    // ── REFUND ──
    if (action === "request_refund") {
      const { orderId, reason, account: targetAccount } = body;
      if (!orderId) return json({ error: "orderId required" }, 400);

      // Use specified account or try all
      const targetHeaders = targetAccount
        ? accounts.find(a => a.name === targetAccount)?.headers || primaryHeaders
        : primaryHeaders;

      const res = await fetch(`${EASYFLOW_BASE}/refunds`, {
        method: "POST",
        headers: targetHeaders,
        body: JSON.stringify({ orderId, reason: reason || "Solicitado pelo admin" }),
      });
      const data = await res.json();
      return json(data);
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
