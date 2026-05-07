import { useState } from "react";
import CrmShellV3, { Kpi, PageHero, PeriodBar, CardHead } from "@/components/crm/v3/CrmShellV3";
import { Plus, Calendar, Edit3, Trophy, Briefcase, Settings, Activity, CheckCircle2 } from "lucide-react";

/* =========================================================
   ONE ON ONE
   ========================================================= */
export function OneOnOneV3() {
  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "1:1 & PDIs" }]}
      topbarTools={<><button className="crm-btn crm-btn-primary"><Plus size={13} /> Agendar 1:1</button></>}
    >
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · People · 1:1 quinzenal"
          title={<>Próximos <em>1:1s</em></>}
          sub="Ciclo quinzenal com cada membro do time. Pauta editorial em itálico — registre decisões, blockers e direção."
          actions={<PeriodBar options={["Esta semana", "Próximas 2 sem", "Histórico"]} active="Próximas 2 sem" />}
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Agendados" value="9" deltaText="100% cobertura" accent="mrr" />
          <Kpi label="Com pauta pronta" value="6" delta="67%" deltaSign="pos" />
          <Kpi label="Sem pauta" value="2" delta="22%" deltaSign="neg" accent="warn" />
          <Kpi label="Atenção" value="1" delta="conversa difícil" deltaSign="neg" accent="neg" />
        </section>

        {[
          { date: "19", month: "abr", time: "11h", with: "Fernanda Albuquerque · Founder", topic: "Definir cronograma de reescrita Cardio até jun. Validar contratação de mais um editor médico.", status: "green", label: "Pauta pronta" },
          { date: "21", month: "abr", time: "09h", with: "Ricardo Paranhos · Founder", topic: "Decisão sobre pausar revalida-abr e realocar verba para indicação bianual.", status: "warn", label: "Sem pauta" },
          { date: "22", month: "abr", time: "14h", with: "Júlia Pacheco · Eng Sênior", topic: "Carreira: caminho para tech lead até jul. Próximo passo do PDI.", status: "green", label: "Pauta pronta" },
          { date: "22", month: "abr", time: "16h", with: "Daniel Mendonça · Eng Pleno", topic: "Fadiga aparente em PRs longos. Conversar sobre carga e split com Camila.", status: "red", label: "Atenção" },
          { date: "24", month: "abr", time: "10h", with: "Rafael Teixeira · Eng Júnior", topic: "Onboarding 90 dias · review do escopo do app iOS · mentoria com Júlia.", status: "green", label: "Pauta pronta" },
          { date: "25", month: "abr", time: "15h", with: "Letícia Oliveira · Editora médica", topic: "Pedido de bonificação por volume entregue em mar. Revisar plano salarial.", status: "warn", label: "Sem pauta" },
          { date: "26", month: "abr", time: "11h", with: "Camila Nóbrega · Eng Pleno", topic: "Promoção a sênior em julho — review de critérios e roadmap.", status: "green", label: "Pauta pronta" },
          { date: "29", month: "abr", time: "10h", with: "Gabriel Ramalho · Editor médico", topic: "Feedback sobre auditoria de gabaritos · próximas frentes.", status: "green", label: "Pauta pronta" },
        ].map((o, i) => (
          <section key={i} className="crm-card">
            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr auto", gap: 18, padding: "16px 20px", alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--crm-sans)", fontSize: 24, fontWeight: 700, color: "var(--crm-ink)", lineHeight: 1, letterSpacing: "-0.02em" }}>{o.date}</div>
                <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{o.month}</div>
                <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-3)", marginTop: 2 }}>{o.time}</div>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--crm-ink)" }}>{o.with}</div>
                <div style={{ fontFamily: "var(--crm-serif)", fontStyle: "italic", fontSize: 13.5, color: "var(--crm-ink-3)", marginTop: 4, lineHeight: 1.45 }}>"{o.topic}"</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                <span className={`crm-tag crm-tag-${o.status}`}><span className="crm-tag-dot" />{o.label}</span>
                <button className="crm-btn crm-btn-ghost"><Edit3 size={12} /> Pauta</button>
              </div>
            </div>
          </section>
        ))}
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   PDI
   ========================================================= */
