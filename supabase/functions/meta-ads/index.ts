// Edge Function: meta-ads (SOMENTE LEITURA)
// Lê performance do Meta Ads (Facebook/Instagram) via Graph API.
// Token e account ficam em secrets — NUNCA no frontend.
//   META_ADS_TOKEN        = token do System User (ads_read)
//   META_ADS_ACCOUNT_ID   = act_XXXXXXXXXX
// Auth: token CRM (HMAC) — só admins do CRM chamam.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH = "https://graph.facebook.com/v21.0";
const CRM_TOKEN_SECRET = Deno.env.get("CRM_TOKEN_SECRET") ?? "";

// ── Auth CRM (HMAC, igual crm-admin-actions) ──
async function verifyCrmToken(token: string): Promise<Record<string, unknown> | null> {
  if (!token || !CRM_TOKEN_SECRET) return null;
  try {
    const [dataB64, sigB64] = token.split(".");
    if (!dataB64 || !sigB64) return null;
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(CRM_TOKEN_SECRET),
      { name: "HMAC", hash: "SHA-256" }, false, ["verify"],
    );
    const dataBytes = Uint8Array.from(atob(dataB64), (c) => c.charCodeAt(0));
    const sigBytes = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, dataBytes);
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(dataBytes));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch { return null; }
}

// ── Conversões: extrai leads/registros/compras do array `actions` ──
const LEAD_TYPES = ["lead", "onsite_conversion.lead_grouped", "offsite_conversion.fb_pixel_lead"];
const REG_TYPES = ["complete_registration", "offsite_conversion.fb_pixel_complete_registration", "onsite_conversion.complete_registration"];
const PURCHASE_TYPES = ["purchase", "offsite_conversion.fb_pixel_purchase", "onsite_web_purchase", "web_in_store_purchase"];

function sumActions(actions: Array<{ action_type: string; value: string }> | undefined, types: string[]): number {
  if (!actions) return 0;
  return actions.filter((a) => types.includes(a.action_type)).reduce((s, a) => s + Number(a.value || 0), 0);
}

function parseConversions(actions?: Array<{ action_type: string; value: string }>) {
  const leads = sumActions(actions, LEAD_TYPES);
  const registros = sumActions(actions, REG_TYPES);
  const compras = sumActions(actions, PURCHASE_TYPES);
  // "conversões" = melhor sinal do funil (registro de conta), com fallback p/ lead
  const conversoes = registros > 0 ? registros : leads;
  return { leads, registros, compras, conversoes };
}

async function graph(path: string, params: Record<string, string>, token: string) {
  const qs = new URLSearchParams({ ...params, access_token: token });
  const res = await fetch(`${GRAPH}/${path}?${qs}`);
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `Graph API ${res.status}`);
  }
  return json;
}

const INSIGHT_FIELDS = "spend,impressions,clicks,ctr,cpc,cpm,reach,actions,cost_per_action_type";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { action = "account_summary", token, date_preset = "last_7d", source } = body as {
      action?: string; token?: string; date_preset?: string; source?: string;
    };

    // Cron (service_role) pode chamar sem token CRM; client precisa do token CRM.
    const isCron = source === "pg_cron" || source === "cron";
    if (!isCron) {
      const payload = await verifyCrmToken(token ?? "");
      if (!payload) return json({ error: "Token CRM inválido ou expirado" }, 401);
    }

    const META_TOKEN = Deno.env.get("META_ADS_TOKEN");
    const ACCOUNT = Deno.env.get("META_ADS_ACCOUNT_ID");
    if (!META_TOKEN || !ACCOUNT) {
      return json({
        error: "not_configured",
        message: "Meta Ads ainda não configurado. Defina os secrets META_ADS_TOKEN e META_ADS_ACCOUNT_ID.",
      }, 200);
    }
    const act = ACCOUNT.startsWith("act_") ? ACCOUNT : `act_${ACCOUNT}`;

    // ── Resumo da conta: totais + série diária + campanhas ──
    if (action === "account_summary" || action === "campaigns" || action === "daily") {
      // Totais do período
      const totalRes = await graph(`${act}/insights`, {
        level: "account", fields: INSIGHT_FIELDS, date_preset,
      }, META_TOKEN);
      const totalRow = totalRes.data?.[0] ?? {};
      const totalConv = parseConversions(totalRow.actions);
      const spend = Number(totalRow.spend ?? 0);

      // Série diária (trend)
      const dailyRes = await graph(`${act}/insights`, {
        level: "account", fields: "spend,impressions,clicks,actions", date_preset, time_increment: "1",
      }, META_TOKEN);
      const serie = (dailyRes.data ?? []).map((d: any) => {
        const conv = parseConversions(d.actions);
        return {
          data: d.date_start,
          spend: Number(d.spend ?? 0),
          clicks: Number(d.clicks ?? 0),
          impressions: Number(d.impressions ?? 0),
          conversoes: conv.conversoes,
          cpl: conv.conversoes > 0 ? Number((Number(d.spend ?? 0) / conv.conversoes).toFixed(2)) : 0,
        };
      });

      // Campanhas (com status)
      const campRes = await graph(`${act}/insights`, {
        level: "campaign",
        fields: "campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,actions",
        date_preset,
      }, META_TOKEN);
      const statusRes = await graph(`${act}/campaigns`, {
        fields: "id,name,status,effective_status,daily_budget,lifetime_budget",
        limit: "200",
      }, META_TOKEN);
      const statusMap: Record<string, any> = {};
      (statusRes.data ?? []).forEach((c: any) => { statusMap[c.id] = c; });

      const campanhas = (campRes.data ?? []).map((c: any) => {
        const conv = parseConversions(c.actions);
        const s = Number(c.spend ?? 0);
        const st = statusMap[c.campaign_id] ?? {};
        return {
          id: c.campaign_id,
          nome: c.campaign_name,
          status: st.effective_status ?? st.status ?? "—",
          spend: s,
          impressions: Number(c.impressions ?? 0),
          clicks: Number(c.clicks ?? 0),
          ctr: Number(c.ctr ?? 0),
          cpc: Number(c.cpc ?? 0),
          cpm: Number(c.cpm ?? 0),
          conversoes: conv.conversoes,
          cpl: conv.conversoes > 0 ? Number((s / conv.conversoes).toFixed(2)) : 0,
          daily_budget: st.daily_budget ? Number(st.daily_budget) / 100 : null,
        };
      }).sort((a: any, b: any) => b.spend - a.spend);

      return json({
        account: act,
        date_preset,
        totais: {
          spend,
          impressions: Number(totalRow.impressions ?? 0),
          clicks: Number(totalRow.clicks ?? 0),
          reach: Number(totalRow.reach ?? 0),
          ctr: Number(totalRow.ctr ?? 0),
          cpc: Number(totalRow.cpc ?? 0),
          cpm: Number(totalRow.cpm ?? 0),
          conversoes: totalConv.conversoes,
          leads: totalConv.leads,
          registros: totalConv.registros,
          compras: totalConv.compras,
          cpl: totalConv.conversoes > 0 ? Number((spend / totalConv.conversoes).toFixed(2)) : 0,
        },
        serie,
        campanhas,
      });
    }

    return json({ error: `Ação desconhecida: ${action}` }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
