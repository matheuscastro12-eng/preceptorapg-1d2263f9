import CrmShellV3, { Kpi, PageHero, PeriodBar, CardHead } from "@/components/crm/v3/CrmShellV3";
import { Plus, Download, Wallet, AlertTriangle, TrendingUp, Target, Calendar, Crosshair, Star } from "lucide-react";
import { useAdminDashboardKpis, useMrrHistory, useDespesasPorCategoria } from "@/hooks/useAdminDashboard";
import { useBPHighlights } from "@/hooks/useBPHighlights";
import { useOneOnOneAlerts } from "@/hooks/useOneOnOne";
import { usePDIStats } from "@/hooks/usePDI";
import { usePromocoesTrimestrais } from "@/hooks/useCarreira";
import { useMembros } from "@/hooks/useTime";

const fmtBRL = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtBRL2 = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

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
  const { data: despesasCat } = useDespesasPorCategoria();
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
   RECEITA
   ========================================================= */
export function ReceitaV3() {
  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Receita" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · Receita"
          title={<>Receita <em>recorrente</em></>}
          sub="Composição da receita bruta: MRR, vendas avulsas, consultorias B2B. Net new MRR e segmentação por plano/produto."
          actions={<PeriodBar options={["Mar", "Abr", "Mai", "YTD"]} active="Abr" />}
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          <Kpi label="MRR" value="R$ 38.412" delta="↑ 12,4%" deltaSign="pos" accent="mrr"
            sparkD="M0,22 L8,20 L16,21 L24,18 L32,16 L40,17 L48,14 L56,12 L64,11 L72,9 L80,8 L88,6 L100,5" />
          <Kpi label="Net new MRR" value="R$ 4.230" delta="+38" deltaSign="pos" deltaText="novos − churn" />
          <Kpi label="Expansion MRR" value="R$ 1.180" delta="+ 12" deltaSign="pos" deltaText="upgrades" />
          <Kpi label="Churned MRR" value="R$ 920" delta="−" deltaSign="flat" accent="warn" />
          <Kpi label="Reactivated" value="R$ 280" delta="+ 6" deltaSign="pos" deltaText="win-backs" />
        </section>

        <section className="crm-card">
          <CardHead title="Composição da receita · Abr/2026" sub="receita bruta R$ 45.112 · 100%" />
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", height: 40, borderRadius: 6, overflow: "hidden", border: "1px solid var(--crm-line)" }}>
              <div style={{ background: "#1B5E3B", width: "85.2%", display: "grid", placeItems: "center", color: "#fff", fontFamily: "var(--crm-sans)", fontSize: 12, fontWeight: 700 }}>MRR · 85,2%</div>
              <div style={{ background: "#3F8B5C", width: "11,9%", display: "grid", placeItems: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>Avulsas 11,9%</div>
              <div style={{ background: "#C9A84C", width: "2.9%", display: "grid", placeItems: "center", color: "#fff", fontSize: 10, fontWeight: 700 }}>B2B 2,9%</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 14 }}>
              <ReceitaItem color="#1B5E3B" label="Recorrente (MRR)" val="R$ 38 412" sub="784 assinantes" />
              <ReceitaItem color="#3F8B5C" label="Avulsas (cursos)" val="R$ 5 380" sub="124 unidades · ticket R$ 43" />
              <ReceitaItem color="#C9A84C" label="Consultorias B2B" val="R$ 1 320" sub="2 contratos PJ" />
            </div>
          </div>
        </section>

        <section className="crm-card">
          <CardHead title="MRR breakdown · 30 dias" />
          <table className="crm-tbl">
            <thead><tr><th>Movimento</th><th style={{ textAlign: "right" }}>Quantidade</th><th style={{ textAlign: "right" }}>MRR Δ</th><th>Detalhes</th></tr></thead>
            <tbody>
              {[
                { m: "Novos assinantes", q: "+ 84", d: "+ R$ 4 192", det: "google_ads 38 · indicação 18 · orgânico 28", c: "var(--crm-green-deep)" },
                { m: "Upgrades (mensal → anual)", q: "+ 12", d: "+ R$ 580", det: "incentivo de 20% off para anual" },
                { m: "Reativações (win-back)", q: "+ 6", d: "+ R$ 280", det: "via campanha pós-churn" },
                { m: "Downgrades", q: "− 3", d: "− R$ 90", det: "anual → mensal" },
                { m: "Cancelamentos", q: "− 31", d: "− R$ 920", det: "3,8% churn rate · benchmark < 5%", c: "var(--crm-neg)" },
                { m: "Failed payment (caducou)", q: "− 8", d: "− R$ 240", det: "cobrança em curso" },
              ].map((r) => (
                <tr key={r.m}>
                  <td className="lead-name">{r.m}</td>
                  <td className="num">{r.q}</td>
                  <td className="num"><span style={{ color: r.c, fontWeight: 700 }}>{r.d}</span></td>
                  <td className="muted">{r.det}</td>
                </tr>
              ))}
              <tr style={{ background: "var(--crm-green-tint)" }}>
                <td style={{ fontFamily: "var(--crm-sans)", fontWeight: 700 }}>Net new MRR</td>
                <td className="num"><strong>+ 60</strong></td>
                <td className="num"><strong style={{ color: "var(--crm-green-deep)" }}>+ R$ 3 802</strong></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </CrmShellV3>
  );
}

