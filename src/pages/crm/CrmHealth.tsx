import { useSearchParams } from "react-router-dom";
import { Heart, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useHealthDistribution, useHealthScoresList } from "@/hooks/useCrm";
import HealthMap from "@/components/crm/HealthMap";
import { HEALTH_ZONE_LABELS, HEALTH_ZONE_COLORS, type HealthZone } from "@/lib/crm/types";

export default function CrmHealth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const zone = searchParams.get("zone") as HealthZone | undefined;
  const planFilter = (searchParams.get("plan") as "all" | "paying" | "free" | "none" | null) ?? "all";
  const page = parseInt(searchParams.get("page") ?? "1");

  const { data: distribution, isLoading } = useHealthDistribution();
  const { data: scoresData } = useHealthScoresList({ zone: zone || undefined, planFilter, page });

  const setPlanFilter = (p: "all" | "paying" | "free" | "none") => {
    const params = Object.fromEntries(searchParams.entries());
    if (p === "all") delete params.plan; else params.plan = p;
    delete params.page;
    setSearchParams(params);
  };

  const scores = scoresData?.scores ?? [];
  const total = scoresData?.total ?? 0;
  const totalPages = Math.ceil(total / 50);

  const goToPage = (p: number) => {
    const params = Object.fromEntries(searchParams.entries());
    params.page = String(p);
    setSearchParams(params);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-48" />
        <div className="h-96 bg-gray-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Student Health Score</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-0.5">Score 0-100 baseado em frequencia, desempenho, engajamento e tendencia</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        <div className="lg:col-span-1 bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
          <h2 className="text-sm md:text-base font-semibold text-white mb-4">Distribuicao por Zona</h2>
          <HealthMap data={distribution ?? []} />
        </div>

        <div className="lg:col-span-2 bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
          <h2 className="text-sm md:text-base font-semibold text-white mb-4">Como o Score e Calculado</h2>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {[
              { label: "Frequencia", pts: 30, color: "#3b82f6", items: ["Dias ativos 14d (20pts)", "Streak atual (10pts)"] },
              { label: "Desempenho", pts: 25, color: "#8b5cf6", items: ["% acertos questoes", "80%+ = 25pts"] },
              { label: "Engajamento", pts: 25, color: "#f59e0b", items: ["Questoes 7d (15pts)", "Features usadas (10pts)"] },
              { label: "Tendencia", pts: 20, color: "#16a34a", items: ["vs semana anterior", "+10pts delta = 20pts"] },
            ].map((c) => (
              <div key={c.label} className="p-3 md:p-4 rounded-xl border" style={{ borderColor: `${c.color}30`, backgroundColor: `${c.color}08` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs md:text-sm font-semibold" style={{ color: c.color }}>{c.label}</span>
                  <span className="text-sm md:text-lg font-bold" style={{ color: c.color }}>{c.pts}pts</span>
                </div>
                <ul className="space-y-1">
                  {c.items.map((item) => (
                    <li key={item} className="text-[10px] md:text-xs text-gray-500 flex items-start gap-1">
                      <span style={{ color: c.color }}>&middot;</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-3 md:mt-4 grid grid-cols-4 gap-2 md:gap-3">
            {(["healthy", "attention", "risk", "critical"] as HealthZone[]).map((z) => (
              <div key={z} className="text-center p-1.5 md:p-2 rounded-lg" style={{ backgroundColor: `${HEALTH_ZONE_COLORS[z]}15` }}>
                <p className="text-xs md:text-sm font-bold" style={{ color: HEALTH_ZONE_COLORS[z] }}>
                  {z === "healthy" ? "80-100" : z === "attention" ? "60-79" : z === "risk" ? "40-59" : "0-39"}
                </p>
                <p className="text-[10px] md:text-xs text-gray-500">{HEALTH_ZONE_LABELS[z]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-3 md:p-4 border-b border-gray-800 flex gap-2 overflow-x-auto items-center">
          <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold whitespace-nowrap">Plano:</span>
          {([
            { key: "all", label: "Todos" },
            { key: "paying", label: "Pagantes" },
            { key: "free", label: "Gratuitos" },
            { key: "none", label: "Sem acesso" },
          ] as const).map((p) => (
            <button
              key={p.key}
              onClick={() => setPlanFilter(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${planFilter === p.key ? "bg-[#1B5E3B] text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="p-3 md:p-4 border-b border-gray-800 flex gap-2 overflow-x-auto">
          <button
            onClick={() => {
              const params = Object.fromEntries(searchParams.entries());
              delete params.zone;
              delete params.page;
              setSearchParams(params);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${!zone ? "bg-[#1B5E3B] text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
          >
            Todos ({total})
          </button>
          {(["critical", "risk", "attention", "healthy"] as HealthZone[]).map((z) => {
            const count = (distribution ?? []).find((d) => d.zone === z)?.total ?? 0;
            return (
              <button
                key={z}
                onClick={() => {
                  const params = Object.fromEntries(searchParams.entries());
                  params.zone = z;
                  delete params.page;
                  setSearchParams(params);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${zone === z ? "text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                style={zone === z ? { backgroundColor: HEALTH_ZONE_COLORS[z] } : {}}
              >
                {HEALTH_ZONE_LABELS[z]} ({count})
              </button>
            );
          })}
        </div>

        {/* Mobile card view */}
        <div className="md:hidden divide-y divide-gray-800/50">
          {scores.map((hs: any) => {
            const zoneColor = HEALTH_ZONE_COLORS[hs.zone as HealthZone];
            const lead = hs.crm_leads;
            const variacao = hs.variacao_score;
            return (
              <div key={hs.id} className="p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{lead?.nome ?? "—"}</p>
                    <p className="text-[10px] text-gray-500">{lead?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold" style={{ color: zoneColor }}>{hs.score}</span>
                    <span className="text-[10px] text-gray-600">/100</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: `${zoneColor}20`, color: zoneColor, border: `1px solid ${zoneColor}40` }}>
                    {HEALTH_ZONE_LABELS[hs.zone as HealthZone]}
                  </span>
                  <div className="flex items-center gap-1">
                    {variacao > 0 ? <TrendingUp className="w-3 h-3 text-green-400" /> : variacao < 0 ? <TrendingDown className="w-3 h-3 text-red-400" /> : <Minus className="w-3 h-3 text-gray-400" />}
                    <span className={`text-[10px] font-medium ${variacao > 0 ? "text-green-400" : variacao < 0 ? "text-red-400" : "text-gray-400"}`}>
                      {variacao > 0 ? "+" : ""}{variacao}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div><p className="text-[10px] text-gray-600">Freq</p><p className="text-xs font-medium text-blue-400">{hs.pts_frequencia}/30</p></div>
                  <div><p className="text-[10px] text-gray-600">Desemp</p><p className="text-xs font-medium text-purple-400">{hs.pts_desempenho}/25</p></div>
                  <div><p className="text-[10px] text-gray-600">Engaj</p><p className="text-xs font-medium text-yellow-400">{hs.pts_engajamento}/25</p></div>
                  <div><p className="text-[10px] text-gray-600">Acertos</p><p className={`text-xs font-medium ${hs.acertos_pct >= 70 ? "text-green-400" : hs.acertos_pct >= 50 ? "text-yellow-400" : "text-red-400"}`}>{Math.round(hs.acertos_pct)}%</p></div>
                </div>
              </div>
            );
          })}
          {scores.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              <Heart className="w-8 h-8 mx-auto mb-2 text-gray-700" />
              <p className="text-sm">Nenhum Health Score calculado ainda</p>
              <p className="text-xs mt-1">O cron job roda a cada hora</p>
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {["Aluno", "Score", "Zona", "Frequencia", "Desempenho", "Engajamento", "Tendencia", "Questoes 7d", "Acertos"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {scores.map((hs: any) => {
                const zoneColor = HEALTH_ZONE_COLORS[hs.zone as HealthZone];
                const lead = hs.crm_leads;
                const variacao = hs.variacao_score;
                return (
                  <tr key={hs.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-white">{lead?.nome ?? "—"}</p>
                      <p className="text-xs text-gray-500">{lead?.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold" style={{ color: zoneColor }}>{hs.score}</span>
                        <span className="text-xs text-gray-600">/100</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: `${zoneColor}20`, color: zoneColor, border: `1px solid ${zoneColor}40` }}>
                        {HEALTH_ZONE_LABELS[hs.zone as HealthZone]}
                      </span>
                    </td>
                    <td className="py-3 px-4"><span className="font-medium text-blue-400">{hs.pts_frequencia}</span><span className="text-gray-600">/30</span></td>
                    <td className="py-3 px-4"><span className="font-medium text-purple-400">{hs.pts_desempenho}</span><span className="text-gray-600">/25</span></td>
                    <td className="py-3 px-4"><span className="font-medium text-yellow-400">{hs.pts_engajamento}</span><span className="text-gray-600">/25</span></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {variacao > 0 ? <TrendingUp className="w-3.5 h-3.5 text-green-400" /> : variacao < 0 ? <TrendingDown className="w-3.5 h-3.5 text-red-400" /> : <Minus className="w-3.5 h-3.5 text-gray-400" />}
                        <span className={`text-xs font-medium ${variacao > 0 ? "text-green-400" : variacao < 0 ? "text-red-400" : "text-gray-400"}`}>
                          {variacao > 0 ? "+" : ""}{variacao}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4"><span className="text-sm text-gray-300">{hs.questoes_7d}</span></td>
                    <td className="py-3 px-4">
                      <span className={`text-sm font-medium ${hs.acertos_pct >= 70 ? "text-green-400" : hs.acertos_pct >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                        {Math.round(hs.acertos_pct)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {scores.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    <Heart className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                    <p>Nenhum Health Score calculado ainda</p>
                    <p className="text-xs mt-1">O cron job roda a cada hora</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-3 md:p-4 border-t border-gray-800 flex items-center justify-between">
            <p className="text-[10px] md:text-xs text-gray-500">{total} registros</p>
            <div className="flex gap-2">
              {page > 1 && <button onClick={() => goToPage(page - 1)} className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs md:text-sm rounded-lg hover:bg-gray-700">&larr;</button>}
              <span className="px-3 py-1.5 text-xs md:text-sm text-gray-500">{page}/{totalPages}</span>
              {page < totalPages && <button onClick={() => goToPage(page + 1)} className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs md:text-sm rounded-lg hover:bg-gray-700">&rarr;</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
