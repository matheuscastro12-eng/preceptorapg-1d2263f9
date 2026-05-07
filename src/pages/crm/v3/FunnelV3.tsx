import CrmShellV3, { Kpi } from "@/components/crm/v3/CrmShellV3";
import { Plus, Download } from "lucide-react";

export default function FunnelV3() {
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
            <div className="crm-page-eyebrow">Marketing · Conversion analytics · 30 dias</div>
            <h1 className="crm-page-title">Funil <em>de aquisição</em></h1>
            <p className="crm-page-sub">
              Do anúncio ao plano pago — onde ganhamos receita e onde perdemos atenção. Cada etapa traz a taxa de conversão, número absoluto e queda relativa do funil.
            </p>
          </div>
          <div className="crm-row">
            <div className="crm-period-bar">
              <button>7d</button>
              <button className="active">30d</button>
              <button>90d</button>
              <button>YTD</button>
            </div>
            <button className="crm-btn crm-btn-ghost">Comparar mês anterior</button>
          </div>
        </section>

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Conversão funil cheio" value="2,76" unit="%" delta="↑ 0,4 pp" deltaSign="pos" deltaText="visitor → assinante" accent="mrr"
            sparkD="M0,22 L12,20 L24,18 L36,16 L48,17 L60,12 L72,10 L84,9 L100,7" />
          <Kpi label="CAC blended" value="R$ 158" delta="↓ R$ 14" deltaSign="pos" deltaText="marketing / pagantes"
            sparkD="M0,8 L12,11 L24,10 L36,14 L48,12 L60,15 L72,17 L84,18 L100,20" />
          <Kpi label="LTV / CAC" value="3,9" unit="×" delta="↑ 0,3" deltaSign="pos" deltaText="healthy > 3,0"
            sparkD="M0,18 L12,17 L24,15 L36,13 L48,12 L60,11 L72,8 L84,7 L100,5" />
          <Kpi label="Drop crítico" value="73%" delta="trial → assinante" deltaSign="neg" deltaText="oportunidade prioritária" accent="warn"
            sparkD="M0,5 L12,7 L24,9 L36,8 L48,11 L60,10 L72,12 L84,11 L100,12" />
        </section>

        {/* Funil + Cohort */}
        <section style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
          <div className="crm-card">
            <div className="crm-card-head">
              <div>
                <div className="crm-card-title">Funil completo · 30 dias</div>
                <div className="crm-card-sub">28 412 visitantes únicos → 784 assinantes pagantes</div>
              </div>
              <div className="crm-card-side">
                <div className="crm-period-bar" style={{ fontSize: 11 }}>
                  <button className="active">Todos</button>
                  <button>R+ Cardio</button>
                  <button>R+ Clínica</button>
                </div>
              </div>
            </div>
            <div className="crm-card-pad">
              <FunnelHorizontal />
            </div>
          </div>

          <div className="crm-card">
            <div className="crm-card-head">
              <div>
                <div className="crm-card-title">Coorte de retenção</div>
                <div className="crm-card-sub">% de assinantes ativos por mês de cadastro · últimos 6 ciclos</div>
              </div>
            </div>
            <div className="crm-card-pad">
              <CohortGrid />
              <div className="crm-muted" style={{ fontSize: 11.5, marginTop: 14, lineHeight: 1.5 }}>
                <strong className="crm-strong">Leitura:</strong> coortes recentes (jan-mar/26) retêm <strong className="crm-strong">88-91% no M3</strong>, alta vs 81% da coorte out/25. Onboarding novo está colando.
              </div>
            </div>
          </div>
        </section>

        {/* Campanhas */}
        <section className="crm-card">
          <div className="crm-card-head">
            <div>
              <div className="crm-card-title">Campanhas ativas · UTM source / medium</div>
              <div className="crm-card-sub">12 campanhas ativas · investimento total R$ 8 460 · 312 novos pagantes</div>
            </div>
            <div className="crm-card-side"><a className="crm-btn crm-btn-link">Auditar UTMs →</a></div>
          </div>
          <CampaignTable />
        </section>

        {/* A/B test */}
        <section style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18 }}>
          <ABTestCard />
          <TopLandingCard />
        </section>
      </main>
    </CrmShellV3>
  );
}

