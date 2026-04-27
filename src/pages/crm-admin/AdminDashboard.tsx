import { DollarSign, Users, TrendingUp, TrendingDown, ArrowLeftRight, Target, Calendar, Crosshair, Star, LineChart as LineChartIcon } from "lucide-react";
import { ErrorState, MetricRowSkeleton } from "@/components/crm/QueryState";
import { Skeleton } from "@/components/ui/skeleton";
import { useCrmRealtime } from "@/hooks/useCrmRealtime";
import RevenueIntelligence from "@/components/crm-admin/RevenueIntelligence";
import MetricDrillDown, { type DrillDownPoint } from "@/components/crm/MetricDrillDown";
import { useState } from "react";
import { supabase } from "@/lib/crm/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import MetricCard from "@/components/crm/MetricCard";
import OnlineUsersWidget from "@/components/crm/OnlineUsersWidget";
import PageHeader from "@/components/crm-admin/PageHeader";
import { useAdminDashboardKpis, useMrrHistory, useDespesasPorCategoria } from "@/hooks/useAdminDashboard";
import { useOneOnOneAlerts } from "@/hooks/useOneOnOne";
import { usePDIStats } from "@/hooks/usePDI";
import { usePromocoesTrimestrais } from "@/hooks/useCarreira";
import { useBPHighlights } from "@/hooks/useBPHighlights";
import { useMembros } from "@/hooks/useTime";

const CATEGORIA_LABELS: Record<string, string> = {
  infra: "Infraestrutura",
  marketing: "Marketing",
  salarios: "Salarios",
  ferramentas: "Ferramentas & SaaS",
  juridico: "Juridico",
  outros: "Outros",
};

const CATEGORIA_COLORS: Record<string, string> = {
  salarios: "#ef4444",
  ferramentas: "#8b5cf6",
  marketing: "#f59e0b",
  infra: "#3b82f6",
  juridico: "#6b7280",
  outros: "#6b7280",
};