function ReceitaItem({ color, label, val, sub }: { color: string; label: string; val: string; sub: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid var(--crm-line)", borderRadius: 6 }}>
      <div style={{ width: 8, height: 22, borderRadius: 2, background: color }} />
      <div>
        <div style={{ fontFamily: "var(--crm-sans)", fontSize: 12, fontWeight: 600, color: "var(--crm-ink)" }}>{label}</div>
        <div className="crm-mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--crm-ink)", marginTop: 2 }}>{val}</div>
        <div style={{ fontSize: 11, color: "var(--crm-ink-4)" }}>{sub}</div>
      </div>
    </div>
  );
}

/* =========================================================
   FLUXO DE CAIXA
   ========================================================= */
export function FluxoCaixaV3() {
  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Fluxo de caixa" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · Cash Flow"
          title={<>Fluxo <em>de caixa</em></>}
          sub="Saldo bancário, projeção 12m, recebíveis e contas a pagar. Conciliação automática com Asaas + Stripe."
          actions={<><PeriodBar options={["3m", "6m", "12m", "24m"]} active="12m" /><button className="crm-btn crm-btn-ghost"><Download size={13} /> CSV</button></>}
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Saldo total" value="R$ 309 470" delta="↑ R$ 3 280" deltaSign="pos" deltaText="vs mês anterior" accent="mrr"
            sparkD="M0,18 L12,16 L24,15 L36,14 L48,13 L60,11 L72,10 L84,8 L100,7" />
          <Kpi label="A receber 30d" value="R$ 38 412" delta="MRR + avulsas" deltaSign="pos" />
          <Kpi label="A pagar 30d" value="R$ 41 820" delta="folha + SaaS + ads" deltaSign="neg" accent="neg" />
          <Kpi label="Δ caixa 30d" value="−R$ 3 408" delta="dentro plano" deltaSign="flat" accent="warn" />
        </section>

        <section className="crm-card">
          <CardHead title="Projeção de caixa · 12 meses" sub="cenário base com hipótese de crescimento 8% MRR/mês e despesas estáveis" />
          <div className="crm-card-pad">
            <CashflowChart />
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div className="crm-card">
            <CardHead title="Próximos recebimentos · 7d" />
            <table className="crm-tbl">
              <thead><tr><th>Origem</th><th>Quando</th><th style={{ textAlign: "right" }}>Valor</th></tr></thead>
              <tbody>
                {[
                  { o: "Repasse Stripe (semanal)", w: "amanhã", v: "R$ 8 240" },
                  { o: "Asaas · cobranças mensais", w: "em 3d", v: "R$ 9 480" },
                  { o: "Consultoria B2B · Hospital A", w: "em 5d", v: "R$ 1 320" },
                  { o: "Asaas · cobranças anuais", w: "em 6d", v: "R$ 12 480" },
                ].map((r) => (
                  <tr key={r.o}>
                    <td className="lead-name">{r.o}</td>
                    <td className="muted">{r.w}</td>
                    <td className="num" style={{ color: "var(--crm-green-deep)", fontWeight: 700 }}>{r.v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="crm-card">
            <CardHead title="Próximos pagamentos · 7d" />
            <table className="crm-tbl">
              <thead><tr><th>Destino</th><th>Quando</th><th style={{ textAlign: "right" }}>Valor</th></tr></thead>
              <tbody>
                {[
                  { o: "Folha de pagamento (FTE)", w: "em 2d", v: "R$ 18 200" },
                  { o: "Pro-labore founders", w: "em 2d", v: "R$ 2 000" },
                  { o: "Google Ads · setembro", w: "em 4d", v: "R$ 6 240" },
                  { o: "AWS / Supabase / Vercel", w: "em 5d", v: "R$ 2 140" },
                  { o: "Contador externo", w: "em 6d", v: "R$ 480" },
                ].map((r) => (
                  <tr key={r.o}>
                    <td className="lead-name">{r.o}</td>
                    <td className="muted">{r.w}</td>
                    <td className="num" style={{ color: "var(--crm-neg)", fontWeight: 700 }}>{r.v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </CrmShellV3>
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
   DESPESAS
   ========================================================= */
export function DespesasV3() {
  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Despesas" }]}
      topbarTools={<><button className="crm-btn crm-btn-ghost"><Download size={13} /> Exportar</button><button className="crm-btn crm-btn-primary"><Plus size={13} /> Lançar despesa</button></>}
    >
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · Despesas"
          title={<>Despesas <em>operacionais</em></>}
          sub="Lançamentos categorizados, fornecedores e detalhamento por categoria. Total Abr: R$ 41.820."
          actions={<PeriodBar options={["Mar", "Abr", "YTD"]} active="Abr" />}
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Total Abr" value="R$ 41 820" delta="↑ 4,1%" deltaSign="neg" deltaText="vs Mar" accent="neg" />
          <Kpi label="Salários" value="R$ 24 800" delta="59% do total" deltaSign="flat" />
          <Kpi label="Variável" value="R$ 8 460" delta="ads" deltaSign="flat" accent="warn" />
          <Kpi label="Fixo" value="R$ 8 560" delta="SaaS + infra + jurídico" deltaSign="flat" />
        </section>

        <section className="crm-card">
          <CardHead title="Lançamentos · Abr/2026" sub="32 lançamentos · todos conciliados" />
          <table className="crm-tbl">
            <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Fornecedor</th><th style={{ textAlign: "right" }}>Valor</th><th>Status</th></tr></thead>
            <tbody>
              {[
                { d: "01/04", desc: "Folha CLT (3 eng + 2 conteúdo)", c: "Salários", f: "Folha", v: "R$ 22 800", st: "green" },
                { d: "01/04", desc: "Pro-labore (3 founders)", c: "Salários", f: "Sócios", v: "R$ 2 000", st: "green" },
                { d: "02/04", desc: "Google Ads · campanhas", c: "Marketing", f: "Google", v: "R$ 5 240", st: "green" },
                { d: "02/04", desc: "Meta Ads · IG + FB", c: "Marketing", f: "Meta", v: "R$ 2 220", st: "green" },
                { d: "02/04", desc: "TikTok Ads", c: "Marketing", f: "TikTok", v: "R$ 1 000", st: "green" },
                { d: "05/04", desc: "Supabase Pro + Postgres", c: "Infra", f: "Supabase", v: "R$ 1 480", st: "green" },
                { d: "05/04", desc: "Vercel Pro", c: "Infra", f: "Vercel", v: "R$ 480", st: "green" },
                { d: "05/04", desc: "Cloudflare Pro", c: "Infra", f: "Cloudflare", v: "R$ 180", st: "green" },
                { d: "08/04", desc: "Resend (e-mail transacional)", c: "Ferramentas", f: "Resend", v: "R$ 240", st: "green" },
                { d: "10/04", desc: "Asaas (gateway)", c: "Ferramentas", f: "Asaas", v: "R$ 720", st: "green" },
                { d: "10/04", desc: "Linear · projetos", c: "Ferramentas", f: "Linear", v: "R$ 380", st: "green" },
                { d: "12/04", desc: "Notion · workspace", c: "Ferramentas", f: "Notion", v: "R$ 240", st: "green" },
                { d: "15/04", desc: "Contador externo", c: "Jurídico", f: "Contábil ABC", v: "R$ 480", st: "green" },
                { d: "20/04", desc: "Advogado · revisão contratos", c: "Jurídico", f: "Adv. Sócio", v: "R$ 470", st: "green" },
                { d: "22/04", desc: "Café/coworking", c: "Outros", f: "WeWork", v: "R$ 380", st: "green" },
                { d: "30/04", desc: "Domínios + SSL", c: "Outros", f: "Registro.br", v: "R$ 170", st: "green" },
              ].map((r, i) => (
                <tr key={i}>
                  <td className="muted crm-mono" style={{ fontSize: 12 }}>{r.d}</td>
                  <td className="lead-name">{r.desc}</td>
                  <td><span className={`crm-tag crm-tag-${r.c === "Salários" ? "red" : r.c === "Marketing" ? "gold" : r.c === "Infra" ? "blue" : r.c === "Jurídico" ? "warn" : "gray"}`}><span className="crm-tag-dot" />{r.c}</span></td>
                  <td className="muted">{r.f}</td>
                  <td className="num">{r.v}</td>
                  <td><span className="crm-tag crm-tag-green"><span className="crm-tag-dot" />Conciliado</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   INADIMPLÊNCIA
   ========================================================= */
export function InadimplenciaV3() {
  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Inadimplência" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · Inadimplência"
          title={<>11 cobranças <em>em atraso</em></>}
          sub="Gestão de cartões recusados, atrasos e plano de recuperação. DSO médio 18 dias · taxa de recuperação 64%."
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="A recuperar" value="R$ 1 348" delta="11 contas" deltaSign="neg" accent="neg" />
          <Kpi label="DSO médio" value="18 dias" delta="↓ 2d" deltaSign="pos" accent="warn" />
          <Kpi label="Taxa recuperação" value="64%" delta="↑ 4pp" deltaSign="pos" accent="mrr" />
          <Kpi label="Recuperado 30d" value="R$ 2 480" delta="18 contas" deltaSign="pos" />
        </section>

        <section className="crm-card">
          <CardHead title="Lista de inadimplentes" sub="ordenado por dias em atraso · cobranças em curso destacadas" />
          <table className="crm-tbl">
            <thead><tr><th>Aluno</th><th>Plano</th><th style={{ textAlign: "right" }}>Valor</th><th>Atraso</th><th>Tentativas</th><th>Próxima cobrança</th><th></th></tr></thead>
            <tbody>
              {[
                { n: "Pedro Henrique Lacerda", e: "pedrolacerda@hotmail.com", p: "Mensal", v: "R$ 49,90", days: 14, t: "3x", next: "amanhã 09h" },
                { n: "Renata Caldas Vieira", e: "renata@medusp.br", p: "Mensal", v: "R$ 49,90", days: 9, t: "2x", next: "em 2d" },
                { n: "Igor Sampaio", e: "igor@gmail.com", p: "Bianual", v: "R$ 99,98", days: 7, t: "1x", next: "em 3d" },
                { n: "Lara Moraes Coutinho", e: "lara@residencia.org", p: "Anual", v: "R$ 350,90", days: 6, t: "2x", next: "em 4d" },
                { n: "Augusto Vinícius Sá", e: "augusto@gmail.com", p: "Mensal", v: "R$ 49,90", days: 4, t: "1x", next: "em 5d" },
                { n: "Beatriz Lemos", e: "bia.lemos@unifesp.edu.br", p: "Anual", v: "R$ 350,90", days: 3, t: "1x", next: "em 6d" },
                { n: "Vitor Hugo Andrade", e: "vitor@medusp.br", p: "Mensal", v: "R$ 49,90", days: 2, t: "1x", next: "em 7d" },
              ].map((r) => (
                <tr key={r.n}>
                  <td><div className="lead-name">{r.n}</div><div className="lead-email">{r.e}</div></td>
                  <td><span className="crm-tag crm-tag-gray"><span className="crm-tag-dot" />{r.p}</span></td>
                  <td className="num">{r.v}</td>
                  <td className="num"><span style={{ color: r.days >= 10 ? "var(--crm-neg)" : "var(--crm-gold-deep)", fontWeight: 700 }}>+ {r.days} d</span></td>
                  <td className="muted">{r.t}</td>
                  <td className="muted">{r.next}</td>
                  <td><button className="crm-btn crm-btn-ghost">Cobrar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   FORECAST / BUSINESS PLAN
   ========================================================= */
export function ForecastV3() {
  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Business plan 2026" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · Business Plan 2026"
          title={<>Projeções <em>do ano fiscal</em></>}
          sub="Cenários conservador, base e otimista. Default-alive em ago/26 mantido no cenário base."
          actions={<><PeriodBar options={["Conservador", "Base", "Otimista"]} active="Base" /></>}
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="MRR dez/26 (proj.)" value="R$ 78k" delta="× 2,03" deltaSign="pos" accent="mrr" />
          <Kpi label="ARR dez/26" value="R$ 936k" delta="meta R$ 850k" deltaSign="pos" />
          <Kpi label="Break-even" value="ago/26" delta="EBITDA > 0" deltaSign="pos" accent="warn" />
          <Kpi label="Margem dez/26" value="18%" delta="alvo 18%" deltaSign="pos" />
        </section>

        <section className="crm-card">
          <CardHead title="Projeção mensal · 2026" sub="cenário base · MRR + 8% a.m. · churn estável 4% · headcount + 2 FTE em jul" />
          <table className="crm-tbl">
            <thead><tr><th>Mês</th><th style={{ textAlign: "right" }}>MRR</th><th style={{ textAlign: "right" }}>Receita</th><th style={{ textAlign: "right" }}>Despesas</th><th style={{ textAlign: "right" }}>EBITDA</th><th style={{ textAlign: "right" }}>Margem</th><th style={{ textAlign: "right" }}>Caixa</th></tr></thead>
            <tbody>
              {[
                { m: "Jan/26", mrr: "26 480", rec: "31 240", desp: "39 800", ebt: "−8 560", mg: "−27%", cx: "R$ 312k" },
                { m: "Fev/26", mrr: "29 120", rec: "34 280", desp: "40 400", ebt: "−6 120", mg: "−18%", cx: "R$ 306k" },
                { m: "Mar/26", mrr: "34 180", rec: "40 240", desp: "40 800", ebt: "−560", mg: "−1%", cx: "R$ 305k" },
                { m: "Abr/26", mrr: "38 412", rec: "45 112", desp: "41 820", ebt: "−769", mg: "−1,7%", cx: "R$ 309k", current: true },
                { m: "Mai/26", mrr: "41 488", rec: "48 720", desp: "42 200", ebt: "+ 1 480", mg: "+ 3%", cx: "R$ 311k" },
                { m: "Jun/26", mrr: "44 800", rec: "52 600", desp: "42 800", ebt: "+ 4 200", mg: "+ 8%", cx: "R$ 315k" },
                { m: "Jul/26", mrr: "48 384", rec: "56 800", desp: "48 800", ebt: "+ 2 200", mg: "+ 4%", cx: "R$ 317k" },
                { m: "Ago/26", mrr: "52 240", rec: "61 400", desp: "49 800", ebt: "+ 8 100", mg: "+ 13%", cx: "R$ 325k", be: true },
                { m: "Set/26", mrr: "56 420", rec: "66 280", desp: "50 200", ebt: "+ 10 800", mg: "+ 16%", cx: "R$ 336k" },
                { m: "Out/26", mrr: "60 940", rec: "71 600", desp: "50 800", ebt: "+ 13 800", mg: "+ 19%", cx: "R$ 350k" },
                { m: "Nov/26", mrr: "65 820", rec: "77 320", desp: "51 200", ebt: "+ 17 100", mg: "+ 22%", cx: "R$ 367k" },
                { m: "Dez/26", mrr: "78 080", rec: "91 720", desp: "53 800", ebt: "+ 24 100", mg: "+ 26%", cx: "R$ 391k" },
              ].map((r) => (
                <tr key={r.m} style={{
                  background: r.current ? "var(--crm-green-tint)" : r.be ? "var(--crm-gold-soft)" : undefined,
                }}>
                  <td className="lead-name">{r.m}{r.current && " · atual"}{r.be && " · break-even"}</td>
                  <td className="num">R$ {r.mrr}</td>
                  <td className="num">R$ {r.rec}</td>
                  <td className="num">R$ {r.desp}</td>
                  <td className="num"><span style={{ color: r.ebt.startsWith("−") ? "var(--crm-neg)" : "var(--crm-green-deep)", fontWeight: 700 }}>{r.ebt}</span></td>
                  <td className="num">{r.mg}</td>
                  <td className="num">{r.cx}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   METAS / OKRs
   ========================================================= */
export function MetasV3() {
  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Metas & OKRs" }]}
      topbarTools={<><button className="crm-btn crm-btn-primary"><Plus size={13} /> Nova OKR</button></>}
    >
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · OKRs · Q2/2026"
          title={<>Metas <em>do trimestre</em></>}
          sub="3 objetivos · 9 key results · acompanhamento quinzenal nas reuniões de squad."
          actions={<PeriodBar options={["Q1", "Q2", "Q3", "Q4"]} active="Q2" />}
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Objetivos no ar" value="3" deltaText="Q2/26" />
          <Kpi label="KRs em andamento" value="9" deltaText="média 62% atingido" accent="mrr" />
          <Kpi label="Atingidas (≥70%)" value="4" delta="44%" deltaSign="pos" />
          <Kpi label="Em risco (<40%)" value="2" delta="atenção" deltaSign="neg" accent="warn" />
        </section>

        {[
          {
            title: "Atingir R$ 50k MRR até jun/26",
            owner: "Ricardo · Marketing",
            pct: 78,
            krs: [
              { kr: "Net new MRR ≥ R$ 4 000/mês", val: "R$ 4 230", pct: 100, st: "green" },
              { kr: "Conversão visitor → assinante ≥ 3%", val: "2,76%", pct: 92, st: "green" },
              { kr: "CAC blended ≤ R$ 150", val: "R$ 158", pct: 86, st: "warn" },
            ],
          },
          {
            title: "Reduzir churn para < 3%",
            owner: "Ricardo + Fernanda · Retention",
            pct: 54,
            krs: [
              { kr: "Churn rate mensal < 3%", val: "3,8%", pct: 60, st: "warn" },
              { kr: "Win-back ≥ 30%", val: "29%", pct: 96, st: "green" },
              { kr: "NPS ≥ 60", val: "+62", pct: 100, st: "green" },
            ],
          },
          {
            title: "Lançar Scribe Clínico em produção",
            owner: "Júlia · Engenharia",
            pct: 42,
            krs: [
              { kr: "Beta com 50 médicos ativos", val: "12 médicos", pct: 24, st: "red" },
              { kr: "≥ 70% das consultas geram SOAP aprovado", val: "n/a", pct: 0, st: "red" },
              { kr: "Compliance LGPD documentada e auditada", val: "em curso", pct: 70, st: "warn" },
            ],
          },
        ].map((o) => (
          <section className="crm-card" key={o.title}>
            <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--crm-line-soft)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <div style={{ fontFamily: "var(--crm-sans)", fontSize: 16, fontWeight: 700, color: "var(--crm-ink)", letterSpacing: "-0.015em" }}>{o.title}</div>
                <div className="crm-mono" style={{ fontSize: 13, color: o.pct >= 70 ? "var(--crm-green-deep)" : o.pct >= 40 ? "var(--crm-gold-deep)" : "var(--crm-neg)", fontWeight: 700 }}>{o.pct}%</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--crm-ink-4)", marginBottom: 10 }}>{o.owner}</div>
              <div style={{ height: 6, background: "var(--crm-surface-3)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${o.pct}%`, background: "linear-gradient(90deg, var(--crm-green-deep), var(--crm-gold))", borderRadius: 3 }} />
              </div>
            </div>
            <div>
              {o.krs.map((kr, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px", gap: 14, padding: "12px 20px", borderBottom: "1px solid var(--crm-line-soft)", alignItems: "center" }}>
                  <div style={{ fontSize: 13, color: "var(--crm-ink-2)" }}>{kr.kr}</div>
                  <div className="crm-mono" style={{ fontSize: 12.5, color: "var(--crm-ink)", fontWeight: 600, textAlign: "right" }}>{kr.val}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ flex: 1, height: 4, background: "var(--crm-surface-3)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${kr.pct}%`, background: kr.st === "green" ? "var(--crm-green)" : kr.st === "warn" ? "var(--crm-gold-deep)" : "var(--crm-neg)", borderRadius: 2 }} />
                    </div>
                    <span className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-3)", minWidth: 28, textAlign: "right" }}>{kr.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   RELATÓRIO MENSAL
   ========================================================= */
export function RelatorioV3() {
  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Relatório" }]}
      topbarTools={<><button className="crm-btn crm-btn-ghost"><Download size={13} /> PDF</button><button className="crm-btn crm-btn-primary"><Download size={13} /> CSV</button></>}
    >
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · Relatório executivo · Abr/2026"
          title={<>Relatório <em>do mês</em></>}
          sub="Sumário executivo para reunião de board. Métricas-chave, decisões, riscos e plano para o próximo mês."
        />

        <section className="crm-card">
          <CardHead title="Sumário executivo" />
          <div className="crm-card-pad" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
            <ReportSection
              title="🚀 O que cresceu"
              items={[
                "MRR cresceu 12,4% no mês (R$ 38.412), batendo a meta de R$ 35k.",
                "Net new MRR de R$ 4.230 (38 novos − 31 churn).",
                "PreceptorBook teve +24% de uso, virando 2ª feature mais usada.",
                "NPS subiu para +62 (+8 vs Q1).",
              ]}
            />
            <ReportSection
              title="⚠️ Pontos de atenção"
              items={[
                "Churn rate em 3,8% — acima do alvo de 3%. 17 alunos em risco crítico.",
                "Drop trial → engajado caiu 7pp desde fevereiro.",
                "Patrícia Verçosa (eng pleno) tem oferta concorrente — decisão até 30/abr.",
                "Burn de R$ 41.820 4% acima do orçado (Marketing pediu mais R$ 720).",
              ]}
            />
            <ReportSection
              title="✅ Decisões do mês"
              items={[
                "Aprovação de orçamento extra de R$ 720 para A/B test cardio.",
                "Pausa da campanha revalida-abr (CAC R$ 387, fora do range).",
                "Migração do CRM para v3 (design system editorial).",
                "Adoção do dolutegravir como primeira escolha em PEP/PrEP.",
              ]}
            />
            <ReportSection
              title="🎯 Plano para Mai/26"
              items={[
                "Lançar campanha pediatria com criativo da campanha cardio.",
                "Fechar contratação de eng pleno até 15/mai.",
                "Reduzir CAC para R$ 145 (otimização lances + landings).",
                "Iniciar beta fechado do Scribe com 5 médicos parceiros.",
              ]}
            />
          </div>
        </section>
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
