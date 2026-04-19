import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/crm/supabase";
import { Loader2, TrendingUp, MousePointerClick, Eye, LogOut, Timer } from "lucide-react";

type FunnelDaily = {
  day: string;
  sessions: number;
  viewed_recursos: number;
  viewed_como_funciona: number;
  viewed_depoimentos: number;
  viewed_precos: number;
  any_cta_click: number;
  conversions: number;
};

type SectionDwell = {
  section: string;
  views: number;
  unique_sessions: number;
  avg_dwell_ms: number | null;
  median_dwell_ms: number | null;
};

type ScrollBucket = { bucket: number; sessions: number };
type CtaRow = { cta_id: string; clicks: number; sessions: number };

const SECTION_ORDER = ["hero", "recursos", "como-funciona", "exemplo-pbl", "depoimentos", "precos", "cta-final"];

function fmtMs(ms: number | null) {
  if (!ms || ms <= 0) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function FunnelBar({ label, value, total, color = "bg-[#006D5B]" }: { label: string; value: number; total: number; color?: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-300 font-medium">{label}</span>
        <span className="text-white tabular-nums">
          {value.toLocaleString("pt-BR")}
          <span className="text-gray-500 ml-2">{pct}%</span>
        </span>
      </div>
      <div className="h-8 bg-gray-800/60 rounded overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500 flex items-center justify-end px-2`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function CrmLandingFunnel() {
  const [loading, setLoading] = useState(true);
  const [daily, setDaily] = useState<FunnelDaily[]>([]);
  const [dwell, setDwell] = useState<SectionDwell[]>([]);
  const [scrollBuckets, setScrollBuckets] = useState<ScrollBucket[]>([]);
  const [ctas, setCtas] = useState<CtaRow[]>([]);
  const [rangeDays, setRangeDays] = useState(7);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - rangeDays * 86400000).toISOString();

      // 1. funil diario (view)
      const d = await supabase.from("landing_funnel_daily").select("*").order("day", { ascending: false }).limit(60);

      // 2. dwell por secao
      const s = await supabase.from("landing_section_dwell").select("*");

      // 3. scroll depth — agrupa por marco
      const scrollRes = await supabase
        .from("landing_events")
        .select("session_id, scroll_pct")
        .eq("event_type", "scroll_depth")
        .gte("created_at", since);

      // 4. CTAs mais clicados
      const ctaRes = await supabase
        .from("landing_events")
        .select("session_id, cta_id")
        .eq("event_type", "cta_click")
        .gte("created_at", since);

      if (!alive) return;

      setDaily((d.data ?? []) as FunnelDaily[]);
      setDwell((s.data ?? []) as SectionDwell[]);

      // Bucketizar scroll
      const bucketMap = new Map<number, Set<string>>();
      [25, 50, 75, 100].forEach((b) => bucketMap.set(b, new Set()));
      for (const row of (scrollRes.data ?? []) as { session_id: string; scroll_pct: number }[]) {
        const set = bucketMap.get(row.scroll_pct);
        if (set) set.add(row.session_id);
      }
      setScrollBuckets([25, 50, 75, 100].map((b) => ({ bucket: b, sessions: bucketMap.get(b)?.size ?? 0 })));

      // Agrupar CTAs
      const ctaMap = new Map<string, { clicks: number; sessions: Set<string> }>();
      for (const row of (ctaRes.data ?? []) as { session_id: string; cta_id: string }[]) {
        const id = row.cta_id ?? "unknown";
        if (!ctaMap.has(id)) ctaMap.set(id, { clicks: 0, sessions: new Set() });
        const entry = ctaMap.get(id)!;
        entry.clicks += 1;
        entry.sessions.add(row.session_id);
      }
      const ctaArr: CtaRow[] = Array.from(ctaMap.entries())
        .map(([cta_id, v]) => ({ cta_id, clicks: v.clicks, sessions: v.sessions.size }))
        .sort((a, b) => b.clicks - a.clicks);
      setCtas(ctaArr);

      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [rangeDays]);

  const totals = useMemo(() => {
    const slice = daily.slice(0, rangeDays);
    return slice.reduce(
      (acc, d) => ({
        sessions: acc.sessions + d.sessions,
        viewed_recursos: acc.viewed_recursos + d.viewed_recursos,
        viewed_como_funciona: acc.viewed_como_funciona + d.viewed_como_funciona,
        viewed_depoimentos: acc.viewed_depoimentos + d.viewed_depoimentos,
        viewed_precos: acc.viewed_precos + d.viewed_precos,
        any_cta_click: acc.any_cta_click + d.any_cta_click,
        conversions: acc.conversions + d.conversions,
      }),
      { sessions: 0, viewed_recursos: 0, viewed_como_funciona: 0, viewed_depoimentos: 0, viewed_precos: 0, any_cta_click: 0, conversions: 0 },
    );
  }, [daily, rangeDays]);

  const dwellSorted = useMemo(() => {
    const idx: Record<string, number> = {};
    SECTION_ORDER.forEach((s, i) => (idx[s] = i));
    return [...dwell].sort((a, b) => (idx[a.section] ?? 99) - (idx[b.section] ?? 99));
  }, [dwell]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#006D5B]" />
      </div>
    );
  }

  const convRate = totals.sessions > 0 ? ((totals.conversions / totals.sessions) * 100).toFixed(2) : "0";
  const ctrRate = totals.sessions > 0 ? ((totals.any_cta_click / totals.sessions) * 100).toFixed(2) : "0";

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Funil da Landing</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            Onde visitantes param, onde clicam, onde convertem.
          </p>
        </div>
        <div className="flex gap-1 bg-gray-900/60 rounded-lg p-1 border border-gray-800 w-fit">
          {[1, 7, 30].map((d) => (
            <button
              key={d}
              onClick={() => setRangeDays(d)}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                rangeDays === d ? "bg-[#006D5B] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {d === 1 ? "24h" : `${d}d`}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <KpiCard icon={Eye} label="Sessões" value={totals.sessions.toLocaleString("pt-BR")} color="text-blue-400" />
        <KpiCard icon={MousePointerClick} label="Clicou CTA" value={`${ctrRate}%`} sub={`${totals.any_cta_click} cliques`} color="text-amber-400" />
        <KpiCard icon={TrendingUp} label="Conversões" value={totals.conversions.toLocaleString("pt-BR")} color="text-green-400" />
        <KpiCard icon={Timer} label="Taxa conversão" value={`${convRate}%`} color="text-[#C9A84C]" />
      </div>

      {/* Funil por seção */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
        <h2 className="text-sm md:text-base font-semibold text-white mb-4">Funil de seções ({rangeDays === 1 ? "últimas 24h" : `últimos ${rangeDays} dias`})</h2>
        <div className="space-y-3">
          <FunnelBar label="Sessões (page_view)" value={totals.sessions} total={totals.sessions} color="bg-blue-500/80" />
          <FunnelBar label="Viu: Recursos" value={totals.viewed_recursos} total={totals.sessions} color="bg-[#006D5B]" />
          <FunnelBar label="Viu: Como funciona" value={totals.viewed_como_funciona} total={totals.sessions} color="bg-[#006D5B]" />
          <FunnelBar label="Viu: Depoimentos" value={totals.viewed_depoimentos} total={totals.sessions} color="bg-[#006D5B]" />
          <FunnelBar label="Viu: Preços" value={totals.viewed_precos} total={totals.sessions} color="bg-[#005344]" />
          <FunnelBar label="Clicou em CTA" value={totals.any_cta_click} total={totals.sessions} color="bg-amber-500/80" />
          <FunnelBar label="Conversão" value={totals.conversions} total={totals.sessions} color="bg-green-500/80" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {/* Scroll depth */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
          <h2 className="text-sm md:text-base font-semibold text-white mb-1">Profundidade de scroll</h2>
          <p className="text-xs text-gray-500 mb-4">Quantos visitantes rolam até cada marco</p>
          <div className="space-y-3">
            {scrollBuckets.map((b) => (
              <FunnelBar
                key={b.bucket}
                label={`${b.bucket}% da página`}
                value={b.sessions}
                total={totals.sessions}
                color={b.bucket === 100 ? "bg-green-500/80" : b.bucket >= 75 ? "bg-[#006D5B]" : b.bucket >= 50 ? "bg-[#005344]" : "bg-blue-500/60"}
              />
            ))}
          </div>
        </div>

        {/* Tempo por seção */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
          <h2 className="text-sm md:text-base font-semibold text-white mb-1">Tempo dentro de cada seção</h2>
          <p className="text-xs text-gray-500 mb-4">Médiana é mais honesta que média (rejeita abas abertas)</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left py-2 font-medium">Seção</th>
                  <th className="text-right py-2 font-medium">Views</th>
                  <th className="text-right py-2 font-medium">Sessões</th>
                  <th className="text-right py-2 font-medium">Mediana</th>
                  <th className="text-right py-2 font-medium">Média</th>
                </tr>
              </thead>
              <tbody>
                {dwellSorted.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-600">
                      Aguardando eventos de seção (aparece após section_exit).
                    </td>
                  </tr>
                ) : (
                  dwellSorted.map((row) => (
                    <tr key={row.section} className="border-b border-gray-800/50">
                      <td className="py-2.5 text-white font-medium">{row.section}</td>
                      <td className="py-2.5 text-right text-gray-300 tabular-nums">{row.views}</td>
                      <td className="py-2.5 text-right text-gray-300 tabular-nums">{row.unique_sessions}</td>
                      <td className="py-2.5 text-right text-[#C9A84C] tabular-nums font-semibold">{fmtMs(row.median_dwell_ms)}</td>
                      <td className="py-2.5 text-right text-gray-400 tabular-nums">{fmtMs(row.avg_dwell_ms)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top CTAs */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
        <h2 className="text-sm md:text-base font-semibold text-white mb-1">CTAs mais clicados</h2>
        <p className="text-xs text-gray-500 mb-4">Ranking nos últimos {rangeDays === 1 ? "24h" : `${rangeDays} dias`}</p>
        {ctas.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-8">Sem cliques no período.</p>
        ) : (
          <div className="space-y-2">
            {ctas.slice(0, 10).map((c, i) => (
              <div key={c.cta_id} className="flex items-center gap-3 px-3 py-2 bg-gray-800/40 rounded hover:bg-gray-800/70 transition-colors">
                <span className="text-xs text-gray-500 w-6 tabular-nums">#{i + 1}</span>
                <span className="flex-1 text-sm text-white font-mono">{c.cta_id}</span>
                <span className="text-xs text-gray-400 tabular-nums">{c.sessions} sessões</span>
                <span className="text-sm font-bold text-[#C9A84C] tabular-nums w-16 text-right">{c.clicks}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Série histórica */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
        <h2 className="text-sm md:text-base font-semibold text-white mb-4">Histórico diário</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 font-medium">Dia</th>
                <th className="text-right py-2 font-medium">Sessões</th>
                <th className="text-right py-2 font-medium">Recursos</th>
                <th className="text-right py-2 font-medium">Preços</th>
                <th className="text-right py-2 font-medium">CTA</th>
                <th className="text-right py-2 font-medium">Conv.</th>
                <th className="text-right py-2 font-medium">Tx. Conv.</th>
              </tr>
            </thead>
            <tbody>
              {daily.slice(0, 30).map((d) => {
                const tx = d.sessions > 0 ? ((d.conversions / d.sessions) * 100).toFixed(1) : "0";
                return (
                  <tr key={d.day} className="border-b border-gray-800/50">
                    <td className="py-2 text-white">{new Date(d.day).toLocaleDateString("pt-BR")}</td>
                    <td className="py-2 text-right text-gray-300 tabular-nums">{d.sessions}</td>
                    <td className="py-2 text-right text-gray-400 tabular-nums">{d.viewed_recursos}</td>
                    <td className="py-2 text-right text-gray-400 tabular-nums">{d.viewed_precos}</td>
                    <td className="py-2 text-right text-amber-400 tabular-nums">{d.any_cta_click}</td>
                    <td className="py-2 text-right text-green-400 tabular-nums font-semibold">{d.conversions}</td>
                    <td className="py-2 text-right text-[#C9A84C] tabular-nums font-semibold">{tx}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color ?? "text-gray-400"}`} />
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-xl md:text-2xl font-bold ${color ?? "text-white"} tabular-nums`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}
