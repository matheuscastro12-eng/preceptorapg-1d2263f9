import { useState } from "react";
import { Wallet, TrendingUp, TrendingDown, ArrowLeftRight, Save, Loader2, Plus, Trash2, Banknote, X } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import MetricCard from "@/components/crm/MetricCard";
import { useFluxoCaixa, useUpdateSaldo, useRunway, useEntradasPrevistas, useSaidasPrevistas, useProjecao90Dias, useSaques, useCreateSaque, useDeleteSaque } from "@/hooks/useFluxoCaixa";

const HOJE = () => new Date().toISOString().slice(0, 10);
const EFEITO_META: Record<string, { label: string; hint: string; cls: string; sign: string }> = {
  somar:    { label: "Entra no caixa", hint: "soma ao saldo (+)", cls: "text-green-400", sign: "+" },
  subtrair: { label: "Retirada",        hint: "sai do saldo (−)",  cls: "text-red-400",   sign: "−" },
  neutro:   { label: "Neutro",          hint: "só registro",       cls: "text-gray-400",  sign: "" },
};

export default function AdminFluxoCaixa() {
  const { data: fluxo } = useFluxoCaixa();
  const { data: runwayData } = useRunway();
  const { data: entradas } = useEntradasPrevistas();
  const { data: saidas } = useSaidasPrevistas();
  const { data: projecao } = useProjecao90Dias();
  const { data: saques } = useSaques();
  const updateSaldo = useUpdateSaldo();
  const createSaque = useCreateSaque();
  const deleteSaque = useDeleteSaque();

  const [editSaldo, setEditSaldo] = useState(false);
  const [novoSaldo, setNovoSaldo] = useState("");
  const [saldoObs, setSaldoObs] = useState("");

  // Form de saque
  const [showSaque, setShowSaque] = useState(false);
  const [saqueForm, setSaqueForm] = useState({
    descricao: "", valor: "", data: HOJE(), origem: "easyflow" as "easyflow" | "banco" | "outro",
    efeito: "somar" as "somar" | "subtrair" | "neutro", responsavel: "",
  });

  const handleSaveSaldo = async () => {
    if (!novoSaldo) return;
    await updateSaldo.mutateAsync({ saldo: Number(novoSaldo), observacoes: saldoObs || undefined });
    setEditSaldo(false);
    setNovoSaldo("");
    setSaldoObs("");
  };

  const handleSaveSaque = async () => {
    const valor = Number(saqueForm.valor);
    if (!saqueForm.descricao.trim() || !valor || valor <= 0) return;
    await createSaque.mutateAsync({
      descricao: saqueForm.descricao.trim(),
      valor,
      data: saqueForm.data || HOJE(),
      origem: saqueForm.origem,
      efeito: saqueForm.efeito,
      responsavel: saqueForm.responsavel.trim() || null,
    });
    setShowSaque(false);
    setSaqueForm({ descricao: "", valor: "", data: HOJE(), origem: "easyflow", efeito: "somar", responsavel: "" });
  };

  const saldo = fluxo?.saldo_atual ?? 0;
  const runway = runwayData?.runway ?? 0;
  const burnMedio = runwayData?.burnMedio ?? 0;
  const totalEntradas = (entradas ?? []).reduce((s, e) => s + e.valor, 0);
  const totalSaidas = (saidas ?? []).reduce((s, e) => s + e.valor, 0);

  // Find min saldo in projection for alert (guard: Math.min() de array vazio = Infinity)
  const projVals = (projecao ?? []).map((p) => p.saldo);
  const minProjecao = projVals.length > 0 ? Math.min(...projVals) : 0;

  return (
  <>
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Fluxo de Caixa</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">Saldo, entradas, saidas e projecao 90 dias</p>
        </div>
        {!editSaldo ? (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSaque(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700 transition-colors">
              <Banknote className="w-3.5 h-3.5" />Registrar Saque
            </button>
            <button onClick={() => { setEditSaldo(true); setNovoSaldo(String(saldo)); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#C9A84C] text-gray-900 hover:bg-yellow-500 transition-colors">
              <Wallet className="w-3.5 h-3.5" />Atualizar Saldo
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input type="number" step="0.01" value={novoSaldo} onChange={(e) => setNovoSaldo(e.target.value)} placeholder="Saldo"
              className="w-32 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
            <input value={saldoObs} onChange={(e) => setSaldoObs(e.target.value)} placeholder="Obs (opcional)"
              className="w-40 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
            <button onClick={handleSaveSaldo} disabled={updateSaldo.isPending}
              className="p-1.5 rounded-lg bg-green-900/30 text-green-400 hover:bg-green-900/50">
              {updateSaldo.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </button>
            <button onClick={() => setEditSaldo(false)} className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 text-xs">&times;</button>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard title="Saldo Atual" value={saldo} format="currency" icon={Wallet} color={saldo > 0 ? "green" : "red"} subtitle={fluxo ? `Atualizado ${new Date(fluxo.data_atualizacao).toLocaleDateString("pt-BR")}` : "—"} />
        <MetricCard title="Runway" value={`${runway} meses`} icon={ArrowLeftRight} color={runway < 3 ? "red" : runway < 6 ? "gold" : "green"} subtitle={`Burn medio: R$ ${burnMedio.toFixed(0)}/mes`} />
        <MetricCard title="Entradas Previstas" value={totalEntradas} format="currency" icon={TrendingUp} color="green" subtitle={`${(entradas ?? []).length} renovacoes`} />
        <MetricCard title="Saidas Previstas" value={totalSaidas} format="currency" icon={TrendingDown} color="red" subtitle={`${(saidas ?? []).length} despesas (90d)`} />
      </div>

      {/* Projecao 90 dias */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h2 className="text-sm font-semibold text-white">Projecao de Saldo — Proximos 90 dias</h2>
          {minProjecao < 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-900/30 text-red-400 border border-red-800/30">
              Saldo negativo projetado
            </span>
          )}
        </div>
        {(projecao ?? []).length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={projecao} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="saldoGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="saldoRed" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#dc2626" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="data" tick={{ fill: "#6b7280", fontSize: 10 }}
                tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }}
                interval={14} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(v) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#f9fafb" }}
                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Saldo"]}
                labelFormatter={(v) => new Date(v).toLocaleDateString("pt-BR")} />
              <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="4 4" strokeWidth={1.5} />
              <Area type="monotone" dataKey="saldo" stroke="#16a34a" strokeWidth={2}
                fill="url(#saldoGreen)" fillOpacity={1}
                activeDot={{ r: 4, fill: "#16a34a" }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <div className="h-48 flex items-center justify-center text-gray-600 text-sm">Sem dados</div>}
      </div>

      {/* Tables: Entradas + Saidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {/* Entradas */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />Entradas Previstas
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Descricao</th>
                  <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                  <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {(entradas ?? []).map((e) => (
                  <tr key={e.id} className="hover:bg-gray-800/30">
                    <td className="py-2.5 px-4 text-gray-300">{e.descricao}</td>
                    <td className="py-2.5 px-4 text-right text-green-400 font-medium">+R$ {e.valor.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right text-gray-500 text-xs">{new Date(e.data).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
                {(entradas ?? []).length === 0 && (
                  <tr><td colSpan={3} className="py-8 text-center text-gray-600 text-xs">Nenhuma entrada prevista</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Saidas */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-400" />Saidas Previstas (90d)
            </h2>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead className="sticky top-0 bg-gray-900">
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Descricao</th>
                  <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                  <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {(saidas ?? []).map((s, i) => (
                  <tr key={`${s.id}-${i}`} className="hover:bg-gray-800/30">
                    <td className="py-2.5 px-4 text-gray-300">{s.descricao}</td>
                    <td className="py-2.5 px-4 text-right text-red-400 font-medium">-R$ {s.valor.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right text-gray-500 text-xs">{new Date(s.data).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
                {(saidas ?? []).length === 0 && (
                  <tr><td colSpan={3} className="py-8 text-center text-gray-600 text-xs">Nenhuma saida prevista</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Saques / movimentações manuais de caixa ── */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Banknote className="w-4 h-4 text-[#C9A84C]" />Saques & Movimentações manuais
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Saque EasyFlow, retirada ou transferência — você escolhe o efeito no saldo.</p>
          </div>
          <button onClick={() => setShowSaque(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#C9A84C] text-gray-900 hover:bg-yellow-500 transition-colors shrink-0">
            <Plus className="w-3.5 h-3.5" />Novo
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Descrição</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Origem</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Efeito</th>
                <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                <th className="py-2.5 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {(saques ?? []).map((s) => {
                const meta = EFEITO_META[s.efeito];
                return (
                  <tr key={s.id} className="hover:bg-gray-800/30">
                    <td className="py-2.5 px-4 text-gray-300">{s.descricao}</td>
                    <td className="py-2.5 px-4 text-gray-500 text-xs capitalize">{s.origem}</td>
                    <td className="py-2.5 px-4">
                      <span className={`text-xs font-medium ${meta.cls}`}>{meta.label}</span>
                      <span className="text-[10px] text-gray-600 ml-1">{meta.hint}</span>
                    </td>
                    <td className={`py-2.5 px-4 text-right font-medium ${meta.cls}`}>{meta.sign}R$ {s.valor.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right text-gray-500 text-xs">{new Date(s.data).toLocaleDateString("pt-BR")}</td>
                    <td className="py-2.5 px-4 text-right">
                      <button onClick={() => { if (confirm("Excluir este saque?")) deleteSaque.mutate(s.id); }}
                        className="text-gray-600 hover:text-red-400 transition-colors" aria-label="Excluir">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {(saques ?? []).length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-gray-600 text-xs">Nenhum saque registrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {/* Modal — registrar saque */}
    {showSaque && (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowSaque(false)}>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="p-5 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Banknote className="w-4 h-4 text-[#C9A84C]" />Registrar saque
            </h3>
            <button onClick={() => setShowSaque(false)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Descrição *</label>
              <input value={saqueForm.descricao} onChange={(e) => setSaqueForm({ ...saqueForm, descricao: e.target.value })}
                placeholder="Ex.: Saque EasyFlow para conta da empresa" autoFocus
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Valor (R$) *</label>
                <input type="number" step="0.01" min="0" value={saqueForm.valor} onChange={(e) => setSaqueForm({ ...saqueForm, valor: e.target.value })}
                  placeholder="0,00"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Data</label>
                <input type="date" value={saqueForm.data} onChange={(e) => setSaqueForm({ ...saqueForm, data: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Origem</label>
              <div className="grid grid-cols-3 gap-2">
                {(["easyflow", "banco", "outro"] as const).map((o) => (
                  <button key={o} type="button" onClick={() => setSaqueForm({ ...saqueForm, origem: o })}
                    className={`px-2 py-2 rounded-lg text-xs font-medium capitalize transition-colors border ${saqueForm.origem === o ? "bg-[#C9A84C]/15 border-[#C9A84C]/50 text-[#C9A84C]" : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"}`}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Efeito no saldo *</label>
              <div className="space-y-1.5">
                {(["somar", "subtrair", "neutro"] as const).map((ef) => {
                  const meta = EFEITO_META[ef];
                  const active = saqueForm.efeito === ef;
                  return (
                    <button key={ef} type="button" onClick={() => setSaqueForm({ ...saqueForm, efeito: ef })}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors border ${active ? "bg-gray-800 border-[#C9A84C]/50" : "bg-gray-800/40 border-gray-700 hover:border-gray-600"}`}>
                      <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${active ? "border-[#C9A84C]" : "border-gray-600"}`}>
                        {active && <span className="w-2 h-2 rounded-full bg-[#C9A84C]" />}
                      </span>
                      <span className="flex-1">
                        <span className={`text-sm font-medium ${meta.cls}`}>{meta.label}</span>
                        <span className="text-[11px] text-gray-500 ml-2">{meta.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Responsável (opcional)</label>
              <input value={saqueForm.responsavel} onChange={(e) => setSaqueForm({ ...saqueForm, responsavel: e.target.value })}
                placeholder="Quem fez o saque"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]" />
            </div>
          </div>
          <div className="p-5 border-t border-gray-800 flex justify-end gap-2">
            <button onClick={() => setShowSaque(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800">Cancelar</button>
            <button onClick={handleSaveSaque} disabled={createSaque.isPending || !saqueForm.descricao.trim() || !saqueForm.valor}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-[#C9A84C] text-gray-900 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {createSaque.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Registrar
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
