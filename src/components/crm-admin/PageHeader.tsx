import { useState } from "react";

type Period = "7d" | "30d" | "90d";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  showPeriodFilter?: boolean;
  period?: Period;
  onPeriodChange?: (period: Period) => void;
}

export default function PageHeader({ title, subtitle, showPeriodFilter = false, period: controlledPeriod, onPeriodChange }: PageHeaderProps) {
  const [internalPeriod, setInternalPeriod] = useState<Period>("30d");
  const period = controlledPeriod ?? internalPeriod;
  const setPeriod = onPeriodChange ?? setInternalPeriod;

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      {showPeriodFilter && (
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {(["7d", "30d", "90d"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                period === p ? "bg-[#C9A84C] text-gray-900" : "text-gray-400 hover:text-white"
              }`}>
              {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "90 dias"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
