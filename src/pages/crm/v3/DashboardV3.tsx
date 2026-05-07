import { useEffect, useRef } from "react";
import CrmShellV3, { Kpi } from "@/components/crm/v3/CrmShellV3";
import { Bell, Share2, Plus, Wallet, Users, TrendingDown, AlertTriangle, Zap, Target, Filter, LayoutGrid, Sparkles } from "lucide-react";

export default function DashboardV3() {
  const heatmapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = heatmapRef.current;
    if (!grid) return;
    grid.innerHTML = "";
    const total = 200;
    const inactive = 4, risk = 15, attention = 48, healthy = 133;
    const colors = ["#EFE8D8", "#E0D5A8", "#C8C896", "#94B387", "#5C9067", "#1B5E3B"];
    const cells: string[] = [];
    for (let i = 0; i < inactive; i++) cells.push(colors[0]);
    for (let i = 0; i < risk; i++) cells.push(colors[1 + (i % 2)]);
    for (let i = 0; i < attention; i++) cells.push(colors[2 + (i % 2)]);
    for (let i = 0; i < healthy; i++) cells.push(colors[4 + (i % 2)]);
    while (cells.length < total) cells.push(colors[5]);
    cells.forEach((c) => {
      const el = document.createElement("div");
      el.className = "crm-health-cell";
      el.style.background = c;
      grid.appendChild(el);
    });
  }, []);

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

        {/* KPI */}
        <section className="crm-kpi-row">
          <Kpi
            label="MRR"
            value="R$ 38.412"
            unit="/mês"
            delta="↑ 12,4%"
            deltaSign="pos"
            deltaText="vs período anterior"
            accent="mrr"
            sparkD="M0,22 L8,20 L16,21 L24,18 L32,16 L40,17 L48,14 L56,12 L64,11 L72,9 L80,8 L88,6 L100,5"
          />
          <Kpi
            label="Assinantes"
            value="784"
            unit="/ 1 000"
            delta="+ 38"
            deltaSign="pos"
            deltaText="meta · 78%"
            sparkD="M0,24 L10,23 L22,21 L34,20 L46,17 L58,15 L72,12 L84,9 L100,7"
          />
          <Kpi
            label="Churn rate"
            value="3,8"
            unit="%"
            delta="↓ 0,9 p.p."
            deltaSign="pos"
            deltaText="benchmark < 5%"
            sparkD="M0,8 L12,9 L24,11 L36,10 L48,13 L60,15 L72,17 L84,19 L100,22"
          />
          <Kpi
            label="Em risco"
            value="17"
            unit="alunos"
            delta="↑ 4"
            deltaSign="neg"
            deltaText="≥ 40% prob."
            accent="warn"
            sparkD="M0,18 L12,17 L24,15 L36,16 L48,12 L60,10 L72,8 L84,6 L100,4"
          />
          <Kpi
            label="Automações hoje"
            value="312"
            delta="+ 28%"
            deltaSign="pos"
            deltaText="email · push · whatsapp"
            sparkD="M0,20 L8,18 L16,22 L24,15 L32,17 L40,12 L48,16 L56,10 L64,13 L72,7 L80,11 L88,5 L100,9"
          />
          <Kpi
            label="LTV médio"
            value="R$ 612"
            delta="↑ R$ 41"
            deltaSign="pos"
            deltaText="life-time value"
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
                <ChurnRow name="Bruna Cosendey" email="bruna.cosendey@gmail.com" plano="Anual" planoTag="green" prob={81} sinal="Acessos ↓ 86% · 0 questões" ultima="há 19 dias" />
                <ChurnRow name="Pedro Henrique Lacerda" email="pedrolacerda@hotmail.com" plano="Mensal" planoTag="gray" prob={74} sinal="Cartão recusado · 2x" ultima="há 8 dias" />
                <ChurnRow name="Thiago Carvalho Sá" email="thiago.csa@medusp.br" plano="Bianual" planoTag="gold" prob={68} sinal="Suporte aberto há 5d" ultima="há 11 dias" warn />
                <ChurnRow name="Marcela Tinoco Nunes" email="marcela.tinoco@unifesp.edu.br" plano="Anual" planoTag="green" prob={61} sinal="NPS 4 · feedback negativo" ultima="há 6 dias" warn />
                <ChurnRow name="Felipe Brandão R." email="felipe.brandao@residencia.org" plano="Mensal" planoTag="gray" prob={52} sinal="Engajamento ↓ 4 sem." ultima="há 13 dias" warn />
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
              <AutomationRow type="email" title="Trial expirando em 3 dias" meta="87 e-mails · open 41%" when="14:22" />
              <AutomationRow type="email" title="WhatsApp · resgate de leads quentes" meta="42 envios · score ≥ 70 · resp. 23%" when="13:48" />
              <AutomationRow type="push" title="Push · novas videoaulas Cardio" meta="523 dispositivos · CTR 8,1%" when="12:00" />
              <AutomationRow type="warn" title="Alerta de churn (≥ 70%)" meta="3 alunos · acionou playbook winback-A" when="11:30" />
              <AutomationRow type="email" title="Boas-vindas · novos signups" meta="128 e-mails · open 62%" when="10:00" />
              <AutomationRow type="email" title="WhatsApp · cobrança amistosa" meta="11 envios · resp. 64%" when="09:15" />
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
