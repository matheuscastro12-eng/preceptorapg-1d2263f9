import CrmShellV3, { Kpi, CardHead } from "@/components/crm/v3/CrmShellV3";
import { Plus, Download } from "lucide-react";
import { useFunnelKpis, useUtmBreakdown, useDashboardKpis } from "@/hooks/useCrm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/crm/supabase";

const fmt = (v: number) => v.toLocaleString("pt-BR");
const fmtBRL = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const pct = (a: number, b: number) => b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "—";

// ---- Cohorts: client-side a partir de crm_leads ----
function useCohorts() {
  return useQuery({
    queryKey: ["crm", "funnel-cohorts"],
    queryFn: async () => {
      const since = new Date(Date.now() - 240 * 86400000).toISOString();
      const { data } = await supabase
        .from("crm_leads")
        .select("created_at, last_activity_at, status")
        .gte("created_at", since);

      const byCohort: Record<string, { total: number; active: number[] }> = {};
      const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      (data ?? []).forEach((l: any) => {
        const cohort = monthKey(new Date(l.created_at));
        if (!byCohort[cohort]) byCohort[cohort] = { total: 0, active: [0, 0, 0, 0, 0, 0, 0] };
        byCohort[cohort].total += 1;
        const created = new Date(l.created_at);
        const lastAct = l.last_activity_at ? new Date(l.last_activity_at) : created;
        const aliveMonths = Math.min(6, Math.max(0, Math.floor((lastAct.getTime() - created.getTime()) / (30 * 86400000))));
        const isActive = l.status === "subscriber" || l.status === "active_trial" || l.status === "engaged";
        const limit = isActive ? aliveMonths : 0;
        for (let i = 0; i <= limit; i++) byCohort[cohort].active[i] += 1;
      });

      return Object.entries(byCohort)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-7)
        .map(([cohort, d]) => ({
          cohort,
          total: d.total,
          values: d.active.map((c) => d.total > 0 ? Math.round((c / d.total) * 100) : 0),
        }));
    },
  });
}

