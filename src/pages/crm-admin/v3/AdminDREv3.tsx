import CrmShellV3, { Kpi } from "@/components/crm/v3/CrmShellV3";
import { Plus } from "lucide-react";

export default function AdminDREv3() {
  return (
    <CrmShellV3
      mode="admin"
      crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "DRE & Receita" }]}
      topbarTools={
        <>
          <button className="crm-btn crm-btn-ghost">Fechar mês</button>
          <button className="crm-btn crm-btn-primary"><Plus size={13} /> Lançar</button>
        </>
      }
    >
      <main className="crm-page">
        <section className="crm-hero">
          <div>
            <div className="crm-page-eyebrow">Admin · Finanças · Abr/2026 · fechamento parcial</div>
            <h1 className="crm-page-title">DRE <em>& Receita</em></h1>
            <p className="crm-page-sub">Receita recorrente, fluxo de caixa e burn rate consolidados. DRE projetada vs realizada do mês corrente.</p>
          </div>
          <div className="crm-row">
            <div className="crm-period-bar">
              <button>Mar/26</button>
              <button className="active">Abr/26</button>
              <button>YTD</button>
              <button>2026</button>
            </div>
            <button className="crm-btn crm-btn-ghost">Comparar com Abr/25</button>
          </div>
        </section>

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          <Kpi label="MRR" value="R$ 38.412" delta="↑ 12,4%" deltaSign="pos" deltaText="vs Mar · 784 ativos" accent="mrr"
            sparkD="M0,22 L8,20 L16,21 L24,18 L32,16 L40,17 L48,14 L56,12 L64,11 L72,9 L80,8 L88,6 L100,5" />
          <Kpi label="ARR" value="R$ 460.944" delta="+ R$ 51k" deltaSign="pos" deltaText="MRR × 12"
            sparkD="M0,24 L12,22 L24,20 L36,17 L48,15 L60,12 L72,9 L84,7 L100,4" />
          <Kpi label="Runway" value="7,4" unit="meses" delta="+ 0,8m" deltaSign="pos" deltaText="saldo / burn" accent="warn"
            sparkD="M0,18 L12,16 L24,17 L36,14 L48,15 L60,11 L72,12 L84,9 L100,7" />
          <Kpi label="Burn rate" value="R$ 41.820" delta="↑ 4,1%" deltaSign="neg" deltaText="despesas do mês" accent="neg"
            sparkD="M0,16 L12,15 L24,18 L36,14 L48,12 L60,11 L72,10 L84,8 L100,6" />
          <Kpi label="Net new MRR" value="R$ 4.230" delta="↑ 38" deltaSign="pos" deltaText="novos − churn"
            sparkD="M0,22 L12,18 L24,16 L36,11 L48,14 L60,9 L72,12 L84,7 L100,5" />
        </section>

        {/* MRR + Plan Mix + Runway */}
        <section style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 18 }}>
          <div className="crm-card">
            <div className="crm-card-head">
              <div>
                <div className="crm-card-title">MRR · últimos 12 meses</div>
                <div className="crm-card-sub">Crescimento composto mensal de 8,4% · projeção até dez/26</div>
              </div>
              <div className="crm-card-side">
                <div className="crm-period-bar" style={{ fontSize: 11 }}>
                  <button>3m</button><button>6m</button>
                  <button className="active">12m</button>
                  <button>YTD</button>
                </div>
              </div>
            </div>
            <div className="crm-card-pad">
              <MRRChart />
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                border: "1px solid var(--crm-line)",
                borderRadius: 8, marginTop: 12,
                background: "var(--crm-surface-2)",
              }}>
                <HlStat lbl="CMGR · 12m" val="8,4" unit="%" meta="crescimento mensal composto" />
                <HlStat lbl="Net rev. retention" val="112" unit="%" meta="expansion supera churn" color="var(--crm-green-deep)" />
                <HlStat lbl="Ticket médio" val="R$ 49" unit=",00" meta="+ R$ 1,40 vs trimestre" />
                <HlStat lbl="CAC payback" val="3,2" unit="m" meta="CAC R$ 158 · LTV/CAC 3,9×" />
              </div>
            </div>
          </div>

          <div className="crm-card">
            <div className="crm-card-head">
              <div>
                <div className="crm-card-title">Mix de planos</div>
                <div className="crm-card-sub">784 assinantes ativos · MRR R$ 38 412</div>
              </div>
            </div>
            <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", height: 36, borderRadius: 6, overflow: "hidden", border: "1px solid var(--crm-line)" }}>
                <div style={{ background: "#1B5E3B", width: "48%", display: "grid", placeItems: "center", color: "#fff", fontFamily: "var(--crm-sans)", fontSize: 11, fontWeight: 700 }}>48%</div>
                <div style={{ background: "#3F8B5C", width: "34%", display: "grid", placeItems: "center", color: "#fff", fontFamily: "var(--crm-sans)", fontSize: 11, fontWeight: 700 }}>34%</div>
                <div style={{ background: "#C9A84C", width: "18%", display: "grid", placeItems: "center", color: "#fff", fontFamily: "var(--crm-sans)", fontSize: 11, fontWeight: 700 }}>18%</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 4 }}>
                <PlanLegend color="#1B5E3B" label="Mensal" val="376 · R$ 49,90" />
                <PlanLegend color="#3F8B5C" label="Anual" val="266 · R$ 29,24/m" />
                <PlanLegend color="#C9A84C" label="Bianual" val="142 · R$ 99,98/m" />
              </div>
            </div>
            <hr className="crm-rule" />
            <RunwayGauge />
          </div>
        </section>

        {/* DRE + Despesas */}
        <section style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
          <div className="crm-card">
            <div className="crm-card-head">
              <div>
                <div className="crm-card-title">DRE · Abr/2026 · realizado vs orçado</div>
                <div className="crm-card-sub">Demonstração do resultado · regime de competência</div>
              </div>
              <div className="crm-card-side"><a className="crm-btn crm-btn-link">Detalhar lançamentos →</a></div>
            </div>
            <DRETable />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <ExpensesCard />
            <InadimplenciaCard />
          </div>
        </section>
      </main>
    </CrmShellV3>
  );
}

