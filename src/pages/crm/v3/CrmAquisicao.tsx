/**
 * /admin/crm-mkt/aquisicao — Aquisição por canal (Meta Ads × funil).
 *
 * Cruza lead (UTM em crm_leads) -> cadastro (profiles) -> assinatura, por
 * canal, e sobrepõe o gasto do Meta. Lê via edge function `crm-aquisicao`.
 *
 * IMPORTANTE: a atribuição de conversão ainda é parcial — historicamente o
 * first-touch UTM não era persistido até o cadastro, então a maioria das
 * conversões cai em "Direto". O fix (captura first-touch -> profile) já está
 * ativo; os números de cadastro/assinante por canal melhoram com o tempo.
 */

import { useQuery } from "@tanstack/react-query";
import CrmShellV3, { Kpi, PageHero, CardHead } from "@/components/crm/v3/CrmShellV3";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { RefreshCw, AlertTriangle, Lightbulb, CheckCircle2 } from "lucide-react";

const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-aquisicao`;
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const fmtBRL = (v: number) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtInt = (v: number) => Number(v || 0).toLocaleString("pt-BR");

interface Canal { canal: string; leads: number; cadastros: number; assinantes: number; pagantes: number }
interface AquisicaoResp {
  error?: string;
  canais?: Canal[];
  overlay?: { dia: string; cadastros: number; spend: number }[];
  resumo?: { leads_30d: number; pagantes_30d: number; cadastros_30d: number; leads_meta_30d: number; assin_ativas_30d: number };
  meta?: { spend_30d: number; synced_at?: string | null; campanhas?: unknown[] };
}

async function fetchAquisicao(): Promise<AquisicaoResp> {
  const token = localStorage.getItem("crm_token");
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: API_KEY, Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ token }),
  });
  return res.json();
}

const isMeta = (c: string) => c.toLowerCase().includes("meta");

export default function CrmAquisicao() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["crm-aquisicao"],
    queryFn: fetchAquisicao,
    staleTime: 5 * 60 * 1000,
  });

  const r = data?.resumo;
  const canais = data?.canais ?? [];
  const spend30 = data?.meta?.spend_30d ?? 0;
  const pctMeta = r && r.leads_30d > 0 ? Math.round((r.leads_meta_30d / r.leads_30d) * 100) : 0;
  const custoCadastro = r && r.cadastros_30d > 0 ? spend30 / r.cadastros_30d : 0;

  return (
    <CrmShellV3 mode="marketing" crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "Aquisição" }]}
      topbarTools={
        <button className="crm-btn crm-btn-ghost" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Atualizar
        </button>
      }
    >
      <main className="crm-page">
        <PageHero
          eyebrow="Marketing · Aquisição"
          title={<>De onde vêm os <em>clientes</em></>}
          sub="Cruzamento Meta Ads × funil: lead → cadastro → assinante, por canal. Onde investir e o que corrigir."
        />

        {/* Aviso de atribuição parcial */}
        <div className="crm-card" style={{ padding: "12px 16px", marginBottom: 14, display: "flex", gap: 10, borderLeft: "3px solid #C9A84C" }}>
          <AlertTriangle size={17} style={{ color: "#C9A84C", flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12.5, color: "var(--crm-ink-2)", lineHeight: 1.55 }}>
            <b style={{ color: "var(--crm-ink)" }}>Atribuição em correção.</b> Historicamente o first-touch UTM não
            era salvo até o cadastro — por isso a maioria das conversões cai em <b>"Direto"</b>. O fix (captura da 1ª
            origem → perfil) já está ativo; os <b>cadastros/assinantes por canal</b> ficam fiéis a partir de agora.
            Os <b>leads por canal</b> já são confiáveis.
          </div>
        </div>

        {isError ? (
          <section className="crm-card"><div style={{ padding: 36, textAlign: "center", color: "#dc2626", fontSize: 13 }}>Erro ao carregar. Tente atualizar.</div></section>
        ) : data?.error ? (
          <section className="crm-card"><div style={{ padding: 36, textAlign: "center", color: "#dc2626", fontSize: 13 }}>{data.error}</div></section>
        ) : isLoading ? (
          <section className="crm-card"><div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>Carregando…</div></section>
        ) : (
          <>
            <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
              <Kpi label="Leads (30d)" value={fmtInt(r?.leads_30d ?? 0)} deltaText={`${pctMeta}% via Meta`} accent="mrr" />
              <Kpi label="Cadastros (30d)" value={fmtInt(r?.cadastros_30d ?? 0)} deltaText="contas criadas" />
              <Kpi label="Assinantes pagos (30d)" value={fmtInt(r?.pagantes_30d ?? 0)} deltaText="planos mensal/anual/bianual" accent="warn" />
              <Kpi label="Gasto Meta (30d)" value={fmtBRL(spend30)} accent="neg" />
              <Kpi label="Custo / cadastro" value={fmtBRL(custoCadastro)} deltaText="blended (gasto Meta ÷ cadastros)" />
            </section>

            {/* Overlay gasto x cadastros */}
            <section className="crm-card">
              <CardHead title="Gasto Meta × Cadastros por dia" sub="últimos 30 dias — o gasto move os cadastros?" />
              {(data?.overlay ?? []).length > 0 ? (
                <div style={{ padding: "4px 16px 16px" }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={data!.overlay} margin={{ top: 8, right: 8, left: -8, bottom: 4 }}>
                      <defs>
                        <linearGradient id="aqSpend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#006D5B" stopOpacity={0.22} />
                          <stop offset="100%" stopColor="#006D5B" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="dia" tick={{ fontSize: 10, fill: "#94a3b8" }}
                        tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
                      <YAxis yAxisId="spend" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `R$${v}`} />
                      <YAxis yAxisId="cad" orientation="right" tick={{ fontSize: 11, fill: "#C9A84C" }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: "1px solid var(--crm-line)", fontSize: 12 }}
                        formatter={(value: number, name: string) => name === "spend" ? [fmtBRL(value), "Gasto Meta"] : [fmtInt(value), "Cadastros"]}
                        labelFormatter={(v) => new Date(v).toLocaleDateString("pt-BR")} />
                      <Area yAxisId="spend" type="monotone" dataKey="spend" stroke="#006D5B" strokeWidth={2} fill="url(#aqSpend)" />
                      <Area yAxisId="cad" type="monotone" dataKey="cadastros" stroke="#C9A84C" strokeWidth={2} fillOpacity={0} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : <div style={{ padding: 32, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>Sem dados.</div>}
            </section>

            {/* Canais */}
            <section className="crm-card">
              <CardHead title="Funil por canal" sub="últimos 90 dias · lead → cadastro → assinante" />
              <table className="crm-tbl">
                <thead><tr>
                  <th>Canal</th>
                  <th style={{ textAlign: "right" }}>Leads</th>
                  <th style={{ textAlign: "right" }}>Cadastros</th>
                  <th style={{ textAlign: "right" }}>Assinantes</th>
                  <th style={{ textAlign: "right" }}>Pagantes</th>
                  <th style={{ textAlign: "right" }}>Lead→Cad.</th>
                </tr></thead>
                <tbody>
                  {canais.map((c) => {
                    const conv = c.leads > 0 ? (c.cadastros / c.leads) * 100 : 0;
                    return (
                      <tr key={c.canal}>
                        <td className="lead-name" style={{ color: isMeta(c.canal) ? "#006D5B" : undefined, fontWeight: isMeta(c.canal) ? 700 : undefined }}>{c.canal}</td>
                        <td className="num">{fmtInt(c.leads)}</td>
                        <td className="num">{fmtInt(c.cadastros)}</td>
                        <td className="num">{fmtInt(c.assinantes)}</td>
                        <td className="num" style={{ fontWeight: 700 }}>{fmtInt(c.pagantes)}</td>
                        <td className="num" style={{ color: conv > 0 ? "var(--crm-ink)" : "var(--crm-ink-4)" }}>{conv.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ padding: "10px 16px", fontSize: 11.5, color: "var(--crm-ink-4)", lineHeight: 1.5 }}>
                Hoje quase todas as conversões aparecem em "Direto" pela atribuição perdida no cadastro — não significa
                que o Meta não converte, e sim que ainda não dá pra ver. Com o fix ativo, isso se redistribui.
              </div>
            </section>

            {/* Insights */}
            <section className="crm-card" style={{ borderLeft: "3px solid #006D5B" }}>
              <CardHead title="Insights de melhora" sub="o que os dados dizem + próximos passos" />
              <div style={{ padding: "4px 18px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  ["Meta é seu maior topo de funil", `${pctMeta}% dos leads (${fmtInt(r?.leads_meta_30d ?? 0)} de ${fmtInt(r?.leads_30d ?? 0)} em 30d) vêm do Meta, a ${fmtBRL(spend30)}/mês. É a maior alavanca — mas hoje você não consegue medir quanto disso vira cliente.`],
                  ["Instrumentar antes de escalar", "Enquanto a atribuição e o pixel de conversão não estiverem prontos, aumentar verba é apostar no escuro. Prioridade nº 1."],
                  ["Pixel + Conversions API", "Instalar o evento de cadastro/assinatura no Meta e trocar o objetivo das campanhas de Reconhecimento/Engajamento → Conversões/Leads. Aí o Meta otimiza por quem assina, não por quem vê."],
                  ["Cortar campanhas de alcance", "As campanhas de Reconhecimento têm CTR de 0,05–0,08% (quase ninguém clica). Remaneje a verba para a campanha de tráfego que funciona ('Tráfego Preceptor.MED' → landing page views a R$ 0,25)."],
                  ["Investigar a landing", "64% dos leads vêm do Meta e quase nenhum converte — vale revisar a etapa landing→cadastro (clareza do CTA, fricção, intenção do público dos boosts)."],
                ].map(([t, d], i) => (
                  <div key={i} style={{ display: "flex", gap: 10 }}>
                    <Lightbulb size={16} style={{ color: "#C9A84C", flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--crm-ink)" }}>{t}</div>
                      <div style={{ fontSize: 12.5, color: "var(--crm-ink-3)", lineHeight: 1.55 }}>{d}</div>
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 10, marginTop: 2, paddingTop: 12, borderTop: "1px solid var(--crm-line)" }}>
                  <CheckCircle2 size={16} style={{ color: "#006D5B", flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 12.5, color: "var(--crm-ink-2)", lineHeight: 1.55 }}>
                    <b>Já feito:</b> captura do first-touch UTM no cadastro (corrige a atribuição daqui pra frente) e
                    esta página cruzando Meta × funil.
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </CrmShellV3>
  );
}
