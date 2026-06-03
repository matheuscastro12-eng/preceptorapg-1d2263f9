// Edge Function: crm-aquisicao (SOMENTE LEITURA)
// Cruza aquisição por canal (lead -> cadastro -> assinatura) com o gasto do
// Meta Ads (meta_ads_sync). Auth: token CRM (HMAC), como meta-ads.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CRM_TOKEN_SECRET = Deno.env.get("CRM_TOKEN_SECRET") ?? "";

async function verifyCrmToken(token: string): Promise<boolean> {
  if (!token || !CRM_TOKEN_SECRET) return false;
  try {
    const [dataB64, sigB64] = token.split(".");
    if (!dataB64 || !sigB64) return false;
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(CRM_TOKEN_SECRET),
      { name: "HMAC", hash: "SHA-256" }, false, ["verify"],
    );
    const dataBytes = Uint8Array.from(atob(dataB64), (c) => c.charCodeAt(0));
    const sigBytes = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, dataBytes);
    if (!valid) return false;
    const payload = JSON.parse(new TextDecoder().decode(dataBytes));
    if (payload.exp && Date.now() > payload.exp) return false;
    return true;
  } catch { return false; }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const { token } = body as { token?: string };
    if (!(await verifyCrmToken(token ?? ""))) {
      return json({ error: "Token CRM inválido ou expirado" }, 401);
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Overview de aquisição por canal (função SQL)
    const { data: ov, error: ovErr } = await sb.rpc("crm_aquisicao_overview");
    if (ovErr) return json({ error: ovErr.message }, 500);

    const canais = (ov?.canais ?? []) as Array<Record<string, number | string>>;
    const overlayBase = (ov?.overlay ?? []) as Array<{ dia: string; cadastros: number }>;
    const resumo = (ov?.resumo ?? {}) as Record<string, number>;

    // Gasto do Meta (meta_ads_sync) para mesclar no overlay + KPIs
    let metaSpend30d = 0;
    let metaSerie: Array<{ data: string; spend: number }> = [];
    let metaCampanhas: unknown[] = [];
    let metaSyncedAt: string | null = null;
    try {
      const { data: row } = await sb
        .from("meta_ads_sync")
        .select("payload, synced_at")
        .order("synced_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (row?.payload) {
        const p = row.payload as { totais?: { spend?: number }; serie?: Array<{ data: string; spend: number }>; campanhas?: unknown[] };
        metaSpend30d = Number(p.totais?.spend ?? 0);
        metaSerie = p.serie ?? [];
        metaCampanhas = p.campanhas ?? [];
        metaSyncedAt = row.synced_at as string;
      }
    } catch (_e) { /* sem sync ainda */ }

    // Overlay: cadastros/dia + gasto Meta/dia (por data)
    const spendByDay = new Map(metaSerie.map((s) => [s.data, Number(s.spend || 0)]));
    const overlay = overlayBase.map((o) => ({
      dia: o.dia,
      cadastros: Number(o.cadastros || 0),
      spend: spendByDay.get(o.dia) ?? 0,
    }));

    return json({
      canais,
      overlay,
      resumo,
      meta: {
        spend_30d: metaSpend30d,
        campanhas: metaCampanhas,
        synced_at: metaSyncedAt,
      },
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
