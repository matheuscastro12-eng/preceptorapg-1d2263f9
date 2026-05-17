import CrmShellV3, { Kpi, PageHero, PeriodBar, CardHead } from "@/components/crm/v3/CrmShellV3";
import { Plus, Download, Wallet, AlertTriangle, TrendingUp, Target, Calendar, Crosshair, Star } from "lucide-react";
import { useAdminDashboardKpis, useMrrHistory, useDespesasPorCategoria as useAdminDespesasCat } from "@/hooks/useAdminDashboard";
import { useBPHighlights } from "@/hooks/useBPHighlights";
import { useOneOnOneAlerts } from "@/hooks/useOneOnOne";
import { usePDIStats } from "@/hooks/usePDI";
import { usePromocoesTrimestrais } from "@/hooks/useCarreira";
import { useMembros } from "@/hooks/useTime";
import { useReceitas, useReceitaResumo, useReceitaPorPlano } from "@/hooks/useReceitas";
import { useDespesas, useDespesaResumo, useDespesasPorCategoria } from "@/hooks/useDespesas";
import { useFluxoCaixa, useRunway, useEntradasPrevistas, useSaidasPrevistas, useEntradasRealizadas, useAportes, useCreateAporte, useDeleteAporte } from "@/hooks/useFluxoCaixa";
import { useInadimplencias, useInadimplenciaStats } from "@/hooks/useInadimplencia";
import { usePremissaAtiva, useDREData, calcularReceitas } from "@/hooks/useForecast";
import { useOKRs } from "@/hooks/useOKRs";
import { useRelatorios } from "@/hooks/useRelatorioInvestidor";
import { useCreateDespesa } from "@/hooks/useDespesas";
import { useState } from "react";
import { X, Loader2 } from "lucide-react";

const fmtBRL = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtBRL2 = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

// Formata data SEM conversão de fuso. new Date("2026-05-08") parseia como
// UTC meia-noite e toLocaleDateString (Brasil UTC-3) joga pro dia anterior.
// Aqui tratamos a string YYYY-MM-DD diretamente.
const fmtData = (d?: string | null): string => {
  if (!d) return "—";
  const datePart = String(d).slice(0, 10); // pega só YYYY-MM-DD (ignora hora)
  const m = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) {
    // fallback pra timestamps completos
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("pt-BR");
  }
  return `${m[3]}/${m[2]}/${m[1]}`;
};

// Data local de hoje em YYYY-MM-DD (sem UTC). toISOString() usa UTC e à noite
// no Brasil retorna o dia seguinte — usamos componentes locais.
const hojeLocal = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
};

const CATEGORIA_LABELS: Record<string, string> = {
  infra: "Infraestrutura",
  marketing: "Marketing",
  salarios: "Salários",
  ferramentas: "Ferramentas & SaaS",
  juridico: "Jurídico",
  outros: "Outros",
};

const CATEGORIA_COLORS: Record<string, string> = {
  salarios: "#B6452C",
  ferramentas: "#6B3FA0",
  marketing: "#A88A33",
  infra: "#2A5C8C",
  juridico: "#5A5247",
  outros: "#8A8170",
};

/* =========================================================
   ADMIN DASHBOARD — dados reais
   ========================================================= */
