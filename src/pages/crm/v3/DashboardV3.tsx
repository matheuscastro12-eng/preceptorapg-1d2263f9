import { useEffect, useRef } from "react";
import CrmShellV3, { Kpi } from "@/components/crm/v3/CrmShellV3";
import { Bell, Share2, Plus, Wallet, Users, TrendingDown, AlertTriangle, Zap, Target, Filter, LayoutGrid, Sparkles } from "lucide-react";
import { useDashboardKpis, useHealthDistribution, useActiveChurnRisks, useRecentAutomations } from "@/hooks/useCrm";

const fmtBRL = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function DashboardV3() {
  const { data: kpis } = useDashboardKpis();
  const { data: health } = useHealthDistribution();
  const { data: risks } = useActiveChurnRisks({ pageSize: 5 });
  const { data: automations } = useRecentAutomations({ pageSize: 6 });
  const heatmapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = heatmapRef.current;
    if (!grid) return;
    grid.innerHTML = "";
    // Tenta usar dados reais de health, fallback pra demo
    const total = 200;
    const colors = ["#EFE8D8", "#E0D5A8", "#C8C896", "#94B387", "#5C9067", "#1B5E3B"];
    let cells: string[] = [];

    if (health) {
      const totalReal = health.healthy + health.attention + health.risk + health.inactive || 1;
      const inactive = Math.round((health.inactive / totalReal) * total);
      const risk = Math.round((health.risk / totalReal) * total);
      const attention = Math.round((health.attention / totalReal) * total);
      const healthy = total - inactive - risk - attention;
      for (let i = 0; i < inactive; i++) cells.push(colors[0]);
      for (let i = 0; i < risk; i++) cells.push(colors[1 + (i % 2)]);
      for (let i = 0; i < attention; i++) cells.push(colors[2 + (i % 2)]);
      for (let i = 0; i < healthy; i++) cells.push(colors[4 + (i % 2)]);
    } else {
      for (let i = 0; i < 4; i++) cells.push(colors[0]);
      for (let i = 0; i < 15; i++) cells.push(colors[1 + (i % 2)]);
      for (let i = 0; i < 48; i++) cells.push(colors[2 + (i % 2)]);
      for (let i = 0; i < 133; i++) cells.push(colors[4 + (i % 2)]);
    }
    while (cells.length < total) cells.push(colors[5]);
    cells.slice(0, total).forEach((c) => {
      const el = document.createElement("div");
      el.className = "crm-health-cell";
      el.style.background = c;
      grid.appendChild(el);
    });
  }, [health]);

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
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <div className="crm-period-bar">
              <button>Hoje</button>
              <button>7d</button>
              <button className="active">30d</button>
              <button>Trimestre</button>
              <button>Ano</button>
            </div>
            <div style={{ fontSize: 12, color: "var(--crm-ink-4)" }}>
              Comparado a <strong className="crm-strong">período anterior</strong>
            </div>
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
            sparkD="M0,22 L8,20 L16,21 L24,18 L32,16 L40,17 L48,14 L56,12 L64,11 L72,9 L80,8 L88,6 L100,5"
          />
          <Kpi
            label="Assinantes"
            value={kpis?.totalSubscribers ?? "—"}
            unit="ativos"
            deltaText={`+${kpis?.newSubscribers30d ?? 0} em 30d`}
            sparkD="M0,24 L10,23 L22,21 L34,20 L46,17 L58,15 L72,12 L84,9 L100,7"
          />
          <Kpi
            label="Churn rate"
            value={kpis ? kpis.churnRate.toFixed(1) : "—"}
            unit="%"
            deltaText={`${kpis?.churnedLast30d ?? 0} em 30d`}
            deltaSign={kpis && kpis.churnRate > 5 ? "neg" : "pos"}
            sparkD="M0,8 L12,9 L24,11 L36,10 L48,13 L60,15 L72,17 L84,19 L100,22"
          />
          <Kpi
            label="Em risco"
            value={health?.risk ?? "—"}
            unit="alunos"
            deltaText="probabilidade ≥ 40%"
            accent="warn"
            sparkD="M0,18 L12,17 L24,15 L36,16 L48,12 L60,10 L72,8 L84,6 L100,4"
          />
          <Kpi
            label="Em saúde"
            value={health?.healthy ?? "—"}
            unit="alunos"
            deltaText="score ≥ 70"
            sparkD="M0,20 L8,18 L16,22 L24,15 L32,17 L40,12 L48,16 L56,10 L64,13 L72,7 L80,11 L88,5 L100,9"
          />
          <Kpi
            label="Inativos"
            value={health?.inactive ?? "—"}
            unit="alunos"
            deltaText="sem login 30d"
            sparkD="M0,22 L12,20 L24,21 L36,18 L48,16 L60,14 L72,11 L84,8 L100,5"
          />
        </section>

        {/* INSIGHT */}
        <section className="crm-insight">
          <div className="ico"><Sparkles size={13} /></div>
          <div>
            <div className="head">
              A campanha <strong>"Residência R+ · Cardio"</strong> já é responsável por 41% dos signups do mês.
            </div>
            <div className="body">
              UTM <code>google_ads / cpc / residencia-cardio-mar26</code> trouxe <strong>312 leads</strong>, com score médio
              {" "}<strong>62</strong> — 11 pontos acima da média geral. Recomenda-se aumentar budget em 30% e duplicar criativo
              para R+ Pediatria.
            </div>
          </div>
        </section>

        {/* FUNNEL + HEALTH */}
        <section className="crm-g-23">
          <div className="crm-card">
            <div className="crm-card-head">
              <div>
                <div className="crm-card-title"><Filter size={14} strokeWidth={1.8} /> Funil de conversão</div>
                <div className="crm-card-sub">Visitantes → Assinantes · 30 dias · PreceptorMED</div>
              </div>
              <div className="crm-card-side">
                <div className="crm-period-bar" style={{ fontSize: 11 }}>
                  <button className="active">PreceptorMED</button>
                  <button>PreceptorIA</button>
                  <button>Rev</button>
                </div>
              </div>
            </div>
            <div className="crm-card-pad">
              <div className="crm-funnel">
                <FunnelRow name="Visitantes" sub="site + landing" pct={100} num="28 412" pctText="100%" />
                <FunnelRow name="Signups" sub="conta criada" pct={34} num="9 661" pctText="34,0%" />
                <FunnelRow name="Trial ativo" sub="acesso liberado" pct={18} num="5 116" pctText="53,0%" />
                <FunnelRow name="Engajados" sub="≥ 3 sessões" pct={11} num="3 124" pctText="61,1%" />
                <FunnelRow name="Assinantes" sub="plano pago ativo" pct={2.8} num="784" pctText="25,1%" />
                <FunnelRow name="Churn" sub="cancelados nos 30d" pct={0.11} num="31" pctText="3,8%" churn />
              </div>
              <hr className="crm-rule" style={{ margin: "14px 0 12px" }} />
              <p className="crm-foot">
                <strong>Gargalo do mês:</strong> trial → engajado caiu 7 p.p. desde fevereiro. Hipótese: onboarding muito longo. Teste A/B em curso (variant <code>fast-onboard-2</code>).
              </p>
            </div>
          </div>

          <div className="crm-card">
            <div className="crm-card-head">
              <div>
                <div className="crm-card-title"><LayoutGrid size={14} strokeWidth={1.8} /> Saúde dos alunos</div>
                <div className="crm-card-sub">Score 0–100 por engajamento · 784 assinantes</div>
              </div>
              <div className="crm-card-side"><a className="crm-btn crm-btn-link">Ver mapa →</a></div>
            </div>
            <div className="crm-card-pad">
              <div ref={heatmapRef} className="crm-health-grid" />
              <div className="crm-health-stats">
                <div className="crm-health-stat"><div className="lbl">Saudável</div><div className="val" style={{ color: "var(--crm-pos)" }}>521</div></div>
                <div className="crm-health-stat"><div className="lbl">Atento</div><div className="val" style={{ color: "var(--crm-gold-deep)" }}>189</div></div>
                <div className="crm-health-stat"><div className="lbl">Em risco</div><div className="val" style={{ color: "var(--crm-neg)" }}>57</div></div>
                <div className="crm-health-stat"><div className="lbl">Inativo</div><div className="val" style={{ color: "var(--crm-ink-4)" }}>17</div></div>
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
                <div className="crm-card-sub">17 usuários acima de 40% · próximos 14 dias</div>
              </div>
              <div className="crm-card-side"><a className="crm-btn crm-btn-link">Ver todos →</a></div>
            </div>
            <table className="crm-tbl">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Plano</th>
                  <th style={{ textAlign: "right" }}>Probabilidade</th>
                  <th>Sinal principal</th>
                  <th>Última sessão</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(risks?.data ?? []).slice(0, 5).map((r: any) => (
                  <ChurnRow
                    key={r.id ?? r.lead_id ?? r.email}
                    name={r.name ?? r.email ?? "—"}
                    email={r.email ?? ""}
                    plano={r.plan_type ?? "—"}
                    planoTag={r.plan_type === "annual" ? "green" : r.plan_type === "biannual" ? "gold" : "gray"}
                    prob={Math.round((r.churn_probability ?? r.probability ?? 0) * 100)}
                    sinal={r.signal ?? r.reason ?? "Engajamento baixo"}
                    ultima={r.last_active_at ? `há ${Math.floor((Date.now() - new Date(r.last_active_at).getTime()) / 86400000)} dias` : "—"}
                    warn={(r.churn_probability ?? 0) < 0.7}
                  />
                ))}
                {(!risks || risks.data?.length === 0) && (
                  <tr>
                    <td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
                      Sem alunos em risco crítico no momento.
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
                <div className="crm-card-sub">312 disparos hoje · 99,2% delivery</div>
              </div>
              <div className="crm-card-side"><a className="crm-btn crm-btn-link">Logs →</a></div>
            </div>
            <div className="crm-automation-list">
              {(automations?.data ?? []).map((a: any) => {
                const when = a.created_at ? new Date(a.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—";
                const type = a.channel === "email" ? "email" : a.channel === "push" ? "push" : a.severity === "warn" ? "warn" : "email";
                return (
                  <AutomationRow
                    key={a.id}
                    type={type as "email" | "push" | "warn"}
                    title={a.name ?? a.title ?? "Automação"}
                    meta={`${a.recipients ?? a.count ?? 0} envios · ${a.status ?? "ok"}`}
                    when={when}
                  />
                );
              })}
              {(!automations || automations.data?.length === 0) && (
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

function ChurnRow({ name, email, plano, planoTag, prob, sinal, ultima, warn }: {
  name: string; email: string; plano: string; planoTag: "green" | "gold" | "gray"; prob: number; sinal: string; ultima: string; warn?: boolean;
}) {
  const color = warn ? "var(--crm-gold-deep)" : "var(--crm-neg)";
  return (
    <tr>
      <td><div className="lead-name">{name}</div><div className="lead-email">{email}</div></td>
      <td><span className={`crm-tag crm-tag-${planoTag}`}><span className="crm-tag-dot" />{plano}</span></td>
      <td className="num"><span style={{ color, fontWeight: 700 }}>{prob}%</span></td>
      <td className="muted">{sinal}</td>
      <td className="muted">{ultima}</td>
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
