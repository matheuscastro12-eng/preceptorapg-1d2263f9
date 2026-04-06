import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Plus, X, Loader2, Trash2, Edit2 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import MetricCard from "@/components/crm/MetricCard";
import PageHeader from "@/components/crm-admin/PageHeader";
import { useReceitas, useReceitaResumo, useReceitaPorPlano, useReceitaPorProduto, useCreateReceita, useUpdateReceita, useDeleteReceita } from "@/hooks/useReceitas";
import type { ReceitaInsert, Receita } from "@/hooks/useReceitas";

type Periodo = "mes" | "trimestre" | "ano";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ativo: { bg: "bg-green-900/30", text: "text-green-400" },
  cancelado: { bg: "bg-red-900/30", text: "text-red-400" },
  inadimplente: { bg: "bg-yellow-900/30", text: "text-yellow-400" },
};

const PLANO_COLORS = ["#16a34a", "#3b82f6", "#8b5cf6"];
const PRODUTO_COLORS = ["#1B5E3B", "#6A1B9A"];

const PLANO_LABELS: Record<string, string> = { mensal: "Mensal", anual: "Anual", bianual: "Bianual" };
const PRODUTO_LABELS: Record<string, string> = { preceptormed: "PreceptorMED", preceptorenem: "PreceptorENEM" };

const emptyForm: ReceitaInsert = {
  produto: "preceptormed", plano: "mensal", valor: 29.9,
  data_inicio: new Date().toISOString().split("T")[0],
  status: "ativo", origem: "manual", observacoes: "",
};