function HlStat({ lbl, val, unit, meta, color }: { lbl: string; val: string; unit?: string; meta: string; color?: string }) {
  return (
    <div style={{ padding: "18px 20px", borderRight: "1px solid var(--crm-line)" }}>
      <div style={{ fontFamily: "var(--crm-sans)", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--crm-ink-4)" }}>{lbl}</div>
      <div style={{
        fontFamily: "var(--crm-sans)", fontWeight: 700, fontSize: 28,
        letterSpacing: "-0.025em", color: color ?? "var(--crm-ink)",
        marginTop: 4, fontFeatureSettings: '"tnum"',
      }}>
        {val}{unit && <span style={{ fontSize: 14, color: "var(--crm-ink-4)", fontWeight: 600 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--crm-ink-4)", marginTop: 4 }}>{meta}</div>
    </div>
  );
}

function PlanLegend({ color, label, val }: { color: string; label: string; val: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: "1px solid var(--crm-line)", borderRadius: 6 }}>
      <div style={{ width: 8, height: 18, borderRadius: 2, background: color }} />
      <div>
        <div style={{ fontFamily: "var(--crm-sans)", fontSize: 12, fontWeight: 600, color: "var(--crm-ink)" }}>{label}</div>
        <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)", marginTop: 2 }}>{val}</div>
      </div>
    </div>
  );
}

