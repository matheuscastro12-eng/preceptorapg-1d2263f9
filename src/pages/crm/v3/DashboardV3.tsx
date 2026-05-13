import { useEffect, useRef } from "react";
import CrmShellV3, { Kpi } from "@/components/crm/v3/CrmShellV3";
import { Bell, Share2, Plus, Wallet, AlertTriangle, Zap, Filter, LayoutGrid, Sparkles } from "lucide-react";
import { useDashboardKpis, useHealthDistribution, useActiveChurnRisks, useRecentAutomations, useFunnelKpis, useUtmBreakdown } from "@/hooks/useCrm";

const fmtBRL = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmt = (v: number) => v.toLocaleString("pt-BR");

export default function DashboardV3() {
  const { data: kpis } = useDashboardKpis();
  const { data: healthList } = useHealthDistribution();
  const { data: risks } = useActiveChurnRisks({ pageSize: 5 });
  const { data: automations } = useRecentAutomations({ pageSize: 6 });
  const { data: funnel } = useFunnelKpis();
  const { data: utm } = useUtmBreakdown();
  const heatmapRef = useRef<HTMLDivElement>(null);

  // Health distribution (array → agregado por zona)
  const byZone: Record<string, { total: number; avg: number }> = {};
  (healthList ?? []).forEach((h: any) => {
    const z = h.zone;
    if (!byZone[z]) byZone[z] = { total: 0, avg: 0 };
    byZone[z].total += h.total ?? h.count ?? 0;
  });
  const healthy = byZone.healthy?.total ?? 0;
  const attention = byZone.attention?.total ?? 0;
  const risk = byZone.risk?.total ?? 0;
  const critical = byZone.critical?.total ?? 0;
  const inactive = byZone.inactive?.total ?? 0;
  const totalHealth = healthy + attention + risk + critical + inactive;

  // Funnel agregado
  const fAgg = (funnel ?? []).reduce(
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

  const pctOf = (a: number, b: number) => b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "—";
  const widthOf = (n: number, max: number) => max > 0 ? Math.max((n / max) * 100, 2) : 0;
  const fMax = Math.max(fAgg.visitors, 1);

  // Top UTM source
  const topUtm = (utm ?? []).slice().sort((a: any, b: any) => b.leads - a.leads)[0];
  const topUtmShare = topUtm && fAgg.signups > 0 ? Math.round((topUtm.leads / fAgg.signups) * 100) : 0;
  const topUtmAvgScore = topUtm && topUtm.leads > 0 ? Math.round(topUtm.total_score / topUtm.leads) : 0;

  // Heatmap
  useEffect(() => {
    const grid = heatmapRef.current;
    if (!grid) return;
    grid.innerHTML = "";
    const totalCells = 200;
    const colors = ["#EFE8D8", "#E0D5A8", "#C8C896", "#94B387", "#5C9067", "#1B5E3B"];
    const cells: string[] = [];

    if (totalHealth > 0) {
      const i = Math.round((inactive / totalHealth) * totalCells);
      const r = Math.round(((risk + critical) / totalHealth) * totalCells);
      const a = Math.round((attention / totalHealth) * totalCells);
      const h = totalCells - i - r - a;
      for (let k = 0; k < i; k++) cells.push(colors[0]);
      for (let k = 0; k < r; k++) cells.push(colors[1 + (k % 2)]);
      for (let k = 0; k < a; k++) cells.push(colors[2 + (k % 2)]);
      for (let k = 0; k < Math.max(h, 0); k++) cells.push(colors[4 + (k % 2)]);
    }
    while (cells.length < totalCells) cells.push(colors[5]);
    cells.slice(0, totalCells).forEach((c) => {
      const el = document.createElement("div");
      el.className = "crm-health-cell";
      el.style.background = c;
      grid.appendChild(el);
    });
  }, [totalHealth, healthy, attention, risk, critical, inactive]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const disparosHoje = (automations?.automations ?? []).filter((a: any) => new Date(a.created_at) >= todayStart).length;

  return (
    <CrmShellV3
      mode="marketing"
      crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "Dashboard" }]}
      topbarTools={
        <>
          <span className="crm-live">ao vivo</span>
          <button className="crm-btn-icon" title="Notificações"><Bell /></button>
          <button className="crm-btn-icon" title="Compartilhar"><Share2 /></button>
          <button className="crm-btn crm-btn-primary"><Plus /> Nova campanha</button>
        </>
      }
    >
      <main className="crm-page">
        {/* HERO */}
        <section className="crm-hero">
          <div>
            <div className="crm-page-eyebrow">Marketing · Tempo real</div>
            <h1 className="crm-page-title">Dashboard <em>de aquisição</em></h1>
            <p className="crm-page-sub">
              Funil, leads e saúde dos alunos consolidados em uma vista. Receita, runway e people health vivem no modo Admin.
            </p>
          </div>
        </section>

        {/* KPI — dados reais */}
        <section className="crm-kpi-row">
          <Kpi
            label="MRR"
            value={kpis ? fmtBRL(kpis.mrr) : "—"}
            unit="/mês"
            deltaText={`${kpis?.totalSubscribers ?? 0} ativos`}
            accent="mrr"
          />
          <Kpi
            label="Assinantes"
            value={kpis?.totalSubscribers ?? "—"}
            unit="ativos"
            deltaText={`${kpis?.totalLeads ?? 0} leads totais`}
          />
          <Kpi
            label="Churn rate"
            value={kpis ? kpis.churnRate.toFixed(1) : "—"}
            unit="%"
            deltaText="últimos 30d"
            deltaSign={kpis && kpis.churnRate > 5 ? "neg" : "pos"}
          />
          <Kpi
            label="Em risco"
            value={kpis?.churnRisks ?? "—"}
            unit="alunos"
            deltaText="predições ativas"
            accent="warn"
          />
          <Kpi
            label="Em saúde"
            value={healthy}
            unit="alunos"
            deltaText={totalHealth > 0 ? `${Math.round((healthy / totalHealth) * 100)}% do total` : "score ≥ 70"}
          />
          <Kpi
            label="Automações hoje"
            value={kpis?.automationsToday ?? disparosHoje}
            unit="disparos"
            deltaText="crm_automations_log"
          />
        </section>

        {/* INSIGHT — top UTM */}
        {topUtm && (
          <section className="crm-insight">
            <div className="ico"><Sparkles size={13} /></div>
            <div>
              <div className="head">
                A fonte <strong>{topUtm.source}</strong> respondeu por {topUtmShare}% dos leads no banco.
              </div>
              <div className="body">
                UTM <code>{topUtm.source}</code> trouxe <strong>{fmt(topUtm.leads)} leads</strong> ({fmt(topUtm.subscribers)} assinaram, conv. {pctOf(topUtm.subscribers, topUtm.leads)}), com score médio
                {" "}<strong>{topUtmAvgScore}</strong>.
              </div>
            </div>
          </section>
        )}

        {/* FUNNEL + HEALTH */}
        <section className="crm-g-23">
          <div className="crm-card">
            <div className="crm-card-head">
              <div>
                <div className="crm-card-title"><Filter size={14} strokeWidth={1.8} /> Funil de conversão</div>
                <div className="crm-card-sub">Visitantes → Assinantes · agregado · {(funnel ?? []).length} produtos</div>
              </div>
            </div>
            <div className="crm-card-pad">
              {fAgg.visitors > 0 ? (
                <div className="crm-funnel">
                  <FunnelRow name="Visitantes" sub="site + landing" pct={100} num={fmt(fAgg.visitors)} pctText="100%" />
                  <FunnelRow name="Signups" sub="conta criada" pct={widthOf(fAgg.signups, fMax)} num={fmt(fAgg.signups)} pctText={pctOf(fAgg.signups, fAgg.visitors)} />
                  <FunnelRow name="Trial ativo" sub="acesso liberado" pct={widthOf(fAgg.active_trials, fMax)} num={fmt(fAgg.active_trials)} pctText={pctOf(fAgg.active_trials, fAgg.signups)} />
                  <FunnelRow name="Engajados" sub="≥ 3 sessões" pct={widthOf(fAgg.engaged, fMax)} num={fmt(fAgg.engaged)} pctText={pctOf(fAgg.engaged, fAgg.active_trials)} />
                  <FunnelRow name="Assinantes" sub="plano pago ativo" pct={widthOf(fAgg.subscribers, fMax)} num={fmt(fAgg.subscribers)} pctText={pctOf(fAgg.subscribers, fAgg.engaged)} />
                  <FunnelRow name="Churn" sub="cancelados nos 30d" pct={widthOf(fAgg.churned, fMax)} num={fmt(fAgg.churned)} pctText={`${kpis?.churnRate.toFixed(1) ?? "0"}%`} churn />
                </div>
              ) : (
                <div style={{ padding: 32, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
                  Sem dados em <code>crm_funnel_kpis</code>.
                </div>
              )}
            </div>
          </div>

          <div className="crm-card">
            <div className="crm-card-head">
              <div>
                <div className="crm-card-title"><LayoutGrid size={14} strokeWidth={1.8} /> Saúde dos alunos</div>
                <div className="crm-card-sub">Score 0–100 · {totalHealth} alunos com score</div>
              </div>
              <div className="crm-card-side"><a className="crm-btn crm-btn-link" href="/admin/crm/health">Ver mapa →</a></div>
            </div>
            <div className="crm-card-pad">
              <div ref={heatmapRef} className="crm-health-grid" />
              <div className="crm-health-stats">
                <div className="crm-health-stat"><div className="lbl">Saudável</div><div className="val" style={{ color: "var(--crm-pos)" }}>{healthy}</div></div>
                <div className="crm-health-stat"><div className="lbl">Atento</div><div className="val" style={{ color: "var(--crm-gold-deep)" }}>{attention}</div></div>
                <div className="crm-health-stat"><div className="lbl">Em risco</div><div className="val" style={{ color: "var(--crm-neg)" }}>{risk + critical}</div></div>
                <div className="crm-health-stat"><div className="lbl">Inativo</div><div className="val" style={{ color: "var(--crm-ink-4)" }}>{inactive}</div></div>
              </div>
            </div>
          </div>
        </section>

        {/* CHURN + AUTOMATIONS */}
        <section className="crm-g-23">
          <div className="crm-card">
            <div className="crm-card-head">
              <div>
                <div className="crm-card-title"><AlertTriangle size={14} strokeWidth={1.8} /> Maiores riscos de churn</div>
                <div className="crm-card-sub">{risks?.total ?? 0} predições ativas · ordenadas por probabilidade</div>
              </div>
              <div className="crm-card-side"><a className="crm-btn crm-btn-link" href="/admin/crm/churn">Ver todos →</a></div>
            </div>
            <table className="crm-tbl">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Risco</th>
                  <th style={{ textAlign: "right" }}>Probabilidade</th>
                  <th>Sinal principal</th>
                  <th>Health</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(risks?.predictions ?? []).slice(0, 5).map((r: any) => {
                  const prob = Math.round((r.churn_probability ?? 0) * 100);
                  return (
                    <ChurnRow
                      key={r.id}
                      name={r.nome ?? r.email ?? "—"}
                      email={r.email ?? ""}
                      risco={r.risk_level ?? "—"}
                      riscoTag={r.risk_level === "critical" ? "red" : r.risk_level === "high" ? "warn" : "gray"}
                      prob={prob}
                      sinal={(r.signals ?? []).slice(0, 1).join(" · ") || "—"}
                      healthScore={r.health_score ?? null}
                      warn={prob < 70}
                    />
                  );
                })}
                {(!risks || risks.predictions.length === 0) && (
                  <tr>
                    <td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
                      Sem alunos em risco em <code>crm_active_churn_risks</code>.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="crm-card">
            <div className="crm-card-head">
              <div>
                <div className="crm-card-title"><Zap size={14} strokeWidth={1.8} /> Automações recentes</div>
                <div className="crm-card-sub">{disparosHoje} disparos hoje · {(automations?.automations ?? []).length} no log</div>
              </div>
              <div className="crm-card-side"><a className="crm-btn crm-btn-link" href="/admin/crm/automations">Logs →</a></div>
            </div>
            <div className="crm-automation-list">
              {(automations?.automations ?? []).map((a: any) => {
                const when = a.created_at ? new Date(a.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—";
                const type = a.channel === "email" ? "email" : a.channel === "push" ? "push" : "warn";
                return (
                  <AutomationRow
                    key={a.id}
                    type={type as "email" | "push" | "warn"}
                    title={a.trigger_name ?? a.template_name ?? "Automação"}
                    meta={`${a.crm_leads?.email ?? "—"} · ${a.status ?? "ok"}`}
                    when={when}
                  />
                );
              })}
              {(!automations || automations.automations.length === 0) && (
                <div style={{ padding: 24, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
                  Sem automações executadas recentemente.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </CrmShellV3>
  );
}

function FunnelRow({ name, sub, pct, num, pctText, churn }: { name: string; sub: string; pct: number; num: string; pctText: string; churn?: boolean }) {
  return (
    <div className="crm-funnel-row">
      <div className="crm-funnel-name">{name}<span className="sub">{sub}</span></div>
      <div className="crm-funnel-bar">
        <div className={`crm-funnel-fill ${churn ? "churn" : ""}`} style={{ width: `${pct}%`, minWidth: churn ? 6 : undefined }} />
      </div>
      <div className="crm-funnel-num">{num}</div>
      <div className="crm-funnel-pct" style={churn ? { color: "var(--crm-neg)" } : {}}>{pctText}</div>
    </div>
  );
}

function ChurnRow({ name, email, risco, riscoTag, prob, sinal, healthScore, warn }: {
  name: string; email: string; risco: string; riscoTag: "red" | "warn" | "gray"; prob: number; sinal: string; healthScore: number | null; warn?: boolean;
}) {
  const color = warn ? "var(--crm-gold-deep)" : "var(--crm-neg)";
  return (
    <tr>
      <td><div className="lead-name">{name}</div><div className="lead-email">{email}</div></td>
      <td><span className={`crm-tag crm-tag-${riscoTag}`}><span className="crm-tag-dot" />{risco}</span></td>
      <td className="num"><span style={{ color, fontWeight: 700 }}>{prob}%</span></td>
      <td className="muted">{sinal}</td>
      <td className="num">{healthScore ?? "—"}</td>
      <td><button className="crm-btn crm-btn-ghost">Acionar</button></td>
    </tr>
  );
}

function AutomationRow({ type, title, meta, when }: { type: "email" | "push" | "warn"; title: string; meta: string; when: string }) {
  return (
    <div className={`crm-automation ${type}`}>
      <div className="ico">
        {type === "email" && <Wallet size={13} strokeWidth={1.8} />}
        {type === "push" && <Bell size={13} strokeWidth={1.8} />}
        {type === "warn" && <AlertTriangle size={13} strokeWidth={1.8} />}
      </div>
      <div>
        <div className="title">{title}</div>
        <div className="meta">{meta}</div>
      </div>
      <div className="when">{when}</div>
    </div>
  );
}