export function PDIV3() {
  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "PDIs" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · People · Q2/2026"
          title={<>Planos de <em>desenvolvimento</em></>}
          sub="Cada membro tem 3-5 metas trimestrais. Acompanhamento nas 1:1s e revisão de fechamento ao final do trimestre."
          actions={<PeriodBar options={["Q1", "Q2", "Q3", "Q4"]} active="Q2" />}
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="PDIs ativos" value="6" deltaText="Q2/26" />
          <Kpi label="Metas concluídas" value="14" delta="de 24" deltaSign="pos" accent="mrr" />
          <Kpi label="Progresso médio" value="55%" delta="↑ 12pp" deltaSign="pos" />
          <Kpi label="Promoções previstas" value="2" delta="Q3" deltaSign="pos" accent="warn" />
        </section>

        {[
          { name: "Júlia Pacheco", role: "→ Tech Lead", pct: 78, done: 3, total: 4, eta: "Q3/26",
            goals: [
              { done: true, txt: "Liderar squad de 2 engenheiros" },
              { done: true, txt: "Mentorar Rafael (júnior mobile)" },
              { done: true, txt: "Apresentar arquitetura no time" },
              { done: false, txt: "Definir roadmap mobile até final Q2" },
            ],
          },
          { name: "Daniel Mendonça", role: "→ Eng Sênior", pct: 54, done: 2, total: 4, eta: "Q3/26",
            goals: [
              { done: true, txt: "Owner do motor de score (ML)" },
              { done: true, txt: "Talk interno · integração Stripe" },
              { done: false, txt: "Refatorar pipeline ETL" },
              { done: false, txt: "Mentorar 1 júnior" },
            ],
          },
          { name: "Camila Nóbrega", role: "→ Eng Sênior", pct: 67, done: 2, total: 3, eta: "Q3/26",
            goals: [
              { done: true, txt: "Lançar API pública v1" },
              { done: true, txt: "Documentação completa de specs" },
              { done: false, txt: "Liderar squad PreceptorIA" },
            ],
          },
          { name: "Rafael Teixeira", role: "→ Eng Pleno", pct: 32, done: 1, total: 5, eta: "Q4/26",
            goals: [
              { done: true, txt: "Onboarding 90 dias completo" },
              { done: false, txt: "Primeira release iOS em produção" },
              { done: false, txt: "2 PRs grandes / mês" },
              { done: false, txt: "Curso Swift avançado" },
              { done: false, txt: "Talk interno até jul/26" },
            ],
          },
          { name: "Letícia Oliveira", role: "→ Lead Conteúdo", pct: 45, done: 2, total: 4, eta: "Q4/26",
            goals: [
              { done: true, txt: "Curadoria de 3 200 questões Cardio" },
              { done: true, txt: "Treinar Gabriel" },
              { done: false, txt: "Coordenar entradas de conteúdo Q3" },
              { done: false, txt: "Estabelecer revisão editorial mensal" },
            ],
          },
          { name: "Gabriel Ramalho", role: "→ Editor pleno", pct: 60, done: 3, total: 5, eta: "Q3/26",
            goals: [
              { done: true, txt: "280 questões/mês com qualidade ≥ 8" },
              { done: true, txt: "Auditoria de gabarito Cirurgia" },
              { done: true, txt: "Aprender ferramentas de IA" },
              { done: false, txt: "Liderar revisão de Pediatria" },
              { done: false, txt: "Talk interno sobre erro comum" },
            ],
          },
        ].map((p) => (
          <section key={p.name} className="crm-card">
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--crm-line-soft)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontFamily: "var(--crm-sans)", fontSize: 15, fontWeight: 700, color: "var(--crm-ink)" }}>
                    {p.name} <span style={{ fontWeight: 400, color: "var(--crm-ink-4)", fontSize: 12, marginLeft: 8 }}>{p.role} · ETA {p.eta}</span>
                  </div>
                </div>
                <div className="crm-mono" style={{ fontSize: 12, color: "var(--crm-ink-3)" }}>
                  <strong style={{ color: "var(--crm-green-deep)", fontSize: 14, fontWeight: 700 }}>{p.pct}%</strong> · {p.done}/{p.total} metas
                </div>
              </div>
              <div style={{ height: 6, background: "var(--crm-surface-3)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${p.pct}%`, background: "linear-gradient(90deg, var(--crm-green-deep), var(--crm-gold))", borderRadius: 3 }} />
              </div>
            </div>
            <div style={{ padding: "12px 20px", display: "flex", flexWrap: "wrap", gap: 8 }}>
              {p.goals.map((g, i) => (
                <span key={i} className="crm-mono" style={{
                  fontSize: 11.5, padding: "5px 10px", borderRadius: 4,
                  background: g.done ? "var(--crm-surface-2)" : "var(--crm-green-tint)",
                  color: g.done ? "var(--crm-ink-4)" : "var(--crm-green-deep)",
                  border: `1px solid ${g.done ? "var(--crm-line)" : "#c2dccc"}`,
                  textDecoration: g.done ? "line-through" : "none",
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}>
                  {g.done && <CheckCircle2 size={12} />}{g.txt}
                </span>
              ))}
            </div>
          </section>
        ))}
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   CARREIRA
   ========================================================= */
export function CarreiraV3() {
  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Carreira & promoções" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · Carreira"
          title={<>Trilhas de <em>carreira</em></>}
          sub="Níveis salariais por trilha (Eng, Conteúdo, Founders), critérios de promoção e ciclo de revisão."
        />

        <section className="crm-card">
          <CardHead title="Trilha de Engenharia" sub="4 níveis · 4 pessoas" />
          <table className="crm-tbl">
            <thead><tr><th>Nível</th><th>Faixa salarial</th><th>Pessoa</th><th>Critérios principais</th></tr></thead>
            <tbody>
              {[
                { n: "L1 · Júnior", s: "R$ 4 800 – R$ 7 500", p: "Rafael Teixeira", c: "Aprende, executa tarefas claras. Revisões frequentes." },
                { n: "L2 · Pleno", s: "R$ 8 000 – R$ 13 000", p: "Daniel · Camila", c: "Owner de features. Mentora júniores. Decisões técnicas locais." },
                { n: "L3 · Sênior", s: "R$ 13 000 – R$ 18 000", p: "Júlia", c: "Lidera squad. Decisões arquiteturais. Conversas difíceis." },
                { n: "L4 · Tech Lead", s: "R$ 18 000 – R$ 25 000", p: "—", c: "Liderança técnica + people leadership. Direciona o produto." },
              ].map((r) => (
                <tr key={r.n}>
                  <td className="lead-name">{r.n}</td>
                  <td className="num">{r.s}</td>
                  <td className="muted">{r.p}</td>
                  <td className="muted">{r.c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="crm-card">
          <CardHead title="Trilha de Conteúdo" sub="3 níveis · 2 pessoas" />
          <table className="crm-tbl">
            <thead><tr><th>Nível</th><th>Faixa salarial</th><th>Pessoa</th><th>Critérios principais</th></tr></thead>
            <tbody>
              {[
                { n: "C1 · Editor", s: "R$ 5 000 – R$ 7 500", p: "Gabriel Ramalho", c: "Cria conteúdo no escopo definido. Qualidade técnica." },
                { n: "C2 · Editor pleno", s: "R$ 7 500 – R$ 11 000", p: "Letícia Oliveira", c: "Revisa, padroniza, treina novos. Curadoria editorial." },
                { n: "C3 · Lead Conteúdo", s: "R$ 11 000 – R$ 16 000", p: "—", c: "Estratégia editorial. Define linha. Lidera time de conteúdo." },
              ].map((r) => (
                <tr key={r.n}>
                  <td className="lead-name">{r.n}</td>
                  <td className="num">{r.s}</td>
                  <td className="muted">{r.p}</td>
                  <td className="muted">{r.c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="crm-card">
          <CardHead title="Promoções previstas · 2026" sub="2 promoções no Q3, 1 no Q4" />
          <div className="crm-card-pad" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {[
              { name: "Júlia Pacheco", from: "Sênior", to: "Tech Lead", when: "Q3/26", pct: 78, color: "var(--crm-green-deep)" },
              { name: "Camila Nóbrega", from: "Pleno", to: "Sênior", when: "Q3/26", pct: 67, color: "var(--crm-green-deep)" },
              { name: "Rafael Teixeira", from: "Júnior", to: "Pleno", when: "Q4/26", pct: 32, color: "var(--crm-gold-deep)" },
            ].map((p) => (
              <div key={p.name} style={{ padding: 16, border: "1px solid var(--crm-line)", borderRadius: 8 }}>
                <Trophy size={16} style={{ color: p.color }} />
                <div style={{ fontFamily: "var(--crm-sans)", fontSize: 14, fontWeight: 700, color: "var(--crm-ink)", marginTop: 8 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "var(--crm-ink-3)", marginTop: 4 }}>
                  {p.from} <span style={{ margin: "0 6px", color: "var(--crm-ink-4)" }}>→</span> <strong>{p.to}</strong>
                </div>
                <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)", marginTop: 8 }}>previsto {p.when}</div>
                <div style={{ height: 4, background: "var(--crm-surface-3)", borderRadius: 2, overflow: "hidden", marginTop: 6 }}>
                  <div style={{ height: "100%", width: `${p.pct}%`, background: p.color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   CONTRATAÇÕES
   ========================================================= */
export function ContratacoesV3() {
  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Contratações" }]}
      topbarTools={<><button className="crm-btn crm-btn-primary"><Plus size={13} /> Nova vaga</button></>}
    >
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · Hiring"
          title={<>3 vagas <em>abertas</em></>}
          sub="Pipeline com 89 candidatos em 5 estágios. Tempo médio de fechamento 38 dias. Meta: fechar 2 até jun/26."
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Vagas abertas" value="3" deltaText="2 eng · 1 conteúdo" accent="warn" />
          <Kpi label="Candidatos no funil" value="89" deltaText="42 sourcing · 18 triagem" />
          <Kpi label="Tempo médio fechamento" value="38 dias" delta="↓ 4d" deltaSign="pos" accent="mrr" />
          <Kpi label="Aceitação ofertas" value="82%" delta="meta 80%" deltaSign="pos" />
        </section>

        <section className="crm-card">
          <CardHead title="Vagas abertas" />
          <table className="crm-tbl">
            <thead><tr><th>Vaga</th><th>Tipo</th><th>Faixa salarial</th><th>Aberta há</th><th>Candidatos</th><th>Em estágio final</th><th></th></tr></thead>
            <tbody>
              {[
                { v: "Eng Pleno · Backend", t: "CLT", s: "R$ 11k – R$ 14k", o: "32 dias", c: "62", f: "1 (Patrícia)", st: "warn" },
                { v: "Eng Júnior · Mobile", t: "CLT", s: "R$ 6k – R$ 8k", o: "21 dias", c: "18", f: "2 candidatos", st: "green" },
                { v: "Editor médico", t: "PJ", s: "R$ 5k – R$ 8k", o: "14 dias", c: "9", f: "1 (Henrique)", st: "green" },
              ].map((r) => (
                <tr key={r.v}>
                  <td className="lead-name">{r.v}</td>
                  <td><span className="crm-tag crm-tag-gray"><span className="crm-tag-dot" />{r.t}</span></td>
                  <td className="num">{r.s}</td>
                  <td className="muted">{r.o}</td>
                  <td className="num">{r.c}</td>
                  <td className="muted">{r.f}</td>
                  <td><span className={`crm-tag crm-tag-${r.st}`}><span className="crm-tag-dot" />{r.st === "warn" ? "Pressão" : "No prazo"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="crm-card">
          <CardHead title="Pipeline de candidatos · todas as vagas" sub="89 candidatos em 5 estágios" side={<a className="crm-btn crm-btn-link">Job descriptions →</a>} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1, background: "var(--crm-line)", margin: "4px 18px 18px", borderRadius: "var(--crm-radius)", overflow: "hidden" }}>
            {[
              { stage: "Sourcing", count: 42 },
              { stage: "Triagem", count: 18 },
              { stage: "Tech / Case", count: 17 },
              { stage: "Cultural", count: 8 },
              { stage: "Oferta", count: 4 },
            ].map((c) => (
              <div key={c.stage} style={{ background: "var(--crm-surface-2)", padding: "16px 16px 18px", textAlign: "center" }}>
                <div className="crm-mono" style={{ fontSize: 10.5, color: "var(--crm-ink-4)", letterSpacing: "0.07em", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>{c.stage}</div>
                <div style={{ fontFamily: "var(--crm-sans)", fontSize: 32, fontWeight: 700, color: "var(--crm-ink)", letterSpacing: "-0.025em", lineHeight: 1 }}>{c.count}</div>
                <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)", marginTop: 4 }}>candidatos</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   SALÁRIOS
   ========================================================= */
export function SalariosV3() {
  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Salários" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · Folha"
          title={<>Folha <em>de pagamento</em></>}
          sub="Salários, encargos, bonificações e equity. Reajustes seguem o ciclo trimestral de revisão."
          actions={<PeriodBar options={["Mar", "Abr", "Mai"]} active="Abr" />}
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Folha bruta" value="R$ 22 800" delta="6 FTE" deltaSign="flat" accent="mrr" />
          <Kpi label="Pro-labore" value="R$ 2 000" delta="3 founders" deltaSign="flat" />
          <Kpi label="Encargos" value="≈ R$ 6 800" delta="30%" deltaSign="flat" accent="warn" />
          <Kpi label="Custo total" value="R$ 31 600" delta="76% do burn" deltaSign="flat" accent="neg" />
        </section>

        <section className="crm-card">
          <CardHead title="Folha · Abr/2026" sub="9 pessoas · 3 founders + 6 FTE" />
          <table className="crm-tbl">
            <thead><tr><th>Pessoa</th><th>Cargo</th><th>Tipo</th><th style={{ textAlign: "right" }}>Salário base</th><th style={{ textAlign: "right" }}>Encargos</th><th style={{ textAlign: "right" }}>Total empresa</th></tr></thead>
            <tbody>
              {[
                { n: "Matheus Castro", c: "Founder · CEO", t: "Sócio", b: "R$ 800", e: "—", tot: "R$ 800" },
                { n: "Fernanda Albuquerque", c: "Founder · Conteúdo", t: "Sócio", b: "R$ 800", e: "—", tot: "R$ 800" },
                { n: "Ricardo Paranhos", c: "Founder · Marketing", t: "Sócio", b: "R$ 400", e: "—", tot: "R$ 400" },
                { n: "Júlia Pacheco", c: "Eng Sênior", t: "CLT", b: "R$ 14 200", e: "R$ 4 260", tot: "R$ 18 460" },
                { n: "Daniel Mendonça", c: "Eng Pleno", t: "CLT", b: "R$ 11 800", e: "R$ 3 540", tot: "R$ 15 340" },
                { n: "Camila Nóbrega", c: "Eng Pleno", t: "CLT", b: "R$ 11 200", e: "R$ 3 360", tot: "R$ 14 560" },
                { n: "Rafael Teixeira", c: "Eng Júnior", t: "CLT", b: "R$ 6 800", e: "R$ 2 040", tot: "R$ 8 840" },
                { n: "Letícia Oliveira", c: "Editora pleno", t: "CLT", b: "R$ 7 400", e: "R$ 2 220", tot: "R$ 9 620" },
                { n: "Gabriel Ramalho", c: "Editor", t: "PJ", b: "R$ 6 200", e: "—", tot: "R$ 6 200" },
              ].map((r) => (
                <tr key={r.n}>
                  <td className="lead-name">{r.n}</td>
                  <td className="muted">{r.c}</td>
                  <td><span className={`crm-tag crm-tag-${r.t === "Sócio" ? "gold" : r.t === "CLT" ? "green" : "blue"}`}><span className="crm-tag-dot" />{r.t}</span></td>
                  <td className="num">{r.b}</td>
                  <td className="num muted">{r.e}</td>
                  <td className="num"><strong>{r.tot}</strong></td>
                </tr>
              ))}
              <tr style={{ background: "var(--crm-surface-2)" }}>
                <td colSpan={3} style={{ fontFamily: "var(--crm-sans)", fontWeight: 700 }}>Total</td>
                <td className="num"><strong>R$ 60 800</strong></td>
                <td className="num"><strong>R$ 15 420</strong></td>
                <td className="num"><strong>R$ 76 220</strong></td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   EASYFLOW (Configurações)
   ========================================================= */
export function EasyflowV3() {
  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Configurações" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · Sistema · Integrações"
          title={<>Configurações <em>do CRM</em></>}
          sub="Integrações com gateway de pagamento, e-mail, analytics e webhooks externos."
        />

        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <IntegrationCard
            name="Asaas (Gateway)"
            status="connected"
            desc="Cobranças recorrentes, webhook de pagamentos, conciliação automática."
            meta="Conectado em 12/jan/2025 · 1 240 transações no mês"
          />
          <IntegrationCard
            name="Stripe (Internacional)"
            status="connected"
            desc="Backup gateway para clientes internacionais e cards estrangeiros."
            meta="Conectado em 22/mar/2025 · 84 transações no mês"
          />
          <IntegrationCard
            name="Resend (E-mail transacional)"
            status="connected"
            desc="Envio de emails do app, automações de marketing e notificações."
            meta="14 templates ativos · 99,2% delivery"
          />
          <IntegrationCard
            name="Google Analytics 4"
            status="connected"
            desc="Tracking de eventos, funil de aquisição e medição de campanhas."
            meta="GA4 ID: G-5YDQ04HZ52"
          />
          <IntegrationCard
            name="Meta Pixel + Conversion API"
            status="warn"
            desc="Tracking de conversões para otimização de Meta Ads."
            meta="Pendente: configurar CAPI server-side"
          />
          <IntegrationCard
            name="Slack (Alertas)"
            status="disconnected"
            desc="Notificações de churn, billing failed e alertas críticos."
            meta="Desconectado · não configurado ainda"
          />
        </section>
      </main>
    </CrmShellV3>
  );
}

function IntegrationCard({ name, status, desc, meta }: { name: string; status: "connected" | "warn" | "disconnected"; desc: string; meta: string }) {
  const tag = status === "connected" ? { lb: "Conectado", cl: "green" } : status === "warn" ? { lb: "Atenção", cl: "warn" } : { lb: "Desconectado", cl: "gray" };
  return (
    <div className="crm-card">
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ fontFamily: "var(--crm-sans)", fontSize: 14, fontWeight: 700, color: "var(--crm-ink)" }}>{name}</div>
          <span className={`crm-tag crm-tag-${tag.cl}`}><span className="crm-tag-dot" />{tag.lb}</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--crm-ink-3)", lineHeight: 1.5, margin: "0 0 12px" }}>{desc}</p>
        <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)" }}>{meta}</div>
        <div style={{ marginTop: 14, display: "flex", gap: 6 }}>
          <button className="crm-btn crm-btn-ghost"><Settings size={12} /> Configurar</button>
          {status === "connected" && <button className="crm-btn crm-btn-ghost">Logs</button>}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   WEBHOOKS
   ========================================================= */
export function WebhooksV3() {
  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Webhooks" }]}
      topbarTools={<><button className="crm-btn crm-btn-primary"><Plus size={13} /> Novo webhook</button></>}
    >
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · Sistema · Webhooks"
          title={<>Logs de <em>webhooks</em></>}
          sub="Histórico de eventos recebidos: Asaas, Stripe, Resend, Google Forms. Falhas geram alerta automático."
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Eventos 24h" value="1 240" delta="↑ 12%" deltaSign="pos" accent="mrr" />
          <Kpi label="Sucesso" value="99,2%" delta="↑ 0,3pp" deltaSign="pos" />
          <Kpi label="Falhas" value="9" delta="0,8%" deltaSign="neg" accent="warn" />
          <Kpi label="Latência média" value="180ms" delta="P95: 480ms" deltaSign="flat" />
        </section>

        <section className="crm-card">
          <CardHead title="Logs recentes" sub="últimas 12 entradas · clique para detalhes" />
          <table className="crm-tbl">
            <thead><tr><th>Evento</th><th>Origem</th><th>Status</th><th>Latência</th><th>Quando</th><th></th></tr></thead>
            <tbody>
              {[
                { e: "subscription.created", o: "Asaas", st: "200", lat: "142ms", w: "agora", cl: "green" },
                { e: "payment.confirmed", o: "Asaas", st: "200", lat: "98ms", w: "há 1 min", cl: "green" },
                { e: "payment.failed", o: "Asaas", st: "200", lat: "120ms", w: "há 3 min", cl: "green" },
                { e: "email.delivered", o: "Resend", st: "200", lat: "44ms", w: "há 5 min", cl: "green" },
                { e: "checkout.completed", o: "Stripe", st: "200", lat: "180ms", w: "há 8 min", cl: "green" },
                { e: "subscription.cancelled", o: "Asaas", st: "200", lat: "156ms", w: "há 12 min", cl: "green" },
                { e: "form.submitted", o: "Google Forms", st: "500", lat: "timeout", w: "há 18 min", cl: "red" },
                { e: "payment.refunded", o: "Stripe", st: "200", lat: "210ms", w: "há 22 min", cl: "green" },
                { e: "email.bounced", o: "Resend", st: "200", lat: "62ms", w: "há 30 min", cl: "warn" },
              ].map((r, i) => (
                <tr key={i}>
                  <td><code style={{ background: "var(--crm-surface-2)", padding: "2px 8px", borderRadius: 3, fontFamily: "var(--crm-mono)", fontSize: 12, color: "var(--crm-green-deep)" }}>{r.e}</code></td>
                  <td><span className="crm-tag crm-tag-gray"><span className="crm-tag-dot" />{r.o}</span></td>
                  <td><span className={`crm-tag crm-tag-${r.cl}`}><span className="crm-tag-dot" />{r.st}</span></td>
                  <td className="num">{r.lat}</td>
                  <td className="muted">{r.w}</td>
                  <td><button className="crm-btn-icon"><Activity /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </CrmShellV3>
  );
}
