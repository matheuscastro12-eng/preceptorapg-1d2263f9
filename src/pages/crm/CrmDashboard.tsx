import { Link } from "react-router-dom";
import { DollarSign, Users, TrendingDown, AlertTriangle, Zap, Target, Loader2 } from "lucide-react";
import MetricCard from "@/components/crm/MetricCard";
import FunnelChart from "@/components/crm/FunnelChart";
import HealthMap from "@/components/crm/HealthMap";
import ChurnTable from "@/components/crm/ChurnTable";
import AutomationsLog from "@/components/crm/AutomationsLog";
import { useDashboardKpis, useFunnelKpis, useHealthDistribution, useActiveChurnRisks, useRecentAutomations } from "@/hooks/useCrm";

const emptyFunnel = {
  produto: "preceptormed" as const,
  visitors: 0, signups: 0, active_trials: 0, engaged: 0, subscribers: 0, churned: 0,
  visitor_to_signup_pct: 0, trial_to_engaged_pct: 0, engaged_to_subscriber_pct: 0,
};

export default function CrmDashboard() {
  const { data: kpis, isLoading: kpisLoading } = useDashboardKpis();
  const { data: funnelData } = useFunnelKpis("preceptormed");
  const { data: healthData } = useHealthDistribution();
  const { data: churnData } = useActiveChurnRisks({});
  const { data: automationsData } = useRecentAutomations({ pageSize: 20 });

  const funnel = funnelData?.[0] ?? emptyFunnel;

  if (kpisLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-48" />
        <div className="grid grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-gray-800 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 bg-gray-800 rounded-xl" />
          <div className="h-64 bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const k = kpis ?? { mrr: 0, totalSubscribers: 0, totalLeads: 0, churnRate: 0, churnRisks: 0, automationsToday: 0, avgLtv: 0 };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard CRM</h1>
          <p className="text-sm text-gray-500 mt-0.5">Preceptor Group &middot; Atualizado em tempo real via Supabase</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/30 rounded-full border border-green-800/50">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Live</span>
          </div>
          <span className="text-xs text-gray-600 px-2">PreceptorMED</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard title="MRR" value={k.mrr} format="currency" icon={DollarSign} color="green" subtitle="Receita mensal recorrente" />
        <MetricCard title="Assinantes" value={k.totalSubscribers} icon={Users} color="blue" subtitle="Meta: 1.000" />
        <MetricCard title="Churn Rate" value={k.churnRate} format="percent" icon={TrendingDown} color="red" subtitle="Ultimos 30 dias" />
        <MetricCard title="Em Risco" value={k.churnRisks} icon={AlertTriangle} color="gold" subtitle="Previsao de churn" />
        <MetricCard title="Automacoes Hoje" value={k.automationsToday} icon={Zap} color="purple" subtitle="Emails + Push + WhatsApp" />
        <MetricCard title="LTV Medio" value={k.avgLtv} format="currency" icon={Target} color="green" subtitle="Life-time value estimado" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-white">Funil de Conversao</h2>
              <p className="text-xs text-gray-500 mt-0.5">{(funnel.visitors ?? 0).toLocaleString("pt-BR")} visitantes este mes</p>
            </div>
          </div>
          <FunnelChart data={funnel} />
        </div>

        <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-white">Mapa de Saude dos Alunos</h2>
              <p className="text-xs text-gray-500 mt-0.5">Score 0-100 por engajamento</p>
            </div>
          </div>
          <HealthMap data={healthData ?? []} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900/80 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Maiores Riscos de Churn</h2>
              <p className="text-xs text-gray-500 mt-0.5">{churnData?.total ?? 0} usuarios em risco detectados</p>
            </div>
            <Link to="/admin/crm/churn" className="text-xs text-green-400 hover:text-green-300 font-medium">Ver todos &rarr;</Link>
          </div>
          <ChurnTable predictions={(churnData?.predictions ?? []).slice(0, 5)} />
        </div>

        <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Automacoes Recentes</h2>
              <p className="text-xs text-gray-500 mt-0.5">{k.automationsToday} hoje</p>
            </div>
            <Link to="/admin/crm/automations" className="text-xs text-green-400 hover:text-green-300 font-medium">Ver todas &rarr;</Link>
          </div>
          <AutomationsLog automations={automationsData?.automations ?? []} />
        </div>
      </div>
    </div>
  );
}
