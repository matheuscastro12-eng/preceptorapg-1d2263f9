import type { HealthDistribution } from "@/lib/crm/types";
import { HEALTH_ZONE_LABELS, HEALTH_ZONE_COLORS } from "@/lib/crm/types";

interface HealthMapProps {
  data: HealthDistribution[];
}

const zoneOrder = ["healthy", "attention", "risk", "critical"] as const;

export default function HealthMap({ data }: HealthMapProps) {
  const total = data.reduce((acc, d) => acc + d.total, 0);

  const byZone = zoneOrder.map((zone) => {
    const zoneData = data.find((d) => d.zone === zone);
    return {
      zone,
      total: zoneData?.total ?? 0,
      avg_score: zoneData?.avg_score ?? 0,
      avg_questoes_7d: zoneData?.avg_questoes_7d ?? 0,
      pct: total > 0 ? Math.round(((zoneData?.total ?? 0) / total) * 100) : 0,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {byZone.map((z) => (
          <div
            key={z.zone}
            style={{ width: `${z.pct}%`, backgroundColor: HEALTH_ZONE_COLORS[z.zone] }}
            className="transition-all duration-700"
            title={`${HEALTH_ZONE_LABELS[z.zone]}: ${z.pct}%`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {byZone.map((z) => (
          <div
            key={z.zone}
            className="rounded-xl p-3 border"
            style={{ borderColor: `${HEALTH_ZONE_COLORS[z.zone]}40`, backgroundColor: `${HEALTH_ZONE_COLORS[z.zone]}10` }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: HEALTH_ZONE_COLORS[z.zone] }} />
                <span className="text-xs font-semibold text-gray-300">{HEALTH_ZONE_LABELS[z.zone]}</span>
              </div>
              <span className="text-lg font-bold" style={{ color: HEALTH_ZONE_COLORS[z.zone] }}>{z.total}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Score medio</span>
                <span className="text-gray-300 font-medium">{z.avg_score}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Questoes/7d</span>
                <span className="text-gray-300 font-medium">{z.avg_questoes_7d}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">% do total</span>
                <span className="font-bold" style={{ color: HEALTH_ZONE_COLORS[z.zone] }}>{z.pct}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-gray-800">
        <span className="text-xs text-gray-500">Total de alunos monitorados</span>
        <span className="text-sm font-bold text-white">{total.toLocaleString("pt-BR")}</span>
      </div>
    </div>
  );
}