export default function AdminDashboard() {
  useCrmRealtime();
  const [drillKey, setDrillKey] = useState<string | null>(null);
  const { data: kpis, isLoading, isError, error, refetch } = useAdminDashboardKpis();

  // Loader do drill-down do MRR — puxa historico mensal de assinaturas ativas
  const loadMrrHistoryForDrill = async (): Promise<DrillDownPoint[]> => {
    const since = new Date(Date.now() - 180 * 86400000).toISOString();
    const { data } = await supabase
      .from("subscriptions")
      .select("plan_type, status, updated_at, created_at")
      .or(`status.eq.active,status.eq.inadimplente`)
      .gte("created_at", since);
    const subs = data ?? [];
    // Agrupa por mes
    const byMonth: Record<string, number> = {};
    const planValue = (p: string) => p === "monthly" ? 49.9 : p === "annual" ? 350.9 / 12 : p === "biannual" ? 599.9 / 6 : 0;
    for (const s of subs) {
      const mo = (s.created_at ?? s.updated_at).slice(0, 7);
      byMonth[mo] = (byMonth[mo] ?? 0) + planValue(s.plan_type);
    }
    return Object.entries(byMonth).sort().map(([date, value]) => ({ date, value: Math.round(value) }));
  };

  const loadBurnHistory = async (): Promise<DrillDownPoint[]> => {
    const since = new Date(Date.now() - 180 * 86400000).toISOString();
    const { data } = await supabase
      .from("admin_despesas")
      .select("valor, data")
      .gte("data", since);
    const rows = data ?? [];
    const byMonth: Record<string, number> = {};
    for (const r of rows) {
      const mo = (r.data as string).slice(0, 7);
      byMonth[mo] = (byMonth[mo] ?? 0) + Number(r.valor ?? 0);
    }
    return Object.entries(byMonth).sort().map(([date, value]) => ({ date, value: Math.round(value) }));
  };

  const loadHeadcountHistory = async (): Promise<DrillDownPoint[]> => {
    const { data } = await supabase.from("admin_membros").select("data_admissao, data_saida, ativo");
    const membros = data ?? [];
    if (membros.length === 0) return [];
    // Conta membros ativos em cada fim de mes dos ultimos 6 meses
    const points: DrillDownPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setUTCMonth(d.getUTCMonth() - i);
      d.setUTCDate(28);
      const dayStr = d.toISOString();
      const count = membros.filter((m: any) => {
        const entrou = m.data_admissao ? new Date(m.data_admissao) <= d : true;
        const saiu = m.data_saida ? new Date(m.data_saida) <= d : false;
        return entrou && !saiu;
      }).length;
      points.push({ date: dayStr.slice(0, 7), value: count });
    }
    return points;
  };
  const { data: mrrHistory } = useMrrHistory();
  const { data: despesasCat } = useDespesasPorCategoria();
  const { data: ooAlerts } = useOneOnOneAlerts();
  const { data: pdiStats } = usePDIStats();
  const promoTri = usePromocoesTrimestrais();
  const { data: allMembros } = useMembros();
  const { data: bp } = useBPHighlights(2026);

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState error={error as Error} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64 bg-gray-800" />
        <MetricRowSkeleton count={5} />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-64 bg-gray-800 rounded-xl" />
          <Skeleton className="h-64 bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const k = kpis!;

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PageHeader title="Dashboard Administrativo" subtitle="Visao consolidada de Financas & People" showPeriodFilter />
        <RevenueIntelligence />
      </div>

      {/* Online ao vivo */}
      <OnlineUsersWidget />

      {/* KPI Bar — clicar abre drill-down, passar mouse mostra tooltip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <MetricCard
          title="MRR"
          value={k.mrr}
          format="currency"
          icon={DollarSign}
          color="green"
          subtitle="Receita mensal · Clique p/ detalhar"
          tooltip="Monthly Recurring Revenue. Soma do valor mensal de todos os assinantes ativos: mensais (R$49,90), anuais (R$29,24/mes) e bianuais (R$99,98/mes). Exclui trials, free_access e inadimplentes."
          onClick={() => setDrillKey("mrr")}
        />
        <MetricCard
          title="ARR"
          value={k.arr}
          format="currency"
          icon={TrendingUp}
          color="green"
          subtitle="MRR x 12"
          tooltip="Annual Recurring Revenue — projecao anual do MRR atual. So faz sentido se a base esta relativamente estavel no periodo."
        />
        <MetricCard
          title="Runway"
          value={`${k.runway} meses`}
          icon={ArrowLeftRight}
          color={k.runway < 3 ? "red" : "gold"}
          subtitle="Saldo / burn rate"
          tooltip="Quantos meses de operacao o saldo atual aguenta na taxa de queima atual (burn rate). Menos de 3 meses e zona vermelha — acao urgente."
        />
        <MetricCard
          title="Headcount"
          value={k.headcount}
          icon={Users}
          color="blue"
          subtitle="Membros ativos · Clique p/ detalhar"
          tooltip="Numero de membros do time com data_saida nula em admin_membros."
          onClick={() => setDrillKey("headcount")}
        />
        <MetricCard
          title="Burn Rate"
          value={k.burnRate}
          format="currency"
          icon={TrendingDown}
          color="red"
          subtitle="Despesas do mes · Clique p/ detalhar"
          tooltip="Soma de todas as despesas do mes atual em admin_despesas: salarios, infra, marketing, ferramentas, etc."
          onClick={() => setDrillKey("burn")}
        />
      </div>

      <MetricDrillDown
        open={drillKey === "mrr"}
        onClose={() => setDrillKey(null)}
        title="MRR — Historico"
        currentValue={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(k.mrr)}
        format="currency"
        loader={loadMrrHistoryForDrill}
        accentColor="#10b981"
      />
      <MetricDrillDown
        open={drillKey === "headcount"}
        onClose={() => setDrillKey(null)}
        title="Headcount — Historico"
        currentValue={String(k.headcount)}
        format="number"
        loader={loadHeadcountHistory}
        accentColor="#3b82f6"
      />
      <MetricDrillDown
        open={drillKey === "burn"}
        onClose={() => setDrillKey(null)}
        title="Burn Rate — Historico de despesas"
        currentValue={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(k.burnRate)}
        format="currency"
        loader={loadBurnHistory}
        accentColor="#f87171"
      />

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 mb-1">Assinantes Ativos</p>
          <p className="text-2xl font-bold text-green-400">{k.assinantesAtivos}</p>
        </div>
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 mb-1">Churn Rate</p>
          <p className={`text-2xl font-bold ${k.churnRate > 10 ? "text-red-400" : k.churnRate > 5 ? "text-yellow-400" : "text-green-400"}`}>{k.churnRate}%</p>
        </div>
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 mb-1">Ticket Medio</p>
          <p className="text-2xl font-bold text-blue-400">R$ {k.ticketMedio.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 mb-1">Novas Receitas (mes)</p>
          <p className="text-2xl font-bold text-[#C9A84C]">{k.novasReceitas}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR History */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">MRR - Ultimos 6 meses</h2>
          {(mrrHistory ?? []).length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={mrrHistory} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="mes" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#f9fafb" }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "MRR"]}
                />
                <Line type="monotone" dataKey="mrr" stroke="#16a34a" strokeWidth={2.5} dot={{ fill: "#16a34a", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">Sem dados</div>
          )}
        </div>

        {/* Despesas por Categoria */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Despesas por Categoria</h2>
          {(despesasCat ?? []).length > 0 ? (
            <div className="space-y-3">
              {(despesasCat ?? []).map((d) => {
                const max = despesasCat![0].total;
                const pct = max > 0 ? (d.total / max) * 100 : 0;
                return (
                  <div key={d.categoria}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300">{CATEGORIA_LABELS[d.categoria] ?? d.categoria}</span>
                      <span className="text-sm font-bold text-white">R$ {d.total.toFixed(2)}</span>
                    </div>
                    <div className="h-6 bg-gray-800 rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg transition-all duration-700"
                        style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: CATEGORIA_COLORS[d.categoria] ?? "#6b7280" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">Sem dados</div>
          )}
        </div>
      </div>

      {/* BP Highlights */}
      {bp && (
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">Business Plan — Mês Atual</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
            <MetricCard title="Receita Bruta" value={bp.receitaBrutaMes} format="currency" icon={DollarSign} color="green" subtitle="Projetada" />
            <MetricCard title="EBITDA" value={bp.ebitdaMes} format="currency" icon={TrendingUp} color="purple" subtitle="Projetado" />
            <MetricCard title="Margem EBITDA" value={`${bp.margemEbitda}%`} icon={Target} color="gold" subtitle="EBITDA / Receita" />
            <MetricCard title="Lucro Líquido" value={bp.lucroLiquidoMes} format="currency" icon={DollarSign} color="green" subtitle="Projetado" />
            <MetricCard title="Aporte Acumulado" value={bp.aporteAcumulado} format="currency" icon={ArrowLeftRight} color="blue" subtitle="No ano" />
          </div>
          {bp.lucroMensal.length > 0 && (
            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-400 mb-3">Lucro Líquido Projetado — Abr a Dez</h3>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={bp.lucroMensal} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="mes" tick={{ fill: "#6b7280", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 9 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#f9fafb" }}
                    formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Lucro"]} />
                  <Line type="monotone" dataKey="valor" stroke="#C9A84C" strokeWidth={2} dot={{ fill: "#C9A84C", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* People Health */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3">People Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <MetricCard title="1:1s em dia" value={(allMembros ?? []).filter(m => m.status === "ativo").length - (ooAlerts ?? []).length} icon={Calendar} color="green" subtitle={`${(ooAlerts ?? []).length} pendentes`} />
          <MetricCard title="PDIs ativos" value={pdiStats?.ativos ?? 0} icon={Crosshair} color="gold" subtitle="Em andamento" />
          <MetricCard title="Promocoes" value={promoTri.data ?? 0} icon={Star} color="purple" subtitle="Neste trimestre" />
        </div>
      </div>
    </div>
  );
}
