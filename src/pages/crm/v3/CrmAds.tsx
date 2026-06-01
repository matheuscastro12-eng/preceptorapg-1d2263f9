/**
 * /admin/crm-mkt/ads — Dashboard Meta Ads (somente leitura).
 *
 * Lê performance via edge function `meta-ads` (token do Meta fica em
 * secrets, nunca no frontend). Mostra gasto, conversões (pixel), CPL,
 * CTR, CPM, série temporal e tabela de campanhas.
 *
 * Relatório diário automático chega por e-mail (cron meta-ads-daily).
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CrmShellV3, { Kpi, PageHero, CardHead } from "@/components/crm/v3/CrmShellV3";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { RefreshCw, AlertCircle } from "lucide-react";

const CRM_ACTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-ads`;
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

interface MetaResponse {
  error?: string;
  message?: string;
  account?: string;
  totais?: {
    spend: number; impressions: number; clicks: number; reach: number;
    ctr: number; cpc: number; cpm: number; conversoes: number; leads: number;
    registros: number; compras: number; cpl: number;
  };
  serie?: { data: string; spend: number; clicks: number; impressions: number; conversoes: number; cpl: number }[];
  campanhas?: { id: string; nome: string; status: string; spend: number; impressions: number; clicks: number; ctr: number; cpc: number; cpm: number; conversoes: number; cpl: number; daily_budget: number | null }[];
}

async function fetchMetaAds(datePreset: string): Promise<MetaResponse> {
  const token = localStorage.getItem("crm_token");
  const res = await fetch(CRM_ACTIONS_URL, {
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

export default function CrmAds() {
  const [periodo, setPeriodo] = useState("last_7d");
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["crm-meta-ads", periodo],
    queryFn: () => fetchMetaAds(periodo),
    staleTime: 5 * 60 * 1000,
  });

  const notConfigured = data?.error === "not_configured";
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
          sub="Gasto, conversões e CPL por campanha. Relatório completo chega no seu e-mail todo dia de manhã."
        />

        {/* Seletor de período */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {PERIODOS.map((p) => (
            <button key={p.id} onClick={() => setPeriodo(p.id)}
              className={`crm-btn ${periodo === p.id ? "crm-btn-primary" : "crm-btn-ghost"}`}
              style={{ fontSize: 12 }}>
              {p.label}
            </button>
          ))}
        </div>

        {notConfigured ? (
          <section className="crm-card">
            <div style={{ padding: 36, textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
              <AlertCircle size={28} style={{ color: "#C9A84C", margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--crm-ink)", margin: "0 0 8px" }}>Meta Ads ainda não conectado</h3>
              <p style={{ fontSize: 13.5, color: "var(--crm-ink-3)", lineHeight: 1.6, margin: "0 0 14px" }}>
                Falta configurar o acesso. Gere um token de <b>System User</b> (permissão <code>ads_read</code>)
                no Business Manager e o <b>Ad Account ID</b> (<code>act_…</code>), e peça pro Claude guardar nos
                secrets <code>META_ADS_TOKEN</code> e <code>META_ADS_ACCOUNT_ID</code>.
              </p>
              <p style={{ fontSize: 12, color: "var(--crm-ink-4)" }}>Assim que configurar, esta página carrega sozinha.</p>
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
            <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
              <Kpi label="Gasto" value={fmtBRL(t?.spend ?? 0)} accent="neg" deltaText={PERIODOS.find(p => p.id === periodo)?.label} />
              <Kpi label="Conversões" value={fmtInt(t?.conversoes ?? 0)} accent="mrr" deltaText="pixel (registros/leads)" />
              <Kpi label="CPL" value={t?.cpl ? fmtBRL(t.cpl) : "—"} deltaText="custo por conversão" />
              <Kpi label="CTR" value={Number(t?.ctr ?? 0).toFixed(2)} unit="%" deltaText={`${fmtInt(t?.clicks ?? 0)} cliques`} />
              <Kpi label="CPM" value={fmtBRL(t?.cpm ?? 0)} deltaText={`${fmtInt(t?.impressions ?? 0)} impressões`} accent="warn" />
            </section>

            {/* Série temporal */}
            <section className="crm-card">
              <CardHead title="Gasto × Conversões por dia" sub="evolução no período" />
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
                        formatter={(value: number, name: string) => name === "spend" ? [fmtBRL(value), "Gasto"] : [fmtInt(value), "Conversões"]}
                        labelFormatter={(v) => new Date(v).toLocaleDateString("pt-BR")} />
                      <Area type="monotone" dataKey="spend" stroke="#006D5B" strokeWidth={2} fill="url(#adsSpend)" />
                      <Area type="monotone" dataKey="conversoes" stroke="#C9A84C" strokeWidth={2} fillOpacity={0} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : <div style={{ padding: 32, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>Sem dados no período.</div>}
            </section>

            {/* Campanhas */}
            <section className="crm-card">
              <CardHead title="Campanhas" sub={`${(data?.campanhas ?? []).length} campanhas · ordenadas por gasto`} />
              {(data?.campanhas ?? []).length > 0 ? (
                <table className="crm-tbl">
                  <thead><tr>
                    <th>Campanha</th><th>Status</th>
                    <th style={{ textAlign: "right" }}>Gasto</th>
                    <th style={{ textAlign: "right" }}>Conv.</th>
                    <th style={{ textAlign: "right" }}>CPL</th>
                    <th style={{ textAlign: "right" }}>CTR</th>
                    <th style={{ textAlign: "right" }}>CPM</th>
                  </tr></thead>
                  <tbody>
                    {(data?.campanhas ?? []).map((c) => (
                      <tr key={c.id}>
                        <td className="lead-name">{c.nome}</td>
                        <td><span className={`crm-tag crm-tag-${statusTag(c.status)}`}><span className="crm-tag-dot" />{(c.status || "—").replace(/_/g, " ").toLowerCase()}</span></td>
                        <td className="num">{fmtBRL(c.spend)}</td>
                        <td className="num">{fmtInt(c.conversoes)}</td>
                        <td className="num">{c.cpl > 0 ? fmtBRL(c.cpl) : "—"}</td>
                        <td className="num">{Number(c.ctr).toFixed(2)}%</td>
                        <td className="num">{fmtBRL(c.cpm)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div style={{ padding: 32, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>Nenhuma campanha com dados no período.</div>}
            </section>
          </>
        )}
      </main>
    </CrmShellV3>
  );
}
