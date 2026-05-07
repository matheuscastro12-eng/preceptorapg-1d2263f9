import { useState } from "react";
import { Link } from "react-router-dom";
import CrmShellV3, { Kpi, PageHero, PeriodBar, CardHead, EmptyState } from "@/components/crm/v3/CrmShellV3";
import {
  Plus, Download, Heart, AlertTriangle, BarChart3, Mail, Users, MessageSquare,
  Filter, Search, Zap, TrendingUp, Activity, ArrowRight, Edit3, Send, Eye,
} from "lucide-react";

/* =========================================================
   HEALTH — Saúde dos alunos
   ========================================================= */
export function HealthV3() {
  return (
    <CrmShellV3 mode="marketing" crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "Saúde dos alunos" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Marketing · Health Score"
          title={<>Saúde <em>dos 784 alunos</em></>}
          sub="Score 0-100 calculado a partir de engajamento (sessões, questões, sequência), última atividade e progressão por fase. Atualizado a cada 4h."
          actions={<><PeriodBar options={["7d", "30d", "90d"]} active="30d" /><button className="crm-btn crm-btn-ghost"><Download size={13} /> Exportar</button></>}
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Score médio" value="62" delta="↑ 4" deltaSign="pos" deltaText="vs período anterior" accent="mrr"
            sparkD="M0,18 L12,17 L24,15 L36,14 L48,12 L60,11 L72,9 L84,7 L100,5" />
          <Kpi label="Saudáveis" value="521" unit="/784" delta="66%" deltaSign="pos" deltaText="score ≥ 70" />
          <Kpi label="Atentos" value="189" delta="24%" deltaSign="flat" deltaText="score 40-69" accent="warn" />
          <Kpi label="Em risco" value="74" delta="↑ 12" deltaSign="neg" deltaText="score < 40" accent="neg" />
        </section>

        <section className="crm-card">
          <CardHead title="Distribuição de score" sub="cada quadrado = 1 aluno · ordenado por score ascendente · cor = faixa de saúde" />
          <div className="crm-card-pad">
            <HealthHeatmap />
          </div>
        </section>

        <section className="crm-card">
          <CardHead title="Alunos em risco que merecem atenção" sub="40 com queda de engajamento ≥ 30% nas últimas 2 semanas" side={<a className="crm-btn crm-btn-link">Ver todos →</a>} />
          <table className="crm-tbl">
            <thead><tr><th>Aluno</th><th>Plano</th><th>Score</th><th>Sinal</th><th>Última sessão</th><th></th></tr></thead>
            <tbody>
              {[
                { n: "Bruna Cosendey", p: "Anual", s: 18, sig: "Sem questões há 19d", u: "há 19 dias" },
                { n: "Pedro Lacerda", p: "Mensal", s: 22, sig: "Cartão recusado 2x", u: "há 8 dias" },
                { n: "Thiago Sá", p: "Bianual", s: 31, sig: "Suporte aberto há 5d", u: "há 11 dias" },
                { n: "Marcela Tinoco", p: "Anual", s: 35, sig: "NPS 4 · feedback negativo", u: "há 6 dias" },
                { n: "Felipe Brandão", p: "Mensal", s: 38, sig: "Engajamento ↓ 4 sem", u: "há 13 dias" },
              ].map((r) => (
                <tr key={r.n}>
                  <td><div className="lead-name">{r.n}</div></td>
                  <td><span className="crm-tag crm-tag-gray"><span className="crm-tag-dot" />{r.p}</span></td>
                  <td><div className="crm-score"><div className="crm-score-bar" style={{ ["--score" as never]: `${r.s}%` }} /><span className="crm-score-num">{r.s}</span></div></td>
                  <td className="muted">{r.sig}</td>
                  <td className="muted">{r.u}</td>
                  <td><button className="crm-btn crm-btn-ghost">Acionar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </CrmShellV3>
  );
}

function HealthHeatmap() {
  const colors = ["#EFE8D8", "#E0D5A8", "#C8C896", "#94B387", "#5C9067", "#1B5E3B"];
  const cells: string[] = [];
  for (let i = 0; i < 17; i++) cells.push(colors[0]);
  for (let i = 0; i < 57; i++) cells.push(colors[1 + (i % 2)]);
  for (let i = 0; i < 189; i++) cells.push(colors[3 + (i % 2)]);
  for (let i = 0; i < 521; i++) cells.push(colors[5]);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(40, 1fr)", gap: 2 }}>
      {cells.map((c, i) => <div key={i} style={{ aspectRatio: "1", borderRadius: 2, background: c }} />)}
    </div>
  );
}

/* =========================================================
   CHURN — Risco de churn
   ========================================================= */
export function ChurnV3() {
  return (
    <CrmShellV3 mode="marketing" crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "Risco de churn" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Marketing · Churn Prediction"
          title={<>17 alunos <em>em risco real</em> de cancelar</>}
          sub="Modelo preditivo treinado com sinais de cancelamento históricos. Probabilidade de cancelamento nos próximos 14 dias."
          actions={<><PeriodBar options={["7d", "14d", "30d"]} active="14d" /><button className="crm-btn crm-btn-primary"><Send size={13} /> Acionar todos</button></>}
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Em risco crítico" value="5" delta="≥ 70%" deltaSign="neg" accent="neg" />
          <Kpi label="Em risco moderado" value="12" delta="40-69%" deltaSign="flat" accent="warn" />
          <Kpi label="Win-back atual" value="9" delta="29%" deltaSign="pos" deltaText="taxa recovery" accent="mrr" />
          <Kpi label="MRR ameaçado" value="R$ 1 280" delta="se todos cancelarem" deltaSign="neg" />
        </section>

        <section className="crm-card">
          <CardHead title="Lista priorizada" sub="ordenada por probabilidade · clicar abre playbook automatizado" />
          <table className="crm-tbl">
            <thead><tr><th>Aluno</th><th>Plano</th><th style={{ textAlign: "right" }}>Prob.</th><th>Sinal principal</th><th>Última atividade</th><th>Plano sugerido</th><th></th></tr></thead>
            <tbody>
              {[
                { n: "Bruna Cosendey", e: "bruna.c@gmail.com", p: "Anual", t: "green", pr: 81, s: "Acessos ↓ 86% · 0 questões", u: "há 19 dias", pb: "winback-A · email + wpp" },
                { n: "Pedro H. Lacerda", e: "pedrolacerda@hotmail.com", p: "Mensal", t: "gray", pr: 74, s: "Cartão recusado · 2x", u: "há 8 dias", pb: "billing-rescue" },
                { n: "Thiago Carvalho Sá", e: "thiago@medusp.br", p: "Bianual", t: "gold", pr: 68, s: "Suporte aberto há 5d", u: "há 11 dias", pb: "support-priority" },
                { n: "Marcela Tinoco", e: "marcela@unifesp.edu.br", p: "Anual", t: "green", pr: 61, s: "NPS 4 · feedback negativo", u: "há 6 dias", pb: "founder-call" },
                { n: "Felipe Brandão", e: "felipe@residencia.org", p: "Mensal", t: "gray", pr: 52, s: "Engajamento ↓ 4 sem.", u: "há 13 dias", pb: "winback-A" },
                { n: "Camila Andrade", e: "camila@gmail.com", p: "Mensal", t: "gray", pr: 47, s: "Cancelou push", u: "há 5 dias", pb: "winback-B" },
                { n: "Renato Nóbrega", e: "renato.n@usp.br", p: "Anual", t: "green", pr: 43, s: "Sem questões 21d", u: "há 21 dias", pb: "engagement-pulse" },
              ].map((r) => (
                <tr key={r.n}>
                  <td><div className="lead-name">{r.n}</div><div className="lead-email">{r.e}</div></td>
                  <td><span className={`crm-tag crm-tag-${r.t}`}><span className="crm-tag-dot" />{r.p}</span></td>
                  <td className="num"><span style={{ color: r.pr >= 70 ? "var(--crm-neg)" : r.pr >= 50 ? "var(--crm-gold-deep)" : "var(--crm-ink)", fontWeight: 700 }}>{r.pr}%</span></td>
                  <td className="muted">{r.s}</td>
                  <td className="muted">{r.u}</td>
                  <td><code style={{ fontSize: 11, background: "var(--crm-surface-2)", padding: "2px 6px", borderRadius: 3, color: "var(--crm-green-deep)" }}>{r.pb}</code></td>
                  <td><button className="crm-btn crm-btn-primary"><Send size={11} />Acionar</button></td>
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
   COHORTS — Coortes de retenção
   ========================================================= */
export function CohortsV3() {
  return (
    <CrmShellV3 mode="marketing" crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "Coortes" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Marketing · Retention"
          title={<>Coortes <em>de retenção</em></>}
          sub="% de assinantes ativos por mês de cadastro. Cada linha é uma coorte; cada coluna é o tempo desde o cadastro."
          actions={<PeriodBar options={["6m", "12m", "YTD"]} active="6m" />}
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Retenção M1" value="95" unit="%" delta="↑ 2 pp" deltaSign="pos" accent="mrr" />
          <Kpi label="Retenção M3" value="88" unit="%" delta="↑ 7 pp" deltaSign="pos" deltaText="vs out/25" />
          <Kpi label="Retenção M6" value="74" unit="%" delta="−" deltaSign="flat" />
          <Kpi label="Coortes ativas" value="7" deltaText="out/25 → abr/26" />
        </section>

        <section className="crm-card">
          <CardHead title="Cohort grid" sub="leitura: out/25 retém 76% no M5; coortes recentes melhoraram para 88-91% no M3" />
          <div className="crm-card-pad">
            <CohortGrid />
          </div>
        </section>

        <section className="crm-card">
          <CardHead title="Insights de retenção" sub="análises automáticas sobre os pontos de queda" />
          <div className="crm-card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { tit: "Coortes pós-jan/26 retêm 7pp mais no M3", body: "Onboarding novo (fast-onboard-2) está colando. Mantenha em rollout 100%." },
              { tit: "Drop crítico no M2 → M3", body: "Perde-se em média 5% entre M2 e M3 — período crítico. Sugestão: push educacional + revisão de progresso." },
              { tit: "Coorte dez/25 abaixo da média", body: "Cohort de 124 alunos com retenção 86% em M3 (vs 88% jan-mar). Investigar campanhas daquele mês." },
            ].map((it, i) => (
              <div key={i} className="crm-insight">
                <div className="ico"><Activity size={13} /></div>
                <div>
                  <div className="head">{it.tit}</div>
                  <div className="body">{it.body}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </CrmShellV3>
  );
}

const COHORTS = [
  { name: "Out/25 · 92", values: [100, 94, 88, 82, 79, 76, 74] },
  { name: "Nov/25 · 108", values: [100, 93, 87, 81, 77, 73, null] },
  { name: "Dez/25 · 124", values: [100, 95, 90, 86, 82, null, null] },
  { name: "Jan/26 · 156", values: [100, 96, 91, 88, null, null, null] },
  { name: "Fev/26 · 178", values: [100, 95, 90, null, null, null, null] },
  { name: "Mar/26 · 192", values: [100, 97, null, null, null, null, null] },
  { name: "Abr/26 · 210", values: [100, null, null, null, null, null, null] },
];
function cohortColor(v: number | null): { bg: string; color: string } {
  if (v === null) return { bg: "transparent", color: "var(--crm-ink-5)" };
  if (v >= 100) return { bg: "#0F4128", color: "#fff" };
  if (v >= 90) return { bg: "#1B5E3B", color: "#fff" };
  if (v >= 85) return { bg: "#2A7A4D", color: "#fff" };
  if (v >= 80) return { bg: "#3F8B5C", color: "#fff" };
  if (v >= 75) return { bg: "#5BA374", color: "#fff" };
  return { bg: "#86B996", color: "#fff" };
}
function CohortGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px repeat(7, 1fr)", gap: 4, fontFamily: "var(--crm-mono)", fontSize: 11 }}>
      <div style={{ color: "var(--crm-ink-4)", fontSize: 10.5, padding: "6px 8px", fontWeight: 600, fontFamily: "var(--crm-sans)" }}>Coorte</div>
      {["M0", "M1", "M2", "M3", "M4", "M5", "M6"].map((m) => (
        <div key={m} style={{ color: "var(--crm-ink-4)", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 10.5, padding: "6px 8px", textAlign: "center", fontWeight: 600 }}>{m}</div>
      ))}
      {COHORTS.map((row) => (
        <>
          <div key={row.name} style={{ color: "var(--crm-ink-3)", fontFamily: "var(--crm-sans)", padding: "8px 8px", fontSize: 11.5 }}>{row.name}</div>
          {row.values.map((v, i) => {
            const { bg, color } = cohortColor(v);
            return (
              <div key={`${row.name}-${i}`} style={{
                padding: "10px 6px", textAlign: "center", borderRadius: 4,
                background: bg, color, fontFeatureSettings: '"tnum"', fontWeight: 600,
              }}>
                {v ?? "—"}
              </div>
            );
          })}
        </>
      ))}
    </div>
  );
}

/* =========================================================
   AUTOMATIONS — Listagem
   ========================================================= */
export function AutomationsV3() {
  return (
    <CrmShellV3 mode="marketing" crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "Automações" }]}
      topbarTools={<><button className="crm-btn crm-btn-ghost"><Download size={13} /> Logs</button><button className="crm-btn crm-btn-primary"><Plus size={13} /> Nova automação</button></>}
    >
      <main className="crm-page">
        <PageHero
          eyebrow="Marketing · Automations"
          title={<>312 disparos <em>hoje</em></>}
          sub="Playbooks de email, push e WhatsApp acionados por gatilhos do funil, score, billing ou comportamento."
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Disparos hoje" value="312" delta="+ 28%" deltaSign="pos" deltaText="vs média 7d" accent="mrr" />
          <Kpi label="Delivery rate" value="99,2" unit="%" delta="↑ 0,3pp" deltaSign="pos" />
          <Kpi label="Open rate" value="48" unit="%" delta="↑ 5pp" deltaSign="pos" deltaText="email + push" />
          <Kpi label="Receita atribuída" value="R$ 4 280" delta="30d" deltaText="conversões pós-trigger" accent="warn" />
        </section>

        <section className="crm-card">
          <CardHead title="Playbooks ativos" sub="14 playbooks · 312 disparos hoje · taxa de resposta média 31%" />
          <table className="crm-tbl">
            <thead><tr><th>Playbook</th><th>Gatilho</th><th>Canal</th><th>Disparos 30d</th><th>Conversão</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {[
                { n: "Trial expirando em 3 dias", t: "trial.dias_restantes ≤ 3", c: "email", d: 2410, conv: "23%", st: "green", lb: "Ativa" },
                { n: "Boas-vindas signup", t: "user.created", c: "email", d: 3820, conv: "62%", st: "green", lb: "Ativa" },
                { n: "Resgate de leads quentes", t: "lead.score ≥ 70 + sem ação 24h", c: "wpp", d: 1240, conv: "31%", st: "green", lb: "Ativa" },
                { n: "Push novas videoaulas", t: "conteudo.publicado", c: "push", d: 14820, conv: "8,1%", st: "green", lb: "Ativa" },
                { n: "Alerta de churn ≥ 70%", t: "churn.prob ≥ 0.7", c: "playbook", d: 47, conv: "29%", st: "warn", lb: "Atenção" },
                { n: "Cobrança amistosa cartão", t: "billing.failed", c: "wpp", d: 312, conv: "64%", st: "green", lb: "Ativa" },
                { n: "Re-engajamento sem questões 7d", t: "user.idle ≥ 7d", c: "email", d: 480, conv: "12%", st: "warn", lb: "Atenção" },
                { n: "Pedido de NPS · pós-trial", t: "trial.completed", c: "email", d: 280, conv: "44%", st: "green", lb: "Ativa" },
                { n: "Campanha bianual", t: "manual", c: "email", d: 0, conv: "—", st: "gray", lb: "Pausada" },
              ].map((r) => (
                <tr key={r.n}>
                  <td><div className="lead-name">{r.n}</div></td>
                  <td><code style={{ fontSize: 11, color: "var(--crm-ink-3)", fontFamily: "var(--crm-mono)" }}>{r.t}</code></td>
                  <td><span className={`crm-tag crm-tag-${r.c === "email" ? "blue" : r.c === "push" ? "gold" : r.c === "wpp" ? "green" : "gray"}`}><span className="crm-tag-dot" />{r.c}</span></td>
                  <td className="num">{r.d.toLocaleString("pt-BR")}</td>
                  <td className="num">{r.conv}</td>
                  <td><span className={`crm-tag crm-tag-${r.st}`}><span className="crm-tag-dot" />{r.lb}</span></td>
                  <td><button className="crm-btn-icon"><Edit3 /></button></td>
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
   EMAIL TEMPLATES
   ========================================================= */
export function EmailTemplatesV3() {
  const [selected, setSelected] = useState("trial-3d");
  const TEMPLATES = [
    { id: "trial-3d", name: "Trial expirando — 3 dias", category: "Lifecycle", lastEdit: "há 2 dias", uses: "2 410", open: "41%" },
    { id: "welcome", name: "Boas-vindas signup", category: "Onboarding", lastEdit: "há 1 sem", uses: "3 820", open: "62%" },
    { id: "winback-A", name: "Win-back A · perdeu engajamento", category: "Retention", lastEdit: "há 3 dias", uses: "480", open: "28%" },
    { id: "billing-rescue", name: "Cartão recusado · cobrança", category: "Billing", lastEdit: "há 5 dias", uses: "312", open: "73%" },
    { id: "nps", name: "Pedido de NPS · pós-trial", category: "Feedback", lastEdit: "há 12 dias", uses: "280", open: "44%" },
    { id: "founder-call", name: "Convite · call com founder", category: "Retention", lastEdit: "há 1 dia", uses: "12", open: "92%" },
  ];

  return (
    <CrmShellV3 mode="marketing" crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "E-mail templates" }]}
      topbarTools={<><button className="crm-btn crm-btn-ghost"><Eye size={13} /> Preview</button><button className="crm-btn crm-btn-primary"><Plus size={13} /> Novo template</button></>}
    >
      <main className="crm-page">
        <PageHero
          eyebrow="Marketing · Email Library"
          title={<>14 templates <em>em produção</em></>}
          sub="Biblioteca curada de e-mails transacionais e de marketing. Cada template tem variáveis dinâmicas e A/B test opcional."
        />

        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div className="crm-card">
            <CardHead title="Lista de templates" sub="14 ativos" />
            <div>
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => setSelected(t.id)} style={{
                  width: "100%", textAlign: "left", border: "none",
                  padding: "14px 18px",
                  borderBottom: "1px solid var(--crm-line-soft)",
                  background: selected === t.id ? "var(--crm-green-tint)" : "var(--crm-surface)",
                  cursor: "pointer", display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontFamily: "var(--crm-sans)", fontSize: 13, fontWeight: 600, color: "var(--crm-ink)" }}>{t.name}</div>
                    <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)", marginTop: 2 }}>
                      {t.category} · editado {t.lastEdit}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="crm-mono" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--crm-ink)" }}>{t.uses}</div>
                    <div style={{ fontSize: 10.5, color: "var(--crm-green-deep)", fontWeight: 600 }}>open {t.open}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="crm-card">
            <CardHead title="Preview" sub={TEMPLATES.find((t) => t.id === selected)?.name} side={<><button className="crm-btn crm-btn-ghost">Histórico</button><button className="crm-btn crm-btn-primary"><Edit3 size={13} /> Editar</button></>} />
            <div style={{ padding: 24, background: "var(--crm-surface-2)", minHeight: 420 }}>
              <div style={{ background: "#fff", border: "1px solid var(--crm-line)", borderRadius: 8, padding: 28, maxWidth: 520, margin: "0 auto" }}>
                <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)", marginBottom: 16 }}>De: PreceptorMED &lt;ola@thepreceptor.com.br&gt;</div>
                <h2 style={{ fontFamily: "var(--crm-sans)", fontSize: 22, fontWeight: 700, color: "var(--crm-ink)", letterSpacing: "-0.02em", margin: "0 0 12px" }}>
                  Seu trial termina em <span style={{ fontFamily: "var(--crm-serif)", fontStyle: "italic", color: "var(--crm-green-deep)", fontWeight: 500 }}>3 dias</span>.
                </h2>
                <p style={{ fontSize: 14, color: "var(--crm-ink-2)", lineHeight: 1.6, margin: "0 0 16px" }}>
                  Olá, <strong>{`{{ user.first_name }}`}</strong> — você resolveu <strong>{`{{ stats.questoes_30d }}`}</strong> questões nos últimos 30 dias.
                  Imagine como seria com acesso ilimitado.
                </p>
                <a style={{ display: "inline-block", background: "var(--crm-green-deep)", color: "#fff", padding: "10px 20px", borderRadius: 7, fontFamily: "var(--crm-sans)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                  Continuar com PreceptorMED →
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   ANALYTICS
   ========================================================= */
export function AnalyticsV3() {
  return (
    <CrmShellV3 mode="marketing" crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "Analytics" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Marketing · Product Analytics"
          title={<>Comportamento <em>do produto</em></>}
          sub="Eventos de produto agregados: páginas visitadas, features usadas, sessões e funil interno."
          actions={<><PeriodBar options={["7d", "30d", "90d"]} active="30d" /></>}
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          <Kpi label="DAU" value="1 280" delta="↑ 12%" deltaSign="pos" accent="mrr"
            sparkD="M0,22 L12,18 L24,16 L36,15 L48,12 L60,10 L72,9 L84,8 L100,6" />
          <Kpi label="WAU" value="3 218" delta="↑ 8%" deltaSign="pos"
            sparkD="M0,18 L12,17 L24,15 L36,14 L48,13 L60,12 L72,10 L84,9 L100,7" />
          <Kpi label="MAU" value="6 412" delta="↑ 4%" deltaSign="pos"
            sparkD="M0,15 L12,14 L24,13 L36,12 L48,11 L60,10 L72,9 L84,8 L100,7" />
          <Kpi label="Sessão média" value="22 min" delta="+ 2 min" deltaSign="pos" />
          <Kpi label="Stickiness" value="40%" delta="DAU/MAU" deltaSign="pos" deltaText="benchmark > 20%" accent="warn" />
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18 }}>
          <div className="crm-card">
            <CardHead title="Top features" sub="uso por funcionalidade · 30 dias" />
            <table className="crm-tbl">
              <thead><tr><th>Feature</th><th style={{ textAlign: "right" }}>Sessões</th><th style={{ textAlign: "right" }}>Usuários</th><th style={{ textAlign: "right" }}>% MAU</th><th>Δ vs período</th></tr></thead>
              <tbody>
                {[
                  { f: "Simulado de questões", s: 28412, u: 4128, pct: "64%", d: "+ 8%" },
                  { f: "PreceptorBook (drogas)", s: 14820, u: 3812, pct: "59%", d: "+ 24%" },
                  { f: "Resumos de PBL (fechamento)", s: 8240, u: 2410, pct: "38%", d: "+ 4%" },
                  { f: "Flashcards", s: 6128, u: 1820, pct: "28%", d: "+ 6%" },
                  { f: "Casos clínicos", s: 1240, u: 412, pct: "6%", d: "+ 41%" },
                  { f: "Cronograma", s: 980, u: 284, pct: "4%", d: "novo" },
                  { f: "Scribe Clínico", s: 240, u: 47, pct: "0,7%", d: "beta" },
                ].map((r) => (
                  <tr key={r.f}>
                    <td className="lead-name">{r.f}</td>
                    <td className="num">{r.s.toLocaleString("pt-BR")}</td>
                    <td className="num">{r.u.toLocaleString("pt-BR")}</td>
                    <td className="num">{r.pct}</td>
                    <td><span className="crm-delta crm-delta-pos">{r.d}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="crm-card">
            <CardHead title="Funil de ativação" sub="signup → primeiro PBL gerado · 7 dias" />
            <div className="crm-card-pad">
              {[
                { stage: "Signup", count: "9 661", pct: 100 },
                { stage: "Completou onboarding", count: "8 412", pct: 87 },
                { stage: "Resolveu 1 questão", count: "5 117", pct: 53 },
                { stage: "Gerou 1 resumo", count: "2 124", pct: 22 },
                { stage: "Voltou no dia 7", count: "1 480", pct: 15 },
              ].map((s) => (
                <div key={s.stage} style={{ padding: "10px 0", borderBottom: "1px solid var(--crm-line-soft)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{s.stage}</span>
                    <span className="crm-mono" style={{ fontSize: 12, color: "var(--crm-ink-4)" }}>{s.count} · {s.pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "var(--crm-surface-3)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${s.pct}%`, background: "linear-gradient(90deg, var(--crm-green-deep), var(--crm-green))", borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   USERS
   ========================================================= */
export function UsersV3() {
  return (
    <CrmShellV3 mode="marketing" crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "Configurações" }, { label: "Usuários" }]}
      topbarTools={<><button className="crm-btn crm-btn-primary"><Plus size={13} /> Convidar usuário</button></>}
    >
      <main className="crm-page">
        <PageHero
          eyebrow="Sistema · Usuários do CRM"
          title={<>9 pessoas <em>com acesso interno</em></>}
          sub="Controle de acesso por papel: super_admin, admin, editor, viewer. Acessos separados Marketing e Admin."
        />

        <section className="crm-card">
          <CardHead title="Membros do CRM" />
          <table className="crm-tbl">
            <thead><tr><th>Usuário</th><th>Papel</th><th>Acesso</th><th>Último login</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {[
                { u: "Matheus Castro", e: "matheus", r: "super_admin", a: "MKT + ADM", l: "agora", st: "green", lb: "Ativo" },
                { u: "Fernanda Albuquerque", e: "fernanda", r: "admin", a: "MKT + ADM", l: "há 2h", st: "green", lb: "Ativo" },
                { u: "Ricardo Paranhos", e: "ricardo", r: "admin", a: "MKT + ADM", l: "há 1 dia", st: "green", lb: "Ativo" },
                { u: "Júlia Pacheco", e: "julia", r: "editor", a: "MKT", l: "há 3h", st: "green", lb: "Ativo" },
                { u: "Daniel Mendonça", e: "daniel", r: "editor", a: "MKT", l: "há 5h", st: "green", lb: "Ativo" },
                { u: "Camila Nóbrega", e: "camila", r: "editor", a: "MKT", l: "há 1 dia", st: "green", lb: "Ativo" },
                { u: "Letícia Oliveira", e: "leticia", r: "editor", a: "MKT", l: "há 4h", st: "green", lb: "Ativo" },
                { u: "Gabriel Ramalho", e: "gabriel", r: "viewer", a: "MKT", l: "há 2 dias", st: "warn", lb: "Inativo 7d" },
                { u: "Contador externo", e: "contador.ext", r: "viewer", a: "ADM", l: "há 5 dias", st: "warn", lb: "Inativo" },
              ].map((r) => (
                <tr key={r.e}>
                  <td><div className="lead-name">{r.u}</div><div className="lead-email">{r.e}</div></td>
                  <td><span className={`crm-tag crm-tag-${r.r === "super_admin" ? "gold" : r.r === "admin" ? "green" : "gray"}`}><span className="crm-tag-dot" />{r.r}</span></td>
                  <td className="muted"><span className="crm-mono">{r.a}</span></td>
                  <td className="muted">{r.l}</td>
                  <td><span className={`crm-tag crm-tag-${r.st}`}><span className="crm-tag-dot" />{r.lb}</span></td>
                  <td><button className="crm-btn-icon"><Edit3 /></button></td>
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
   SUPORTE
   ========================================================= */
export function SuporteV3() {
  return (
    <CrmShellV3 mode="marketing" crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "Suporte" }]}
      topbarTools={<><button className="crm-btn crm-btn-primary"><Plus size={13} /> Novo ticket</button></>}
    >
      <main className="crm-page">
        <PageHero
          eyebrow="Marketing · Suporte ao aluno"
          title={<>14 tickets <em>abertos</em></>}
          sub="Atendimentos de suporte recebidos por chat, e-mail ou WhatsApp. SLA padrão: 24h primeira resposta."
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Abertos" value="14" delta="↓ 3" deltaSign="pos" accent="mrr" />
          <Kpi label="SLA dentro" value="92" unit="%" delta="↑ 4pp" deltaSign="pos" />
          <Kpi label="Tempo médio resposta" value="3h 12m" delta="↓ 38m" deltaSign="pos" />
          <Kpi label="CSAT" value="4,7" unit="/5" delta="↑ 0,1" deltaSign="pos" accent="warn" />
        </section>

        <section className="crm-card">
          <CardHead title="Tickets ativos" sub="ordenados por urgência" />
          <table className="crm-tbl">
            <thead><tr><th>Ticket</th><th>Aluno</th><th>Categoria</th><th>SLA</th><th>Atribuído</th><th>Aberto</th><th></th></tr></thead>
            <tbody>
              {[
                { id: "#3812", t: "Cartão recusado em renovação", a: "Pedro Lacerda", c: "Billing", sla: "no prazo", at: "Ricardo", op: "há 2h", st: "green" },
                { id: "#3811", t: "Não consigo gerar resumo de PBL", a: "Bruna Cosendey", c: "Bug", sla: "2h restam", at: "Júlia", op: "há 22h", st: "warn" },
                { id: "#3810", t: "PDF de simulado em branco", a: "Thiago Sá", c: "Bug", sla: "ATRASADO 5h", at: "Daniel", op: "há 29h", st: "red" },
                { id: "#3809", t: "Como cancelar plano anual?", a: "Marcela Tinoco", c: "Account", sla: "no prazo", at: "—", op: "há 4h", st: "green" },
                { id: "#3808", t: "Dúvida sobre conteúdo de Cardio", a: "Felipe Brandão", c: "Conteúdo", sla: "no prazo", at: "Letícia", op: "há 1 dia", st: "green" },
                { id: "#3807", t: "App iOS travando ao abrir", a: "Camila Andrade", c: "Bug", sla: "12h restam", at: "Rafael", op: "há 12h", st: "warn" },
              ].map((r) => (
                <tr key={r.id}>
                  <td><div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)" }}>{r.id}</div><div className="lead-name">{r.t}</div></td>
                  <td className="muted">{r.a}</td>
                  <td><span className={`crm-tag crm-tag-${r.c === "Bug" ? "red" : r.c === "Billing" ? "warn" : "gray"}`}><span className="crm-tag-dot" />{r.c}</span></td>
                  <td><span className={`crm-tag crm-tag-${r.st}`}><span className="crm-tag-dot" />{r.sla}</span></td>
                  <td className="muted">{r.at}</td>
                  <td className="muted">{r.op}</td>
                  <td><button className="crm-btn crm-btn-ghost">Abrir</button></td>
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
   LANDING FUNNEL
   ========================================================= */
export function LandingFunnelV3() {
  return (
    <CrmShellV3 mode="marketing" crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "Landing pages" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Marketing · Landing Performance"
          title={<>Performance <em>das landings</em></>}
          sub="Conversão visitor → signup por landing page e fonte. Bounce rate, tempo médio e funis específicos."
          actions={<PeriodBar options={["7d", "30d", "90d"]} active="30d" />}
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Visitantes" value="28 412" delta="+ 3 218" deltaSign="pos" accent="mrr" />
          <Kpi label="Signups" value="9 661" delta="34%" deltaSign="pos" deltaText="conversão geral" />
          <Kpi label="CAC blended" value="R$ 158" delta="↓ R$ 14" deltaSign="pos" />
          <Kpi label="Bounce médio" value="42%" delta="↓ 3pp" deltaSign="pos" accent="warn" />
        </section>

        <section className="crm-card">
          <CardHead title="Top landings · 30 dias" sub="ordenado por conversão visitor → signup" />
          <table className="crm-tbl">
            <thead><tr><th>Landing</th><th style={{ textAlign: "right" }}>Visitantes</th><th style={{ textAlign: "right" }}>Signups</th><th style={{ textAlign: "right" }}>Conv.</th><th style={{ textAlign: "right" }}>CAC</th><th style={{ textAlign: "right" }}>Bounce</th></tr></thead>
            <tbody>
              {[
                { p: "/guia-residencia", v: 3218, s: 721, conv: "22,4%", cac: "R$ 13", b: "31%", hl: true },
                { p: "/residencia-cardio", v: 7412, s: 1467, conv: "19,8%", cac: "R$ 142", b: "38%", hl: true },
                { p: "/residencia-clinica", v: 2814, s: 411, conv: "14,6%", cac: "R$ 165", b: "44%" },
                { p: "/pediatria", v: 1980, s: 222, conv: "11,2%", cac: "R$ 235", b: "48%" },
                { p: "/cirurgia", v: 1240, s: 124, conv: "10,0%", cac: "R$ 198", b: "52%" },
                { p: "/", v: 12988, s: 1091, conv: "8,4%", cac: "R$ 87", b: "38%" },
                { p: "/revalida", v: 680, s: 22, conv: "3,2%", cac: "R$ 387", b: "67%", lo: true },
              ].map((r) => (
                <tr key={r.p}>
                  <td className="lead-name"><code style={{ background: "var(--crm-surface-2)", padding: "2px 6px", borderRadius: 3, fontFamily: "var(--crm-mono)", fontSize: 12 }}>{r.p}</code></td>
                  <td className="num">{r.v.toLocaleString("pt-BR")}</td>
                  <td className="num">{r.s.toLocaleString("pt-BR")}</td>
                  <td className="num"><span style={{ color: r.hl ? "var(--crm-green-deep)" : r.lo ? "var(--crm-neg)" : "var(--crm-ink)", fontWeight: 700 }}>{r.conv}</span></td>
                  <td className="num">{r.cac}</td>
                  <td className="num">{r.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </CrmShellV3>
  );
}
