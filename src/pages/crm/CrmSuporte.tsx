import { useEffect, useState, useCallback, useMemo } from "react";
import {
  MessageCircle, Lightbulb, Heart, Star, Loader2, RefreshCw,
  Sparkles, TrendingUp, TrendingDown, Minus, Mail, Filter, AlertCircle,
} from "lucide-react";
import { supabase as supabaseCrm } from "@/lib/crm/supabase";

type FeedbackRow = {
  id: string;
  user_id: string;
  category: string;
  title: string | null;
  content: string;
  page_url: string | null;
  status: string;
  created_at: string;
};

type NpsRow = {
  id: string;
  user_id: string;
  score: number;
  category: "promoter" | "passive" | "detractor";
  comment: string | null;
  created_at: string;
};

type CsatRow = {
  id: string;
  user_id: string;
  conversation_id: string | null;
  rating: number;
  comment: string | null;
  resolved: boolean | null;
  created_at: string;
};

type Theme = {
  theme: string;
  mentions: number;
  category: string;
  sentiment: "positive" | "neutral" | "negative" | "critical";
  quotes: string[];
};

type Summary = {
  id: string;
  executive_summary: string;
  top_themes: Theme[];
  total_feedbacks: number;
  generated_at: string;
  detailed_summary: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "Geral",
  bug: "Bug",
  improvement: "Melhoria",
  feature_request: "Nova feature",
  ui_ux: "UI/UX",
  content: "Conteúdo",
  performance: "Performance",
  other: "Outro",
};

const CATEGORY_COLORS: Record<string, string> = {
  bug: "bg-red-900/30 text-red-400 border-red-800/50",
  improvement: "bg-blue-900/30 text-blue-400 border-blue-800/50",
  feature_request: "bg-purple-900/30 text-purple-400 border-purple-800/50",
  ui_ux: "bg-pink-900/30 text-pink-400 border-pink-800/50",
  content: "bg-amber-900/30 text-amber-400 border-amber-800/50",
  performance: "bg-orange-900/30 text-orange-400 border-orange-800/50",
  general: "bg-gray-800 text-gray-400 border-gray-700",
  other: "bg-gray-800 text-gray-400 border-gray-700",
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "text-green-400 bg-green-900/20",
  neutral: "text-gray-400 bg-gray-800/60",
  negative: "text-amber-400 bg-amber-900/20",
  critical: "text-red-400 bg-red-900/20",
};

