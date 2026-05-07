import CrmShellV3, { Kpi, PageHero, CardHead } from "@/components/crm/v3/CrmShellV3";
import { Plus } from "lucide-react";
import { useMembros } from "@/hooks/useTime";
import { useOneOnOnes, useOneOnOneAlerts } from "@/hooks/useOneOnOne";
import { useVagas, useContratacaoMetricas, useCandidatosByVaga } from "@/hooks/useContratacoes";
import { useFolhaConsolidada } from "@/hooks/useSalarios";
import { useState } from "react";

const fmtBRL = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

function initialsOf(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function colorOf(vinculo: string): string {
  if (vinculo === "socio" || vinculo === "founder") return "var(--crm-gold-deep)";
  return "var(--crm-green-deep)";
}

function fmtData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

export default function AdminTimeV3() {
  const { data: membros } = useMembros();
  const { data: folha } = useFolhaConsolidada();
  const { data: oneOnes } = useOneOnOnes();
  const { data: alerts } = useOneOnOneAlerts();
  const { data: vagas } = useVagas();
  const { data: metricas } = useContratacaoMetricas();

  const ativos = (membros ?? []).filter((m) => m.status === "ativo");
  const founders = ativos.filter((m) => m.vinculo === "socio" || m.vinculo === "founder");
  const fte = ativos.filter((m) => m.vinculo !== "socio" && m.vinculo !== "founder");

  // Salary map
  const salarioMap: Record<string, number> = {};
  (folha ?? []).forEach((f: any) => { salarioMap[f.membro_id] = f.salario_bruto; });
  const folhaTotal = (folha ?? []).reduce((s, f: any) => s + f.salario_bruto, 0);
  const custoFTE = fte.length > 0 ? Math.round((folhaTotal * 1.3) / fte.length) : 0;

  // 1:1 map
  const proximo1a1: Record<string, any> = {};
  (oneOnes ?? []).forEach((o: any) => {
    if (o.proxima_data && new Date(o.proxima_data) >= new Date()) {
      const cur = proximo1a1[o.membro_id];
      if (!cur || o.proxima_data < cur.proxima_data) proximo1a1[o.membro_id] = o;
    }
  });

  const proximos = (oneOnes ?? [])
    .filter((o: any) => o.proxima_data && new Date(o.proxima_data) >= new Date())
    .sort((a: any, b: any) => a.proxima_data.localeCompare(b.proxima_data))
    .slice(0, 8);

  const vagasAbertas = (vagas ?? []).filter((v: any) => v.status !== "encerrada");

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
        <PageHero
          eyebrow="Admin · People"
          title={<>Time <em>& saúde organizacional</em></>}
          sub={`${ativos.length} pessoas · ${founders.length} sócios · ${fte.length} FTE. Dados de admin_membros, admin_remuneracao, admin_oneonones e admin_vagas.`}
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Headcount" value={ativos.length} unit="pessoas" deltaText={`${founders.length} sócios · ${fte.length} FTE`} accent="mrr" />
          <Kpi label="Folha bruta" value={fmtBRL(folhaTotal)} deltaText={`${(folha ?? []).length} com remuneração`} />
          <Kpi label="Custo / FTE / mês" value={fmtBRL(custoFTE)} deltaText="≈30% encargos sobre CLT" />
          <Kpi label="Vagas abertas" value={vagasAbertas.length} deltaText={metricas?.tempoMedio ?? "—"} accent="warn" />
        </section>

        {/* People Grid */}
        <section className="crm-card" style={{ overflow: "hidden" }}>
          <CardHead
            title="Equipe ativa"
            sub={`${ativos.length} membros · clique no card para detalhes`}
            side={<a className="crm-btn crm-btn-link" href="/admin/crm-admin/salarios">Folha →</a>}
          />
          {ativos.length > 0 ? (
            <div className="crm-people-grid">
              {ativos.map((p) => {
                const sal = salarioMap[p.id] ?? 0;
                const prox = proximo1a1[p.id];
                return (
                  <div className="crm-person" key={p.id}>
                    <div className="crm-person-head">
                      <div className="crm-person-avatar" style={{ background: colorOf(p.vinculo) }}>{initialsOf(p.nome)}</div>
                      <div>
                        <div className="crm-person-name">{p.nome}</div>
                        <div className="crm-person-role">{p.cargo}{p.area ? ` · ${p.area}` : ""}</div>
                        <div className="crm-person-meta">
                          desde {fmtData(p.data_entrada)} · {p.vinculo}
                          {sal > 0 && ` · ${fmtBRL(sal)}`}
                          {p.cidade && ` · ${p.cidade}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px", paddingTop: 10, borderTop: "1px dashed var(--crm-line)" }}>
                      <div>
                        <div className="crm-mono" style={{ fontSize: 10, color: "var(--crm-ink-4)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Vínculo</div>
                        <div style={{ fontFamily: "var(--crm-sans)", fontSize: 13, fontWeight: 600, color: "var(--crm-ink)", marginTop: 1, textTransform: "capitalize" }}>{p.vinculo}</div>
                      </div>
                      <div>
                        <div className="crm-mono" style={{ fontSize: 10, color: "var(--crm-ink-4)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Próx 1:1</div>
                        <div style={{ fontFamily: "var(--crm-sans)", fontSize: 13, fontWeight: 600, color: "var(--crm-ink)", marginTop: 1 }}>
                          {prox ? new Date(prox.proxima_data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
              Nenhum membro ativo cadastrado em <code>admin_membros</code>.
            </div>
          )}
        </section>

        {/* 1:1s + Pendências */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div className="crm-card">
            <CardHead title="Próximos 1:1s" sub={`${proximos.length} agendados`} />
            {proximos.length > 0 ? (
              <div>
                {proximos.map((o: any) => {
                  const m = ativos.find((x) => x.id === o.membro_id);
                  const d = new Date(o.proxima_data);
                  return (
                    <div key={o.id} style={{
                      display: "grid", gridTemplateColumns: "80px 1fr 110px",
                      gap: 14, padding: "12px 16px",
                      borderBottom: "1px solid var(--crm-line-soft)",
                      alignItems: "center",
                    }}>
                      <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)" }}>
                        <strong style={{ display: "block", fontFamily: "var(--crm-sans)", fontSize: 14, fontWeight: 700, color: "var(--crm-ink)", letterSpacing: "-0.01em" }}>
                          {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </strong>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--crm-ink)" }}>
                          {m?.nome ?? "Membro"}{m?.cargo ? ` · ${m.cargo}` : ""}
                        </div>
                        {o.pauta && (
                          <div style={{ fontFamily: "var(--crm-serif)", fontStyle: "italic", fontSize: 12.5, color: "var(--crm-ink-3)", marginTop: 3, lineHeight: 1.4 }}>"{o.pauta}"</div>
                        )}
                      </div>
                      <div>
                        <span className={`crm-tag crm-tag-${o.pauta ? "green" : "warn"}`}><span className="crm-tag-dot" />{o.pauta ? "Pauta pronta" : "Sem pauta"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: 32, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
                Nenhum 1:1 futuro agendado.
              </div>
            )}
          </div>

          <div className="crm-card">
            <CardHead title="Pendências de 1:1" sub={`${(alerts ?? []).length} membros sem 1:1 há > 14 dias`} />
            {(alerts ?? []).length > 0 ? (
              <table className="crm-tbl">
                <thead><tr><th>Membro</th><th>Cargo</th><th>Último 1:1</th></tr></thead>
                <tbody>
                  {(alerts ?? []).map((a: any) => (
                    <tr key={a.membro_id}>
                      <td className="lead-name">{a.nome}</td>
                      <td className="muted">{a.cargo ?? "—"}</td>
                      <td className="muted">{a.dias_desde_ultimo ? `${a.dias_desde_ultimo} dias` : "nunca"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 32, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
                Sem pendências — todo time com 1:1 recente.
              </div>
            )}
          </div>
        </section>

        {/* Hiring Pipeline */}
        <HiringPipelineSection vagas={vagasAbertas} metricas={metricas} />
      </main>
    </CrmShellV3>
  );
}

function HiringPipelineSection({ vagas, metricas }: { vagas: any[]; metricas: any }) {
  const [selectedVaga, setSelectedVaga] = useState<string | null>(vagas[0]?.id ?? null);
  const { data: candidatos } = useCandidatosByVaga(selectedVaga ?? undefined);

  // Group candidatos by etapa
  const stages = ["sourcing", "triagem", "tech", "cultural", "oferta"];
  const stageLabels: Record<string, string> = {
    sourcing: "Sourcing", triagem: "Triagem", tech: "Tech / Case", cultural: "Cultural", oferta: "Oferta",
  };
  const byStage: Record<string, any[]> = {};
  stages.forEach((s) => { byStage[s] = []; });
  (candidatos ?? []).forEach((c: any) => {
    const key = (c.etapa || "sourcing").toLowerCase();
    if (byStage[key]) byStage[key].push(c);
    else (byStage.sourcing ??= []).push(c);
  });

  return (
    <section className="crm-card">
      <CardHead
        title={`Pipeline de contratação · ${vagas.length} vagas abertas`}
        sub={`${metricas?.candidatosEmProcesso ?? 0} candidatos no funil · tempo médio ${metricas?.tempoMedio ?? "—"}`}
        side={
          vagas.length > 0 ? (
            <select
              className="crm-btn crm-btn-ghost"
              value={selectedVaga ?? ""}
              onChange={(e) => setSelectedVaga(e.target.value || null)}
            >
              {vagas.map((v: any) => <option key={v.id} value={v.id}>{v.titulo}</option>)}
            </select>
          ) : undefined
        }
      />
      {vagas.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
          Nenhuma vaga aberta em <code>admin_vagas</code>.
        </div>
      ) : (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
          gap: 1, background: "var(--crm-line)",
          borderRadius: "var(--crm-radius)", overflow: "hidden",
          margin: "4px 18px 18px",
        }}>
          {stages.map((s) => {
            const cards = byStage[s];
            return (
              <div key={s} style={{ background: "var(--crm-surface-2)", padding: "12px 12px 14px", minHeight: 320 }}>
                <h4 style={{
                  margin: "0 0 10px",
                  fontFamily: "var(--crm-sans)", fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.07em", textTransform: "uppercase",
                  color: "var(--crm-ink-4)",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  {stageLabels[s]}
                  <span className="crm-mono" style={{
                    fontSize: 11, color: "var(--crm-ink-3)",
                    background: "var(--crm-surface)", padding: "2px 7px",
                    borderRadius: 999, border: "1px solid var(--crm-line)",
                  }}>{cards.length}</span>
                </h4>
                {cards.length === 0 ? (
                  <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-5)", textAlign: "center", padding: 20 }}>—</div>
                ) : cards.map((c: any) => (
                  <div key={c.id} style={{
                    background: "var(--crm-surface)",
                    border: "1px solid var(--crm-line)",
                    borderRadius: 6, padding: "10px 12px", marginBottom: 8,
                    cursor: "pointer",
                  }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--crm-ink)" }}>{c.nome}</div>
                    {c.fonte && <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)", marginTop: 2 }}>{c.fonte}</div>}
                    {c.fit_cultural !== null && c.fit_cultural !== undefined && (
                      <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                        <span className="crm-mono" style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, background: "var(--crm-surface-2)", color: "var(--crm-ink-3)" }}>fit {c.fit_cultural}/10</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
