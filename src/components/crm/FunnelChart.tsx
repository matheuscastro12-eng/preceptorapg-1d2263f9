import type { FunnelKpis } from "@/lib/crm/types";

interface FunnelChartProps {
  data: FunnelKpis;
}

const funnelStages = [
  { key: "visitors" as const, label: "Visitantes", color: "#6b7280" },
  { key: "signups" as const, label: "Cadastros", color: "#3b82f6" },
  { key: "active_trials" as const, label: "Trial Ativo", color: "#8b5cf6" },
  { key: "engaged" as const, label: "Engajados", color: "#f59e0b" },
  { key: "subscribers" as const, label: "Assinantes", color: "#1B5E3B" },
];

function numberFormat(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString("pt-BR");
}

export default function FunnelChart({ data }: FunnelChartProps) {
  const maxValue = data.visitors || 1;

  return (
    <div className="space-y-3">
      {funnelStages.map((stage, index) => {
        const value = data[stage.key] ?? 0;
        const pct = Math.round((value / maxValue) * 100);
        const prevValue = index === 0 ? maxValue : (data[funnelStages[index - 1].key] ?? 1);
        const convRate = prevValue > 0 ? Math.round((value / prevValue) * 100) : 0;

        return (
          <div key={stage.key} className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="text-sm text-gray-300 font-medium">{stage.label}</span>
              </div>
              <div className="flex items-center gap-3">
                {index > 0 && <span className="text-xs text-gray-500">{convRate}% conversao</span>}
                <span className="text-sm font-bold text-white">{numberFormat(value)}</span>
              </div>
            </div>
            <div className="h-8 bg-gray-800 rounded-lg overflow-hidden relative">
              <div
                className="h-full rounded-lg transition-all duration-700 ease-out flex items-center px-3"
                style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: stage.color, opacity: 0.85 }}
              >
                {pct > 15 && <span className="text-xs font-medium text-white">{pct}%</span>}
              </div>
            </div>
          </div>
        );
      })}

      <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-lg font-bold text-blue-400">{data.visitor_to_signup_pct ?? 0}%</p>
          <p className="text-xs text-gray-500">Visitante &rarr; Signup</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-yellow-400">{data.trial_to_engaged_pct ?? 0}%</p>
          <p className="text-xs text-gray-500">Trial &rarr; Engajado</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-green-400">{data.engaged_to_subscriber_pct ?? 0}%</p>
          <p className="text-xs text-gray-500">Engajado &rarr; Assinante</p>
        </div>
      </div>
    </div>
  );
}
