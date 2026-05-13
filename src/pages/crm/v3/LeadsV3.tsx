import { useState } from "react";
import CrmShellV3 from "@/components/crm/v3/CrmShellV3";
import { Search, Plus, Download, Filter, Columns, MoreHorizontal, MessageSquare } from "lucide-react";
import { useLeads, useDashboardKpis } from "@/hooks/useCrm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/crm/supabase";
import type { CrmLead, LeadStatus } from "@/lib/crm/types";

const STATUS_TAG: Record<LeadStatus, "green" | "blue" | "warn" | "gray" | "red"> = {
  visitor: "gray",
  signup: "blue",
  active_trial: "blue",
  engaged: "green",
  subscriber: "green",
  churned: "red",
  win_back: "warn",
};

const STATUS_LABEL: Record<LeadStatus, string> = {
  visitor: "Visitor",
  signup: "Signup",
  active_trial: "Trial ativo",
  engaged: "Engajado",
  subscriber: "Assinante",
  churned: "Churn",
  win_back: "Win-back",
};

function fmtAtividade(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "agora";
  if (diff < 3_600_000) return `há ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `há ${Math.floor(diff / 3_600_000)} h`;
  return `há ${Math.floor(diff / 86_400_000)} dias`;
}

const fmt = (v: number) => v.toLocaleString("pt-BR");

// Conta leads por status DIRETO da tabela crm_leads + assinantes ativos reais de subscriptions
function useStageCounts() {
  return useQuery({
    queryKey: ["crm", "stage-counts-real"],
    queryFn: async () => {
      const statuses: LeadStatus[] = ["visitor", "signup", "active_trial", "engaged", "subscriber", "churned", "win_back"];
      const counts: Record<string, number> = {};

      // Conta crm_leads por status
      await Promise.all(statuses.map(async (s) => {
        const { count } = await supabase.from("crm_leads").select("*", { count: "exact", head: true }).eq("status", s);
        counts[s] = count ?? 0;
      }));

      // Override "subscriber" com contagem real de subscriptions ativas e não expiradas
      const nowIso = new Date().toISOString();
      const { data: activeSubs } = await supabase
        .from("subscriptions")
        .select("user_id, status, plan_type, access_expires_at")
        .eq("status", "active")
        .in("plan_type", ["monthly", "annual", "biannual"]);

      const realActive = (activeSubs ?? []).filter((s: any) => !s.access_expires_at || s.access_expires_at > nowIso).length;
      counts.subscriber_real = realActive;

      return counts;
    },
    refetchInterval: 60_000,
  });
}

export default function LeadsV3() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | undefined>(undefined);
  const [page] = useState(1);
  const [selected, setSelected] = useState<CrmLead | null>(null);

  const { data } = useLeads({ status: statusFilter, search: search || undefined, page });
  const { data: stages } = useStageCounts();
  const { data: kpis } = useDashboardKpis();

  const leads: CrmLead[] = data?.leads ?? [];
  const total = data?.total ?? 0;

  // Stage pills com dados reais do DB
  const agg = {
    visitors: stages?.visitor ?? 0,
    signups: stages?.signup ?? 0,
    active_trials: stages?.active_trial ?? 0,
    engaged: stages?.engaged ?? 0,
    subscribers: stages?.subscriber_real ?? 0,
    subscribers_lead: stages?.subscriber ?? 0, // crm_leads.status='subscriber' (pode ter stale)
    churned: stages?.churned ?? 0,
    win_back: stages?.win_back ?? 0,
  };

  const cur = selected ?? leads[0] ?? null;

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
          <h1 className="crm-page-title">{fmt(kpis?.totalLeads ?? total)} leads <em>vivos no banco</em></h1>
          <p className="crm-page-sub">
            Score de 0–100 calculado pelo backend (lead-score edge function). Lista paginada de crm_leads ordenada por lead_score desc.
          </p>
        </div>

        {/* Stage pills */}
        <div className="crm-card" style={{ overflow: "hidden" }}>
          <div className="crm-mobile-scroll-x" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            <StagePill label="Visitor" val={fmt(agg.visitors)} pct="crm_leads" onClick={() => setStatusFilter(undefined)} active={!statusFilter} />
            <StagePill label="Signup" val={fmt(agg.signups)} pct="status=signup" onClick={() => setStatusFilter("signup")} active={statusFilter === "signup"} />
            <StagePill label="Trial ativo" val={fmt(agg.active_trials)} pct="status=active_trial" onClick={() => setStatusFilter("active_trial")} active={statusFilter === "active_trial"} />
            <StagePill label="Engajado" val={fmt(agg.engaged)} pct="status=engaged" onClick={() => setStatusFilter("engaged")} active={statusFilter === "engaged"} />
            <StagePill label="Assinante" val={fmt(agg.subscribers)} pct="subscriptions ativas" onClick={() => setStatusFilter("subscriber")} active={statusFilter === "subscriber"} />
            <StagePill label="Churn" val={fmt(agg.churned)} pct={`${kpis?.churnRate ?? 0}% / mês`} valColor="var(--crm-neg)" onClick={() => setStatusFilter("churned")} active={statusFilter === "churned"} />
            <StagePill label="Win-back" val={fmt(agg.win_back)} pct="status=win_back" onClick={() => setStatusFilter("win_back")} active={statusFilter === "win_back"} />
          </div>
          {agg.subscribers !== agg.subscribers_lead && (
            <div style={{ padding: "8px 14px", fontSize: 11, color: "var(--crm-ink-4)", borderTop: "1px solid var(--crm-line-soft)", background: "var(--crm-surface-2)" }}>
              <strong style={{ color: "var(--crm-ink-3)" }}>Nota:</strong> {agg.subscribers} assinantes ativos reais (subscriptions com status=active, não expirados). {agg.subscribers_lead} estão marcados como <code>subscriber</code> em crm_leads — pode haver lag de sincronização.
            </div>
          )}
        </div>

        <div className="crm-mobile-stack" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, alignItems: "flex-start" }}>
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
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
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

              {leads.length > 0 ? (
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
                    {leads.map((l) => (
                      <tr
                        key={l.id}
                        onClick={() => setSelected(l)}
                        style={{
                          background: cur?.id === l.id ? "var(--crm-green-tint)" : undefined,
                          cursor: "pointer",
                        }}
                      >
                        <td><input type="checkbox" /></td>
                        <td>
                          <div className="lead-name">{l.nome ?? l.email}</div>
                          <div className="lead-email">{l.email}</div>
                        </td>
                        <td>
                          <div className="crm-score">
                            <div className="crm-score-bar" style={{ ["--score" as never]: `${l.lead_score}%` }} />
                            <span className="crm-score-num">{l.lead_score}</span>
                          </div>
                        </td>
                        <td><span className={`crm-tag crm-tag-${STATUS_TAG[l.status]}`}><span className="crm-tag-dot" />{STATUS_LABEL[l.status]}</span></td>
                        <td className="muted">{l.fase_medica ?? "—"}</td>
                        <td><span className="crm-tag crm-tag-outline-green">{l.produto_interesse}</span></td>
                        <td>
                          <div className="muted crm-mono" style={{ fontSize: 12 }}>{l.utm_source ?? "direct"}</div>
                          <div className="muted" style={{ fontSize: 11 }}>{l.utm_campaign ?? "—"}</div>
                        </td>
                        <td className="muted crm-mono">{fmtAtividade(l.last_activity_at)}</td>
                        <td><button className="crm-btn-icon"><MoreHorizontal /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
                  Sem leads para os filtros atuais.
                </div>
              )}

              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", fontSize: 12, color: "var(--crm-ink-4)",
                borderTop: "1px solid var(--crm-line)",
              }}>
                <span>Mostrando <strong className="crm-strong">1–{leads.length}</strong> de <strong className="crm-strong">{fmt(total)}</strong> leads</span>
              </div>
            </div>
          </div>

          {/* Drawer */}
          <aside className="crm-card" style={{ position: "sticky", top: 76 }}>
            {cur ? (
              <>
                <div style={{ padding: "16px 16px 14px", borderBottom: "1px solid var(--crm-line-soft)" }}>
                  <div className="crm-mono" style={{ fontSize: 10.5, color: "var(--crm-ink-4)", letterSpacing: "0.04em" }}>LEAD #{String(cur.id).slice(0, 8)}</div>
                  <div style={{ fontFamily: "var(--crm-sans)", fontSize: 18, fontWeight: 700, color: "var(--crm-ink)", letterSpacing: "-0.015em", marginTop: 4, lineHeight: 1.15 }}>{cur.nome ?? cur.email}</div>
                  <div style={{ fontSize: 12, color: "var(--crm-ink-3)", marginTop: 2 }}>{cur.email}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <span className={`crm-tag crm-tag-${STATUS_TAG[cur.status]}`}><span className="crm-tag-dot" />{STATUS_LABEL[cur.status]}</span>
                    <span className="crm-tag crm-tag-outline-green">{cur.produto_interesse}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--crm-line-soft)", background: "var(--crm-surface-2)" }}>
                  <ScoreRing score={cur.lead_score} />
                  <div>
                    <div className="crm-strong" style={{ fontFamily: "var(--crm-sans)", fontSize: 13 }}>
                      {cur.lead_score >= 80 ? "Hot lead" : cur.lead_score >= 60 ? "Warm lead" : "Cold lead"}
                    </div>
                    <div className="crm-muted" style={{ fontSize: 11.5, lineHeight: 1.4 }}>
                      Score de <strong className="crm-strong">{cur.lead_score}/100</strong> calculado pela edge function lead-score.
                    </div>
                  </div>
                </div>

                <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--crm-line-soft)" }}>
                  <h4 style={{ fontFamily: "var(--crm-sans)", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--crm-ink-4)", margin: "0 0 8px" }}>Origem</h4>
                  <dl style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: "6px 10px", fontSize: 12, margin: 0 }}>
                    <dt style={{ color: "var(--crm-ink-4)" }}>Source</dt>
                    <dd style={{ margin: 0, color: "var(--crm-ink)", fontWeight: 500 }} className="crm-mono">{cur.utm_source ?? "direct"}</dd>
                    <dt style={{ color: "var(--crm-ink-4)" }}>Campanha</dt>
                    <dd style={{ margin: 0, color: "var(--crm-ink)", fontWeight: 500 }} className="crm-mono">{cur.utm_campaign ?? "—"}</dd>
                    <dt style={{ color: "var(--crm-ink-4)" }}>Fase</dt>
                    <dd style={{ margin: 0, color: "var(--crm-ink)", fontWeight: 500 }}>{cur.fase_medica ?? "—"}</dd>
                    {cur.faculdade && <>
                      <dt style={{ color: "var(--crm-ink-4)" }}>Faculdade</dt>
                      <dd style={{ margin: 0, color: "var(--crm-ink)", fontWeight: 500 }}>{cur.faculdade}</dd>
                    </>}
                  </dl>
                </div>

                <div style={{ padding: "14px 16px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button className="crm-btn crm-btn-primary"><MessageSquare size={13} /> Mensagem</button>
                  <button className="crm-btn crm-btn-ghost">Acionar playbook</button>
                </div>
              </>
            ) : (
              <div style={{ padding: 48, textAlign: "center", color: "var(--crm-ink-4)", fontSize: 13 }}>
                Selecione um lead para ver detalhes.
              </div>
            )}
          </aside>
        </div>
      </main>
    </CrmShellV3>
  );
}

function StagePill({ label, val, pct, active, valColor, onClick }: { label: string; val: string; pct: string; active?: boolean; valColor?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{
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
