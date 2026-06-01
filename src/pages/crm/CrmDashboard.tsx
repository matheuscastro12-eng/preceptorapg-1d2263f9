import { Link } from "react-router-dom";
import { DollarSign, Users, TrendingDown, AlertTriangle, Zap, Target } from "lucide-react";
import MetricCard from "@/components/crm/MetricCard";
import FunnelChart from "@/components/crm/FunnelChart";
// Removido temporariamente — investigando crash do CRM
// import OnlineUsersWidget from "@/components/crm/OnlineUsersWidget";
import HealthMap from "@/components/crm/HealthMap";
import ChurnTable from "@/components/crm/ChurnTable";
import AutomationsLog from "@/components/crm/AutomationsLog";
import { useDashboardKpis, useFunnelKpis, useHealthDistribution, useActiveChurnRisks, useRecentAutomations } from "@/hooks/useCrm";
import { useCrmRealtime } from "@/hooks/useCrmRealtime";
import { ErrorState, MetricRowSkeleton } from "@/components/crm/QueryState";
import { Skeleton } from "@/components/ui/skeleton";

const emptyFunnel = {
  produto: "preceptormed" as const,
  visitors: 0, signups: 0, active_trials: 0, engaged: 0, subscribers: 0, churned: 0,
  visitor_to_signup_pct: 0, trial_to_engaged_pct: 0, engaged_to_subscriber_pct: 0,
};

export default function CrmDashboard() {
  useCrmRealtime(); // invalida queries quando vendas/leads/inadimplencias mudam + toasts
  const { data: kpis, isLoading: kpisLoading, isError: kpisError, error: kpisErrObj, refetch: refetchKpis } = useDashboardKpis();
  const { data: funnelData } = useFunnelKpis("preceptormed");
  const { data: healthData } = useHealthDistribution();
  const { data: churnData } = useActiveChurnRisks({});
  const { data: automationsData } = useRecentAutomations({ pageSize: 20 });

  const funnel = funnelData?.[0] ?? emptyFunnel;

  if (kpisError) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState error={kpisErrObj as Error} onRetry={() => refetchKpis()} />
      </div>
    );
  }

  if (kpisLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 bg-gray-800" />
          <Skeleton className="h-3 w-64 bg-gray-800" />
        </div>
        <MetricRowSkeleton count={6} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 bg-gray-800 rounded-xl" />
          <Skeleton className="h-64 bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const k = kpis ?? { mrr: 0, totalSubscribers: 0, totalLeads: 0, churnRate: 0, churnRisks: 0, automationsToday: 0, avgLtv: 0 };

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Dashboard CRM</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">Preceptor Group &middot; Atualizado em tempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/30 rounded-full border border-green-800/50">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Live</span>
          </div>
          <span className="text-xs text-gray-600 px-2 hidden sm:inline">PreceptorMED</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        <MetricCard
          title="MRR"
          value={k.mrr}
          format="currency"
          icon={DollarSign}
          color="green"
          subtitle="Receita mensal recorrente"
          tooltip="Soma mensal dos planos ativos. Mensal R$49,90 · Anual R$29,24/mes · Bianual R$99,98/mes."
        />
        <MetricCard
          title="Assinantes"
          value={k.totalSubscribers}
          icon={Users}
          color="blue"
          subtitle="Meta: 1.000"
          tooltip="Total de users com subscriptions.status='active' e plan_type pago."
        />
        <MetricCard
          title="Churn Rate"
          value={k.churnRate}
          format="percent"
          icon={TrendingDown}
          color="red"
          subtitle="Ultimos 30 dias"
          tooltip="% de assinantes que cancelaram nos ultimos 30 dias. Benchmark SaaS educacional: <5%/mes e saudavel."
        />
        <MetricCard
          title="Em Risco"
          value={k.churnRisks}
          icon={AlertTriangle}
          color="gold"
          subtitle="Previsao de churn"
          tooltip="Numero de assinantes que o motor de ML detectou como propenso a cancelar nos proximos 14 dias (churn_probability >= 40%)."
        />
        <MetricCard
          title="Automacoes"
          value={k.automationsToday}
          icon={Zap}
          color="purple"
          subtitle="Emails + Push + WhatsApp"
          tooltip="Quantidade de automacoes disparadas hoje em crm_automations_log — emails transacionais, alertas de engajamento, etc."
        />
        <MetricCard
          title="LTV Medio"
          value={k.avgLtv}
          format="currency"
          icon={Target}
          color="green"
          subtitle="Life-time value"
          tooltip="Valor total medio que cada assinante gerou desde que se inscreveu. Calculado como (receita total / total de assinantes)."
        />
      </div>

      {/* Online ao vivo — temporariamente desabilitado, investigando crash */}
      {/* <OnlineUsersWidget /> */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <div>
              <h2 className="text-sm md:text-base font-semibold text-white">Funil de Conversao</h2>
              <p className="text-xs text-gray-500 mt-0.5">{(funnel.visitors ?? 0).toLocaleString("pt-BR")} visitantes este mes</p>
            </div>
          </div>
          <FunnelChart data={funnel} />
        </div>

        <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <div>
              <h2 className="text-sm md:text-base font-semibold text-white">Mapa de Saude dos Alunos</h2>
              <p className="text-xs text-gray-500 mt-0.5">Score 0-100 por engajamento</p>
            </div>
          </div>
          <HealthMap data={healthData ?? []} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        <div className="lg:col-span-2 bg-gray-900/80 rounded-xl border border-gray-800 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm md:text-base font-semibold text-white">Maiores Riscos de Churn</h2>
              <p className="text-xs text-gray-500 mt-0.5">{churnData?.total ?? 0} usuarios em risco</p>
            </div>
            <Link to="/admin/crm-mkt/churn" className="text-xs text-green-400 hover:text-green-300 font-medium">Ver todos &rarr;</Link>
          </div>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="min-w-[500px] px-4 md:px-0">
              <ChurnTable predictions={(churnData?.predictions ?? []).slice(0, 5)} />
            </div>
          </div>
        </div>

        <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm md:text-base font-semibold text-white">Automacoes Recentes</h2>
              <p className="text-xs text-gray-500 mt-0.5">{k.automationsToday} hoje</p>
            </div>
            <Link to="/admin/crm-mkt/automations" className="text-xs text-green-400 hover:text-green-300 font-medium">Ver todas &rarr;</Link>
          </div>
          <AutomationsLog automations={automationsData?.automations ?? []} />
        </div>
      </div>
    </div>
  );
}