export default function CrmSuporte() {
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([]);
  const [nps, setNps] = useState<NpsRow[]>([]);
  const [csat, setCsat] = useState<CsatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - periodDays * 86_400_000).toISOString();

    const [fbRes, npsRes, csatRes] = await Promise.all([
      (supabaseCrm.from("support_feedback" as any) as any)
        .select("id, user_id, category, title, content, page_url, status, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(200),
      (supabaseCrm.from("nps_responses" as any) as any)
        .select("id, user_id, score, category, comment, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500),
      (supabaseCrm.from("csat_responses" as any) as any)
        .select("id, user_id, conversation_id, rating, comment, resolved, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    setFeedbacks((fbRes.data as FeedbackRow[]) ?? []);
    setNps((npsRes.data as NpsRow[]) ?? []);
    setCsat((csatRes.data as CsatRow[]) ?? []);
    setLoading(false);
  }, [periodDays]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute NPS and CSAT metrics
  const npsMetrics = useMemo(() => {
    const total = nps.length;
    if (total === 0) return { score: 0, promoters: 0, passives: 0, detractors: 0, total: 0 };
    const promoters = nps.filter((n) => n.category === "promoter").length;
    const passives = nps.filter((n) => n.category === "passive").length;
    const detractors = nps.filter((n) => n.category === "detractor").length;
    const score = Math.round(((promoters - detractors) / total) * 100);
    return { score, promoters, passives, detractors, total };
  }, [nps]);

  const csatMetrics = useMemo(() => {
    const total = csat.length;
    if (total === 0) return { avg: 0, satisfied: 0, resolved: 0, total: 0 };
    const avg = csat.reduce((s, c) => s + c.rating, 0) / total;
    const satisfied = csat.filter((c) => c.rating >= 4).length;
    const resolved = csat.filter((c) => c.resolved === true).length;
    return { avg: Math.round(avg * 10) / 10, satisfied, resolved, total };
  }, [csat]);

  const filteredFeedbacks = useMemo(() => {
    if (categoryFilter === "all") return feedbacks;
    return feedbacks.filter((f) => f.category === categoryFilter);
  }, [feedbacks, categoryFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    feedbacks.forEach((f) => {
      counts[f.category] = (counts[f.category] ?? 0) + 1;
    });
    return counts;
  }, [feedbacks]);

  const generateSummary = useCallback(
    async (refresh = false) => {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        const { data: session } = await supabaseCrm.auth.getSession();
        const token = session?.session?.access_token;

        const url = new URL(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-feedback-summary`
        );
        url.searchParams.set("days", periodDays.toString());
        if (refresh) url.searchParams.set("refresh", "1");

        const resp = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await resp.json();
        if (!resp.ok) throw new Error(data?.error ?? "Erro ao gerar resumo");

        const summaryRaw = data.summary;
        let themes: Theme[] = [];
        if (summaryRaw?.detailed_summary) {
          try {
            const parsed = JSON.parse(summaryRaw.detailed_summary);
            themes = parsed.top_themes ?? [];
          } catch {
            themes = summaryRaw.top_themes ?? [];
          }
        } else {
          themes = summaryRaw?.top_themes ?? [];
        }

        setSummary({
          id: summaryRaw.id,
          executive_summary: summaryRaw.executive_summary,
          top_themes: themes,
          total_feedbacks: summaryRaw.total_feedbacks,
          generated_at: summaryRaw.generated_at,
          detailed_summary: summaryRaw.detailed_summary,
        });
      } catch (e) {
        setSummaryError(e instanceof Error ? e.message : "Erro ao gerar resumo");
      } finally {
        setSummaryLoading(false);
      }
    },
    [periodDays]
  );

  const npsScoreColor =
    npsMetrics.score >= 50
      ? "text-green-400"
      : npsMetrics.score >= 0
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Suporte &amp; Feedback</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-0.5">NPS, CSAT, feedbacks e resumo de IA dos pedidos dos usuários</p>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Filter className="w-3.5 h-3.5" />
          <span>Período:</span>
        </div>
        <div className="flex gap-1">
          {[7, 30, 90, 180].map((d) => (
            <button
              key={d}
              onClick={() => setPeriodDays(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                periodDays === d
                  ? "bg-[#C9A84C] text-gray-900"
                  : "bg-gray-800/60 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              {d === 7 ? "7 dias" : d === 30 ? "30 dias" : d === 90 ? "3 meses" : "6 meses"}
            </button>
          ))}
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="ml-auto px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-800/60 text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* NPS */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">NPS Score</p>
            <Heart className="w-4 h-4 text-[#C9A84C]" />
          </div>
          <p className={`text-3xl font-bold ${npsScoreColor}`}>
            {loading ? "--" : npsMetrics.score}
          </p>
          <div className="flex items-center gap-3 mt-2 text-[11px]">
            <span className="text-green-400">🟢 {npsMetrics.promoters}</span>
            <span className="text-gray-400">🟡 {npsMetrics.passives}</span>
            <span className="text-red-400">🔴 {npsMetrics.detractors}</span>
          </div>
          <p className="text-[10px] text-gray-600 mt-1">{npsMetrics.total} respostas</p>
        </div>

        {/* CSAT */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">CSAT Médio</p>
            <Star className="w-4 h-4 text-[#C9A84C] fill-[#C9A84C]" />
          </div>
          <p className="text-3xl font-bold text-white">
            {loading ? "--" : csatMetrics.avg.toFixed(1)}
            <span className="text-lg text-gray-500 ml-1">/ 5</span>
          </p>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-gray-400">
            <span>
              {csatMetrics.satisfied} satisfeitos · {csatMetrics.resolved} resolvidos
            </span>
          </div>
          <p className="text-[10px] text-gray-600 mt-1">{csatMetrics.total} avaliações</p>
        </div>

        {/* Feedbacks */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Feedbacks</p>
            <Lightbulb className="w-4 h-4 text-[#C9A84C]" />
          </div>
          <p className="text-3xl font-bold text-white">
            {loading ? "--" : feedbacks.length}
          </p>
          <p className="text-[10px] text-gray-600 mt-2">sugestões recebidas</p>
        </div>

        {/* Atendimentos */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Atendimentos IA</p>
            <MessageCircle className="w-4 h-4 text-[#C9A84C]" />
          </div>
          <p className="text-3xl font-bold text-white">
            {loading ? "--" : csatMetrics.total}
          </p>
          <p className="text-[10px] text-gray-600 mt-2">
            {csatMetrics.total > 0
              ? `${Math.round((csatMetrics.resolved / csatMetrics.total) * 100)}% resolvidos pela IA`
              : "sem atendimentos no período"}
          </p>
        </div>
      </div>

      {/* AI Summary Section */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-900/80 border border-[#C9A84C]/30 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#C9A84C]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Manrope']">
                Resumo Inteligente dos Feedbacks
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Análise gerada por IA (Gemini) dos temas mais pedidos
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {!summary && (
              <button
                onClick={() => generateSummary(false)}
                disabled={summaryLoading || feedbacks.length === 0}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#C9A84C] text-gray-900 hover:bg-[#b8943d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {summaryLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Gerar resumo
                  </>
                )}
              </button>
            )}
            {summary && (
              <button
                onClick={() => generateSummary(true)}
                disabled={summaryLoading}
                className="px-3 py-2 text-xs font-medium rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${summaryLoading ? "animate-spin" : ""}`} />
                Regenerar
              </button>
            )}
          </div>
        </div>

        {summaryError && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800/40 rounded-lg text-xs text-red-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{summaryError}</span>
          </div>
        )}

        {!summary && !summaryLoading && (
          <div className="text-center py-10 text-gray-500 text-sm">
            {feedbacks.length === 0
              ? "Nenhum feedback no período selecionado."
              : `Clique em "Gerar resumo" para analisar os ${feedbacks.length} feedbacks com IA.`}
          </div>
        )}

        {summary && (
          <div className="space-y-5">
            {/* Executive summary */}
            <div>
              <p className="text-[11px] font-semibold text-[#C9A84C] uppercase tracking-wider mb-2">
                Resumo Executivo
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                {summary.executive_summary}
              </p>
              <p className="text-[10px] text-gray-600 mt-2">
                Gerado em {new Date(summary.generated_at).toLocaleString("pt-BR")} ·{" "}
                {summary.total_feedbacks} feedbacks analisados
              </p>
            </div>

            {/* Top themes */}
            {summary.top_themes && summary.top_themes.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-[#C9A84C] uppercase tracking-wider mb-3">
                  Top Temas Pedidos
                </p>
                <div className="space-y-2">
                  {summary.top_themes.map((t, i) => (
                    <div
                      key={i}
                      className="bg-gray-800/40 border border-gray-800 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#C9A84C]">#{i + 1}</span>
                          <span className="text-sm font-semibold text-white">{t.theme}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              CATEGORY_COLORS[t.category] ?? CATEGORY_COLORS.general
                            }`}
                          >
                            {CATEGORY_LABELS[t.category] ?? t.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              SENTIMENT_COLORS[t.sentiment] ?? SENTIMENT_COLORS.neutral
                            }`}
                          >
                            {t.sentiment === "positive" && "😊"}
                            {t.sentiment === "neutral" && "😐"}
                            {t.sentiment === "negative" && "😕"}
                            {t.sentiment === "critical" && "😠"} {t.sentiment}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-gray-400 shrink-0">
                          {t.mentions}x
                        </span>
                      </div>
                      {t.quotes && t.quotes.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {t.quotes.map((q, qi) => (
                            <p
                              key={qi}
                              className="text-[11px] text-gray-400 italic border-l-2 border-gray-700 pl-2"
                            >
                              "{q}"
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations & Quick Wins */}
            {summary.detailed_summary && (() => {
              try {
                const parsed = JSON.parse(summary.detailed_summary);
                return (
                  <div className="grid md:grid-cols-2 gap-4">
                    {parsed.recommended_actions?.length > 0 && (
                      <div className="bg-gray-800/40 border border-gray-800 rounded-lg p-4">
                        <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <TrendingUp className="w-3 h-3" />
                          Ações Recomendadas
                        </p>
                        <ul className="space-y-1.5">
                          {parsed.recommended_actions.map((a: string, i: number) => (
                            <li key={i} className="text-xs text-gray-300 leading-relaxed flex gap-1.5">
                              <span className="text-blue-400">•</span>
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {parsed.quick_wins?.length > 0 && (
                      <div className="bg-gray-800/40 border border-gray-800 rounded-lg p-4">
                        <p className="text-[11px] font-semibold text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" />
                          Quick Wins
                        </p>
                        <ul className="space-y-1.5">
                          {parsed.quick_wins.map((a: string, i: number) => (
                            <li key={i} className="text-xs text-gray-300 leading-relaxed flex gap-1.5">
                              <span className="text-green-400">•</span>
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              } catch {
                return null;
              }
            })()}
          </div>
        )}
      </div>

      {/* Feedbacks + NPS/CSAT lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feedback list */}
        <div className="lg:col-span-2 bg-gray-900/80 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#C9A84C]" />
              <h2 className="text-sm font-semibold text-white font-['Manrope']">
                Feedbacks Recebidos
              </h2>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-gray-300 focus:outline-none focus:border-[#C9A84C]"
            >
              <option value="all">Todas as categorias ({feedbacks.length})</option>
              {Object.entries(CATEGORY_LABELS).map(([k, l]) => {
                const count = categoryCounts[k] ?? 0;
                if (count === 0) return null;
                return (
                  <option key={k} value={k}>
                    {l} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {loading ? (
            <div className="py-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10">
              Nenhum feedback recebido neste período.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto crm-scrollbar pr-1">
              {filteredFeedbacks.map((f) => (
                <div
                  key={f.id}
                  className="bg-gray-800/30 border border-gray-800 rounded-lg p-3.5 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          CATEGORY_COLORS[f.category] ?? CATEGORY_COLORS.general
                        }`}
                      >
                        {CATEGORY_LABELS[f.category] ?? f.category}
                      </span>
                      {f.title && (
                        <span className="text-xs font-semibold text-white">{f.title}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-600 shrink-0">
                      {new Date(f.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">
                    {f.content}
                  </p>
                  {f.page_url && (
                    <p className="text-[10px] text-gray-600 mt-1.5 font-mono">{f.page_url}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NPS + CSAT comments side panel */}
        <div className="space-y-6">
          {/* NPS Comments */}
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4 text-[#C9A84C]" />
              <h2 className="text-sm font-semibold text-white font-['Manrope']">
                NPS Comentários
              </h2>
            </div>
            {nps.filter((n) => n.comment).length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">Sem comentários no período.</p>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto crm-scrollbar pr-1">
                {nps
                  .filter((n) => n.comment)
                  .slice(0, 30)
                  .map((n) => (
                    <div
                      key={n.id}
                      className="bg-gray-800/30 border border-gray-800 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            n.category === "promoter"
                              ? "bg-green-900/40 text-green-400"
                              : n.category === "passive"
                              ? "bg-amber-900/40 text-amber-400"
                              : "bg-red-900/40 text-red-400"
                          }`}
                        >
                          {n.score}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          {new Date(n.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed italic">
                        "{n.comment}"
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* CSAT Comments */}
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-[#C9A84C] fill-[#C9A84C]" />
              <h2 className="text-sm font-semibold text-white font-['Manrope']">
                CSAT Comentários
              </h2>
            </div>
            {csat.filter((c) => c.comment).length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">Sem comentários no período.</p>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto crm-scrollbar pr-1">
                {csat
                  .filter((c) => c.comment)
                  .slice(0, 30)
                  .map((c) => (
                    <div
                      key={c.id}
                      className="bg-gray-800/30 border border-gray-800 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((r) => (
                            <Star
                              key={r}
                              className={`w-3 h-3 ${
                                c.rating >= r
                                  ? "text-[#C9A84C] fill-[#C9A84C]"
                                  : "text-gray-700"
                              }`}
                            />
                          ))}
                        </div>
                        {c.resolved === true && (
                          <span className="text-[10px] text-green-400">✓ resolvido</span>
                        )}
                        {c.resolved === false && (
                          <span className="text-[10px] text-amber-400">↑ escalado</span>
                        )}
                        <span className="text-[10px] text-gray-600 ml-auto">
                          {new Date(c.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed italic">
                        "{c.comment}"
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Escalation info */}
      <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-xl p-4 flex items-start gap-3">
        <Mail className="w-4 h-4 text-[#C9A84C] shrink-0 mt-0.5" />
        <div className="text-xs text-gray-400 leading-relaxed">
          Quando a IA não resolve um problema, o usuário é direcionado para{" "}
          <strong className="text-[#C9A84C]">matheus@ospreceptores.com</strong>. Casos escalados
          aparecem acima com o badge <span className="text-amber-400">↑ escalado</span>.
        </div>
      </div>
    </div>
  );
}
