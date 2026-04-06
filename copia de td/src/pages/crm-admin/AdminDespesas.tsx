import { useState } from "react";
import { CreditCard, TrendingDown, Repeat, Zap, Plus, X, Loader2, Trash2, AlertTriangle, Edit2 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import MetricCard from "@/components/crm/MetricCard";
import { useDespesas, useDespesaResumo, useDespesasPorCategoria, useDespesasProximoVencimento, useCreateDespesa, useUpdateDespesa, useDeleteDespesa } from "@/hooks/useDespesas";
import type { DespesaInsert } from "@/hooks/useDespesas";

const CAT_LABELS: Record<string, string> = {
  infra: "Infraestrutura", marketing: "Marketing", salarios: "Salarios",
  ferramentas: "Ferramentas", juridico: "Juridico", outros: "Outros",
};
const CAT_COLORS: Record<string, string> = {
  infra: "#3b82f6", marketing: "#8b5cf6", salarios: "#16a34a",
  ferramentas: "#f59e0b", juridico: "#f97316", outros: "#6b7280",
};

const emptyForm: DespesaInsert = {
  descricao: "", categoria: "infra", valor: 0, data: new Date().toISOString().split("T")[0],
  recorrente: false, frequencia: "unico", responsavel: "", centro_de_custo: "", comprovante_url: "", observacoes: "",
};

export default function AdminDespesas() {
  const [catFilter, setCatFilter] = useState("");
  const [mesFilter, setMesFilter] = useState("");
  const [recFilter, setRecFilter] = useState<boolean | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DespesaInsert>({ ...emptyForm });
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const { data: despesas, isLoading } = useDespesas({
    categoria: catFilter || undefined,
    mes: mesFilter || undefined,
    recorrente: recFilter,
  });
  const { data: resumo } = useDespesaResumo();
  const { data: porCat } = useDespesasPorCategoria();
  const { data: alertas } = useDespesasProximoVencimento();
  const createDespesa = useCreateDespesa();
  const updateDespesa = useUpdateDespesa();
  const deleteDespesa = useDeleteDespesa();
  const [editingId, setEditingId] = useState<string | null>(null);

  const openEdit = (d: any) => {
    setForm({ descricao: d.descricao, categoria: d.categoria, valor: Number(d.valor), data: d.data, recorrente: d.recorrente, frequencia: d.frequencia, responsavel: d.responsavel ?? "", centro_de_custo: d.centro_de_custo ?? "", comprovante_url: d.comprovante_url ?? "", observacoes: d.observacoes ?? "" });
    setEditingId(d.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.descricao || !form.valor) return;
    if (editingId) {
      await updateDespesa.mutateAsync({ id: editingId, data: form });
    } else {
      await createDespesa.mutateAsync(form);
    }
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
  };

  if (isLoading) {
    return <div className="p-6 flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Despesas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Controle de gastos operacionais</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#C9A84C] text-gray-900 hover:bg-yellow-500 transition-colors">
          <Plus className="w-3.5 h-3.5" />Nova Despesa
        </button>
      </div>

      {/* Alerta vencimentos */}
      {(alertas ?? []).length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-yellow-400">Vencimentos nos proximos 7 dias</span>
          </div>
          <div className="space-y-1">
            {(alertas ?? []).map((a, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-gray-300">{a.descricao}</span>
                <div className="flex items-center gap-3">
                  <span className="text-yellow-400 font-medium">R$ {Number(a.valor).toFixed(2)}</span>
                  <span className="text-gray-500">{new Date(a.data).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total do Mes" value={resumo?.totalMes ?? 0} format="currency" icon={CreditCard} color="red" subtitle="Despesas correntes" />
        <MetricCard title="Recorrentes" value={resumo?.recorrentes ?? 0} format="currency" icon={Repeat} color="gold" subtitle="Mensais + anuais" />
        <MetricCard title="Pontuais" value={resumo?.pontuais ?? 0} format="currency" icon={Zap} color="blue" subtitle="Gastos unicos" />
        <MetricCard title="Maior Categoria" value={`R$ ${(resumo?.maiorCategoriaValor ?? 0).toFixed(0)}`} icon={TrendingDown} color="red"
          subtitle={CAT_LABELS[resumo?.maiorCategoria ?? ""] ?? resumo?.maiorCategoria ?? "—"} />
      </div>

      {/* Filters + Table */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex flex-wrap gap-3">
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#C9A84C]">
            <option value="">Todas categorias</option>
            {Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="month" value={mesFilter} onChange={(e) => setMesFilter(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#C9A84C]" />
          <select value={recFilter === null ? "" : recFilter ? "rec" : "pont"}
            onChange={(e) => setRecFilter(e.target.value === "" ? null : e.target.value === "rec")}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#C9A84C]">
            <option value="">Todas</option>
            <option value="rec">Recorrentes</option>
            <option value="pont">Pontuais</option>
          </select>
          {(catFilter || mesFilter || recFilter !== null) && (
            <button onClick={() => { setCatFilter(""); setMesFilter(""); setRecFilter(null); }}
              className="px-3 py-2 text-xs text-gray-400 hover:text-white">&times; Limpar</button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {["Descricao", "Categoria", "Valor", "Data", "Tipo", "Responsavel", ""].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {(despesas ?? []).map((d) => (
                <tr key={d.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <p className="text-white font-medium">{d.descricao}</p>
                    {d.observacoes && <p className="text-xs text-gray-600 truncate max-w-xs">{d.observacoes}</p>}
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CAT_COLORS[d.categoria] }} />
                      <span className="text-gray-300 text-xs">{CAT_LABELS[d.categoria] ?? d.categoria}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white font-medium">R$ {Number(d.valor).toFixed(2)}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{new Date(d.data).toLocaleDateString("pt-BR")}</td>
                  <td className="py-3 px-4">
                    {d.recorrente
                      ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-900/30 text-yellow-400">{d.frequencia}</span>
                      : <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-800 text-gray-500">unico</span>}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{d.responsavel ?? "—"}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(d)} className="p-1 text-gray-600 hover:text-[#C9A84C] transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      {confirmDel === d.id ? (
                        <>
                          <button onClick={() => { deleteDespesa.mutate(d.id); setConfirmDel(null); }} className="px-1.5 py-0.5 rounded text-[10px] bg-red-600 text-white">Sim</button>
                          <button onClick={() => setConfirmDel(null)} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400">Nao</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDel(d.id)} className="p-1 text-gray-700 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(despesas ?? []).length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-gray-500">Nenhuma despesa encontrada</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pizza chart */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Despesas por Categoria</h2>
        {(porCat ?? []).length > 0 ? (
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie data={porCat} dataKey="total" nameKey="categoria" cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                  label={({ categoria, total }) => `R$${total}`}>
                  {(porCat ?? []).map((d) => <Cell key={d.categoria} fill={CAT_COLORS[d.categoria] ?? "#6b7280"} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#f9fafb" }}
                  formatter={(v: number) => [`R$ ${v.toFixed(2)}`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {(porCat ?? []).map((d) => (
                <div key={d.categoria} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CAT_COLORS[d.categoria] ?? "#6b7280" }} />
                  <span className="text-sm text-gray-300">{CAT_LABELS[d.categoria] ?? d.categoria}</span>
                  <span className="text-sm font-bold text-white ml-auto">R$ {d.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : <div className="h-40 flex items-center justify-center text-gray-600 text-sm">Sem dados</div>}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowForm(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editingId ? "Editar Despesa" : "Nova Despesa"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-full hover:bg-gray-800"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Descricao</label>
                <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Categoria</label>
                  <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]">
                    {Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Valor (R$)</label>
                  <input type="number" step="0.01" value={form.valor || ""} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Data</label>
                  <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Responsavel</label>
                  <input value={form.responsavel ?? ""} onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.recorrente} onChange={(e) => setForm({ ...form, recorrente: e.target.checked, frequencia: e.target.checked ? "mensal" : "unico" })}
                    className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-[#C9A84C] focus:ring-[#C9A84C]" />
                  <span className="text-sm text-gray-300">Recorrente</span>
                </label>
                {form.recorrente && (
                  <select value={form.frequencia} onChange={(e) => setForm({ ...form, frequencia: e.target.value })}
                    className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#C9A84C]">
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                  </select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Centro de Custo</label>
                  <input value={form.centro_de_custo ?? ""} onChange={(e) => setForm({ ...form, centro_de_custo: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Comprovante URL</label>
                  <input value={form.comprovante_url ?? ""} onChange={(e) => setForm({ ...form, comprovante_url: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Observacoes</label>
                <textarea value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C] resize-none" />
              </div>
              <button type="submit" disabled={createDespesa.isPending}
                className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[#C9A84C] text-gray-900 hover:bg-yellow-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {createDespesa.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {(createDespesa.isPending || updateDespesa.isPending) ? "Salvando..." : editingId ? "Salvar Alteracoes" : "Cadastrar Despesa"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
