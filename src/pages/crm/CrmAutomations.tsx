import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAutomationsPerformance, useRecentAutomations } from "@/hooks/useCrm";
import { AUTOMATION_TRIGGER_LABELS, type AutomationTrigger } from "@/lib/crm/types";
import {
  Zap, Mail, MessageSquare, Bell, Smartphone, CheckCircle, Send, Loader2, FileText,
  ChevronDown, ChevronRight, Trash2, Search, Play, AlertCircle, X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/crm/supabase";

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

interface Template {
  trigger_name: string;
  label: string;
  auto_send: boolean;
}

export default function CrmAutomations() {
  const { data: performance, isLoading } = useAutomationsPerformance();
  const { data: automationsData } = useRecentAutomations({ pageSize: 500 });
  const queryClient = useQueryClient();
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [bulkBusy, setBulkBusy] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Envio manual / ad-hoc
  const [templates, setTemplates] = useState<Template[]>([]);
  const [adhocTemplate, setAdhocTemplate] = useState("");
  const [adhocEmail, setAdhocEmail] = useState("");
  const [adhocNome, setAdhocNome] = useState("");
  const [adhocSending, setAdhocSending] = useState(false);

  useEffect(() => {
    supabase.from("crm_email_templates").select("trigger_name, label, auto_send").order("label")
      .then(({ data, error }) => {
        if (error) {
          console.warn("[CrmAutomations] Falha ao carregar templates:", error.message);
          toast.error("Nao carregou templates: " + error.message);
          return;
        }
        setTemplates((data ?? []) as Template[]);
      });
  }, []);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["crm", "automations"] });

  const callApi = async (body: any) => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: API_KEY, Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const handleSend = async (automationId: string, triggerName: string) => {
    setSendingId(automationId);
    try {
      const data = await callApi({ automation_id: automationId });
      if (data.success && data.sent > 0) toast.success(`Email de ${triggerName} enviado`);
      else if (data.skipped > 0) toast.error("Sem email valido ou canal nao suportado");
      else if (data.failed > 0) toast.error("Falha no envio — ver logs");
      else toast.error(data.error ?? "Nao foi possivel enviar");
      invalidate();
    } catch { toast.error("Erro ao conectar"); }
    finally { setSendingId(null); }
  };

  const handleFlushAuto = async () => {
    setBulkBusy("flush_auto");
    try {
      const data = await callApi({ action: "flush_auto" });
      if (data.success) toast.success(`Enviados: ${data.sent}, Falhas: ${data.failed}, Pulados: ${data.skipped}`);
      else toast.error(data.error ?? "Erro");
      invalidate();
    } catch { toast.error("Erro ao conectar"); }
    finally { setBulkBusy(null); }
  };

  const handleAdhocSend = async () => {
    if (!adhocTemplate || !adhocEmail) {
      toast.error("Escolha template e email");
      return;
    }
    setAdhocSending(true);
    try {
      const data = await callApi({ action: "send_adhoc", template: adhocTemplate, user_email: adhocEmail.trim(), nome: adhocNome.trim() });
      if (data.success) {
        toast.success(`Email enviado pra ${adhocEmail}`);
        setAdhocEmail(""); setAdhocNome("");
        invalidate();
      } else {
        toast.error(data.error ?? "Falha no envio");
      }
    } catch { toast.error("Erro ao conectar"); }
    finally { setAdhocSending(false); }
  };

  const handleBulkClear = async (triggerName: string) => {
    if (!confirm(`Deletar TODAS pendentes de "${AUTOMATION_TRIGGER_LABELS[triggerName] ?? triggerName}"?`)) return;
    setBulkBusy(triggerName);
    try {
      const { error } = await supabase.from("crm_automations_log").delete().eq("trigger_name", triggerName).eq("status", "pending");
      if (error) toast.error(error.message);
      else { toast.success("Pendentes deletadas"); invalidate(); }
    } finally { setBulkBusy(null); }
  };

  const handleBulkMarkSent = async (triggerName: string) => {
    if (!confirm(`Marcar como "enviadas" (sem mandar email) todas pendentes de "${AUTOMATION_TRIGGER_LABELS[triggerName] ?? triggerName}"?`)) return;
    setBulkBusy(triggerName + "-mark");
    try {
      const { error } = await supabase.from("crm_automations_log")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("trigger_name", triggerName).eq("status", "pending");
      if (error) toast.error(error.message);
      else { toast.success("Marcadas como enviadas"); invalidate(); }
    } finally { setBulkBusy(null); }
  };

  const perf = performance ?? [];
  const automations = automationsData?.automations ?? [];

  // IMPORTANTE: todos os hooks tem que vir ANTES de qualquer early return
  // (regra do React — se nao, erro #310 "more hooks than previous render")
  const pendingByTrigger = useMemo(() => {
    const s = search.trim().toLowerCase();
    const filtered = automations.filter((a: any) => {
      if (a.status !== "pending") return false;
      if (!s) return true;
      const lead = Array.isArray(a.crm_leads) ? a.crm_leads[0] : a.crm_leads;
      const email = (lead?.email ?? a.metadata?.email ?? "").toLowerCase();
      const nome = (lead?.nome ?? a.metadata?.nome ?? "").toLowerCase();
      return email.includes(s) || nome.includes(s);
    });
    const groups: Record<string, any[]> = {};
    for (const a of filtered) {
      (groups[a.trigger_name] ||= []).push(a);
    }
    return groups;
  }, [automations, search]);

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

  const globalStats = perf.reduce(
    (acc, p) => ({
      sent: acc.sent + p.total_sent, delivered: acc.delivered + p.delivered,
      opened: acc.opened + p.opened, clicked: acc.clicked + p.clicked, failed: acc.failed + p.failed,
    }),
    { sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 }
  );

  const triggerNames = Object.keys(pendingByTrigger).sort((a, b) => pendingByTrigger[b].length - pendingByTrigger[a].length);

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Automacoes</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">Envie emails manualmente ou processe os templates marcados como automaticos</p>
        </div>
        <Link
          to="/admin/crm-mkt/templates-email"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors self-start"
        >
          <FileText className="w-3.5 h-3.5" /> Editar templates
        </Link>
      </div>

      {/* Envio manual + Disparar automaticos — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Send className="w-4 h-4 text-green-400" />
            <h2 className="text-sm font-bold text-white">Envio manual (ad-hoc)</h2>
          </div>
          <p className="text-[11px] text-gray-500 mb-4">Escolha template + destinatario e envie agora. Funciona mesmo sem linha pendente na fila.</p>
          <div className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1.5fr_auto] gap-2">
            <select
              value={adhocTemplate}
              onChange={(e) => setAdhocTemplate(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-green-500"
            >
              <option value="">Escolher template...</option>
              {templates.map((t) => (
                <option key={t.trigger_name} value={t.trigger_name}>{t.label}</option>
              ))}
            </select>
            <input
              type="email"
              value={adhocEmail}
              onChange={(e) => setAdhocEmail(e.target.value)}
              placeholder="email@destinatario.com"
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
            />
            <input
              type="text"
              value={adhocNome}
              onChange={(e) => setAdhocNome(e.target.value)}
              placeholder="Nome (opcional)"
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
            />
            <button
              onClick={handleAdhocSend}
              disabled={adhocSending || !adhocTemplate || !adhocEmail}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-500 disabled:opacity-50 transition-colors"
            >
              {adhocSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-950/60 to-gray-900 border border-green-900/40 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Play className="w-4 h-4 text-green-400" />
            <h2 className="text-sm font-bold text-white">Disparar automaticos</h2>
          </div>
          <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
            Processa todos os pendentes cujo template esta marcado como <strong>envio automatico</strong>.
          </p>
          <button
            onClick={handleFlushAuto}
            disabled={bulkBusy === "flush_auto"}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-500 disabled:opacity-50 transition-colors"
          >
            {bulkBusy === "flush_auto" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Disparar agora
          </button>
        </div>
      </div>

      {/* KPIs globais */}
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

      {/* Pendentes agrupados */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Pendentes na fila</h2>
            <span className="text-xs text-gray-500">
              {Object.values(pendingByTrigger).reduce((s, arr) => s + arr.length, 0)} total
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar email/nome..."
              className="pl-8 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white w-full sm:w-64 focus:outline-none focus:border-green-500"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-800/40">
          {triggerNames.length === 0 ? (
            <div className="p-10 text-center">
              <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">Nenhum pendente</p>
              <p className="text-xs text-gray-500 mt-0.5">{search ? "Nenhum resultado pra sua busca" : "Fila limpa"}</p>
            </div>
          ) : (
            triggerNames.map((tn) => {
              const items = pendingByTrigger[tn];
              const isExpanded = expanded[tn];
              const tpl = templates.find((t) => t.trigger_name === tn);
              return (
                <div key={tn}>
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/30">
                    <button
                      onClick={() => setExpanded({ ...expanded, [tn]: !isExpanded })}
                      className="flex-1 flex items-center gap-3 text-left"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white truncate">
                            {AUTOMATION_TRIGGER_LABELS[tn as AutomationTrigger] ?? tn}
                          </p>
                          {tpl && (
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              tpl.auto_send ? "bg-green-500/15 text-green-400" : "bg-gray-700/60 text-gray-400"
                            }`}>
                              {tpl.auto_send ? "Auto" : "Manual"}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        {items.length}
                      </span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleBulkMarkSent(tn)}
                        disabled={!!bulkBusy}
                        title="Marcar como enviado (sem enviar email)"
                        className="p-1.5 rounded text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50"
                      >
                        {bulkBusy === tn + "-mark" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleBulkClear(tn)}
                        disabled={!!bulkBusy}
                        title="Deletar todos pendentes deste tipo"
                        className="p-1.5 rounded text-gray-400 hover:bg-red-900/40 hover:text-red-300 disabled:opacity-50"
                      >
                        {bulkBusy === tn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-gray-950/50 border-t border-gray-800/40">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-gray-800/30">
                          {items.slice(0, 100).map((auto: any) => {
                            const lead = Array.isArray(auto.crm_leads) ? auto.crm_leads[0] : auto.crm_leads;
                            const email = lead?.email ?? (auto.metadata?.email as string | undefined);
                            const nome = lead?.nome ?? (auto.metadata?.nome as string | undefined);
                            const ChannelIcon = CHANNEL_ICONS[auto.channel] ?? Mail;
                            return (
                              <tr key={auto.id} className="hover:bg-gray-800/30">
                                <td className="py-2 pl-12 pr-4">
                                  {email ? (
                                    <div className="min-w-0">
                                      {nome && <p className="text-xs text-white truncate max-w-[260px]">{nome}</p>}
                                      <p className="text-[11px] text-gray-500 truncate max-w-[260px]">{email}</p>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-700">— (sem destinatario)</span>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-1">
                                    <ChannelIcon className="w-3 h-3 text-gray-500" />
                                    <span className="text-[11px] text-gray-500 capitalize">{auto.channel}</span>
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-[11px] text-gray-500">
                                  {new Date(auto.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                </td>
                                <td className="py-2 px-4 text-right">
                                  {auto.channel === "email" && email ? (
                                    <button
                                      onClick={() => handleSend(auto.id, AUTOMATION_TRIGGER_LABELS[auto.trigger_name] ?? auto.trigger_name)}
                                      disabled={sendingId === auto.id}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-green-900/40 text-green-300 hover:bg-green-800/60 disabled:opacity-50"
                                    >
                                      {sendingId === auto.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                      Enviar
                                    </button>
                                  ) : (
                                    <span className="text-[11px] text-gray-700">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {items.length > 100 && (
                        <p className="text-[11px] text-gray-600 text-center py-2">
                          Mostrando 100 de {items.length}. Use busca pra filtrar.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Performance table (histórico) */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-3 md:p-4 border-b border-gray-800">
          <h2 className="text-sm md:text-base font-semibold text-white">Performance por tipo (30 dias)</h2>
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
    </div>
  );
}
