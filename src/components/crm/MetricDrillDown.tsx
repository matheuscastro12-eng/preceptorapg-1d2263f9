import { useEffect, useState } from "react";
import { X, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

export interface DrillDownPoint {
  date: string;   // "2026-03" ou "2026-03-15"
  value: number;
  label?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  currentValue: string;
  format?: "currency" | "number" | "percent";
  loader: () => Promise<DrillDownPoint[]>;
  accentColor?: string;
}

const fmt = (v: number, f?: string) => {
  if (f === "currency") return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
  if (f === "percent") return `${v.toFixed(1)}%`;
  return new Intl.NumberFormat("pt-BR").format(v);
};

export default function MetricDrillDown({ open, onClose, title, currentValue, format, loader, accentColor = "#10b981" }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DrillDownPoint[]>([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    loader().then((pts) => setData(pts)).finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const first = data[0]?.value ?? 0;
  const last = data[data.length - 1]?.value ?? 0;
  const delta = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0;
  const up = delta >= 0;

  const min = data.length > 0 ? Math.min(...data.map((d) => d.value)) : 0;
  const max = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border-l border-gray-800 w-full max-w-2xl h-full overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 px-6 py-4 border-b border-gray-800 bg-gray-900/95 backdrop-blur flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white font-[Manrope]">{title}</h2>
            <p className="text-xs text-gray-500">Historico dos ultimos meses</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* KPI principal */}
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Valor atual</p>
              <p className="text-3xl font-bold text-white">{currentValue}</p>
            </div>
            {data.length >= 2 && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${up ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                {up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {up ? "+" : ""}{delta.toFixed(1)}%
                <span className="text-[10px] font-normal opacity-70 ml-1">vs inicio</span>
              </div>
            )}
          </div>

          {/* Grafico */}
          <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
              </div>
            ) : data.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-gray-500">Sem dados historicos</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="drillFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={accentColor} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={(v) => fmt(v, format)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                    formatter={(v: number) => fmt(v, format)}
                  />
                  <Area type="monotone" dataKey="value" stroke={accentColor} strokeWidth={2} fill="url(#drillFill)" />
                  <Line type="monotone" dataKey="value" stroke={accentColor} strokeWidth={2} dot={{ r: 3, fill: accentColor }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Tabela historica */}
          <div className="bg-gray-950/60 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800">
              <h3 className="text-sm font-bold text-white">Historico detalhado</h3>
            </div>
            <div className="divide-y divide-gray-800/40 max-h-80 overflow-y-auto">
              {data.slice().reverse().map((p, i) => (
                <div key={p.date} className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm text-gray-400">{p.label || p.date}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{fmt(p.value, format)}</span>
                    {i < data.length - 1 && (() => {
                      const prev = data[data.length - 1 - i - 1]?.value ?? p.value;
                      const d = prev !== 0 ? ((p.value - prev) / Math.abs(prev)) * 100 : 0;
                      const u = d >= 0;
                      return (
                        <span className={`text-[10px] font-semibold ${u ? "text-green-400" : "text-red-400"}`}>
                          {u ? "+" : ""}{d.toFixed(0)}%
                        </span>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Min / Max */}
          {data.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Minimo</p>
                <p className="text-base font-bold text-white mt-0.5">{fmt(min, format)}</p>
              </div>
              <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Maximo</p>
                <p className="text-base font-bold text-white mt-0.5">{fmt(max, format)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
