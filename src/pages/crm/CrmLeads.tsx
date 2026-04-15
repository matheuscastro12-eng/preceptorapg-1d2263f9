import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, TrendingUp, Users } from "lucide-react";
import { useLeads, useUtmBreakdown } from "@/hooks/useCrm";
import ExportButton from "@/components/crm/ExportButton";
import { LEAD_STATUS_LABELS, PRODUTO_COLORS } from "@/lib/crm/types";
import type { LeadStatus, Produto } from "@/lib/crm/types";

const STATUS_COLORS: Record<LeadStatus, string> = {
  visitor: "#6b7280", signup: "#3b82f6", active_trial: "#8b5cf6",
  engaged: "#f59e0b", subscriber: "#16a34a", churned: "#dc2626", win_back: "#ec4899",
};

export default function CrmLeads() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") ?? "1");
  const status = searchParams.get("status") as LeadStatus | undefined;
  const minScore = searchParams.get("minScore") ? parseInt(searchParams.get("minScore")!) : undefined;
  const search = searchParams.get("search") ?? undefined;

  const [searchInput, setSearchInput] = useState(search ?? "");
  const [statusFilter, setStatusFilter] = useState(status ?? "");
  const [scoreFilter, setScoreFilter] = useState(searchParams.get("minScore") ?? "");

  const { data, isLoading } = useLeads({ status: status || undefined, minScore, search, page });
  const { data: utmData } = useUtmBreakdown();

  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 50);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params: Record<string, string> = {};
    if (searchInput) params.search = searchInput;
    if (statusFilter) params.status = statusFilter;
    if (scoreFilter) params.minScore = scoreFilter;
    setSearchParams(params);
  };

  const goToPage = (p: number) => {
    const params = Object.fromEntries(searchParams.entries());
    params.page = String(p);
    setSearchParams(params);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="h-8 bg-gray-800 rounded w-48 animate-pulse mb-6" />
        <div className="h-96 bg-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Lead Intelligence</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">{total.toLocaleString("pt-BR")} leads no banco &middot; Score automatico</p>
        </div>
        <ExportButton
          data={leads as any[]}
          filename="leads"
          headers={{
            nome: "Nome",
            email: "Email",
            status: "Status",
            lead_score: "Score",
            fase_medica: "Fase medica",
            utm_source: "UTM Source",
            utm_medium: "UTM Medium",
            utm_campaign: "UTM Campanha",
            created_at: "Cadastro",
          }}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {(["visitor", "active_trial", "subscriber", "churned"] as LeadStatus[]).map((s) => {
          const count = leads.filter((l) => l.status === s).length;
          return (
            <div key={s} className="bg-gray-900/80 border border-gray-800 rounded-xl p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-500 mb-1">{LEAD_STATUS_LABELS[s]}</p>
              <p className="text-xl md:text-2xl font-bold" style={{ color: STATUS_COLORS[s] }}>{count}</p>
              <p className="text-[10px] md:text-xs text-gray-600 mt-0.5">nesta pagina</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        <div className="lg:col-span-2 bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-3 md:p-4 border-b border-gray-800">
            <form className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full" onSubmit={handleFilter}>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar por email ou nome..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-green-600"
                />
              </div>
              <div className="flex gap-2">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex-1 sm:flex-none px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-green-600">
                  <option value="">Status</option>
                  {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={scoreFilter} onChange={(e) => setScoreFilter(e.target.value)} className="flex-1 sm:flex-none px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-green-600">
                  <option value="">Score</option>
                  <option value="70">&ge; 70</option>
                  <option value="50">&ge; 50</option>
                  <option value="30">&ge; 30</option>
                </select>
                <button type="submit" className="px-4 py-2 bg-[#1B5E3B] text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">Filtrar</button>
              </div>
            </form>
          </div>

          {/* Empty state */}
          {!isLoading && leads.length === 0 && (
            <div className="py-16 px-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 mb-3">
                <Users className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">Nenhum lead encontrado</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {search || statusFilter || scoreFilter
                  ? "Ajuste os filtros ou limpe a busca pra ver todos."
                  : "Leads aparecerao aqui quando usuarios se cadastrarem no site."}
              </p>
            </div>
          )}

          {/* Mobile card view */}
          <div className="md:hidden divide-y divide-gray-800/50">
            {leads.map((lead) => (
              <div key={lead.id} className="p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{lead.nome ?? "—"}</p>
                    <p className="text-xs text-gray-500">{lead.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-10 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" style={{ width: `${lead.lead_score}%` }} />
                    </div>
                    <span className="font-bold text-white text-xs">{lead.lead_score}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: `${STATUS_COLORS[lead.status]}20`, color: STATUS_COLORS[lead.status], border: `1px solid ${STATUS_COLORS[lead.status]}40` }}>
                    {LEAD_STATUS_LABELS[lead.status]}
                  </span>
                  <span className="text-[10px] font-medium" style={{ color: PRODUTO_COLORS[lead.produto_interesse] }}>
                    {lead.produto_interesse.replace("preceptor", "P.")}
                  </span>
                  <span className="text-[10px] text-gray-500">{lead.utm_source ?? "direct"}</span>
                  <span className="text-[10px] text-gray-600 ml-auto">{lead.last_activity_at ? new Date(lead.last_activity_at).toLocaleDateString("pt-BR") : "—"}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {["Lead", "Score", "Status", "Produto", "Origem", "Ultima Atividade"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-white">{lead.nome ?? "—"}</p>
                      <p className="text-xs text-gray-500">{lead.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" style={{ width: `${lead.lead_score}%` }} />
                        </div>
                        <span className="font-bold text-white text-sm">{lead.lead_score}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: `${STATUS_COLORS[lead.status]}20`, color: STATUS_COLORS[lead.status], border: `1px solid ${STATUS_COLORS[lead.status]}40` }}>
                        {LEAD_STATUS_LABELS[lead.status]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-medium" style={{ color: PRODUTO_COLORS[lead.produto_interesse] }}>
                        {lead.produto_interesse.replace("preceptor", "P.")}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-gray-400">
                        {lead.utm_source ?? "direct"}
                        {lead.utm_campaign && <span className="text-gray-600"> / {lead.utm_campaign}</span>}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-gray-500">{lead.last_activity_at ? new Date(lead.last_activity_at).toLocaleDateString("pt-BR") : "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 md:p-4 border-t border-gray-800 flex items-center justify-between">
            <p className="text-[10px] md:text-xs text-gray-500">Mostrando {leads.length} de {total.toLocaleString("pt-BR")}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <button onClick={() => goToPage(page - 1)} className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs md:text-sm rounded-lg hover:bg-gray-700">&larr;</button>
              )}
              <span className="px-3 py-1.5 text-xs md:text-sm text-gray-500">{page}/{totalPages}</span>
              {page < totalPages && (
                <button onClick={() => goToPage(page + 1)} className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs md:text-sm rounded-lg hover:bg-gray-700">&rarr;</button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            Performance por Canal
          </h3>
          <div className="space-y-3">
            {(utmData ?? []).map((utm) => (
              <div key={utm.source} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 capitalize">{utm.source}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{utm.leads} leads</span>
                    <span className="text-xs font-semibold text-green-400">{utm.conversion_rate}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1B5E3B] rounded-full" style={{ width: `${Math.min(100, (utm.leads / (utmData?.[0]?.leads ?? 1)) * 100)}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Score medio: {utm.avg_score}</span>
                  <span className="text-green-600">{utm.subscribers} assinantes</span>
                </div>
              </div>
            ))}
            {(!utmData || utmData.length === 0) && (
              <p className="text-xs text-gray-500 text-center py-4">Nenhum dado de UTM disponivel ainda</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
