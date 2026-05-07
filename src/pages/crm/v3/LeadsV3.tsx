import { useState } from "react";
import CrmShellV3 from "@/components/crm/v3/CrmShellV3";
import { Search, Plus, Download, Filter, Columns, MoreHorizontal, MessageSquare } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  score: number;
  status: { tag: "green" | "blue" | "warn" | "gray" | "red"; label: string };
  fase: string;
  produto: "PreceptorMED" | "PreceptorIA" | "PreceptorRev";
  source: string;
  campaign: string;
  ultima: string;
}

const LEADS: Lead[] = [
  { id: "PMD-3812", name: "Bruna Cosendey Albuquerque", email: "bruna.cosendey@unifesp.edu.br", score: 91, status: { tag: "green", label: "Trial ativo" }, fase: "R+ Cardio", produto: "PreceptorMED", source: "google_ads", campaign: "cpc · residencia-cardio-mar26", ultima: "há 14 min" },
  { id: "PMD-3789", name: "Pedro Henrique Lacerda", email: "pedrolacerda@hotmail.com", score: 88, status: { tag: "green", label: "Engajado" }, fase: "R+ Clínica", produto: "PreceptorMED", source: "instagram", campaign: "organic · @preceptormed", ultima: "há 1 h" },
  { id: "PMD-3754", name: "Marcela Tinoco Nunes", email: "marcela.tinoco@medusp.br", score: 82, status: { tag: "green", label: "Engajado" }, fase: "Internato", produto: "PreceptorIA", source: "direct", campaign: "—", ultima: "há 3 h" },
  { id: "PMD-3742", name: "Thiago Carvalho Sá", email: "thiago.csa@medusp.br", score: 74, status: { tag: "blue", label: "Trial ativo" }, fase: "R+ Cardio", produto: "PreceptorMED", source: "google_ads", campaign: "cpc · residencia-cardio-mar26", ultima: "há 5 h" },
  { id: "PMD-3728", name: "Felipe Brandão Rios", email: "felipe.brandao@residencia.org", score: 67, status: { tag: "warn", label: "Trial ativo" }, fase: "R+ Pediatria", produto: "PreceptorMED", source: "facebook", campaign: "cpc · pediatria-abr", ultima: "há 1 dia" },
  { id: "PMD-3712", name: "Camila Reis Andrade", email: "camilarandrade@gmail.com", score: 62, status: { tag: "blue", label: "Signup" }, fase: "Pré-prova", produto: "PreceptorMED", source: "tiktok", campaign: "organic · @preceptor", ultima: "há 1 dia" },
  { id: "PMD-3701", name: "Rafael Oliveira Mendes", email: "rafa.mendes@hotmail.com", score: 58, status: { tag: "warn", label: "Trial ativo" }, fase: "R+ Cirurgia", produto: "PreceptorMED", source: "instagram", campaign: "cpc · cirurgia-mar26", ultima: "há 2 dias" },
  { id: "PMD-3692", name: "Juliana Pacheco Lima", email: "juliana.lima@unb.br", score: 51, status: { tag: "warn", label: "Engajado" }, fase: "Internato", produto: "PreceptorMED", source: "direct", campaign: "indicação", ultima: "há 2 dias" },
  { id: "PMD-3681", name: "Diego Torres Almeida", email: "d.torres@medusp.br", score: 44, status: { tag: "gray", label: "Signup" }, fase: "R+ Cardio", produto: "PreceptorMED", source: "google_ads", campaign: "cpc · residencia-cardio-mar26", ultima: "há 4 dias" },
  { id: "PMD-3672", name: "Ana Carolina Furtado", email: "anac.furtado@gmail.com", score: 38, status: { tag: "gray", label: "Signup" }, fase: "Pré-prova", produto: "PreceptorMED", source: "organic_search", campaign: 'google · "como passar residência"', ultima: "há 5 dias" },
];

