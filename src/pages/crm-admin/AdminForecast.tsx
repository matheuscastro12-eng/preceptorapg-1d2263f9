import { useState, useMemo } from "react";
import { DollarSign, Users, TrendingUp, Save, Loader2, Check, Star } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import MetricCard from "@/components/crm/MetricCard";
import {
  usePremissas, usePremissaAtiva, useSavePremissa, useSetPremissaAtiva,
  useUpdatePremissa, useDREData, calcularReceitas,
} from "@/hooks/useForecast";
import type { Premissa } from "@/hooks/useForecast";

const MESES = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function fmtR(v: number) { return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`; }
function fmtN(v: number) { return v.toLocaleString("pt-BR"); }

export default function AdminForecast() {
  const { data: premissas } = usePremissas();
  const { data: ativa, isLoading } = usePremissaAtiva();
  const { data: dreData } = useDREData(2026);
  const savePremissa = useSavePremissa();
  const setAtiva = useSetPremissaAtiva();
  const updatePremissa = useUpdatePremissa();

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<Premissa>>({});
  const [newVersionName, setNewVersionName] = useState("");
  const [showSaveNew, setShowSaveNew] = useState(false);

  // Initialize form when ativa loads
  const p = useMemo(() => {
    if (editMode && form.total_assinantes_base !== undefined) {
      return { ...(ativa ?? {} as Premissa), ...form } as Premissa;
    }
    return ativa;
  }, [ativa, form, editMode]);

  const calc = useMemo(() => {
    if (!p) return null;
    return calcularReceitas(p);
  }, [p]);

  // DRE chart data
  const chartData = useMemo(() => {
    if (!dreData) return [];
    const findRow = (codigo: string) => dreData.find((r) => r.linha.codigo === codigo);
    const recBruta = findRow("1");
    const recLiq = findRow("ROL");
    const ebitda = findRow("EBITDA");
    return [4, 5, 6, 7, 8, 9, 10, 11, 12].map((mes) => ({
      mes: MESES[mes],
      "Receita Bruta": recBruta?.valores[mes] ?? 0,
      "Receita Líquida": recLiq?.valores[mes] ?? 0,
      "EBITDA": ebitda?.valores[mes] ?? 0,
    }));
  }, [dreData]);

  const startEdit = () => {
    if (!ativa) return;
    setForm({
      total_assinantes_base: ativa.total_assinantes_base,
      mix_mensal: ativa.mix_mensal,
      mix_anual: ativa.mix_anual,
      mix_bianual: ativa.mix_bianual,
      preco_mensal: ativa.preco_mensal,
      preco_anual: ativa.preco_anual,
      preco_bianual: ativa.preco_bianual,
      taxa_renovacao_m_m: ativa.taxa_renovacao_m_m,
      taxa_renovacao_m_a: ativa.taxa_renovacao_m_a,
      taxa_renovacao_a_a: ativa.taxa_renovacao_a_a,
      cac: ativa.cac,
    });
    setEditMode(true);
  };

  const saveEdit = async () => {
    if (!ativa) return;
    await updatePremissa.mutateAsync({ id: ativa.id, data: form });
    setEditMode(false);
  };

  const saveNewVersion = async () => {
    if (!p || !newVersionName.trim()) return;
    await savePremissa.mutateAsync({
      versao: newVersionName.trim(),
      criado_por: "Admin",
      total_assinantes_base: p.total_assinantes_base,
      mix_mensal: p.mix_mensal,
      mix_anual: p.mix_anual,
      mix_bianual: p.mix_bianual,
      preco_mensal: p.preco_mensal,
      preco_anual: p.preco_anual,
      preco_bianual: p.preco_bianual,
      taxa_renovacao_m_m: p.taxa_renovacao_m_m,
      taxa_renovacao_m_a: p.taxa_renovacao_m_a,
      taxa_renovacao_a_a: p.taxa_renovacao_a_a,
      cac: p.cac,
      ativo: false,
    });
    setShowSaveNew(false);
    setNewVersionName("");
  };

  const mixSum = ((form.mix_mensal ?? p?.mix_mensal ?? 0) + (form.mix_anual ?? p?.mix_anual ?? 0) + (form.mix_bianual ?? p?.mix_bianual ?? 0));
  const mixValid = Math.abs(mixSum - 1) < 0.001;

  const f = (field: keyof Premissa, value: number) => setForm({ ...form, [field]: value });

  if (isLoading) {
    return <div className="p-4 md:p-6 flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" /></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Forecast & Business Plan</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            Premissas de receita e projeção DRE — {p?.versao ?? "Nenhuma versão"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <button onClick={saveEdit} disabled={!mixValid || updatePremissa.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                {updatePremissa.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Salvar
              </button>
              <button onClick={() => setEditMode(false)} className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white">Cancelar</button>
            </>
          ) : (
            <>
              <button onClick={startEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#C9A84C] text-gray-900 hover:bg-yellow-500">
                Editar Premissas
              </button>
              <button onClick={() => setShowSaveNew(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-300 hover:bg-gray-700">
                <Save className="w-3.5 h-3.5" />Nova Versão
              </button>
            </>
          )}
        </div>
      </div>

      {/* ══ SEÇÃO 1: Premissas ══ */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Premissas do Business Plan</h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5">
          {/* Assinantes Base */}
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-[10px] text-gray-500 uppercase mb-1">Assinantes Base</p>
            {editMode ? (
              <input type="number" value={form.total_assinantes_base ?? ""} onChange={(e) => f("total_assinantes_base", Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-gray-800 border border-[#C9A84C] rounded text-sm text-white focus:outline-none" />
            ) : (
              <p className="text-xl font-bold text-white">{fmtN(p?.total_assinantes_base ?? 0)}</p>
            )}
          </div>
          {/* CAC */}
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-[10px] text-gray-500 uppercase mb-1">CAC (por assinante)</p>
            {editMode ? (
              <input type="number" step="0.01" value={form.cac ?? ""} onChange={(e) => f("cac", Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-gray-800 border border-[#C9A84C] rounded text-sm text-white focus:outline-none" />
            ) : (
              <p className="text-xl font-bold text-white">{fmtR(p?.cac ?? 0)}</p>
            )}
          </div>
          {/* Ticket Médio calculado */}
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-[10px] text-gray-500 uppercase mb-1">Ticket Médio</p>
            <p className="text-xl font-bold text-[#C9A84C]">{fmtR(calc?.ticketMedio ?? 0)}</p>
          </div>
          {/* CAC Total */}
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-[10px] text-gray-500 uppercase mb-1">CAC Total</p>
            <p className="text-xl font-bold text-red-400">{fmtR(calc?.cacTotal ?? 0)}</p>
          </div>
        </div>

        {/* Mix + Preços */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 mb-4">
          {(["mensal", "anual", "bianual"] as const).map((plano) => {
            const mixKey = `mix_${plano}` as keyof Premissa;
            const precoKey = `preco_${plano}` as keyof Premissa;
            const labels = { mensal: "Mensal", anual: "Anual", bianual: "Bianual" };
            const mixVal = (editMode ? form[mixKey] : p?.[mixKey]) as number ?? 0;
            const precoVal = (editMode ? form[precoKey] : p?.[precoKey]) as number ?? 0;

            return (
              <div key={plano} className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-300 mb-2">{labels[plano]}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase mb-0.5">Mix (%)</p>
                    {editMode ? (
                      <input type="number" step="0.01" min="0" max="1" value={mixVal}
                        onChange={(e) => f(mixKey, Number(e.target.value))}
                        className={`w-full px-2 py-1 bg-gray-800 border rounded text-xs text-white focus:outline-none ${mixValid ? "border-gray-700" : "border-red-500"}`} />
                    ) : (
                      <p className="text-sm font-bold text-white">{(mixVal * 100).toFixed(0)}%</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase mb-0.5">Preço (R$)</p>
                    {editMode ? (
                      <input type="number" step="0.01" value={precoVal}
                        onChange={(e) => f(precoKey, Number(e.target.value))}
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none" />
                    ) : (
                      <p className="text-sm font-bold text-white">{fmtR(precoVal)}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mix validation */}
        {editMode && !mixValid && (
          <p className="text-xs text-red-400 mb-3">Mix deve somar 100% (atual: {(mixSum * 100).toFixed(1)}%)</p>
        )}

        {/* Taxas de Renovação */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {([
            ["taxa_renovacao_m_m", "Renovação M→M"],
            ["taxa_renovacao_m_a", "Renovação M→A"],
            ["taxa_renovacao_a_a", "Renovação A→A"],
          ] as [keyof Premissa, string][]).map(([key, label]) => {
            const val = (editMode ? form[key] : p?.[key]) as number ?? 0;
            return (
              <div key={key} className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-[9px] text-gray-500 uppercase mb-0.5">{label}</p>
                {editMode ? (
                  <input type="number" step="0.01" min="0" max="1" value={val}
                    onChange={(e) => f(key, Number(e.target.value))}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none" />
                ) : (
                  <p className="text-sm font-bold text-white">{(val * 100).toFixed(0)}%</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ SEÇÃO 2: Receitas Calculadas ══ */}
      {calc && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <MetricCard title="Assin. Mensal" value={calc.assinantes.mensal} icon={Users} color="blue" subtitle={`${((p?.mix_mensal ?? 0) * 100).toFixed(0)}% do mix`} />
          <MetricCard title="Assin. Anual" value={calc.assinantes.anual} icon={Users} color="green" subtitle={`${((p?.mix_anual ?? 0) * 100).toFixed(0)}% do mix`} />
          <MetricCard title="Assin. Bianual" value={calc.assinantes.bianual} icon={Users} color="purple" subtitle={`${((p?.mix_bianual ?? 0) * 100).toFixed(0)}% do mix`} />
          <MetricCard title="Receita Aquisição" value={calc.aquisicao.total} format="currency" icon={DollarSign} color="green" subtitle="Mês 1" />
          <MetricCard title="Receita Renovação" value={calc.renovacao.total} format="currency" icon={TrendingUp} color="gold" subtitle="Mês 2+" />
          <MetricCard title="Receita Total" value={calc.receitaTotal} format="currency" icon={DollarSign} color="green" subtitle="Aquisição + Renovação" />
        </div>
      )}

      {/* Breakdown */}
      {calc && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Receita de Aquisição (Mês 1)</h3>
            <div className="space-y-2">
              {[
                { label: "Mensal", value: calc.aquisicao.mensal, count: calc.assinantes.mensal, price: p?.preco_mensal ?? 0 },
                { label: "Anual", value: calc.aquisicao.anual, count: calc.assinantes.anual, price: p?.preco_anual ?? 0 },
                { label: "Bianual", value: calc.aquisicao.bianual, count: calc.assinantes.bianual, price: p?.preco_bianual ?? 0 },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{r.label} ({r.count} × {fmtR(r.price)})</span>
                  <span className="text-sm font-bold text-white">{fmtR(r.value)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <span className="text-xs font-semibold text-gray-300">Total Aquisição</span>
                <span className="text-sm font-bold text-green-400">{fmtR(calc.aquisicao.total)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Receita de Renovação (Mês 2+)</h3>
            <div className="space-y-2">
              {[
                { label: `M→M (${((p?.taxa_renovacao_m_m ?? 0) * 100).toFixed(0)}%)`, value: calc.renovacao.mensal },
                { label: `M→A (${((p?.taxa_renovacao_m_a ?? 0) * 100).toFixed(0)}%)`, value: calc.renovacao.anualFromMensal },
                { label: `A→A (${((p?.taxa_renovacao_a_a ?? 0) * 100).toFixed(0)}%)`, value: calc.renovacao.anualFromAnual },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{r.label}</span>
                  <span className="text-sm font-bold text-white">{fmtR(r.value)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <span className="text-xs font-semibold text-gray-300">Total Renovação</span>
                <span className="text-sm font-bold text-[#C9A84C]">{fmtR(calc.renovacao.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ SEÇÃO 3: Versões do BP ══ */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Versões do Business Plan</h2>
        </div>

        {showSaveNew && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-lg">
            <input value={newVersionName} onChange={(e) => setNewVersionName(e.target.value)} placeholder="Ex: v2 - Mai/2026"
              className="flex-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-[#C9A84C]" />
            <button onClick={saveNewVersion} disabled={savePremissa.isPending || !newVersionName.trim()}
              className="px-3 py-1.5 rounded text-xs font-medium bg-[#C9A84C] text-gray-900 hover:bg-yellow-500 disabled:opacity-50">
              {savePremissa.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Salvar"}
            </button>
            <button onClick={() => setShowSaveNew(false)} className="text-xs text-gray-500 hover:text-white">×</button>
          </div>
        )}

        <div className="space-y-2">
          {(premissas ?? []).map((v) => (
            <div key={v.id} className={`flex items-center justify-between p-3 rounded-lg border ${v.ativo ? "border-[#C9A84C]/40 bg-[#C9A84C]/5" : "border-gray-800 bg-gray-800/30"}`}>
              <div className="flex items-center gap-3">
                {v.ativo && <Star className="w-3.5 h-3.5 text-[#C9A84C] fill-[#C9A84C]" />}
                <div>
                  <p className="text-sm font-medium text-white">{v.versao}</p>
                  <p className="text-[10px] text-gray-500">{new Date(v.criado_em).toLocaleDateString("pt-BR")} — {v.total_assinantes_base.toLocaleString()} assinantes</p>
                </div>
              </div>
              {!v.ativo && (
                <button onClick={() => setAtiva.mutate(v.id)} disabled={setAtiva.isPending}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-gray-400 hover:text-[#C9A84C] hover:bg-gray-800">
                  <Check className="w-3 h-3" />Ativar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ══ SEÇÃO 4: Gráfico DRE ══ */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Projeção DRE — Abril a Dezembro 2026</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="mes" tick={{ fill: "#6b7280", fontSize: 11 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={(v) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#f9fafb" }}
                formatter={(v: number) => [fmtR(v)]}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
              <Line type="monotone" dataKey="Receita Bruta" stroke="#16a34a" strokeWidth={2.5} dot={{ fill: "#16a34a", r: 3 }} />
              <Line type="monotone" dataKey="Receita Líquida" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 3 }} />
              <Line type="monotone" dataKey="EBITDA" stroke="#C9A84C" strokeWidth={2} dot={{ fill: "#C9A84C", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-600 text-sm">Sem dados DRE</div>
        )}
      </div>
    </div>
  );
}
