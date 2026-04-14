import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/crm/supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2, Eye, FileText, MousePointerClick, Clock, TrendingDown } from "lucide-react";
import MetricCard from "@/components/crm/MetricCard";

interface PageView {
  id: string;
  visitor_id: string;
  session_id: string;
  page_path: string;
  referrer: string | null;
  utm_source: string | null;
  created_at: string;
}

type Period = "7d" | "14d" | "30d";

export default function CrmAnalytics() {
  const [views, setViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("7d");

  const periodDays = period === "7d" ? 7 : period === "14d" ? 14 : 30;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - periodDays * 86400000).toISOString();
      const { data } = await supabase
        .from("crm_page_views")
        .select("id, visitor_id, session_id, page_path, referrer, utm_source, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: true });
      setViews(data ?? []);
      setLoading(false);
    })();
  }, [periodDays]);

  const stats = useMemo(() => {
    const visitors = new Set(views.map((v) => v.visitor_id)).size;
    const pageviews = views.length;
    const sessions = new Set(views.map((v) => v.session_id)).size;
    const viewsPerVisit = sessions > 0 ? Math.round((pageviews / sessions) * 100) / 100 : 0;

    // Bounce rate: sessions with only 1 page view
    const sessionPageCounts: Record<string, number> = {};
    views.forEach((v) => { sessionPageCounts[v.session_id] = (sessionPageCounts[v.session_id] ?? 0) + 1; });
    const totalSessions = Object.keys(sessionPageCounts).length;
    const bounceSessions = Object.values(sessionPageCounts).filter((c) => c === 1).length;
    const bounceRate = totalSessions > 0 ? Math.round((bounceSessions / totalSessions) * 100) : 0;

    // Avg visit duration — soma os gaps entre pageviews consecutivos da sessao,
    // capando cada gap em 30 min (threshold de inatividade). Gaps maiores
    // significam que o usuario saiu/voltou e nao devem ser contados.
    // Pageviews isolados (sessao de 1 view) contam como 10s default.
    const IDLE_THRESHOLD_MS = 30 * 60 * 1000; // 30 min
    const SINGLE_VIEW_DEFAULT_MS = 10 * 1000; // 10s estimado para bounces

    const sessionEvents: Record<string, number[]> = {};
    views.forEach((v) => {
      const t = new Date(v.created_at).getTime();
      if (!sessionEvents[v.session_id]) sessionEvents[v.session_id] = [];
      sessionEvents[v.session_id].push(t);
    });

    const durations = Object.values(sessionEvents)
      .map((times) => {
        if (times.length <= 1) return SINGLE_VIEW_DEFAULT_MS;
        const sorted = [...times].sort((a, b) => a - b);
        let total = 0;
        for (let i = 1; i < sorted.length; i++) {
          const gap = sorted[i] - sorted[i - 1];
          // Cap gap em IDLE_THRESHOLD — gaps maiores significam usuario inativo
          total += Math.min(gap, IDLE_THRESHOLD_MS);
        }
        return total;
      })
      .filter((d) => d > 0);

    const avgDurationMs = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const avgDurationMin = Math.floor(avgDurationMs / 60000);
    const avgDurationSec = Math.floor((avgDurationMs % 60000) / 1000);
    const avgDurationStr = avgDurationMs > 0 ? `${avgDurationMin}m ${avgDurationSec}s` : "—";

    return { visitors, pageviews, viewsPerVisit, bounceRate, avgDurationStr };
  }, [views]);

  // Time series: visitors per day
  const timeSeries = useMemo(() => {
    const byDay: Record<string, Set<string>> = {};
    views.forEach((v) => {
      const day = v.created_at.split("T")[0];
      if (!byDay[day]) byDay[day] = new Set();
      byDay[day].add(v.visitor_id);
    });

    // Fill in missing days
    const result: { date: string; visitors: number; pageviews: number }[] = [];
    const pvByDay: Record<string, number> = {};
    views.forEach((v) => {
      const day = v.created_at.split("T")[0];
      pvByDay[day] = (pvByDay[day] ?? 0) + 1;
    });

    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().split("T")[0];
      result.push({
        date: key,
        visitors: byDay[key]?.size ?? 0,
        pageviews: pvByDay[key] ?? 0,
      });
    }
    return result;
  }, [views, periodDays]);

  // Source breakdown
  const sources = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    views.forEach((v) => {
      const src = v.utm_source || "direct";
      if (!map[src]) map[src] = new Set();
      map[src].add(v.visitor_id);
    });
    return Object.entries(map)
      .map(([source, visitors]) => ({ source, visitors: visitors.size }))
      .sort((a, b) => b.visitors - a.visitors);
  }, [views]);

  // Page breakdown
  const pages = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    views.forEach((v) => {
      if (!map[v.page_path]) map[v.page_path] = new Set();
      map[v.page_path].add(v.visitor_id);
    });
    return Object.entries(map)
      .map(([page, visitors]) => ({ page, visitors: visitors.size }))
      .sort((a, b) => b.visitors - a.visitors);
  }, [views]);

  // Max for bar widths
  const maxSource = sources[0]?.visitors ?? 1;
  const maxPage = pages[0]?.visitors ?? 1;

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Analytics</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">Metricas de visitantes e engajamento em tempo real</p>
        </div>
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1 self-start">
          {(["7d", "14d", "30d"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                period === p ? "bg-[#1B5E3B] text-white" : "text-gray-400 hover:text-white"
              }`}>
              {p === "7d" ? "7d" : p === "14d" ? "14d" : "30d"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <MetricCard title="Visitantes" value={stats.visitors} icon={Eye} color="blue" subtitle={`Ultimos ${periodDays} dias`} />
        <MetricCard title="Pageviews" value={stats.pageviews} icon={FileText} color="green" subtitle="Total de visualizacoes" />
        <MetricCard title="Views/Visita" value={stats.viewsPerVisit} icon={MousePointerClick} color="purple" subtitle="Paginas por sessao" />
        <MetricCard title="Duracao" value={stats.avgDurationStr} icon={Clock} color="gold" subtitle="Tempo medio" />
        <MetricCard title="Bounce Rate" value={`${stats.bounceRate}%`} icon={TrendingDown} color="red" subtitle="Sessoes de 1 pagina" />
      </div>

      {/* Chart */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Visitantes por dia</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={timeSeries} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickFormatter={(val) => {
                const d = new Date(val);
                return `${d.getDate()}/${d.getMonth() + 1}`;
              }}
            />
            <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#f9fafb" }}
              labelFormatter={(val) => new Date(val).toLocaleDateString("pt-BR")}
            />
            <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2} dot={false} name="Visitantes" />
            <Line type="monotone" dataKey="pageviews" stroke="#1B5E3B" strokeWidth={2} dot={false} name="Pageviews" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Source + Page breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {/* Sources */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-white">Source</h2>
          </div>
          <div className="divide-y divide-gray-800/50">
            {sources.map((s) => (
              <div key={s.source} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/30">
                <div className="flex-1 relative">
                  <div
                    className="absolute inset-y-0 left-0 bg-blue-900/30 rounded"
                    style={{ width: `${(s.visitors / maxSource) * 100}%` }}
                  />
                  <span className="relative text-sm text-gray-200 font-medium pl-2">{s.source}</span>
                </div>
                <span className="text-sm font-bold text-white w-16 text-right">{s.visitors}</span>
              </div>
            ))}
            {sources.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">Sem dados</div>
            )}
          </div>
        </div>

        {/* Pages */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-white">Page</h2>
          </div>
          <div className="divide-y divide-gray-800/50">
            {pages.map((p) => (
              <div key={p.page} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/30">
                <div className="flex-1 relative">
                  <div
                    className="absolute inset-y-0 left-0 bg-green-900/30 rounded"
                    style={{ width: `${(p.visitors / maxPage) * 100}%` }}
                  />
                  <span className="relative text-sm text-gray-200 font-medium pl-2">{p.page}</span>
                </div>
                <span className="text-sm font-bold text-white w-16 text-right">{p.visitors}</span>
              </div>
            ))}
            {pages.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">Sem dados</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
