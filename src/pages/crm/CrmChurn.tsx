import { useSearchParams } from "react-router-dom";
import { AlertTriangle, Shield } from "lucide-react";
import { useActiveChurnRisks } from "@/hooks/useCrm";
import ChurnTable from "@/components/crm/ChurnTable";
import { RISK_LEVEL_COLORS, type RiskLevel } from "@/lib/crm/types";
import { ErrorState, MetricRowSkeleton } from "@/components/crm/QueryState";
import { Skeleton } from "@/components/ui/skeleton";

const RISK_LABELS: Record<RiskLevel, string> = { low: "Baixo", medium: "Medio", high: "Alto", critical: "Critico" };

export default function CrmChurn() {
  const [searchParams, setSearchParams] = useSearchParams();
  const risk_level = searchParams.get("risk_level") as RiskLevel | undefined;
  const page = parseInt(searchParams.get("page") ?? "1");

  const { data: allRisksData, isLoading, isError, error, refetch } = useActiveChurnRisks({ page: 1, pageSize: 500 });
  const { data: filteredData } = useActiveChurnRisks({ risk_level: risk_level || undefined, page });

  const predictions = filteredData?.predictions ?? [];
  const total = filteredData?.total ?? 0;
  const totalPages = Math.ceil(total / 50);
  const allPredictions = allRisksData?.predictions ?? [];

  const riskCounts = {
    critical: allPredictions.filter((p) => p.risk_level === "critical").length,
    high: allPredictions.filter((p) => p.risk_level === "high").length,
    medium: allPredictions.filter((p) => p.risk_level === "medium").length,
    low: allPredictions.filter((p) => p.risk_level === "low").length,
  };

  const avgChurnProb = allPredictions.length > 0
    ? Math.round(allPredictions.reduce((acc, p) => acc + p.churn_probability, 0) / allPredictions.length * 100)
    : 0;

  const goToPage = (p: number) => {
    const params = Object.fromEntries(searchParams.entries());
    params.page = String(p);
    setSearchParams(params);
  };

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState error={error as Error} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48 bg-gray-800" />
        <MetricRowSkeleton count={4} />
        <Skeleton className="h-96 bg-gray-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Anti-Churn Engine</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-0.5">ML identifica risco de churn 14 dias antes &middot; Intervencoes automaticas</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {(["critical", "high", "medium", "low"] as RiskLevel[]).map((level) => {
          const count = riskCounts[level];
          const color = RISK_LEVEL_COLORS[level];
          return (
            <button
              key={level}
              onClick={() => setSearchParams(risk_level === level ? {} : { risk_level: level })}
              className={`relative overflow-hidden rounded-xl border p-5 text-left cursor-pointer transition-all hover:scale-[1.02] ${risk_level === level ? "ring-2 ring-offset-2 ring-offset-gray-950" : ""}`}
              style={{ borderColor: `${color}40`, backgroundColor: `${color}08`, ...(risk_level === level ? { ["--tw-ring-color" as string]: color } : {}) }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{RISK_LABELS[level]}</p>
                  <p className="text-2xl md:text-3xl font-bold" style={{ color }}>{count}</p>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                  <AlertTriangle className="w-4 h-4" style={{ color }} />
                </div>
              </div>
              <div className="mt-3">
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(allRisksData?.total ?? 0) > 0 ? (count / (allRisksData?.total ?? 1)) * 100 : 0}%`, backgroundColor: color }} />
                </div>
                <p className="text-xs text-gray-600 mt-1">{(allRisksData?.total ?? 0) > 0 ? Math.round((count / (allRisksData?.total ?? 1)) * 100) : 0}% do total</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
        <h2 className="text-sm md:text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-400" />
          Playbook de Intervencoes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="p-4 rounded-xl border border-yellow-800/40 bg-yellow-900/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-sm font-semibold text-yellow-400">Medio (40-59%)</span>
            </div>
            <p className="text-xs text-gray-300 font-medium mb-1">Email personalizado</p>
            <p className="text-xs text-gray-500">Mensagem com base nos sinais detectados. Oferece conteudo relevante e mostra progresso do aluno para reengajar.</p>
          </div>
          <div className="p-4 rounded-xl border border-orange-800/40 bg-orange-900/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-sm font-semibold text-orange-400">Alto (60-79%)</span>
            </div>
            <p className="text-xs text-gray-300 font-medium mb-1">Push + WhatsApp com oferta de mentoria</p>
            <p className="text-xs text-gray-500">Notificacao push + mensagem WhatsApp oferecendo sessao gratuita com mentor.</p>
          </div>
          <div className="p-4 rounded-xl border border-red-800/40 bg-red-900/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-sm font-semibold text-red-400">Critico (80%+)</span>
            </div>
            <p className="text-xs text-gray-300 font-medium mb-1">Desconto 30% + ligacao do time</p>
            <p className="text-xs text-gray-500">Desconto exclusivo de 30% no plano anual + ligacao proativa do time de sucesso dentro de 24h.</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-800">
          <p className="text-xs font-semibold text-gray-400 mb-2">Sinais Monitorados (roda a cada 4h)</p>
          <div className="flex flex-wrap gap-2">
            {["Login caiu >= 50% na semana", "Zero questoes em 5 dias", "3+ emails nao abertos", "Cartao recusado", "Acessou pagina de cancelamento", "Tentou downgrade", "Health Score < 40", "Sem login por 7 dias", "Streak quebrado"].map((signal) => (
              <span key={signal} className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded-lg border border-gray-700">{signal}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-3 md:p-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm md:text-base font-semibold text-white">{risk_level ? `Risco ${RISK_LABELS[risk_level]}` : "Todos os Riscos"}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{total} usuarios &middot; Prob. media: {avgChurnProb}%</p>
          </div>
          {risk_level && (
            <button onClick={() => setSearchParams({})} className="text-xs text-gray-400 hover:text-white">&times; Limpar filtro</button>
          )}
        </div>
        <div className="p-3 md:p-4 overflow-x-auto">
          <div className="min-w-[500px]">
            <ChurnTable predictions={predictions} />
          </div>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-800 flex items-center justify-between">
            <p className="text-xs text-gray-500">{total} riscos ativos</p>
            <div className="flex gap-2">
              {page > 1 && <button onClick={() => goToPage(page - 1)} className="px-3 py-1.5 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700">&larr; Anterior</button>}
              <span className="px-3 py-1.5 text-sm text-gray-500">{page}/{totalPages}</span>
              {page < totalPages && <button onClick={() => goToPage(page + 1)} className="px-3 py-1.5 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700">Proxima &rarr;</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
