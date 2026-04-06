import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color?: "green" | "gold" | "red" | "blue" | "purple";
  format?: "number" | "currency" | "percent";
}

const colorMap = {
  green: { bg: "bg-green-900/30", icon: "text-green-400", border: "border-green-800/50", value: "text-green-400" },
  gold: { bg: "bg-yellow-900/30", icon: "text-yellow-400", border: "border-yellow-800/50", value: "text-yellow-400" },
  red: { bg: "bg-red-900/30", icon: "text-red-400", border: "border-red-800/50", value: "text-red-400" },
  blue: { bg: "bg-blue-900/30", icon: "text-blue-400", border: "border-blue-800/50", value: "text-blue-400" },
  purple: { bg: "bg-purple-900/30", icon: "text-purple-400", border: "border-purple-800/50", value: "text-purple-400" },
};

function formatValue(value: string | number, format?: MetricCardProps["format"]): string {
  if (typeof value === "string") return value;
  if (format === "currency") {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }
  if (format === "percent") return `${value}%`;
  return new Intl.NumberFormat("pt-BR").format(value);
}

export default function MetricCard({ title, value, subtitle, icon: Icon, trend, trendLabel, color = "green", format }: MetricCardProps) {
  const colors = colorMap[color];
  const TrendIcon = trend === undefined || trend === 0 ? Minus : trend > 0 ? TrendingUp : TrendingDown;
  const trendColor = trend === undefined || trend === 0 ? "text-gray-500" : trend > 0 ? "text-green-400" : "text-red-400";

  return (
    <div className={`relative overflow-hidden rounded-xl border ${colors.border} bg-gray-900/80 p-5 backdrop-blur`}>
      <div className={`absolute inset-0 ${colors.bg} opacity-30 pointer-events-none`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm text-gray-400 font-medium">{title}</p>
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            <Icon className={`w-4 h-4 ${colors.icon}`} />
          </div>
        </div>
        <p className={`text-2xl font-bold ${colors.value} mb-1`}>{formatValue(value, format)}</p>
        <div className="flex items-center gap-2">
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
              <TrendIcon className="w-3 h-3" />
              <span>{trendLabel ?? `${Math.abs(trend)}%`}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
