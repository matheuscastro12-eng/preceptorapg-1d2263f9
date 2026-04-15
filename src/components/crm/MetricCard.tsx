import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { useState } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color?: "green" | "gold" | "red" | "blue" | "purple";
  format?: "number" | "currency" | "percent";
  tooltip?: string;
  previousValue?: number;
  sparkData?: number[];
  loading?: boolean;
  onClick?: () => void;
}

const colorMap = {
  green: {
    bg: "bg-emerald-500/8",
    iconBg: "bg-emerald-500/12",
    icon: "text-emerald-400",
    border: "border-emerald-500/15",
    value: "text-emerald-400",
    spark: "#34d399",
    glow: "shadow-emerald-500/5",
  },
  gold: {
    bg: "bg-amber-500/8",
    iconBg: "bg-amber-500/12",
    icon: "text-amber-400",
    border: "border-amber-500/15",
    value: "text-amber-400",
    spark: "#fbbf24",
    glow: "shadow-amber-500/5",
  },
  red: {
    bg: "bg-red-500/8",
    iconBg: "bg-red-500/12",
    icon: "text-red-400",
    border: "border-red-500/15",
    value: "text-red-400",
    spark: "#f87171",
    glow: "shadow-red-500/5",
  },
  blue: {
    bg: "bg-blue-500/8",
    iconBg: "bg-blue-500/12",
    icon: "text-blue-400",
    border: "border-blue-500/15",
    value: "text-blue-400",
    spark: "#60a5fa",
    glow: "shadow-blue-500/5",
  },
  purple: {
    bg: "bg-violet-500/8",
    iconBg: "bg-violet-500/12",
    icon: "text-violet-400",
    border: "border-violet-500/15",
    value: "text-violet-400",
    spark: "#a78bfa",
    glow: "shadow-violet-500/5",
  },
};

function formatValue(value: string | number, format?: MetricCardProps["format"]): string {
  if (typeof value === "string") return value;
  if (format === "currency") {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }
  if (format === "percent") return `${value.toFixed(1)}%`;
  return new Intl.NumberFormat("pt-BR").format(value);
}

function MiniSparkline({ data, color, height = 28 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `0,${height} ${points} ${w},${height}`;

  return (
    <svg width={w} height={height} className="opacity-60">
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-${color.replace("#", "")})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-800/40 bg-gray-900/60 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="h-3 w-20 bg-gray-800 rounded" />
        <div className="h-8 w-8 bg-gray-800 rounded-lg" />
      </div>
      <div className="h-7 w-28 bg-gray-800 rounded mb-2" />
      <div className="h-2.5 w-16 bg-gray-800/60 rounded" />
    </div>
  );
}

export default function MetricCard({
  title, value, subtitle, icon: Icon, trend, trendLabel,
  color = "green", format, tooltip, previousValue, sparkData, loading, onClick,
}: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const colors = colorMap[color];

  if (loading) return <SkeletonCard />;

  // Calculate delta vs previous period
  const numValue = typeof value === "number" ? value : 0;
  const delta = previousValue !== undefined && previousValue !== 0
    ? ((numValue - previousValue) / Math.abs(previousValue)) * 100
    : undefined;

  // Use trend if provided, else use computed delta
  const displayTrend = trend ?? delta;
  const TrendIcon = displayTrend === undefined || displayTrend === 0 ? Minus : displayTrend > 0 ? TrendingUp : TrendingDown;
  const trendColor = displayTrend === undefined || displayTrend === 0
    ? "text-gray-500"
    : displayTrend > 0 ? "text-emerald-400" : "text-red-400";
  const trendBg = displayTrend === undefined || displayTrend === 0
    ? "bg-gray-800/50"
    : displayTrend > 0 ? "bg-emerald-500/10" : "bg-red-500/10";

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border ${colors.border} bg-gray-900/60 backdrop-blur-sm p-5 transition-all duration-300 hover:bg-gray-900/80 hover:border-opacity-40 hover:shadow-lg ${colors.glow} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      onMouseEnter={() => tooltip && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Subtle gradient overlay */}
      <div className={`absolute inset-0 ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

      {/* Tooltip */}
      {showTooltip && tooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-w-[220px]">
          <p className="text-[11px] text-gray-300 leading-relaxed">{tooltip}</p>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 border-l border-t border-gray-700 rotate-45" />
        </div>
      )}

      <div className="relative">
        {/* Header row: title + icon */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] text-gray-400 font-medium tracking-tight">{title}</p>
            {tooltip && <Info className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />}
          </div>
          <div className={`p-2 rounded-lg ${colors.iconBg} transition-transform duration-300 group-hover:scale-110`}>
            <Icon className={`w-4 h-4 ${colors.icon}`} />
          </div>
        </div>

        {/* Value row with sparkline */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className={`text-2xl font-bold text-white mb-1 tracking-tight`}>
              {formatValue(value, format)}
            </p>
            <div className="flex items-center gap-2">
              {subtitle && <p className="text-[11px] text-gray-500">{subtitle}</p>}
              {displayTrend !== undefined && (
                <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${trendBg} ${trendColor}`}>
                  <TrendIcon className="w-2.5 h-2.5" />
                  <span>{trendLabel ?? `${Math.abs(displayTrend).toFixed(1)}%`}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sparkline */}
          {sparkData && sparkData.length > 1 && (
            <div className="flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
              <MiniSparkline data={sparkData} color={colors.spark} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