function MRRChart() {
  return (
    <svg style={{ height: 240, width: "100%" }} viewBox="0 0 720 240" preserveAspectRatio="none">
      <g stroke="var(--crm-line-soft)" strokeWidth={1} strokeDasharray="2 3">
        <line x1="40" y1="20" x2="700" y2="20" />
        <line x1="40" y1="70" x2="700" y2="70" />
        <line x1="40" y1="120" x2="700" y2="120" />
        <line x1="40" y1="170" x2="700" y2="170" />
        <line x1="40" y1="220" x2="700" y2="220" />
      </g>
      <g style={{ fontFamily: "var(--crm-mono)", fontSize: 10, fill: "var(--crm-ink-4)" }}>
        <text x="35" y="223" textAnchor="end">0</text>
        <text x="35" y="173" textAnchor="end">12k</text>
        <text x="35" y="123" textAnchor="end">24k</text>
        <text x="35" y="73" textAnchor="end">36k</text>
        <text x="35" y="23" textAnchor="end">48k</text>
        {["mai/25","jun","jul","ago","set","out","nov","dez","jan/26","fev","mar","abr"].map((m, i) => (
          <text key={m} x={55 + i * 60} y="234">{m}</text>
        ))}
      </g>
      <path d="M55,205 L120,200 L180,192 L245,182 L305,170 L365,154 L430,140 L490,124 L550,108 L615,90 L680,73 L680,224 L55,224 Z" fill="#1B5E3B" fillOpacity="0.10" />
      <path d="M55,205 L120,200 L180,192 L245,182 L305,170 L365,154 L430,140 L490,124 L550,108 L615,90 L680,73" stroke="#1B5E3B" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M680,73 L700,67" stroke="#C9A84C" strokeWidth="2.4" fill="none" strokeDasharray="4 3" />
      <g fill="#1B5E3B">
        {[[55,205],[120,200],[180,192],[245,182],[305,170],[365,154],[430,140],[490,124],[550,108],[615,90]].map(([x,y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={3} />
        ))}
        <circle cx={680} cy={73} r={4} stroke="#FBF8F2" strokeWidth={2} />
      </g>
      <line x1="680" y1="73" x2="680" y2="40" stroke="#1B5E3B" strokeDasharray="2 2" />
      <rect x="612" y="22" width="118" height="22" rx="4" fill="#0F4128" />
      <text x="671" y="37" textAnchor="middle" fontFamily="Manrope" fontSize="11" fontWeight="700" fill="#fff">R$ 38 412 · abr</text>
    </svg>
  );
}

function RunwayGauge() {
  const total = 276;
  const offset = 92;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "110px 1fr", gap: 18,
      padding: "18px 20px", alignItems: "center",
    }}>
      <div style={{ width: 110, height: 110, position: "relative" }}>
        <svg viewBox="0 0 110 110" style={{ width: 110, height: 110, transform: "rotate(-90deg)" }}>
          <circle cx="55" cy="55" r="44" strokeWidth="10" fill="none" stroke="var(--crm-surface-3)" />
          <circle cx="55" cy="55" r="44" strokeWidth="10" fill="none" stroke="#1B5E3B"
            strokeDasharray={total} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "grid", placeContent: "center",
          fontFamily: "var(--crm-sans)", fontWeight: 700, fontSize: 28,
          color: "var(--crm-green-deep)", letterSpacing: "-0.02em",
          lineHeight: 1, textAlign: "center",
        }}>
          7,4
          <small style={{
            display: "block", fontFamily: "var(--crm-text)",
            fontSize: 10, fontWeight: 600, color: "var(--crm-ink-4)",
            textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 4,
          }}>meses</small>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 12.5 }}>
        <RunwayRow l="Saldo em caixa" r="R$ 309 470" />
        <RunwayRow l="Burn rate" r="R$ 41 820/m" />
        <RunwayRow l="Receita esperada (12m)" r="R$ 478 800" />
        <RunwayRow l="Aporte previsto" r="R$ 0" />
        <div style={{ paddingTop: 8, borderTop: "1px solid var(--crm-line-soft)", display: "flex", justifyContent: "space-between" }}>
          <span className="crm-strong">Default-alive em ago/26</span>
          <span className="crm-mono" style={{ color: "var(--crm-green-deep)", fontWeight: 600 }}>sim ✓</span>
        </div>
      </div>
    </div>
  );
}
function RunwayRow({ l, r }: { l: string; r: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: "var(--crm-ink-4)" }}>{l}</span>
      <span className="crm-mono" style={{ fontWeight: 600, color: "var(--crm-ink)" }}>{r}</span>
    </div>
  );
}

