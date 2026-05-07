import { useState } from "react";
import CrmShellV3, { Kpi, PageHero, PeriodBar, CardHead } from "@/components/crm/v3/CrmShellV3";
import {
  Plus, Download, Send, Activity, Edit3, Eye,
} from "lucide-react";
import {
  useDashboardKpis, useHealthDistribution, useHealthScoresList,
  useActiveChurnRisks, useAutomationsPerformance, useRecentAutomations, useUtmBreakdown,
} from "@/hooks/useCrm";
import { supabase } from "@/lib/crm/supabase";
import { useQuery } from "@tanstack/react-query";

const fmt = (v: number) => v.toLocaleString("pt-BR");
const fmtBRL = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const PLAN_TAG: Record<string, string> = {
  monthly: "gray", annual: "green", biannual: "gold", free_access: "blue",
};
const PLAN_LABEL: Record<string, string> = {
  monthly: "Mensal", annual: "Anual", biannual: "Bianual", free_access: "Free",
};

/* =========================================================
   HEALTH — dados reais
   ========================================================= */
export function HealthV3() {
  const { data: dist } = useHealthDistribution();
  const { data: list } = useHealthScoresList({ zone: "risk", page: 1 });
  const { data: kpis } = useDashboardKpis();

  const total = (dist ?? []).reduce((s, d: any) => s + d.count, 0);
  const byZone: Record<string, number> = {};
  (dist ?? []).forEach((d: any) => { byZone[d.zone] = (byZone[d.zone] ?? 0) + d.count; });
  const saudaveis = byZone["healthy"] ?? 0;
  const atentos = byZone["attention"] ?? 0;
  const risco = (byZone["risk"] ?? 0) + (byZone["critical"] ?? 0);
  const scoreMedio = total > 0
    ? Math.round((dist ?? []).reduce((s, d: any) => s + d.avg_score * d.count, 0) / total)
    : 0;

  const emRisco = (list?.scores ?? []).slice(0, 5);

  return (
    <CrmShellV3 mode="marketing" crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "Saúde dos alunos" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Marketing · Health Score"
          title={<>Saúde <em>dos {fmt(total || kpis?.totalSubscribers || 0)} alunos</em></>}
          sub="Score 0-100 calculado a partir de engajamento, última atividade e progressão. Atualizado pela view crm_health_distribution."
          actions={<button className="crm-btn crm-btn-ghost"><Download size={13} /> Exportar</button>}
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Score médio" value={scoreMedio} accent="mrr" />
          <Kpi label="Saudáveis" value={saudaveis} unit={`/${total}`} deltaText="score ≥ 70" />
          <Kpi label="Atentos" value={atentos} deltaText="score 40-69" accent="warn" />
          <Kpi label="Em risco" value={risco} deltaText="score < 40" accent="neg" />
        </section>

        <section className="crm-card">
          <CardHead title="Distribuição por zona" sub="dados de crm_health_distribution" />
          <div className="crm-card-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(dist ?? []).map((d: any) => {
              const pct = total > 0 ? (d.count / total) * 100 : 0;
              const cor = d.zone === "healthy" ? "var(--crm-green-deep)" : d.zone === "attention" ? "var(--crm-gold-deep)" : "var(--crm-neg)";
              return (
                <div key={d.zone}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: "var(--crm-ink-2)", textTransform: "capitalize" }}>{d.zone}</span>
                    <span className="crm-mono" style={{ fontSize: 13, fontWeight: 700 }}>{d.count} · score médio {Math.round(d.avg_score)}</span>
                  </div>
                  <div style={{ height: 14, background: "var(--crm-surface-3)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.max(pct, 2)}%`, background: cor, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
            {(!dist || dist.length === 0) && (
              <div style={{ padding: 32, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>Sem dados em crm_health_distribution.</div>
            )}
          </div>
        </section>

        <section className="crm-card">
          <CardHead title="Alunos em risco" sub={`${list?.total ?? 0} alunos com score em zona risk/critical`} side={<a className="crm-btn crm-btn-link" href="/admin/crm/health">Ver todos →</a>} />
          {emRisco.length > 0 ? (
            <table className="crm-tbl">
              <thead><tr><th>Aluno</th><th>Score</th><th>Questões 7d</th><th>Dias ativos 14d</th></tr></thead>
              <tbody>
                {emRisco.map((r: any) => (
                  <tr key={r.id}>
                    <td><div className="lead-name">{r.crm_leads?.nome ?? r.crm_leads?.email ?? "—"}</div><div className="lead-email">{r.crm_leads?.email}</div></td>
                    <td><div className="crm-score"><div className="crm-score-bar" style={{ ["--score" as never]: `${r.score}%` }} /><span className="crm-score-num">{r.score}</span></div></td>
                    <td className="num">{r.questoes_7d ?? 0}</td>
                    <td className="num">{r.dias_ativos_14d ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 32, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>Nenhum aluno em zona de risco.</div>
          )}
        </section>
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   CHURN — dados reais
   ========================================================= */
export function ChurnV3() {
  const { data: critical } = useActiveChurnRisks({ risk_level: "critical", page: 1 });
  const { data: high } = useActiveChurnRisks({ risk_level: "high", page: 1 });
  const { data: medium } = useActiveChurnRisks({ risk_level: "medium", page: 1 });
  const { data: kpis } = useDashboardKpis();

  const all: any[] = [...(critical?.predictions ?? []), ...(high?.predictions ?? []), ...(medium?.predictions ?? [])];
  const cri = critical?.total ?? 0;
  const hi = high?.total ?? 0;
  const md = medium?.total ?? 0;

  return (
    <CrmShellV3 mode="marketing" crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "Risco de churn" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Marketing · Churn Prediction"
          title={<>{cri + hi} alunos <em>em risco real</em> de cancelar</>}
          sub="Modelo preditivo usando crm_active_churn_risks. Probabilidade de cancelamento na janela de validade."
          actions={<button className="crm-btn crm-btn-primary"><Send size={13} /> Acionar todos</button>}
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Risco crítico" value={cri} deltaText="≥ 70%" accent="neg" />
          <Kpi label="Risco alto" value={hi} deltaText="50-69%" accent="warn" />
          <Kpi label="Risco médio" value={md} deltaText="30-49%" />
          <Kpi label="MRR ameaçado" value={fmtBRL((cri + hi) * (kpis?.mrr ? kpis.mrr / Math.max(kpis.totalSubscribers, 1) : 50))} deltaText="estimativa se cancelarem" accent="mrr" />
        </section>

        <section className="crm-card">
          <CardHead title="Lista priorizada" sub={`${all.length} predições ativas · ordenadas por probabilidade`} />
          {all.length > 0 ? (
            <table className="crm-tbl">
              <thead><tr><th>Aluno</th><th style={{ textAlign: "right" }}>Prob.</th><th>Risco</th><th>Sinais</th><th>Health</th><th>Válido até</th></tr></thead>
              <tbody>
                {all.sort((a: any, b: any) => b.churn_probability - a.churn_probability).slice(0, 30).map((r: any) => {
                  const pct = Math.round(r.churn_probability * 100);
                  return (
                    <tr key={r.id}>
                      <td><div className="lead-name">{r.nome ?? r.email ?? "—"}</div><div className="lead-email">{r.email}</div></td>
                      <td className="num"><span style={{ color: pct >= 70 ? "var(--crm-neg)" : pct >= 50 ? "var(--crm-gold-deep)" : "var(--crm-ink)", fontWeight: 700 }}>{pct}%</span></td>
                      <td><span className={`crm-tag crm-tag-${r.risk_level === "critical" ? "red" : r.risk_level === "high" ? "warn" : "gray"}`}><span className="crm-tag-dot" />{r.risk_level}</span></td>
                      <td className="muted">{(r.signals ?? []).slice(0, 2).join(" · ") || "—"}</td>
                      <td className="num">{r.health_score ?? "—"}</td>
                      <td className="muted">{r.valid_until ? new Date(r.valid_until).toLocaleDateString("pt-BR") : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>Nenhuma predição ativa em crm_active_churn_risks.</div>
          )}
        </section>
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   COHORTS — dados reais (calculados client-side)
   ========================================================= */
function useCohortsRetencao() {
  return useQuery({
    queryKey: ["crm", "cohorts-retencao"],
    queryFn: async () => {
      // Busca leads + última activity para montar coortes mensais.
      const { data: leads } = await supabase
        .from("crm_leads")
        .select("id, created_at, last_activity_at, status")
        .gte("created_at", new Date(Date.now() - 240 * 86400000).toISOString());
      const byCohort: Record<string, { total: number; active: number[] }> = {};
      const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      (leads ?? []).forEach((l: any) => {
        const cohort = monthKey(new Date(l.created_at));
        if (!byCohort[cohort]) byCohort[cohort] = { total: 0, active: [0, 0, 0, 0, 0, 0, 0] };
        byCohort[cohort].total += 1;
        if (l.status === "subscriber" || l.status === "active_trial" || l.status === "engaged") {
          // contar como ativo nos meses M0..M6 a partir de last_activity
          const created = new Date(l.created_at);
          const lastAct = l.last_activity_at ? new Date(l.last_activity_at) : created;
          const mAtivo = Math.min(6, Math.floor((lastAct.getTime() - created.getTime()) / (30 * 86400000)));
          for (let i = 0; i <= mAtivo; i++) byCohort[cohort].active[i] += 1;
        } else {
          byCohort[cohort].active[0] += 1;
        }
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

export function CohortsV3() {
  const { data: cohorts } = useCohortsRetencao();
  const lista = cohorts ?? [];

  // KPIs: retenção média M1, M3, M6 considerando apenas coortes que já viveram esse mês
  const avgM = (mIdx: number) => {
    const vals = lista.filter((c) => c.values[mIdx] !== undefined && lista.indexOf(c) <= lista.length - 1 - mIdx).map((c) => c.values[mIdx]);
    return vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
  };

  return (
    <CrmShellV3 mode="marketing" crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "Coortes" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Marketing · Retention"
          title={<>Coortes <em>de retenção</em></>}
          sub="% de assinantes ativos por mês de cadastro. Calculado client-side a partir de crm_leads."
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Retenção M1" value={avgM(1)} unit="%" accent="mrr" />
          <Kpi label="Retenção M3" value={avgM(3)} unit="%" />
          <Kpi label="Retenção M6" value={avgM(6)} unit="%" />
          <Kpi label="Coortes ativas" value={lista.length} deltaText="últimos 8 meses" />
        </section>

        <section className="crm-card">
          <CardHead title="Cohort grid" sub="cada linha é uma coorte mensal · cada coluna meses desde o cadastro" />
          <div className="crm-card-pad">
            {lista.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "140px repeat(7, 1fr)", gap: 4, fontFamily: "var(--crm-mono)", fontSize: 11 }}>
                <div style={{ color: "var(--crm-ink-4)", fontSize: 10.5, padding: "6px 8px", fontWeight: 600, fontFamily: "var(--crm-sans)" }}>Coorte</div>
                {["M0","M1","M2","M3","M4","M5","M6"].map((m) => <div key={m} style={{ color: "var(--crm-ink-4)", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 10.5, padding: "6px 8px", textAlign: "center", fontWeight: 600 }}>{m}</div>)}
                {lista.map((row, idx) => {
                  const maxIdx = lista.length - 1 - idx;
                  return (
                    <RowCohort key={row.cohort} row={row} maxIdx={maxIdx} />
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: 32, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>Sem coortes calculadas — aguardando leads em crm_leads.</div>
            )}
          </div>
        </section>
      </main>
    </CrmShellV3>
  );
}

function RowCohort({ row, maxIdx }: { row: { cohort: string; total: number; values: number[] }; maxIdx: number }) {
  const cor = (v: number | null) => {
    if (v === null) return { bg: "transparent", color: "var(--crm-ink-5)" };
    if (v >= 90) return { bg: "#1B5E3B", color: "#fff" };
    if (v >= 75) return { bg: "#3F8B5C", color: "#fff" };
    if (v >= 50) return { bg: "#5BA374", color: "#fff" };
    return { bg: "#86B996", color: "#fff" };
  };
  return (
    <>
      <div style={{ color: "var(--crm-ink-3)", fontFamily: "var(--crm-sans)", padding: "8px 8px", fontSize: 11.5 }}>{row.cohort} · {row.total}</div>
      {row.values.map((v, i) => {
        const visible = i <= maxIdx;
        const { bg, color } = cor(visible ? v : null);
        return (
          <div key={`${row.cohort}-${i}`} style={{ padding: "10px 6px", textAlign: "center", borderRadius: 4, background: bg, color, fontFeatureSettings: '"tnum"', fontWeight: 600 }}>
            {visible ? `${v}%` : "—"}
          </div>
        );
      })}
    </>
  );
}

/* =========================================================
   AUTOMATIONS — dados reais
   ========================================================= */
export function AutomationsV3() {
  const { data: perf } = useAutomationsPerformance();
  const { data: recent } = useRecentAutomations({ pageSize: 50 });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const disparosHoje = (recent?.automations ?? []).filter((a: any) => new Date(a.created_at) >= todayStart).length;

  const lista = recent?.automations ?? [];
  const totalDelivered = lista.filter((a: any) => a.delivered_at || a.status === "delivered" || a.status === "opened" || a.status === "clicked").length;
  const totalOpened = lista.filter((a: any) => a.opened_at || a.status === "opened" || a.status === "clicked").length;
  const totalSent = lista.filter((a: any) => a.sent_at || a.status !== "pending").length;
  const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;
  const openRate = totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0;

  return (
    <CrmShellV3 mode="marketing" crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "Automações" }]}
      topbarTools={<><button className="crm-btn crm-btn-ghost"><Download size={13} /> Logs</button><button className="crm-btn crm-btn-primary"><Plus size={13} /> Nova automação</button></>}
    >
      <main className="crm-page">
        <PageHero
          eyebrow="Marketing · Automations"
          title={<>{fmt(disparosHoje)} disparos <em>hoje</em></>}
          sub="Logs de crm_automations_log e performance agregada via view crm_automations_performance."
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Disparos hoje" value={disparosHoje} accent="mrr" />
          <Kpi label="Delivery rate" value={deliveryRate} unit="%" deltaText={`${totalDelivered}/${totalSent}`} />
          <Kpi label="Open rate" value={openRate} unit="%" deltaText={`${totalOpened}/${totalDelivered}`} />
          <Kpi label="Playbooks ativos" value={(perf ?? []).length} deltaText="performance views" accent="warn" />
        </section>

        <section className="crm-card">
          <CardHead title="Performance por gatilho" sub="agregado em crm_automations_performance" />
          {(perf ?? []).length > 0 ? (
            <table className="crm-tbl">
              <thead><tr><th>Trigger</th><th>Canal</th><th style={{ textAlign: "right" }}>Total</th><th style={{ textAlign: "right" }}>Delivery</th><th style={{ textAlign: "right" }}>Open</th><th style={{ textAlign: "right" }}>Click</th></tr></thead>
              <tbody>
                {(perf ?? []).map((p: any, i: number) => (
                  <tr key={i}>
                    <td className="lead-name">{p.trigger_name}</td>
                    <td><span className={`crm-tag crm-tag-${p.automation_type === "email" ? "blue" : p.automation_type === "push" ? "gold" : p.automation_type === "whatsapp" ? "green" : "gray"}`}><span className="crm-tag-dot" />{p.automation_type}</span></td>
                    <td className="num">{p.total_sent ?? 0}</td>
                    <td className="num">{p.delivery_rate ? `${Math.round(p.delivery_rate * 100)}%` : "—"}</td>
                    <td className="num">{p.open_rate ? `${Math.round(p.open_rate * 100)}%` : "—"}</td>
                    <td className="num">{p.click_rate ? `${Math.round(p.click_rate * 100)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 32, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>Sem dados em crm_automations_performance.</div>
          )}
        </section>

        <section className="crm-card">
          <CardHead title="Logs recentes" sub={`${lista.length} disparos · ordenados por data desc`} />
          {lista.length > 0 ? (
            <table className="crm-tbl">
              <thead><tr><th>Trigger</th><th>Lead</th><th>Canal</th><th>Status</th><th>Quando</th></tr></thead>
              <tbody>
                {lista.slice(0, 30).map((a: any) => (
                  <tr key={a.id}>
                    <td className="lead-name">{a.trigger_name}</td>
                    <td className="muted">{a.crm_leads?.email ?? "—"}</td>
                    <td><span className="crm-tag crm-tag-gray"><span className="crm-tag-dot" />{a.channel}</span></td>
                    <td><span className={`crm-tag crm-tag-${a.status === "failed" || a.status === "bounced" ? "red" : a.status === "opened" || a.status === "clicked" ? "green" : "gray"}`}><span className="crm-tag-dot" />{a.status}</span></td>
                    <td className="muted">{new Date(a.created_at).toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 32, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>Sem disparos em crm_automations_log.</div>
          )}
        </section>
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   EMAIL TEMPLATES — dados reais
   ========================================================= */
function useEmailTemplates() {
  return useQuery({
    queryKey: ["crm", "email-templates"],
    queryFn: async () => {
      const { data } = await supabase.from("crm_email_templates").select("*").order("label");
      return (data ?? []) as any[];
    },
  });
}

export function EmailTemplatesV3() {
  const { data: templates } = useEmailTemplates();
  const lista = templates ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = lista.find((t: any) => t.trigger_name === selectedId) ?? lista[0];

  return (
    <CrmShellV3 mode="marketing" crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "E-mail templates" }]}
      topbarTools={<><button className="crm-btn crm-btn-ghost"><Eye size={13} /> Preview</button><button className="crm-btn crm-btn-primary"><Plus size={13} /> Novo template</button></>}
    >
      <main className="crm-page">
        <PageHero
          eyebrow="Marketing · Email Library"
          title={<>{lista.length} templates <em>em produção</em></>}
          sub="Biblioteca de e-mails salva em crm_email_templates. Cada trigger tem um template ativo."
        />

        {lista.length === 0 ? (
          <section className="crm-card">
            <div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>Sem templates em crm_email_templates.</div>
          </section>
        ) : (
          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div className="crm-card">
              <CardHead title="Lista de templates" sub={`${lista.length} cadastrados`} />
              <div>
                {lista.map((t: any) => {
                  const isSel = (selected?.trigger_name === t.trigger_name);
                  return (
                    <button key={t.trigger_name} onClick={() => setSelectedId(t.trigger_name)} style={{
                      width: "100%", textAlign: "left", border: "none",
                      padding: "14px 18px",
                      borderBottom: "1px solid var(--crm-line-soft)",
                      background: isSel ? "var(--crm-green-tint)" : "var(--crm-surface)",
                      cursor: "pointer", display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center",
                    }}>
                      <div>
                        <div style={{ fontFamily: "var(--crm-sans)", fontSize: 13, fontWeight: 600, color: "var(--crm-ink)" }}>{t.label ?? t.trigger_name}</div>
                        <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)", marginTop: 2 }}>
                          {t.trigger_name} · {t.auto_send ? "auto" : "manual"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span className={`crm-tag crm-tag-${t.auto_send ? "green" : "gray"}`}><span className="crm-tag-dot" />{t.auto_send ? "Ativo" : "Manual"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="crm-card">
              <CardHead title="Preview" sub={selected?.label ?? selected?.trigger_name ?? "—"} side={<><button className="crm-btn crm-btn-primary"><Edit3 size={13} /> Editar</button></>} />
              <div style={{ padding: 24, background: "var(--crm-surface-2)", minHeight: 420 }}>
                <div style={{ background: "#fff", border: "1px solid var(--crm-line)", borderRadius: 8, padding: 28, maxWidth: 520, margin: "0 auto" }}>
                  <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)", marginBottom: 16 }}>De: PreceptorMED &lt;ola@thepreceptor.com.br&gt;</div>
                  {selected?.subject && (
                    <h2 style={{ fontFamily: "var(--crm-sans)", fontSize: 18, fontWeight: 700, color: "var(--crm-ink)", letterSpacing: "-0.02em", margin: "0 0 12px" }}>
                      {selected.subject}
                    </h2>
                  )}
                  <div style={{ fontSize: 14, color: "var(--crm-ink-2)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {selected?.body_text ?? selected?.body_html ?? "Sem corpo cadastrado."}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   ANALYTICS — dados reais
   ========================================================= */
function useDAUWAUMAU() {
  return useQuery({
    queryKey: ["crm", "dau-wau-mau"],
    queryFn: async () => {
      const now = new Date();
      const d1 = new Date(now.getTime() - 86400000).toISOString();
      const d7 = new Date(now.getTime() - 7 * 86400000).toISOString();
      const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();

      const [{ count: dau }, { count: wau }, { count: mau }] = await Promise.all([
        supabase.from("crm_leads").select("*", { count: "exact", head: true }).gte("last_activity_at", d1),
        supabase.from("crm_leads").select("*", { count: "exact", head: true }).gte("last_activity_at", d7),
        supabase.from("crm_leads").select("*", { count: "exact", head: true }).gte("last_activity_at", d30),
      ]);

      return { dau: dau ?? 0, wau: wau ?? 0, mau: mau ?? 0 };
    },
  });
}

export function AnalyticsV3() {
  const { data: utm } = useUtmBreakdown();
  const { data: usage } = useDAUWAUMAU();
  const { data: kpis } = useDashboardKpis();

  const stickiness = (usage?.mau ?? 0) > 0 ? Math.round(((usage?.dau ?? 0) / (usage?.mau ?? 1)) * 100) : 0;
  const totalUTM = (utm ?? []).reduce((s: number, u: any) => s + u.leads, 0);

  return (
    <CrmShellV3 mode="marketing" crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "Analytics" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Marketing · Product Analytics"
          title={<>Comportamento <em>do produto</em></>}
          sub="DAU/WAU/MAU calculados a partir de last_activity_at em crm_leads. UTM breakdown agrega leads por fonte."
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          <Kpi label="DAU" value={fmt(usage?.dau ?? 0)} accent="mrr" />
          <Kpi label="WAU" value={fmt(usage?.wau ?? 0)} />
          <Kpi label="MAU" value={fmt(usage?.mau ?? 0)} />
          <Kpi label="Total leads" value={fmt(kpis?.totalLeads ?? 0)} />
          <Kpi label="Stickiness" value={`${stickiness}%`} deltaText="DAU/MAU" accent="warn" />
        </section>

        <section className="crm-card">
          <CardHead title="UTM breakdown" sub={`${(utm ?? []).length} fontes · ${totalUTM} leads atribuídos`} />
          {(utm ?? []).length > 0 ? (
            <table className="crm-tbl">
              <thead><tr><th>Fonte</th><th style={{ textAlign: "right" }}>Leads</th><th style={{ textAlign: "right" }}>Subscribers</th><th style={{ textAlign: "right" }}>Conv.</th><th style={{ textAlign: "right" }}>Score médio</th></tr></thead>
              <tbody>
                {(utm ?? []).map((u: any) => {
                  const conv = u.leads > 0 ? Math.round((u.subscribers / u.leads) * 100) : 0;
                  const avgScore = u.leads > 0 ? Math.round(u.total_score / u.leads) : 0;
                  return (
                    <tr key={u.source}>
                      <td className="lead-name"><code style={{ background: "var(--crm-surface-2)", padding: "2px 6px", borderRadius: 3, fontFamily: "var(--crm-mono)", fontSize: 12 }}>{u.source}</code></td>
                      <td className="num">{fmt(u.leads)}</td>
                      <td className="num">{fmt(u.subscribers)}</td>
                      <td className="num"><span style={{ color: conv >= 10 ? "var(--crm-green-deep)" : "var(--crm-ink)", fontWeight: 700 }}>{conv}%</span></td>
                      <td className="num">{avgScore}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 32, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>Sem dados de UTM em crm_leads.</div>
          )}
        </section>
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   USERS — usuários da plataforma (alunos) via crm-auth list_users
   ========================================================= */
interface PlatformUser {
  user_id: string;
  email: string;
  full_name?: string;
  phone?: string | null;
  created_at: string;
  subscription?: {
    status: string;
    plan_type: string;
    access_expires_at: string | null;
  };
}

function usePlatformUsers() {
  return useQuery({
    queryKey: ["crm", "platform-users"],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-auth`;
      const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const token = localStorage.getItem("crm_token");
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ action: "list_users", token }),
      });
      if (!res.ok) return [];
      const json = await res.json();
      const profiles: any[] = json.profiles ?? [];
      const subs: any[] = json.subscriptions ?? [];
      const subMap: Record<string, any> = {};
      subs.forEach((s) => { subMap[s.user_id] = s; });

      return profiles.map((p) => ({
        user_id: p.user_id,
        email: p.email,
        full_name: p.full_name,
        phone: p.phone,
        created_at: p.created_at,
        subscription: subMap[p.user_id] ? {
          status: subMap[p.user_id].status,
          plan_type: subMap[p.user_id].plan_type,
          access_expires_at: subMap[p.user_id].access_expires_at,
        } : undefined,
      })) as PlatformUser[];
    },
  });
}

export function UsersV3() {
  const { data: users } = usePlatformUsers();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "paying" | "free" | "none">("all");

  const lista = users ?? [];

  const isExpired = (sub?: PlatformUser["subscription"]) => {
    if (!sub?.access_expires_at) return false;
    return new Date(sub.access_expires_at) < new Date();
  };

  const stats = {
    total: lista.length,
    paying: lista.filter((u) => u.subscription?.plan_type === "monthly" || u.subscription?.plan_type === "annual" || u.subscription?.plan_type === "biannual").length,
    free: lista.filter((u) => u.subscription?.plan_type === "free_access" && !isExpired(u.subscription)).length,
    none: lista.filter((u) => !u.subscription || u.subscription.status !== "active" || isExpired(u.subscription)).length,
  };

  const filtered = lista.filter((u) => {
    if (search) {
      const s = search.toLowerCase();
      if (!u.email.toLowerCase().includes(s) && !(u.full_name ?? "").toLowerCase().includes(s)) return false;
    }
    if (filter === "paying") return u.subscription?.plan_type === "monthly" || u.subscription?.plan_type === "annual" || u.subscription?.plan_type === "biannual";
    if (filter === "free") return u.subscription?.plan_type === "free_access" && !isExpired(u.subscription);
    if (filter === "none") return !u.subscription || u.subscription.status !== "active" || isExpired(u.subscription);
    return true;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const planLabel = (pt?: string) => {
    if (!pt) return "—";
    return PLAN_LABEL[pt] ?? pt;
  };

  const statusTag = (sub?: PlatformUser["subscription"]) => {
    if (!sub || sub.status !== "active" || isExpired(sub)) {
      return <span className="crm-tag crm-tag-gray"><span className="crm-tag-dot" />Sem acesso</span>;
    }
    if (sub.plan_type === "free_access") {
      return <span className="crm-tag crm-tag-warn"><span className="crm-tag-dot" />Gratuito</span>;
    }
    return <span className={`crm-tag crm-tag-${PLAN_TAG[sub.plan_type] ?? "gray"}`}><span className="crm-tag-dot" />{planLabel(sub.plan_type)}</span>;
  };

  return (
    <CrmShellV3 mode="marketing" crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "Usuários" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Sistema · Gestão de usuários"
          title={<>{fmt(stats.total)} usuários <em>cadastrados</em></>}
          sub="Lista de alunos da plataforma cruzada com subscriptions ativas. Carregada via edge function crm-auth (action: list_users)."
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Total" value={fmt(stats.total)} deltaText="usuários cadastrados" accent="mrr" />
          <Kpi label="Pagantes" value={fmt(stats.paying)} deltaText="monthly + annual + biannual" />
          <Kpi label="Gratuitos" value={fmt(stats.free)} deltaText="free_access ativo" accent="warn" />
          <Kpi label="Sem acesso" value={fmt(stats.none)} deltaText="inativos ou expirados" />
        </section>

        <section className="crm-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--crm-surface-2)", borderBottom: "1px solid var(--crm-line)" }}>
            <input
              placeholder="Buscar por email ou nome…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "var(--crm-surface)",
                border: "1px solid var(--crm-line)",
                borderRadius: 6,
                padding: "6px 10px",
                fontFamily: "var(--crm-text)",
                fontSize: 12.5,
                flex: 1, maxWidth: 320,
              }}
            />
            <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
              {[
                { key: "all" as const, label: "Todos", count: stats.total },
                { key: "paying" as const, label: "Pagantes", count: stats.paying },
                { key: "free" as const, label: "Gratuitos", count: stats.free },
                { key: "none" as const, label: "Sem acesso", count: stats.none },
              ].map((f) => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={filter === f.key ? "crm-btn crm-btn-primary" : "crm-btn crm-btn-ghost"}
                  style={{ fontSize: 12 }}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>
          </div>

          {filtered.length > 0 ? (
            <table className="crm-tbl">
              <thead><tr><th>Usuário</th><th>Email</th><th>Status</th><th>Plano</th><th>Expira</th><th>Cadastro</th></tr></thead>
              <tbody>
                {filtered.slice(0, 100).map((u) => (
                  <tr key={u.user_id}>
                    <td><div className="lead-name">{u.full_name ?? "—"}</div>{u.phone && <div className="lead-email">{u.phone}</div>}</td>
                    <td className="muted">{u.email}</td>
                    <td>{statusTag(u.subscription)}</td>
                    <td className="muted">{planLabel(u.subscription?.plan_type)}</td>
                    <td className="muted">{u.subscription?.access_expires_at ? new Date(u.subscription.access_expires_at).toLocaleDateString("pt-BR") : "—"}</td>
                    <td className="muted">{u.created_at ? new Date(u.created_at).toLocaleDateString("pt-BR") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
              {lista.length === 0
                ? "Sem usuários retornados pela função crm-auth. Verifique a action list_users."
                : "Sem usuários para o filtro/busca atual."}
            </div>
          )}
          {filtered.length > 100 && (
            <div style={{ padding: "12px 16px", fontSize: 12, color: "var(--crm-ink-4)", textAlign: "center", borderTop: "1px solid var(--crm-line)" }}>
              Exibindo primeiros 100 de {filtered.length} resultados.
            </div>
          )}
        </section>
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   SUPORTE — dados reais via crm_tickets se existir
   ========================================================= */
function useSupportTickets() {
  return useQuery({
    queryKey: ["crm", "support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_tickets" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) return [];
      return (data ?? []) as any[];
    },
  });
}

export function SuporteV3() {
  const { data: tickets } = useSupportTickets();
  const lista = tickets ?? [];
  const abertos = lista.filter((t: any) => t.status !== "closed" && t.status !== "resolved");

  return (
    <CrmShellV3 mode="marketing" crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "Suporte" }]}
      topbarTools={<><button className="crm-btn crm-btn-primary"><Plus size={13} /> Novo ticket</button></>}
    >
      <main className="crm-page">
        <PageHero
          eyebrow="Marketing · Suporte ao aluno"
          title={<>{abertos.length} tickets <em>abertos</em></>}
          sub="Atendimentos via crm_tickets. SLA padrão: 24h primeira resposta."
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Abertos" value={abertos.length} accent="mrr" />
          <Kpi label="Total cadastrados" value={lista.length} />
          <Kpi label="Resolvidos" value={lista.filter((t: any) => t.status === "resolved" || t.status === "closed").length} />
          <Kpi label="Bugs" value={lista.filter((t: any) => t.category === "Bug" || t.categoria === "bug").length} accent="warn" />
        </section>

        <section className="crm-card">
          <CardHead title="Tickets ativos" sub={`${abertos.length} aguardando ação`} />
          {abertos.length > 0 ? (
            <table className="crm-tbl">
              <thead><tr><th>Ticket</th><th>Aluno</th><th>Categoria</th><th>Status</th><th>Aberto</th></tr></thead>
              <tbody>
                {abertos.slice(0, 30).map((r: any) => (
                  <tr key={r.id}>
                    <td><div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)" }}>#{String(r.id).slice(0, 6)}</div><div className="lead-name">{r.title ?? r.titulo ?? "—"}</div></td>
                    <td className="muted">{r.user_email ?? r.email ?? "—"}</td>
                    <td><span className="crm-tag crm-tag-gray"><span className="crm-tag-dot" />{r.category ?? r.categoria ?? "—"}</span></td>
                    <td><span className="crm-tag crm-tag-warn"><span className="crm-tag-dot" />{r.status ?? "open"}</span></td>
                    <td className="muted">{r.created_at ? new Date(r.created_at).toLocaleString("pt-BR") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
              Nenhum ticket aberto em crm_tickets (ou tabela ainda não criada).
            </div>
          )}
        </section>
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   LANDING FUNNEL — dados reais via crm_landing_funnel_daily
   ========================================================= */
function useLandingDaily(days = 30) {
  return useQuery({
    queryKey: ["crm", "landing-daily", days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
      const { data } = await supabase
        .from("crm_landing_funnel_daily" as any)
        .select("*")
        .gte("day", since)
        .order("day", { ascending: false });
      return (data ?? []) as any[];
    },
  });
}

export function LandingFunnelV3() {
  const { data: daily } = useLandingDaily(30);
  const lista = daily ?? [];

  const sumK = (k: string) => lista.reduce((s, r: any) => s + (r[k] ?? 0), 0);
  const sessions = sumK("sessions");
  const conversions = sumK("conversions");
  const ctaClicks = sumK("any_cta_click");
  const conv = sessions > 0 ? Math.round((conversions / sessions) * 1000) / 10 : 0;
  const ctaRate = sessions > 0 ? Math.round((ctaClicks / sessions) * 1000) / 10 : 0;

  return (
    <CrmShellV3 mode="marketing" crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "Landing pages" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Marketing · Landing Performance"
          title={<>Performance <em>das landings</em></>}
          sub="Funil agregado de visitor → signup via view crm_landing_funnel_daily. Últimos 30 dias."
          actions={<PeriodBar options={["7d", "30d", "90d"]} active="30d" />}
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Sessões" value={fmt(sessions)} deltaText="30d" accent="mrr" />
          <Kpi label="Conversões" value={fmt(conversions)} deltaText={`${conv}%`} />
          <Kpi label="CTA clicks" value={fmt(ctaClicks)} deltaText={`${ctaRate}%`} accent="warn" />
          <Kpi label="Dias com tráfego" value={lista.length} deltaText={`${days(lista)} dias`} />
        </section>

        <section className="crm-card">
          <CardHead title="Daily breakdown · 30 dias" sub="dados de crm_landing_funnel_daily" />
          {lista.length > 0 ? (
            <table className="crm-tbl">
              <thead><tr><th>Dia</th><th style={{ textAlign: "right" }}>Sessões</th><th style={{ textAlign: "right" }}>Recursos</th><th style={{ textAlign: "right" }}>Como funciona</th><th style={{ textAlign: "right" }}>Preços</th><th style={{ textAlign: "right" }}>CTA</th><th style={{ textAlign: "right" }}>Conv.</th></tr></thead>
              <tbody>
                {lista.slice(0, 30).map((r: any) => (
                  <tr key={r.day}>
                    <td className="lead-name">{new Date(r.day).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</td>
                    <td className="num">{fmt(r.sessions ?? 0)}</td>
                    <td className="num">{fmt(r.viewed_recursos ?? 0)}</td>
                    <td className="num">{fmt(r.viewed_como_funciona ?? 0)}</td>
                    <td className="num">{fmt(r.viewed_precos ?? 0)}</td>
                    <td className="num">{fmt(r.any_cta_click ?? 0)}</td>
                    <td className="num"><strong>{fmt(r.conversions ?? 0)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
              Sem dados em crm_landing_funnel_daily — view ainda não populada.
            </div>
          )}
        </section>
      </main>
    </CrmShellV3>
  );
}

function days(rows: any[]) {
  if (rows.length === 0) return 0;
  return rows.length;
}

// Suprime warnings de imports não usados (usados em variantes condicionais)
void Activity; void PLAN_TAG; void PLAN_LABEL;