export function AdminDashboardV3() {
  const { data: kpis, isLoading } = useAdminDashboardKpis();
  const { data: despesasCat } = useAdminDespesasCat();
  const { data: mrrHist } = useMrrHistory();
  const { data: bp } = useBPHighlights(2026);
  const { data: ooAlerts } = useOneOnOneAlerts();
  const { data: pdiStats } = usePDIStats();
  const promoTri = usePromocoesTrimestrais();
  const { data: allMembros } = useMembros();

  const oneOnOneEmDia = (allMembros ?? []).filter((m: any) => m.status === "ativo").length - (ooAlerts ?? []).length;

  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Dashboard" }]}
      topbarTools={<><button className="crm-btn crm-btn-ghost">Fechar mês</button><button className="crm-btn crm-btn-primary"><Plus size={13} /> Lançar</button></>}
    >
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · Visão geral · tempo real"
          title={<>Dashboard <em>administrativo</em></>}
          sub="Visão consolidada de Finanças & People. Atualizado a cada 60s."
          actions={<><PeriodBar options={["Mês", "YTD", "2026"]} active="Mês" /></>}
        />

        {/* KPI BAR PRINCIPAL */}
        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          <Kpi label="MRR" value={isLoading ? "—" : fmtBRL(kpis?.mrr ?? 0)} deltaText="receita mensal" accent="mrr" />
          <Kpi label="ARR" value={isLoading ? "—" : fmtBRL(kpis?.arr ?? 0)} deltaText="MRR × 12" />
          <Kpi label="Runway" value={isLoading ? "—" : (kpis?.runway ?? 0).toFixed(1)} unit="meses" deltaText="saldo / burn" accent={kpis && kpis.runway < 3 ? "neg" : "warn"} />
          <Kpi label="Headcount" value={kpis?.headcount ?? 0} deltaText="membros ativos" />
          <Kpi label="Burn Rate" value={isLoading ? "—" : fmtBRL(kpis?.burnRate ?? 0)} deltaText="despesas do mês" accent="neg" />
        </section>

        {/* SECONDARY KPIs */}
        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Assinantes Ativos" value={kpis?.assinantesAtivos ?? "—"} accent="mrr" />
          <Kpi label="Churn Rate" value={isLoading ? "—" : fmtPct(kpis?.churnRate ?? 0)}
            accent={kpis && kpis.churnRate > 10 ? "neg" : kpis && kpis.churnRate > 5 ? "warn" : undefined} />
          <Kpi label="Ticket Médio" value={isLoading ? "—" : fmtBRL2(kpis?.ticketMedio ?? 0)} />
          <Kpi label="Novas Receitas (mês)" value={kpis?.novasReceitas ?? 0} accent="warn" />
        </section>

        {/* CHARTS — MRR + Despesas */}
        <section className="crm-g-2">
          <div className="crm-card">
            <CardHead title="MRR — últimos 6 meses" sub="evolução real do MRR a partir de assinaturas ativas" />
            <div style={{ padding: 20 }}>
              {mrrHist && mrrHist.length > 0 ? (
                <MrrSimpleChart data={mrrHist} />
              ) : (
                <div style={{ height: 220, display: "grid", placeItems: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
                  Sem dados
                </div>
              )}
            </div>
          </div>

          <div className="crm-card">
            <CardHead title="Despesas por Categoria"
              sub={despesasCat && despesasCat.length > 0
                ? `Total ${fmtBRL2((despesasCat ?? []).reduce((a, b) => a + b.total, 0))} no mês`
                : undefined} />
            <div style={{ padding: "16px 20px" }}>
              {despesasCat && despesasCat.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {despesasCat.map((d) => {
                    const max = despesasCat[0].total;
                    const pct = max > 0 ? (d.total / max) * 100 : 0;
                    return (
                      <div key={d.categoria}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, color: "var(--crm-ink-2)" }}>{CATEGORIA_LABELS[d.categoria] ?? d.categoria}</span>
                          <span className="crm-mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--crm-ink)" }}>{fmtBRL2(d.total)}</span>
                        </div>
                        <div style={{ height: 22, background: "var(--crm-surface-3)", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.max(pct, 3)}%`, background: CATEGORIA_COLORS[d.categoria] ?? "var(--crm-ink-4)", borderRadius: 4 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ height: 220, display: "grid", placeItems: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
                  Sem dados
                </div>
              )}
            </div>
          </div>
        </section>

        {/* BUSINESS PLAN HIGHLIGHTS */}
        {bp && (
          <section>
            <div style={{ fontFamily: "var(--crm-sans)", fontSize: 16, fontWeight: 700, color: "var(--crm-ink)", marginBottom: 12, letterSpacing: "-0.01em" }}>
              Business Plan — Mês Atual
            </div>
            <div className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(5, 1fr)", marginBottom: 16 }}>
              <Kpi label="Receita Bruta" value={fmtBRL(bp.receitaBrutaMes)} deltaText="projetada" accent="mrr" />
              <Kpi label="EBITDA" value={fmtBRL(bp.ebitdaMes)} deltaText="projetado" />
              <Kpi label="Margem EBITDA" value={`${bp.margemEbitda}%`} deltaText="EBITDA / Receita" accent="warn" />
              <Kpi label="Lucro Líquido" value={fmtBRL(bp.lucroLiquidoMes)} deltaText="projetado" accent="mrr" />
              <Kpi label="Aporte Acumulado" value={fmtBRL(bp.aporteAcumulado)} deltaText="no ano" />
            </div>

            {bp.lucroMensal && bp.lucroMensal.length > 0 && (
              <div className="crm-card">
                <CardHead title="Lucro Líquido Projetado — Abr a Dez" />
                <div style={{ padding: 20 }}>
                  <BPLucroChart data={bp.lucroMensal} />
                </div>
              </div>
            )}
          </section>
        )}

        {/* PEOPLE HEALTH */}
        <section>
          <div style={{ fontFamily: "var(--crm-sans)", fontSize: 16, fontWeight: 700, color: "var(--crm-ink)", marginBottom: 12, letterSpacing: "-0.01em" }}>
            People Health
          </div>
          <div className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <Kpi label="1:1s em dia" value={oneOnOneEmDia} deltaText={`${(ooAlerts ?? []).length} pendentes`} accent="mrr" />
            <Kpi label="PDIs ativos" value={pdiStats?.ativos ?? 0} deltaText="em andamento" accent="warn" />
            <Kpi label="Promoções" value={promoTri.data ?? 0} deltaText="neste trimestre" />
          </div>
        </section>
      </main>
    </CrmShellV3>
  );
}

function BPLucroChart({ data }: { data: { mes: string; valor: number }[] }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.valor), 1);
  const min = Math.min(...data.map((d) => d.valor), 0);
  const range = max - min || 1;
  const w = 720, h = 160;
  const stepX = data.length > 1 ? (w - 80) / (data.length - 1) : 0;
  const points = data.map((d, i) => `${40 + i * stepX},${20 + (1 - (d.valor - min) / range) * (h - 50)}`);
  const path = `M${points.join(" L")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 180 }}>
      <g stroke="var(--crm-line-soft)" strokeWidth={1} strokeDasharray="2 3">
        {[20, 60, 100].map((y) => <line key={y} x1="40" y1={y} x2={w - 20} y2={y} />)}
      </g>
      <g style={{ fontFamily: "var(--crm-mono)", fontSize: 9, fill: "var(--crm-ink-4)" }}>
        {data.map((d, i) => (
          <text key={i} x={40 + i * stepX} y={h - 8} textAnchor="middle">{d.mes}</text>
        ))}
      </g>
      <path d={path} stroke="#C9A84C" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => {
        const [x, y] = p.split(",").map(Number);
        return <circle key={i} cx={x} cy={y} r={3.5} fill="#C9A84C" />;
      })}
    </svg>
  );
}

