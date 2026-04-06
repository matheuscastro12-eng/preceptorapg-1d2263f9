import { useState } from "react";
import { Wallet, DollarSign, ShieldX, X, Loader2, TrendingUp, ChevronDown, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import MetricCard from "@/components/crm/MetricCard";
import { useCrmAuth } from "@/contexts/CrmAuthContext";
import { useFolhaConsolidada, useRemuneracaoByMembro, useUpsertRemuneracao, useReajustesByMembro, useProjecaoFolha } from "@/hooks/useSalarios";
import type { RemuneracaoInsert } from "@/hooks/useSalarios";

const BENEFICIOS_OPTIONS = [
  { key: "vr", label: "Vale Refeicao" },
  { key: "vt", label: "Vale Transporte" },
  { key: "saude", label: "Plano de Saude" },
  { key: "outros", label: "Outros" },
];

export default function AdminSalarios() {
  const { isSuperAdmin } = useCrmAuth();

  const { data: folha, isLoading } = useFolhaConsolidada();
  const { data: projecao } = useProjecaoFolha();
  const upsertRem = useUpsertRemuneracao();

  const [selectedMembro, setSelectedMembro] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedReajuste, setExpandedReajuste] = useState<string | null>(null);

  // Restricted access
  if (!isSuperAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <ShieldX className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Acesso Restrito</h1>
          <p className="text-sm text-gray-500 max-w-sm">
            Salarios & Remuneracao e uma area confidencial. Apenas super_admins (C-Level) podem acessar.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-6 flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" /></div>;
  }

  const totalFolha = (folha ?? []).reduce((s, f) => s + f.salario_bruto, 0);
  const mediaSalarial = (folha ?? []).length > 0 ? totalFolha / (folha ?? []).length : 0;
  const headcount = (folha ?? []).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Salarios & Remuneracao</h1>
          <p className="text-sm text-gray-500 mt-0.5">Folha de pagamento e equity — acesso confidencial</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/20 rounded-full border border-red-800/30">
          <ShieldX className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs text-red-400 font-medium">Confidencial</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Folha Mensal" value={totalFolha} format="currency" icon={Wallet} color="red" subtitle="Total bruto" />
        <MetricCard title="Media Salarial" value={Math.round(mediaSalarial)} format="currency" icon={DollarSign} color="gold" subtitle="Por colaborador" />
        <MetricCard title="Headcount" value={headcount} icon={TrendingUp} color="blue" subtitle="Recebendo" />
        <MetricCard title="Folha Anual" value={totalFolha * 12} format="currency" icon={Wallet} color="red" subtitle="Projecao 12 meses" />
      </div>

      {/* Folha Table */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Folha Consolidada</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {["Membro", "Cargo", "Salario Bruto", "Modelo", "Dia Pgto", "Equity %", "Reajustes", "Editar"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {(folha ?? []).map((f) => (
                <FolhaRow key={f.membro_id} folha={f}
                  isExpanded={expandedReajuste === f.membro_id}
                  onToggleReajustes={() => setExpandedReajuste(expandedReajuste === f.membro_id ? null : f.membro_id)}
                  onEdit={() => { setSelectedMembro(f.membro_id); setShowForm(true); }} />
              ))}
              {(folha ?? []).length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-gray-500">Nenhum dado de remuneracao</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Total */}
        <div className="p-4 border-t border-gray-800 flex items-center justify-between">
          <span className="text-sm text-gray-400 font-medium">Total Folha Mensal</span>
          <span className="text-lg font-bold text-white">R$ {totalFolha.toFixed(2)}</span>
        </div>
      </div>

      {/* Projecao Folha */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Projecao de Folha — Proximos 3 meses</h2>
        {(projecao ?? []).length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={projecao}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="mes" tick={{ fill: "#6b7280", fontSize: 11 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(v) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#f9fafb" }}
                formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Folha"]} />
              <Bar dataKey="valor" fill="#C9A84C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="h-40 flex items-center justify-center text-gray-600 text-sm">Sem dados</div>}
      </div>

      {/* Modal Remuneracao */}
      {showForm && selectedMembro && (
        <RemuneracaoModal
          membroId={selectedMembro}
          onClose={() => { setShowForm(false); setSelectedMembro(null); }}
          onSave={upsertRem}
        />
      )}
    </div>
  );
}

// ── Folha Row with expandable reajustes ──────────────────────
function FolhaRow({ folha, isExpanded, onToggleReajustes, onEdit }: {
  folha: { membro_id: string; nome: string; cargo: string; salario_bruto: number; modelo_pagamento: string; dia_pagamento: number | null; equity_percentual: number };
  isExpanded: boolean;
  onToggleReajustes: () => void;
  onEdit: () => void;
}) {
  const { data: reajustes } = useReajustesByMembro(isExpanded ? folha.membro_id : undefined);

  return (
    <>
      <tr className="hover:bg-gray-800/30 transition-colors">
        <td className="py-3 px-4 text-white font-medium">{folha.nome}</td>
        <td className="py-3 px-4 text-gray-300 text-xs">{folha.cargo}</td>
        <td className="py-3 px-4 text-white font-medium">
          {folha.salario_bruto > 0 ? `R$ ${folha.salario_bruto.toFixed(2)}` : <span className="text-gray-600">Pro-labore</span>}
        </td>
        <td className="py-3 px-4 text-gray-400 text-xs capitalize">{folha.modelo_pagamento}</td>
        <td className="py-3 px-4 text-gray-400 text-xs">{folha.dia_pagamento ?? "—"}</td>
        <td className="py-3 px-4">
          {folha.equity_percentual > 0
            ? <span className="text-[#C9A84C] font-bold">{folha.equity_percentual}%</span>
            : <span className="text-gray-600">—</span>}
        </td>
        <td className="py-3 px-4">
          <button onClick={onToggleReajustes} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white">
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Ver
          </button>
        </td>
        <td className="py-3 px-4">
          <button onClick={onEdit} className="text-xs text-[#C9A84C] hover:text-yellow-300">Editar</button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={8} className="px-4 pb-4">
            <div className="bg-gray-800/50 rounded-lg p-3 ml-4">
              <p className="text-xs font-semibold text-gray-400 mb-2">Historico de Reajustes</p>
              {(reajustes ?? []).length > 0 ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-600"><th className="text-left py-1">Data</th><th>%</th><th>Anterior</th><th>Novo</th><th>Motivo</th></tr>
                  </thead>
                  <tbody>
                    {(reajustes ?? []).map((r) => (
                      <tr key={r.id} className="text-gray-400">
                        <td className="py-1">{new Date(r.data).toLocaleDateString("pt-BR")}</td>
                        <td className="text-green-400">+{r.percentual}%</td>
                        <td>R$ {Number(r.valor_anterior).toFixed(2)}</td>
                        <td className="text-white">R$ {Number(r.valor_novo).toFixed(2)}</td>
                        <td className="text-gray-500">{r.motivo ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-xs text-gray-600">Nenhum reajuste registrado</p>}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Modal Remuneracao ────────────────────────────────────────
function RemuneracaoModal({ membroId, onClose, onSave }: {
  membroId: string;
  onClose: () => void;
  onSave: ReturnType<typeof useUpsertRemuneracao>;
}) {
  const { data: existing, isLoading } = useRemuneracaoByMembro(membroId);

  const [form, setForm] = useState<RemuneracaoInsert>({
    membro_id: membroId,
    salario_bruto: 0, modelo_pagamento: "mensal", dia_pagamento: 5,
    banco: "", dados_bancarios: "", equity_percentual: 0, cliff_meses: 0, vesting_meses: 0,
    beneficios: {}, observacoes_confidenciais: "",
  });

  const [loaded, setLoaded] = useState(false);

  // Load existing data
  if (existing && !loaded) {
    setForm({
      membro_id: membroId,
      salario_bruto: Number(existing.salario_bruto),
      modelo_pagamento: existing.modelo_pagamento,
      dia_pagamento: existing.dia_pagamento,
      banco: existing.banco ?? "",
      dados_bancarios: existing.dados_bancarios ?? "",
      equity_percentual: Number(existing.equity_percentual),
      cliff_meses: existing.cliff_meses,
      vesting_meses: existing.vesting_meses,
      beneficios: (existing.beneficios ?? {}) as Record<string, unknown>,
      observacoes_confidenciais: existing.observacoes_confidenciais ?? "",
    });
    setLoaded(true);
  }
  if (!existing && !isLoading && !loaded) setLoaded(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave.mutateAsync(form);
    onClose();
  };

  const toggleBeneficio = (key: string) => {
    const b = { ...(form.beneficios as Record<string, boolean>) };
    b[key] = !b[key];
    setForm({ ...form, beneficios: b });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Remuneracao</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-800"><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Salario Bruto (R$)</label>
              <input type="number" step="0.01" value={form.salario_bruto || ""} onChange={(e) => setForm({ ...form, salario_bruto: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Modelo</label>
              <select value={form.modelo_pagamento} onChange={(e) => setForm({ ...form, modelo_pagamento: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]">
                <option value="mensal">Mensal</option>
                <option value="quinzenal">Quinzenal</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Dia Pagamento</label>
              <input type="number" min={1} max={31} value={form.dia_pagamento ?? ""} onChange={(e) => setForm({ ...form, dia_pagamento: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Banco</label>
              <input value={form.banco ?? ""} onChange={(e) => setForm({ ...form, banco: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Dados Bancarios</label>
              <input value={form.dados_bancarios ?? ""} onChange={(e) => setForm({ ...form, dados_bancarios: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <p className="text-xs font-semibold text-gray-400 mb-3">Equity & Vesting</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Equity %</label>
                <input type="number" step="0.01" value={form.equity_percentual || ""} onChange={(e) => setForm({ ...form, equity_percentual: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Cliff (meses)</label>
                <input type="number" value={form.cliff_meses || ""} onChange={(e) => setForm({ ...form, cliff_meses: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Vesting (meses)</label>
                <input type="number" value={form.vesting_meses || ""} onChange={(e) => setForm({ ...form, vesting_meses: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <p className="text-xs font-semibold text-gray-400 mb-3">Beneficios</p>
            <div className="flex flex-wrap gap-2">
              {BENEFICIOS_OPTIONS.map((b) => {
                const active = !!(form.beneficios as Record<string, boolean>)?.[b.key];
                return (
                  <button key={b.key} type="button" onClick={() => toggleBeneficio(b.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      active ? "bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/40" : "bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-600"
                    }`}>
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Observacoes Confidenciais</label>
            <textarea value={form.observacoes_confidenciais ?? ""} onChange={(e) => setForm({ ...form, observacoes_confidenciais: e.target.value })} rows={2}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C] resize-none" />
          </div>

          <button type="submit" disabled={onSave.isPending}
            className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[#C9A84C] text-gray-900 hover:bg-yellow-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {onSave.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {onSave.isPending ? "Salvando..." : "Salvar Remuneracao"}
          </button>
        </form>
      </div>
    </div>
  );
}
