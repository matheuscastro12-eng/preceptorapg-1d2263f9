// Edge Function: meta-ads-daily (cron diário)
// Puxa a performance de ONTEM, grava snapshot e manda e-mail com resumo + alertas.
// Agendado via pg_cron (8h BRT). Secrets:
//   META_ADS_REPORT_EMAIL = destinatário do relatório
//   RESEND_API_KEY        = envio de e-mail (já existe no projeto)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const fmtBRL = (v: number) => `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtInt = (v: number) => Number(v).toLocaleString("pt-BR");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
    const REPORT_EMAIL = Deno.env.get("META_ADS_REPORT_EMAIL");
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1) Performance de ONTEM via a função meta-ads (source=cron bypassa token CRM)
    const metaRes = await fetch(`${SUPABASE_URL}/functions/v1/meta-ads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
      body: JSON.stringify({ action: "account_summary", date_preset: "yesterday", source: "cron" }),
    });
    const meta = await metaRes.json();

    if (meta.error === "not_configured") {
      return new Response(JSON.stringify({ skipped: "Meta Ads não configurado (faltam secrets)." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (meta.error) throw new Error(meta.error);

    const t = meta.totais ?? {};
    const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    // 2) Grava snapshot (upsert por data+account)
    await supabase.from("meta_ads_snapshots").upsert({
      data: ontem,
      account_id: meta.account,
      spend: t.spend ?? 0,
      impressions: t.impressions ?? 0,
      clicks: t.clicks ?? 0,
      reach: t.reach ?? 0,
      ctr: t.ctr ?? 0,
      cpc: t.cpc ?? 0,
      cpm: t.cpm ?? 0,
      leads: t.conversoes ?? 0,
      cpl: t.cpl ?? 0,
      campaigns: meta.campanhas ?? [],
    }, { onConflict: "data,account_id" });

    // 3) Comparação com os últimos 7 snapshots (média) p/ alertas
    const { data: prev } = await supabase
      .from("meta_ads_snapshots")
      .select("spend, leads, cpl, data")
      .lt("data", ontem)
      .order("data", { ascending: false })
      .limit(7);
    const avg = (arr: number[]) => arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0;
    const cplMedio = avg((prev ?? []).map((p) => Number(p.cpl)).filter((n) => n > 0));
    const spendMedio = avg((prev ?? []).map((p) => Number(p.spend)));

    const alertas: string[] = [];
    if (cplMedio > 0 && t.cpl > cplMedio * 1.3) {
      alertas.push(`⚠️ CPL de ontem (${fmtBRL(t.cpl)}) está ${Math.round((t.cpl / cplMedio - 1) * 100)}% acima da média dos últimos 7 dias (${fmtBRL(cplMedio)}).`);
    }
    if (spendMedio > 0 && t.spend > spendMedio * 1.4) {
      alertas.push(`⚠️ Gasto de ontem (${fmtBRL(t.spend)}) está bem acima da média (${fmtBRL(spendMedio)}).`);
    }
    if ((t.conversoes ?? 0) === 0 && (t.spend ?? 0) > 0) {
      alertas.push(`🚨 Gastou ${fmtBRL(t.spend)} ontem e 0 conversões registradas. Verifique o pixel/campanhas.`);
    }
    const topCamp = (meta.campanhas ?? []).filter((c: any) => c.spend > 0)
      .sort((a: any, b: any) => b.spend - a.spend).slice(0, 5);

    // 4) E-mail
    let emailSent = false;
    if (RESEND_KEY && REPORT_EMAIL) {
      const rows = topCamp.map((c: any) => `
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid #eee">${c.nome}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right">${fmtBRL(c.spend)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right">${fmtInt(c.conversoes)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right">${c.cpl > 0 ? fmtBRL(c.cpl) : "—"}</td>
        </tr>`).join("");
      const alertHtml = alertas.length
        ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px 14px;margin:16px 0">${alertas.map((a) => `<p style="margin:4px 0;color:#9a3412;font-size:14px">${a}</p>`).join("")}</div>`
        : `<p style="color:#16a34a;font-size:14px;margin:14px 0">✅ Sem alertas. Performance dentro do esperado.</p>`;

      const html = `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#191c1d">
          <div style="height:4px;background:linear-gradient(90deg,#003D32,#006D5B,#C9A84C);border-radius:4px"></div>
          <h2 style="font-size:18px;margin:18px 0 4px">Meta Ads · Relatório de ${new Date(ontem).toLocaleDateString("pt-BR")}</h2>
          <p style="color:#64748b;font-size:13px;margin:0 0 16px">PreceptorMED · resumo automático diário</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:8px">
            <tr>
              <td style="padding:10px;background:#f8f9fa;border-radius:8px"><div style="font-size:11px;color:#64748b;text-transform:uppercase">Gasto</div><div style="font-size:20px;font-weight:700;color:#005344">${fmtBRL(t.spend ?? 0)}</div></td>
              <td style="width:10px"></td>
              <td style="padding:10px;background:#f8f9fa;border-radius:8px"><div style="font-size:11px;color:#64748b;text-transform:uppercase">Conversões</div><div style="font-size:20px;font-weight:700;color:#005344">${fmtInt(t.conversoes ?? 0)}</div></td>
              <td style="width:10px"></td>
              <td style="padding:10px;background:#f8f9fa;border-radius:8px"><div style="font-size:11px;color:#64748b;text-transform:uppercase">CPL</div><div style="font-size:20px;font-weight:700;color:#005344">${t.cpl ? fmtBRL(t.cpl) : "—"}</div></td>
            </tr>
          </table>
          <p style="font-size:13px;color:#64748b;margin:6px 0 0">Cliques: <b>${fmtInt(t.clicks ?? 0)}</b> · Impressões: <b>${fmtInt(t.impressions ?? 0)}</b> · CTR: <b>${Number(t.ctr ?? 0).toFixed(2)}%</b> · CPM: <b>${fmtBRL(t.cpm ?? 0)}</b></p>
          ${alertHtml}
          <h3 style="font-size:14px;margin:18px 0 8px">Top campanhas (por gasto)</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr>
              <th style="padding:8px 10px;text-align:left;color:#94a3b8;font-size:11px;text-transform:uppercase">Campanha</th>
              <th style="padding:8px 10px;text-align:right;color:#94a3b8;font-size:11px;text-transform:uppercase">Gasto</th>
              <th style="padding:8px 10px;text-align:right;color:#94a3b8;font-size:11px;text-transform:uppercase">Conv.</th>
              <th style="padding:8px 10px;text-align:right;color:#94a3b8;font-size:11px;text-transform:uppercase">CPL</th>
            </tr></thead>
            <tbody>${rows || `<tr><td colspan="4" style="padding:16px;text-align:center;color:#94a3b8">Sem gasto ontem</td></tr>`}</tbody>
          </table>
          <p style="font-size:11px;color:#94a3b8;margin-top:24px">Veja o painel completo em /admin/crm-mkt/ads · Quer que o Claude analise ou aja? É só pedir.</p>
        </div>`;

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "PreceptorMED <noreply@thepreceptor.com.br>",
          to: [REPORT_EMAIL],
          subject: `📊 Meta Ads ${new Date(ontem).toLocaleDateString("pt-BR")} — ${fmtBRL(t.spend ?? 0)} · ${fmtInt(t.conversoes ?? 0)} conv.${alertas.length ? " ⚠️" : ""}`,
          html,
        }),
      });
      emailSent = r.ok;
      if (!r.ok) console.warn("[meta-ads-daily] resend falhou:", await r.text());
    }

    return new Response(JSON.stringify({ ok: true, data: ontem, spend: t.spend, conversoes: t.conversoes, alertas: alertas.length, emailSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[meta-ads-daily] erro:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
