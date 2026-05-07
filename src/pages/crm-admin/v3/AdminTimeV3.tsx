import CrmShellV3, { Kpi } from "@/components/crm/v3/CrmShellV3";
import { Plus } from "lucide-react";

const PEOPLE = [
  { initials: "MC", color: "var(--crm-gold-deep)", name: "Matheus Castro", role: "Founder · CEO & Eng Lead", meta: "desde set/24 · São Paulo · pro-labore R$ 800", focus: "business plan 2026, fechamento DRE, contratação eng pleno.", health: [1, 1, 1, 1, 0.5], enps: "+8", next: "22 abr · 16h" },
  { initials: "FA", color: "var(--crm-gold-deep)", name: "Fernanda Albuquerque", role: "Founder · Head Conteúdo", meta: "desde set/24 · Rio de Janeiro · pro-labore R$ 800", focus: "reescrita banco Cardio (3 200 questões) + curadoria R+ Pediatria.", health: [1, 1, 1, 1, 1], enps: "+10", next: "19 abr · 11h" },
  { initials: "RP", color: "var(--crm-gold-deep)", name: "Ricardo Paranhos", role: "Founder · Marketing & Ops", meta: "desde set/24 · São Paulo · pro-labore R$ 400", focus: "A/B testes landing, programa de indicação bianual, pausa de revalida-abr.", health: [1, 1, 1, 0.5, 0], enps: "+6", next: "21 abr · 09h" },
  { initials: "JP", color: "var(--crm-green-deep)", name: "Júlia Pacheco", role: "Eng Sênior · Frontend", meta: "desde fev/25 · CLT · R$ 14 200", focus: "nova UI do simulado, refatoração do banco de questões.", health: [1, 1, 1, 1, 1], enps: "+10", prs: "28" },
  { initials: "DM", color: "var(--crm-green-deep)", name: "Daniel Mendonça", role: "Eng Pleno · Backend", meta: "desde abr/25 · CLT · R$ 11 800", focus: "motor de score de leads (ML) + integração Stripe.", health: [1, 1, 1, 1, 0.5], enps: "+7", prs: "22" },
  { initials: "CN", color: "var(--crm-green-deep)", name: "Camila Nóbrega", role: "Eng Pleno · Fullstack", meta: "desde jul/25 · CLT · R$ 11 200", focus: "dashboard PreceptorIA + API pública de questões.", health: [1, 1, 1, 1, 1], enps: "+9", prs: "19" },
  { initials: "RT", color: "var(--crm-green-deep)", name: "Rafael Teixeira", role: "Eng Júnior · Mobile", meta: "desde jan/26 · CLT · R$ 6 800", focus: "primeira release do app iOS · review semanal com Júlia.", health: [1, 1, 1, 0.5, 0], enps: "+5", prs: "11" },
  { initials: "LO", color: "var(--crm-green-deep)", name: "Letícia Oliveira", role: "Editora médica · Conteúdo", meta: "desde nov/24 · CLT · R$ 7 400", focus: "revisão de 240 questões Pediatria + roteiros videoaulas.", health: [1, 1, 1, 1, 0.5], enps: "+8", questoes: "320" },
  { initials: "GR", color: "var(--crm-green-deep)", name: "Gabriel Ramalho", role: "Editor médico · Conteúdo", meta: "desde ago/25 · PJ · R$ 6 200", focus: "banco de simulados Cirurgia · auditoria de gabaritos.", health: [1, 1, 1, 1, 1], enps: "+9", questoes: "280" },
];

const ONES = [
  { date: "19 abr", time: "11h", with: "Fernanda Albuquerque · Founder", topic: "Definir cronograma de reescrita Cardio até jun. Validar contratação de mais um editor médico.", status: "green", label: "Pauta pronta" },
  { date: "21 abr", time: "09h", with: "Ricardo Paranhos · Founder", topic: "Decisão sobre pausar revalida-abr e realocar verba para indicação bianual.", status: "warn", label: "Sem pauta" },
  { date: "22 abr", time: "14h", with: "Júlia Pacheco · Eng Sênior", topic: "Carreira: caminho para tech lead até jul. Próximo passo do PDI.", status: "green", label: "Pauta pronta" },
  { date: "22 abr", time: "16h", with: "Daniel Mendonça · Eng Pleno", topic: "Fadiga aparente em PRs longos. Conversar sobre carga e split com Camila.", status: "red", label: "Atenção" },
  { date: "24 abr", time: "10h", with: "Rafael Teixeira · Eng Júnior", topic: "Onboarding 90 dias · review do escopo do app iOS · mentoria com Júlia.", status: "green", label: "Pauta pronta" },
];

