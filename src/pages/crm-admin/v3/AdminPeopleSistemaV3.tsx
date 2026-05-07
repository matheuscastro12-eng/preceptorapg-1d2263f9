import { useState } from "react";
import CrmShellV3, { Kpi, PageHero, PeriodBar, CardHead } from "@/components/crm/v3/CrmShellV3";
import { Plus, Calendar, Edit3, Trophy, Briefcase, Settings, Activity, CheckCircle2 } from "lucide-react";
import { useMembros } from "@/hooks/useTime";
import { useOneOnOnes, useOneOnOneAlerts } from "@/hooks/useOneOnOne";
import { usePDIs, usePDIStats } from "@/hooks/usePDI";
import { useTrilhas, usePosicoes, usePromocoesTrimestrais } from "@/hooks/useCarreira";
import { useVagas, useContratacaoMetricas } from "@/hooks/useContratacoes";
import { useFolhaConsolidada, useProjecaoFolha } from "@/hooks/useSalarios";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const fmtBRL = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtBRL2 = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* =========================================================
   ONE ON ONE
   ========================================================= */
export function OneOnOneV3() {
  const { data: oneOnes } = useOneOnOnes();
  const { data: alerts } = useOneOnOneAlerts();
  const { data: membros } = useMembros();

  const ativos = (membros ?? []).filter((m: any) => m.status === "ativo");
  const proximos = (oneOnes ?? []).filter((o: any) => o.proxima_data && new Date(o.proxima_data) >= new Date()).sort((a: any, b: any) => a.proxima_data.localeCompare(b.proxima_data));

  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "1:1s" }]}
      topbarTools={<><button className="crm-btn crm-btn-primary"><Plus size={13} /> Agendar 1:1</button></>}
    >
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · People · 1:1 quinzenal"
          title={<>Próximos <em>1:1s</em></>}
          sub="Ciclo quinzenal com cada membro do time. Atualizado via tabela admin_oneonones."
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <Kpi label="Membros ativos" value={ativos.length} deltaText="elegíveis para 1:1" accent="mrr" />
          <Kpi label="Próximos agendados" value={proximos.length} deltaText="≥ hoje" />
          <Kpi label="Pendentes" value={alerts?.length ?? 0} deltaText="sem 1:1 há > 14 dias" accent="warn" />
        </section>

        {proximos.length > 0 ? proximos.map((o: any) => {
          const d = new Date(o.proxima_data);
          const date = d.getDate();
          const month = d.toLocaleString("pt-BR", { month: "short" }).replace(".", "");
          const membro = ativos.find((m: any) => m.id === o.membro_id);
          return (
            <section key={o.id} className="crm-card">
              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr auto", gap: 18, padding: "16px 20px", alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--crm-sans)", fontSize: 24, fontWeight: 700, color: "var(--crm-ink)", lineHeight: 1, letterSpacing: "-0.02em" }}>{date}</div>
                  <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{month}</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--crm-ink)" }}>
                    {membro?.nome ?? "Membro"} {membro?.cargo ? `· ${membro.cargo}` : ""}
                  </div>
                  {o.pauta && (
                    <div style={{ fontFamily: "var(--crm-serif)", fontStyle: "italic", fontSize: 13.5, color: "var(--crm-ink-3)", marginTop: 4, lineHeight: 1.45 }}>"{o.pauta}"</div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                  <span className={`crm-tag crm-tag-${o.pauta ? "green" : "warn"}`}><span className="crm-tag-dot" />{o.pauta ? "Pauta pronta" : "Sem pauta"}</span>
                  <button className="crm-btn crm-btn-ghost"><Edit3 size={12} /> Pauta</button>
                </div>
              </div>
            </section>
          );
        }) : (
          <section className="crm-card">
            <div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
              Nenhum 1:1 agendado. Use o botão "Agendar 1:1" para criar.
            </div>
          </section>
        )}

        {alerts && alerts.length > 0 && (
          <section className="crm-card">
            <CardHead title="Pendências · membros sem 1:1 recente" sub={`${alerts.length} pessoas sem 1:1 há mais de 14 dias`} />
            <table className="crm-tbl">
              <thead><tr><th>Membro</th><th>Cargo</th><th>Último 1:1</th></tr></thead>
              <tbody>
                {alerts.map((a: any) => (
                  <tr key={a.membro_id}>
                    <td className="lead-name">{a.nome}</td>
                    <td className="muted">{a.cargo ?? "—"}</td>
                    <td className="muted">{a.dias_desde_ultimo ? `${a.dias_desde_ultimo} dias` : "nunca"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   PDI
   ========================================================= */
export function PDIV3() {
  const { data: stats } = usePDIStats();
  const { data: membros } = useMembros();
  const { data: promocoes } = usePromocoesTrimestrais();

  const ativos = (membros ?? []).filter((m: any) => m.status === "ativo");

  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "PDIs" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · People"
          title={<>Planos de <em>desenvolvimento</em></>}
          sub="Cada membro tem 3-5 metas trimestrais. Acompanhamento nas 1:1s e revisão de fechamento ao final do trimestre."
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <Kpi label="PDIs ativos" value={stats?.ativos ?? 0} deltaText="status=ativo" />
          <Kpi label="Membros elegíveis" value={ativos.length} deltaText="status=ativo" accent="mrr" />
          <Kpi label="Promoções no trimestre" value={promocoes ?? 0} deltaText="atual" accent="warn" />
        </section>

        <section className="crm-card">
          <CardHead title="Membros · clique para ver/editar PDI" sub={`${ativos.length} membros ativos`} />
          {ativos.length > 0 ? (
            <table className="crm-tbl">
              <thead><tr><th>Nome</th><th>Cargo</th><th>Área</th></tr></thead>
              <tbody>
                {ativos.map((m: any) => (
                  <tr key={m.id}>
                    <td className="lead-name">{m.nome}</td>
                    <td className="muted">{m.cargo ?? "—"}</td>
                    <td className="muted">{m.area ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
              Nenhum membro ativo cadastrado.
            </div>
          )}
        </section>

      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   CARREIRA
   ========================================================= */
export function CarreiraV3() {
  const { data: trilhas } = useTrilhas();
  const { data: posicoes } = usePosicoes();
  const { data: membros } = useMembros();
  const { data: promocoes } = usePromocoesTrimestrais();

  // Group trilhas by area
  const areas: Record<string, any[]> = {};
  (trilhas ?? []).forEach((t: any) => {
    (areas[t.area] ??= []).push(t);
  });

  // Map membro to current posicao
  const posByMembro: Record<string, any> = {};
  (posicoes ?? []).forEach((p: any) => { posByMembro[p.membro_id] = p; });
  const membrosByTrilha: Record<string, string[]> = {};
  (membros ?? []).forEach((m: any) => {
    const pos = posByMembro[m.id];
    if (pos) (membrosByTrilha[pos.trilha_id] ??= []).push(m.nome);
  });

  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Carreira & promoções" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · Carreira"
          title={<>Trilhas de <em>carreira</em></>}
          sub="Níveis salariais por trilha, critérios de promoção e ciclo de revisão."
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <Kpi label="Trilhas cadastradas" value={(trilhas ?? []).length} deltaText={`${Object.keys(areas).length} áreas`} accent="mrr" />
          <Kpi label="Posições ativas" value={(posicoes ?? []).length} deltaText="membros em trilha" />
          <Kpi label="Promoções no trimestre" value={promocoes ?? 0} deltaText="atual" accent="warn" />
        </section>

        {Object.keys(areas).length === 0 ? (
          <section className="crm-card">
            <div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
              Nenhuma trilha cadastrada.
            </div>
          </section>
        ) : Object.entries(areas).map(([area, ts]) => (
          <section key={area} className="crm-card">
            <CardHead title={`Trilha · ${area}`} sub={`${ts.length} níveis`} />
            <table className="crm-tbl">
              <thead><tr><th>Nível</th><th>Título</th><th>Faixa salarial</th><th>Pessoas</th></tr></thead>
              <tbody>
                {ts.map((t: any) => (
                  <tr key={t.id}>
                    <td className="lead-name">L{t.nivel}</td>
                    <td className="muted">{t.titulo}</td>
                    <td className="num">
                      {t.salario_min ? fmtBRL(t.salario_min) : "—"}
                      {t.salario_max ? ` – ${fmtBRL(t.salario_max)}` : ""}
                    </td>
                    <td className="muted">{(membrosByTrilha[t.id] ?? []).join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   CONTRATAÇÕES
   ========================================================= */
export function ContratacoesV3() {
  const { data: vagas } = useVagas();
  const { data: metricas } = useContratacaoMetricas();

  const abertas = (vagas ?? []).filter((v: any) => v.status !== "encerrada");
  const diasAberta = (data: string) => Math.floor((Date.now() - new Date(data).getTime()) / 86400000);

  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Contratações" }]}
      topbarTools={<><button className="crm-btn crm-btn-primary"><Plus size={13} /> Nova vaga</button></>}
    >
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · Hiring"
          title={<>{abertas.length} vagas <em>abertas</em></>}
          sub="Pipeline de candidatos por vaga. Atualizado via tabelas admin_vagas e admin_candidatos."
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Vagas abertas" value={metricas?.vagasAbertas ?? 0} deltaText="status ≠ encerrada" accent="warn" />
          <Kpi label="Candidatos em processo" value={metricas?.candidatosEmProcesso ?? 0} deltaText="ativos no funil" />
          <Kpi label="Tempo médio fechamento" value={metricas?.tempoMedio ?? "—"} deltaText="vagas encerradas" accent="mrr" />
          <Kpi label="Taxa aprovação" value={`${metricas?.taxaAprovacao ?? 0}%`} deltaText="aprovados / total" />
        </section>

        <section className="crm-card">
          <CardHead title="Vagas abertas" sub={`${abertas.length} vagas`} />
          {abertas.length > 0 ? (
            <table className="crm-tbl">
              <thead><tr><th>Vaga</th><th>Área</th><th>Vínculo</th><th>Faixa salarial</th><th>Aberta há</th><th>Candidatos</th><th>Urgência</th></tr></thead>
              <tbody>
                {abertas.map((v: any) => (
                  <tr key={v.id}>
                    <td className="lead-name">{v.titulo}</td>
                    <td className="muted">{v.area}</td>
                    <td><span className="crm-tag crm-tag-gray"><span className="crm-tag-dot" />{v.vinculo_desejado}</span></td>
                    <td className="num">
                      {v.faixa_min ? fmtBRL(v.faixa_min) : "—"}
                      {v.faixa_max ? ` – ${fmtBRL(v.faixa_max)}` : ""}
                    </td>
                    <td className="muted">{diasAberta(v.data_abertura)} dias</td>
                    <td className="num">{v.candidatos_count ?? 0}</td>
                    <td><span className={`crm-tag crm-tag-${v.urgencia === "alta" ? "warn" : "green"}`}><span className="crm-tag-dot" />{v.urgencia}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
              Nenhuma vaga aberta. Use "Nova vaga" para criar.
            </div>
          )}
        </section>
      </main>
    </CrmShellV3>
  );
}

/* =========================================================
   SALÁRIOS
   ========================================================= */
export function SalariosV3() {
  const { data: folha } = useFolhaConsolidada();
  const { data: projecao } = useProjecaoFolha();

  const linhas = folha ?? [];
  const totalBruto = linhas.reduce((s, r) => s + r.salario_bruto, 0);
  const clt = linhas.filter((r) => r.modelo_pagamento === "clt");
  const pj = linhas.filter((r) => r.modelo_pagamento === "pj");
  const socio = linhas.filter((r) => r.modelo_pagamento === "socio" || r.modelo_pagamento === "pro_labore");
  const totalCLT = clt.reduce((s, r) => s + r.salario_bruto, 0);
  const encargos = totalCLT * 0.3;
  const custoTotal = totalBruto + encargos;

  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Salários" }]}>
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · Folha"
          title={<>Folha <em>de pagamento</em></>}
          sub="Salários, encargos e equity. Atualizado via tabela admin_remuneracao."
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Folha bruta" value={fmtBRL(totalBruto)} deltaText={`${linhas.length} pessoas`} accent="mrr" />
          <Kpi label="CLT" value={fmtBRL(totalCLT)} deltaText={`${clt.length} pessoas`} />
          <Kpi label="Encargos (≈30%)" value={fmtBRL(encargos)} deltaText="estimativa CLT" accent="warn" />
          <Kpi label="Custo total" value={fmtBRL(custoTotal)} deltaText="bruto + encargos" accent="neg" />
        </section>

        <section className="crm-card">
          <CardHead title="Folha consolidada" sub={`${linhas.length} pessoas · ${socio.length} sócios + ${clt.length} CLT + ${pj.length} PJ`} />
          {linhas.length > 0 ? (
            <table className="crm-tbl">
              <thead><tr><th>Pessoa</th><th>Cargo</th><th>Área</th><th>Modelo</th><th style={{ textAlign: "right" }}>Salário bruto</th><th style={{ textAlign: "right" }}>Equity %</th></tr></thead>
              <tbody>
                {linhas.map((r) => (
                  <tr key={r.membro_id}>
                    <td className="lead-name">{r.nome}</td>
                    <td className="muted">{r.cargo}</td>
                    <td className="muted">{r.area}</td>
                    <td><span className={`crm-tag crm-tag-${r.modelo_pagamento === "socio" || r.modelo_pagamento === "pro_labore" ? "gold" : r.modelo_pagamento === "clt" ? "green" : "blue"}`}><span className="crm-tag-dot" />{r.modelo_pagamento}</span></td>
                    <td className="num">{fmtBRL(r.salario_bruto)}</td>
                    <td className="num muted">{r.equity_percentual ? `${r.equity_percentual}%` : "—"}</td>
                  </tr>
                ))}
                <tr style={{ background: "var(--crm-surface-2)" }}>
                  <td colSpan={4} style={{ fontFamily: "var(--crm-sans)", fontWeight: 700 }}>Total</td>
                  <td className="num"><strong>{fmtBRL(totalBruto)}</strong></td>
                  <td />
                </tr>
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
              Nenhum membro com remuneração cadastrada.
            </div>
          )}
        </section>

        {projecao && projecao.length > 0 && (
          <section className="crm-card">
            <CardHead title="Projeção · próximos 3 meses" sub="baseado na folha atual (sem reajustes)" />
            <table className="crm-tbl">
              <thead><tr><th>Mês</th><th style={{ textAlign: "right" }}>Folha projetada</th></tr></thead>
              <tbody>
                {projecao.map((p: any) => (
                  <tr key={p.mes}>
                    <td className="muted">{p.mes}</td>
                    <td className="num"><strong>{fmtBRL(p.valor)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
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
function useWebhookEvents() {
  return useQuery({
    queryKey: ["crm-admin", "webhook-events"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("webhook_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      return (data ?? []) as any[];
    },
  });
}

export function WebhooksV3() {
  const { data: events } = useWebhookEvents();
  const lista = events ?? [];

  const last24h = new Date(Date.now() - 24 * 3600000).toISOString();
  const eventos24h = lista.filter((e) => e.created_at >= last24h);
  const sucessos = lista.filter((e) => e.processed === true && !e.error_message).length;
  const falhas = lista.filter((e) => e.processed === false || !!e.error_message).length;
  const taxaSucesso = lista.length > 0 ? ((sucessos / lista.length) * 100).toFixed(1) : "—";

  // agregação por provider
  const providers: Record<string, number> = {};
  lista.forEach((e) => { providers[e.provider] = (providers[e.provider] ?? 0) + 1; });

  const fmtWhen = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60000) return "agora";
    if (diff < 3600000) return `há ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `há ${Math.floor(diff / 3600000)}h`;
    return `há ${Math.floor(diff / 86400000)}d`;
  };

  return (
    <CrmShellV3 mode="admin" crumbs={[{ label: "CRM" }, { label: "Admin" }, { label: "Webhooks" }]}
      topbarTools={<><button className="crm-btn crm-btn-primary"><Plus size={13} /> Novo webhook</button></>}
    >
      <main className="crm-page">
        <PageHero
          eyebrow="Admin · Sistema · Webhooks"
          title={<>Logs de <em>webhooks</em></>}
          sub="Histórico real de webhook_events. EasyFlow, Stripe, Resend e outros providers que escrevem na tabela."
        />

        <section className="crm-kpi-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Kpi label="Eventos 24h" value={eventos24h.length} accent="mrr" />
          <Kpi label="Total cadastrado" value={lista.length} deltaText="últimos 200 logs" />
          <Kpi label="Taxa sucesso" value={`${taxaSucesso}%`} accent={Number(taxaSucesso) >= 95 ? "mrr" : "warn"} />
          <Kpi label="Falhas" value={falhas} deltaText={`em ${lista.length} eventos`} accent={falhas > 0 ? "neg" : undefined} />
        </section>

        {Object.keys(providers).length > 0 && (
          <section className="crm-card">
            <CardHead title="Por provider" sub="distribuição de eventos por origem" />
            <div className="crm-card-pad" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {Object.entries(providers).map(([p, c]) => (
                <div key={p} style={{ padding: "10px 14px", background: "var(--crm-surface-2)", border: "1px solid var(--crm-line)", borderRadius: 6 }}>
                  <div className="crm-mono" style={{ fontSize: 11, color: "var(--crm-ink-4)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>{p}</div>
                  <div style={{ fontFamily: "var(--crm-sans)", fontSize: 20, fontWeight: 700, color: "var(--crm-ink)", marginTop: 4 }}>{c}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="crm-card">
          <CardHead title="Logs recentes" sub={`${lista.length} eventos · clique para ver payload`} />
          {lista.length > 0 ? (
            <table className="crm-tbl">
              <thead><tr><th>Evento</th><th>Provider</th><th>Status</th><th>Erro</th><th>Quando</th><th></th></tr></thead>
              <tbody>
                {lista.slice(0, 50).map((r) => (
                  <tr key={r.id}>
                    <td><code style={{ background: "var(--crm-surface-2)", padding: "2px 8px", borderRadius: 3, fontFamily: "var(--crm-mono)", fontSize: 12, color: "var(--crm-green-deep)" }}>{r.event_type}</code></td>
                    <td><span className="crm-tag crm-tag-gray"><span className="crm-tag-dot" />{r.provider}</span></td>
                    <td>
                      <span className={`crm-tag crm-tag-${r.processed && !r.error_message ? "green" : "red"}`}>
                        <span className="crm-tag-dot" />{r.processed && !r.error_message ? "ok" : "falha"}
                      </span>
                    </td>
                    <td className="muted" style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.error_message ?? "—"}</td>
                    <td className="muted">{fmtWhen(r.created_at)}</td>
                    <td><button className="crm-btn-icon" title={JSON.stringify(r.payload).slice(0, 200)}><Activity /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
              Sem eventos em <code>webhook_events</code> ainda. Aguarde os primeiros disparos do EasyFlow/Stripe.
            </div>
          )}
        </section>
      </main>
    </CrmShellV3>
  );
}