export default function LeadsV3() {
  const [selected, setSelected] = useState<Lead>(LEADS[0]);

  return (
    <CrmShellV3
      mode="marketing"
      crumbs={[{ label: "CRM" }, { label: "Marketing" }, { label: "Leads" }]}
      topbarTools={
        <>
          <button className="crm-btn crm-btn-ghost"><Download size={13} /> Exportar</button>
          <button className="crm-btn crm-btn-primary"><Plus size={13} /> Novo lead</button>
        </>
      }
    >
      <main className="crm-page">
        <div>
          <div className="crm-page-eyebrow">Marketing · Lead Intelligence</div>
          <h1 className="crm-page-title">2 481 leads <em>vivos no banco</em></h1>
          <p className="crm-page-sub">
            Score automático de 0–100 baseado em engajamento, fase médica e canal de origem. Ranking atualizado a cada 4h pelo motor de ML.
          </p>
        </div>

        {/* Stage pills */}
        <div className="crm-card" style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            <StagePill label="Visitor" val="28 412" pct="+ 2 814 (30d)" />
            <StagePill label="Signup" val="1 242" pct="34,0% conv." />
            <StagePill label="Trial ativo" val="658" pct="53,0% conv." active />
            <StagePill label="Engajado" val="389" pct="61,1% conv." />
            <StagePill label="Assinante" val="784" pct="25,1% conv." />
            <StagePill label="Churn" val="31" pct="3,8% / mês" valColor="var(--crm-neg)" />
            <StagePill label="Win-back" val="9" pct="29% recovery" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, alignItems: "flex-start" }}>
          {/* Tabela */}
          <div>
            <div className="crm-card" style={{ overflow: "hidden" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px", background: "var(--crm-surface-2)",
                borderBottom: "1px solid var(--crm-line)",
              }}>
                <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
                  <Search style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--crm-ink-4)" }} />
                  <input
                    placeholder="Buscar por email ou nome…"
                    style={{
                      background: "var(--crm-surface)",
                      border: "1px solid var(--crm-line)",
                      borderRadius: 6,
                      padding: "6px 10px 6px 28px",
                      fontFamily: "var(--crm-text)",
                      fontSize: 12.5,
                      width: "100%",
                    }}
                  />
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                  <button className="crm-btn crm-btn-ghost"><Filter size={13} /> Filtros</button>
                  <button className="crm-btn crm-btn-ghost"><Columns size={13} /> Colunas</button>
                </div>
              </div>

              <table className="crm-tbl">
                <thead>
                  <tr>
                    <th style={{ width: 24 }}><input type="checkbox" /></th>
                    <th>Lead</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Fase</th>
                    <th>Produto</th>
                    <th>Origem</th>
                    <th>Última atividade</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {LEADS.map((l) => (
                    <tr
                      key={l.id}
                      onClick={() => setSelected(l)}
                      style={{
                        background: selected.id === l.id ? "var(--crm-green-tint)" : undefined,
                        cursor: "pointer",
                      }}
                    >
                      <td><input type="checkbox" /></td>
                      <td>
                        <div className="lead-name">{l.name}</div>
                        <div className="lead-email">{l.email}</div>
                      </td>
                      <td>
                        <div className="crm-score">
                          <div className="crm-score-bar" style={{ ["--score" as never]: `${l.score}%` }} />
                          <span className="crm-score-num">{l.score}</span>
                        </div>
                      </td>
                      <td><span className={`crm-tag crm-tag-${l.status.tag}`}><span className="crm-tag-dot" />{l.status.label}</span></td>
                      <td className="muted">{l.fase}</td>
                      <td><span className="crm-tag crm-tag-outline-green">{l.produto}</span></td>
                      <td>
                        <div className="muted crm-mono" style={{ fontSize: 12 }}>{l.source}</div>
                        <div className="muted" style={{ fontSize: 11 }}>{l.campaign}</div>
                      </td>
                      <td className="muted crm-mono">{l.ultima}</td>
                      <td><button className="crm-btn-icon"><MoreHorizontal /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", fontSize: 12, color: "var(--crm-ink-4)",
                borderTop: "1px solid var(--crm-line)",
              }}>
                <span>Mostrando <strong className="crm-strong">1–{LEADS.length}</strong> de <strong className="crm-strong">658</strong> leads</span>
                <div style={{ display: "inline-flex", gap: 4 }}>
                  {["‹", "1", "2", "3", "4", "…", "55", "›"].map((p, i) => (
                    <button key={i} className={p === "1" ? "crm-btn crm-btn-primary" : "crm-btn-icon"} style={{ width: 26, height: 26, padding: 0, fontFamily: "var(--crm-mono)", fontSize: 11.5 }}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Drawer */}
          <aside className="crm-card" style={{ position: "sticky", top: 76 }}>
            <div style={{ padding: "16px 16px 14px", borderBottom: "1px solid var(--crm-line-soft)" }}>
              <div className="crm-mono" style={{ fontSize: 10.5, color: "var(--crm-ink-4)", letterSpacing: "0.04em" }}>LEAD #{selected.id}</div>
              <div style={{ fontFamily: "var(--crm-sans)", fontSize: 18, fontWeight: 700, color: "var(--crm-ink)", letterSpacing: "-0.015em", marginTop: 4, lineHeight: 1.15 }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: "var(--crm-ink-3)", marginTop: 2 }}>{selected.email}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <span className={`crm-tag crm-tag-${selected.status.tag}`}><span className="crm-tag-dot" />{selected.status.label}</span>
                <span className="crm-tag crm-tag-outline-green">{selected.produto}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--crm-line-soft)", background: "var(--crm-surface-2)" }}>
              <ScoreRing score={selected.score} />
              <div>
                <div className="crm-strong" style={{ fontFamily: "var(--crm-sans)", fontSize: 13 }}>
                  {selected.score >= 80 ? "Hot lead" : selected.score >= 60 ? "Warm lead" : "Cold lead"}
                </div>
                <div className="crm-muted" style={{ fontSize: 11.5, lineHeight: 1.4 }}>
                  Probabilidade de conversão estimada em <strong className="crm-strong">{Math.min(95, selected.score + 6)}%</strong> nos próximos 7 dias.
                </div>
              </div>
            </div>

            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--crm-line-soft)" }}>
              <h4 style={{ fontFamily: "var(--crm-sans)", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--crm-ink-4)", margin: "0 0 8px" }}>Origem</h4>
              <dl style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: "6px 10px", fontSize: 12, margin: 0 }}>
                <dt style={{ color: "var(--crm-ink-4)" }}>Source</dt>
                <dd style={{ margin: 0, color: "var(--crm-ink)", fontWeight: 500 }} className="crm-mono">{selected.source}</dd>
                <dt style={{ color: "var(--crm-ink-4)" }}>Campanha</dt>
                <dd style={{ margin: 0, color: "var(--crm-ink)", fontWeight: 500 }} className="crm-mono">{selected.campaign}</dd>
                <dt style={{ color: "var(--crm-ink-4)" }}>Fase</dt>
                <dd style={{ margin: 0, color: "var(--crm-ink)", fontWeight: 500 }}>{selected.fase}</dd>
              </dl>
            </div>

            <div style={{ padding: "14px 16px", display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button className="crm-btn crm-btn-primary"><MessageSquare size={13} /> Mensagem</button>
              <button className="crm-btn crm-btn-ghost">Acionar playbook</button>
            </div>
          </aside>
        </div>
      </main>
    </CrmShellV3>
  );
}

