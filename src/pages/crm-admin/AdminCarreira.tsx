import { useState } from "react";
import { TrendingUp, Loader2, ChevronRight, Star, Plus, X } from "lucide-react";
import { useTrilhas, usePosicoes, usePromover } from "@/hooks/useCarreira";
import { useMembros } from "@/hooks/useTime";

const AREAS = ["tech", "marketing", "ops"];
const AREA_LABELS: Record<string, string> = { tech: "Tech", marketing: "Marketing", ops: "Operacoes" };
const AREA_COLORS: Record<string, string> = { tech: "#3b82f6", marketing: "#8b5cf6", ops: "#f59e0b" };

export default function AdminCarreira() {
  const [area, setArea] = useState("tech");
  const { data: trilhas, isLoading } = useTrilhas(area);
  const { data: posicoes } = usePosicoes();
  const { data: membros } = useMembros();
  const promover = usePromover();
  const [showPromover, setShowPromover] = useState(false);
  const [promoForm, setPromoForm] = useState({ membro_id: "", trilha_id: "" });

  const areaColor = AREA_COLORS[area] ?? "#6b7280";

  // Map members to their current positions
  const membroPosMap: Record<string, string> = {};
  (posicoes ?? []).forEach((p) => { membroPosMap[p.membro_id] = p.trilha_id; });

  const getMembrosInTrilha = (trilhaId: string) => {
    return (membros ?? []).filter((m) => membroPosMap[m.id] === trilhaId);
  };

  const handlePromover = async () => {
    if (!promoForm.membro_id || !promoForm.trilha_id) return;
    await promover.mutateAsync({ membro_id: promoForm.membro_id, trilha_id: promoForm.trilha_id, promovido_por: "Admin" });
    setShowPromover(false);
    setPromoForm({ membro_id: "", trilha_id: "" });
  };

  if (isLoading) {
    return <div className="p-4 md:p-6 flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" /></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Plano de Carreira</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">Trilhas de crescimento por area</p>
        </div>
        <button onClick={() => setShowPromover(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#C9A84C] text-gray-900 hover:bg-yellow-500 transition-colors">
          <Star className="w-3.5 h-3.5" />Promover Membro
        </button>
      </div>

      {/* Area tabs */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 w-fit">
        {AREAS.map((a) => (
          <button key={a} onClick={() => setArea(a)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${area === a ? "text-gray-900" : "text-gray-400 hover:text-white"}`}
            style={area === a ? { backgroundColor: AREA_COLORS[a] } : {}}>
            {AREA_LABELS[a]}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-6">
        <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
          {(trilhas ?? []).map((t, i) => {
            const membrosHere = getMembrosInTrilha(t.id);
            const isLast = i === (trilhas ?? []).length - 1;

            return (
              <div key={t.id} className="flex items-stretch">
                {/* Level card */}
                <div className="w-48 flex-shrink-0">
                  <div className="bg-gray-800/80 rounded-xl p-4 border border-gray-700/50 h-full flex flex-col">
                    {/* Level indicator */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: areaColor }}>
                        {t.nivel}
                      </div>
                      <span className="text-sm font-bold text-white">{t.titulo}</span>
                    </div>

                    {/* Salary range */}
                    {(t.salario_min || t.salario_max) && (
                      <p className="text-[10px] text-gray-500 mb-2">
                        R$ {t.salario_min?.toLocaleString("pt-BR")} - {t.salario_max?.toLocaleString("pt-BR")}
                      </p>
                    )}

                    {/* Tempo medio */}
                    {t.tempo_medio_meses > 0 && (
                      <p className="text-[10px] text-gray-600 mb-3">{t.tempo_medio_meses} meses medio</p>
                    )}

                    {/* Responsabilidades */}
                    {(t.responsabilidades as string[] ?? []).length > 0 && (
                      <div className="mb-2">
                        <p className="text-[8px] uppercase text-gray-600 font-semibold mb-1">Responsabilidades</p>
                        {(t.responsabilidades as string[]).slice(0, 3).map((r, ri) => (
                          <p key={ri} className="text-[10px] text-gray-400 flex items-start gap-1">
                            <span style={{ color: areaColor }}>·</span>{r}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Members at this level */}
                    {membrosHere.length > 0 && (
                      <div className="mt-auto pt-2 border-t border-gray-700/50">
                        {membrosHere.map((m) => {
                          const pos = (posicoes ?? []).find((p) => p.membro_id === m.id && p.trilha_id === t.id);
                          const meses = pos ? Math.floor((Date.now() - new Date(pos.data_inicio).getTime()) / (30 * 86400000)) : 0;
                          return (
                            <div key={m.id} className="flex items-center gap-2 py-1">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: areaColor }}>
                                {m.nome.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                              </div>
                              <div>
                                <p className="text-[10px] text-white font-medium">{m.nome}</p>
                                <p className="text-[8px] text-gray-600">{meses}m neste nivel</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow connector */}
                {!isLast && (
                  <div className="flex items-center px-1 flex-shrink-0">
                    <ChevronRight className="w-4 h-4" style={{ color: areaColor }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Promover Modal */}
      {showPromover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowPromover(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Promover Membro</h2>
              <button onClick={() => setShowPromover(false)} className="p-1 rounded-full hover:bg-gray-800"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Membro</label>
                <select value={promoForm.membro_id} onChange={(e) => setPromoForm({ ...promoForm, membro_id: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]">
                  <option value="">Selecionar...</option>
                  {(membros ?? []).filter(m => m.status === "ativo").map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Novo nivel</label>
                <select value={promoForm.trilha_id} onChange={(e) => setPromoForm({ ...promoForm, trilha_id: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#C9A84C]">
                  <option value="">Selecionar...</option>
                  {(trilhas ?? []).map((t) => <option key={t.id} value={t.id}>{t.titulo} (Nivel {t.nivel})</option>)}
                </select>
              </div>
              <button onClick={handlePromover} disabled={promover.isPending || !promoForm.membro_id || !promoForm.trilha_id}
                className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[#C9A84C] text-gray-900 hover:bg-yellow-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {promover.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                {promover.isPending ? "Promovendo..." : "Confirmar Promocao"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