export default function FunnelV3() {
  const { data: funnel } = useFunnelKpis();
  const { data: utm } = useUtmBreakdown();
  const { data: kpis } = useDashboardKpis();
  const { data: cohorts } = useCohorts();

  // Funnel agregado
  const agg = (funnel ?? []).reduce(
    (acc, f) => ({
      visitors: acc.visitors + (f.visitors ?? 0),
      signups: acc.signups + (f.signups ?? 0),
      active_trials: acc.active_trials + (f.active_trials ?? 0),
      engaged: acc.engaged + (f.engaged ?? 0),
      subscribers: acc.subscribers + (f.subscribers ?? 0),
      churned: acc.churned + (f.churned ?? 0),
    }),
    { visitors: 0, signups: 0, active_trials: 0, engaged: 0, subscribers: 0, churned: 0 }
  );

  const conversaoCheia = agg.visitors > 0 ? (agg.subscribers / agg.visitors) * 100 : 0;
  const ltv = kpis?.avgLtv ?? 0;
  const cacGuess = 158; // fallback informativo
  const ltvCacRatio = ltv > 0 ? (ltv / cacGuess) : 0;

  const dropTrialAssinante = agg.active_trials > 0 ? 100 - (agg.subscribers / agg.active_trials * 100) : 0;

  const FUNNEL_ROWS = [
    { stage: "Visitor", sub: "visita anônima", num: agg.visitors, conv: null as string | null, drop: null as string | null, gold: false },
    { stage: "Signup", sub: "conta criada", num: agg.signups, conv: pct(agg.signups, agg.visitors), drop: agg.visitors > 0 ? `− ${(100 - (agg.signups / agg.visitors) * 100).toFixed(0)}%` : "—", gold: false },
    { stage: "Trial ativo", sub: "≥ 1 questão respondida", num: agg.active_trials, conv: pct(agg.active_trials, agg.signups), drop: agg.signups > 0 ? `− ${(100 - (agg.active_trials / agg.signups) * 100).toFixed(0)}%` : "—", gold: false },
    { stage: "Engajado", sub: "≥ 30 questões / 7d", num: agg.engaged, conv: pct(agg.engaged, agg.active_trials), drop: agg.active_trials > 0 ? `− ${(100 - (agg.engaged / agg.active_trials) * 100).toFixed(0)}%` : "—", gold: false },
    { stage: "Assinante", sub: "plano pago", num: agg.subscribers, conv: pct(agg.subscribers, agg.engaged), drop: agg.engaged > 0 ? `− ${(100 - (agg.subscribers / agg.engaged) * 100).toFixed(0)}%` : "—", gold: true },
    { stage: "Churn", sub: "cancelaram", num: agg.churned, conv: null, drop: null, gold: false, neg: true },
  ];

  const maxNum = Math.max(...FUNNEL_ROWS.map((r) => r.num)) || 1;

  return (
    <CrmShellV3
      mode="marketing"
      crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "Funil & UTM" }]}
      topbarTools={
        <>
          <button className="crm-btn crm-btn-ghost"><Download size={13} /> Exportar</button>
          <button className="crm-btn crm-btn-primary"><Plus size={13} /> Nova campanha</button>
        </>
      }
    >
      <main className="crm-page">
        <section className="crm-hero">
          <div>
            <div className="crm-page-eyebrow">Marketing · Conversion analytics</div>
            <h1 className="crm-page-title">Funil <em>de aquisição</em></h1>
            <p className="crm-page-sub">
              Funil agregado em crm_funnel_kpis (view por produto). Coortes calculadas client-side a partir de crm_leads. UTM breakdown via crm_leads.utm_source.
            </p>
          </div>
        </section>

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Conversão funil cheio" value={conversaoCheia.toFixed(2)} unit="%" deltaText="visitor → assinante" accent="mrr" />
          <Kpi label="Total visitantes" value={fmt(agg.visitors)} deltaText={`${(funnel ?? []).length} produtos`} />
          <Kpi label="Assinantes ativos" value={fmt(agg.subscribers)} deltaText={`LTV ≈ ${fmtBRL(ltv)}`} />
          <Kpi label="Drop trial → assinante" value={`${dropTrialAssinante.toFixed(0)}%`} deltaText={ltvCacRatio > 0 ? `LTV/CAC ≈ ${ltvCacRatio.toFixed(1)}×` : ""} accent="warn" />
        </section>

        {/* Funil + Cohort */}
        <section className="crm-mobile-stack" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
          <div className="crm-card">
            <CardHead title="Funil completo · agregado" sub={`${fmt(agg.visitors)} visitantes → ${fmt(agg.subscribers)} assinantes pagantes`} />
            <div className="crm-card-pad">
              {(funnel ?? []).length > 0 ? (
                <div>
                  {FUNNEL_ROWS.map((row) => {
                    const width = (row.num / maxNum) * 100;
                    return (
                      <div key={row.stage} className="crm-mobile-stack" style={{
                        display: "grid",
                        gridTemplateColumns: "110px 1fr 220px",
                        gap: 18, alignItems: "center",
                        padding: "14px 0",
                        borderBottom: "1px solid var(--crm-line-soft)",
                      }}>
                        <div style={{ fontFamily: "var(--crm-sans)", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--crm-ink-3)" }}>
                          <span style={{ display: "block", color: "var(--crm-ink)", fontSize: 13, letterSpacing: "-0.005em", textTransform: "none", fontWeight: 700, marginBottom: 1 }}>{row.stage}</span>
                          {row.sub}
                        </div>
                        <div style={{ position: "relative", height: 36 }}>
                          <div style={{
                            height: "100%",
                            width: `${Math.max(width, 4)}%`,
                            background: row.gold
                              ? "linear-gradient(90deg, #5C3F00 0%, #A88A33 100%)"
                              : (row as any).neg
                                ? "linear-gradient(90deg, #6E2A2A 0%, #B33A3A 100%)"
                                : "linear-gradient(90deg, #0F4128 0%, #1B5E3B 100%)",
                            borderRadius: 4,
                            display: "flex", alignItems: "center", paddingLeft: 14,
                            color: "#fff",
                            fontFamily: "var(--crm-sans)",
                            fontWeight: 700,
                            fontFeatureSettings: '"tnum"',
                            fontSize: 14,
                          }}>
                            {fmt(row.num)} <span className="crm-mono" style={{ fontSize: 11, opacity: 0.85, marginLeft: 10 }}>{row.conv ?? ""}</span>
                          </div>
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--crm-ink-4)", display: "flex", gap: 14, justifyContent: "flex-end" }} className="crm-mono">
                          {row.conv && <span style={{ color: "var(--crm-green-deep)" }}>conv. <strong>{row.conv}</strong></span>}
                          {row.drop && <span style={{ color: "var(--crm-neg)" }}>drop {row.drop}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
                  Sem dados em <code>crm_funnel_kpis</code> — view ainda não populada.
                </div>
              )}
            </div>
          </div>

          <div className="crm-card">
            <CardHead title="Coorte de retenção" sub="% ativos por mês de cadastro · client-side de crm_leads" />
            <div className="crm-card-pad">
              {(cohorts ?? []).length > 0 ? (
                <CohortGrid cohorts={cohorts ?? []} />
              ) : (
                <div style={{ padding: 32, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
                  Sem coortes para calcular.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* UTM Sources */}
        <section className="crm-card">
          <CardHead title="UTM sources · agregado por canal" sub={`${(utm ?? []).length} fontes · ${fmt((utm ?? []).reduce((s: number, u: any) => s + u.leads, 0))} leads atribuídos`} />
          {(utm ?? []).length > 0 ? (
            <>
              <div className="crm-mobile-hide" style={{
                display: "grid", gridTemplateColumns: "1fr 110px 110px 110px 110px",
                gap: 16, padding: "8px 16px",
                background: "var(--crm-surface-2)",
                borderBottom: "1px solid var(--crm-line)",
                fontFamily: "var(--crm-sans)", fontSize: 10.5, fontWeight: 700,
                letterSpacing: "0.07em", textTransform: "uppercase",
                color: "var(--crm-ink-4)",
              }}>
                <div>Fonte UTM</div>
                <div style={{ textAlign: "right" }}>Leads</div>
                <div style={{ textAlign: "right" }}>Convertidos</div>
                <div style={{ textAlign: "right" }}>Conv.</div>
                <div style={{ textAlign: "right" }}>Score médio</div>
              </div>
              {(utm ?? []).sort((a: any, b: any) => b.leads - a.leads).map((u: any) => {
                const conv = u.leads > 0 ? (u.subscribers / u.leads) * 100 : 0;
                const avgScore = u.leads > 0 ? Math.round(u.total_score / u.leads) : 0;
                return (
                  <div key={u.source} className="crm-mobile-stack" style={{
                    display: "grid", gridTemplateColumns: "1fr 110px 110px 110px 110px",
                    gap: 16, alignItems: "center", padding: "14px 16px",
                    borderBottom: "1px solid var(--crm-line-soft)",
                  }}>
                    <div>
                      <code style={{ background: "var(--crm-surface-2)", padding: "2px 8px", borderRadius: 3, fontFamily: "var(--crm-mono)", fontSize: 12 }}>{u.source}</code>
                    </div>
                    <div className="crm-mono" style={{ textAlign: "right", fontSize: 13, fontWeight: 600 }}>{fmt(u.leads)}</div>
                    <div className="crm-mono" style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: "var(--crm-green-deep)" }}>{fmt(u.subscribers)}</div>
                    <div className="crm-mono" style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: conv >= 10 ? "var(--crm-green-deep)" : "var(--crm-ink)" }}>{conv.toFixed(1)}%</div>
                    <div className="crm-mono" style={{ textAlign: "right", fontSize: 13, color: "var(--crm-ink)" }}>{avgScore}</div>
                  </div>
                );
              })}
            </>
          ) : (
            <div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
              Sem UTMs cadastradas em <code>crm_leads.utm_source</code>.
            </div>
          )}
        </section>

        {/* Funil por produto */}
        {(funnel ?? []).length > 1 && (
          <section className="crm-card">
            <CardHead title="Por produto" sub="quebra do funil por produto_interesse" />
            <table className="crm-tbl">
              <thead><tr><th>Produto</th><th style={{ textAlign: "right" }}>Visitors</th><th style={{ textAlign: "right" }}>Signups</th><th style={{ textAlign: "right" }}>Trials</th><th style={{ textAlign: "right" }}>Engaged</th><th style={{ textAlign: "right" }}>Subscribers</th><th style={{ textAlign: "right" }}>V→S</th></tr></thead>
              <tbody>
                {(funnel ?? []).map((f) => (
                  <tr key={f.produto}>
                    <td className="lead-name">{f.produto}</td>
                    <td className="num">{fmt(f.visitors ?? 0)}</td>
                    <td className="num">{fmt(f.signups ?? 0)}</td>
                    <td className="num">{fmt(f.active_trials ?? 0)}</td>
                    <td className="num">{fmt(f.engaged ?? 0)}</td>
                    <td className="num"><strong>{fmt(f.subscribers ?? 0)}</strong></td>
                    <td className="num">{(f.visitor_to_signup_pct ?? 0).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </CrmShellV3>
  );
}

function cohortColor(v: number | null): { bg: string; color: string } {
  if (v === null) return { bg: "transparent", color: "var(--crm-ink-5)" };
  if (v >= 90) return { bg: "#1B5E3B", color: "#fff" };
  if (v >= 75) return { bg: "#3F8B5C", color: "#fff" };
  if (v >= 50) return { bg: "#5BA374", color: "#fff" };
  return { bg: "#86B996", color: "#fff" };
}

function CohortGrid({ cohorts }: { cohorts: { cohort: string; total: number; values: number[] }[] }) {
  return (
    <div className="crm-cohort-grid" style={{ display: "grid", gridTemplateColumns: "120px repeat(7, 1fr)", gap: 4, fontFamily: "var(--crm-mono)", fontSize: 11, minWidth: 560 }}>
      <div style={{ color: "var(--crm-ink-4)", fontSize: 10.5, padding: "6px 8px", fontWeight: 600, fontFamily: "var(--crm-sans)" }}>Coorte</div>
      {["M0", "M1", "M2", "M3", "M4", "M5", "M6"].map((m) => (
        <div key={m} style={{ color: "var(--crm-ink-4)", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 10.5, padding: "6px 8px", textAlign: "center", fontWeight: 600 }}>{m}</div>
      ))}
      {cohorts.map((row, idx) => {
        const maxIdx = cohorts.length - 1 - idx;
        return (
          <RowCohort key={row.cohort} row={row} maxIdx={maxIdx} />
        );
      })}
    </div>
  );
}

function RowCohort({ row, maxIdx }: { row: { cohort: string; total: number; values: number[] }; maxIdx: number }) {
  return (
    <>
      <div style={{ color: "var(--crm-ink-3)", fontFamily: "var(--crm-sans)", padding: "6px 8px", fontSize: 10.5 }}>{row.cohort} · {row.total}</div>
      {row.values.map((v, i) => {
        const visible = i <= maxIdx;
        const { bg, color } = cohortColor(visible ? v : null);
        return (
          <div key={`${row.cohort}-${i}`} style={{
            padding: "8px 6px", textAlign: "center", borderRadius: 4,
            background: bg, color, fontFeatureSettings: '"tnum"', fontWeight: 600,
          }}>
            {visible ? `${v}%` : "—"}
          </div>
        );
      })}
    </>
  );
}