const PDIS = [
  { name: "Júlia Pacheco", role: "→ Tech Lead", pct: 78, done: 3, total: 4, goals: [{ done: true, txt: "Liderar squad de 2" }, { done: true, txt: "Mentorar Rafael" }, { done: true, txt: "Apresentar arquitetura" }, { done: false, txt: "Definir roadmap mobile" }] },
  { name: "Daniel Mendonça", role: "→ Eng Sênior", pct: 54, done: 2, total: 4, goals: [{ done: true, txt: "Owner do motor de score" }, { done: true, txt: "Talk interno · Stripe" }, { done: false, txt: "Refatorar pipeline ETL" }, { done: false, txt: "Mentorar 1 júnior" }] },
  { name: "Camila Nóbrega", role: "→ Eng Sênior", pct: 67, done: 2, total: 3, goals: [{ done: true, txt: "Lançar API pública" }, { done: true, txt: "Documentação de specs" }, { done: false, txt: "Liderar squad PreceptorIA" }] },
  { name: "Rafael Teixeira", role: "→ Eng Pleno (Q4)", pct: 32, done: 1, total: 5, goals: [{ done: true, txt: "Onboarding completo" }, { done: false, txt: "Primeira release iOS" }, { done: false, txt: "2 PRs grandes / mês" }] },
];

const PIPELINE = [
  { stage: "Sourcing", count: 42, cards: [
    { name: "Mariana Lopes", role: "eng pleno · backend", tags: ["linkedin", "9y exp"] },
    { name: "Rafael Cunha", role: "eng pleno · backend", tags: ["indicação", "go/ts"] },
    { name: "Bárbara Soares", role: "editor médico", tags: ["médica", "unifesp"] },
    { name: "+ 39 candidatos", role: "aguardando triagem" },
  ]},
  { stage: "Triagem", count: 18, cards: [
    { name: "Lucas Andrade", role: "eng pleno · backend", tags: ["⌘ feedback ok"] },
    { name: "Patrícia Verçosa", role: "eng pleno · backend", tags: ["★ alta prioridade", "ex-iFood"], hot: true },
    { name: "Tomás Rebelo", role: "eng júnior · mobile", tags: ["2y exp"] },
    { name: "+ 14 candidatos" },
  ]},
  { stage: "Tech / Case", count: 17, cards: [
    { name: "Patrícia Verçosa", role: "eng pleno · backend", tags: ["case 21 abr", "★ favorita"], hot: true },
    { name: "Renan Tavares", role: "eng pleno · backend", tags: ["case 23 abr"] },
    { name: "Sofia Carvalho", role: "eng júnior · mobile", tags: ["case 24 abr"] },
  ]},
  { stage: "Cultural", count: 8, cards: [
    { name: "Patrícia Verçosa", role: "eng pleno · backend", tags: ["3 founders ok"], hot: true },
    { name: "Henrique Vidal", role: "editor médico", tags: ["2/3 ok"] },
    { name: "Sofia Carvalho", role: "eng júnior · mobile", tags: ["cultural 26 abr"] },
  ]},
  { stage: "Oferta", count: 4, cards: [
    { name: "Patrícia Verçosa", role: "eng pleno · backend", tags: ["R$ 13,5k", "aceita 30 abr?"], hot: true },
    { name: "Bianca Marques", role: "editor médico", tags: ["R$ 7,2k", "negociando"] },
    { name: "João Renato", role: "eng júnior · mobile", tags: ["aceita 28 abr"] },
  ]},
];

