/**
 * /admin/crm-mkt/ads — Dashboard Meta Ads (somente leitura).
 *
 * Lê via edge function `meta-ads`. Dois modos:
 *  - Sincronizado (ponte): dados puxados pelo Claude via Meta Ads MCP e
 *    gravados em meta_ads_sync. Mostra banner "sincronizado via Claude".
 *  - Live (futuro): se os secrets META_ADS_TOKEN/ACCOUNT_ID forem definidos,
 *    a função puxa direto da Graph API e o seletor de período funciona.
 *
 * Esta conta é majoritariamente tráfego/awareness — não há um evento único
 * de conversão. Por isso mostramos métricas limpas (gasto, cliques, alcance,
 * CTR, CPC, CPM) e, por campanha, o "Resultado" no tipo do próprio objetivo.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CrmShellV3, { Kpi, PageHero, CardHead } from "@/components/crm/v3/CrmShellV3";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

const META_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-ads`;
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const fmtBRL = (v: number) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtInt = (v: number) => Number(v || 0).toLocaleString("pt-BR");

const PERIODOS: { id: string; label: string }[] = [
  { id: "yesterday", label: "Ontem" },
  { id: "last_7d", label: "7 dias" },
  { id: "last_14d", label: "14 dias" },
  { id: "last_30d", label: "30 dias" },
  { id: "this_month", label: "Este mês" },
];

const OBJ_LABEL: Record<string, string> = {
  LINK_CLICKS: "Tráfego",
  OUTCOME_TRAFFIC: "Tráfego",
  OUTCOME_AWARENESS: "Reconhecimento",
  BRAND_AWARENESS: "Reconhecimento",
  REACH: "Alcance",
  OUTCOME_ENGAGEMENT: "Engajamento",
  POST_ENGAGEMENT: "Engajamento",
  OUTCOME_LEADS: "Leads",
  LEAD_GENERATION: "Leads",
  OUTCOME_SALES: "Vendas",
  CONVERSIONS: "Conversões",
  MESSAGES: "Mensagens",
  VIDEO_VIEWS: "Vídeo",
};
const objLabel = (o?: string) => (o ? OBJ_LABEL[o] || o.replace(/^OUTCOME_/, "").replace(/_/g, " ").toLowerCase() : "—");

interface Campanha {
  id: string; nome: string; status: string; objetivo?: string;
  spend: number; impressions: number; clicks: number; ctr: number; cpc: number; cpm: number;
  resultado?: number | null; resultado_tipo?: string; custo_resultado?: number | null; daily_budget?: number | null;
}
interface MetaResponse {
  error?: string; message?: string;
  synced?: boolean; synced_at?: string; account?: string; period_label?: string;
  totais?: { spend: number; impressions: number; clicks: number; reach: number; ctr: number; cpc: number; cpm: number; frequency?: number };
  serie?: { data: string; spend: number; clicks: number; impressions: number }[];
  campanhas?: Campanha[];
}

async function fetchMetaAds(datePreset: string): Promise<MetaResponse> {
  const token = localStorage.getItem("crm_token");
  const res = await fetch(META_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: API_KEY, Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ action: "account_summary", date_preset: datePreset, token }),
  });
  return res.json();
}

const statusTag = (st: string) => {
  const s = (st || "").toUpperCase();
  if (s.includes("ACTIVE")) return "green";
  if (s.includes("PAUSED")) return "gold";
  return "gray";
};

const fmtSync = (iso?: string) => {
  if (!iso) return "";
  try { return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
};

export default function CrmAds() {
  const [periodo, setPeriodo] = useState("last_30d");
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["crm-meta-ads", periodo],
    queryFn: () => fetchMetaAds(periodo),
    staleTime: 5 * 60 * 1000,
  });

  const notConfigured = data?.error === "not_configured";
  const synced = !!data?.synced;
  const t = data?.totais;

  return (
    <CrmShellV3 mode="marketing" crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "Meta Ads" }]}
      topbarTools={
        <button className="crm-btn crm-btn-ghost" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Atualizar
        </button>
      }
    >
      <main className="crm-page">
        <PageHero
          eyebrow="Marketing · Meta Ads"
          title={<>Performance <em>Facebook & Instagram</em></>}
          sub="Gasto, alcance e resultado por campanha. Conta de tráfego/awareness — o resultado aparece no tipo do objetivo de cada campanha."
        />

        {/* Banner: dados sincronizados via Claude (modo ponte) */}
        {synced && !notConfigured && (
          <div className="crm-card" style={{ padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, borderLeft: "3px solid #006D5B" }}>
            <CheckCircle2 size={17} style={{ color: "#006D5B", flexShrink: 0 }} />
            <div style={{ fontSize: 12.5, color: "var(--crm-ink-2)", lineHeight: 1.5 }}>
              <b style={{ color: "var(--crm-ink)" }}>Sincronizado via Claude</b> (Meta Ads){data?.period_label ? ` · ${data.period_label}` : ""}
              {data?.synced_at ? ` · atualizado ${fmtSync(data.synced_at)}` : ""}
              {data?.account ? <span style={{ color: "var(--crm-ink-4)" }}> · {data.account}</span> : null}
            </div>
          </div>
        )}

        {/* Seletor de período — só no modo live (no modo sincronizado o período é fixo) */}
        {!synced && !notConfigured && (
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {PERIODOS.map((p) => (
              <button key={p.id} onClick={() => setPeriodo(p.id)}
                className={`crm-btn ${periodo === p.id ? "crm-btn-primary" : "crm-btn-ghost"}`}
                style={{ fontSize: 12 }}>
                {p.label}
              </button>
            ))}
          </div>
        )}

        {notConfigured ? (
          <section className="crm-card">
            <div style={{ padding: 36, textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
              <AlertCircle size={28} style={{ color: "#C9A84C", margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--crm-ink)", margin: "0 0 8px" }}>Meta Ads ainda não sincronizado</h3>
              <p style={{ fontSize: 13.5, color: "var(--crm-ink-3)", lineHeight: 1.6, margin: "0 0 14px" }}>
                Peça pro Claude rodar a sincronização do Meta Ads (via MCP) — ele puxa os números e grava aqui.
                Como alternativa automática, configure os secrets <code>META_ADS_TOKEN</code> e <code>META_ADS_ACCOUNT_ID</code>.
              </p>
            </div>
          </section>
        ) : isError ? (
          <section className="crm-card"><div style={{ padding: 36, textAlign: "center", color: "#dc2626", fontSize: 13 }}>Erro ao carregar Meta Ads. Tente atualizar.</div></section>
        ) : data?.error ? (
          <section className="crm-card"><div style={{ padding: 36, textAlign: "center", color: "#dc2626", fontSize: 13 }}>Meta API: {data.error}</div></section>
        ) : isLoading ? (
          <section className="crm-card"><div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>Carregando…</div></section>
        ) : (
          <>
            <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
              <Kpi label="Gasto" value={fmtBRL(t?.spend ?? 0)} accent="neg" deltaText={data?.period_label ? "no período" : undefined} />
              <Kpi label="Cliques" value={fmtInt(t?.clicks ?? 0)} accent="mrr" deltaText={`CTR ${Number(t?.ctr ?? 0).toFixed(2)}%`} />
              <Kpi label="Alcance" value={fmtInt(t?.reach ?? 0)} deltaText={t?.frequency ? `freq. ${Number(t.frequency).toFixed(2)}` : undefined} />
              <Kpi label="Impressões" value={fmtInt(t?.impressions ?? 0)} deltaText="exibições" />
              <Kpi label="CPC" value={fmtBRL(t?.cpc ?? 0)} deltaText="custo por clique" />
              <Kpi label="CPM" value={fmtBRL(t?.cpm ?? 0)} accent="warn" deltaText="por mil impressões" />
            </section>

            {/* Série temporal */}
            <section className="crm-card">
              <CardHead title="Gasto × Cliques por dia" sub="evolução no período" />
              {(data?.serie ?? []).length > 0 ? (
                <div style={{ padding: "4px 16px 16px" }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={data!.serie} margin={{ top: 8, right: 8, left: -8, bottom: 4 }}>
                      <defs>
                        <linearGradient id="adsSpend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#006D5B" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#006D5B" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="data" tick={{ fontSize: 10, fill: "#94a3b8" }}
                        tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: "1px solid var(--crm-line)", fontSize: 12 }}
                        formatter={(value: number, name: string) => name === "spend" ? [fmtBRL(value), "Gasto"] : [fmtInt(value), "Cliques"]}
                        labelFormatter={(v) => new Date(v).toLocaleDateString("pt-BR")} />
                      <Area type="monotone" dataKey="spend" stroke="#006D5B" strokeWidth={2} fill="url(#adsSpend)" />
                      <Area type="monotone" dataKey="clicks" stroke="#C9A84C" strokeWidth={2} fillOpacity={0} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : <div style={{ padding: 32, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>Sem dados no período.</div>}
            </section>

            {/* Campanhas */}
            <section className="crm-card">
              <CardHead title="Campanhas" sub={`${(data?.campanhas ?? []).length} campanhas com gasto · ordenadas por gasto`} />
              {(data?.campanhas ?? []).length > 0 ? (
                <table className="crm-tbl">
                  <thead><tr>
                    <th>Campanha</th><th>Status</th><th>Objetivo</th>
                    <th style={{ textAlign: "right" }}>Gasto</th>
                    <th style={{ textAlign: "right" }}>Impr.</th>
                    <th style={{ textAlign: "right" }}>Cliques</th>
                    <th style={{ textAlign: "right" }}>CTR</th>
                    <th style={{ textAlign: "right" }}>CPC</th>
                    <th style={{ textAlign: "right" }}>Resultado</th>
                    <th style={{ textAlign: "right" }}>Custo/result.</th>
                  </tr></thead>
                  <tbody>
                    {(data?.campanhas ?? []).map((c) => (
                      <tr key={c.id}>
                        <td className="lead-name">{c.nome}</td>
                        <td><span className={`crm-tag crm-tag-${statusTag(c.status)}`}><span className="crm-tag-dot" />{(c.status || "—").replace(/_/g, " ").toLowerCase()}</span></td>
                        <td style={{ fontSize: 12, color: "var(--crm-ink-3)" }}>{objLabel(c.objetivo)}</td>
                        <td className="num">{fmtBRL(c.spend)}</td>
                        <td className="num">{fmtInt(c.impressions)}</td>
                        <td className="num">{fmtInt(c.clicks)}</td>
                        <td className="num">{Number(c.ctr).toFixed(2)}%</td>
                        <td className="num">{fmtBRL(c.cpc)}</td>
                        <td className="num">
                          {c.resultado != null ? fmtInt(c.resultado) : "—"}
                          {c.resultado_tipo ? <div style={{ fontSize: 10.5, color: "var(--crm-ink-4)", fontWeight: 400 }}>{c.resultado_tipo}</div> : null}
                        </td>
                        <td className="num">{c.custo_resultado != null ? fmtBRL(c.custo_resultado) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div style={{ padding: 32, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>Nenhuma campanha com gasto no período.</div>}
            </section>
          </>
        )}
      </main>
    </CrmShellV3>
  );
}