function MrrSimpleChart({ data }: { data: { mes: string; mrr: number }[] }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.mrr), 1);
  const w = 720, h = 200;
  const stepX = data.length > 1 ? (w - 80) / (data.length - 1) : 0;
  const points = data.map((d, i) => `${40 + i * stepX},${20 + (1 - d.mrr / max) * (h - 50)}`);
  const path = `M${points.join(" L")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 220 }}>
      <g stroke="var(--crm-line-soft)" strokeWidth={1} strokeDasharray="2 3">
        {[20, 70, 120, 170].map((y) => <line key={y} x1="40" y1={y} x2={w - 20} y2={y} />)}
      </g>
      <g style={{ fontFamily: "var(--crm-mono)", fontSize: 10, fill: "var(--crm-ink-4)" }}>
        {data.map((d, i) => (
          <text key={i} x={40 + i * stepX} y={h - 10} textAnchor="middle">{d.mes}</text>
        ))}
      </g>
      <path d={`${path} L${40 + (data.length - 1) * stepX},${h - 30} L40,${h - 30} Z`} fill="#1B5E3B" fillOpacity={0.1} />
      <path d={path} stroke="#1B5E3B" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => {
        const [x, y] = p.split(",").map(Number);
        return <circle key={i} cx={x} cy={y} r={3} fill="#1B5E3B" />;
      })}
    </svg>
  );
}

/* =========================================================
   RECEITA — dados reais
   ========================================================= */
export function ReceitaV3() {
  const { data: resumo } = useReceitaResumo("mes");
  const { data: porPlano } = useReceitaPorPlano();
  const { data: receitas } = useReceitas("mes");

  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Receita" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · Receita"
          title={<>Receita <em>recorrente</em></>}
          sub="Composição da receita: MRR, vendas avulsas, consultorias B2B. Receitas reais do banco em admin_receitas."
          actions={<PeriodBar options={["Mês", "Trimestre", "Ano"]} active="Mês" />}
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="MRR Total" value={fmtBRL(resumo?.mrrTotal ?? 0)} deltaText="receita mensal recorrente" accent="mrr" />
          <Kpi label="Novas (mês)" value={resumo?.novas ?? 0} deltaText="novos assinantes pagantes" />
          <Kpi label="Cancelamentos" value={resumo?.cancelamentos ?? 0} deltaText="status inativo" accent="warn" />
          <Kpi label="Expansão" value={resumo?.expansao ?? 0} deltaText="upgrades de plano" />
        </section>

        {porPlano && porPlano.length > 0 && (
          <section className="crm-card">
            <CardHead title="Receita por plano" sub={`${(porPlano ?? []).reduce((s, p: any) => s + (p.count ?? 0), 0)} assinaturas ativas`} />
            <table className="crm-tbl">
              <thead><tr><th>Plano</th><th style={{ textAlign: "right" }}>Assinantes</th><th style={{ textAlign: "right" }}>MRR</th><th style={{ textAlign: "right" }}>% do total</th></tr></thead>
              <tbody>
                {porPlano.map((p: any) => (
                  <tr key={p.plano ?? p.plan}>
                    <td className="lead-name">{p.plano ?? p.plan ?? "—"}</td>
                    <td className="num">{p.count ?? p.assinantes ?? 0}</td>
                    <td className="num">{fmtBRL2(p.mrr ?? p.total ?? 0)}</td>
                    <td className="num">{p.percent != null ? `${p.percent.toFixed(1)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {receitas && receitas.length > 0 && (
          <section className="crm-card">
            <CardHead title="Lançamentos de receita" sub={`${receitas.length} registros em admin_receitas`} side={<a className="crm-btn crm-btn-link">Exportar CSV →</a>} />
            <table className="crm-tbl">
              <thead><tr><th>Data início</th><th>Produto</th><th>Plano</th><th style={{ textAlign: "right" }}>Valor</th><th>Status</th><th>Origem</th></tr></thead>
              <tbody>
                {receitas.slice(0, 30).map((r) => (
                  <tr key={r.id}>
                    <td className="muted crm-mono" style={{ fontSize: 12 }}>{fmtData(r.data_inicio)}</td>
                    <td className="lead-name">{r.produto}</td>
                    <td className="muted">{r.plano}</td>
                    <td className="num">{fmtBRL2(r.valor)}</td>
                    <td><span className={`crm-tag crm-tag-${r.status === "ativo" ? "green" : "gray"}`}><span className="crm-tag-dot" />{r.status}</span></td>
                    <td className="muted">{r.origem ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {(!receitas || receitas.length === 0) && (!porPlano || porPlano.length === 0) && (
          <section className="crm-card">
            <div style={{ padding: 48, textAlign: "center" }}>
              <Wallet size={32} strokeWidth={1.5} style={{ color: "var(--crm-ink-4)", marginBottom: 12 }} />
              <h3 style={{ margin: 0, fontFamily: "var(--crm-sans)", fontSize: 16, fontWeight: 700, color: "var(--crm-ink)" }}>Sem lançamentos de receita</h3>
              <p style={{ marginTop: 6, fontSize: 13, color: "var(--crm-ink-3)" }}>
                A tabela <code>admin_receitas</code> está vazia. O MRR é calculado direto das assinaturas ativas em <code>subscriptions</code>.
              </p>
            </div>
          </section>
        )}
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   FLUXO DE CAIXA
   ========================================================= */
export function FluxoCaixaV3() {
  const { data: fluxo } = useFluxoCaixa();
  const { data: runway } = useRunway();
  const { data: entradas } = useEntradasPrevistas();
  const { data: saidas } = useSaidasPrevistas();
  const [periodoReal, setPeriodoReal] = useState<"30d" | "90d" | "Tudo">("30d");
  const diasReal = periodoReal === "30d" ? 30 : periodoReal === "90d" ? 90 : 0;
  const { data: realizadas } = useEntradasRealizadas(diasReal);
  const { data: aportes } = useAportes();
  const [showAporte, setShowAporte] = useState(false);

  const hoje = new Date();
  const em30d = new Date(hoje.getTime() + 30 * 86400000);
  const aReceber = (entradas ?? []).filter((e: any) => new Date(e.data) <= em30d).reduce((s: number, e: any) => s + e.valor, 0);
  const aPagar = (saidas ?? []).filter((s: any) => new Date(s.data) <= em30d).reduce((s: number, e: any) => s + e.valor, 0);
  const deltaCaixa = aReceber - aPagar;
  const fx = fluxo as any; // saldo_base + total_aportes

  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Fluxo de caixa" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · Cash Flow"
          title={<>Fluxo <em>de caixa</em></>}
          sub="Saldo bancário, recebíveis previstos e contas a pagar (90 dias)."
          actions={
            <>
              <button className="crm-btn crm-btn-primary" onClick={() => setShowAporte(true)}>
                <Plus size={13} /> Registrar aporte
              </button>
              <button className="crm-btn crm-btn-ghost"><Download size={13} /> CSV</button>
            </>
          }
        />

        {showAporte && <AporteModal onClose={() => setShowAporte(false)} />}

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi
            label="Saldo total"
            value={fluxo ? fmtBRL(fluxo.saldo_atual) : "—"}
            deltaText={
              fluxo
                ? `baseline ${fmtBRL(fx.saldo_baseline)}${fluxo.data_atualizacao ? " de " + fmtData(fluxo.data_atualizacao) : ""} · +${fmtBRL(fx.receitas_realizadas)} entrou · −${fmtBRL(fx.despesas_realizadas)} saiu${fx?.total_aportes > 0 ? ` · +${fmtBRL(fx.total_aportes)} aportes` : ""}`
                : "sem dado"
            }
            accent="mrr"
          />
          <Kpi label="A receber 30d" value={fmtBRL(aReceber)} deltaText={`${(entradas ?? []).filter((e: any) => new Date(e.data) <= em30d).length} previstos`} />
          <Kpi label="A pagar 30d" value={fmtBRL(aPagar)} deltaText={`${(saidas ?? []).filter((s: any) => new Date(s.data) <= em30d).length} previstos`} accent="neg" />
          <Kpi label="Δ caixa 30d" value={`${deltaCaixa >= 0 ? "+" : "−"}${fmtBRL(Math.abs(deltaCaixa))}`}
            deltaText={`runway ${runway?.runway ?? 0} meses`} accent={deltaCaixa >= 0 ? "mrr" : "warn"} />
        </section>

        {/* Recebimentos REALIZADOS — dinheiro que entrou (mensal + anual). */}
        <section className="crm-card">
          <CardHead
            title={`Recebimentos realizados · ${periodoReal === "Tudo" ? "histórico" : periodoReal}`}
            sub={`${(realizadas ?? []).length} pagamentos · ${fmtBRL2((realizadas ?? []).reduce((s, r) => s + r.valor, 0))} entrou (mensal + anual)`}
            side={<PeriodBar options={["30d", "90d", "Tudo"]} active={periodoReal} onChange={(v) => setPeriodoReal(v as any)} />}
          />
          {(realizadas ?? []).length > 0 ? (
            <table className="crm-tbl">
              <thead><tr><th>Descrição</th><th>Plano</th><th>Origem</th><th>Data</th><th style={{ textAlign: "right" }}>Valor</th></tr></thead>
              <tbody>
                {(realizadas ?? []).slice(0, 20).map((r: any) => (
                  <tr key={r.id}>
                    <td className="lead-name">{r.descricao}</td>
                    <td><span className={`crm-tag ${r.plano === "anual" || r.plano === "bianual" ? "crm-tag-green" : "crm-tag-gray"}`}><span className="crm-tag-dot" />{r.plano}</span></td>
                    <td className="muted" style={{ fontSize: 12 }}>{r.origem}</td>
                    <td className="muted crm-mono" style={{ fontSize: 12 }}>{fmtData(r.data)}</td>
                    <td className="num" style={{ color: "var(--crm-green-deep)", fontWeight: 700 }}>{fmtBRL2(r.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 32, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
              Nenhum recebimento nos últimos 30 dias.
            </div>
          )}
        </section>

        <section className="crm-mobile-stack" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div className="crm-card">
            <CardHead title="Próximos recebimentos · renovações 30d" sub={`${(entradas ?? []).filter((e: any) => new Date(e.data) <= em30d).length} renovações previstas`} />
            {entradas && entradas.length > 0 ? (
              <table className="crm-tbl">
                <thead><tr><th>Descrição</th><th>Data</th><th style={{ textAlign: "right" }}>Valor</th></tr></thead>
                <tbody>
                  {entradas.filter((e: any) => new Date(e.data) <= em30d).slice(0, 10).map((r: any) => (
                    <tr key={r.id}>
                      <td className="lead-name">{r.descricao}</td>
                      <td className="muted crm-mono" style={{ fontSize: 12 }}>{fmtData(r.data)}</td>
                      <td className="num" style={{ color: "var(--crm-green-deep)", fontWeight: 700 }}>{fmtBRL2(r.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 32, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>Sem recebimentos previstos</div>
            )}
          </div>

          <div className="crm-card">
            <CardHead title="Próximos pagamentos · 30d" sub={`${(saidas ?? []).filter((s: any) => new Date(s.data) <= em30d).length} previstos`} />
            {saidas && saidas.length > 0 ? (
              <table className="crm-tbl">
                <thead><tr><th>Descrição</th><th>Categoria</th><th>Data</th><th style={{ textAlign: "right" }}>Valor</th></tr></thead>
                <tbody>
                  {saidas.filter((s: any) => new Date(s.data) <= em30d).slice(0, 10).map((r: any) => (
                    <tr key={r.id + r.data}>
                      <td className="lead-name">{r.descricao}</td>
                      <td><span className="crm-tag crm-tag-gray"><span className="crm-tag-dot" />{r.categoria}</span></td>
                      <td className="muted crm-mono" style={{ fontSize: 12 }}>{fmtData(r.data)}</td>
                      <td className="num" style={{ color: "var(--crm-neg)", fontWeight: 700 }}>{fmtBRL2(r.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 32, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>Sem pagamentos previstos</div>
            )}
          </div>
        </section>

        {/* Aportes & Investimentos */}
        <section className="crm-card">
          <CardHead
            title="Aportes & investimentos"
            sub={`${(aportes ?? []).length} lançamentos · ${fmtBRL2((aportes ?? []).reduce((s, a) => s + a.valor, 0))} somados ao caixa`}
            side={<button className="crm-btn crm-btn-ghost" onClick={() => setShowAporte(true)}><Plus size={13} /> Novo aporte</button>}
          />
          {(aportes ?? []).length > 0 ? (
            <table className="crm-tbl">
              <thead><tr><th>Descrição</th><th>Tipo</th><th>Data</th><th style={{ textAlign: "right" }}>Valor</th><th></th></tr></thead>
              <tbody>
                {(aportes ?? []).map((a) => <AporteRow key={a.id} aporte={a} />)}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 32, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
              Nenhum aporte registrado. Use "Registrar aporte" pra lançar investimento, captação ou empréstimo — entra direto no saldo.
            </div>
          )}
        </section>
      </main>
    </CrmShellV3>
  );
}

const APORTE_TIPO_LABEL: Record<string, string> = {
  investimento: "Investimento",
  emprestimo: "Empréstimo",
  captacao: "Captação",
  reembolso: "Reembolso",
  outro: "Outro",
};

function AporteRow({ aporte }: { aporte: any }) {
  const del = useDeleteAporte();
  return (
    <tr>
      <td className="lead-name">{aporte.descricao}{aporte.responsavel ? <div className="lead-email">{aporte.responsavel}</div> : null}</td>
      <td><span className="crm-tag crm-tag-green"><span className="crm-tag-dot" />{APORTE_TIPO_LABEL[aporte.tipo] ?? aporte.tipo}</span></td>
      <td className="muted crm-mono" style={{ fontSize: 12 }}>{fmtData(aporte.data)}</td>
      <td className="num" style={{ color: "var(--crm-green-deep)", fontWeight: 700 }}>+{fmtBRL2(aporte.valor)}</td>
      <td style={{ textAlign: "right" }}>
        <button
          className="crm-btn-icon"
          title="Remover aporte"
          onClick={() => { if (confirm(`Remover o aporte "${aporte.descricao}"?`)) del.mutate(aporte.id); }}
          disabled={del.isPending}
        >
          <X size={14} />
        </button>
      </td>
    </tr>
  );
}

function AporteModal({ onClose }: { onClose: () => void }) {
  const create = useCreateAporte();
  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    data: hojeLocal(),
    tipo: "investimento",
    responsavel: "",
    observacoes: "",
  });
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.descricao.trim()) { setError("Descrição obrigatória"); return; }
    const valorNum = Number(form.valor.replace(/\./g, "").replace(",", "."));
    if (!valorNum || valorNum <= 0) { setError("Valor inválido"); return; }
    try {
      await create.mutateAsync({
        descricao: form.descricao.trim(),
        valor: valorNum,
        data: form.data,
        tipo: form.tipo as any,
        responsavel: form.responsavel.trim() || null,
        observacoes: form.observacoes.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar aporte");
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", padding: 20, zIndex: 1000 }}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="crm-card" style={{ width: "min(520px, 100%)", maxHeight: "90vh", overflow: "auto", padding: 0, background: "var(--crm-surface)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--crm-line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "var(--crm-sans)", fontSize: 16, fontWeight: 700, color: "var(--crm-ink)" }}>Registrar aporte / investimento</div>
            <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)", marginTop: 2 }}>entra direto no saldo do caixa</div>
          </div>
          <button type="button" onClick={onClose} className="crm-btn-icon"><X /></button>
        </div>

        <div style={{ padding: 20, display: "grid", gap: 14 }}>
          <Field label="Descrição">
            <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Aporte dos sócios · maio" style={inputStyle} required />
          </Field>

          <div className="crm-mobile-stack" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Tipo">
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} style={inputStyle}>
                <option value="investimento">Investimento</option>
                <option value="captacao">Captação</option>
                <option value="emprestimo">Empréstimo</option>
                <option value="reembolso">Reembolso</option>
                <option value="outro">Outro</option>
              </select>
            </Field>
            <Field label="Valor (R$)">
              <input type="text" inputMode="decimal" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" style={inputStyle} required />
            </Field>
          </div>

          <div className="crm-mobile-stack" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Data">
              <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} style={inputStyle} required />
            </Field>
            <Field label="Responsável (opcional)">
              <input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} placeholder="Matheus" style={inputStyle} />
            </Field>
          </div>

          <Field label="Observações (opcional)">
            <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
          </Field>

          {error && (
            <div style={{ fontSize: 12, color: "var(--crm-neg)", background: "var(--crm-neg-soft)", padding: "8px 10px", borderRadius: 6 }}>{error}</div>
          )}
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--crm-line)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" onClick={onClose} className="crm-btn crm-btn-ghost">Cancelar</button>
          <button type="submit" disabled={create.isPending} className="crm-btn crm-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {create.isPending && <Loader2 size={13} className="animate-spin" />}
            {create.isPending ? "Salvando..." : "Salvar aporte"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CashflowChart() {
  return (
    <svg viewBox="0 0 720 240" style={{ width: "100%", height: 240 }}>
      <g stroke="var(--crm-line-soft)" strokeWidth={1} strokeDasharray="2 3">
        {[20, 70, 120, 170, 220].map((y) => <line key={y} x1="40" y1={y} x2="700" y2={y} />)}
      </g>
      <g style={{ fontFamily: "var(--crm-mono)", fontSize: 10, fill: "var(--crm-ink-4)" }}>
        <text x="35" y="223" textAnchor="end">0</text>
        <text x="35" y="173" textAnchor="end">100k</text>
        <text x="35" y="123" textAnchor="end">200k</text>
        <text x="35" y="73" textAnchor="end">300k</text>
        <text x="35" y="23" textAnchor="end">400k</text>
        {["abr","mai","jun","jul","ago","set","out","nov","dez","jan/27","fev","mar"].map((m, i) => (
          <text key={m} x={55 + i * 60} y="234">{m}</text>
        ))}
      </g>
      {/* Cenário pessimista */}
      <path d="M55,86 L115,90 L175,94 L235,100 L295,108 L355,118 L415,128 L475,140 L535,154 L595,170 L655,188" stroke="#B6452C" strokeWidth={2} fill="none" strokeDasharray="4 3" />
      {/* Cenário base */}
      <path d="M55,86 L115,82 L175,76 L235,72 L295,66 L355,60 L415,56 L475,50 L535,44 L595,38 L655,32" stroke="#1B5E3B" strokeWidth={2.4} fill="none" />
      {/* Saldo atual */}
      <circle cx="55" cy="86" r="4" fill="#1B5E3B" stroke="#FBF8F2" strokeWidth={2} />
      <rect x="60" y="62" width="118" height="22" rx="4" fill="#0F4128" />
      <text x="119" y="77" textAnchor="middle" fontFamily="Manrope" fontSize="11" fontWeight="700" fill="#fff">R$ 309 470 · hoje</text>
    </svg>
  );
}

/* =========================================================
   DESPESAS — dados reais
   ========================================================= */
export function DespesasV3() {
  const mesAtualKey = new Date().toISOString().slice(0, 7);
  const [periodo, setPeriodo] = useState<"mes" | "tudo">("tudo");
  const [showNew, setShowNew] = useState(false);
  const filtroMes = periodo === "mes" ? mesAtualKey : undefined;
  const { data: despesas } = useDespesas(filtroMes ? { mes: filtroMes } : undefined);
  const { data: resumo } = useDespesaResumo();
  const { data: porCategoria } = useDespesasPorCategoria(filtroMes ? { mes: filtroMes } : undefined);

  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Despesas" }]}
      topbarTools={<>
        <PeriodBar options={["Mês atual", "Tudo"]} active={periodo === "mes" ? "Mês atual" : "Tudo"} onChange={(v) => setPeriodo(v === "Mês atual" ? "mes" : "tudo")} />
        <button className="crm-btn crm-btn-ghost"><Download size={13} /> Exportar</button>
        <button className="crm-btn crm-btn-primary" onClick={() => setShowNew(true)}><Plus size={13} /> Lançar despesa</button>
      </>}
    >
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · Despesas"
          title={<>Despesas <em>operacionais</em></>}
          sub={`Lançamentos categorizados de admin_despesas. Total mês: ${resumo ? fmtBRL2(resumo.totalMes) : "—"}.`}
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Total mês" value={resumo ? fmtBRL(resumo.totalMes) : "—"} deltaText={`${(despesas ?? []).length} lançamentos`} accent="neg" />
          <Kpi label="Recorrentes" value={resumo ? fmtBRL(resumo.recorrentes) : "—"} deltaText="folha + SaaS + infra" />
          <Kpi label="Pontuais" value={resumo ? fmtBRL(resumo.pontuais) : "—"} deltaText="ads, jurídico, outros" accent="warn" />
          <Kpi label="Maior categoria" value={resumo?.maiorCategoria ?? "—"} deltaText={resumo ? fmtBRL2(resumo.maiorCategoriaValor) : ""} />
        </section>

        {porCategoria && porCategoria.length > 0 && (
          <section className="crm-card">
            <CardHead title="Por categoria" sub="ordenado por valor decrescente" />
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {porCategoria.map((c: any) => {
                  const max = porCategoria[0].total;
                  const pct = max > 0 ? (c.total / max) * 100 : 0;
                  return (
                    <div key={c.categoria}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: "var(--crm-ink-2)" }}>{CATEGORIA_LABELS[c.categoria] ?? c.categoria}</span>
                        <span className="crm-mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--crm-ink)" }}>{fmtBRL2(c.total)}</span>
                      </div>
                      <div style={{ height: 16, background: "var(--crm-surface-3)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.max(pct, 3)}%`, background: CATEGORIA_COLORS[c.categoria] ?? "var(--crm-ink-4)", borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <section className="crm-card">
          <CardHead title={`Lançamentos · ${periodo === "mes" ? mesAtualKey : "todo o período"}`} sub={despesas ? `${despesas.length} lançamentos` : ""} />
          {despesas && despesas.length > 0 ? (
            <table className="crm-tbl">
              <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Responsável</th><th style={{ textAlign: "right" }}>Valor</th><th>Recorrente</th></tr></thead>
              <tbody>
                {despesas.map((d) => (
                  <tr key={d.id}>
                    <td className="muted crm-mono" style={{ fontSize: 12 }}>{fmtData(d.data)}</td>
                    <td className="lead-name">{d.descricao}</td>
                    <td>
                      <span className={`crm-tag crm-tag-${d.categoria === "salarios" ? "red" : d.categoria === "marketing" ? "gold" : d.categoria === "infra" ? "blue" : d.categoria === "juridico" ? "warn" : "gray"}`}>
                        <span className="crm-tag-dot" />{CATEGORIA_LABELS[d.categoria] ?? d.categoria}
                      </span>
                    </td>
                    <td className="muted">{d.responsavel ?? "—"}</td>
                    <td className="num">{fmtBRL2(d.valor)}</td>
                    <td>{d.recorrente ? <span className="crm-tag crm-tag-green"><span className="crm-tag-dot" />{d.frequencia}</span> : <span className="crm-tag crm-tag-gray"><span className="crm-tag-dot" />pontual</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
              Sem lançamentos no período selecionado.
            </div>
          )}
        </section>
      </main>
      {showNew && <NovaDespesaModal onClose={() => setShowNew(false)} />}
    </CrmShellV3>
  );
}

function NovaDespesaModal({ onClose }: { onClose: () => void }) {
  const create = useCreateDespesa();
  const today = hojeLocal();
  const [form, setForm] = useState({
    descricao: "",
    categoria: "marketing",
    valor: "",
    data: today,
    recorrente: false,
    frequencia: "mensal",
    responsavel: "",
    observacoes: "",
  });
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.descricao.trim()) { setError("Descrição obrigatória"); return; }
    const valorNum = Number(form.valor.replace(",", "."));
    if (!valorNum || valorNum <= 0) { setError("Valor inválido"); return; }
    try {
      await create.mutateAsync({
        descricao: form.descricao.trim(),
        categoria: form.categoria,
        valor: valorNum,
        data: form.data,
        recorrente: form.recorrente,
        // DB enum despesa_frequencia: 'mensal' | 'anual' | 'unico'.
        // UI mostra "pontual" mas valor salvo deve ser 'unico'.
        frequencia: form.recorrente ? form.frequencia : "unico",
        responsavel: form.responsavel.trim() || null,
        observacoes: form.observacoes.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Erro ao salvar");
    }
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "grid", placeItems: "center", padding: 20, zIndex: 1000,
    }}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="crm-card" style={{
        width: "min(560px, 100%)", maxHeight: "90vh", overflow: "auto",
        padding: 0, background: "var(--crm-surface)",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--crm-line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "var(--crm-sans)", fontSize: 16, fontWeight: 700, color: "var(--crm-ink)" }}>Nova despesa</div>
            <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)", marginTop: 2 }}>admin_despesas</div>
          </div>
          <button type="button" onClick={onClose} className="crm-btn-icon"><X /></button>
        </div>

        <div style={{ padding: 20, display: "grid", gap: 14 }}>
          <Field label="Descrição">
            <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Google Ads · campanha cardio abril" style={inputStyle} required />
          </Field>

          <div className="crm-mobile-stack" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Categoria">
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} style={inputStyle}>
                <option value="marketing">Marketing</option>
                <option value="infra">Infraestrutura</option>
                <option value="ferramentas">Ferramentas & SaaS</option>
                <option value="salarios">Salários</option>
                <option value="juridico">Jurídico</option>
                <option value="outros">Outros</option>
              </select>
            </Field>
            <Field label="Valor (R$)">
              <input type="text" inputMode="decimal" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" style={inputStyle} required />
            </Field>
          </div>

          <div className="crm-mobile-stack" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Data">
              <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} style={inputStyle} required />
            </Field>
            <Field label="Responsável (opcional)">
              <input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} placeholder="Matheus" style={inputStyle} />
            </Field>
          </div>

          <Field label="">
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--crm-ink-2)" }}>
              <input type="checkbox" checked={form.recorrente} onChange={(e) => setForm({ ...form, recorrente: e.target.checked })} />
              Recorrente
            </label>
          </Field>

          {form.recorrente && (
            <Field label="Frequência">
              <select value={form.frequencia} onChange={(e) => setForm({ ...form, frequencia: e.target.value })} style={inputStyle}>
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
              </select>
            </Field>
          )}

          <Field label="Observações (opcional)">
            <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Notas adicionais…" style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} />
          </Field>

          {error && <div style={{ color: "var(--crm-neg)", fontSize: 12 }}>{error}</div>}
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--crm-line)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" onClick={onClose} className="crm-btn crm-btn-ghost">Cancelar</button>
          <button type="submit" className="crm-btn crm-btn-primary" disabled={create.isPending}>
            {create.isPending ? <><Loader2 size={12} className="animate-spin" /> Salvando…</> : <><Plus size={12} /> Salvar</>}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--crm-surface)",
  border: "1px solid var(--crm-line)",
  borderRadius: 6,
  padding: "8px 10px",
  fontFamily: "var(--crm-text)",
  fontSize: 13,
  color: "var(--crm-ink)",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      {label && <div className="crm-mono" style={{ fontSize: 10.5, color: "var(--crm-ink-4)", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>{label}</div>}
      {children}
    </div>
  );
}

/* =========================================================
   INADIMPLÊNCIA — dados reais
   ========================================================= */
export function InadimplenciaV3() {
  const { data: stats } = useInadimplenciaStats();
  const { data: lista } = useInadimplencias();

  const PLAN_LABELS: Record<string, string> = { monthly: "Mensal", annual: "Anual", biannual: "Bianual" };

  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Inadimplência" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · Inadimplência"
          title={<>{stats?.emCobranca ?? 0} cobranças <em>ativas</em></>}
          sub="Cartões recusados, atrasos e recuperação. Dados de admin_inadimplencias atualizados via webhook do gateway."
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="A recuperar" value={stats ? fmtBRL2(stats.valorTotalDevido) : "—"} deltaText={`${stats?.emCobranca ?? 0} contas`} accent="neg" />
          <Kpi label="Em cobrança" value={stats?.emCobranca ?? "—"} deltaText="cartão recusado / atrasado" accent="warn" />
          <Kpi label="Resolvidos" value={stats?.resolvidos ?? "—"} deltaText="pagaram após cobrança" accent="mrr" />
          <Kpi label="Recuperado" value={stats ? fmtBRL2(stats.valorRecuperado) : "—"} deltaText="acumulado" />
        </section>

        <section className="crm-card">
          <CardHead title="Lista de inadimplentes" sub="ordenado por data de ocorrência decrescente" />
          {lista && lista.length > 0 ? (
            <table className="crm-tbl">
              <thead><tr><th>Aluno</th><th>Plano</th><th style={{ textAlign: "right" }}>Valor</th><th>Status</th><th>Tentativas</th><th>Ocorrência</th><th>Último evento</th></tr></thead>
              <tbody>
                {lista.map((r) => {
                  const days = Math.floor((Date.now() - new Date(r.data_ocorrencia).getTime()) / 86400000);
                  return (
                    <tr key={r.id}>
                      <td><div className="lead-name">{r.nome}</div><div className="lead-email">{r.email}</div></td>
                      <td><span className="crm-tag crm-tag-gray"><span className="crm-tag-dot" />{PLAN_LABELS[r.plano] ?? r.plano}</span></td>
                      <td className="num">{fmtBRL2(r.valor_devido)}</td>
                      <td>
                        <span className={`crm-tag crm-tag-${r.status === "resolvido" ? "green" : r.status === "perdido" ? "red" : "warn"}`}>
                          <span className="crm-tag-dot" />{r.status}
                        </span>
                      </td>
                      <td className="num">{r.tentativas}</td>
                      <td className="muted crm-mono" style={{ fontSize: 12 }}>{days}d atrás</td>
                      <td className="muted">{r.ultimo_evento ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
              Sem inadimplências registradas. ✅
            </div>
          )}
        </section>
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   FORECAST / BUSINESS PLAN
   ========================================================= */
export function ForecastV3() {
  const [ano, setAno] = useState(new Date().getFullYear());
  const { data: premissa } = usePremissaAtiva();
  const { data: dre } = useDREData(ano);

  // Compute projection: receitas mensais a partir da premissa ativa, despesas reais do DRE.
  const calc = premissa ? calcularReceitas(premissa) : null;
  const mrrProjetado = calc ? calc.receitaTotal : 0;
  const arrProjetado = mrrProjetado * 12;

  // Despesas mensais reais do DRE
  const linhaDespesas = (dre ?? []).find((r: any) => r.linha?.codigo?.startsWith("4") || r.linha?.tipo === "despesa_total");
  const despMensais: number[] = [];
  for (let m = 1; m <= 12; m++) {
    despMensais.push(linhaDespesas?.valores?.[m] ?? 0);
  }
  const despTotal = despMensais.reduce((s, v) => s + v, 0);
  const margem = mrrProjetado > 0 ? ((mrrProjetado * 12 - despTotal) / (mrrProjetado * 12)) * 100 : 0;

  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const mesAtual = new Date().getMonth();

  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: `Business plan ${ano}` }]}>
      <main className="crm-page">
        <PageHero
          eyebrow={`Admin · Business Plan ${ano}`}
          title={<>Projeções <em>do ano fiscal</em></>}
          sub="Receita projetada a partir da premissa ativa (forecast_premissas) cruzada com despesas reais do DRE."
          actions={
            <select className="crm-btn crm-btn-ghost" value={ano} onChange={(e) => setAno(Number(e.target.value))}>
              {[2025, 2026, 2027, 2028].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          }
        />

        {!premissa && (
          <section className="crm-card">
            <div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
              Nenhuma premissa ativa cadastrada. Cadastre em <em>forecast_premissas</em> para ver projeções.
            </div>
          </section>
        )}

        {premissa && (
          <>
            <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              <Kpi label="MRR projetado (mensal)" value={fmtBRL(mrrProjetado)} deltaText={`${premissa.total_assinantes_base} assinantes base`} accent="mrr" />
              <Kpi label="ARR projetado" value={fmtBRL(arrProjetado)} deltaText="MRR × 12" />
              <Kpi label="Despesas reais (acum. ano)" value={fmtBRL(despTotal)} deltaText={`DRE ${ano}`} accent="warn" />
              <Kpi label="Margem projetada" value={`${margem.toFixed(1)}%`} deltaText="receita - despesa" accent={margem > 0 ? "mrr" : "neg"} />
            </section>

            <section className="crm-card">
              <CardHead title={`Projeção mensal · ${ano}`} sub={`Receita = premissa ativa "${premissa.versao}" · Despesas = DRE real`} />
              <table className="crm-tbl">
                <thead><tr><th>Mês</th><th style={{ textAlign: "right" }}>Receita projetada</th><th style={{ textAlign: "right" }}>Despesa real</th><th style={{ textAlign: "right" }}>Resultado</th></tr></thead>
                <tbody>
                  {meses.map((m, i) => {
                    const desp = despMensais[i];
                    const result = mrrProjetado - desp;
                    const isAtual = i === mesAtual && ano === new Date().getFullYear();
                    return (
                      <tr key={m} style={{ background: isAtual ? "var(--crm-green-tint)" : undefined }}>
                        <td className="lead-name">{m}/{String(ano).slice(2)}{isAtual && " · atual"}</td>
                        <td className="num">{fmtBRL(mrrProjetado)}</td>
                        <td className="num">{fmtBRL(desp)}</td>
                        <td className="num"><span style={{ color: result < 0 ? "var(--crm-neg)" : "var(--crm-green-deep)", fontWeight: 700 }}>{result < 0 ? "−" : "+"} {fmtBRL(Math.abs(result))}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   METAS / OKRs
   ========================================================= */
export function MetasV3() {
  const now = new Date();
  const trimestreAtual = Math.floor(now.getMonth() / 3) + 1;
  const [trimestre, setTrimestre] = useState(trimestreAtual);
  const [anoOkr, setAnoOkr] = useState(now.getFullYear());
  const { data: okrs } = useOKRs(trimestre, anoOkr);

  const lista = okrs ?? [];
  const objetivos = lista.length;
  const totalKrs = lista.reduce((s, o: any) => s + (o.key_results?.length ?? 0), 0);
  const atingidas = lista.filter((o: any) => (o.progresso_medio ?? 0) >= 70).length;
  const emRisco = lista.filter((o: any) => (o.progresso_medio ?? 0) < 40).length;
  const mediaProgresso = objetivos > 0 ? Math.round(lista.reduce((s, o: any) => s + (o.progresso_medio ?? 0), 0) / objetivos) : 0;

  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Metas & OKRs" }]}
      topbarTools={<><button className="crm-btn crm-btn-primary"><Plus size={13} /> Nova OKR</button></>}
    >
      <main className="crm-page">
        <PageHero
          eyebrow={`Admin · OKRs · Q${trimestre}/${anoOkr}`}
          title={<>Metas <em>do trimestre</em></>}
          sub={`${objetivos} objetivos · ${totalKrs} key results · atualizado via tabelas admin_okrs e admin_key_results.`}
          actions={
            <div style={{ display: "flex", gap: 8 }}>
              <PeriodBar options={["Q1", "Q2", "Q3", "Q4"]} active={`Q${trimestre}`} onChange={(v) => setTrimestre(Number(v.replace("Q", "")))} />
              <select className="crm-btn crm-btn-ghost" value={anoOkr} onChange={(e) => setAnoOkr(Number(e.target.value))}>
                {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          }
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Objetivos no ar" value={objetivos} deltaText={`Q${trimestre}/${anoOkr}`} />
          <Kpi label="KRs ativos" value={totalKrs} deltaText={`média ${mediaProgresso}%`} accent="mrr" />
          <Kpi label="Atingidas (≥70%)" value={atingidas} delta={`${objetivos > 0 ? Math.round(atingidas / objetivos * 100) : 0}%`} deltaSign="pos" />
          <Kpi label="Em risco (<40%)" value={emRisco} delta={emRisco > 0 ? "atenção" : "ok"} deltaSign={emRisco > 0 ? "neg" : "pos"} accent="warn" />
        </section>

        {lista.length === 0 ? (
          <section className="crm-card">
            <div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
              Nenhuma OKR cadastrada para Q{trimestre}/{anoOkr}.
            </div>
          </section>
        ) : lista.map((o: any) => {
          const pct = o.progresso_medio ?? 0;
          return (
            <section className="crm-card" key={o.id}>
              <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--crm-line-soft)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <div style={{ fontFamily: "var(--crm-sans)", fontSize: 16, fontWeight: 700, color: "var(--crm-ink)", letterSpacing: "-0.015em" }}>{o.objetivo}</div>
                  <div className="crm-mono" style={{ fontSize: 13, color: pct >= 70 ? "var(--crm-green-deep)" : pct >= 40 ? "var(--crm-gold-deep)" : "var(--crm-neg)", fontWeight: 700 }}>{pct}%</div>
                </div>
                <div style={{ fontSize: 12, color: "var(--crm-ink-4)", marginBottom: 10 }}>{o.responsavel_nome ?? "—"}</div>
                <div style={{ height: 6, background: "var(--crm-surface-3)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, var(--crm-green-deep), var(--crm-gold))", borderRadius: 3 }} />
                </div>
              </div>
              <div>
                {(o.key_results ?? []).map((kr: any) => {
                  const krPct = kr.meta > 0 ? Math.round((kr.progresso_atual / kr.meta) * 100) : 0;
                  const st = krPct >= 70 ? "green" : krPct >= 40 ? "warn" : "red";
                  return (
                    <div key={kr.id} className="crm-mobile-stack" style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px", gap: 14, padding: "12px 20px", borderBottom: "1px solid var(--crm-line-soft)", alignItems: "center" }}>
                      <div style={{ fontSize: 13, color: "var(--crm-ink-2)" }}>{kr.descricao}</div>
                      <div className="crm-mono" style={{ fontSize: 12.5, color: "var(--crm-ink)", fontWeight: 600, textAlign: "right" }}>{kr.progresso_atual} / {kr.meta} {kr.unidade}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ flex: 1, height: 4, background: "var(--crm-surface-3)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(krPct, 100)}%`, background: st === "green" ? "var(--crm-green)" : st === "warn" ? "var(--crm-gold-deep)" : "var(--crm-neg)", borderRadius: 2 }} />
                        </div>
                        <span className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-3)", minWidth: 28, textAlign: "right" }}>{krPct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   RELATÓRIO MENSAL
   ========================================================= */
export function RelatorioV3() {
  const { data: relatorios } = useRelatorios();
  const ultimo = (relatorios ?? [])[0];
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  const splitItems = (txt: string | null): string[] =>
    !txt ? [] : txt.split(/\n+/).map((s) => s.replace(/^[-*•]\s*/, "").trim()).filter(Boolean);

  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Relatório" }]}
      topbarTools={<><button className="crm-btn crm-btn-ghost"><Download size={13} /> PDF</button><button className="crm-btn crm-btn-primary"><Download size={13} /> CSV</button></>}
    >
      <main className="crm-page">
        <PageHero
          eyebrow={ultimo ? `Admin · Relatório executivo · ${meses[ultimo.mes - 1]}/${ultimo.ano}` : "Admin · Relatório executivo"}
          title={<>Relatório <em>do mês</em></>}
          sub="Sumário executivo para reunião de board. Métricas-chave, decisões, riscos e plano para o próximo mês."
        />

        {!ultimo ? (
          <section className="crm-card">
            <div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
              Nenhum relatório cadastrado em <em>admin_relatorios_investidor</em>.
            </div>
          </section>
        ) : (
          <>
            <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              <Kpi label="MRR" value={fmtBRL(ultimo.mrr)} deltaText={`ARR ${fmtBRL(ultimo.arr)}`} accent="mrr" />
              <Kpi label="Usuários" value={ultimo.total_usuarios} deltaText={`+${ultimo.novos_usuarios} no mês`} />
              <Kpi label="Churn rate" value={`${ultimo.churn_rate.toFixed(1)}%`} deltaText={`CAC ${fmtBRL(ultimo.cac)}`} accent="warn" />
              <Kpi label="Runway" value={`${ultimo.runway.toFixed(0)} m`} deltaText={`burn ${fmtBRL(ultimo.burn_rate)}`} accent="neg" />
            </section>

            <section className="crm-card">
              <CardHead title="Sumário executivo" sub={`${meses[ultimo.mes - 1]}/${ultimo.ano}`} />
              <div className="crm-card-pad crm-mobile-stack" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
                <ReportSection title="🚀 O que cresceu" items={splitItems(ultimo.narrativa_positivo)} />
                <ReportSection title="⚠️ Pontos de atenção" items={splitItems(ultimo.narrativa_negativo)} />
                <ReportSection title="🎯 Próximos 30 dias" items={splitItems(ultimo.narrativa_proximos30)} />
                <ReportSection title="📊 Indicadores extras" items={[
                  `LTV: ${fmtBRL(ultimo.ltv)}`,
                  `LTV/CAC: ${ultimo.cac > 0 ? (ultimo.ltv / ultimo.cac).toFixed(1) : "—"}x`,
                  `Headcount: ${ultimo.headcount}`,
                  ultimo.nps !== null ? `NPS: ${ultimo.nps > 0 ? "+" : ""}${ultimo.nps}` : "NPS: não informado",
                ]} />
              </div>
            </section>

            {(relatorios?.length ?? 0) > 1 && (
              <section className="crm-card">
                <CardHead title="Histórico de relatórios" sub={`${relatorios!.length} meses cadastrados`} />
                <table className="crm-tbl">
                  <thead><tr><th>Período</th><th style={{ textAlign: "right" }}>MRR</th><th style={{ textAlign: "right" }}>Usuários</th><th style={{ textAlign: "right" }}>Churn</th><th style={{ textAlign: "right" }}>Runway</th></tr></thead>
                  <tbody>
                    {relatorios!.map((r) => (
                      <tr key={r.id}>
                        <td className="lead-name">{meses[r.mes - 1]}/{r.ano}</td>
                        <td className="num">{fmtBRL(r.mrr)}</td>
                        <td className="num">{r.total_usuarios}</td>
                        <td className="num">{r.churn_rate.toFixed(1)}%</td>
                        <td className="num">{r.runway.toFixed(0)} m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
          </>
        )}
      </main>
    </CrmShellV3>
  );
}

function ReportSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--crm-sans)", fontSize: 14, fontWeight: 700, color: "var(--crm-ink)", marginBottom: 10 }}>{title}</div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: "grid", gridTemplateColumns: "12px 1fr", gap: 10, fontSize: 13, color: "var(--crm-ink-2)", lineHeight: 1.5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--crm-green-deep)", marginTop: 7 }} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
