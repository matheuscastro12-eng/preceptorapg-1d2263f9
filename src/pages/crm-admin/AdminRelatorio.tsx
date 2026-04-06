import { useState } from "react";
import {
  FileBarChart, DollarSign, Users, TrendingDown, TrendingUp, Target,
  Heart, Zap, Plus, X, Loader2, Trash2, Edit2, Sparkles, ChevronDown,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import MetricCard from "@/components/crm/MetricCard";
import { useRelatorios, useUpsertRelatorio, useDeleteRelatorio, useAutoFillRelatorio } from "@/hooks/useRelatorioInvestidor";
import { useBPHighlights } from "@/hooks/useBPHighlights";
import type { RelatorioInsert, Relatorio } from "@/hooks/useRelatorioInvestidor";

const MESES = ["", "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function fmtCurrency(v: number) { return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`; }

export default function AdminRelatorio() {
  const { data: relatorios, isLoading } = useRelatorios();
  const { data: bp } = useBPHighlights(2026);
  const upsert = useUpsertRelatorio();
  const deleteRel = useDeleteRelatorio();

  const [showForm, setShowForm] = useState(false);
  const [editingRel, setEditingRel] = useState<Relatorio | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const latest = (relatorios ?? [])[0];

  // MRR history for chart
  const mrrHistory = [...(relatorios ?? [])].reverse().map((r) => ({
    label: `${MESES[r.mes]?.slice(0, 3) ?? r.mes}/${r.ano}`,
    mrr: r.mrr,
    arr: r.arr,
  }));

  if (isLoading) {
    return <div className="p-4 md:p-6 flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" /></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Relatorio para Investidor</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">Report mensal com KPIs e narrativa</p>
        </div>
        <button onClick={() => { setEditingRel(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#C9A84C] text-gray-900 hover:bg-yellow-500 transition-colors">
          <Plus className="w-3.5 h-3.5" />Novo Relatorio
        </button>
      </div>

      {/* Latest KPIs */}
      {latest && (
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
          <MetricCard title="MRR" value={latest.mrr} format="currency" icon={DollarSign} color="green" />
          <MetricCard title="ARR" value={latest.arr} format="currency" icon={TrendingUp} color="green" />
          <MetricCard title="Usuarios" value={latest.total_usuarios} icon={Users} color="blue" />
          <MetricCard title="Churn" value={`${latest.churn_rate}%`} icon={TrendingDown} color={latest.churn_rate > 10 ? "red" : "gold"} />
          <MetricCard title="CAC" value={latest.cac} format="currency" icon={Target} color="purple" />
          <MetricCard title="LTV" value={latest.ltv} format="currency" icon={Heart} color="green" />
          <MetricCard title="Burn Rate" value={latest.burn_rate} format="currency" icon={Zap} color="red" />
          <MetricCard title="Runway" value={`${latest.runway}m`} icon={FileBarChart} color={latest.runway < 3 ? "red" : "gold"} />
        </div>
      )}

      {/* MRR Chart */}
      {mrrHistory.length > 1 && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Evolucao MRR</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={mrrHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 11 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#f9fafb" }}
                formatter={(v: number) => [`R$ ${v.toFixed(2)}`]} />
              <Line type="monotone" dataKey="mrr" stroke="#16a34a" strokeWidth={2.5} dot={{ fill: "#16a34a", r: 4 }} name="MRR" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* BP Section */}
      {bp && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Business Plan — Projeção Atual</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-[9px] text-gray-500 uppercase">Receita Bruta</p>
              <p className="text-sm font-bold text-green-400">R$ {(bp.receitaBrutaMes / 1000).toFixed(0)}k</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-[9px] text-gray-500 uppercase">EBITDA</p>
              <p className="text-sm font-bold text-purple-400">R$ {(bp.ebitdaMes / 1000).toFixed(0)}k</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-[9px] text-gray-500 uppercase">Margem EBITDA</p>
              <p className="text-sm font-bold text-[#C9A84C]">{bp.margemEbitda}%</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-[9px] text-gray-500 uppercase">Lucro Líquido</p>
              <p className="text-sm font-bold text-green-400">R$ {(bp.lucroLiquidoMes / 1000).toFixed(0)}k</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-[9px] text-gray-500 uppercase">Aporte Acumulado</p>
              <p className="text-sm font-bold text-blue-400">R$ {(bp.aporteAcumulado / 1000).toFixed(0)}k</p>
            </div>
          </div>
        </div>
      )}

      {/* Reports list */}
      <div className="space-y-3">
        {(relatorios ?? []).map((r) => {
          const isExpanded = expandedId === r.id;
          return (
            <div key={r.id} className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
              {/* Header row */}
              <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center">
                    <FileBarChart className="w-5 h-5 text-[#C9A84C]" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{MESES[r.mes]} {r.ano}</p>
                    <p className="text-xs text-gray-500">MRR {fmtCurrency(r.mrr)} &middot; {r.total_usuarios} usuarios &middot; Churn {r.churn_rate}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setEditingRel(r); setShowForm(true); }}
                    className="p-1.5 text-gray-600 hover:text-[#C9A84C] transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  {confirmDel === r.id ? (
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { deleteRel.mutate(r.id); setConfirmDel(null); }} className="px-2 py-0.5 rounded text-[10px] bg-red-600 text-white">Sim</button>
                      <button onClick={() => setConfirmDel(null)} className="px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400">Nao</button>
                    </div>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDel(r.id); }}
                      className="p-1.5 text-gray-700 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-800/50 pt-4 space-y-4">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[
                      { label: "MRR", value: fmtCurrency(r.mrr) },
                      { label: "ARR", value: fmtCurrency(r.arr) },
                      { label: "Total Usuarios", value: r.total_usuarios },
                      { label: "Novos Usuarios", value: r.novos_usuarios },
                      { label: "Churn Rate", value: `${r.churn_rate}%` },
                      { label: "CAC", value: fmtCurrency(r.cac) },
                      { label: "LTV", value: fmtCurrency(r.ltv) },
                      { label: "Burn Rate", value: fmtCurrency(r.burn_rate) },
                      { label: "Runway", value: `${r.runway} meses` },
                      { label: "Headcount", value: r.headcount },
                      { label: "NPS", value: r.nps ?? "—" },
                      { label: "LTV/CAC", value: r.cac > 0 ? `${(r.ltv / r.cac).toFixed(1)}x` : "—" },
                    ].map((item) => (
                      <div key={item.label} className="bg-gray-800/50 rounded-lg p-3">
                        <p className="text-[10px] text-gray-500 uppercase">{item.label}</p>
                        <p className="text-sm font-bold text-white mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Narrativas */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {r.narrativa_positivo && (
                      <div className="bg-green-900/10 border border-green-800/30 rounded-lg p-4">
                        <p className="text-[10px] font-semibold text-green-400 uppercase mb-1">Positivo</p>
                        <p className="text-xs text-gray-300 leading-relaxed">{r.narrativa_positivo}</p>
                      </div>
                    )}
                    {r.narrativa_negativo && (
                      <div className="bg-red-900/10 border border-red-800/30 rounded-lg p-4">
                        <p className="text-[10px] font-semibold text-red-400 uppercase mb-1">Desafios</p>
                        <p className="text-xs text-gray-300 leading-relaxed">{r.narrativa_negativo}</p>
                      </div>
                    )}
                    {r.narrativa_proximos30 && (
                      <div className="bg-blue-900/10 border border-blue-800/30 rounded-lg p-4">
                        <p className="text-[10px] font-semibold text-blue-400 uppercase mb-1">Proximos 30 dias</p>
                        <p className="text-xs text-gray-300 leading-relaxed">{r.narrativa_proximos30}</p>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-gray-600">Criado em {new Date(r.criado_em).toLocaleDateString("pt-BR")}</p>
                </div>
              )}
            </div>
          );
        })}

        {(relatorios ?? []).length === 0 && (
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-12 text-center">
            <FileBarChart className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum relatorio criado</p>
            <p className="text-xs text-gray-600 mt-1">Crie o primeiro report mensal para investidores</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && <RelatorioFormModal editing={editingRel} onClose={() => { setShowForm(false); setEditingRel(null); }} />}
    </div>
  );
}

// ── Relatorio Form Modal ─────────────────────────────────────
function RelatorioFormModal({ editing, onClose }: { editing: Relatorio | null; onClose: () => void }) {
  const upsert = useUpsertRelatorio();
  const now = new Date();

  const [mes, setMes] = useState(editing?.mes ?? now.getMonth() + 1);
  const [ano, setAno] = useState(editing?.ano ?? now.getFullYear());
  const { data: autoFill } = useAutoFillRelatorio(mes, ano);

  const [form, setForm] = useState<RelatorioInsert>({
    mes, ano,
    mrr: editing?.mrr ?? 0, arr: editing?.arr ?? 0,
    total_usuarios: editing?.total_usuarios ?? 0, novos_usuarios: editing?.novos_usuarios ?? 0,
    churn_rate: editing?.churn_rate ?? 0, cac: editing?.cac ?? 0, ltv: editing?.ltv ?? 0,
    burn_rate: editing?.burn_rate ?? 0, runway: editing?.runway ?? 0,
    headcount: editing?.headcount ?? 0, nps: editing?.nps ?? null,
    narrativa_positivo: editing?.narrativa_positivo ?? "",
    narrativa_negativo: editing?.narrativa_negativo ?? "",
    narrativa_proximos30: editing?.narrativa_proximos30 ?? "",
  });

  const applyAutoFill = () => {
    if (!autoFill) return;
    setForm((f) => ({ ...f, ...autoFill, mes, ano }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsert.mutateAsync({ ...form, mes, ano });
    onClose();
  };

  const f = (field: keyof RelatorioInsert, value: any) => setForm({ ...form, [field]: value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm sm:max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{editing ? "Editar Relatorio" : "Novo Relatorio"}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-800"><X className="w-4 h-4 text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Periodo + Auto-fill */}
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Mes</label>
              <select value={mes} onChange={(e) => setMes(Number(e.target.value))}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]">
                {MESES.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Ano</label>
              <input type="number" value={ano} onChange={(e) => setAno(Number(e.target.value))}
                className="w-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
            </div>
            <button type="button" onClick={applyAutoFill}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30 hover:bg-[#C9A84C]/30 transition-colors">
              <Sparkles className="w-3.5 h-3.5" />Preencher automatico
            </button>
          </div>

          {/* KPI Grid */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">Metricas</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { key: "mrr", label: "MRR (R$)", type: "number" },
                { key: "arr", label: "ARR (R$)", type: "number" },
                { key: "total_usuarios", label: "Total Usuarios", type: "number" },
                { key: "novos_usuarios", label: "Novos Usuarios", type: "number" },
                { key: "churn_rate", label: "Churn Rate (%)", type: "number" },
                { key: "cac", label: "CAC (R$)", type: "number" },
                { key: "ltv", label: "LTV (R$)", type: "number" },
                { key: "burn_rate", label: "Burn Rate (R$)", type: "number" },
                { key: "runway", label: "Runway (meses)", type: "number" },
                { key: "headcount", label: "Headcount", type: "number" },
                { key: "nps", label: "NPS", type: "number" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-[10px] text-gray-500 mb-0.5">{field.label}</label>
                  <input type="number" step="0.01" value={(form as any)[field.key] ?? ""}
                    onChange={(e) => f(field.key as keyof RelatorioInsert, e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
                </div>
              ))}
            </div>
          </div>

          {/* Narrativas */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">Narrativa</p>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-green-400 mb-0.5">O que deu certo</label>
                <textarea value={form.narrativa_positivo ?? ""} onChange={(e) => f("narrativa_positivo", e.target.value)} rows={2}
                  placeholder="Destaques positivos do mes..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-[#C9A84C] resize-none placeholder-gray-600" />
              </div>
              <div>
                <label className="block text-[10px] text-red-400 mb-0.5">Desafios e riscos</label>
                <textarea value={form.narrativa_negativo ?? ""} onChange={(e) => f("narrativa_negativo", e.target.value)} rows={2}
                  placeholder="O que nao funcionou, riscos identificados..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-[#C9A84C] resize-none placeholder-gray-600" />
              </div>
              <div>
                <label className="block text-[10px] text-blue-400 mb-0.5">Proximos 30 dias</label>
                <textarea value={form.narrativa_proximos30 ?? ""} onChange={(e) => f("narrativa_proximos30", e.target.value)} rows={2}
                  placeholder="Plano para o proximo mes..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-[#C9A84C] resize-none placeholder-gray-600" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={upsert.isPending}
            className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[#C9A84C] text-gray-900 hover:bg-yellow-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {upsert.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {upsert.isPending ? "Salvando..." : editing ? "Salvar Alteracoes" : "Criar Relatorio"}
          </button>
        </form>
      </div>
    </div>
  );
}