export default function AdminTimeV3() {
  return (
    <CrmShellV3
      mode="admin"
      crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Time & People" }]}
      topbarTools={
        <>
          <button className="crm-btn crm-btn-ghost">Org chart</button>
          <button className="crm-btn crm-btn-primary"><Plus size={13} /> Agendar 1:1</button>
        </>
      }
    >
      <main className="crm-page">
        <section className="crm-hero">
          <div>
            <div className="crm-page-eyebrow">Admin · People · Q2/2026</div>
            <h1 className="crm-page-title">Time <em>& saúde organizacional</em></h1>
            <p className="crm-page-sub">9 pessoas · 3 founders · 3 vagas em pipeline. Cada card mostra contribuição mensal, foco da quinzena e próximo 1:1.</p>
          </div>
          <div className="crm-row">
            <div className="crm-period-bar">
              <button>Q1</button>
              <button className="active">Q2</button>
              <button>YTD</button>
            </div>
          </div>
        </section>

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Headcount" value="9" unit="pessoas" delta="+ 1" deltaSign="pos" deltaText="3 founders · 6 FTE" accent="mrr" />
          <Kpi label="Custo / FTE / mês" value="R$ 8 271" delta="flat" deltaSign="flat" deltaText="incluindo encargos" />
          <Kpi label="eNPS · Q2" value="+62" delta="↑ 8" deltaSign="pos" deltaText="9 respostas · 100%" />
          <Kpi label="Vagas abertas" value="3" delta="38d média" deltaSign="neg" deltaText="2 eng · 1 conteúdo" accent="warn" />
        </section>

        {/* People Grid */}
        <section className="crm-card" style={{ overflow: "hidden" }}>
          <div className="crm-card-head">
            <div>
              <div className="crm-card-title">Equipe ativa</div>
              <div className="crm-card-sub">Saúde, foco da quinzena e contribuição.</div>
            </div>
            <div className="crm-card-side"><a className="crm-btn crm-btn-link">Histórico salarial →</a></div>
          </div>
          <div className="crm-people-grid">
            {PEOPLE.map((p) => (
              <div className="crm-person" key={p.name}>
                <div className="crm-person-head">
                  <div className="crm-person-avatar" style={{ background: p.color }}>{p.initials}</div>
                  <div>
                    <div className="crm-person-name">{p.name}</div>
                    <div className="crm-person-role">{p.role}</div>
                    <div className="crm-person-meta">{p.meta}</div>
                  </div>
                </div>
                <div className="crm-muted" style={{ fontSize: 12, lineHeight: 1.45 }}>
                  <strong className="crm-strong">Foco abr/q2:</strong> {p.focus}
                </div>
                <div className="crm-health-bar">
                  {p.health.map((h, i) => (
                    <div key={i} className={`seg ${h === 1 ? "full" : h === 0.5 ? "warn" : ""}`} />
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px", paddingTop: 4, borderTop: "1px dashed var(--crm-line)" }}>
                  <div>
                    <div className="crm-mono" style={{ fontSize: 10, color: "var(--crm-ink-4)", letterSpacing: "0.05em", textTransform: "uppercase" }}>eNPS</div>
                    <div style={{ fontFamily: "var(--crm-sans)", fontSize: 13, fontWeight: 600, color: "var(--crm-ink)", marginTop: 1 }}>{p.enps}</div>
                  </div>
                  <div>
                    <div className="crm-mono" style={{ fontSize: 10, color: "var(--crm-ink-4)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                      {p.prs ? "PRs/mês" : p.questoes ? "questões/mês" : "próx 1:1"}
                    </div>
                    <div style={{ fontFamily: "var(--crm-sans)", fontSize: 13, fontWeight: 600, color: "var(--crm-ink)", marginTop: 1 }}>
                      {p.prs ?? p.questoes ?? p.next}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 1:1s + PDIs */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div className="crm-card">
            <div className="crm-card-head">
              <div>
                <div className="crm-card-title">Próximos 1:1</div>
                <div className="crm-card-sub">Próximas duas semanas · 9 pessoas · ciclo quinzenal</div>
              </div>
              <div className="crm-card-side"><a className="crm-btn crm-btn-link">Calendário →</a></div>
            </div>
            <div>
              {ONES.map((o, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "80px 1fr 110px",
                  gap: 14, padding: "12px 16px",
                  borderBottom: "1px solid var(--crm-line-soft)",
                  alignItems: "center",
                }}>
                  <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)" }}>
                    <strong style={{ display: "block", fontFamily: "var(--crm-sans)", fontSize: 14, fontWeight: 700, color: "var(--crm-ink)", letterSpacing: "-0.01em" }}>{o.date}</strong>
                    {o.time}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--crm-ink)" }}>{o.with}</div>
                    <div style={{ fontFamily: "var(--crm-serif)", fontStyle: "italic", fontSize: 12.5, color: "var(--crm-ink-3)", marginTop: 3, lineHeight: 1.4 }}>"{o.topic}"</div>
                  </div>
                  <div><span className={`crm-tag crm-tag-${o.status}`}><span className="crm-tag-dot" />{o.label}</span></div>
                </div>
              ))}
            </div>
          </div>

          <div className="crm-card">
            <div className="crm-card-head">
              <div>
                <div className="crm-card-title">PDIs em curso · Q2</div>
                <div className="crm-card-sub">Plano de desenvolvimento individual · objetivos por trimestre</div>
              </div>
            </div>
            <div>
              {PDIS.map((p) => (
                <div key={p.name} style={{ padding: "14px 16px", borderBottom: "1px solid var(--crm-line-soft)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontFamily: "var(--crm-sans)", fontSize: 13, fontWeight: 700, color: "var(--crm-ink)" }}>
                      {p.name} <span style={{ fontWeight: 400, color: "var(--crm-ink-4)", fontSize: 11.5, marginLeft: 6 }}>{p.role}</span>
                    </div>
                    <div className="crm-mono" style={{ fontSize: 11.5, color: "var(--crm-ink-3)" }}>
                      <strong style={{ color: "var(--crm-green-deep)", fontSize: 13, fontWeight: 700 }}>{p.pct}%</strong> · {p.done} de {p.total} metas
                    </div>
                  </div>
                  <div style={{ height: 6, background: "var(--crm-surface-3)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${p.pct}%`, background: "linear-gradient(90deg, #1B5E3B, #C9A84C)", borderRadius: 3 }} />
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {p.goals.map((g, i) => (
                      <span key={i} className="crm-mono" style={{
                        fontSize: 10.5, padding: "3px 8px", borderRadius: 3,
                        background: g.done ? "var(--crm-surface-2)" : "var(--crm-green-tint)",
                        color: g.done ? "var(--crm-ink-4)" : "var(--crm-green-deep)",
                        border: `1px solid ${g.done ? "var(--crm-line)" : "#c2dccc"}`,
                        textDecoration: g.done ? "line-through" : "none",
                      }}>
                        {g.done && "✓ "}{g.txt}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hiring Pipeline */}
        <section className="crm-card">
          <div className="crm-card-head">
            <div>
              <div className="crm-card-title">Pipeline de contratação · 3 vagas abertas</div>
              <div className="crm-card-sub">38 dias média de fechamento · 89 candidatos no funil</div>
            </div>
            <div className="crm-card-side"><a className="crm-btn crm-btn-link">Job descriptions →</a></div>
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
            gap: 1, background: "var(--crm-line)",
            borderRadius: "var(--crm-radius)", overflow: "hidden",
            margin: "4px 18px 18px",
          }}>
            {PIPELINE.map((col) => (
              <div key={col.stage} style={{ background: "var(--crm-surface-2)", padding: "12px 12px 14px", minHeight: 320 }}>
                <h4 style={{
                  margin: "0 0 10px",
                  fontFamily: "var(--crm-sans)", fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.07em", textTransform: "uppercase",
                  color: "var(--crm-ink-4)",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  {col.stage}
                  <span className="crm-mono" style={{
                    fontSize: 11, color: "var(--crm-ink-3)",
                    background: "var(--crm-surface)", padding: "2px 7px",
                    borderRadius: 999, border: "1px solid var(--crm-line)",
                  }}>{col.count}</span>
                </h4>
                {col.cards.map((card, i) => (
                  <div key={i} style={{
                    background: "var(--crm-surface)",
                    border: `1px solid ${card.hot ? "var(--crm-green-deep)" : "var(--crm-line)"}`,
                    borderRadius: 6, padding: "10px 12px", marginBottom: 8,
                    boxShadow: card.hot ? "0 0 0 1px var(--crm-green-deep) inset" : undefined,
                    cursor: "pointer",
                  }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--crm-ink)" }}>{card.name}</div>
                    {card.role && <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)", marginTop: 2 }}>{card.role}</div>}
                    {card.tags && (
                      <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                        {card.tags.map((t) => (
                          <span key={t} className="crm-mono" style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, background: "var(--crm-surface-2)", color: "var(--crm-ink-3)" }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </main>
    </CrmShellV3>
  );
}