const FUNNEL_DATA = [
  { stage: "Visitor", sub: "visita anônima", num: "28 412", pct: "100%", width: 100 },
  { stage: "Signup", sub: "conta criada", num: "9 654", pct: "34,0%", width: 43.7, conv: "34,0%", drop: "− 66%" },
  { stage: "Trial ativo", sub: "≥ 1 questão respondida", num: "5 117", pct: "53,0%", width: 18, conv: "53,0%", drop: "− 47%" },
  { stage: "Engajado", sub: "≥ 30 questões / 7d", num: "3 126", pct: "61,1%", width: 11, conv: "61,1%", drop: "− 39%" },
  { stage: "Assinante", sub: "plano pago", num: "784", pct: "25,1%", width: 2.76, conv: "25,1%", drop: "− 75%", gold: true },
  { stage: "Retido 90d", sub: "com renovação", num: "681", pct: "86,9%", width: 2.4, conv: "86,9%", retencao: true },
];

function FunnelHorizontal() {
  return (
    <div>
      {FUNNEL_DATA.map((row) => (
        <div key={row.stage} style={{
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
              width: `${Math.max(row.width, 4)}%`,
              background: row.gold
                ? "linear-gradient(90deg, #5C3F00 0%, #A88A33 100%)"
                : row.retencao
                  ? "linear-gradient(90deg, #3a2d12 0%, #C9A84C 100%)"
                  : "linear-gradient(90deg, #0F4128 0%, #1B5E3B 100%)",
              borderRadius: 4,
              display: "flex", alignItems: "center", paddingLeft: 14,
              color: "#fff",
              fontFamily: "var(--crm-sans)",
              fontWeight: 700,
              fontFeatureSettings: '"tnum"',
              fontSize: 14,
            }}>
              {row.num} <span className="crm-mono" style={{ fontSize: 11, opacity: 0.85, marginLeft: 10 }}>{row.pct}</span>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--crm-ink-4)", display: "flex", gap: 14, justifyContent: "flex-end" }} className="crm-mono">
            {row.conv && <span style={{ color: "var(--crm-green-deep)" }}>conv. <strong>{row.conv}</strong></span>}
            {row.drop && <span style={{ color: "var(--crm-neg)" }}>drop {row.drop}</span>}
            {row.retencao && <span style={{ color: "var(--crm-green-deep)" }}>retenção <strong>{row.conv}</strong></span>}
          </div>
        </div>
      ))}
    </div>
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
    <div style={{ display: "grid", gridTemplateColumns: "100px repeat(7, 1fr)", gap: 4, fontFamily: "var(--crm-mono)", fontSize: 11 }}>
      <div style={{ color: "var(--crm-ink-4)", fontSize: 10.5, padding: "6px 8px", fontWeight: 600, fontFamily: "var(--crm-sans)" }}>Coorte</div>
      {["M0", "M1", "M2", "M3", "M4", "M5", "M6"].map((m) => (
        <div key={m} style={{ color: "var(--crm-ink-4)", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 10.5, padding: "6px 8px", textAlign: "center", fontWeight: 600 }}>{m}</div>
      ))}
      {COHORTS.map((row) => (
        <>
          <div key={row.name} style={{ color: "var(--crm-ink-3)", fontFamily: "var(--crm-sans)", padding: "6px 8px", fontSize: 10.5 }}>{row.name}</div>
          {row.values.map((v, i) => {
            const { bg, color } = cohortColor(v);
            return (
              <div key={`${row.name}-${i}`} style={{
                padding: "8px 6px", textAlign: "center", borderRadius: 4,
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

const CAMPAIGNS = [
  { name: "residencia-cardio-mar26", meta: "google_ads · cpc · landing /residencia-cardio", inv: "R$ 3 240", invSub: "− R$ 280 vs mar", leads: "684", leadsSub: "54% novos", conv: "158", convSub: "23,1%", cac: "R$ 142", cacSub: "− R$ 18", status: "green", statusLabel: "Otimizada" },
  { name: "residencia-clinica-mar26", meta: "google_ads · cpc · landing /residencia-clinica", inv: "R$ 1 880", leads: "412", conv: "82", convSub: "19,9%", cac: "R$ 165", status: "green", statusLabel: "Otimizada" },
  { name: "pediatria-abr", meta: "facebook · cpc · landing /pediatria", inv: "R$ 980", invSub: "↑ 14% vs mar", leads: "198", conv: "28", convSub: "14,1%", cac: "R$ 235", status: "warn", statusLabel: "Atenção" },
  { name: "cirurgia-mar26", meta: "instagram · cpc · landing /cirurgia", inv: "R$ 1 240", leads: "266", conv: "38", convSub: "14,3%", cac: "R$ 198", status: "warn", statusLabel: "Atenção" },
  { name: "revalida-abr26", meta: "tiktok · cpc · landing /revalida", inv: "R$ 720", invSub: "teste novo", leads: "312", conv: "11", convSub: "3,5%", cac: "R$ 387", status: "red", statusLabel: "Pausar?" },
  { name: "indicacao-bianual", meta: "programa de indicação · cupom −20%", inv: "R$ 0", invSub: "orgânico", leads: "147", conv: "38", convSub: "25,9%", cac: "R$ 0", status: "green", statusLabel: "Estrela" },
  { name: "organic_search · 'como passar residência'", meta: "SEO · landing /guia-residencia", inv: "R$ 400", invSub: "conteúdo SEO", leads: "198", conv: "31", convSub: "15,7%", cac: "R$ 13", status: "green", statusLabel: "Estrela" },
];

function CampaignTable() {
  return (
    <>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 100px 100px 100px 110px 90px",
        gap: 16, padding: "8px 16px",
        background: "var(--crm-surface-2)",
        borderBottom: "1px solid var(--crm-line)",
        fontFamily: "var(--crm-sans)", fontSize: 10.5, fontWeight: 700,
        letterSpacing: "0.07em", textTransform: "uppercase",
        color: "var(--crm-ink-4)",
      }}>
        <div>Campanha</div>
        <div style={{ textAlign: "right" }}>Investimento</div>
        <div style={{ textAlign: "right" }}>Leads</div>
        <div style={{ textAlign: "right" }}>Convertidos</div>
        <div style={{ textAlign: "right" }}>CAC</div>
        <div style={{ textAlign: "right" }}>Status</div>
      </div>
      {CAMPAIGNS.map((c) => (
        <div key={c.name} style={{
          display: "grid", gridTemplateColumns: "1fr 100px 100px 100px 110px 90px",
          gap: 16, alignItems: "center", padding: "14px 16px",
          borderBottom: "1px solid var(--crm-line-soft)",
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--crm-ink)" }}>{c.name}</div>
            <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)", marginTop: 2 }}>{c.meta}</div>
          </div>
          <CampaignNum num={c.inv} sub={c.invSub} />
          <CampaignNum num={c.leads} sub={c.leadsSub} />
          <CampaignNum num={c.conv} sub={c.convSub} hl="green" />
          <CampaignNum num={c.cac} sub={c.cacSub} />
          <div style={{ textAlign: "right" }}>
            <span className={`crm-tag crm-tag-${c.status}`}><span className="crm-tag-dot" />{c.statusLabel}</span>
          </div>
        </div>
      ))}
    </>
  );
}

function CampaignNum({ num, sub, hl }: { num: string; sub?: string; hl?: "green" | "neg" }) {
  return (
    <div className="crm-mono" style={{
      textAlign: "right", fontSize: 12.5, color: hl === "green" ? "var(--crm-green-deep)" : "var(--crm-ink)",
      fontWeight: 600,
    }}>
      {num}
      {sub && <small style={{ display: "block", color: "var(--crm-ink-4)", fontWeight: 400, fontSize: 10.5, fontFamily: "var(--crm-text)", marginTop: 2 }}>{sub}</small>}
    </div>
  );
}

function ABTestCard() {
  return (
    <div className="crm-card">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">A/B test · CTA da landing /residencia-cardio</div>
          <div className="crm-card-sub">14 412 sessões · ganho estatisticamente significativo p &lt; 0,01 · rodando há 14 dias</div>
        </div>
      </div>
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 1fr", gap: 12, alignItems: "center" }}>
          <ABVariant label="VARIANTE A · controle" copy='"Comece grátis e descubra o método PreceptorMED."' value="14,2%" meta="7 218 sessões · 1 025 signups" />
          <div style={{ fontFamily: "var(--crm-sans)", fontSize: 14, fontWeight: 700, color: "var(--crm-ink-4)", textAlign: "center" }}>vs</div>
          <ABVariant winner label="VARIANTE B · teste" copy='"Resolva 30 questões em 30 minutos. Veja se é pra você."' value="19,8%" meta="7 194 sessões · 1 424 signups" />
        </div>
        <div className="crm-muted" style={{
          fontSize: 12, marginTop: 14,
          display: "flex", justifyContent: "space-between",
          borderTop: "1px solid var(--crm-line-soft)",
          paddingTop: 12,
        }}>
          <div>Diferença <strong className="crm-strong" style={{ color: "var(--crm-green-deep)" }}>+ 5,6 pp</strong> · lift relativo <strong className="crm-strong">+ 39,4%</strong></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="crm-btn crm-btn-ghost">Ver histórico</button>
            <button className="crm-btn crm-btn-primary">Promover B</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ABVariant({ label, copy, value, meta, winner }: { label: string; copy: string; value: string; meta: string; winner?: boolean }) {
  return (
    <div style={{
      padding: 14,
      border: `1px solid ${winner ? "var(--crm-green-deep)" : "var(--crm-line)"}`,
      borderRadius: "var(--crm-radius-sm)",
      background: winner ? "var(--crm-green-tint)" : "var(--crm-surface)",
      position: "relative",
    }}>
      {winner && (
        <div style={{
          position: "absolute", top: -8, left: 12,
          background: "var(--crm-green-deep)", color: "#fff",
          fontFamily: "var(--crm-sans)", fontSize: 9.5, fontWeight: 700,
          letterSpacing: "0.08em", padding: "2px 8px", borderRadius: 3,
        }}>VENCEDORA</div>
      )}
      <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)", letterSpacing: "0.03em" }}>{label}</div>
      <div style={{ fontFamily: "var(--crm-serif)", fontStyle: "italic", fontSize: 14, color: "var(--crm-ink-2)", marginTop: 4, lineHeight: 1.4 }}>{copy}</div>
      <div style={{ fontFamily: "var(--crm-sans)", fontSize: 22, fontWeight: 700, color: winner ? "var(--crm-green-deep)" : "var(--crm-ink)", marginTop: 8, letterSpacing: "-0.02em" }}>{value}</div>
      <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)", marginTop: 2 }}>{meta}</div>
    </div>
  );
}

const LANDINGS = [
  { name: "/residencia-cardio", meta: "7 412 visitantes", conv: "19,8%", convSub: "1 467 signups", cac: "R$ 142", convHl: true },
  { name: "/guia-residencia", meta: "3 218 visitantes · SEO", conv: "22,4%", convSub: "721 signups", cac: "R$ 13", convHl: true },
  { name: "/residencia-clinica", meta: "2 814 visitantes", conv: "14,6%", convSub: "411 signups", cac: "R$ 165" },
  { name: "/pediatria", meta: "1 980 visitantes", conv: "11,2%", convSub: "222 signups", cac: "R$ 235" },
  { name: "/", meta: "12 988 visitantes · home", conv: "8,4%", convSub: "1 091 signups", cac: "R$ 87" },
  { name: "/revalida", meta: "680 visitantes", conv: "3,2%", convSub: "22 signups", cac: "R$ 387", convHl: false, convNeg: true },
];

function TopLandingCard() {
  return (
    <div className="crm-card">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Top landing pages</div>
          <div className="crm-card-sub">conv. visitor → signup · 30 dias</div>
        </div>
      </div>
      <div>
        {LANDINGS.map((l) => (
          <div key={l.name} style={{
            display: "grid", gridTemplateColumns: "1fr 90px 100px",
            gap: 14, alignItems: "center", padding: "11px 18px",
            borderBottom: "1px solid var(--crm-line-soft)",
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--crm-ink)" }}>{l.name}</div>
              <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)", marginTop: 2 }}>{l.meta}</div>
            </div>
            <CampaignNum num={l.conv} sub={l.convSub} hl={l.convHl ? "green" : l.convNeg ? "neg" : undefined} />
            <CampaignNum num={l.cac} sub="CAC" />
          </div>
        ))}
      </div>
    </div>
  );
}
