import { useFunnelKpis, useFunnelTimeSeries } from "@/hooks/useCrm";
import FunnelChart from "@/components/crm/FunnelChart";
import FunnelTimeSeriesChart from "@/components/crm/FunnelTimeSeriesChart";

const emptyFunnel = {
  produto: "preceptormed" as const,
  visitors: 0, signups: 0, active_trials: 0, engaged: 0, subscribers: 0, churned: 0,
  visitor_to_signup_pct: 0, trial_to_engaged_pct: 0, engaged_to_subscriber_pct: 0,
};

const targets = { visitors: 200000, signups: 12000, active_trials: 8400, engaged: 6000, subscribers: 1000 };

export default function CrmFunnel() {
  const { data: funnelKpis, isLoading } = useFunnelKpis();
  const { data: timeSeries } = useFunnelTimeSeries(30);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-48" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 bg-gray-800 rounded-xl" />
          <div className="h-64 bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const med = funnelKpis?.find((f) => f.produto === "preceptormed") ?? emptyFunnel;

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Funil de Conversao</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-0.5">Visitante &rarr; Signup &rarr; Trial &rarr; Engajado &rarr; Assinante</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
          <h2 className="text-sm md:text-base font-semibold text-white mb-4">PreceptorMED — Funil Atual</h2>
          <FunnelChart data={med} />
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
          <h2 className="text-sm md:text-base font-semibold text-white mb-4">Progresso vs. Meta Estrategica</h2>
          <div className="space-y-4">
            {Object.entries(targets).map(([key, target]) => {
              const actual = (med[key as keyof typeof med] as number) ?? 0;
              const pct = Math.min(100, Math.round((actual / target) * 100));
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300 capitalize">{key.replace("_", " ")}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{actual.toLocaleString("pt-BR")}</span>
                      <span className="text-gray-500">/</span>
                      <span className="text-gray-500">{target.toLocaleString("pt-BR")}</span>
                      <span className={`text-xs font-bold ${pct >= 80 ? "text-green-400" : pct >= 50 ? "text-yellow-400" : "text-red-400"}`}>{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 p-3 bg-[#1B5E3B]/10 border border-green-900/50 rounded-lg">
            <p className="text-xs text-green-400 font-medium">Meta do Plano Estrategico</p>
            <p className="text-xs text-gray-400 mt-1">200K visitantes &rarr; 1.000 assinantes/mes ate Set/2026 (conversao global 0,5%)</p>
          </div>
        </div>
      </div>

      {(funnelKpis ?? []).length > 1 && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
          <h2 className="text-base font-semibold text-white mb-4">Todos os Produtos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(funnelKpis ?? []).map((funnel) => (
              <div key={funnel.produto}>
                <h3 className="text-sm font-medium text-gray-400 mb-3 capitalize">{funnel.produto}</h3>
                <FunnelChart data={funnel} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
        <h2 className="text-sm md:text-base font-semibold text-white mb-1">Evolucao do Funil (30 dias)</h2>
        <p className="text-xs text-gray-500 mb-4">Transicoes de estagio por dia</p>
        <FunnelTimeSeriesChart data={timeSeries ?? []} />
      </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
        <h2 className="text-sm md:text-base font-semibold text-white mb-4">12 Automacoes do Funil</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { day: "D0", name: "Boas-vindas", trigger: "Signup", channel: "Email" },
            { day: "D+1", name: "Ativacao", trigger: "24h apos signup", channel: "Email" },
            { day: "D+3", name: "Engajamento", trigger: "3 dias sem questao", channel: "Email" },
            { day: "D+5", name: "Prova Social", trigger: "5 dias no trial", channel: "Email" },
            { day: "D+6", name: "Oferta 20%", trigger: "Nao engajou", channel: "WhatsApp" },
            { day: "D+7", name: "Ultimo Dia", trigger: "Trial expirando", channel: "Email + Push" },
            { day: "D+14", name: "Win-back", trigger: "Trial expirado sem converter", channel: "Email" },
            { day: "RT", name: "Alerta de Saude", trigger: "Score < 40", channel: "Email" },
            { day: "RT", name: "Anti-Churn", trigger: "Prob churn > 70%", channel: "Push + WhatsApp" },
            { day: "Semanal", name: "Indicacao", trigger: "Score > 80", channel: "Email" },
            { day: "Seasonal", name: "Upsell Cross", trigger: "ENEM trigger", channel: "Email" },
            { day: "Mensal", name: "Reativacao", trigger: "Churned > 30 dias", channel: "Email + SMS" },
          ].map((auto) => (
            <div key={auto.name} className="flex items-start gap-3 p-3 bg-gray-800/60 rounded-lg border border-gray-700/50">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-300">{auto.day}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{auto.name}</p>
                <p className="text-xs text-gray-500">{auto.trigger}</p>
                <span className="inline-block mt-1 text-xs px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded">{auto.channel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
