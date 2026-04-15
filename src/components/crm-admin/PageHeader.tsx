import { useState } from "react";
import { RefreshCw } from "lucide-react";

type Period = "7d" | "30d" | "90d";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  showPeriodFilter?: boolean;
  period?: Period;
  onPeriodChange?: (period: Period) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: Date;
  actions?: React.ReactNode;
}

export default function PageHeader({
  title, subtitle, showPeriodFilter = false, period: controlledPeriod, onPeriodChange,
  onRefresh, isRefreshing, lastUpdated, actions,
}: PageHeaderProps) {
  const [internalPeriod, setInternalPeriod] = useState<Period>("30d");
  const period = controlledPeriod ?? internalPeriod;
  const setPeriod = onPeriodChange ?? setInternalPeriod;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">{title}</h1>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs md:text-sm text-gray-500">{subtitle}</p>
          {lastUpdated && (
            <span className="text-[10px] text-gray-600 px-1.5 py-0.5 bg-gray-800/50 rounded">
              {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showPeriodFilter && (
          <div className="flex gap-0.5 bg-gray-800/60 rounded-lg p-0.5">
            {(["7d", "30d", "90d"] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  period === p
                    ? "bg-[#C9A84C] text-gray-900 shadow-sm shadow-[#C9A84C]/20"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                }`}>
                {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "90 dias"}
              </button>
            ))}
          </div>
        )}
        {actions}
        {onRefresh && (
          <button onClick={onRefresh} disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        )}
      </div>
    </div>
  );
}