function StagePill({ label, val, pct, active, valColor }: { label: string; val: string; pct: string; active?: boolean; valColor?: string }) {
  return (
    <div style={{
      padding: "12px 14px",
      borderRight: "1px solid var(--crm-line-soft)",
      background: active ? "var(--crm-green-tint)" : "var(--crm-surface)",
      cursor: "pointer",
    }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--crm-ink-4)" }}>{label}</div>
      <div style={{ fontFamily: "var(--crm-sans)", fontSize: 22, fontWeight: 700, color: valColor ?? (active ? "var(--crm-green-deep)" : "var(--crm-ink)"), letterSpacing: "-0.025em", marginTop: 2 }}>{val}</div>
      <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)", marginTop: 2 }}>{pct}</div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const circumference = 151;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div style={{ position: "relative", width: 56, height: 56 }}>
      <svg viewBox="0 0 56 56" style={{ width: 56, height: 56, transform: "rotate(-90deg)" }}>
        <circle cx="28" cy="28" r="24" strokeWidth={6} fill="none" stroke="var(--crm-surface-3)" />
        <circle cx="28" cy="28" r="24" strokeWidth={6} fill="none" stroke="var(--crm-green-deep)"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: "var(--crm-sans)", fontWeight: 700, fontSize: 16, color: "var(--crm-ink)" }}>{score}</div>
    </div>
  );
}