function DRETable() {
  return (
    <table className="crm-dre">
      <thead>
        <tr className="section">
          <td>Categoria</td>
          <td className="num">Realizado</td>
          <td className="num">Orçado</td>
          <td className="pct">% Receita</td>
          <td className="pct">vs orçado</td>
        </tr>
      </thead>
      <tbody>
        <tr className="section"><td colSpan={5}>Receita</td></tr>
        <DRERow lbl="Receita recorrente (MRR)" real="38 412,00" orcado="37 100,00" pct="85,2%" delta="+ 3,5%" deltaSign="pos" />
        <DRERow lbl="Vendas avulsas (cursos)" real="5 380,00" orcado="6 200,00" pct="11,9%" delta="− 13,2%" deltaSign="neg" />
        <DRERow lbl="Consultorias B2B" real="1 320,00" orcado="1 500,00" pct="2,9%" delta="− 12,0%" deltaSign="neg" />
        <tr className="subtotal"><td>Receita bruta</td><td className="num">45 112,00</td><td className="num">44 800,00</td><td className="pct">100%</td><td className="pct"><span className="crm-delta crm-delta-pos">+ 0,7%</span></td></tr>

        <tr className="section"><td colSpan={5}>Deduções</td></tr>
        <DRERow lbl="Impostos sobre receita (Simples)" real="− 2 707,00" orcado="− 2 688,00" pct="6,0%" delta="flat" deltaSign="flat" />
        <DRERow lbl="Taxas de gateway / Stripe" real="− 1 354,00" orcado="− 1 300,00" pct="3,0%" delta="− 4,2%" deltaSign="neg" />
        <tr className="subtotal"><td>Receita líquida</td><td className="num">41 051,00</td><td className="num">40 812,00</td><td className="pct">91,0%</td><td className="pct"><span className="crm-delta crm-delta-pos">+ 0,6%</span></td></tr>

        <tr className="section"><td colSpan={5}>Despesas operacionais</td></tr>
        <DRERow lbl="Salários & encargos" real="− 24 800,00" orcado="− 24 800,00" pct="55,0%" delta="flat" deltaSign="flat" />
        <DRERow lbl="Ferramentas & SaaS" real="− 4 920,00" orcado="− 4 200,00" pct="10,9%" delta="− 17,1%" deltaSign="neg" />
        <DRERow lbl="Marketing & ads" real="− 8 460,00" orcado="− 9 000,00" pct="18,8%" delta="+ 6,0%" deltaSign="pos" />
        <DRERow lbl="Infraestrutura (Supabase, Vercel)" real="− 2 140,00" orcado="− 2 100,00" pct="4,7%" delta="− 1,9%" deltaSign="neg" />
        <DRERow lbl="Jurídico & contábil" real="− 950,00" orcado="− 950,00" pct="2,1%" delta="flat" deltaSign="flat" />
        <DRERow lbl="Outros" real="− 550,00" orcado="− 800,00" pct="1,2%" delta="+ 31,3%" deltaSign="pos" />
        <tr className="subtotal"><td>Total operacional</td><td className="num">− 41 820,00</td><td className="num">− 41 850,00</td><td className="pct">92,7%</td><td className="pct"><span className="crm-delta crm-delta-flat">flat</span></td></tr>

        <tr className="total"><td>EBITDA</td><td className="num">− 769,00</td><td className="num">− 1 038,00</td><td className="pct">− 1,7%</td><td className="pct"><span className="crm-delta crm-delta-pos">+ 25,9%</span></td></tr>
      </tbody>
    </table>
  );
}

function DRERow({ lbl, real, orcado, pct, delta, deltaSign }: { lbl: string; real: string; orcado: string; pct: string; delta: string; deltaSign: "pos" | "neg" | "flat" }) {
  return (
    <tr>
      <td className="lbl">{lbl}</td>
      <td className="num">{real}</td>
      <td className="num">{orcado}</td>
      <td className="pct">{pct}</td>
      <td className="pct"><span className={`crm-delta crm-delta-${deltaSign}`}>{delta}</span></td>
    </tr>
  );
}

