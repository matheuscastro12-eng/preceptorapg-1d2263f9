import { useState } from "react";
import { Link } from "react-router-dom";
import { useAutomationsPerformance, useRecentAutomations } from "@/hooks/useCrm";
import { AUTOMATION_TRIGGER_LABELS, type AutomationTrigger } from "@/lib/crm/types";
import { Zap, Mail, MessageSquare, Bell, Smartphone, CheckCircle, Send, Loader2, FileText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-automations`;
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  email: Mail, whatsapp: MessageSquare, push: Bell, in_app: Smartphone,
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-gray-400", sent: "text-blue-400", delivered: "text-blue-300",
  opened: "text-yellow-400", clicked: "text-green-400", failed: "text-red-400", bounced: "text-orange-400",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente", sent: "Enviado", delivered: "Entregue",
  opened: "Aberto", clicked: "Clicado", failed: "Falhou", bounced: "Bounce",
};

export default function CrmAutomations() {
  const { data: performance, isLoading } = useAutomationsPerformance();
  const { data: automationsData } = useRecentAutomations({ pageSize: 100 });
  const queryClient = useQueryClient();
  const [sendingId, setSendingId] = useState<string | null>(null);

  const handleSend = async (automationId: string, triggerName: string) => {
    setSendingId(automationId);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: API_KEY, Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({ automation_id: automationId }),
      });
      const data = await res.json();
      if (data.success && data.sent > 0) {
        toast.success(`Email de ${triggerName} enviado`);
      } else if (data.skipped > 0) {
        toast.error("Sem email valido ou canal nao suportado");
      } else if (data.failed > 0) {
        toast.error("Falha no envio — ver logs");
      } else {
        toast.error(data.error ?? "Nao foi possivel enviar");
      }
      queryClient.invalidateQueries({ queryKey: ["crm", "automations"] });
    } catch (err) {
      toast.error("Erro ao conectar");
    } finally {
      setSendingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-48" />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-gray-800 rounded-xl" />)}
        </div>
        <div className="h-96 bg-gray-800 rounded-xl" />
      </div>
    );
  }

  const perf = performance ?? [];
  const automations = automationsData?.automations ?? [];
  const totalAuto = automationsData?.total ?? 0;

  const globalStats = perf.reduce(
    (acc, p) => ({
      sent: acc.sent + p.total_sent, delivered: acc.delivered + p.delivered,
      opened: acc.opened + p.opened, clicked: acc.clicked + p.clicked, failed: acc.failed + p.failed,
    }),
    { sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 }
  );

  const globalOpenRate = globalStats.delivered > 0 ? Math.round((globalStats.opened / globalStats.delivered) * 1000) / 10 : 0;
  const globalClickRate = globalStats.opened > 0 ? Math.round((globalStats.clicked / globalStats.opened) * 1000) / 10 : 0;

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Automacoes</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">Envio manual — aperte "Enviar" na linha desejada</p>
        </div>
        <Link
          to="/admin/crm-mkt/templates-email"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors self-start"
        >
          <FileText className="w-3.5 h-3.5" />
          Editar templates
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {[
          { label: "Total Enviadas", value: globalStats.sent, color: "text-white" },
          { label: "Entregues", value: globalStats.delivered, color: "text-blue-400" },
          { label: "Abertas", value: globalStats.opened, color: "text-yellow-400" },
          { label: "Clicadas", value: globalStats.clicked, color: "text-green-400" },
          { label: "Falharam", value: globalStats.failed, color: "text-red-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value.toLocaleString("pt-BR")}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-yellow-900/30 rounded-xl"><Mail className="w-5 h-5 text-yellow-400" /></div>
          <div>
            <p className="text-2xl font-bold text-yellow-400">{globalOpenRate}%</p>
            <p className="text-xs text-gray-500">Taxa de Abertura Global</p>
            <p className="text-xs text-gray-600 mt-0.5">Benchmark: 20-30% para educacao</p>
          </div>
        </div>
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-green-900/30 rounded-xl"><CheckCircle className="w-5 h-5 text-green-400" /></div>
          <div>
            <p className="text-2xl font-bold text-green-400">{globalClickRate}%</p>
            <p className="text-xs text-gray-500">Taxa de Clique Global</p>
            <p className="text-xs text-gray-600 mt-0.5">Benchmark: 3-5% para educacao</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-3 md:p-4 border-b border-gray-800">
          <h2 className="text-sm md:text-base font-semibold text-white">Performance por Automacao (30 dias)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-800">
                {["Automacao", "Canal", "Enviadas", "Abertura", "Clique", "Falhas"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {perf.map((p) => {
                const ChannelIcon = CHANNEL_ICONS[p.automation_type] ?? Mail;
                return (
                  <tr key={`${p.trigger_name}-${p.automation_type}`} className="hover:bg-gray-800/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="text-sm font-medium text-white">{AUTOMATION_TRIGGER_LABELS[p.trigger_name as AutomationTrigger] ?? p.trigger_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <ChannelIcon className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-400 capitalize">{p.automation_type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4"><span className="text-sm text-white font-medium">{p.total_sent.toLocaleString("pt-BR")}</span></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${Math.min(100, p.open_rate_pct)}%` }} />
                        </div>
                        <span className={`text-xs font-semibold ${p.open_rate_pct >= 25 ? "text-green-400" : p.open_rate_pct >= 15 ? "text-yellow-400" : "text-red-400"}`}>{p.open_rate_pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold ${p.click_rate_pct >= 5 ? "text-green-400" : p.click_rate_pct >= 2 ? "text-yellow-400" : "text-gray-400"}`}>{p.click_rate_pct}%</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs ${p.failed > 0 ? "text-red-400" : "text-gray-600"}`}>{p.failed}</span>
                    </td>
                  </tr>
                );
              })}
              {perf.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <Zap className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                    <p>Nenhuma automacao registrada ainda</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-3 md:p-4 border-b border-gray-800">
          <h2 className="text-sm md:text-base font-semibold text-white">Log de Automacoes Recentes</h2>
          <p className="text-xs text-gray-500 mt-0.5">{totalAuto.toLocaleString("pt-BR")} no total</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-800">
                {["Tipo", "Canal", "Status", "Motivo", "Produto", "Quando", "Acao"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {automations.map((auto) => {
                const ChannelIcon = CHANNEL_ICONS[auto.channel] ?? Mail;
                return (
                  <tr key={auto.id} className="hover:bg-gray-800/30">
                    <td className="py-2.5 px-4"><span className="text-sm text-white">{AUTOMATION_TRIGGER_LABELS[auto.trigger_name] ?? auto.trigger_name}</span></td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <ChannelIcon className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500 capitalize">{auto.channel}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`text-xs font-medium ${STATUS_COLORS[auto.status] ?? "text-gray-400"}`}>{STATUS_LABELS[auto.status] ?? auto.status}</span>
                    </td>
                    <td className="py-2.5 px-4"><span className="text-xs text-gray-500 truncate max-w-xs block">{auto.trigger_reason ?? "—"}</span></td>
                    <td className="py-2.5 px-4"><span className="text-xs text-gray-600 capitalize">{auto.produto.replace("preceptor", "P.")}</span></td>
                    <td className="py-2.5 px-4">
                      <span className="text-xs text-gray-600">{new Date(auto.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      {auto.status === "pending" && auto.channel === "email" ? (
                        <button
                          onClick={() => handleSend(auto.id, AUTOMATION_TRIGGER_LABELS[auto.trigger_name] ?? auto.trigger_name)}
                          disabled={sendingId === auto.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-900/40 text-green-300 hover:bg-green-800/60 disabled:opacity-50 transition-colors"
                        >
                          {sendingId === auto.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                          Enviar
                        </button>
                      ) : (
                        <span className="text-xs text-gray-700">—</span>
                      )}
                    </td>
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
