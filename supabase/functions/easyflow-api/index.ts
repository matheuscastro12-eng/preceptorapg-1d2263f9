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

  // Auth confirmada via test_auth: x-api-key + x-api-secret + business-id
  // (a doc dizia Bearer mas a API nao aceita — testado, so o esquema legacy funciona)

  // Account 1: Recorrente (mensal)
  const k1 = Deno.env.get("EASYFLOW_API_KEY");
  const s1 = Deno.env.get("EASYFLOW_API_SECRET");
  const b1 = Deno.env.get("EASYFLOW_BUSINESS_ID");
  if (k1 && s1 && b1) {
    accounts.push({
      name: "recorrente",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": k1,
        "x-api-secret": s1,
        "business-id": b1,
      },
    });
  } else if (k1 && s1) {
    console.warn("[easyflow-api] Conta recorrente sem EASYFLOW_BUSINESS_ID — pulando");
  }

  // Account 2: Avulsa/parcelamento (anual, bianual)
  const k2 = Deno.env.get("EASYFLOW2_API_KEY");
  const s2 = Deno.env.get("EASYFLOW2_API_SECRET");
  const b2 = Deno.env.get("EASYFLOW2_BUSINESS_ID");
  if (k2 && s2 && b2) {
    accounts.push({
      name: "avulsa",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": k2,
        "x-api-secret": s2,
        "business-id": b2,
      },
    });
  } else if (k2 && s2) {
    console.warn("[easyflow-api] Conta avulsa sem EASYFLOW2_BUSINESS_ID — pulando");
  }

  return accounts;
}

// Fetch from all accounts and merge results, tagging each item with _source.
// EasyFlow envolve resposta em { statusCode, data: <payload>}
// Sales: data.data.sales.docs[]  + data.data.totalTransactionValue, totalCommissions, ticketsCount
// Subscriptions: data.data.docs[] + data.data.totalDocs
// Customers/etc: data.data ou data.docs — variavel
async function fetchAllAccounts(
  accounts: EFAccount[],
  url: string,
  method: string,
  body?: string,
): Promise<{
  items: any[];
  byAccount: Record<string, number>;
  totals: { transactionValue: number; commissions: number; ticketsCount: number; totalDocs: number };
}> {
  const results = await Promise.allSettled(
    accounts.map(async (acc) => {
      const res = await fetch(url, {
        method,
        headers: acc.headers,
        ...(body ? { body } : {}),
      });
      const data = await res.json().catch(() => ({ _parseError: true }));
      return { account: acc.name, status: res.status, data };
    }),
  );

  const items: any[] = [];
  const byAccount: Record<string, number> = {};
  const totals = { transactionValue: 0, commissions: 0, ticketsCount: 0, totalDocs: 0 };

  for (const r of results) {
    if (r.status !== "fulfilled") {
      console.warn(`[easyflow-api] fetch rejected:`, r.reason);
      continue;
    }
    const { account, status, data } = r.value;

    if (status !== 200) {
      console.warn(`[easyflow-api] ${url} (acc=${account}) status=${status}`, JSON.stringify(data).slice(0, 300));
      continue;
    }

    // Extrai array de docs com varios formatos possiveis
    const payload = data?.data ?? data;
    const arr: any[] = Array.isArray(data) ? data
      : Array.isArray(payload) ? payload
      : Array.isArray(payload?.docs) ? payload.docs
      : Array.isArray(payload?.sales?.docs) ? payload.sales.docs
      : Array.isArray(payload?.items) ? payload.items
      : [];

    byAccount[account] = arr.length;

    // Acumula totals quando a propria API ja calcula (sales/filter retorna isso)
    totals.transactionValue += Number(payload?.totalTransactionValue ?? 0);
    totals.commissions += Number(payload?.totalCommissions ?? 0);
    totals.ticketsCount += Number(payload?.ticketsCount ?? 0);
    totals.totalDocs += Number(payload?.totalDocs ?? payload?.sales?.totalDocs ?? arr.length);

    for (const item of arr) {
      items.push({ ...item, _source: account });
    }
  }

  return { items, byAccount, totals };
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
      if (email) {
        // Tenta varios formatos — EasyFlow aceita um deles
        filter.email = email;
        filter.customerEmail = email;
        filter.buyerEmail = email;
        filter.search = email;
      }
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
      if (email) {
        filter.email = email;
        filter.buyerEmail = email;
        filter.customerEmail = email;
        filter.search = email;
      }
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

    // ── DASHBOARD KPIs (sem email — carrega no page load) ──
    if (action === "get_dashboard") {
      // Busca todas as vendas e assinaturas de todas as contas para gerar KPIs
      const [salesResult, subsResult, balanceResult] = await Promise.allSettled([
        // Vendas (ultimas 100 para calcular totais)
        fetchAllAccounts(accounts, `${EASYFLOW_BASE}/sales/filter?page=1&limit=100`, "POST", JSON.stringify({})),
        // Assinaturas
        fetchAllAccounts(accounts, `${EASYFLOW_BASE}/subscriptions/filter?page=1&limit=100`, "POST", JSON.stringify({})),
        // Saldo (balance) — usa primeira conta
        (async () => {
          const res = await fetch(`${EASYFLOW_BASE}/business/balance`, { method: "GET", headers: primaryHeaders });
          return res.json();
        })(),
      ]);

      const salesItems = salesResult.status === "fulfilled" ? salesResult.value.items : [];
      const subsItems = subsResult.status === "fulfilled" ? subsResult.value.items : [];
      const salesTotals = salesResult.status === "fulfilled" ? salesResult.value.totals : { transactionValue: 0, commissions: 0, ticketsCount: 0, totalDocs: 0 };
      const subsTotals = subsResult.status === "fulfilled" ? subsResult.value.totals : { transactionValue: 0, commissions: 0, ticketsCount: 0, totalDocs: 0 };
      const balance = balanceResult.status === "fulfilled" ? balanceResult.value : null;

      // Usa totals da propria API (mais precisos) e fallback pra calculo local
      const totalTransactionValue = salesTotals.transactionValue || salesItems.reduce((s: number, x: any) => s + (x.valueInCents || x.valuePaidInCents || 0), 0);
      const totalCommissions = salesTotals.commissions || salesItems.reduce((s: number, x: any) => s + (x.commissionInCents || x.feeInCents || 0), 0);
      const totalSalesCount = salesTotals.totalDocs || salesItems.length;

      const paidSales = salesItems.filter((s: any) => s.status === "paid" || s.status === "approved");
      const totalPaidValue = paidSales.reduce((sum: number, s: any) => sum + (s.valueInCents || s.valuePaidInCents || 0), 0);

      const activeSubs = subsItems.filter((s: any) => s.status === "active");
      const canceledSubs = subsItems.filter((s: any) => s.status === "canceled" || s.status === "cancelled");

      return json({
        totalTransactionValue,
        totalPaidValue,
        totalSalesCount,
        totalCommissions,
        subscriptions: {
          total: subsTotals.totalDocs || subsItems.length,
          active: activeSubs.length,
          canceled: canceledSubs.length,
        },
        balance: balance,
        sales: salesItems.slice(0, 20),
        subs: subsItems.slice(0, 20),
      });
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