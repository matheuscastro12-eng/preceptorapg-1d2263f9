import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface FunnelTimeSeriesChartProps {
  data: Record<string, string | number>[];
}

const STAGE_COLORS: Record<string, string> = {
  signup: "#3b82f6",
  active_trial: "#8b5cf6",
  engaged: "#f59e0b",
  subscriber: "#16a34a",
  churned: "#dc2626",
};

const STAGE_LABELS: Record<string, string> = {
  signup: "Cadastros",
  active_trial: "Trial Ativo",
  engaged: "Engajados",
  subscriber: "Assinantes",
  churned: "Churns",
};

export default function FunnelTimeSeriesChart({ data }: FunnelTimeSeriesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
        Nenhum dado de serie temporal disponivel ainda
      </div>
    );
  }

  const stages = Object.keys(data[0] ?? {}).filter((k) => k !== "date");

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          tickFormatter={(val) => {
            const date = new Date(val);
            return `${date.getDate()}/${date.getMonth() + 1}`;
          }}
        />
        <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
        <Tooltip
          contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#f9fafb" }}
          labelStyle={{ color: "#9ca3af", marginBottom: 4 }}
        />
        <Legend formatter={(value) => STAGE_LABELS[value] ?? value} wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
        {stages.map((stage) => (
          <Line key={stage} type="monotone" dataKey={stage} stroke={STAGE_COLORS[stage] ?? "#6b7280"} strokeWidth={2} dot={false} name={stage} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