function ExpensesCard() {
  const items = [
    { name: "Salários", desc: "3 founders + 6 FTE", total: "R$ 24 800", delta: "flat", deltaSign: "flat", width: 100, color: "var(--crm-neg)" },
    { name: "Marketing", desc: "ads + criativos", total: "R$ 8 460", delta: "↓ 6%", deltaSign: "pos", width: 34, color: "#A88A33" },
    { name: "Ferramentas", desc: "SaaS · 14 vendors", total: "R$ 4 920", delta: "↑ 17%", deltaSign: "neg", width: 20, color: "#6B3FA0" },
    { name: "Infra", desc: "Supabase, Vercel", total: "R$ 2 140", delta: "↑ 2%", deltaSign: "neg", width: 9, color: "var(--crm-info)" },
    { name: "Jurídico", desc: "advogado + contador", total: "R$ 950", delta: "flat", deltaSign: "flat", width: 4, color: "#5A5247" },
    { name: "Outros", desc: "", total: "R$ 550", delta: "↓ 31%", deltaSign: "pos", width: 2, color: "var(--crm-ink-4)" },
  ];
  return (
    <div className="crm-card">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Despesas por categoria · abr</div>
          <div className="crm-card-sub">R$ 41 820 / mês · 6 categorias</div>
        </div>
        <div className="crm-card-side"><a className="crm-btn crm-btn-link">Lançamentos →</a></div>
      </div>
      <div style={{ padding: "6px 20px 18px" }}>
        {items.map((it) => (
          <div key={it.name} style={{ padding: "12px 0", borderBottom: "1px solid var(--crm-line-soft)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--crm-ink)" }}>
                {it.name} <span style={{ fontWeight: 400, color: "var(--crm-ink-4)", fontSize: 11.5, marginLeft: 6 }}>{it.desc}</span>
              </div>
              <div className="crm-mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--crm-ink)" }}>
                {it.total} <span className={`crm-delta crm-delta-${it.deltaSign}`} style={{ fontSize: 11, fontWeight: 600, marginLeft: 8 }}>{it.delta}</span>
              </div>
            </div>
            <div style={{ height: 7, background: "var(--crm-surface-3)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${it.width}%`, background: it.color, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InadimplenciaCard() {
  const items = [
    { name: "Pedro Henrique Lacerda", email: "pedrolacerda@hotmail.com", val: "R$ 49,90", days: "+ 14 d" },
    { name: "Renata Caldas Vieira", email: "renata.caldas@medusp.br", val: "R$ 49,90", days: "+ 9 d" },
    { name: "Igor Sampaio", email: "igor.sampaio@gmail.com", val: "R$ 99,98", days: "+ 7 d" },
    { name: "Lara Moraes Coutinho", email: "lara.coutinho@residencia.org", val: "R$ 350,90", days: "+ 6 d" },
  ];
  return (
    <div className="crm-card">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Inadimplência <span className="crm-tag crm-tag-red" style={{ marginLeft: 4 }}>11 ativas</span></div>
          <div className="crm-card-sub">R$ 1 348 a recuperar · DSO médio 18 dias</div>
        </div>
        <div className="crm-card-side"><a className="crm-btn crm-btn-link">Cobranças →</a></div>
      </div>
      {items.map((it) => (
        <div key={it.email} style={{
          display: "grid", gridTemplateColumns: "1fr 90px 90px",
          gap: 14, alignItems: "center", padding: "10px 16px",
          borderBottom: "1px solid var(--crm-line-soft)",
        }}>
          <div>
            <div style={{ fontSize: 12.5, color: "var(--crm-ink)", fontWeight: 500 }}>{it.name}</div>
            <div style={{ fontSize: 11, color: "var(--crm-ink-4)" }}>{it.email}</div>
          </div>
          <div className="crm-mono" style={{ fontSize: 12.5, color: "var(--crm-ink)", textAlign: "right", fontWeight: 600 }}>{it.val}</div>
          <div className="crm-mono" style={{ fontSize: 11, textAlign: "right", color: "var(--crm-neg)", fontWeight: 600 }}>{it.days}</div>
        </div>
      ))}
    </div>
  );
}
