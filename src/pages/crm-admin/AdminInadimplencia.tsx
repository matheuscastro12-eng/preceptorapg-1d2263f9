import { useState } from "react";
import {
  AlertTriangle, DollarSign, CheckCircle, XCircle, Clock,
  Mail, Loader2, ChevronDown,
} from "lucide-react";
import MetricCard from "@/components/crm/MetricCard";
import PageHeader from "@/components/crm-admin/PageHeader";
import ExportButton from "@/components/crm/ExportButton";
import {
  useInadimplencias, useInadimplenciaStats,
  useUpdateInadimplencia, useMarkAsPerdido,
  INADIMPLENCIA_PLAN_LABELS,
} from "@/hooks/useInadimplencia";
import type { Inadimplencia } from "@/hooks/useInadimplencia";
import SendEmailModal from "@/components/crm-admin/SendEmailModal";

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  em_cobranca: { bg: "bg-red-900/30", text: "text-red-400", label: "Em Cobranca" },
  resolvido: { bg: "bg-green-900/30", text: "text-green-400", label: "Resolvido" },
  perdido: { bg: "bg-gray-900/30", text: "text-gray-400", label: "Perdido" },
};

type FilterStatus = "all" | "em_cobranca" | "resolvido" | "perdido";

export default function AdminInadimplencia() {
  const { data: items, isLoading } = useInadimplencias();
  const { data: stats } = useInadimplenciaStats();
  const updateMut = useUpdateInadimplencia();
  const markPerdido = useMarkAsPerdido();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [obsText, setObsText] = useState("");
  const [emailTarget, setEmailTarget] = useState<{ email: string; nome: string } | null>(null);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-red-400" />
      </div>
    );
  }

  const all = items ?? [];
  const filtered = filter === "all" ? all : all.filter(i => i.status === filter);
  const s = stats ?? { total: 0, emCobranca: 0, resolvidos: 0, perdidos: 0, valorTotalDevido: 0, valorRecuperado: 0 };

  const handleSaveObs = (item: Inadimplencia) => {
    updateMut.mutate({ id: item.id, data: { observacoes: obsText } });
    setExpandedId(null);
  };

  const diasAtraso = (dataOcorrencia: string) => {
    const diff = Date.now() - new Date(dataOcorrencia).getTime();
    return Math.max(0, Math.floor(diff / 86400000));
  };

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <PageHeader
          title="Inadimplencia"
          subtitle="Assinantes com pagamento atrasado ou falho (via EasyFlow webhook)"
        />
        <ExportButton
          data={(items ?? []) as any[]}
          filename="inadimplencia"
          headers={{
            email: "Email",
            nome: "Nome",
            plano: "Plano",
            valor_devido: "Valor devido",
            status: "Status",
            tentativas: "Tentativas",
            data_ocorrencia: "Data ocorrencia",
          }}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <MetricCard title="Em Cobranca" value={s.emCobranca} icon={AlertTriangle} color="red" subtitle="Pagamentos pendentes" />
        <MetricCard title="Valor Devido" value={s.valorTotalDevido} format="currency" icon={DollarSign} color="red" subtitle="Total em aberto" />
        <MetricCard title="Resolvidos" value={s.resolvidos} icon={CheckCircle} color="green" subtitle="Pagaram apos atraso" />
        <MetricCard title="Recuperado" value={s.valorRecuperado} format="currency" icon={DollarSign} color="green" subtitle="Valor recuperado" />
        <MetricCard title="Perdidos" value={s.perdidos} icon={XCircle} color="gold" subtitle="Desistiram" />
        <MetricCard title="Taxa Recuperacao" value={s.total > 0 ? `${Math.round((s.resolvidos / s.total) * 100)}%` : "—"} icon={CheckCircle} color="blue" subtitle="Resolvidos / Total" />
      </div>

      {/* Automation info */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 md:p-5">
        <h2 className="text-sm md:text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Mail className="w-4 h-4 text-red-400" />
          Automacao de Cobranca
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl border border-yellow-800/40 bg-yellow-900/10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-xs font-semibold text-yellow-400">D+1 Atraso</span>
            </div>
            <p className="text-xs text-gray-300 font-medium">Lembrete amigavel</p>
            <p className="text-[10px] text-gray-500 mt-1">Email automatico lembrando que o pagamento falhou. Oferece link para atualizar dados do cartao.</p>
          </div>
          <div className="p-3 rounded-xl border border-orange-800/40 bg-orange-900/10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-xs font-semibold text-orange-400">D+5 Atraso</span>
            </div>
            <p className="text-xs text-gray-300 font-medium">Aviso de suspensao</p>
            <p className="text-[10px] text-gray-500 mt-1">Email informando que o acesso sera suspenso em 48h se o pagamento nao for regularizado.</p>
          </div>
          <div className="p-3 rounded-xl border border-red-800/40 bg-red-900/10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-xs font-semibold text-red-400">D+10 Atraso</span>
            </div>
            <p className="text-xs text-gray-300 font-medium">Ultimo aviso + oferta</p>
            <p className="text-[10px] text-gray-500 mt-1">Email final com desconto de 20% para regularizar. Apos 15 dias, assinatura e cancelada automaticamente.</p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-3 md:p-4 border-b border-gray-800 flex gap-2 overflow-x-auto">
          {([
            { key: "all", label: `Todos (${all.length})` },
            { key: "em_cobranca", label: `Em Cobranca (${s.emCobranca})` },
            { key: "resolvido", label: `Resolvidos (${s.resolvidos})` },
            { key: "perdido", label: `Perdidos (${s.perdidos})` },
          ] as { key: FilterStatus; label: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                filter === f.key
                  ? f.key === "em_cobranca" ? "bg-red-600 text-white"
                  : f.key === "resolvido" ? "bg-green-600 text-white"
                  : f.key === "perdido" ? "bg-gray-600 text-white"
                  : "bg-[#C9A84C] text-gray-900"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-800/50">
          {filtered.map(item => {
            const sc = STATUS_COLORS[item.status] ?? STATUS_COLORS.em_cobranca;
            const dias = diasAtraso(item.data_ocorrencia);
            return (
              <div key={item.id} className="p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{item.nome}</p>
                    <p className="text-[10px] text-gray-500">{item.email}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.bg} ${sc.text}`}>
                    {sc.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-400">{INADIMPLENCIA_PLAN_LABELS[item.plano] ?? item.plano}</span>
                  <span className="text-red-400 font-bold">R$ {Number(item.valor_devido).toFixed(2)}</span>
                  {item.status === "em_cobranca" && (
                    <span className="text-orange-400">{dias}d atraso</span>
                  )}
                  <span className="text-gray-600">{item.tentativas}x falhou</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEmailTarget({ email: item.email, nome: item.nome })}
                    className="px-2 py-1 text-[10px] rounded bg-[#C9A84C]/20 text-[#C9A84C] hover:bg-[#C9A84C]/30"
                  >
                    <Mail className="w-3 h-3 inline mr-1" />Enviar email
                  </button>
                  {item.status === "em_cobranca" && (
                    <button
                      onClick={() => markPerdido.mutate(item.id)}
                      className="px-2 py-1 text-[10px] rounded bg-gray-800 text-gray-400 hover:bg-gray-700"
                    >
                      Perdido
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-700" />
              <p className="text-sm">Nenhum registro de inadimplencia</p>
              <p className="text-xs mt-1">Dados chegam automaticamente via webhook do EasyFlow</p>
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-800">
                {["Cliente", "Plano", "Valor", "Status", "Dias Atraso", "Tentativas", "Ultimo Evento", "Data", "Acoes"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filtered.map(item => {
                const sc = STATUS_COLORS[item.status] ?? STATUS_COLORS.em_cobranca;
                const dias = diasAtraso(item.data_ocorrencia);
                const isExpanded = expandedId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-gray-800/30 transition-colors group">
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-white">{item.nome}</p>
                      <p className="text-xs text-gray-500">{item.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-gray-300">{INADIMPLENCIA_PLAN_LABELS[item.plano] ?? item.plano}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-bold text-red-400">R$ {Number(item.valor_devido).toFixed(2)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {item.status === "em_cobranca" ? (
                        <span className={`text-sm font-medium ${dias >= 10 ? "text-red-400" : dias >= 5 ? "text-orange-400" : "text-yellow-400"}`}>
                          {dias}d
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-300">{item.tentativas}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-gray-500 capitalize">{(item.ultimo_evento ?? "—").replace("subscriptionrecurrence.", "")}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-gray-500">{new Date(item.data_ocorrencia).toLocaleDateString("pt-BR")}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEmailTarget({ email: item.email, nome: item.nome })}
                          className="p-1.5 rounded text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-colors"
                          title="Enviar email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        {item.status === "em_cobranca" && (
                          <button
                            onClick={() => markPerdido.mutate(item.id)}
                            className="px-2 py-1 text-xs rounded bg-gray-800 text-gray-400 hover:bg-red-900/50 hover:text-red-400 transition-colors"
                          >
                            Perdido
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setExpandedId(isExpanded ? null : item.id);
                            setObsText(item.observacoes ?? "");
                          }}
                          className="p-1 text-gray-600 hover:text-gray-300"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                    <p>Nenhum registro de inadimplencia</p>
                    <p className="text-xs mt-1">Dados chegam automaticamente via webhook do EasyFlow</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Expanded observation row */}
        {expandedId && (
          <div className="p-4 border-t border-gray-800 bg-gray-800/30">
            <label className="text-xs text-gray-400 mb-1 block">Observacoes</label>
            <textarea
              value={obsText}
              onChange={e => setObsText(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#C9A84C] resize-none"
              rows={2}
              placeholder="Adicionar observacao..."
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleSaveObs(filtered.find(i => i.id === expandedId)!)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#C9A84C] text-gray-900 hover:bg-yellow-500"
              >
                Salvar
              </button>
              <button
                onClick={() => setExpandedId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-400 hover:bg-gray-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Send Email Modal */}
      {emailTarget && (
        <SendEmailModal
          to={emailTarget.email}
          nome={emailTarget.nome}
          onClose={() => setEmailTarget(null)}
        />
      )}
    </div>
  );
}