export default function AdminReceita() {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ReceitaInsert>({ ...emptyForm });

  const { data: receitas, isLoading } = useReceitas(periodo);
  const { data: resumo } = useReceitaResumo(periodo);
  const { data: porPlano } = useReceitaPorPlano();
  const { data: porProduto } = useReceitaPorProduto();
  const createReceita = useCreateReceita();
  const updateReceita = useUpdateReceita();
  const deleteReceita = useDeleteReceita();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const openEdit = (r: Receita) => {
    setForm({ produto: r.produto, plano: r.plano, valor: Number(r.valor), data_inicio: r.data_inicio, status: r.status, origem: r.origem, observacoes: r.observacoes ?? "" });
    setEditingId(r.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.valor || !form.data_inicio) return;
    if (editingId) {
      await updateReceita.mutateAsync({ id: editingId, data: form });
    } else {
      await createReceita.mutateAsync(form);
    }
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
  };

  const periodLabel = periodo === "mes" ? "Este mes" : periodo === "trimestre" ? "Trimestre" : "Ano";

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with period filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Receita & MRR</h1>
          <p className="text-sm text-gray-500 mt-0.5">Acompanhamento de receita recorrente</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            {(["mes", "trimestre", "ano"] as Periodo[]).map((p) => (
              <button key={p} onClick={() => setPeriodo(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  periodo === p ? "bg-[#C9A84C] text-gray-900" : "text-gray-400 hover:text-white"
                }`}>
                {p === "mes" ? "Mes" : p === "trimestre" ? "Trimestre" : "Ano"}
              </button>
            ))}
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#C9A84C] text-gray-900 hover:bg-yellow-500 transition-colors">
            <Plus className="w-3.5 h-3.5" />Nova Receita
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="MRR Total" value={resumo?.mrrTotal ?? 0} format="currency" icon={DollarSign} color="green" subtitle="Receita recorrente" />
        <MetricCard title="Novas Receitas" value={resumo?.novas ?? 0} icon={TrendingUp} color="blue" subtitle={periodLabel} />
        <MetricCard title="Cancelamentos" value={resumo?.cancelamentos ?? 0} icon={TrendingDown} color="red" subtitle="Total cancelados" />
        <MetricCard title="Expansao MRR" value={resumo?.expansao ?? 0} format="currency" icon={TrendingUp} color="gold" subtitle="Upsells" />
      </div>

      {/* Receitas Table */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Receitas ({(receitas ?? []).length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {["Produto", "Plano", "Valor", "Inicio", "Renovacao", "Status", "Origem", ""].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {(receitas ?? []).map((r) => {
                const sc = STATUS_COLORS[r.status] ?? STATUS_COLORS.ativo;
                return (
                  <tr key={r.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium" style={{ color: r.produto === "preceptormed" ? "#1B5E3B" : "#6A1B9A" }}>
                        {PRODUTO_LABELS[r.produto] ?? r.produto}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{PLANO_LABELS[r.plano] ?? r.plano}</td>
                    <td className="py-3 px-4 text-white font-medium">R$ {Number(r.valor).toFixed(2)}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{new Date(r.data_inicio).toLocaleDateString("pt-BR")}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{r.data_renovacao ? new Date(r.data_renovacao).toLocaleDateString("pt-BR") : "—"}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>{r.status}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs capitalize">{r.origem}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(r)} className="p-1 text-gray-600 hover:text-[#C9A84C] transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        {confirmDel === r.id ? (
                          <>
                            <button onClick={() => { deleteReceita.mutate(r.id); setConfirmDel(null); }} className="px-1.5 py-0.5 rounded text-[10px] bg-red-600 text-white">Sim</button>
                            <button onClick={() => setConfirmDel(null)} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400">Nao</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDel(r.id)} className="p-1 text-gray-700 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(receitas ?? []).length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-gray-500">Nenhuma receita cadastrada</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por Plano */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Receita por Plano</h2>
          {(porPlano ?? []).length > 0 ? (
            <div className="space-y-3">
              {(porPlano ?? []).map((p, i) => {
                const max = porPlano![0].total;
                return (
                  <div key={p.plano}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300">{PLANO_LABELS[p.plano] ?? p.plano}</span>
                      <span className="text-sm font-bold text-white">R$ {p.total.toFixed(2)}</span>
                    </div>
                    <div className="h-5 bg-gray-800 rounded-lg overflow-hidden">
                      <div className="h-full rounded-lg" style={{ width: `${(p.total / max) * 100}%`, backgroundColor: PLANO_COLORS[i % PLANO_COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-600 text-sm">Sem dados</div>
          )}
        </div>

        {/* Por Produto */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Receita por Produto</h2>
          {(porProduto ?? []).length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={porProduto} dataKey="total" nameKey="produto" cx="50%" cy="50%" outerRadius={70}
                  label={({ produto, total }) => `${PRODUTO_LABELS[produto] ?? produto}: R$${total}`}>
                  {(porProduto ?? []).map((_, i) => <Cell key={i} fill={PRODUTO_COLORS[i % PRODUTO_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#f9fafb" }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-600 text-sm">Sem dados</div>
          )}
        </div>
      </div>

      {/* Modal Nova Receita */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowForm(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editingId ? "Editar Receita" : "Nova Receita"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-full hover:bg-gray-800"><X className="w-4 h-4 text-gray-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Produto</label>
                  <select value={form.produto} onChange={(e) => setForm({ ...form, produto: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]">
                    <option value="preceptormed">PreceptorMED</option>
                    <option value="preceptorenem">PreceptorENEM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Plano</label>
                  <select value={form.plano} onChange={(e) => setForm({ ...form, plano: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]">
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                    <option value="bianual">Bianual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Valor (R$)</label>
                  <input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Data Inicio</label>
                  <input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]">
                    <option value="ativo">Ativo</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="inadimplente">Inadimplente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Origem</label>
                  <select value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]">
                    <option value="stripe">Stripe</option>
                    <option value="pix">PIX</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Observacoes</label>
                <textarea value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  rows={2} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C] resize-none" />
              </div>

              <button type="submit" disabled={createReceita.isPending}
                className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[#C9A84C] text-gray-900 hover:bg-yellow-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {createReceita.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {(createReceita.isPending || updateReceita.isPending) ? "Salvando..." : editingId ? "Salvar Alteracoes" : "Cadastrar Receita"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
